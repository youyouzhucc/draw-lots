/**
 * 职场每日占卜 - 主逻辑
 * 基于 生日 + 日期 生成确定性种子，保证每日一签
 */
(function () {
  const form = document.getElementById('form');
  const datetimeEl = document.getElementById('datetime');

  /** 更新头部日期时间（每秒刷新） */
  function updateDateTime() {
    if (!datetimeEl) return;
    const d = new Date();
    const dateStr = d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日';
    const timeStr = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ':' + String(d.getSeconds()).padStart(2, '0');
    datetimeEl.textContent = dateStr + ' ' + timeStr;
  }
  updateDateTime();
  setInterval(updateDateTime, 1000);

  const result = document.getElementById('result');
  const signCard = document.getElementById('sign-card');
  const monthSelect = document.getElementById('month');
  const daySelect = document.getElementById('day');
  const resetBtn = document.getElementById('reset-btn');

  /** 根据月份获取天数（2月按29天，兼容闰年） */
  function getDaysInMonth(month) {
    const m = parseInt(month, 10);
    if (!m || m < 1 || m > 12) return 31;
    if (m === 2) return 29;
    if ([4, 6, 9, 11].includes(m)) return 30;
    return 31;
  }

  /** 更新日的下拉选项 */
  function updateDayOptions() {
    const month = monthSelect.value;
    if (!month) {
      daySelect.innerHTML = '<option value="">日</option>';
      return;
    }
    const days = getDaysInMonth(month);
    const currentDay = parseInt(daySelect.value, 10) || 1;

    const toSelect = Math.min(Math.max(1, currentDay), days);
    daySelect.innerHTML = '<option value="">日</option>';
    for (let d = 1; d <= days; d++) {
      const opt = document.createElement('option');
      opt.value = d;
      opt.textContent = d + '日';
      if (d === toSelect) opt.selected = true;
      daySelect.appendChild(opt);
    }
  }

  monthSelect.addEventListener('change', updateDayOptions);
  monthSelect.addEventListener('input', updateDayOptions);

  /** 简单哈希：将字符串转为 0~n-1 的整数 */
  function hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h * 31 + str.charCodeAt(i)) >>> 0;
    }
    return h;
  }

  /** 获取今日日期字符串 YYYY-MM-DD */
  function getTodayStr() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  /** 抽签：基于生日+日期+关注类型生成确定性结果 */
  function draw(month, day, focus = '', extra = '') {
    const today = getTodayStr();
    const signs = focus && SIGNS_BY_FOCUS[focus] ? SIGNS_BY_FOCUS[focus] : SIGNS_DEFAULT;
    const seed = `${month}-${day}-${today}-${focus}-${extra}`;
    const idx = hash(seed) % signs.length;
    return { ...signs[idx], index: idx };
  }

  /** 显示结果 */
  function showResult(data) {
    const levelClass = {
      '大吉': 'level-daji',
      '吉': 'level-ji',
      '中吉': 'level-zhongji',
      '小吉': 'level-xiaoji',
      '平': 'level-ping',
      '末吉': 'level-moji',
      '凶': 'level-xiong',
    };
    const cls = levelClass[data.level] || 'level-ping';

    signCard.innerHTML = `
      ${data.zodiac ? `<div class="sign-zodiac">${data.zodiac}</div>` : ''}
      <div class="sign-level ${cls}">${data.level}</div>
      <div class="sign-title">${data.title}</div>
      <div class="sign-text">${data.text}</div>
      <div class="sign-advice">💡 ${data.advice}</div>
    `;
    result.classList.remove('hidden');
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /** 初始化日的选项（默认31天） */
  updateDayOptions();

  /** 表单提交 */
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const month = parseInt(monthSelect.value, 10);
    const day = parseInt(daySelect.value, 10);
    const name = (document.getElementById('name').value || '').trim();
    const focus = (document.getElementById('focus').value || '').trim();

    if (!month || !day || month < 1 || month > 12 || day < 1 || day > 31) {
      alert('请填写有效的生日（月、日）');
      return;
    }

    const extra = name;
    const signData = draw(month, day, focus, extra);
    const zodiac = getZodiacSign(month, day);

    signData.zodiac = zodiac;
    signData.userName = name || '你';
    showResult(signData);
  });

  form.addEventListener('reset', () => setTimeout(updateDayOptions, 0));

  /** 重置 */
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      result.classList.add('hidden');
      form.reset();
    });
  }
})();
