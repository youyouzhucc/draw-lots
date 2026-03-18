/**
 * 职场每日占卜 - 主逻辑
 * 基于 生日 + 日期 生成确定性种子，保证每日一签
 */
(function () {
  const form = document.getElementById('form');
  const dateEl = document.getElementById('datetime-date');
  const hourEl = document.getElementById('flip-hour');
  const minEl = document.getElementById('flip-min');
  const secEl = document.getElementById('flip-sec');

  const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

  /** 更新头部日期时间（ flip 样式，每秒刷新） */
  function updateDateTime() {
    const d = new Date();
    if (dateEl) {
      dateEl.textContent = d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + WEEKDAYS[d.getDay()];
    }
    if (hourEl) hourEl.textContent = String(d.getHours()).padStart(2, '0');
    if (minEl) minEl.textContent = String(d.getMinutes()).padStart(2, '0');
    if (secEl) secEl.textContent = String(d.getSeconds()).padStart(2, '0');
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

  /** 登录注册 */
  const authBtn = document.getElementById('auth-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const userInfo = document.getElementById('user-info');
  const userHint = document.getElementById('user-hint');
  const formBirthday = document.getElementById('form-birthday');
  const formName = document.getElementById('form-name');
  const authModal = document.getElementById('auth-modal');
  const authForm = document.getElementById('auth-form');
  const authTabs = document.querySelectorAll('.auth-tab');
  const authLogin = document.getElementById('auth-login');
  const authRegister = document.getElementById('auth-register');
  const authClose = document.getElementById('auth-close');
  const authSubmit = document.getElementById('auth-submit');
  const regMonth = document.getElementById('reg-month');
  const regDay = document.getElementById('reg-day');

  function updateRegDayOptions() {
    const m = regMonth.value;
    if (!m) {
      regDay.innerHTML = '<option value="">日</option>';
      return;
    }
    const days = getDaysInMonth(m);
    regDay.innerHTML = '<option value="">日</option>';
    for (let d = 1; d <= days; d++) {
      const opt = document.createElement('option');
      opt.value = d;
      opt.textContent = d + '日';
      regDay.appendChild(opt);
    }
  }
  if (regMonth) regMonth.addEventListener('change', updateRegDayOptions);

  function applyAuthState() {
    const user = window.Auth && window.Auth.getCurrent();
    if (user) {
      if (authBtn) authBtn.classList.add('hidden');
      if (userInfo) { userInfo.classList.remove('hidden'); userInfo.textContent = '欢迎，' + user.nickname; }
      if (logoutBtn) logoutBtn.classList.remove('hidden');
      if (userHint) userHint.classList.remove('hidden');
      if (formBirthday) formBirthday.classList.add('hidden');
      if (formName) formName.classList.add('hidden');
      monthSelect.removeAttribute('required');
      daySelect.removeAttribute('required');
      monthSelect.value = user.month;
      daySelect.value = user.day;
      document.getElementById('name').value = user.nickname;
      updateDayOptions();
    } else {
      if (authBtn) authBtn.classList.remove('hidden');
      if (userInfo) userInfo.classList.add('hidden');
      if (logoutBtn) logoutBtn.classList.add('hidden');
      if (userHint) userHint.classList.add('hidden');
      if (formBirthday) formBirthday.classList.remove('hidden');
      if (formName) formName.classList.remove('hidden');
      monthSelect.setAttribute('required', '');
      daySelect.setAttribute('required', '');
    }
  }
  if (window.Auth) applyAuthState();

  if (authBtn) authBtn.addEventListener('click', () => { authModal && authModal.classList.remove('hidden'); });
  if (authClose) authClose.addEventListener('click', () => { authModal && authModal.classList.add('hidden'); });
  if (logoutBtn) logoutBtn.addEventListener('click', () => {
    if (window.Auth) window.Auth.logout();
    applyAuthState();
    form.reset();
    updateDayOptions();
  });

  authTabs && authTabs.forEach((t) => {
    t.addEventListener('click', () => {
      authTabs.forEach((x) => x.classList.remove('active'));
      t.classList.add('active');
      const tab = t.dataset.tab;
      if (tab === 'login') {
        authLogin.classList.remove('hidden');
        authRegister.classList.add('hidden');
        authSubmit.textContent = '登录';
      } else {
        authLogin.classList.add('hidden');
        authRegister.classList.remove('hidden');
        authSubmit.textContent = '注册';
        updateRegDayOptions();
      }
    });
  });

  authForm && authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const tab = document.querySelector('.auth-tab.active').dataset.tab;
    if (tab === 'login') {
      const name = document.getElementById('auth-name').value.trim();
      const pwd = document.getElementById('auth-pwd').value;
      const r = window.Auth.login(name, pwd);
      if (r.ok) {
        authModal.classList.add('hidden');
        applyAuthState();
      } else {
        alert(r.msg);
      }
    } else {
      const name = document.getElementById('reg-name').value.trim();
      const month = parseInt(regMonth.value, 10);
      const day = parseInt(regDay.value, 10);
      const pwd = document.getElementById('reg-pwd').value;
      if (!month || !day) {
        alert('请选择生日');
        return;
      }
      const r = window.Auth.register(name, month, day, pwd);
      if (r.ok) {
        authModal.classList.add('hidden');
        applyAuthState();
      } else {
        alert(r.msg);
      }
    }
  });

  /** 模式切换：抽签 / 六爻 */
  const modeTabs = document.querySelectorAll('.mode-tab');
  const sectionDraw = document.getElementById('section-draw');
  const sectionLiuyao = document.getElementById('section-liuyao');

  modeTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      modeTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const mode = tab.dataset.mode;
      if (mode === 'draw') {
        sectionDraw.classList.remove('hidden');
        sectionLiuyao.classList.add('hidden');
        result.classList.add('hidden');
      } else {
        sectionDraw.classList.add('hidden');
        sectionLiuyao.classList.remove('hidden');
        result.classList.add('hidden');
      }
    });
  });

  /** 六爻摇卦 */
  const liuyaoBtn = document.getElementById('liuyao-btn');
  const liuyaoResult = document.getElementById('liuyao-result');
  const liuyaoHexagram = document.getElementById('liuyao-hexagram');
  const liuyaoName = document.getElementById('liuyao-name');
  const liuyaoMeaning = document.getElementById('liuyao-meaning');

  if (liuyaoBtn) {
    liuyaoBtn.addEventListener('click', () => {
      const lines = [];
      for (let i = 0; i < 6; i++) {
        const c1 = Math.random() < 0.5 ? 2 : 3;
        const c2 = Math.random() < 0.5 ? 2 : 3;
        const c3 = Math.random() < 0.5 ? 2 : 3;
        const sum = c1 + c2 + c3;
        lines.push(sum === 7 || sum === 9 ? 1 : 0);
      }
      const idx = lines.reduce((acc, b, i) => acc + (b << i), 0);
      const name = HEXAGRAM_NAMES[idx];
      const meaning = HEXAGRAM_MEANINGS[idx];
      const levelClass = { '大吉': 'level-daji', '吉': 'level-ji', '中吉': 'level-zhongji', '小吉': 'level-xiaoji', '平': 'level-ping', '末吉': 'level-moji', '凶': 'level-xiong' };
      const cls = levelClass[meaning.level] || 'level-ping';
      const lineHtml = lines.slice().reverse().map((b) =>
        `<div class="liuyao-line-${b ? 'yang' : 'yin'}">${b ? '——' : '— —'}</div>`
      ).join('');
      liuyaoHexagram.innerHTML = lineHtml;
      liuyaoName.textContent = name + '卦';
      liuyaoMeaning.innerHTML = `<div class="level ${cls}">${meaning.level}</div><div>${meaning.text}</div><div class="advice">💡 ${meaning.advice}</div>`;
      liuyaoResult.classList.remove('hidden');
      liuyaoResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }


  /** 表单提交 */
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const user = window.Auth && window.Auth.getCurrent();
    let month, day, name;
    if (user) {
      month = user.month;
      day = user.day;
      name = user.nickname;
    } else {
      month = parseInt(monthSelect.value, 10);
      day = parseInt(daySelect.value, 10);
      name = (document.getElementById('name').value || '').trim();
    }
    const focus = (document.getElementById('focus').value || '').trim();

    if (!month || !day || month < 1 || month > 12 || day < 1 || day > 31) {
      alert('请填写有效的生日（月、日），或先登录/注册');
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
      const user = window.Auth && window.Auth.getCurrent();
      if (user) {
        monthSelect.value = user.month;
        daySelect.value = user.day;
        document.getElementById('name').value = user.nickname;
      }
      updateDayOptions();
    });
  }
})();
