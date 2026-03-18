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

// Default Data
const defaultStocks = [
  "TIGER S&P500",
  "TIGER 미국배당다우존스",
  "KODEX 미국 나스닥 100",
  "맥쿼리인프라",
  "PLUS 고배당주",
  "SOL 코리아고배당",
  "KODEX 미국배당커버드콜액티브",
  "KODEX 미국AI테크TOP10",
  "RISE 미국테크100데일리고정커버드콜",
  "KODEX 미국AI전력핵심인프라",
  "KODEX 미국시총개미"
];

// State
let stocks = [];
let dividendData = {}; // "1" ~ "12" mapping to stock amounts
let myChart = null;
const CURRENT_YEAR = 2026;
let currentMonth = new Date().getMonth() + 1;
let viewMode = 'month'; // 'month' or 'stock'
let currentStock = '';

// Elements
const totalDividendEl = document.getElementById('total-dividend');
const monthTabsContainer = document.getElementById('month-tabs');
const monthDetailContainer = document.getElementById('month-detail-container');
const viewMonthBtn = document.getElementById('view-month-btn');
const viewStockBtn = document.getElementById('view-stock-btn');
const settingsBtn = document.getElementById('settings-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const settingsModal = document.getElementById('settings-modal');
const stockListEl = document.getElementById('stock-list');
const addStockForm = document.getElementById('add-stock-form');
const newStockInput = document.getElementById('new-stock-input');

// Init
function init() {
  document.getElementById('current-year').innerText = CURRENT_YEAR;
  setupEventListeners();
  loadData();
}

// Load from Firebase
function loadData() {
  const dbRef = db.ref();
  dbRef.child(`divTracker_${CURRENT_YEAR}`).get().then((snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      stocks = data.stocks || [...defaultStocks];
      dividendData = data.dividendData || {};
      for (let i = 1; i <= 12; i++) {
        if (!dividendData[i]) dividendData[i] = {};
      }
    } else {
      stocks = [...defaultStocks];
      for (let i = 1; i <= 12; i++) {
        dividendData[i] = {};
        stocks.forEach(stock => dividendData[i][stock] = 0);
      }
      saveToFirebase();
    }
    if (stocks.length > 0 && !currentStock) currentStock = stocks[0];
    renderApp();
  }).catch((error) => {
    console.error("Firebase fetch error:", error);
    alert("데이터를 가져오는 중 오류가 발생했습니다.");
  });
}

function saveToFirebase() {
  db.ref(`divTracker_${CURRENT_YEAR}`).set({
    stocks: stocks,
    dividendData: dividendData
  });
}

// Save Stocks (wrapper)
function saveStocks() {
  for (let i = 1; i <= 12; i++) {
    if(!dividendData[i]) dividendData[i] = {};
    stocks.forEach(stock => {
      if (dividendData[i][stock] === undefined) {
        dividendData[i][stock] = 0;
      }
    });
  }
  saveToFirebase();
}

// Save Data (wrapper)
function saveData() {
  saveToFirebase();
}

// Render everything
function renderApp() {
  updateDashboard();
  renderTabs();
  renderSelectedDetails();
  renderChart();
  renderSettingsList();
}

function updateDashboard() {
  let yearlyTotal = 0;
  for (let m = 1; m <= 12; m++) {
    yearlyTotal += getMonthTotal(m);
  }
  totalDividendEl.innerText = yearlyTotal.toLocaleString();
}

function getMonthTotal(month) {
  let total = 0;
  if(dividendData[month]) {
    for (const stock in dividendData[month]) {
      // make sure the stock still exists in the list
      if(stocks.includes(stock)) {
          total += Number(dividendData[month][stock]) || 0;
      }
    }
  }
  return total;
}

// Render Tabs (Month or Stock view)
function renderTabs() {
  monthTabsContainer.innerHTML = '';
  
  if (viewMode === 'month') {
    monthTabsContainer.className = 'month-tabs';
    for (let m = 1; m <= 12; m++) {
      const btn = document.createElement('button');
      btn.className = `month-tab-btn ${m === currentMonth ? 'active' : ''}`;
      btn.innerText = `${m}월`;
      btn.addEventListener('click', () => {
        currentMonth = m;
        renderTabs();
        renderSelectedDetails();
      });
      monthTabsContainer.appendChild(btn);
    }
  } else {
    monthTabsContainer.className = 'stock-tabs';
    stocks.forEach(stock => {
      const btn = document.createElement('button');
      btn.className = `stock-tab-btn ${stock === currentStock ? 'active' : ''}`;
      btn.innerText = stock;
      btn.addEventListener('click', () => {
        currentStock = stock;
        renderTabs();
        renderSelectedDetails();
      });
      monthTabsContainer.appendChild(btn);
    });
  }
}

// Render Selected Details pane
function renderSelectedDetails() {
  if (!monthDetailContainer) return;
  monthDetailContainer.innerHTML = '';
  
  if (viewMode === 'month') {
    const monthTotal = getMonthTotal(currentMonth);

    const header = document.createElement('div');
    header.className = 'month-total-header';
    header.innerHTML = `
      <h4>${currentMonth}월 상세 내역</h4>
      <span class="total-val" id="current-month-total">${monthTotal.toLocaleString()}원</span>
    `;
    monthDetailContainer.appendChild(header);

    const hr = document.createElement('hr');
    monthDetailContainer.appendChild(hr);

    const grid = document.createElement('div');
    grid.className = 'dividend-grid';

    stocks.forEach(stock => {
      const val = dividendData[currentMonth][stock] || 0;
      const inputGroup = document.createElement('div');
      inputGroup.className = 'input-group';
      inputGroup.innerHTML = `
        <span class="input-label" title="${stock}">${stock}</span>
        <div class="input-wrapper">
          <input type="text" inputmode="numeric" 
                 data-month="${currentMonth}" data-stock="${stock}" 
                 value="${val === 0 ? '' : val.toLocaleString()}" 
                 placeholder="0">
          <span class="input-suffix">원</span>
        </div>
      `;
      grid.appendChild(inputGroup);
    });

    monthDetailContainer.appendChild(grid);
  } else {
    // Stock View mode
    let stockTotal = 0;
    for (let m = 1; m <= 12; m++) {
       stockTotal += (dividendData[m][currentStock] || 0);
    }

    const header = document.createElement('div');
    header.className = 'month-total-header';
    header.innerHTML = `
      <h4>${currentStock} 상세 내역</h4>
      <span class="total-val" id="current-stock-total">${stockTotal.toLocaleString()}원</span>
    `;
    monthDetailContainer.appendChild(header);

    const hr = document.createElement('hr');
    monthDetailContainer.appendChild(hr);

    const grid = document.createElement('div');
    grid.className = 'dividend-grid';

    for(let m = 1; m <= 12; m++) {
      const val = dividendData[m][currentStock] || 0;
      const inputGroup = document.createElement('div');
      inputGroup.className = 'input-group';
      inputGroup.innerHTML = `
        <span class="input-label">${m}월</span>
        <div class="input-wrapper">
          <input type="text" inputmode="numeric" 
                 data-month="${m}" data-stock="${currentStock}" 
                 value="${val === 0 ? '' : val.toLocaleString()}" 
                 placeholder="0">
          <span class="input-suffix">원</span>
        </div>
      `;
      grid.appendChild(inputGroup);
    }
    monthDetailContainer.appendChild(grid);
  }

  // Attach input events
  const inputs = monthDetailContainer.querySelectorAll('input');
  inputs.forEach(input => {
    input.addEventListener('focus', function() {
        const raw = this.value.replace(/,/g, '');
        this.value = raw === '0' ? '' : raw;
    });

    input.addEventListener('blur', function() {
        let raw = this.value.replace(/,/g, '');
        if(!raw || isNaN(raw)) raw = 0;
        else raw = parseInt(raw);
        
        this.value = raw === 0 ? '' : raw.toLocaleString();
    });

    input.addEventListener('input', function(e) {
        this.value = this.value.replace(/[^0-9]/g, '');
        
        const m = this.dataset.month;
        const s = this.dataset.stock;
        let amount = parseInt(this.value) || 0;
        
        dividendData[m][s] = amount;
        saveData();
        
        if (viewMode === 'month') {
          const mLabel = document.getElementById('current-month-total');
          if (mLabel) mLabel.innerText = getMonthTotal(m).toLocaleString() + '원';
        } else {
          let stTotal = 0;
          for(let tm=1; tm<=12; tm++) stTotal += (dividendData[tm][currentStock] || 0);
          const sLabel = document.getElementById('current-stock-total');
          if (sLabel) sLabel.innerText = stTotal.toLocaleString() + '원';
        }
        
        updateDashboard();
        updateChartData();
    });
  });
}

// Render Chart
function renderChart() {
  const ctx = document.getElementById('dividendChart').getContext('2d');
  
  // gradient for bars
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, 'rgba(16, 185, 129, 0.8)'); // emerald
  gradient.addColorStop(1, 'rgba(16, 185, 129, 0.2)');

  const labels = Array.from({length: 12}, (_, i) => `${i+1}월`);
  const data = labels.map((_, i) => getMonthTotal(i + 1));

  if(myChart) {
    myChart.destroy();
  }

  myChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: '월별 배당금',
        data: data,
        backgroundColor: gradient,
        borderRadius: 8,
        borderWidth: 0,
        hoverBackgroundColor: '#a7f3d0'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          titleFont: { size: 14, family: "'Outfit', sans-serif" },
          bodyFont: { size: 14, family: "'Outfit', sans-serif" },
          padding: 12,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            label: function(context) {
              return context.parsed.y.toLocaleString() + ' 원';
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
          ticks: {
            color: '#cbd5e1',
            font: { family: "'Outfit', sans-serif" },
            callback: function(value) {
              return value >= 1000 ? (value/1000) + 'k' : value;
            }
          }
        },
        x: {
          grid: { display: false, drawBorder: false },
          ticks: { color: '#cbd5e1', font: { family: "'Outfit', sans-serif" } }
        }
      }
    }
  });
}

function updateChartData() {
  if(!myChart) return;
  const newData = Array.from({length: 12}, (_, i) => getMonthTotal(i + 1));
  myChart.data.datasets[0].data = newData;
  myChart.update();
}

// Settings Modal Logic
function renderSettingsList() {
  stockListEl.innerHTML = '';
  stocks.forEach((stock, index) => {
    const li = document.createElement('li');
    li.className = 'stock-item';
    li.innerHTML = `
      <span class="stock-name">${stock}</span>
      <button class="delete-btn" data-index="${index}" title="삭제">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    `;
    stockListEl.appendChild(li);
  });

  // Delete event listeners
  const deleteBtns = stockListEl.querySelectorAll('.delete-btn');
  deleteBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const idx = this.dataset.index;
      const deletedStock = stocks[idx];
      
      // confirm delete
      if(confirm(`'${deletedStock}' 종목을 정말 삭제하시겠습니까? 입력된 배당금 내역도 함께 보이지 않게 됩니다.`)) {
        stocks.splice(idx, 1);
        saveStocks();
        renderSettingsList();
        renderApp(); // re-render the whole app to reflect state change
      }
    });
  });
}

function setupEventListeners() {
  // View mode toggles
  if(viewMonthBtn) {
    viewMonthBtn.addEventListener('click', () => {
      viewMode = 'month';
      viewMonthBtn.classList.add('active');
      viewStockBtn.classList.remove('active');
      renderTabs();
      renderSelectedDetails();
    });
  }
  
  if(viewStockBtn) {
    viewStockBtn.addEventListener('click', () => {
      viewMode = 'stock';
      if (!currentStock && stocks.length > 0) currentStock = stocks[0];
      viewStockBtn.classList.add('active');
      viewMonthBtn.classList.remove('active');
      renderTabs();
      renderSelectedDetails();
    });
  }

  // Modal toggle
  settingsBtn.addEventListener('click', () => {
    settingsModal.classList.add('show');
  });

  closeModalBtn.addEventListener('click', () => {
    settingsModal.classList.remove('show');
  });

  // Close modal when clicking outside
  settingsModal.addEventListener('click', (e) => {
    if(e.target === settingsModal) {
        settingsModal.classList.remove('show');
    }
  });

  // Add stock
  addStockForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newStock = newStockInput.value.trim();
    if(newStock && !stocks.includes(newStock)) {
      stocks.push(newStock);
      if(!currentStock) currentStock = newStock;
      newStockInput.value = '';
      saveStocks();
      renderSettingsList();
      renderApp();
    } else if (stocks.includes(newStock)) {
        alert('이미 존재하는 종목입니다.');
    }
  });
}

// Run app
init();
