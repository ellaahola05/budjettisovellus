// charts.js — Chart.js kaaviot

let piirakkaInstanssi = null;
let pylvasInstanssi = null;

function piirraKategoriaPiirakka(menot) {
  const ctx = document.getElementById('piirakkakaaavio');
  if (!ctx) return;

  // Laske summat per kategoria
  const katSummat = {};
  menot.forEach(t => {
    katSummat[t.kategoria] = (katSummat[t.kategoria] || 0) + t.summa;
  });

  const kategoriat = Object.keys(katSummat);
  const arvot = Object.values(katSummat);

  if (piirakkaInstanssi) piirakkaInstanssi.destroy();

  if (kategoriat.length === 0) {
    const container = ctx.parentElement;
    ctx.style.display = 'none';
    if (!container.querySelector('.kaavio-tyhja')) {
      const p = document.createElement('p');
      p.className = 'kaavio-tyhja';
      p.textContent = 'Ei menoja tässä kuussa.';
      container.appendChild(p);
    }
    return;
  }

  ctx.style.display = '';
  const tyhja = ctx.parentElement.querySelector('.kaavio-tyhja');
  if (tyhja) tyhja.remove();

  const varit = [
    '#1a73e8','#e91e63','#4caf50','#ff9800','#9c27b0',
    '#00bcd4','#795548','#607d8b','#f44336','#3f51b5',
    '#009688','#ff5722','#8bc34a','#ffc107','#e91e63',
    '#2196f3','#4db6ac','#ff8a65','#a5d6a7'
  ];

  piirakkaInstanssi = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: kategoriat,
      datasets: [{
        data: arvot,
        backgroundColor: varit.slice(0, kategoriat.length),
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: { family: 'DM Sans', size: 11 },
            padding: 12,
            boxWidth: 12
          }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const val = ctx.parsed;
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct = Math.round((val / total) * 100);
              return ` ${val.toLocaleString('fi-FI', {minimumFractionDigits: 2})} € (${pct}%)`;
            }
          }
        }
      }
    }
  });
}

function piirraKuukausiPylvas(kuukausiData) {
  const ctx = document.getElementById('pylvaskaavio');
  if (!ctx) return;

  if (pylvasInstanssi) pylvasInstanssi.destroy();

  const kuukaudet = ['Tam','Hel','Maa','Huh','Tou','Kes','Hei','Elo','Syy','Lok','Mar','Jou'];

  const labelit = kuukausiData.map(d => {
    const [, k] = d.kk.split('-');
    return kuukaudet[parseInt(k) - 1];
  });

  pylvasInstanssi = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labelit,
      datasets: [
        {
          label: 'Tulot',
          data: kuukausiData.map(d => d.tulot),
          backgroundColor: '#4caf50',
          borderRadius: 6
        },
        {
          label: 'Menot',
          data: kuukausiData.map(d => d.menot),
          backgroundColor: '#e91e63',
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: { font: { family: 'DM Sans', size: 12 } }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.parsed.y.toLocaleString('fi-FI', {minimumFractionDigits: 2})} €`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (v) => v + ' €',
            font: { family: 'DM Sans', size: 11 }
          }
        },
        x: {
          ticks: { font: { family: 'DM Sans', size: 11 } }
        }
      }
    }
  });
}
