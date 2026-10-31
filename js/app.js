/**
 * MY LITTLE JOURNAL - Core Application Controller
 * Handles Navigation, Home Dashboard, Charts, and Cross-Module Synchronization.
 */

const App = (() => {
  let homeCharts = {};

  const getStorage = () => window.JournalStorage;

  const destroyHomeCharts = () => {
    if (homeCharts.summary) {
      homeCharts.summary.destroy();
      delete homeCharts.summary;
    }
    if (homeCharts.category) {
      homeCharts.category.destroy();
      delete homeCharts.category;
    }
  };

  return {
    init() {
      // Initialize sub-modules
      if (typeof window.Sound !== 'undefined') window.Sound.init();
      if (typeof window.Cursor !== 'undefined') window.Cursor.init();
      if (typeof window.Pet !== 'undefined') window.Pet.init();
      if (typeof window.Records !== 'undefined') window.Records.init();
      if (typeof window.Recurring !== 'undefined') window.Recurring.init();
      if (typeof window.Statistics !== 'undefined') window.Statistics.init();
      if (typeof window.Budget !== 'undefined') window.Budget.init();
      if (typeof window.Settings !== 'undefined') window.Settings.init();

      // Navigation events
      this.initNavigation();

      // Render initial Home view
      this.notifyDataChanged();

      // Default date display in top banner
      this.renderTopBannerDate();
    },

    renderTopBannerDate() {
      const dateEl = document.getElementById('current-date-badge');
      if (dateEl) {
        const today = new Date();
        const y = today.getFullYear();
        const m = today.getMonth() + 1;
        const d = today.getDate();
        const dayNames = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        const dayName = dayNames[today.getDay()];
        dateEl.textContent = `🌸 ${y}年${m}月${d}日 ${dayName}`;
      }
    },

    initNavigation() {
      const navLinks = document.querySelectorAll('.nav-link');
      navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const targetPage = link.dataset.page;
          if (targetPage) {
            this.navigateTo(targetPage);
            if (typeof window.Sound !== 'undefined') window.Sound.playPop();
          }
        });
      });

      const quickRecordBtn = document.getElementById('home-quick-record-btn');
      if (quickRecordBtn) {
        quickRecordBtn.addEventListener('click', () => {
          this.navigateTo('record');
          if (typeof window.Sound !== 'undefined') window.Sound.playPop();
        });
      }
    },

    navigateTo(pageId) {
      document.querySelectorAll('.nav-link').forEach(link => {
        if (link.dataset.page === pageId) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });

      document.querySelectorAll('.app-page').forEach(page => {
        if (page.id === `page-${pageId}`) {
          page.classList.add('active');
        } else {
          page.classList.remove('active');
        }
      });

      if (pageId === 'home') {
        this.renderHome();
      } else if (pageId === 'recurring') {
        if (typeof window.Recurring !== 'undefined') window.Recurring.render();
      } else if (pageId === 'history') {
        window.Records.populateHistoryMonths();
        window.Records.populateHistoryCategoryOptions();
        window.Records.renderHistory();
      } else if (pageId === 'statistics') {
        window.Statistics.render();
      } else if (pageId === 'budget') {
        window.Budget.render();
      } else if (pageId === 'settings') {
        window.Settings.populateForm();
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    notifyDataChanged() {
      this.renderHome();
      if (typeof window.Records !== 'undefined') {
        window.Records.populateHistoryMonths();
        window.Records.renderHistory();
      }
      if (typeof window.Recurring !== 'undefined') {
        window.Recurring.render();
      }
      if (typeof window.Statistics !== 'undefined') {
        window.Statistics.render();
      }
      if (typeof window.Budget !== 'undefined') {
        window.Budget.render();
      }
      if (typeof window.Settings !== 'undefined') {
        window.Settings.populateForm();
      }
    },

    renderHome() {
      const records = getStorage().getRecords();
      const budget = getStorage().getBudget();
      const settings = getStorage().getSettings();
      const currency = settings.currency || 'NT$';

      const today = new Date();
      const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      const monthRecords = records.filter(r => r.date && r.date.startsWith(currentMonthKey));
      const monthExpenses = monthRecords.filter(r => r.type === 'expense');
      const monthIncomes = monthRecords.filter(r => r.type === 'income');

      const totalIncome = monthIncomes.reduce((sum, r) => sum + r.amount, 0);
      const totalExpense = monthExpenses.reduce((sum, r) => sum + r.amount, 0);
      const netBalance = totalIncome - totalExpense;

      const todayExpense = records
        .filter(r => r.type === 'expense' && r.date === todayStr)
        .reduce((sum, r) => sum + r.amount, 0);

      const totalBudget = budget.monthlyTotal || 25000;
      const budgetPercent = totalBudget > 0 ? ((totalExpense / totalBudget) * 100).toFixed(0) : 0;

      const incEl = document.getElementById('home-month-income');
      const expEl = document.getElementById('home-month-expense');
      const balEl = document.getElementById('home-current-balance');
      const todayEl = document.getElementById('home-today-expense');
      const budgetPctEl = document.getElementById('home-budget-percent');
      const budgetBarEl = document.getElementById('home-budget-bar');

      if (incEl) incEl.textContent = `+${currency} ${totalIncome.toLocaleString()}`;
      if (expEl) expEl.textContent = `-${currency} ${totalExpense.toLocaleString()}`;
      if (balEl) {
        balEl.textContent = `${netBalance >= 0 ? '+' : ''}${currency} ${netBalance.toLocaleString()}`;
        balEl.className = `kpi-value ${netBalance >= 0 ? 'text-positive' : 'text-negative'}`;
      }
      if (todayEl) todayEl.textContent = `${currency} ${todayExpense.toLocaleString()}`;
      if (budgetPctEl) budgetPctEl.textContent = `${budgetPercent}%`;
      if (budgetBarEl) {
        budgetBarEl.style.width = `${Math.min(100, Math.max(0, budgetPercent))}%`;
        if (budgetPercent >= 100) {
          budgetBarEl.style.backgroundColor = '#E57373';
        } else if (budgetPercent >= 80) {
          budgetBarEl.style.backgroundColor = '#F6BD60';
        } else {
          budgetBarEl.style.backgroundColor = '#F4B8CD';
        }
      }

      this.renderHomeRecentTransactions(records, currency);
      this.renderHomeCharts(monthIncomes, monthExpenses, totalIncome, totalExpense);
    },

    renderHomeRecentTransactions(records, currency) {
      const container = document.getElementById('home-recent-list');
      if (!container) return;

      const sorted = [...records].sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime() || (b.createdAt || 0) - (a.createdAt || 0);
      });

      const recentFive = sorted.slice(0, 5);

      if (recentFive.length === 0) {
        container.innerHTML = `
          <div class="empty-journal-placeholder mini">
            <div class="empty-icon">📖</div>
            <p class="empty-title">手帳還空空的呢~</p>
            <p class="empty-subtitle">點擊右上角「記一筆」，開始你的第一筆日常紀錄吧！</p>
          </div>
        `;
        return;
      }

      container.innerHTML = '';
      recentFive.forEach(rec => {
        const isIncome = rec.type === 'income';
        const icon = window.Records.getCategoryIcon(rec.category, rec.type);
        const itemEl = document.createElement('div');
        itemEl.className = `transaction-item ${isIncome ? 'item-income' : 'item-expense'}`;

        itemEl.innerHTML = `
          <div class="item-left">
            <div class="item-icon-box">${icon}</div>
            <div class="item-meta">
              <div class="item-category-tag">${rec.category} <span class="item-date-sub">${rec.date}</span></div>
              <div class="item-note">${rec.note ? escapeHtml(rec.note) : '<span class="note-empty">無備註</span>'}</div>
            </div>
          </div>
          <div class="item-right">
            <div class="item-amount ${isIncome ? 'amount-income' : 'amount-expense'}">
              ${isIncome ? '+' : '-'}${currency} ${rec.amount.toLocaleString()}
            </div>
            <div class="item-actions">
              <button class="action-btn edit-btn" title="編輯" onclick="window.Records.editRecord('${rec.id}')">✏️</button>
              <button class="action-btn delete-btn" title="刪除" onclick="window.Records.deleteRecord('${rec.id}')">🗑️</button>
            </div>
          </div>
        `;
        container.appendChild(itemEl);
      });
    },

    renderHomeCharts(monthIncomes, monthExpenses, totalIncome, totalExpense) {
      destroyHomeCharts();

      const summaryCanvas = document.getElementById('home-chart-summary');
      if (summaryCanvas && typeof Chart !== 'undefined') {
        const ctx = summaryCanvas.getContext('2d');
        homeCharts.summary = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['本月收入', '本月支出'],
            datasets: [{
              data: [totalIncome, totalExpense],
              backgroundColor: ['#D8C5E8', '#F4B8CD'],
              borderRadius: 8,
              borderSkipped: false
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: 'rgba(255, 253, 251, 0.95)',
                titleColor: '#514452',
                bodyColor: '#8C7187',
                borderColor: '#EBCAD9',
                borderWidth: 1.5,
                padding: 8,
                callbacks: {
                  label: (ctx) => {
                    const currency = getStorage().getSettings().currency || 'NT$';
                    return ` ${currency} ${ctx.raw.toLocaleString()}`;
                  }
                }
              }
            },
            scales: {
              x: {
                grid: { display: false },
                ticks: { color: '#514452', font: { family: "'Zen Maru Gothic', sans-serif", size: 12 } }
              },
              y: {
                grid: { color: 'rgba(140, 113, 135, 0.08)' },
                ticks: { color: '#8C7187', font: { size: 10 } }
              }
            }
          }
        });
      }

      const categoryCanvas = document.getElementById('home-chart-category');
      const catEmptyEl = document.getElementById('home-cat-empty');
      if (categoryCanvas) {
        const catTotals = {};
        monthExpenses.forEach(r => {
          catTotals[r.category] = (catTotals[r.category] || 0) + r.amount;
        });

        const labels = Object.keys(catTotals);
        const data = Object.values(catTotals);

        if (labels.length === 0 || totalExpense === 0) {
          categoryCanvas.style.display = 'none';
          if (catEmptyEl) catEmptyEl.style.display = 'flex';
        } else {
          categoryCanvas.style.display = 'block';
          if (catEmptyEl) catEmptyEl.style.display = 'none';

          if (typeof Chart !== 'undefined') {
            const ctx = categoryCanvas.getContext('2d');
            const colors = ['#F4B8CD', '#D8C5E8', '#C9D9EA', '#EBCAD9', '#BDE0FE', '#FFE5D9', '#D0F4DE', '#FFC6FF'];
            homeCharts.category = new Chart(ctx, {
              type: 'doughnut',
              data: {
                labels: labels,
                datasets: [{
                  data: data,
                  backgroundColor: colors.slice(0, labels.length),
                  borderColor: '#FFFFFF',
                  borderWidth: 2
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      boxWidth: 10,
                      padding: 6,
                      font: { family: "'Zen Maru Gothic', sans-serif", size: 11 },
                      color: '#514452'
                    }
                  },
                  tooltip: {
                    backgroundColor: 'rgba(255, 253, 251, 0.95)',
                    titleColor: '#514452',
                    bodyColor: '#8C7187',
                    borderColor: '#EBCAD9',
                    borderWidth: 1.5,
                    padding: 8
                  }
                },
                cutout: '65%'
              }
            });
          }
        }
      }
    }
  };

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
})();

// Attach to window
window.App = App;

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
