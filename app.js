// app.js

// ---- KIRJAUTUMINEN ----

function showAuthScreen() {
  document.getElementById('auth-screen').classList.remove('hidden');
  document.getElementById('auth-screen').classList.add('active');
  document.getElementById('app-screen').classList.add('hidden');
  document.getElementById('app-screen').classList.remove('active');
}

function showApp() {
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('auth-screen').classList.remove('active');
  document.getElementById('app-screen').classList.remove('hidden');
  document.getElementById('app-screen').classList.add('active');
  renderEtusivu();
}

function showLogin() {
  document.getElementById('login-view').classList.remove('hidden');
  document.getElementById('register-view').classList.add('hidden');
}

function showRegister() {
  document.getElementById('login-view').classList.add('hidden');
  document.getElementById('register-view').classList.remove('hidden');
}

async function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');
  errorEl.textContent = '';

  if (!email || !password) {
    errorEl.textContent = 'Syötä sähköposti ja salasana.';
    return;
  }

  try {
    await loginUser(email, password);
  } catch (e) {
    errorEl.textContent = kirjautumisvirhe(e.code);
  }
}

async function handleRegister() {
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const errorEl = document.getElementById('reg-error');
  errorEl.textContent = '';

  if (!name || !email || !password) {
    errorEl.textContent = 'Täytä kaikki kentät.';
    return;
  }
  if (password.length < 6) {
    errorEl.textContent = 'Salasanan pitää olla vähintään 6 merkkiä.';
    return;
  }

  try {
    await registerUser(name, email, password);
  } catch (e) {
    errorEl.textContent = kirjautumisvirhe(e.code);
  }
}

function kirjautumisvirhe(code) {
  const virheet = {
    'auth/email-already-in-use': 'Sähköposti on jo käytössä.',
    'auth/invalid-email': 'Virheellinen sähköpostiosoite.',
    'auth/wrong-password': 'Väärä salasana.',
    'auth/user-not-found': 'Käyttäjää ei löydy.',
    'auth/weak-password': 'Salasana on liian heikko.',
    'auth/invalid-credential': 'Väärä sähköposti tai salasana.',
  };
  return virheet[code] || 'Jokin meni pieleen. Yritä uudelleen.';
}

// ---- NAVIGAATIO ----

function switchView(viewName, btn) {
  document.querySelectorAll('.view').forEach(v => {
    v.classList.add('hidden');
    v.classList.remove('active');
  });

  const view = document.getElementById('view-' + viewName);
  view.classList.remove('hidden');
  view.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  btn.classList.add('active');

  switch (viewName) {
    case 'etusivu':     renderEtusivu(); break;
    case 'tapahtumat':  renderTapahtumat(); break;
    case 'budjetti':    renderBudjetti(); break;
    case 'tilastot':    renderTilastot(); break;
    case 'profiili':    renderProfiili(); break;
  }
}

// ---- MODAL ----

function openAddModal() {
  renderModalContent();
  document.getElementById('add-modal').classList.remove('hidden');
}

function closeAddModal() {
  document.getElementById('add-modal').classList.add('hidden');
}

function renderModalContent() {
  const tanaan = new Date().toISOString().split('T')[0];
  document.getElementById('add-modal-content').innerHTML = `
    <div class="type-toggle">
      <button id="toggle-meno" class="type-btn active" onclick="vaihdaTyyppi('meno')">Meno</button>
      <button id="toggle-tulo" class="type-btn" onclick="vaihdaTyyppi('tulo')">Tulo</button>
    </div>
    <div class="form-group">
      <label>Summa (€)</label>
      <input type="number" id="modal-summa" inputmode="decimal" min="0" step="0.01" placeholder="0,00">
    </div>
    <div class="form-group">
      <label>Kategoria</label>
      <div id="modal-kategoriat" class="kategoria-grid"></div>
    </div>
    <div class="form-group">
      <label>Kommentti <span class="label-optional">(valinnainen)</span></label>
      <input type="text" id="modal-kommentti" placeholder="esim. Lidl, pesuaineet">
    </div>
    <div class="form-group">
      <label>Päivämäärä</label>
      <input type="date" id="modal-pvm" value="${tanaan}">
    </div>
    <div class="form-group yhteiset-rivi">
      <label>Yhteiseen talouteen</label>
      <label class="toggle-switch">
        <input type="checkbox" id="modal-yhteiset">
        <span class="toggle-knob"></span>
      </label>
    </div>
    <button class="btn-primary" onclick="handleAddTransaction()">Tallenna</button>
    <p id="modal-error" class="error-msg"></p>
  `;
  renderKategoriagrid('meno');
}

let valittuKategoria = null;
let valittuTyyppi = 'meno';

function vaihdaTyyppi(tyyppi) {
  valittuTyyppi = tyyppi;
  valittuKategoria = null;
  document.getElementById('toggle-meno').classList.toggle('active', tyyppi === 'meno');
  document.getElementById('toggle-tulo').classList.toggle('active', tyyppi === 'tulo');
  renderKategoriagrid(tyyppi);
}

function renderKategoriagrid(tyyppi) {
  const lista = tyyppi === 'tulo' ? TULO_KATEGORIAT : MENO_KATEGORIAT;
  const grid = document.getElementById('modal-kategoriat');
  grid.innerHTML = lista.map(k => `
    <button class="kategoria-nappi" onclick="valitseKategoria(this, '${k.nimi.replace(/'/g, "&#39;")}')">
      <span class="kat-ikoni">${k.ikoni}</span>
      <span class="kat-nimi">${k.nimi}</span>
    </button>
  `).join('');
}

function valitseKategoria(btn, nimi) {
  valittuKategoria = nimi;
  document.querySelectorAll('.kategoria-nappi').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

async function handleAddTransaction() {
  const summa = parseFloat(document.getElementById('modal-summa').value);
  const kommentti = document.getElementById('modal-kommentti').value.trim();
  const pvm = document.getElementById('modal-pvm').value;
  const yhteiset = document.getElementById('modal-yhteiset').checked;
  const errorEl = document.getElementById('modal-error');
  errorEl.textContent = '';

  if (!summa || summa <= 0) {
    errorEl.textContent = 'Syötä summa.';
    return;
  }
  if (!valittuKategoria) {
    errorEl.textContent = 'Valitse kategoria.';
    return;
  }
  if (!pvm) {
    errorEl.textContent = 'Valitse päivämäärä.';
    return;
  }

  try {
    await addTransaction({
      tyyppi: valittuTyyppi,
      summa,
      kategoria: valittuKategoria,
      kommentti,
      paivamaara: pvm,
      yhteiset
    });
    closeAddModal();
    switchView('etusivu', document.querySelector('.nav-item.active'));
  } catch (e) {
    errorEl.textContent = 'Tallennus epäonnistui. Yritä uudelleen.';
    console.error(e);
  }
}

// ---- NÄKYMÄT (stub) ----

async function renderEtusivu() {
  const kuukausi = nykyinenKuukausi();
  const view = document.getElementById('view-etusivu');

  view.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Etusivu</h1>
      <span class="page-kuukausi">${kuukausiTeksti(kuukausi)}</span>
    </div>
    <div id="etusivu-content"><p class="ladataan">Ladataan...</p></div>
  `;

  try {
    const kaikki = await getKaikki(kuukausi);
    const yhteenveto = laskeYhteenveto(kaikki);
    const viimeisimmat = kaikki.slice(0, 5);

    document.getElementById('etusivu-content').innerHTML = `
      ${renderYhteenvetokortti(yhteenveto)}
      ${renderViimeisimmat(viimeisimmat)}
    `;
  } catch (e) {
    document.getElementById('etusivu-content').innerHTML =
      '<p class="error-msg">Virhe ladattaessa tietoja.</p>';
    console.error(e);
  }
}

function renderYhteenvetokortti(yhteenveto) {
  const { tulot, menot, saldo } = yhteenveto;
  const edistyminen = tulot > 0 ? Math.min(100, Math.round((menot / tulot) * 100)) : 0;
  const saldoClass = saldo >= 0 ? 'positiivinen' : 'negatiivinen';

  return `
    <div class="yhteenveto-kortti">
      <div class="saldo-rivi">
        <span class="saldo-teksti">Saldo</span>
        <span class="saldo-summa ${saldoClass}">${formatEuro(saldo)}</span>
      </div>
      <div class="tulo-meno-rivi">
        <div class="tulo-block">
          <span class="tm-label">Tulot</span>
          <span class="tm-summa positiivinen">${formatEuro(tulot)}</span>
        </div>
        <div class="meno-block">
          <span class="tm-label">Menot</span>
          <span class="tm-summa negatiivinen">${formatEuro(menot)}</span>
        </div>
      </div>
      <div class="edistymispalkki-wrapper">
        <div class="edistymispalkki">
          <div class="edistymis-taso ${edistymisVari(edistyminen)}" style="width:${edistyminen}%"></div>
        </div>
        <span class="edistymis-prosentti">${edistyminen}% tuloista käytetty</span>
      </div>
    </div>
  `;
}

function renderViimeisimmat(tapahtumat) {
  if (tapahtumat.length === 0) {
    return `
      <div class="osio-header"><h2>Viimeisimmät</h2></div>
      <div class="tyhja-tila">
        <span>💸</span>
        <p>Ei tapahtumia tässä kuussa.<br>Lisää ensimmäinen tapahtuma!</p>
      </div>
    `;
  }

  const rivit = tapahtumat.map(t => {
    const kat = getKategoria(t.kategoria, t.tyyppi);
    const yhtTag = t.yhteiset ? '<span class="yht-tag">YHTEISET</span>' : '';
    const tuloClass = t.tyyppi === 'tulo' ? 'positiivinen' : 'negatiivinen';
    const etumerkki = t.tyyppi === 'tulo' ? '+' : '-';
    return `
      <div class="tapahtuma-rivi" onclick="vahvistaPoistoEtusivu('${t.id}')">
        <span class="t-ikoni">${kat.ikoni}</span>
        <div class="t-tiedot">
          <span class="t-kat">${t.kategoria} ${yhtTag}</span>
          <span class="t-kommentti">${t.kommentti || formatPvm(t.paivamaara)}</span>
        </div>
        <span class="t-summa ${tuloClass}">${etumerkki}${formatEuro(t.summa)}</span>
      </div>
    `;
  }).join('');

  return `
    <div class="osio-header">
      <h2>Viimeisimmät</h2>
      <button class="osio-linkki" onclick="switchView('tapahtumat', document.querySelectorAll('.nav-item')[1])">Kaikki</button>
    </div>
    <div class="tapahtumat-lista">${rivit}</div>
  `;
}

async function vahvistaPoistoEtusivu(txId) {
  if (confirm('Poista tapahtuma?')) {
    await deleteTransaction(txId);
    renderEtusivu();
  }
}

function formatEuro(summa) {
  return Math.abs(summa).toLocaleString('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

function kuukausiTeksti(kuukausi) {
  const kuukaudet = ['Tammikuu','Helmikuu','Maaliskuu','Huhtikuu','Toukokuu','Kesäkuu',
    'Heinäkuu','Elokuu','Syyskuu','Lokakuu','Marraskuu','Joulukuu'];
  const [v, k] = kuukausi.split('-');
  return `${kuukaudet[parseInt(k) - 1]} ${v}`;
}

function edistymisVari(prosentti) {
  if (prosentti >= 100) return 'palkki-punainen';
  if (prosentti >= 80) return 'palkki-keltainen';
  return 'palkki-vihreä';
}
let tapahtumat_suodatin = 'kaikki';
let tapahtumat_kuukausi = nykyinenKuukausi();

async function renderTapahtumat() {
  const view = document.getElementById('view-tapahtumat');

  view.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Tapahtumat</h1>
    </div>
    <div class="kuukausi-valitsin">
      <button onclick="vaihdaTapKuukausi(-1)">‹</button>
      <span id="tap-kuukausi-teksti">${kuukausiTeksti(tapahtumat_kuukausi)}</span>
      <button onclick="vaihdaTapKuukausi(1)">›</button>
    </div>
    <div class="suodatin-tabs">
      <button class="suodatin-btn ${tapahtumat_suodatin === 'kaikki' ? 'active' : ''}" onclick="vaihdaSuodatin('kaikki')">Kaikki</button>
      <button class="suodatin-btn ${tapahtumat_suodatin === 'omat' ? 'active' : ''}" onclick="vaihdaSuodatin('omat')">Omat</button>
      <button class="suodatin-btn ${tapahtumat_suodatin === 'yhteiset' ? 'active' : ''}" onclick="vaihdaSuodatin('yhteiset')">Yhteiset</button>
    </div>
    <div id="tap-lista"><p class="ladataan">Ladataan...</p></div>
  `;

  await renderTapahtumatLista();
}

async function renderTapahtumatLista() {
  const lista = document.getElementById('tap-lista');
  if (!lista) return;

  try {
    let tapahtumat;
    if (tapahtumat_suodatin === 'omat') {
      tapahtumat = await getOmatTapahtumat(tapahtumat_kuukausi);
    } else if (tapahtumat_suodatin === 'yhteiset') {
      tapahtumat = await getYhteisetTapahtumat(tapahtumat_kuukausi);
    } else {
      tapahtumat = await getKaikki(tapahtumat_kuukausi);
    }

    if (tapahtumat.length === 0) {
      lista.innerHTML = `
        <div class="tyhja-tila">
          <span>📋</span>
          <p>Ei tapahtumia tässä kuussa.</p>
        </div>
      `;
      return;
    }

    lista.innerHTML = `
      <div class="tapahtumat-lista">
        ${tapahtumat.map(t => {
          const kat = getKategoria(t.kategoria, t.tyyppi);
          const yhtTag = t.yhteiset ? '<span class="yht-tag">YHTEISET</span>' : '';
          const tuloClass = t.tyyppi === 'tulo' ? 'positiivinen' : 'negatiivinen';
          const etumerkki = t.tyyppi === 'tulo' ? '+' : '-';
          return `
            <div class="tapahtuma-rivi" onclick="vahvistaPoistoTap('${t.id}')">
              <span class="t-ikoni">${kat.ikoni}</span>
              <div class="t-tiedot">
                <span class="t-kat">${t.kategoria} ${yhtTag}</span>
                <span class="t-kommentti">${t.kommentti ? t.kommentti + ' · ' : ''}${formatPvm(t.paivamaara)}</span>
              </div>
              <span class="t-summa ${tuloClass}">${etumerkki}${formatEuro(t.summa)}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } catch (e) {
    lista.innerHTML = '<p class="error-msg">Virhe ladattaessa tapahtumia.</p>';
    console.error(e);
  }
}

function vaihdaSuodatin(suodatin) {
  tapahtumat_suodatin = suodatin;
  renderTapahtumat();
}

function vaihdaTapKuukausi(suunta) {
  const [v, k] = tapahtumat_kuukausi.split('-').map(Number);
  const d = new Date(v, k - 1 + suunta, 1);
  tapahtumat_kuukausi = d.toISOString().substring(0, 7);
  renderTapahtumat();
}

async function vahvistaPoistoTap(txId) {
  if (confirm('Poista tapahtuma?')) {
    await deleteTransaction(txId);
    renderTapahtumatLista();
  }
}
let budjetti_tab = 'oma';

async function renderBudjetti() {
  const view = document.getElementById('view-budjetti');
  const kuukausi = nykyinenKuukausi();

  view.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Budjetti</h1>
      <span class="page-kuukausi">${kuukausiTeksti(kuukausi)}</span>
    </div>
    <div class="budjetti-tabs">
      <button class="bud-tab ${budjetti_tab === 'oma' ? 'active' : ''}" onclick="vaihdaBudjettiTab('oma')">Oma</button>
      <button class="bud-tab ${budjetti_tab === 'yhteiset' ? 'active' : ''}" onclick="vaihdaBudjettiTab('yhteiset')">Yhteiset</button>
    </div>
    <div id="budjetti-content"><p class="ladataan">Ladataan...</p></div>
  `;

  await renderBudjettiContent(kuukausi);
}

function vaihdaBudjettiTab(tab) {
  budjetti_tab = tab;
  renderBudjetti();
}

async function renderBudjettiContent(kuukausi) {
  const el = document.getElementById('budjetti-content');
  if (!el) return;

  try {
    if (!currentUser || !currentUserData) {
      el.innerHTML = '<p class="error-msg">Kirjaudu sisään ensin.</p>';
      return;
    }

    const uid = currentUser.uid;
    const isYhteiset = budjetti_tab === 'yhteiset';
    const kotitalousId = currentUserData.kotitalousId || null;

    if (isYhteiset && !kotitalousId) {
      el.innerHTML = `
        <div class="tyhja-tila">
          <span>🏠</span>
          <p>Et ole liittynyt kotitalouteen.<br>Yhdistä tili profiilisivulta.</p>
        </div>
      `;
      return;
    }

    // Hae budjetti Firestoresta
    const budjettiRef = isYhteiset
      ? db.collection('households').doc(kotitalousId).collection('budjetit').doc(kuukausi)
      : db.collection('users').doc(uid).collection('budjetit').doc(kuukausi);

    const budjettiSnap = await budjettiRef.get();
    const budjetti = budjettiSnap.exists ? budjettiSnap.data() : { kokonaisbudjetti: 0, kategoriat: {} };

    // Hae tapahtumat budjettia varten
    let tapahtumat;
    if (isYhteiset) {
      tapahtumat = (await getYhteisetTapahtumat(kuukausi)).filter(t => t.tyyppi === 'meno');
    } else {
      tapahtumat = (await getOmatTapahtumat(kuukausi)).filter(t => t.tyyppi === 'meno');
    }

    // Laske käytetty per kategoria
    const kaytetty = {};
    tapahtumat.forEach(t => {
      kaytetty[t.kategoria] = (kaytetty[t.kategoria] || 0) + t.summa;
    });
    const kokonaisKaytetty = tapahtumat.reduce((s, t) => s + t.summa, 0);

    el.innerHTML = `
      <div class="budjetti-kortti">
        <div class="budjetti-otsikko">
          <span>Kokonaisbudjetti</span>
          <button class="muokkaa-btn" onclick="muokkaaKokonaisbudjetti('${kuukausi}', ${budjetti.kokonaisbudjetti || 0})">Muokkaa</button>
        </div>
        ${budjetti.kokonaisbudjetti > 0
          ? renderBudjettiPalkki('Kokonaismenot', kokonaisKaytetty, budjetti.kokonaisbudjetti)
          : '<p class="bud-ei-asetettu">Ei asetettu — paina Muokkaa</p>'
        }
      </div>
      <div class="budjetti-kategoriat">
        <div class="budjetti-kat-otsikko">
          <span>Kategoriat</span>
        </div>
        ${MENO_KATEGORIAT.map(k => {
          const raja = budjetti.kategoriat?.[k.nimi] || 0;
          const kay = kaytetty[k.nimi] || 0;
          return `
            <div class="budjetti-kat-rivi">
              <div class="budjetti-kat-header">
                <span>${k.ikoni} ${k.nimi}</span>
                <button class="muokkaa-btn" onclick="muokkaaKatBudjetti('${kuukausi}', '${k.nimi.replace(/'/g, "&#39;")}', ${raja})">
                  ${raja > 0 ? formatEuro(raja) : 'Aseta'}
                </button>
              </div>
              ${raja > 0 ? renderBudjettiPalkki('', kay, raja) : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;
  } catch (e) {
    el.innerHTML = `<p class="error-msg">Virhe: ${e.message || e.code || 'tuntematon virhe'}</p>`;
    console.error(e);
  }
}

function renderBudjettiPalkki(nimi, kaytetty, raja) {
  const prosentti = raja > 0 ? Math.min(100, Math.round((kaytetty / raja) * 100)) : 0;
  const vari = edistymisVari(prosentti);
  const yliText = kaytetty > raja ? ` <span class="bud-yli">+${formatEuro(kaytetty - raja)} yli</span>` : '';
  return `
    ${nimi ? `<p class="bud-nimi">${nimi}</p>` : ''}
    <div class="bud-summat">
      <span class="bud-kaytetty">${formatEuro(kaytetty)}</span>
      <span class="bud-raja">/ ${formatEuro(raja)}${yliText}</span>
    </div>
    <div class="edistymispalkki">
      <div class="edistymis-taso ${vari}" style="width:${prosentti}%"></div>
    </div>
    <span class="edistymis-prosentti">${prosentti}%</span>
  `;
}

async function muokkaaKokonaisbudjetti(kuukausi, nykyinen) {
  const uusi = prompt(`Kokonaisbudjetti (€):\nNykyinen: ${nykyinen} €`, nykyinen || '');
  if (uusi === null) return;
  const arvo = parseFloat(uusi.replace(',', '.'));
  if (isNaN(arvo) || arvo < 0) { alert('Syötä kelvollinen summa.'); return; }

  const isYhteiset = budjetti_tab === 'yhteiset';
  const ref = isYhteiset
    ? db.collection('households').doc(currentUserData.kotitalousId).collection('budjetit').doc(kuukausi)
    : db.collection('users').doc(currentUser.uid).collection('budjetit').doc(kuukausi);

  await ref.set({ kokonaisbudjetti: arvo }, { merge: true });
  renderBudjettiContent(kuukausi);
}

async function muokkaaKatBudjetti(kuukausi, kategoria, nykyinen) {
  const uusi = prompt(`Budjetti — ${kategoria} (€):\nNykyinen: ${nykyinen} €`, nykyinen || '');
  if (uusi === null) return;
  const arvo = parseFloat(uusi.replace(',', '.'));
  if (isNaN(arvo) || arvo < 0) { alert('Syötä kelvollinen summa.'); return; }

  const isYhteiset = budjetti_tab === 'yhteiset';
  const ref = isYhteiset
    ? db.collection('households').doc(currentUserData.kotitalousId).collection('budjetit').doc(kuukausi)
    : db.collection('users').doc(currentUser.uid).collection('budjetit').doc(kuukausi);

  await ref.set({ kategoriat: { [kategoria]: arvo } }, { merge: true });
  renderBudjettiContent(kuukausi);
}

let tilastot_tab = 'omat';
let tilastot_kuukausi = nykyinenKuukausi();

async function renderTilastot() {
  const view = document.getElementById('view-tilastot');
  view.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Tilastot</h1>
    </div>
    <div class="kuukausi-valitsin">
      <button onclick="vaihdaTilKuukausi(-1)">‹</button>
      <span id="til-kuukausi-teksti">${kuukausiTeksti(tilastot_kuukausi)}</span>
      <button onclick="vaihdaTilKuukausi(1)">›</button>
    </div>
    <div class="suodatin-tabs">
      <button class="suodatin-btn ${tilastot_tab === 'omat' ? 'active' : ''}" onclick="vaihdaTilTab('omat')">Omat</button>
      <button class="suodatin-btn ${tilastot_tab === 'yhteiset' ? 'active' : ''}" onclick="vaihdaTilTab('yhteiset')">Yhteiset</button>
    </div>
    <div class="kaavio-kortti">
      <h3 class="kaavio-otsikko">Menot kategorioittain</h3>
      <canvas id="piirakkakaaavio" height="250"></canvas>
    </div>
    <div class="kaavio-kortti">
      <h3 class="kaavio-otsikko">Tulot vs. menot (6 kk)</h3>
      <canvas id="pylvaskaavio" height="220"></canvas>
    </div>
    <p id="til-error" class="error-msg"></p>
  `;
  await renderTilastotContent();
}

function vaihdaTilTab(tab) {
  tilastot_tab = tab;
  renderTilastot();
}

function vaihdaTilKuukausi(suunta) {
  const [v, k] = tilastot_kuukausi.split('-').map(Number);
  const d = new Date(v, k - 1 + suunta, 1);
  tilastot_kuukausi = d.toISOString().substring(0, 7);
  renderTilastot();
}

async function renderTilastotContent() {
  try {
    const isYhteiset = tilastot_tab === 'yhteiset';

    // Piirakkakaavio: menot kategorioittain (nykyinen kuukausi)
    let tapahtumat;
    if (isYhteiset) {
      tapahtumat = await getYhteisetTapahtumat(tilastot_kuukausi);
    } else {
      tapahtumat = await getOmatTapahtumat(tilastot_kuukausi);
    }
    const menot = tapahtumat.filter(t => t.tyyppi === 'meno');
    piirraKategoriaPiirakka(menot);

    // Pylväskaavio: 6 viimeisin kuukausi
    const kuukaudet = [];
    const [v, k] = tilastot_kuukausi.split('-').map(Number);
    for (let i = 5; i >= 0; i--) {
      const d = new Date(v, k - 1 - i, 1);
      kuukaudet.push(d.toISOString().substring(0, 7));
    }

    const kuukausiData = await Promise.all(kuukaudet.map(async (kk) => {
      const tx = isYhteiset
        ? await getYhteisetTapahtumat(kk)
        : await getOmatTapahtumat(kk);
      const yht = laskeYhteenveto(tx);
      return { kk, ...yht };
    }));

    piirraKuukausiPylvas(kuukausiData);
  } catch (e) {
    document.getElementById('til-error').textContent = 'Virhe ladattaessa tilastoja.';
    console.error(e);
  }
}
async function renderProfiili() {
  const view = document.getElementById('view-profiili');
  const kotitalousId = currentUserData.kotitalousId;

  view.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Profiili</h1>
    </div>
    <div class="profiili-kortti">
      <div class="profiili-nimi-rivi">
        <span class="profiili-ikoni">👤</span>
        <div>
          <p class="profiili-nimi">${currentUserData.nimi || 'Käyttäjä'}</p>
          <p class="profiili-email">${currentUser.email}</p>
        </div>
      </div>
    </div>

    <div class="profiili-osio">
      <h2>Kotitalous</h2>
      <div id="kotitalous-content">
        ${kotitalousId
          ? `<p class="kotitalous-status">Olet kotitaloudessa ✓</p>
             <p class="kotitalous-id">ID: <code>${kotitalousId}</code></p>
             <button class="btn-kutsu" onclick="naytaKutsukoodi()">Luo uusi kutsukoodi</button>
             <button class="btn-poistu" onclick="vahvistaPoistu()">Poistu kotitaloudesta</button>`
          : `<p class="kotitalous-status muted">Et ole vielä kotitaloudessa.</p>
             <button class="btn-primary" onclick="aloitaKotitalous()">Luo kotitalous</button>
             <div class="tai-rivi"><span>tai</span></div>
             <div class="koodi-syote">
               <input type="text" id="kutsukoodi-input" placeholder="Syötä kutsukoodi" maxlength="6" style="text-transform:uppercase">
               <button class="btn-primary" onclick="liityKoodilla()">Liity</button>
             </div>`
        }
        <p id="kotitalous-error" class="error-msg"></p>
        <p id="kotitalous-success" class="success-msg"></p>
      </div>
    </div>

    <div class="profiili-osio kirjaudu-ulos">
      <button class="btn-logout" onclick="vahvistaUloskirjautuminen()">Kirjaudu ulos</button>
    </div>
  `;
}

async function aloitaKotitalous() {
  const errorEl = document.getElementById('kotitalous-error');
  const successEl = document.getElementById('kotitalous-success');
  errorEl.textContent = '';
  successEl.textContent = '';

  try {
    const { koodi } = await luoKotitalous();
    successEl.textContent = `Kotitalous luotu! Kutsukoodi: ${koodi} (voimassa 7 vrk)`;
    renderProfiili();
  } catch (e) {
    errorEl.textContent = 'Virhe kotitalouden luomisessa.';
    console.error(e);
  }
}

async function liityKoodilla() {
  const koodi = document.getElementById('kutsukoodi-input').value.trim();
  const errorEl = document.getElementById('kotitalous-error');
  const successEl = document.getElementById('kotitalous-success');
  errorEl.textContent = '';
  successEl.textContent = '';

  if (!koodi || koodi.length < 6) {
    errorEl.textContent = 'Syötä 6-merkkinen kutsukoodi.';
    return;
  }

  try {
    await liityKotitalouteen(koodi);
    successEl.textContent = 'Liityit kotitalouteen! 🎉';
    renderProfiili();
  } catch (e) {
    errorEl.textContent = e.message || 'Virhe koodin käytössä.';
  }
}

async function naytaKutsukoodi() {
  const errorEl = document.getElementById('kotitalous-error');
  const successEl = document.getElementById('kotitalous-success');
  errorEl.textContent = '';
  successEl.textContent = '';

  try {
    const koodi = Math.random().toString(36).substring(2, 8).toUpperCase();
    const voimassa = new Date();
    voimassa.setDate(voimassa.getDate() + 7);

    await db.collection('kutsukoodit').doc(koodi).set({
      kotitalousId: currentUserData.kotitalousId,
      luonut: currentUser.uid,
      voimassa: firebase.firestore.Timestamp.fromDate(voimassa)
    });

    successEl.textContent = `Kutsukoodi: ${koodi} (voimassa 7 vrk)`;
  } catch (e) {
    errorEl.textContent = 'Virhe koodin luomisessa.';
  }
}

async function vahvistaPoistu() {
  if (confirm('Haluatko poistua kotitaloudesta?')) {
    try {
      await poistuKotitaloudesta();
      renderProfiili();
    } catch (e) {
      alert('Virhe: ' + e.message);
    }
  }
}

function vahvistaUloskirjautuminen() {
  if (confirm('Haluatko kirjautua ulos?')) {
    logoutUser();
  }
}
