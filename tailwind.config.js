// Båstads GIF: svart/vit/ljusgrått + varma toner (sand och guld) som accent.
export default {
  darkMode: 'class', // appen är alltid ljus, oavsett telefonens mörkt läge
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: { colors: {
    sand: { 100: '#f5f1ea', 200: '#ebe4d6', 300: '#d8cdb8' },
    gold: { 50: '#fbf5e8', 200: '#ecd7a6', 500: '#c58b2d', 700: '#8a5a12' }
  } } },
  plugins: []
}
