const firebaseConfig = {
  apiKey: "AIzaSyCfNYZBSgHWbrGp4LwAv93oWVaXmsHnGI4",
  authDomain: "dividendtracker-8e4f0.firebaseapp.com",
  projectId: "dividendtracker-8e4f0",
  databaseURL: "https://dividendtracker-8e4f0-default-rtdb.asia-southeast1.firebasedatabase.app",
  storageBucket: "dividendtracker-8e4f0.firebasestorage.app",
  messagingSenderId: "54763007764",
  appId: "1:54763007764:web:6232f8fd486db65a095c01",
  measurementId: "G-3859NYMR6F"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ── Default Stocks ──────────────────────────────────────────
const defaultStocksKRW = [
  "TIGER S&P500", "TIGER 미국배당다우존스", "KODEX 미국 나스닥 100",
  "맥쿼리인프라", "PLUS 고배당주", "SOL 코리아고배당",
  "KODEX 미국배당커버드콜액티브", "KODEX 미국AI테크TOP10",
  "RISE 미국테크100데일리고정커버드콜", "KODEX 미국AI전력핵심인프라",
  "KODEX 미국서학개미"
];

const defaultStocksUSD = ['DIVO', 'SPYI', 'QQQI', 'SPMO', 'SCHD'];

// ── Pre-seeded data for Account 2 (USD) ─────────────────────
const acc2Seed = {
  2025: {
    stocks: ['DIVO','SPYI','QQQI','SPMO','SCHD'],
    yearlyGoal: 100,
    dividendData: {
      1:{DIVO:0,    SPYI:0,    QQQI:0,    SPMO:0,    SCHD:0},
      2:{DIVO:0,    SPYI:0,    QQQI:0,    SPMO:0,    SCHD:0},
      3:{DIVO:0,    SPYI:0,    QQQI:0,    SPMO:0,    SCHD:0},
      4:{DIVO:0,    SPYI:0,    QQQI:0,    SPMO:0,    SCHD:0},
      5:{DIVO:0,    SPYI:0,    QQQI:0,    SPMO:0,    SCHD:0},
      6:{DIVO:0,    SPYI:0,    QQQI:0,    SPMO:0.72, SCHD:0.66},
      7:{DIVO:0.44, SPYI:0.87, QQQI:0,    SPMO:0,    SCHD:0},
      8:{DIVO:0.45, SPYI:1.32, QQQI:0,    SPMO:0,    SCHD:0},
      9:{DIVO:0.6,  SPYI:1.79, QQQI:0,    SPMO:1.14, SCHD:0.44},
      10:{DIVO:0.93,SPYI:3.14, QQQI:0,    SPMO:0,    SCHD:0},
      11:{DIVO:1.27,SPYI:3.1,  QQQI:1.07, SPMO:0,    SCHD:0},
      12:{DIVO:6.29,SPYI:3.16, QQQI:1.63, SPMO:2.23, SCHD:0}
    }
  },
  2026: {
    stocks: ['DIVO','SPYI','QQQI','SPMO','SCHD'],
    yearlyGoal: 100,
    dividendData: {
      1:{DIVO:1.09, SPYI:3.16, QQQI:2.7,  SPMO:0, SCHD:0},
      2:{DIVO:1.11, SPYI:3.55, QQQI:3.65, SPMO:0, SCHD:0},
      3:{DIVO:0, SPYI:0, QQQI:0, SPMO:0, SCHD:0},
      4:{DIVO:0, SPYI:0, QQQI:0, SPMO:0, SCHD:0},
      5:{DIVO:0, SPYI:0, QQQI:0, SPMO:0, SCHD:0},
      6:{DIVO:0, SPYI:0, QQQI:0, SPMO:0, SCHD:0},
      7:{DIVO:0, SPYI:0, QQQI:0, SPMO:0, SCHD:0},
      8:{DIVO:0, SPYI:0, QQQI:0, SPMO:0, SCHD:0},
      9:{DIVO:0, SPYI:0, QQQI:0, SPMO:0, SCHD:0},
      10:{DIVO:0, SPYI:0, QQQI:0, SPMO:0, SCHD:0},
      11:{DIVO:0, SPYI:0, QQQI:0, SPMO:0, SCHD:0},
      12:{DIVO:0, SPYI:0, QQQI:0, SPMO:0, SCHD:0}
    }
  }
};

// ── Stock Color Palette ──────────────────────────────────────
const STOCK_COLORS = [
  '#6366f1','#06b6d4','#10b981','#f59e0b',
  '#ef4444','#8b5cf6','#ec4899','#14b8a6',
  '#f97316','#3b82f6','#84cc16'
];
function getStockColor(i) { return STOCK_COLORS[i % STOCK_COLORS.length]; }

// ── State ────────────────────────────────────────────────────
let stocks       = [];
let dividendData = {};
let myChart      = null;
let currentYear  = 2026;
let currentMonth = new Date().getMonth() + 1;
let viewMode     = 'month';
let currentStock = '';
let yearlyGoal   = 5000000;
let currentAccount = 1; // 1 = KRW, 2 = USD

// ── Helpers ──────────────────────────────────────────────────
const isUSD         = () => currentAccount === 2;
const getDbKey      = () => currentAccount === 1 ? `divTracker_${currentYear}` : `divTracker_usd_${currentYear}`;
const getDefStocks  = () => isUSD() ? [...defaultStocksUSD] : [...defaultStocksKRW];
const getDefGoal    = () => isUSD() ? 100 : 5000000;

function formatTotal(val) {
  if (isUSD()) return '$' + parseFloat(val || 0).toFixed(2);
  return parseInt(val || 0).toLocaleString() + '원';
}
function parseVal(str) {
  if (isUSD()) return parseFloat(String(str).replace(/[^0-9.]/g, '')) || 0;
  return parseInt(String(str).replace(/[^0-9]/g, '')) || 0;
}
function displayInputVal(val) {
  if (isUSD()) return parseFloat(val) > 0 ? parseFloat(val).toFixed(2) : '';
  return parseInt(val) > 0 ? parseInt(val).toLocaleString() : '';
}

// ── Elements ─────────────────────────────────────────────────
const yearSelectorEl       = document.getElementById('year-selector');
const totalDividendEl      = document.getElementById('total-dividend');
const currencyLabelEl      = document.getElementById('currency-label');
const monthTabsContainer   = document.getElementById('month-tabs');
const monthDetailContainer = document.getElementById('month-detail-container');
const viewMonthBtn         = document.getElementById('view-month-btn');
const viewStockBtn         = document.getElementById('view-stock-btn');
const settingsBtn          = document.getElementById('settings-btn');
const closeModalBtn        = document.getElementById('close-modal-btn');
const settingsModal        = document.getElementById('settings-modal');
const stockListEl          = document.getElementById('stock-list');
const addStockForm         = document.getElementById('add-stock-form');
const newStockInput        = document.getElementById('new-stock-input');
const acc1Btn              = document.getElementById('acc1-btn');
const acc2Btn              = document.getElementById('acc2-btn');
const goalLabelUnitEl      = document.getElementById('goal-label-unit');
const goalPercentEl        = document.getElementById('goal-percent');
const goalFillEl           = document.getElementById('goal-fill');
const goalAmountTextEl     = document.getElementById('goal-amount-text');
const goalInputEl          = document.getElementById('goal-input');
const saveGoalBtn          = document.getElementById('save-goal-btn');

// ── Init ─────────────────────────────────────────────────────
function init() {
  initYearSelector();
  setupEventListeners();
  loadData();
}

function initYearSelector() {
  if (!yearSelectorEl) return;
  yearSelectorEl.innerHTML = '';
  const startYear = 2025;
  const maxYear   = Math.max(new Date().getFullYear() + 1, currentYear);
  for (let y = startYear; y <= maxYear; y++) {
    const opt = document.createElement('option');
    opt.value = y; opt.innerText = y;
    yearSelectorEl.appendChild(opt);
  }
  yearSelectorEl.value = currentYear;
}

// ── Firebase ─────────────────────────────────────────────────
function loadData() {
  db.ref().child(getDbKey()).get().then((snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      stocks       = data.stocks       || getDefStocks();
      dividendData = data.dividendData || {};
      yearlyGoal   = data.yearlyGoal   || getDefGoal();
      
      // ── Data Migration: QQQQI -> QQQI ─────────────────────
      if (isUSD()) {
        let migrated = false;
        // 1. Stocks list migration
        stocks = stocks.map(st => {
          if (st === 'QQQQI') { migrated = true; return 'QQQI'; }
          return st;
        });
        // 2. dividendData keys migration
        for (let m = 1; m <= 12; m++) {
          if (dividendData[m] && dividendData[m]['QQQQI'] !== undefined) {
            dividendData[m]['QQQI'] = (dividendData[m]['QQQI'] || 0) + dividendData[m]['QQQQI'];
            delete dividendData[m]['QQQQI'];
            migrated = true;
          }
        }
        if (migrated) saveToFirebase();
      }
      // ──────────────────────────────────────────────────────
      
      for (let i = 1; i <= 12; i++) if (!dividendData[i]) dividendData[i] = {};
    } else {
      // Seed account 2 data on first load
      if (isUSD() && acc2Seed[currentYear]) {
        const s   = acc2Seed[currentYear];
        stocks       = [...s.stocks];
        dividendData = JSON.parse(JSON.stringify(s.dividendData));
        yearlyGoal   = s.yearlyGoal;
      } else {
        stocks     = getDefStocks();
        yearlyGoal = getDefGoal();
        for (let i = 1; i <= 12; i++) {
          dividendData[i] = {};
          stocks.forEach(st => dividendData[i][st] = 0);
        }
      }
      saveToFirebase();
    }
    if (stocks.length > 0 && !currentStock) currentStock = stocks[0];
    renderApp();
  }).catch(err => {
    console.error('Firebase error:', err);
    alert('데이터를 가져오는 중 오류가 발생했습니다.');
  });
}

function saveToFirebase() {
  db.ref(getDbKey()).set({ stocks, dividendData, yearlyGoal });
}

function saveStocks() {
  for (let i = 1; i <= 12; i++) {
    if (!dividendData[i]) dividendData[i] = {};
    stocks.forEach(st => { if (dividendData[i][st] === undefined) dividendData[i][st] = 0; });
  }
  saveToFirebase();
}
const saveData = saveToFirebase;

// ── Render All ───────────────────────────────────────────────
function renderApp() {
  updateAccountUI();
  updateDashboard();
  renderTabs();
  renderSelectedDetails();
  renderChart();
  renderSettingsList();
}

function updateAccountUI() {
  if (acc1Btn) acc1Btn.classList.toggle('active', currentAccount === 1);
  if (acc2Btn) acc2Btn.classList.toggle('active', currentAccount === 2);
  if (goalLabelUnitEl) goalLabelUnitEl.innerText = isUSD() ? '($)' : '(원)';
}

// ── Dashboard ────────────────────────────────────────────────
function updateDashboard() {
  let total = 0;
  for (let m = 1; m <= 12; m++) total += getMonthTotal(m);

  if (isUSD()) {
    totalDividendEl.innerText = '$' + total.toFixed(2);
    if (currencyLabelEl) currencyLabelEl.style.display = 'none';
  } else {
    totalDividendEl.innerText = total.toLocaleString();
    if (currencyLabelEl) currencyLabelEl.style.display = '';
  }

  if (goalAmountTextEl) goalAmountTextEl.innerText = isUSD() ? '$' + parseFloat(yearlyGoal).toFixed(2) : yearlyGoal.toLocaleString() + '원';

  const pct = yearlyGoal > 0 ? (total / yearlyGoal) * 100 : 0;
  if (goalPercentEl) goalPercentEl.innerText = `${yearlyGoal > 0 ? pct.toFixed(1) : 0}%`;

  if (goalFillEl) {
    setTimeout(() => {
      goalFillEl.style.width = `${Math.min(pct, 100)}%`;
      if (pct >= 100) {
        goalFillEl.style.background = 'linear-gradient(90deg, #f59e0b, #eab308)';
        goalPercentEl.style.color   = '#f59e0b';
      } else {
        goalFillEl.style.background = 'linear-gradient(90deg, #818cf8, #4f46e5)';
        goalPercentEl.style.color   = 'var(--accent-color)';
      }
    }, 100);
  }
}

function getMonthTotal(month) {
  let total = 0;
  if (dividendData[month]) {
    for (const st in dividendData[month]) {
      if (stocks.includes(st)) total += Number(dividendData[month][st]) || 0;
    }
  }
  return isUSD() ? parseFloat(total.toFixed(2)) : total;
}

// ── Tabs ─────────────────────────────────────────────────────
function renderTabs() {
  monthTabsContainer.innerHTML = '';

  if (viewMode === 'month') {
    monthTabsContainer.className = 'month-tabs';
    for (let m = 1; m <= 12; m++) {
      const btn = document.createElement('button');
      btn.className = `month-tab-btn ${m === currentMonth ? 'active' : ''}`;
      btn.innerText = `${m}월`;
      btn.addEventListener('click', () => { currentMonth = m; renderTabs(); renderSelectedDetails(); });
      monthTabsContainer.appendChild(btn);
    }
  } else {
    monthTabsContainer.className = 'stock-tabs';
    stocks.forEach(stock => {
      let tot = 0;
      for (let m = 1; m <= 12; m++) tot += Number(dividendData[m][stock]) || 0;
      if (isUSD()) tot = parseFloat(tot.toFixed(2));

      const card = document.createElement('div');
      card.className = `stock-tab-card ${stock === currentStock ? 'active' : ''}`;
      card.style.setProperty('--stock-color', getStockColor(stocks.indexOf(stock)));
      card.innerHTML = `
        <span class="st-name">${stock}</span>
        <span class="st-total">${isUSD() ? '$'+tot.toFixed(2) : tot.toLocaleString()+'원'}</span>
      `;
      card.addEventListener('click', () => { currentStock = stock; renderTabs(); renderSelectedDetails(); });
      monthTabsContainer.appendChild(card);
    });
  }
}

// ── Detail Pane ──────────────────────────────────────────────
function renderSelectedDetails() {
  if (!monthDetailContainer) return;
  monthDetailContainer.innerHTML = '';

  const suffix       = isUSD() ? '$' : '원';
  const inputMode    = isUSD() ? 'decimal' : 'numeric';

  if (viewMode === 'month') {
    const hdr = document.createElement('div');
    hdr.className = 'month-total-header';
    hdr.innerHTML = `<h4>${currentMonth}월 상세 내역</h4><span class="total-val" id="current-month-total">${formatTotal(getMonthTotal(currentMonth))}</span>`;
    monthDetailContainer.appendChild(hdr);
    monthDetailContainer.appendChild(document.createElement('hr'));

    const grid = document.createElement('div');
    grid.className = 'dividend-grid';
    stocks.forEach(stock => {
      const row = document.createElement('div');
      row.className = 'input-group';
      row.innerHTML = `
        <span class="input-label" title="${stock}">${stock}</span>
        <div class="input-wrapper">
          <input type="text" inputmode="${inputMode}" data-month="${currentMonth}" data-stock="${stock}"
                 value="${displayInputVal(dividendData[currentMonth][stock])}" placeholder="0">
          <span class="input-suffix">${suffix}</span>
        </div>`;
      grid.appendChild(row);
    });
    monthDetailContainer.appendChild(grid);

  } else {
    let stTot = 0;
    for (let m = 1; m <= 12; m++) stTot += Number(dividendData[m][currentStock]) || 0;
    if (isUSD()) stTot = parseFloat(stTot.toFixed(2));

    const hdr = document.createElement('div');
    hdr.className = 'month-total-header';
    hdr.innerHTML = `<h4>${currentStock} 상세 내역</h4><span class="total-val" id="current-stock-total">${formatTotal(stTot)}</span>`;
    monthDetailContainer.appendChild(hdr);
    monthDetailContainer.appendChild(document.createElement('hr'));

    const grid = document.createElement('div');
    grid.className = 'dividend-grid';
    for (let m = 1; m <= 12; m++) {
      const row = document.createElement('div');
      row.className = 'input-group';
      row.innerHTML = `
        <span class="input-label">${m}월</span>
        <div class="input-wrapper">
          <input type="text" inputmode="${inputMode}" data-month="${m}" data-stock="${currentStock}"
                 value="${displayInputVal(dividendData[m][currentStock])}" placeholder="0">
          <span class="input-suffix">${suffix}</span>
        </div>`;
      grid.appendChild(row);
    }
    monthDetailContainer.appendChild(grid);
  }

  attachInputEvents();
}

function attachInputEvents() {
  monthDetailContainer.querySelectorAll('input').forEach(input => {

    input.addEventListener('focus', function() {
      const raw = this.value.replace(/,/g, '');
      this.value = (raw === '0' || raw === '0.00') ? '' : raw;
    });

    input.addEventListener('blur', function() {
      if (isUSD()) {
        const n = parseFloat(this.value.replace(/[^0-9.]/g, '')) || 0;
        this.value = n === 0 ? '' : n.toFixed(2);
      } else {
        const n = parseInt(this.value.replace(/[^0-9]/g, '')) || 0;
        this.value = n === 0 ? '' : n.toLocaleString();
      }
    });

    input.addEventListener('input', function() {
      if (isUSD()) {
        this.value = this.value.replace(/[^0-9.]/g, '');
        const pts = this.value.split('.');
        if (pts.length > 2) this.value = pts[0] + '.' + pts.slice(1).join('');
      } else {
        this.value = this.value.replace(/[^0-9]/g, '');
      }

      const m = this.dataset.month;
      const s = this.dataset.stock;
      dividendData[m][s] = isUSD() ? (parseFloat(this.value) || 0) : (parseInt(this.value) || 0);
      saveData();

      // Pulse animation
      const grp = this.closest('.input-group');
      if (grp) {
        grp.classList.remove('pulse-anim');
        void grp.offsetWidth;
        grp.classList.add('pulse-anim');
        grp.addEventListener('animationend', () => grp.classList.remove('pulse-anim'), { once: true });
      }

      // Roll total
      if (viewMode === 'month') {
        const lbl = document.getElementById('current-month-total');
        if (lbl) animateCount(lbl, getMonthTotal(m));
      } else {
        let tot = 0;
        for (let tm = 1; tm <= 12; tm++) tot += Number(dividendData[tm][currentStock]) || 0;
        if (isUSD()) tot = parseFloat(tot.toFixed(2));
        const lbl = document.getElementById('current-stock-total');
        if (lbl) animateCount(lbl, tot);
      }

      renderTabs();
      updateDashboard();
      updateChartData();
    });
  });
}

// ── Chart ────────────────────────────────────────────────────
function renderChart() {
  const ctx = document.getElementById('dividendChart').getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, 'rgba(79,70,229,0.9)');
  gradient.addColorStop(1, 'rgba(79,70,229,0.2)');

  const labels = Array.from({length:12}, (_,i) => `${i+1}월`);
  const data   = labels.map((_,i) => getMonthTotal(i+1));

  if (myChart) myChart.destroy();

  myChart = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ label:'월별 배당금', data, backgroundColor: gradient, borderRadius:8, borderWidth:0, hoverBackgroundColor:'#4338ca' }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor:'#ffffff', titleColor:'#0f172a', bodyColor:'#4f46e5',
          titleFont:{ size:14, family:"'Outfit',sans-serif", weight:'bold' },
          bodyFont:{ size:15, family:"'Outfit',sans-serif", weight:'bold' },
          borderColor:'#e2e8f0', borderWidth:1, padding:14, cornerRadius:16, displayColors:false,
          callbacks: { label: ctx => isUSD() ? '$'+ctx.parsed.y.toFixed(2) : ctx.parsed.y.toLocaleString()+' 원' }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color:'#f1f5f9', drawBorder:false },
          ticks: {
            color:'#64748b', font:{ family:"'Outfit',sans-serif", weight:'500' },
            callback: v => isUSD() ? '$'+parseFloat(v).toFixed(2) : (v>=1000 ? (v/1000)+'k' : v)
          }
        },
        x: { grid:{ display:false, drawBorder:false }, ticks:{ color:'#64748b', font:{ family:"'Outfit',sans-serif", weight:'600' } } }
      }
    }
  });
}

function updateChartData() {
  if (!myChart) return;
  myChart.data.datasets[0].data = Array.from({length:12}, (_,i) => getMonthTotal(i+1));
  myChart.update();
}

function animateCount(el, value) {
  el.classList.remove('count-anim');
  void el.offsetWidth;
  el.innerText = formatTotal(value);
  el.classList.add('count-anim');
  el.addEventListener('animationend', () => el.classList.remove('count-anim'), { once: true });
}

// ── Settings ─────────────────────────────────────────────────
function renderSettingsList() {
  stockListEl.innerHTML = '';
  stocks.forEach((stock, idx) => {
    const li = document.createElement('li');
    li.className = 'stock-item';
    li.innerHTML = `
      <span class="stock-name">${stock}</span>
      <button class="delete-btn" data-index="${idx}" title="삭제"><i class="fa-solid fa-trash-can"></i></button>`;
    stockListEl.appendChild(li);
  });

  stockListEl.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const idx = this.dataset.index;
      const del = stocks[idx];
      if (confirm(`'${del}' 종목을 정말 삭제하시겠습니까?`)) {
        stocks.splice(idx, 1);
        saveStocks();
        renderSettingsList();
        renderApp();
      }
    });
  });
}

// ── Event Listeners ──────────────────────────────────────────
function setupEventListeners() {
  // Year selector
  if (yearSelectorEl) {
    yearSelectorEl.addEventListener('change', e => {
      currentYear  = parseInt(e.target.value);
      currentStock = '';
      loadData();
    });
  }

  // Account toggle
  if (acc1Btn) {
    acc1Btn.addEventListener('click', () => {
      if (currentAccount === 1) return;
      currentAccount = 1;
      currentStock   = '';
      yearlyGoal     = 5000000;
      loadData();
    });
  }
  if (acc2Btn) {
    acc2Btn.addEventListener('click', () => {
      if (currentAccount === 2) return;
      currentAccount = 2;
      currentStock   = '';
      yearlyGoal     = 100;
      loadData();
    });
  }

  // View mode toggles
  if (viewMonthBtn) {
    viewMonthBtn.addEventListener('click', () => {
      viewMode = 'month';
      viewMonthBtn.classList.add('active');
      viewStockBtn.classList.remove('active');
      renderTabs(); renderSelectedDetails();
    });
  }
  if (viewStockBtn) {
    viewStockBtn.addEventListener('click', () => {
      viewMode = 'stock';
      if (!currentStock && stocks.length > 0) currentStock = stocks[0];
      viewStockBtn.classList.add('active');
      viewMonthBtn.classList.remove('active');
      renderTabs(); renderSelectedDetails();
    });
  }

  // Modal
  settingsBtn.addEventListener('click', () => {
    if (goalInputEl) {
      if (isUSD()) {
        goalInputEl.value = Math.floor(yearlyGoal); // USD일 경우 소수점 없이 숫자만
      } else {
        goalInputEl.value = parseInt(yearlyGoal).toLocaleString();
      }
    }
    settingsModal.classList.add('show');
  });
  closeModalBtn.addEventListener('click', () => settingsModal.classList.remove('show'));
  settingsModal.addEventListener('click', e => { if (e.target === settingsModal) settingsModal.classList.remove('show'); });

  // Goal save
  if (saveGoalBtn) {
    saveGoalBtn.addEventListener('click', () => {
      const raw = goalInputEl.value.replace(/[^0-9.]/g, '');
      const goal = isUSD() ? parseFloat(raw) : parseInt(raw);
      if (!isNaN(goal) && goal > 0) {
        yearlyGoal = goal;
        saveToFirebase();
        updateDashboard();
        saveGoalBtn.innerText = '저장됨 ✓';
        saveGoalBtn.style.background = '#10b981';
        saveGoalBtn.style.color = '#fff';
        setTimeout(() => {
          saveGoalBtn.innerText = '저장';
          saveGoalBtn.style.background = '#f1f5f9';
          saveGoalBtn.style.color = 'var(--text-primary)';
        }, 2000);
      }
    });

    goalInputEl.addEventListener('input', function() {
      let raw = this.value.replace(/[^0-9.]/g, '');
      if (raw && !isUSD()) {
        const n = parseInt(raw);
        if (!isNaN(n)) this.value = n.toLocaleString();
      } else {
        this.value = raw;
      }
    });
  }

  // Add stock
  addStockForm.addEventListener('submit', e => {
    e.preventDefault();
    const ns = newStockInput.value.trim();
    if (ns && !stocks.includes(ns)) {
      stocks.push(ns);
      if (!currentStock) currentStock = ns;
      newStockInput.value = '';
      saveStocks();
      renderSettingsList();
      renderApp();
    } else if (stocks.includes(ns)) {
      alert('이미 존재하는 종목입니다.');
    }
  });
}

// ── Run ──────────────────────────────────────────────────────
init();
