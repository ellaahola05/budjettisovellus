// Firebase-konfiguraatio
const firebaseConfig = {
  apiKey: "AIzaSyAed-vXwfp2OG_IupaUzY2phS3V7pBtZcg",
  authDomain: "budjettisovellus-c41c0.firebaseapp.com",
  projectId: "budjettisovellus-c41c0",
  storageBucket: "budjettisovellus-c41c0.firebasestorage.app",
  messagingSenderId: "121488533765",
  appId: "1:121488533765:web:4f6e944987f9fd92072f6c"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

let currentUser = null;
let currentUserData = null;

auth.onAuthStateChanged(async (user) => {
  if (user) {
    currentUser = user;
    currentUserData = await getUserData(user.uid);
    if (!currentUserData) {
      await db.collection('users').doc(user.uid).set({
        nimi: user.email.split('@')[0],
        sahkopostti: user.email,
        kotitalousId: null
      }, { merge: true });
      currentUserData = await getUserData(user.uid);
    }
    showApp();
  } else {
    currentUser = null;
    currentUserData = null;
    showAuthScreen();
  }
});

async function registerUser(name, email, password) {
  const cred = await auth.createUserWithEmailAndPassword(email, password);
  await db.collection('users').doc(cred.user.uid).set({
    nimi: name,
    sahkopostti: email,
    kotitalousId: null
  });
  return cred.user;
}

async function loginUser(email, password) {
  return auth.signInWithEmailAndPassword(email, password);
}

function logoutUser() {
  return auth.signOut();
}

async function getUserData(uid) {
  const doc = await db.collection('users').doc(uid).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

async function updateUserData(uid, data) {
  return db.collection('users').doc(uid).update(data);
}

// ---- TAPAHTUMAT ----

const MENO_KATEGORIAT = [
  { nimi: 'Ruoka & juoma', ikoni: '🍽️' },
  { nimi: 'Ostokset', ikoni: '🛍️' },
  { nimi: 'Liikenne', ikoni: '🚌' },
  { nimi: 'Koti', ikoni: '🏠' },
  { nimi: 'Laskut & maksut', ikoni: '📄' },
  { nimi: 'Viihde', ikoni: '🎬' },
  { nimi: 'Auto', ikoni: '🚗' },
  { nimi: 'Matkailu', ikoni: '✈️' },
  { nimi: 'Perhe & henkilökohtainen', ikoni: '👨‍👩‍👧' },
  { nimi: 'Terveys', ikoni: '🏥' },
  { nimi: 'Koulutus', ikoni: '📚' },
  { nimi: 'Työ', ikoni: '💼' },
  { nimi: 'Päivittäistavarat', ikoni: '🛒' },
  { nimi: 'Lahjat', ikoni: '🎁' },
  { nimi: 'Urheilu & harrastukset', ikoni: '⚽' },
  { nimi: 'Kauneus', ikoni: '💄' },
  { nimi: 'Tilaukset', ikoni: '📱' },
  { nimi: 'Sijoitukset', ikoni: '📈' },
  { nimi: 'Muut', ikoni: '📦' }
];

const TULO_KATEGORIAT = [
  { nimi: 'Palkka', ikoni: '💰' },
  { nimi: 'Opintotuki', ikoni: '🎓' },
  { nimi: 'Opintolaina', ikoni: '🏦' },
  { nimi: 'Freelance / sivutulot', ikoni: '💻' },
  { nimi: 'Myynti (esim. Vinted)', ikoni: '📦' },
  { nimi: 'Sijoitusten tuotto', ikoni: '📈' },
  { nimi: 'Lahjat & stipendit', ikoni: '🎁' },
  { nimi: 'Muut tulot', ikoni: '💵' }
];

function getKategoria(nimi, tyyppi) {
  const lista = tyyppi === 'tulo' ? TULO_KATEGORIAT : MENO_KATEGORIAT;
  return lista.find(k => k.nimi === nimi) || { nimi, ikoni: '📦' };
}

async function addTransaction(data) {
  const tx = {
    userId: currentUser.uid,
    kotitalousId: currentUserData.kotitalousId || null,
    tyyppi: data.tyyppi,
    summa: Number(data.summa),
    kategoria: data.kategoria,
    kommentti: data.kommentti || '',
    paivamaara: firebase.firestore.Timestamp.fromDate(new Date(data.paivamaara)),
    kuukausi: data.paivamaara.substring(0, 7),
    yhteiset: data.yhteiset && !!currentUserData.kotitalousId
  };
  return db.collection('transactions').add(tx);
}

async function getOmatTapahtumat(kuukausi) {
  const snap = await db.collection('transactions')
    .where('userId', '==', currentUser.uid)
    .get();
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(t => t.kuukausi === kuukausi && !t.yhteiset)
    .sort((a, b) => b.paivamaara.seconds - a.paivamaara.seconds);
}

async function getYhteisetTapahtumat(kuukausi) {
  if (!currentUserData || !currentUserData.kotitalousId) return [];
  const snap = await db.collection('transactions')
    .where('kotitalousId', '==', currentUserData.kotitalousId)
    .get();
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(t => t.kuukausi === kuukausi && t.yhteiset)
    .sort((a, b) => b.paivamaara.seconds - a.paivamaara.seconds);
}

async function getKaikki(kuukausi) {
  const [omat, yhteiset] = await Promise.all([
    getOmatTapahtumat(kuukausi),
    getYhteisetTapahtumat(kuukausi)
  ]);
  return [...omat, ...yhteiset].sort((a, b) =>
    b.paivamaara.seconds - a.paivamaara.seconds
  );
}

async function deleteTransaction(txId) {
  return db.collection('transactions').doc(txId).delete();
}

function nykyinenKuukausi() {
  return new Date().toISOString().substring(0, 7);
}

function formatPvm(timestamp) {
  const d = timestamp.toDate();
  return d.toLocaleDateString('fi-FI', { day: 'numeric', month: 'numeric' });
}

function laskeYhteenveto(tapahtumat) {
  let tulot = 0, menot = 0;
  tapahtumat.forEach(t => {
    if (t.tyyppi === 'tulo') tulot += t.summa;
    else menot += t.summa;
  });
  return { tulot, menot, saldo: tulot - menot };
}

// ---- KOTITALOUS ----

async function luoKotitalous() {
  const householdRef = await db.collection('households').add({
    jasenet: [currentUser.uid],
    luotu: firebase.firestore.FieldValue.serverTimestamp()
  });

  const koodi = Math.random().toString(36).substring(2, 8).toUpperCase();
  const voimassa = new Date();
  voimassa.setDate(voimassa.getDate() + 7);

  await db.collection('kutsukoodit').doc(koodi).set({
    kotitalousId: householdRef.id,
    luonut: currentUser.uid,
    voimassa: firebase.firestore.Timestamp.fromDate(voimassa)
  });

  await updateUserData(currentUser.uid, { kotitalousId: householdRef.id });
  currentUserData.kotitalousId = householdRef.id;

  return { householdId: householdRef.id, koodi };
}

async function liityKotitalouteen(koodi) {
  const koodiDoc = await db.collection('kutsukoodit').doc(koodi.toUpperCase().trim()).get();

  if (!koodiDoc.exists) throw new Error('Kutsukoodi ei löydy.');

  const koodiData = koodiDoc.data();
  if (koodiData.voimassa.toDate() < new Date()) throw new Error('Kutsukoodi on vanhentunut.');

  const kotitalousId = koodiData.kotitalousId;
  await db.collection('households').doc(kotitalousId).update({
    jasenet: firebase.firestore.FieldValue.arrayUnion(currentUser.uid)
  });

  await updateUserData(currentUser.uid, { kotitalousId });
  currentUserData.kotitalousId = kotitalousId;

  return kotitalousId;
}

async function poistuKotitaloudesta() {
  if (!currentUserData.kotitalousId) return;

  await db.collection('households').doc(currentUserData.kotitalousId).update({
    jasenet: firebase.firestore.FieldValue.arrayRemove(currentUser.uid)
  });

  await updateUserData(currentUser.uid, { kotitalousId: null });
  currentUserData.kotitalousId = null;
}
