// Administratörens Firebase-klient. Körs i en SEPARAT app-instans ("admin") så att tränarens egna (anonyma) inloggning
// på samma enhet inte påverkas när en administratör loggar in.
import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore'
import { cloudEnabled, firebaseConfig } from '../services/firebase'

let client = null
function adminClient() {
  if (!cloudEnabled) throw new Error('Molnsynk är inte konfigurerad.')
  if (!client) {
    const app = getApps().some((a) => a.name === 'admin') ? getApp('admin') : initializeApp(firebaseConfig, 'admin')
    client = { auth: getAuth(app), db: getFirestore(app) }
  }
  return client
}

export const adminUser = () => new Promise((res) => { const un = onAuthStateChanged(adminClient().auth, (u) => { un(); res(u) }) })
export const adminSignIn = (email, pw) => signInWithEmailAndPassword(adminClient().auth, email, pw)
export const adminSignOut = () => signOut(adminClient().auth)
export async function isAdmin(uid) {
  try { return (await getDoc(doc(adminClient().db, 'admins', uid))).exists() } catch { return false }
}
export async function loadAll() {
  const { db } = adminClient()
  const [m, r] = await Promise.all([getDocs(collection(db, 'members')), getDocs(collection(db, 'reports'))])
  return { members: m.docs.map((d) => d.data()), reports: r.docs.map((d) => d.data()) }
}
