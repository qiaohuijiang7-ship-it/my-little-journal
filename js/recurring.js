/**
 * MY LITTLE JOURNAL - Recurring Transactions & Installments Manager
 * Handles scheduled auto-generation (Monthly, Every 2 Months, Quarterly, Semi-Annually, Yearly, Weekly),
 * Installment progress tracking, manual triggers, and toast notifications.
 */

const Recurring = (() => {
  const getStorage = () => window.JournalStorage;

  const CYCLE_LABELS = {
    'weekly': '每週一次',
    'monthly': '每月一次',
    '2months': '雙月一次 (每2個月)',
    'quarterly': '每季一次 (每3個月)',
    'semiannual': '每半年一次 (每6個月)',
    'yearly': '每年一次'
  };

  const CYCLE_MONTH_INTERVALS = {
    'monthly': 1,
    '2months': 2,
    'quarterly': 3,
    'semiannual': 6,
    'yearly': 12
  };

  let editingRuleId = null;

  return {
    init() {
      this.initModal();
      this.checkAndAutoGenerate();
    },

    // Check all active recurring rules and auto-generate transactions if due
    checkAndAutoGenerate() {
      const rules = getStorage().getRecurringRules();
      if (!rules || rules.length === 0) return;

      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1; // 1-12
      const currentDay = today.getDate();
      const todayStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`;

      let generatedCount = 0;
      let lastGeneratedTitle = '';

      rules.forEach(rule => {
        if (!rule.active) return;
        if (rule.isInstallment && rule.totalPeriods > 0 && rule.currentPeriod >= rule.totalPeriods) {
          // All periods already completed
          rule.active = false;
          return;
        }

        const isDue = this.checkRuleIsDue(rule, today, currentYear, currentMonth, currentDay);
        if (isDue) {
          this.executeRule(rule, todayStr, true);
          generatedCount++;
          lastGeneratedTitle = rule.title;
        }
      });

      if (generatedCount > 0) {
        getStorage().saveRecurringRules(rules);
        if (typeof window.Sound !== 'undefined') window.Sound.playSuccess();
        this.showToast(
          generatedCount === 1
            ? `🌸 自動記帳：已自動入帳【${lastGeneratedTitle}】！`
            : `🌸 自動記帳：已自動記錄 ${generatedCount} 筆固定收支/分期項目！`
        );
        if (typeof window.App !== 'undefined') {
          window.App.notifyDataChanged();
        }
      }
    },

    // Determine if a rule is due today or overdue for its cycle
    checkRuleIsDue(rule, today, currentYear, currentMonth, currentDay) {
      const dueDay = rule.dueDay || 1;
      const lastDateStr = rule.lastTriggeredDate;

      // If dueDay hasn't arrived yet in the current month
      if (rule.cycle !== 'weekly' && currentDay < dueDay) {
        return false;
      }

      if (!lastDateStr) {
        // Never triggered before, and dueDay has arrived!
        return true;
      }

      const [lastY, lastM, lastD] = lastDateStr.split('-').map(Number);

      if (rule.cycle === 'weekly') {
        const lastDate = new Date(lastDateStr + 'T00:00:00');
        const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
        return diffDays >= 7;
      }

      const intervalMonths = CYCLE_MONTH_INTERVALS[rule.cycle] || 1;
      const monthsSinceLast = (currentYear - lastY) * 12 + (currentMonth - lastM);

      return monthsSinceLast >= intervalMonths;
    },

    // Execute rule: generate transaction record and update progress
    executeRule(rule, dateStr, isAuto = false) {
      let noteText = rule.title;
      if (rule.isInstallment && rule.totalPeriods > 0) {
        rule.currentPeriod = (rule.currentPeriod || 0) + 1;
        noteText += ` (${rule.currentPeriod}/${rule.totalPeriods}期)`;
        if (rule.currentPeriod >= rule.totalPeriods) {
          rule.active = false; // Finished all installments!
        }
      } else {
        noteText += ` [固定${rule.type === 'income' ? '入帳' : '扣款'}]`;
      }

      if (rule.note) {
        noteText += ` - ${rule.note}`;
      }

      getStorage().addRecord({
        type: rule.type,
        amount: rule.amount,
        category: rule.category,
        date: dateStr,
        note: noteText
      });

      rule.lastTriggeredDate = dateStr;
    },

    // Trigger manually by user click
    triggerManual(ruleId) {
      const rules = getStorage().getRecurringRules();
      const rule = rules.find(r => r.id === ruleId);
      if (!rule) return;

      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      this.executeRule(rule, todayStr, false);
      getStorage().saveRecurringRules(rules);

      if (typeof window.Sound !== 'undefined') window.Sound.playSuccess();
      this.showToast(`✨ 已成功手動記帳一筆【${rule.title}】！`);

      this.render();
      if (typeof window.App !== 'undefined') {
        window.App.notifyDataChanged();
      }
    },

    // Toggle active state
    toggleActive(ruleId) {
      const rules = getStorage().getRecurringRules();
      const rule = rules.find(r => r.id === ruleId);
      if (!rule) return;

      rule.active = !rule.active;
      getStorage().saveRecurringRules(rules);

      if (typeof window.Sound !== 'undefined') window.Sound.playPop();
      this.render();
    },

    deleteRule(ruleId) {
      const rules = getStorage().getRecurringRules();
      const rule = rules.find(r => r.id === ruleId);
      if (!rule) return;

      const confirmed = confirm(`確定要刪除固定項目「${rule.title}」嗎？\n此操作不會刪除過去已產生的歷史記帳紀錄。`);
      if (!confirmed) return;

      getStorage().deleteRecurringRule(ruleId);
      if (typeof window.Sound !== 'undefined') window.Sound.playDelete();
      this.render();
    },

    openAddModal() {
      editingRuleId = null;
      const modal = document.getElementById('recurring-modal');
      const form = document.getElementById('recurring-form');
      if (form) form.reset();

      const modalTitle = document.getElementById('recurring-modal-title');
      if (modalTitle) modalTitle.textContent = '✨ 新增固定收支 / 分期設定';

      this.toggleInstallmentInputs(false);
      this.populateCategoryOptions('expense');

      if (modal) modal.classList.add('active');
    },

    openEditModal(ruleId) {
      const rules = getStorage().getRecurringRules();
      const rule = rules.find(r => r.id === ruleId);
      if (!rule) return;

      editingRuleId = ruleId;
      const modal = document.getElementById('recurring-modal');
      const modalTitle = document.getElementById('recurring-modal-title');
      if (modalTitle) modalTitle.textContent = '✏️ 編輯固定收支 / 分期設定';

      document.getElementById('recur-title').value = rule.title;
      document.getElementById('recur-type').value = rule.type;
      document.getElementById('recur-amount').value = rule.amount;
      document.getElementById('recur-cycle').value = rule.cycle;
      document.getElementById('recur-dueday').value = rule.dueDay;
      document.getElementById('recur-note').value = rule.note || '';

      const isInstCheckbox = document.getElementById('recur-is-installment');
      if (isInstCheckbox) {
        isInstCheckbox.checked = Boolean(rule.isInstallment);
        this.toggleInstallmentInputs(rule.isInstallment);
      }

      const totalPeriodsInput = document.getElementById('recur-total-periods');
      const currentPeriodInput = document.getElementById('recur-current-period');
      if (totalPeriodsInput) totalPeriodsInput.value = rule.totalPeriods || '';
      if (currentPeriodInput) currentPeriodInput.value = rule.currentPeriod || 0;

      this.populateCategoryOptions(rule.type, rule.category);

      if (modal) modal.classList.add('active');
    },

    initModal() {
      const modal = document.getElementById('recurring-modal');
      const closeBtn = document.getElementById('close-recurring-modal');
      const form = document.getElementById('recurring-form');
      const addBtn = document.getElementById('btn-add-recurring');
      const instCheckbox = document.getElementById('recur-is-installment');
      const typeSelect = document.getElementById('recur-type');

      if (addBtn) {
        addBtn.addEventListener('click', () => {
          this.openAddModal();
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
          if (e.target === modal) modal.classList.remove('active');
        });
      }

      if (instCheckbox) {
        instCheckbox.addEventListener('change', () => {
          this.toggleInstallmentInputs(instCheckbox.checked);
        });
      }

      if (typeSelect) {
        typeSelect.addEventListener('change', () => {
          this.populateCategoryOptions(typeSelect.value);
        });
      }

      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleFormSubmit();
        });
      }
    },

    toggleInstallmentInputs(show) {
      const container = document.getElementById('installment-inputs-box');
      if (container) {
        container.style.display = show ? 'grid' : 'none';
      }
    },

    populateCategoryOptions(type, selected = null) {
      const select = document.getElementById('recur-category');
      if (!select) return;

      const cats = window.Records ? window.Records.getCategories()[type] || [] : [];
      select.innerHTML = '';

      cats.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `${c.icon} ${c.id}`;
        if (selected && selected === c.id) opt.selected = true;
        select.appendChild(opt);
      });
    },

    handleFormSubmit() {
      const title = document.getElementById('recur-title').value.trim();
      const type = document.getElementById('recur-type').value;
      const amount = parseFloat(document.getElementById('recur-amount').value);
      const category = document.getElementById('recur-category').value;
      const cycle = document.getElementById('recur-cycle').value;
      const dueDay = parseInt(document.getElementById('recur-dueday').value, 10) || 1;
      const isInstallment = document.getElementById('recur-is-installment').checked;
      const totalPeriods = isInstallment ? parseInt(document.getElementById('recur-total-periods').value, 10) || 1 : 0;
      const currentPeriod = isInstallment ? parseInt(document.getElementById('recur-current-period').value, 10) || 0 : 0;
      const note = document.getElementById('recur-note').value.trim();

      if (!title) {
        alert('請輸入項目名稱喔！🌸');
        return;
      }
      if (isNaN(amount) || amount <= 0) {
        alert('請輸入大於 0 的金額喔！♡');
        return;
      }

      const ruleData = {
        title,
        type,
        amount,
        category,
        cycle,
        dueDay,
        isInstallment,
        totalPeriods,
        currentPeriod,
        note,
        active: true
      };

      if (editingRuleId) {
        getStorage().updateRecurringRule(editingRuleId, ruleData);
        if (typeof window.Sound !== 'undefined') window.Sound.playSuccess();
        this.showToast('✨ 固定項目修改成功！');
      } else {
        getStorage().addRecurringRule(ruleData);
        if (typeof window.Sound !== 'undefined') window.Sound.playSuccess();
        this.showToast('✨ 已成功新增固定收支設定！');
      }

      const modal = document.getElementById('recurring-modal');
      if (modal) modal.classList.remove('active');

      this.render();
      if (typeof window.App !== 'undefined') {
        window.App.notifyDataChanged();
      }
    },

    render() {
      const container = document.getElementById('recurring-rules-list');
      if (!container) return;

      const rules = getStorage().getRecurringRules();
      const currency = getStorage().getSettings().currency || 'NT$';

      if (rules.length === 0) {
        container.innerHTML = `
          <div class="empty-journal-placeholder mini">
            <div class="empty-icon">🔄</div>
            <p class="empty-title">尚未設定固定收支或分期帳款</p>
            <p class="empty-subtitle">可以設定每月房租、電話費、Netflix 訂閱，或是雙月電費、半年保險與商品分期付款喔！♡</p>
            <button class="journal-btn-pill" onclick="window.Recurring.openAddModal()">✨ 新增第一個固定項目</button>
          </div>
        `;
        return;
      }

      container.innerHTML = '';

      rules.forEach(rule => {
        const isIncome = rule.type === 'income';
        const icon = window.Records ? window.Records.getCategoryIcon(rule.category, rule.type) : '🌸';
        const cycleLabel = CYCLE_LABELS[rule.cycle] || '每月';
        const card = document.createElement('div');
        card.className = `recurring-card-item ${rule.active ? 'active-rule' : 'paused-rule'}`;

        let installmentHtml = '';
        if (rule.isInstallment && rule.totalPeriods > 0) {
          const pct = Math.min(100, Math.round((rule.currentPeriod / rule.totalPeriods) * 100));
          const isDone = rule.currentPeriod >= rule.totalPeriods;
          installmentHtml = `
            <div class="recurring-installment-bar">
              <div class="inst-label-row">
                <span>分期進度：第 <strong>${rule.currentPeriod}</strong> / ${rule.totalPeriods} 期</span>
                <span class="inst-pct">${isDone ? '🎉 已繳清' : `${pct}%`}</span>
              </div>
              <div class="inst-progress-bg">
                <div class="inst-progress-fill" style="width: ${pct}%"></div>
              </div>
            </div>
          `;
        }

        card.innerHTML = `
          <div class="recur-header">
            <div class="recur-badge-group">
              <span class="recur-icon">${icon}</span>
              <div class="recur-title-box">
                <strong class="recur-title-text">${escapeHtml(rule.title)}</strong>
                <span class="recur-category-tag">${rule.category}</span>
              </div>
            </div>
            <div class="recur-amount-box ${isIncome ? 'text-income' : 'text-expense'}">
              ${isIncome ? '+' : '-'}${currency} ${rule.amount.toLocaleString()}
            </div>
          </div>

          <div class="recur-details-row">
            <span class="recur-cycle-pill">📅 ${cycleLabel} (每月 ${rule.dueDay} 號)</span>
            ${rule.lastTriggeredDate ? `<span class="recur-last-run">上次執行: ${rule.lastTriggeredDate}</span>` : '<span class="recur-last-run">尚未執行過</span>'}
          </div>

          ${rule.note ? `<div class="recur-note-sub">💭 ${escapeHtml(rule.note)}</div>` : ''}

          ${installmentHtml}

          <div class="recur-footer">
            <div class="recur-status-toggle">
              <label class="switch-toggle mini-toggle">
                <input type="checkbox" ${rule.active ? 'checked' : ''} onchange="window.Recurring.toggleActive('${rule.id}')">
                <span class="slider"></span>
              </label>
              <span class="status-label">${rule.active ? '已啟用自動記帳' : '已暫停'}</span>
            </div>

            <div class="recur-actions">
              <button class="action-btn trigger-now-btn" title="立即手動記帳一次" onclick="window.Recurring.triggerManual('${rule.id}')">⚡ 立即記帳</button>
              <button class="action-btn edit-btn" title="編輯" onclick="window.Recurring.openEditModal('${rule.id}')">✏️</button>
              <button class="action-btn delete-btn" title="刪除" onclick="window.Recurring.deleteRule('${rule.id}')">🗑️</button>
            </div>
          </div>
        `;

        container.appendChild(card);
      });
    },

    showToast(message) {
      let toast = document.getElementById('recurring-toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'recurring-toast';
        toast.className = 'journal-toast';
        document.body.appendChild(toast);
      }
      toast.textContent = message;
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, 4000);
    }
  };

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
})();

// Attach to window
window.Recurring = Recurring;
