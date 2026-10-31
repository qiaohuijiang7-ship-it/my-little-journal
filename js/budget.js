/**
 * MY LITTLE JOURNAL - Budget Manager
 * Tracks total & category budgets, spent/remaining amounts, percentage bars, and gentle alerts.
 */

const Budget = (() => {
  const getStorage = () => window.JournalStorage;

  return {
    init() {
      this.initModal();
    },

    initModal() {
      const editBtn = document.getElementById('edit-budget-btn');
      const modal = document.getElementById('budget-modal');
      const closeBtn = document.getElementById('close-budget-modal');
      const form = document.getElementById('budget-form');

      if (editBtn && modal) {
        editBtn.addEventListener('click', () => {
          this.openEditModal();
          if (typeof window.Sound !== 'undefined') window.Sound.playPop();
        });
      }

      if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => {
          modal.classList.remove('active');
          if (typeof window.Sound !== 'undefined') window.Sound.playPop();
        });
      }

      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            modal.classList.remove('active');
          }
        });
      }

      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          this.saveBudgetFromForm();
        });
      }
    },

    openEditModal() {
      const modal = document.getElementById('budget-modal');
      const currentBudget = getStorage().getBudget();

      const totalInput = document.getElementById('modal-budget-total');
      if (totalInput) totalInput.value = currentBudget.monthlyTotal;

      const catInputsContainer = document.getElementById('modal-category-budgets');
      if (catInputsContainer) {
        catInputsContainer.innerHTML = '';
        const cats = window.Records.getCategories().expense;

        cats.forEach(c => {
          const val = currentBudget.categories[c.id] ?? 0;
          const row = document.createElement('div');
          row.className = 'budget-input-row';
          row.innerHTML = `
            <label class="budget-cat-label">${c.icon} ${c.id}</label>
            <div class="input-with-currency">
              <input type="number" min="0" step="50" class="journal-input cat-budget-input" data-category="${c.id}" value="${val}">
            </div>
          `;
          catInputsContainer.appendChild(row);
        });
      }

      if (modal) modal.classList.add('active');
    },

    saveBudgetFromForm() {
      const totalInput = document.getElementById('modal-budget-total');
      const catInputs = document.querySelectorAll('.cat-budget-input');

      const total = parseFloat(totalInput.value) || 0;
      const categories = {};

      catInputs.forEach(input => {
        const cat = input.dataset.category;
        categories[cat] = Math.max(0, parseFloat(input.value) || 0);
      });

      const updated = {
        monthlyTotal: total,
        categories: categories
      };

      getStorage().saveBudget(updated);
      if (typeof window.Sound !== 'undefined') window.Sound.playSuccess();

      const modal = document.getElementById('budget-modal');
      if (modal) modal.classList.remove('active');

      if (typeof window.App !== 'undefined') {
        window.App.notifyDataChanged();
      }
    },

    render() {
      const budgetData = getStorage().getBudget();
      const records = getStorage().getRecords();
      const settings = getStorage().getSettings();
      const currency = settings.currency || 'NT$';

      const today = new Date();
      const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      const monthExpenses = records.filter(r => r.type === 'expense' && r.date && r.date.startsWith(currentMonthKey));

      const totalSpent = monthExpenses.reduce((sum, r) => sum + r.amount, 0);
      const totalBudget = budgetData.monthlyTotal || 0;
      const remainingBudget = totalBudget - totalSpent;
      const usagePercent = totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : 0;

      const totalBudgetEl = document.getElementById('budget-total-val');
      const spentBudgetEl = document.getElementById('budget-spent-val');
      const remainingBudgetEl = document.getElementById('budget-remaining-val');
      const percentBadgeEl = document.getElementById('budget-percent-badge');
      const progressFillEl = document.getElementById('budget-progress-fill');
      const alertBannerEl = document.getElementById('budget-alert-banner');

      if (totalBudgetEl) totalBudgetEl.textContent = `${currency} ${totalBudget.toLocaleString()}`;
      if (spentBudgetEl) spentBudgetEl.textContent = `${currency} ${totalSpent.toLocaleString()}`;
      if (remainingBudgetEl) {
        remainingBudgetEl.textContent = `${remainingBudget >= 0 ? '' : '-'}${currency} ${Math.abs(remainingBudget).toLocaleString()}`;
        remainingBudgetEl.className = `stat-num ${remainingBudget < 0 ? 'text-negative' : 'text-positive'}`;
      }
      if (percentBadgeEl) percentBadgeEl.textContent = `${usagePercent}%`;

      if (progressFillEl) {
        const visualWidth = Math.min(100, Math.max(0, usagePercent));
        progressFillEl.style.width = `${visualWidth}%`;
        if (usagePercent >= 100) {
          progressFillEl.style.backgroundColor = '#E57373';
        } else if (usagePercent >= 80) {
          progressFillEl.style.backgroundColor = '#F6BD60';
        } else {
          progressFillEl.style.backgroundColor = '#F4B8CD';
        }
      }

      if (alertBannerEl) {
        if (usagePercent >= 100) {
          alertBannerEl.className = 'budget-alert-card alert-exceeded';
          alertBannerEl.innerHTML = `
            <div class="alert-icon">🚨</div>
            <div class="alert-text">
              <strong>本月已超出預算 ${currency} ${Math.abs(remainingBudget).toLocaleString()}</strong>
              <span>給小錢包喘口氣吧 ♡ 記得留意不必要的額外支出喔！</span>
            </div>
          `;
          alertBannerEl.style.display = 'flex';
        } else if (usagePercent >= 80) {
          alertBannerEl.className = 'budget-alert-card alert-warning';
          alertBannerEl.innerHTML = `
            <div class="alert-icon">⚠️</div>
            <div class="alert-text">
              <strong>預算使用已達 ${usagePercent}% 囉！</strong>
              <span>本月剩餘可用 ${currency} ${remainingBudget.toLocaleString()}，請溫柔守護錢包君~ 🌸</span>
            </div>
          `;
          alertBannerEl.style.display = 'flex';
        } else {
          alertBannerEl.className = 'budget-alert-card alert-good';
          alertBannerEl.innerHTML = `
            <div class="alert-icon">💖</div>
            <div class="alert-text">
              <strong>預算控制良好！使用率 ${usagePercent}%</strong>
              <span>太棒了~ 按照這個步調，就能存下夢想資金囉！✨</span>
            </div>
          `;
          alertBannerEl.style.display = 'flex';
        }
      }

      this.renderCategoryBudgets(budgetData.categories, monthExpenses, currency);
    },

    renderCategoryBudgets(categoryBudgets, monthExpenses, currency) {
      const container = document.getElementById('category-budget-list');
      if (!container) return;

      const expenseCats = window.Records.getCategories().expense;
      container.innerHTML = '';

      expenseCats.forEach(cat => {
        const catSpent = monthExpenses.filter(r => r.category === cat.id).reduce((s, r) => s + r.amount, 0);
        const catLimit = categoryBudgets[cat.id] || 0;
        const catPercent = catLimit > 0 ? Math.round((catSpent / catLimit) * 100) : (catSpent > 0 ? 100 : 0);
        const remaining = catLimit - catSpent;

        let statusClass = 'status-normal';
        let barColor = cat.color || '#EBCAD9';

        if (catLimit > 0) {
          if (catPercent >= 100) {
            statusClass = 'status-over';
            barColor = '#FF8A8A';
          } else if (catPercent >= 80) {
            statusClass = 'status-warn';
            barColor = '#F4A261';
          }
        }

        const card = document.createElement('div');
        card.className = `cat-budget-card ${statusClass}`;
        card.innerHTML = `
          <div class="cat-budget-header">
            <div class="cat-title">
              <span class="cat-icon-badge">${cat.icon}</span>
              <span class="cat-label">${cat.id}</span>
            </div>
            <div class="cat-pct-badge">${catLimit > 0 ? `${catPercent}%` : '未設限'}</div>
          </div>
          <div class="cat-budget-body">
            <div class="cat-amounts">
              <span>已花費: <strong>${currency} ${catSpent.toLocaleString()}</strong></span>
              <span class="cat-limit-sub">${catLimit > 0 ? `預算: ${currency} ${catLimit.toLocaleString()}` : '無預算上限'}</span>
            </div>
            <div class="cat-bar-container">
              <div class="cat-bar-fill" style="width: ${Math.min(100, catPercent)}%; background-color: ${barColor};"></div>
            </div>
            <div class="cat-footer-sub">
              ${catLimit > 0 ? (
                remaining >= 0 ? `剩餘 ${currency} ${remaining.toLocaleString()}` : `超出 ${currency} ${Math.abs(remaining).toLocaleString()} ⚠️`
              ) : `累積支出 ${currency} ${catSpent.toLocaleString()}`}
            </div>
          </div>
        `;
        container.appendChild(card);
      });
    }
  };
})();

// Attach to window
window.Budget = Budget;
