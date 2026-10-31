/**
 * MY LITTLE JOURNAL - Settings & Data Management
 * Nickname, currency, toggles for sound/particles, export/import JSON, data clear.
 */

const Settings = (() => {
  const getStorage = () => window.JournalStorage;

  return {
    init() {
      this.populateForm();
      this.initEvents();
    },

    populateForm() {
      const settings = getStorage().getSettings();
      const budget = getStorage().getBudget();

      const nickInput = document.getElementById('settings-nickname');
      const currInput = document.getElementById('settings-currency');
      const budgetInput = document.getElementById('settings-budget-total');
      const soundToggle = document.getElementById('settings-sound-toggle');
      const animToggle = document.getElementById('settings-anim-toggle');

      if (nickInput) nickInput.value = settings.nickname || '少女手帳主人';
      if (currInput) currInput.value = settings.currency || 'NT$';
      if (budgetInput) budgetInput.value = budget.monthlyTotal || 25000;
      if (soundToggle) soundToggle.checked = Boolean(settings.soundEnabled);
      if (animToggle) animToggle.checked = Boolean(settings.animationEnabled);

      this.updateHeaderGreeting(settings.nickname);
    },

    updateHeaderGreeting(nickname) {
      const greetingEl = document.getElementById('user-greeting-name');
      if (greetingEl) {
        greetingEl.textContent = nickname || '少女手帳主人';
      }
    },

    initEvents() {
      const form = document.getElementById('settings-form');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          this.saveSettings();
        });
      }

      const exportBtn = document.getElementById('btn-export-json');
      if (exportBtn) {
        exportBtn.addEventListener('click', () => {
          this.exportJSON();
        });
      }

      const importBtn = document.getElementById('btn-import-json');
      const fileInput = document.getElementById('import-file-input');
      if (importBtn && fileInput) {
        importBtn.addEventListener('click', () => {
          fileInput.click();
        });
        fileInput.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (file) {
            this.handleFileImport(file);
          }
          fileInput.value = '';
        });
      }

      const sampleBtn = document.getElementById('btn-load-sample');
      if (sampleBtn) {
        sampleBtn.addEventListener('click', () => {
          this.loadSampleData();
        });
      }

      const clearBtn = document.getElementById('btn-clear-data');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          this.clearAllData();
        });
      }

      const soundToggle = document.getElementById('settings-sound-toggle');
      if (soundToggle) {
        soundToggle.addEventListener('change', () => {
          getStorage().saveSettings({ soundEnabled: soundToggle.checked });
          if (soundToggle.checked && typeof window.Sound !== 'undefined') {
            window.Sound.playClick();
          }
        });
      }

      const animToggle = document.getElementById('settings-anim-toggle');
      if (animToggle) {
        animToggle.addEventListener('change', () => {
          getStorage().saveSettings({ animationEnabled: animToggle.checked });
        });
      }
    },

    saveSettings() {
      const nickInput = document.getElementById('settings-nickname');
      const currInput = document.getElementById('settings-currency');
      const budgetInput = document.getElementById('settings-budget-total');
      const soundToggle = document.getElementById('settings-sound-toggle');
      const animToggle = document.getElementById('settings-anim-toggle');

      const nickname = nickInput.value.trim() || '少女手帳主人';
      const currency = currInput.value.trim() || 'NT$';
      const soundEnabled = soundToggle.checked;
      const animationEnabled = animToggle.checked;

      getStorage().saveSettings({
        nickname,
        currency,
        soundEnabled,
        animationEnabled
      });

      if (budgetInput) {
        const currentBudget = getStorage().getBudget();
        currentBudget.monthlyTotal = Math.max(0, parseFloat(budgetInput.value) || 0);
        getStorage().saveBudget(currentBudget);
      }

      this.updateHeaderGreeting(nickname);

      if (typeof window.Sound !== 'undefined') window.Sound.playSuccess();
      alert('✨ 設定已成功儲存！');

      if (typeof window.App !== 'undefined') {
        window.App.notifyDataChanged();
      }
    },

    exportJSON() {
      if (typeof window.Sound !== 'undefined') window.Sound.playSuccess();
      const jsonStr = getStorage().exportDataJSON();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const today = new Date().toISOString().split('T')[0];
      const a = document.createElement('a');
      a.href = url;
      a.download = `my_little_journal_backup_${today}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },

    handleFileImport(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        try {
          const parsed = JSON.parse(content);
          const validation = getStorage().validateImportData(parsed);
          if (!validation.valid) {
            alert(`⚠️ 匯入失敗：${validation.message}`);
            return;
          }

          const recordCount = parsed.records.length;
          const userConfirmed = confirm(
            `確定要匯入手帳備份資料嗎？\n\n偵測到共 ${recordCount} 筆記帳紀錄。\n注意：此動作將會覆蓋現有的紀錄與設定，請確認是否繼續？`
          );

          if (!userConfirmed) return;

          const result = getStorage().importDataJSON(content);
          if (result.success) {
            if (typeof window.Sound !== 'undefined') window.Sound.playSuccess();
            alert(`🎉 匯入成功！已成功載入 ${result.count} 筆記帳紀錄！`);
            this.populateForm();
            if (typeof window.App !== 'undefined') {
              window.App.notifyDataChanged();
              window.App.navigateTo('home');
            }
          } else {
            alert(`⚠️ 匯入失敗：${result.message}`);
          }
        } catch (err) {
          alert('⚠️ 讀取檔案失敗，請確認檔案為有效的 JSON 格式');
        }
      };
      reader.readAsText(file);
    },

    loadSampleData() {
      const userConfirmed = confirm(
        '🌸 確定要載入示範手帳資料嗎？\n\n這將會為您載入一系列充滿少女手帳風格的收入與支出紀錄（草莓蛋糕、捷運月票、Lolita洋裝、薪資入帳等），方便您立即體驗儀表板與各項圖表分析功能！'
      );
      if (!userConfirmed) return;

      getStorage().loadSampleData();
      if (typeof window.Sound !== 'undefined') window.Sound.playSuccess();
      alert('✨ 示範資料載入成功！立即來探索各項圖表與紀錄吧 ♡');

      if (typeof window.App !== 'undefined') {
        window.App.notifyDataChanged();
        window.App.navigateTo('home');
      }
    },

    clearAllData() {
      const step1 = confirm('⚠️ 確定要清除所有手帳紀錄與設定嗎？\n所有儲存在瀏覽器中的資料都將消失且無法復原！');
      if (!step1) return;

      const step2 = confirm('🌸 最後再次確認：真的要重置為全新空白的手帳嗎？');
      if (!step2) return;

      getStorage().clearAllData();
      if (typeof window.Sound !== 'undefined') window.Sound.playDelete();
      alert('🕊️ 手帳已全部重置為嶄新空白狀態。');

      this.populateForm();
      if (typeof window.App !== 'undefined') {
        window.App.notifyDataChanged();
        window.App.navigateTo('home');
      }
    }
  };
})();

// Attach to window
window.Settings = Settings;
