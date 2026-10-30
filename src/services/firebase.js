// Firebase (Auth + Firestore med offline-cache). Utan nycklar i .env körs appen lokalt utan molnsynk.
import { initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged, signInAnonymously, signInWithEmailAndPassword, createUserWithEmailAndPassword, EmailAuthProvider, linkWithCredential, signOut } from 'firebase/auth'
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'

const e = import.meta.env
export const cloudEnabled = Boolean(e.VITE_FIREBASE_API_KEY && e.VITE_FIREBASE_PROJECT_ID)
export const firebaseConfig = cloudEnabled ? {
  apiKey: e.VITE_FIREBASE_API_KEY, authDomain: e.VITE_FIREBASE_AUTH_DOMAIN, projectId: e.VITE_FIREBASE_PROJECT_ID,
  storageBucket: e.VITE_FIREBASE_STORAGE_BUCKET, appId: e.VITE_FIREBASE_APP_ID
} : null
let auth = null, db = null
if (cloudEnabled) {
  const app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) })
}
export { auth, db, onAuthStateChanged }

// Väntar på inloggad användare; loggar in anonymt om ingen finns. null om det inte går (t.ex. offline första gången).
export function whenAuthed() {
  if (!cloudEnabled) return Promise.resolve(null)
  return new Promise((res) => {
    const un = onAuthStateChanged(auth, async (u) => {
      if (u) { un(); res(u) } else { try { await signInAnonymously(auth) } catch { un(); res(null) } }
    })
  })
}

// Uppgraderar anonymt konto till e-post (behåller datan). Finns kontot sedan förut loggas man in, annars skapas det.
export async function emailLogin(email, pw) {
  const u = auth.currentUser
  if (u && u.isAnonymous) {
    try { await linkWithCredential(u, EmailAuthProvider.credential(email, pw)); return }
    catch (err) { if (!['auth/email-already-in-use', 'auth/credential-already-in-use'].includes(err.code)) throw err }
  }
  try { await signInWithEmailAndPassword(auth, email, pw) }
  catch (err) {
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') await createUserWithEmailAndPassword(auth, email, pw)
    else throw err
  }
}
export const logout = () => signOut(auth)
