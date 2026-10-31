/**
 * MY LITTLE JOURNAL - Statistics & Financial Analytics
 * Real data analytics, Chart.js integrations, ranking lists, MoM comparison.
 */

const Statistics = (() => {
  let chartInstances = {};
  let selectedStatsMonth = '';

  const getStorage = () => window.JournalStorage;

  const PASTEL_PALETTE = [
    '#F4B8CD', // Sweet pink
    '#D8C5E8', // Lavender
    '#C9D9EA', // Misty blue
    '#EBCAD9', // Dusty rose
    '#BDE0FE', // Baby blue
    '#FFE5D9', // Peach
    '#D0F4DE', // Pastel mint
    '#FFC6FF', // Candy violet
    '#FDE2E4', // Soft strawberry
    '#E2ECE9'  // Milk sage
  ];

  const initMonthSelector = () => {
    const select = document.getElementById('stats-month-select');
    if (!select) return;

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
    select.innerHTML = '';

    sortedMonths.forEach(m => {
      const [year, month] = m.split('-');
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = `🌸 ${year} 年 ${parseInt(month, 10)} 月`;
      select.appendChild(opt);
    });

    if (!selectedStatsMonth || !sortedMonths.includes(selectedStatsMonth)) {
      selectedStatsMonth = currentMonthKey;
    }
    select.value = selectedStatsMonth;

    select.onchange = () => {
      selectedStatsMonth = select.value;
      Statistics.render();
      if (typeof window.Sound !== 'undefined') window.Sound.playPop();
    };
  };

  const destroyChart = (chartId) => {
    if (chartInstances[chartId]) {
      chartInstances[chartId].destroy();
      delete chartInstances[chartId];
    }
  };

  return {
    init() {
      initMonthSelector();
    },

    render() {
      initMonthSelector();
      const records = getStorage().getRecords();
      const settings = getStorage().getSettings();
      const currency = settings.currency || 'NT$';

      const targetMonth = selectedStatsMonth;
      const [currYearStr, currMonthStr] = targetMonth.split('-');
      const currYear = parseInt(currYearStr, 10);
      const currMonth = parseInt(currMonthStr, 10);

      let prevYear = currYear;
      let prevMonth = currMonth - 1;
      if (prevMonth === 0) {
        prevMonth = 12;
        prevYear -= 1;
      }
      const prevMonthKey = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;

      const monthRecords = records.filter(r => r.date && r.date.startsWith(targetMonth));
      const prevMonthRecords = records.filter(r => r.date && r.date.startsWith(prevMonthKey));

      const monthExpenses = monthRecords.filter(r => r.type === 'expense');
      const monthIncomes = monthRecords.filter(r => r.type === 'income');

      const totalExpense = monthExpenses.reduce((sum, r) => sum + r.amount, 0);
      const totalIncome = monthIncomes.reduce((sum, r) => sum + r.amount, 0);
      const prevTotalExpense = prevMonthRecords.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);

      // MoM Comparison
      const momDiff = totalExpense - prevTotalExpense;
      let momPercentStr = '—';
      let momClass = 'neutral';
      let momText = '尚無上月資料比較';

      if (prevTotalExpense > 0) {
        const pct = ((momDiff / prevTotalExpense) * 100).toFixed(1);
        if (momDiff > 0) {
          momPercentStr = `+${pct}%`;
          momText = `比上月多支出 ${currency} ${momDiff.toLocaleString()}`;
          momClass = 'text-negative';
        } else if (momDiff < 0) {
          momPercentStr = `${pct}%`;
          momText = `比上月省下 ${currency} ${Math.abs(momDiff).toLocaleString()} ✨`;
          momClass = 'text-positive';
        } else {
          momPercentStr = `0%`;
          momText = `與上月支出持平`;
        }
      } else if (totalExpense > 0 && prevTotalExpense === 0) {
        momText = '新月份首筆支出紀錄';
      }

      const momEl = document.getElementById('stat-mom-comparison');
      if (momEl) {
        momEl.innerHTML = `
          <div class="stat-highlight-val ${momClass}">${momPercentStr}</div>
          <div class="stat-highlight-sub">${momText}</div>
        `;
      }

      // Top Category
      const catTotals = {};
      monthExpenses.forEach(r => {
        catTotals[r.category] = (catTotals[r.category] || 0) + r.amount;
      });

      let topCategory = '—';
      let topCategoryAmount = 0;
      Object.entries(catTotals).forEach(([cat, amt]) => {
        if (amt > topCategoryAmount) {
          topCategoryAmount = amt;
          topCategory = cat;
        }
      });

      const topCatEl = document.getElementById('stat-top-category');
      if (topCatEl) {
        const topCatPct = totalExpense > 0 ? ((topCategoryAmount / totalExpense) * 100).toFixed(0) : 0;
        topCatEl.innerHTML = `
          <div class="stat-highlight-val text-brand">${topCategory !== '—' ? `${window.Records.getCategoryIcon(topCategory)} ${topCategory}` : '無支出'}</div>
          <div class="stat-highlight-sub">${topCategory !== '—' ? `${currency} ${topCategoryAmount.toLocaleString()} (${topCatPct}%)` : '本月無支出紀錄'}</div>
        `;
      }

      // Peak Spending Day
      const dayTotals = {};
      monthExpenses.forEach(r => {
        dayTotals[r.date] = (dayTotals[r.date] || 0) + r.amount;
      });

      let peakDay = '—';
      let peakDayAmount = 0;
      Object.entries(dayTotals).forEach(([dStr, amt]) => {
        if (amt > peakDayAmount) {
          peakDayAmount = amt;
          peakDay = dStr;
        }
      });

      const peakDayEl = document.getElementById('stat-peak-day');
      if (peakDayEl) {
        const displayDay = peakDay !== '—' ? peakDay.split('-').slice(1).join('/') : '—';
        peakDayEl.innerHTML = `
          <div class="stat-highlight-val text-accent">${displayDay}</div>
          <div class="stat-highlight-sub">${peakDay !== '—' ? `當日共支出 ${currency} ${peakDayAmount.toLocaleString()}` : '本月無支出日'}</div>
        `;
      }

      // Daily Average
      const daysInMonth = new Date(currYear, currMonth, 0).getDate();
      const avgDaily = totalExpense > 0 ? Math.round(totalExpense / daysInMonth) : 0;
      const avgDailyEl = document.getElementById('stat-daily-avg');
      if (avgDailyEl) {
        avgDailyEl.innerHTML = `
          <div class="stat-highlight-val">${currency} ${avgDaily.toLocaleString()}</div>
          <div class="stat-highlight-sub">依本月 ${daysInMonth} 天平均計算</div>
        `;
      }

      // Ranking List
      this.renderRankingList(catTotals, totalExpense, currency);

      // Render Charts
      this.renderCategoryPieChart(catTotals, totalExpense);
      this.renderDailyBarChart(targetMonth, currYear, currMonth, daysInMonth, dayTotals);
      this.renderMonthlyCompareChart(records);
      this.renderMonthlyTrendChart(records);
    },

    renderRankingList(catTotals, totalExpense, currency) {
      const container = document.getElementById('stats-ranking-list');
      if (!container) return;

      const sorted = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);

      if (sorted.length === 0) {
        container.innerHTML = `
          <div class="empty-small-card">
            <span>🍰</span> 本月尚無分類消費排行紀錄
          </div>
        `;
        return;
      }

      container.innerHTML = '';
      const medals = ['👑 1', '🎀 2', '⭐ 3'];

      sorted.forEach(([cat, amt], idx) => {
        const pct = totalExpense > 0 ? ((amt / totalExpense) * 100).toFixed(1) : 0;
        const rankLabel = idx < 3 ? medals[idx] : `#${idx + 1}`;
        const icon = window.Records.getCategoryIcon(cat);

        const row = document.createElement('div');
        row.className = 'ranking-item';
        row.innerHTML = `
          <div class="ranking-rank ${idx < 3 ? 'rank-top' : ''}">${rankLabel}</div>
          <div class="ranking-info">
            <div class="ranking-header">
              <span class="ranking-cat">${icon} ${cat}</span>
              <span class="ranking-amount">${currency} ${amt.toLocaleString()} <small>(${pct}%)</small></span>
            </div>
            <div class="ranking-bar-bg">
              <div class="ranking-bar-fill" style="width: ${pct}%; background-color: ${PASTEL_PALETTE[idx % PASTEL_PALETTE.length]};"></div>
            </div>
          </div>
        `;
        container.appendChild(row);
      });
    },

    renderCategoryPieChart(catTotals, totalExpense) {
      const canvas = document.getElementById('chart-category-pie');
      const emptyMsg = document.getElementById('pie-empty-state');
      if (!canvas) return;

      destroyChart('pie');

      const labels = Object.keys(catTotals);
      const data = Object.values(catTotals);

      if (labels.length === 0 || totalExpense === 0) {
        canvas.style.display = 'none';
        if (emptyMsg) emptyMsg.style.display = 'flex';
        return;
      }

      canvas.style.display = 'block';
      if (emptyMsg) emptyMsg.style.display = 'none';

      if (typeof Chart === 'undefined') return;

      const ctx = canvas.getContext('2d');
      chartInstances['pie'] = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: PASTEL_PALETTE.slice(0, labels.length),
            borderColor: '#FFFFFF',
            borderWidth: 2,
            hoverOffset: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                boxWidth: 12,
                padding: 12,
                font: { family: "'Zen Maru Gothic', sans-serif", size: 12 },
                color: '#514452'
              }
            },
            tooltip: {
              backgroundColor: 'rgba(255, 253, 251, 0.95)',
              titleColor: '#514452',
              bodyColor: '#8C7187',
              borderColor: '#EBCAD9',
              borderWidth: 1.5,
              padding: 10,
              boxPadding: 4,
              callbacks: {
                label: function(context) {
                  const val = context.raw || 0;
                  const pct = totalExpense > 0 ? ((val / totalExpense) * 100).toFixed(1) : 0;
                  const currency = getStorage().getSettings().currency || 'NT$';
                  return ` ${context.label}: ${currency} ${val.toLocaleString()} (${pct}%)`;
                }
              }
            }
          },
          cutout: '62%'
        }
      });
    },

    renderDailyBarChart(targetMonth, year, month, daysInMonth, dayTotals) {
      const canvas = document.getElementById('chart-daily-bars');
      const emptyMsg = document.getElementById('daily-empty-state');
      if (!canvas) return;

      destroyChart('daily');

      const labels = [];
      const data = [];
      let hasData = false;

      for (let d = 1; d <= daysInMonth; d++) {
        const dayStr = String(d).padStart(2, '0');
        const fullDate = `${targetMonth}-${dayStr}`;
        labels.push(`${d}日`);
        const amt = dayTotals[fullDate] || 0;
        data.push(amt);
        if (amt > 0) hasData = true;
      }

      if (!hasData) {
        canvas.style.display = 'none';
        if (emptyMsg) emptyMsg.style.display = 'flex';
        return;
      }

      canvas.style.display = 'block';
      if (emptyMsg) emptyMsg.style.display = 'none';

      if (typeof Chart === 'undefined') return;

      const ctx = canvas.getContext('2d');
      chartInstances['daily'] = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: '每日支出',
            data: data,
            backgroundColor: '#EBCAD9',
            hoverBackgroundColor: '#F4B8CD',
            borderRadius: 6,
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
              padding: 10,
              callbacks: {
                label: function(context) {
                  const currency = getStorage().getSettings().currency || 'NT$';
                  return ` 支出: ${currency} ${context.raw.toLocaleString()}`;
                }
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: {
                color: '#8C7187',
                font: { size: 10, family: "'Zen Maru Gothic', sans-serif" }
              }
            },
            y: {
              grid: { color: 'rgba(140, 113, 135, 0.08)' },
              ticks: {
                color: '#8C7187',
                font: { size: 10, family: "'Zen Maru Gothic', sans-serif" }
              }
            }
          }
        }
      });
    },

    renderMonthlyCompareChart(records) {
      const canvas = document.getElementById('chart-monthly-compare');
      if (!canvas) return;

      destroyChart('monthlyCompare');

      const months = [];
      const today = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        months.push({ key: `${y}-${m}`, label: `${y}/${m}` });
      }

      const incomeData = [];
      const expenseData = [];

      months.forEach(mObj => {
        const monthRecs = records.filter(r => r.date && r.date.startsWith(mObj.key));
        const inc = monthRecs.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0);
        const exp = monthRecs.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0);
        incomeData.push(inc);
        expenseData.push(exp);
      });

      if (typeof Chart === 'undefined') return;

      const ctx = canvas.getContext('2d');
      chartInstances['monthlyCompare'] = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: months.map(m => m.label),
          datasets: [
            {
              label: '收入',
              data: incomeData,
              backgroundColor: '#D8C5E8',
              borderRadius: 6
            },
            {
              label: '支出',
              data: expenseData,
              backgroundColor: '#F4B8CD',
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                boxWidth: 12,
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
              padding: 10
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: '#8C7187', font: { size: 11 } }
            },
            y: {
              grid: { color: 'rgba(140, 113, 135, 0.08)' },
              ticks: { color: '#8C7187', font: { size: 10 } }
            }
          }
        }
      });
    },

    renderMonthlyTrendChart(records) {
      const canvas = document.getElementById('chart-monthly-trend');
      if (!canvas) return;

      destroyChart('monthlyTrend');

      const months = [];
      const today = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        months.push({ key: `${y}-${m}`, label: `${y}/${m}` });
      }

      const expenseTrend = months.map(mObj => {
        return records
          .filter(r => r.type === 'expense' && r.date && r.date.startsWith(mObj.key))
          .reduce((s, r) => s + r.amount, 0);
      });

      if (typeof Chart === 'undefined') return;

      const ctx = canvas.getContext('2d');
      chartInstances['monthlyTrend'] = new Chart(ctx, {
        type: 'line',
        data: {
          labels: months.map(m => m.label),
          datasets: [{
            label: '每月支出趨勢',
            data: expenseTrend,
            borderColor: '#8C7187',
            backgroundColor: 'rgba(235, 202, 217, 0.35)',
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#FFFFFF',
            pointBorderColor: '#8C7187',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
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
              padding: 10,
              callbacks: {
                label: function(context) {
                  const currency = getStorage().getSettings().currency || 'NT$';
                  return ` 支出: ${currency} ${context.raw.toLocaleString()}`;
                }
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: '#8C7187', font: { size: 11 } }
            },
            y: {
              grid: { color: 'rgba(140, 113, 135, 0.08)' },
              ticks: { color: '#8C7187', font: { size: 10 } }
            }
          }
        }
      });
    }
  };
})();

// Attach to window
window.Statistics = Statistics;
