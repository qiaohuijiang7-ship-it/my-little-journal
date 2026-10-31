/**
 * MY LITTLE JOURNAL - Records & History Manager
 * Handles Record Form, Category Switcher, List Rendering, Filtering, Editing & Deleting.
 */

const Records = (() => {
  const CATEGORIES = {
    expense: [
      { id: '餐飲', icon: '🍰', color: '#F9D5E5' },
      { id: '交通', icon: '🚃', color: '#C9D9EA' },
      { id: '購物', icon: '🛍️', color: '#EBCAD9' },
      { id: '娛樂', icon: '🎀', color: '#D8C5E8' },
      { id: '生活用品', icon: '🫧', color: '#BDE0FE' },
      { id: '學習', icon: '📚', color: '#FDE2E4' },
      { id: '醫療', icon: '💊', color: '#E2ECE9' },
      { id: '其他', icon: '🕊️', color: '#DFE7FD' }
    ],
    income: [
      { id: '薪資', icon: '💼', color: '#D8C5E8' },
      { id: '零用錢', icon: '👛', color: '#F9D5E5' },
      { id: '獎金', icon: '🎁', color: '#FFF3B0' },
      { id: '兼職收入', icon: '☕', color: '#C9D9EA' },
      { id: '其他', icon: '✨', color: '#EBCAD9' }
    ]
  };

  let currentType = 'expense';
  let selectedCategory = '餐飲';
  let editingRecordId = null;

  let historyFilters = {
    month: '',
    type: 'all',
    category: 'all',
    search: '',
    sort: 'date-desc'
  };

  const getStorage = () => window.JournalStorage;

  const getCategoryIcon = (category, type = 'expense') => {
    const list = CATEGORIES[type] || CATEGORIES.expense;
    const found = list.find(c => c.id === category);
    if (found) return found.icon;
    const foundOther = CATEGORIES.income.find(c => c.id === category);
    return foundOther ? foundOther.icon : '🌸';
  };

  return {
    init() {
      this.initForm();
      this.initCategorySelector();
      this.initHistoryFilters();
      this.renderCategories();
      this.setDefaultDate();
    },

    initCategorySelector() {},

    setDefaultDate() {
      const dateInput = document.getElementById('record-date');
      if (dateInput && !dateInput.value) {
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        dateInput.value = `${y}-${m}-${d}`;
      }
    },

    initForm() {
      const typeExpenseBtn = document.getElementById('type-expense-btn');
      const typeIncomeBtn = document.getElementById('type-income-btn');

      if (typeExpenseBtn && typeIncomeBtn) {
        typeExpenseBtn.addEventListener('click', () => {
          this.switchType('expense');
          if (typeof window.Sound !== 'undefined') window.Sound.playPop();
        });
        typeIncomeBtn.addEventListener('click', () => {
          this.switchType('income');
          if (typeof window.Sound !== 'undefined') window.Sound.playPop();
        });
      }

      const quickBtns = document.querySelectorAll('.quick-amount-btn');
      quickBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const val = parseFloat(btn.dataset.amount || 0);
          const amountInput = document.getElementById('record-amount');
          if (amountInput) {
            const current = parseFloat(amountInput.value) || 0;
            amountInput.value = current + val;
            if (typeof window.Sound !== 'undefined') window.Sound.playPop();
          }
        });
      });

      const tagBtns = document.querySelectorAll('.quick-tag-chip');
      tagBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const tag = btn.dataset.tag;
          const noteInput = document.getElementById('record-note');
          if (noteInput && tag) {
            if (noteInput.value) {
              noteInput.value += ' ' + tag;
            } else {
              noteInput.value = tag;
            }
            if (typeof window.Sound !== 'undefined') window.Sound.playPop();
          }
        });
      });

      const form = document.getElementById('record-form');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleFormSubmit();
        });
      }

      const cancelEditBtn = document.getElementById('cancel-edit-btn');
      if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', () => {
          this.resetForm();
          if (typeof window.Sound !== 'undefined') window.Sound.playPop();
        });
      }
    },

    switchType(type) {
      currentType = type;
      const typeExpenseBtn = document.getElementById('type-expense-btn');
      const typeIncomeBtn = document.getElementById('type-income-btn');

      if (type === 'expense') {
        typeExpenseBtn.classList.add('active');
        typeIncomeBtn.classList.remove('active');
        selectedCategory = CATEGORIES.expense[0].id;
      } else {
        typeIncomeBtn.classList.add('active');
        typeExpenseBtn.classList.remove('active');
        selectedCategory = CATEGORIES.income[0].id;
      }

      this.renderCategories();
    },

    renderCategories() {
      const container = document.getElementById('category-grid');
      if (!container) return;

      const list = CATEGORIES[currentType];
      container.innerHTML = '';

      list.forEach(cat => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = `category-card-btn ${cat.id === selectedCategory ? 'selected' : ''}`;
        item.innerHTML = `
          <span class="cat-icon">${cat.icon}</span>
          <span class="cat-name">${cat.id}</span>
        `;
        item.addEventListener('click', () => {
          selectedCategory = cat.id;
          document.querySelectorAll('.category-card-btn').forEach(b => b.classList.remove('selected'));
          item.classList.add('selected');
          if (typeof window.Sound !== 'undefined') window.Sound.playPop();
        });
        container.appendChild(item);
      });
    },

    handleFormSubmit() {
      const amountInput = document.getElementById('record-amount');
      const dateInput = document.getElementById('record-date');
      const noteInput = document.getElementById('record-note');

      const amount = parseFloat(amountInput.value);
      if (isNaN(amount) || amount <= 0) {
        alert('請輸入大於 0 的金額喔！♡');
        amountInput.focus();
        return;
      }

      const date = dateInput.value;
      if (!date) {
        alert('請選擇日期喔！🌸');
        dateInput.focus();
        return;
      }

      const note = noteInput.value.trim();

      const recordData = {
        type: currentType,
        amount: amount,
        category: selectedCategory,
        date: date,
        note: note
      };

      if (editingRecordId) {
        getStorage().updateRecord(editingRecordId, recordData);
        if (typeof window.Sound !== 'undefined') window.Sound.playSuccess();
        alert('✨ 手帳紀錄修改成功！');
      } else {
        getStorage().addRecord(recordData);
        if (typeof window.Sound !== 'undefined') window.Sound.playSuccess();
        if (typeof window.Pet !== 'undefined') window.Pet.greetNewRecord();
      }

      this.resetForm();

      if (typeof window.App !== 'undefined') {
        window.App.notifyDataChanged();
        if (editingRecordId) {
          window.App.navigateTo('history');
        }
      }
      editingRecordId = null;
    },

    editRecord(id) {
      const rec = getStorage().getRecordById(id);
      if (!rec) return;

      editingRecordId = id;

      if (typeof window.App !== 'undefined') {
        window.App.navigateTo('record');
      }

      this.switchType(rec.type);
      selectedCategory = rec.category;
      this.renderCategories();

      const amountInput = document.getElementById('record-amount');
      const dateInput = document.getElementById('record-date');
      const noteInput = document.getElementById('record-note');
      const formTitle = document.getElementById('record-form-title');
      const submitBtn = document.getElementById('record-submit-btn');
      const cancelBtn = document.getElementById('cancel-edit-btn');

      if (amountInput) amountInput.value = rec.amount;
      if (dateInput) dateInput.value = rec.date;
      if (noteInput) noteInput.value = rec.note || '';

      if (formTitle) formTitle.textContent = '✏️ 編輯手帳紀錄';
      if (submitBtn) submitBtn.innerHTML = '✨ 更新紀錄';
      if (cancelBtn) cancelBtn.style.display = 'inline-flex';

      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    deleteRecord(id) {
      const rec = getStorage().getRecordById(id);
      if (!rec) return;

      const currency = getStorage().getSettings().currency || 'NT$';
      const confirmDelete = confirm(`確定要刪除這筆紀錄嗎？\n\n【${rec.category}】${rec.type === 'income' ? '收入' : '支出'} ${currency} ${rec.amount.toLocaleString()} (${rec.date})\n此操作無法復原喔！`);
      if (!confirmDelete) return;

      getStorage().deleteRecord(id);
      if (typeof window.Sound !== 'undefined') window.Sound.playDelete();

      if (typeof window.App !== 'undefined') {
        window.App.notifyDataChanged();
      }
    },

    resetForm() {
      editingRecordId = null;
      const form = document.getElementById('record-form');
      if (form) form.reset();
      this.setDefaultDate();

      const formTitle = document.getElementById('record-form-title');
      const submitBtn = document.getElementById('record-submit-btn');
      const cancelBtn = document.getElementById('cancel-edit-btn');

      if (formTitle) formTitle.textContent = '✨ 新增記帳紀錄';
      if (submitBtn) submitBtn.innerHTML = '✨ 保存到手帳';
      if (cancelBtn) cancelBtn.style.display = 'none';

      this.switchType('expense');
    },

    initHistoryFilters() {
      const monthSelect = document.getElementById('history-month-select');
      const typeSelect = document.getElementById('history-type-select');
      const catSelect = document.getElementById('history-category-select');
      const searchInput = document.getElementById('history-search-input');
      const sortSelect = document.getElementById('history-sort-select');

      if (monthSelect) {
        monthSelect.addEventListener('change', () => {
          historyFilters.month = monthSelect.value;
          this.renderHistory();
          if (typeof window.Sound !== 'undefined') window.Sound.playPop();
        });
      }
      if (typeSelect) {
        typeSelect.addEventListener('change', () => {
          historyFilters.type = typeSelect.value;
          this.populateHistoryCategoryOptions();
          this.renderHistory();
          if (typeof window.Sound !== 'undefined') window.Sound.playPop();
        });
      }
      if (catSelect) {
        catSelect.addEventListener('change', () => {
          historyFilters.category = catSelect.value;
          this.renderHistory();
          if (typeof window.Sound !== 'undefined') window.Sound.playPop();
        });
      }
      if (searchInput) {
        searchInput.addEventListener('input', () => {
          historyFilters.search = searchInput.value.toLowerCase().trim();
          this.renderHistory();
        });
      }
      if (sortSelect) {
        sortSelect.addEventListener('change', () => {
          historyFilters.sort = sortSelect.value;
          this.renderHistory();
          if (typeof window.Sound !== 'undefined') window.Sound.playPop();
        });
      }
    },

    populateHistoryMonths() {
      const monthSelect = document.getElementById('history-month-select');
      if (!monthSelect) return;

      const records = getStorage().getRecords();
      const monthsSet = new Set();
      
      const today = new Date();
      const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      monthsSet.add(currentMonthKey);

      records.forEach(r => {
        if (r.date && r.date.length >= 7) {
          monthsSet.add(r.date.substring(0, 7));
        }
      });

      const sortedMonths = Array.from(monthsSet).sort().reverse();

      const previousVal = monthSelect.value || currentMonthKey;
      monthSelect.innerHTML = `<option value="all">📅 全部月份</option>`;

      sortedMonths.forEach(m => {
        const [year, month] = m.split('-');
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = `🌸 ${year} 年 ${parseInt(month, 10)} 月`;
        monthSelect.appendChild(opt);
      });

      monthSelect.value = sortedMonths.includes(previousVal) ? previousVal : (previousVal === 'all' ? 'all' : currentMonthKey);
      historyFilters.month = monthSelect.value;
    },

    populateHistoryCategoryOptions() {
      const catSelect = document.getElementById('history-category-select');
      if (!catSelect) return;

      const previousVal = catSelect.value || 'all';
      catSelect.innerHTML = '<option value="all">🏷️ 全部分類</option>';

      let list = [];
      if (historyFilters.type === 'expense') {
        list = CATEGORIES.expense;
      } else if (historyFilters.type === 'income') {
        list = CATEGORIES.income;
      } else {
        list = [...CATEGORIES.expense, ...CATEGORIES.income];
      }

      const seen = new Set();
      list.forEach(c => {
        if (!seen.has(c.id)) {
          seen.add(c.id);
          const opt = document.createElement('option');
          opt.value = c.id;
          opt.textContent = `${c.icon} ${c.id}`;
          catSelect.appendChild(opt);
        }
      });

      catSelect.value = seen.has(previousVal) ? previousVal : 'all';
      historyFilters.category = catSelect.value;
    },

    renderHistory() {
      const container = document.getElementById('history-records-list');
      if (!container) return;

      let records = getStorage().getRecords();
      const settings = getStorage().getSettings();
      const currency = settings.currency || 'NT$';

      if (historyFilters.month && historyFilters.month !== 'all') {
        records = records.filter(r => r.date && r.date.startsWith(historyFilters.month));
      }

      if (historyFilters.type !== 'all') {
        records = records.filter(r => r.type === historyFilters.type);
      }

      if (historyFilters.category !== 'all') {
        records = records.filter(r => r.category === historyFilters.category);
      }

      if (historyFilters.search) {
        records = records.filter(r => 
          (r.note && r.note.toLowerCase().includes(historyFilters.search)) ||
          (r.category && r.category.toLowerCase().includes(historyFilters.search))
        );
      }

      this.updateHistorySummary(records, currency);

      records.sort((a, b) => {
        if (historyFilters.sort === 'date-desc') {
          return new Date(b.date).getTime() - new Date(a.date).getTime() || (b.createdAt || 0) - (a.createdAt || 0);
        } else if (historyFilters.sort === 'date-asc') {
          return new Date(a.date).getTime() - new Date(b.date).getTime() || (a.createdAt || 0) - (b.createdAt || 0);
        } else if (historyFilters.sort === 'amount-desc') {
          return b.amount - a.amount;
        } else if (historyFilters.sort === 'amount-asc') {
          return a.amount - b.amount;
        }
        return 0;
      });

      if (records.length === 0) {
        container.innerHTML = `
          <div class="empty-journal-placeholder">
            <div class="empty-icon">📖</div>
            <p class="empty-title">這頁手帳還是空白的呢~</p>
            <p class="empty-subtitle">沒有符合條件的記帳紀錄，點擊「記帳」來記錄一筆吧！♡</p>
            <button class="journal-btn-pill" onclick="window.App.navigateTo('record')">✨ 寫下手帳新的一頁</button>
          </div>
        `;
        return;
      }

      container.innerHTML = '';
      
      const grouped = {};
      records.forEach(r => {
        if (!grouped[r.date]) grouped[r.date] = [];
        grouped[r.date].push(r);
      });

      const dates = Object.keys(grouped);

      dates.forEach(dateStr => {
        const dateGroup = grouped[dateStr];
        const dayExpense = dateGroup.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);
        const dayIncome = dateGroup.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);

        const dObj = new Date(dateStr + 'T00:00:00');
        const dayNames = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        const dayOfWeek = isNaN(dObj.getDay()) ? '' : dayNames[dObj.getDay()];

        const groupEl = document.createElement('div');
        groupEl.className = 'history-date-group';

        groupEl.innerHTML = `
          <div class="date-group-header">
            <div class="date-badge">
              <span class="ribbon-mini">🎀</span>
              <span class="date-text">${dateStr} (${dayOfWeek})</span>
            </div>
            <div class="date-summary">
              ${dayExpense > 0 ? `<span class="date-expense">支: ${currency} ${dayExpense.toLocaleString()}</span>` : ''}
              ${dayIncome > 0 ? `<span class="date-income">收: +${currency} ${dayIncome.toLocaleString()}</span>` : ''}
            </div>
          </div>
          <div class="date-items-list"></div>
        `;

        const itemsList = groupEl.querySelector('.date-items-list');

        dateGroup.forEach(rec => {
          const isIncome = rec.type === 'income';
          const icon = getCategoryIcon(rec.category, rec.type);
          const itemEl = document.createElement('div');
          itemEl.className = `transaction-item ${isIncome ? 'item-income' : 'item-expense'}`;

          itemEl.innerHTML = `
            <div class="item-left">
              <div class="item-icon-box">${icon}</div>
              <div class="item-meta">
                <div class="item-category-tag">${rec.category}</div>
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
          itemsList.appendChild(itemEl);
        });

        container.appendChild(groupEl);
      });
    },

    updateHistorySummary(filteredRecords, currency) {
      const incEl = document.getElementById('history-summary-income');
      const expEl = document.getElementById('history-summary-expense');
      const balEl = document.getElementById('history-summary-balance');

      const totalInc = filteredRecords.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0);
      const totalExp = filteredRecords.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0);
      const balance = totalInc - totalExp;

      if (incEl) incEl.textContent = `+${currency} ${totalInc.toLocaleString()}`;
      if (expEl) expEl.textContent = `-${currency} ${totalExp.toLocaleString()}`;
      if (balEl) {
        balEl.textContent = `${balance >= 0 ? '+' : ''}${currency} ${balance.toLocaleString()}`;
        balEl.className = `summary-stat-value ${balance >= 0 ? 'text-positive' : 'text-negative'}`;
      }
    },

    getCategories() {
      return CATEGORIES;
    },

    getCategoryIcon
  };

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
})();

// Attach to window
window.Records = Records;
