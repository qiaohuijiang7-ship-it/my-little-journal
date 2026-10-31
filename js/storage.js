/**
 * MY LITTLE JOURNAL - Data Storage & Model Manager
 * LocalStorage management with validation, import/export, defaults, and recurring rules.
 */

const JournalStorage = (() => {
  const KEYS = {
    RECORDS: 'mlj_records_v1',
    SETTINGS: 'mlj_settings_v1',
    BUDGET: 'mlj_budget_v1',
    RECURRING: 'mlj_recurring_v1',
  };

  const DEFAULT_SETTINGS = {
    nickname: '少女手帳主人',
    currency: 'NT$',
    soundEnabled: true,
    animationEnabled: true,
  };

  const DEFAULT_BUDGET = {
    monthlyTotal: 25000,
    categories: {
      '餐飲': 8000,
      '交通': 2000,
      '購物': 6000,
      '娛樂': 3500,
      '生活用品': 2500,
      '學習': 1500,
      '醫療': 1000,
      '其他': 500
    }
  };

  // Pre-curated sweet sample transactions
  const getSampleRecords = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const prevM = String(today.getMonth() === 0 ? 12 : today.getMonth()).padStart(2, '0');
    const prevY = today.getMonth() === 0 ? y - 1 : y;

    return [
      {
        id: 'rec_s1',
        type: 'income',
        amount: 42000,
        category: '薪資',
        date: `${y}-${m}-05`,
        note: '本月薪資入帳 🌸 辛苦了！',
        createdAt: new Date(`${y}-${m}-05T09:00:00`).getTime()
      },
      {
        id: 'rec_s2',
        type: 'expense',
        amount: 280,
        category: '餐飲',
        date: `${y}-${m}-06`,
        note: '草莓奶油厚鬆餅與白桃烏龍茶 🍰',
        createdAt: new Date(`${y}-${m}-06T14:30:00`).getTime()
      },
      {
        id: 'rec_s3',
        type: 'expense',
        amount: 1280,
        category: '交通',
        date: `${y}-${m}-07`,
        note: '每月捷運與公車定期通勤票 🚃',
        createdAt: new Date(`${y}-${m}-07T08:15:00`).getTime()
      },
      {
        id: 'rec_s4',
        type: 'expense',
        amount: 2450,
        category: '購物',
        date: `${y}-${m}-10`,
        note: 'Sweet Lolita 蕾絲緞帶襯衫與髮帶 🎀',
        createdAt: new Date(`${y}-${m}-10T16:00:00`).getTime()
      },
      {
        id: 'rec_s5',
        type: 'expense',
        amount: 450,
        category: '娛樂',
        date: `${y}-${m}-12`,
        note: '吉卜力特展門票與紀念手帳明信片 🎫',
        createdAt: new Date(`${y}-${m}-12T13:45:00`).getTime()
      },
      {
        id: 'rec_s6',
        type: 'expense',
        amount: 680,
        category: '生活用品',
        date: `${y}-${m}-14`,
        note: '薰衣草香氛蠟燭與綿羊毛絨室內拖鞋 🫧',
        createdAt: new Date(`${y}-${m}-14T19:20:00`).getTime()
      },
      {
        id: 'rec_s7',
        type: 'income',
        amount: 3500,
        category: '兼職收入',
        date: `${y}-${m}-15`,
        note: '插畫委託稿酬入帳 ✨',
        createdAt: new Date(`${y}-${m}-15T11:00:00`).getTime()
      },
      {
        id: 'rec_s8',
        type: 'expense',
        amount: 720,
        category: '學習',
        date: `${y}-${m}-18`,
        note: '日本語能力試驗檢定單字書與手帳貼紙 📚',
        createdAt: new Date(`${y}-${m}-18T17:10:00`).getTime()
      },
      {
        id: 'rec_s9',
        type: 'expense',
        amount: 320,
        category: '餐飲',
        date: `${y}-${m}-20`,
        note: '日式豚骨叉燒拉麵與溏心蛋 🍜',
        createdAt: new Date(`${y}-${m}-20T12:30:00`).getTime()
      },
      {
        id: 'rec_s10',
        type: 'expense',
        amount: 1680,
        category: '購物',
        date: `${y}-${m}-22`,
        note: 'Jill Stuart 白花香水與潤唇膏 💄',
        createdAt: new Date(`${y}-${m}-22T15:20:00`).getTime()
      },
      {
        id: 'rec_s11',
        type: 'expense',
        amount: 250,
        category: '醫療',
        date: `${y}-${m}-25`,
        note: '維他命C發泡錠與眼藥水 💊',
        createdAt: new Date(`${y}-${m}-25T18:00:00`).getTime()
      },
      {
        id: 'rec_s12',
        type: 'expense',
        amount: 180,
        category: '餐飲',
        date: `${y}-${m}-${String(today.getDate()).padStart(2, '0')}`,
        note: '珍珠黑糖鮮奶與手工瑪德蓮 🧋',
        createdAt: new Date().getTime()
      },
      {
        id: 'rec_prev1',
        type: 'expense',
        amount: 7200,
        category: '餐飲',
        date: `${prevY}-${prevM}-15`,
        note: '上個月餐飲日常花銷總匯',
        createdAt: new Date(`${prevY}-${prevM}-15T12:00:00`).getTime()
      },
      {
        id: 'rec_prev2',
        type: 'expense',
        amount: 4800,
        category: '購物',
        date: `${prevY}-${prevM}-20`,
        note: '上月秋季洋裝與包包',
        createdAt: new Date(`${prevY}-${prevM}-20T15:00:00`).getTime()
      },
      {
        id: 'rec_prev3',
        type: 'income',
        amount: 42000,
        category: '薪資',
        date: `${prevY}-${prevM}-05`,
        note: '上月薪資入帳',
        createdAt: new Date(`${prevY}-${prevM}-05T09:00:00`).getTime()
      }
    ];
  };

  // Pre-curated sample recurring rules (Monthly, 2-months, Semi-annually, Installments)
  const getSampleRecurringRules = () => {
    return [
      {
        id: 'recur_sample_1',
        title: 'iPhone 16 Pro 24期分期',
        type: 'expense',
        amount: 1850,
        category: '購物',
        cycle: 'monthly', // 每月
        dueDay: 10,
        isInstallment: true,
        totalPeriods: 24,
        currentPeriod: 3,
        active: true,
        note: '每月 10 號信用卡扣款 (0利率分期)',
        lastTriggeredDate: ''
      },
      {
        id: 'recur_sample_2',
        title: '租屋套房房租',
        type: 'expense',
        amount: 13000,
        category: '生活用品',
        cycle: 'monthly', // 每月
        dueDay: 5,
        isInstallment: false,
        totalPeriods: 0,
        currentPeriod: 0,
        active: true,
        note: '房東玉山帳戶每月轉帳',
        lastTriggeredDate: ''
      },
      {
        id: 'recur_sample_3',
        title: '家用電費水費代繳',
        type: 'expense',
        amount: 1450,
        category: '生活用品',
        cycle: '2months', // 雙月一次 (每2個月)
        dueDay: 15,
        isInstallment: false,
        totalPeriods: 0,
        currentPeriod: 0,
        active: true,
        note: '台電雙月抄表自動扣繳',
        lastTriggeredDate: ''
      },
      {
        id: 'recur_sample_4',
        title: '機車定期強險與車檢',
        type: 'expense',
        amount: 2100,
        category: '交通',
        cycle: 'semiannual', // 每半年一次
        dueDay: 20,
        isInstallment: false,
        totalPeriods: 0,
        currentPeriod: 0,
        active: true,
        note: '富邦產險半年繳定期保單',
        lastTriggeredDate: ''
      },
      {
        id: 'recur_sample_5',
        title: '每月固定薪資',
        type: 'income',
        amount: 42000,
        category: '薪資',
        cycle: 'monthly', // 每月
        dueDay: 5,
        isInstallment: false,
        totalPeriods: 0,
        currentPeriod: 0,
        active: true,
        note: '每月 5 號公司發薪入帳 🌸',
        lastTriggeredDate: ''
      }
    ];
  };

  return {
    // --- Records ---
    getRecords() {
      try {
        const raw = localStorage.getItem(KEYS.RECORDS);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.error('Failed to load records from LocalStorage', e);
        return [];
      }
    },

    saveRecords(records) {
      try {
        localStorage.setItem(KEYS.RECORDS, JSON.stringify(records));
        return true;
      } catch (e) {
        console.error('Failed to save records to LocalStorage', e);
        return false;
      }
    },

    addRecord(record) {
      const records = this.getRecords();
      const newRecord = {
        id: 'rec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        type: record.type === 'income' ? 'income' : 'expense',
        amount: Math.abs(parseFloat(record.amount) || 0),
        category: record.category || '其他',
        date: record.date || new Date().toISOString().split('T')[0],
        note: (record.note || '').trim(),
        createdAt: Date.now()
      };
      records.unshift(newRecord);
      this.saveRecords(records);
      return newRecord;
    },

    updateRecord(id, updatedData) {
      const records = this.getRecords();
      const index = records.findIndex(r => r.id === id);
      if (index === -1) return null;

      records[index] = {
        ...records[index],
        type: updatedData.type === 'income' ? 'income' : 'expense',
        amount: Math.abs(parseFloat(updatedData.amount) || 0),
        category: updatedData.category || records[index].category,
        date: updatedData.date || records[index].date,
        note: (updatedData.note !== undefined ? updatedData.note : records[index].note).trim()
      };

      this.saveRecords(records);
      return records[index];
    },

    deleteRecord(id) {
      const records = this.getRecords();
      const filtered = records.filter(r => r.id !== id);
      this.saveRecords(filtered);
      return filtered.length < records.length;
    },

    getRecordById(id) {
      const records = this.getRecords();
      return records.find(r => r.id === id) || null;
    },

    // --- Recurring Rules (固定收支與分期付款) ---
    getRecurringRules() {
      try {
        const raw = localStorage.getItem(KEYS.RECURRING);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    },

    saveRecurringRules(rules) {
      try {
        localStorage.setItem(KEYS.RECURRING, JSON.stringify(rules));
        return true;
      } catch (e) {
        console.error('Failed to save recurring rules', e);
        return false;
      }
    },

    addRecurringRule(rule) {
      const rules = this.getRecurringRules();
      const newRule = {
        id: 'recur_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        title: (rule.title || '固定收支項目').trim(),
        type: rule.type === 'income' ? 'income' : 'expense',
        amount: Math.abs(parseFloat(rule.amount) || 0),
        category: rule.category || '其他',
        cycle: rule.cycle || 'monthly', // weekly, monthly, 2months, quarterly, semiannual, yearly
        dueDay: parseInt(rule.dueDay, 10) || 1, // 1-31
        isInstallment: Boolean(rule.isInstallment),
        totalPeriods: parseInt(rule.totalPeriods, 10) || 0,
        currentPeriod: parseInt(rule.currentPeriod, 10) || 0,
        active: rule.active !== undefined ? Boolean(rule.active) : true,
        note: (rule.note || '').trim(),
        lastTriggeredDate: rule.lastTriggeredDate || '',
        createdAt: Date.now()
      };
      rules.unshift(newRule);
      this.saveRecurringRules(rules);
      return newRule;
    },

    updateRecurringRule(id, updatedData) {
      const rules = this.getRecurringRules();
      const index = rules.findIndex(r => r.id === id);
      if (index === -1) return null;

      rules[index] = {
        ...rules[index],
        title: (updatedData.title || rules[index].title).trim(),
        type: updatedData.type === 'income' ? 'income' : 'expense',
        amount: Math.abs(parseFloat(updatedData.amount) || 0),
        category: updatedData.category || rules[index].category,
        cycle: updatedData.cycle || rules[index].cycle,
        dueDay: parseInt(updatedData.dueDay, 10) || rules[index].dueDay,
        isInstallment: Boolean(updatedData.isInstallment),
        totalPeriods: parseInt(updatedData.totalPeriods, 10) || 0,
        currentPeriod: parseInt(updatedData.currentPeriod, 10) || 0,
        active: updatedData.active !== undefined ? Boolean(updatedData.active) : rules[index].active,
        note: (updatedData.note !== undefined ? updatedData.note : rules[index].note).trim(),
        lastTriggeredDate: updatedData.lastTriggeredDate !== undefined ? updatedData.lastTriggeredDate : rules[index].lastTriggeredDate
      };

      this.saveRecurringRules(rules);
      return rules[index];
    },

    deleteRecurringRule(id) {
      const rules = this.getRecurringRules();
      const filtered = rules.filter(r => r.id !== id);
      this.saveRecurringRules(filtered);
      return filtered.length < rules.length;
    },

    // --- Settings ---
    getSettings() {
      try {
        const raw = localStorage.getItem(KEYS.SETTINGS);
        if (!raw) return { ...DEFAULT_SETTINGS };
        return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
      } catch (e) {
        return { ...DEFAULT_SETTINGS };
      }
    },

    saveSettings(settings) {
      try {
        const current = this.getSettings();
        const merged = { ...current, ...settings };
        localStorage.setItem(KEYS.SETTINGS, JSON.stringify(merged));
        return merged;
      } catch (e) {
        console.error('Failed to save settings', e);
        return null;
      }
    },

    // --- Budget ---
    getBudget() {
      try {
        const raw = localStorage.getItem(KEYS.BUDGET);
        if (!raw) return JSON.parse(JSON.stringify(DEFAULT_BUDGET));
        const parsed = JSON.parse(raw);
        return {
          monthlyTotal: parsed.monthlyTotal ?? DEFAULT_BUDGET.monthlyTotal,
          categories: { ...DEFAULT_BUDGET.categories, ...(parsed.categories || {}) }
        };
      } catch (e) {
        return JSON.parse(JSON.stringify(DEFAULT_BUDGET));
      }
    },

    saveBudget(budget) {
      try {
        localStorage.setItem(KEYS.BUDGET, JSON.stringify(budget));
        return true;
      } catch (e) {
        console.error('Failed to save budget', e);
        return false;
      }
    },

    // --- Sample Data Loader ---
    loadSampleData() {
      const samples = getSampleRecords();
      this.saveRecords(samples);
      const sampleRules = getSampleRecurringRules();
      this.saveRecurringRules(sampleRules);
      return samples;
    },

    // --- Export / Import ---
    exportDataJSON() {
      const payload = {
        app: 'MY_LITTLE_JOURNAL',
        version: '1.1',
        exportedAt: new Date().toISOString(),
        settings: this.getSettings(),
        budget: this.getBudget(),
        records: this.getRecords(),
        recurring: this.getRecurringRules()
      };
      return JSON.stringify(payload, null, 2);
    },

    validateImportData(data) {
      if (!data || typeof data !== 'object') {
        return { valid: false, message: '無效的 JSON 檔案結構' };
      }
      if (!Array.isArray(data.records)) {
        return { valid: false, message: '檔案中缺少記帳紀錄清單 (records)' };
      }
      for (const rec of data.records) {
        if (!rec.amount || isNaN(Number(rec.amount)) || !rec.date) {
          return { valid: false, message: '部分紀錄缺少必要欄位 (金額或日期)' };
        }
      }
      return { valid: true };
    },

    importDataJSON(jsonString) {
      try {
        const parsed = JSON.parse(jsonString);
        const validation = this.validateImportData(parsed);
        if (!validation.valid) {
          return { success: false, message: validation.message };
        }

        this.saveRecords(parsed.records);

        if (parsed.settings && typeof parsed.settings === 'object') {
          this.saveSettings(parsed.settings);
        }

        if (parsed.budget && typeof parsed.budget === 'object') {
          this.saveBudget(parsed.budget);
        }

        if (Array.isArray(parsed.recurring)) {
          this.saveRecurringRules(parsed.recurring);
        }

        return { success: true, count: parsed.records.length };
      } catch (e) {
        return { success: false, message: 'JSON 解析失敗，請確認檔案內容格式正確' };
      }
    },

    // --- Reset All Data ---
    clearAllData() {
      localStorage.removeItem(KEYS.RECORDS);
      localStorage.removeItem(KEYS.SETTINGS);
      localStorage.removeItem(KEYS.BUDGET);
      localStorage.removeItem(KEYS.RECURRING);
      return true;
    }
  };
})();

// Attach to window for global access
window.JournalStorage = JournalStorage;
