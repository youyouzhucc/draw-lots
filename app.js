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

  /** 模式切换：抽签 / 六爻 / 八字 / 紫微 / 相学 / 奇门 / 六壬 */
  const modeTabs = document.querySelectorAll('.mode-tab');
  const sections = {
    draw: document.getElementById('section-draw'),
    liuyao: document.getElementById('section-liuyao'),
    bazi: document.getElementById('section-bazi'),
    ziwei: document.getElementById('section-ziwei'),
    xiangxue: document.getElementById('section-xiangxue'),
    qimen: document.getElementById('section-qimen'),
    liuren: document.getElementById('section-liuren'),
  };

  function hideAllDivineResults() {
    const ids = ['liuyao-result', 'bazi-result', 'ziwei-result', 'xiangxue-result', 'qimen-result', 'liuren-result'];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });
  }

  modeTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      modeTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const mode = tab.dataset.mode;
      Object.values(sections).forEach((s) => s && s.classList.add('hidden'));
      if (sections[mode]) sections[mode].classList.remove('hidden');
      result.classList.add('hidden');
      hideAllDivineResults();
    });
  });

  /** 通用：更新日选项（用于八字/紫微/相学表单） */
  function updateDayOptionsFor(monthSelect, daySelect) {
    if (!monthSelect || !daySelect) return;
    const month = monthSelect.value;
    if (!month) {
      daySelect.innerHTML = '<option value="">日</option>';
      return;
    }
    const days = getDaysInMonth(month);
    daySelect.innerHTML = '<option value="">日</option>';
    for (let d = 1; d <= days; d++) {
      const opt = document.createElement('option');
      opt.value = d;
      opt.textContent = d + '日';
      daySelect.appendChild(opt);
    }
  }

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

  /** 八字排盘 */
  const formBazi = document.getElementById('form-bazi');
  const baziMonth = document.getElementById('bazi-month');
  const baziDay = document.getElementById('bazi-day');
  const baziResult = document.getElementById('bazi-result');
  if (baziMonth) baziMonth.addEventListener('change', () => updateDayOptionsFor(baziMonth, baziDay));
  if (formBazi && baziResult) {
    formBazi.addEventListener('submit', (e) => {
      e.preventDefault();
      const month = parseInt(baziMonth?.value, 10);
      const day = parseInt(baziDay?.value, 10);
      const shichen = parseInt(document.getElementById('bazi-shichen')?.value || '0', 10);
      if (!month || !day) {
        alert('请选择生日');
        return;
      }
      const today = getTodayStr();
      const seed = `${month}-${day}-${shichen}-${today}`;
      const idx = hash(seed) % BAZI_CAREER.length;
      const career = BAZI_CAREER[idx];
      const s = String(hash(seed));
      const pillar = (i) => TIAN_GAN[Math.abs(hash(s + i)) % 10] + DI_ZHI[Math.abs(hash(s + i + 10)) % 12];
      const levelClass = { '大吉': 'level-daji', '吉': 'level-ji', '中吉': 'level-zhongji', '小吉': 'level-xiaoji', '平': 'level-ping', '末吉': 'level-moji', '凶': 'level-xiong' };
      const cls = levelClass[career.level] || 'level-ping';
      baziResult.innerHTML = `
        <div class="bazi-pillars">
          <div class="bazi-labels">年柱 月柱 日柱 时柱</div>
          <div class="bazi-values">${pillar(0)} ${pillar(1)} ${pillar(2)} ${pillar(3)}</div>
        </div>
        <div class="bazi-shichen">出生时辰：${SHI_CHEN[shichen]}</div>
        <div class="sign-level ${cls}">${career.level}</div>
        <div class="sign-text">${career.text}</div>
        <div class="sign-advice">💡 ${career.advice}</div>
      `;
      baziResult.classList.remove('hidden');
      baziResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  /** 紫微查星 */
  const formZiwei = document.getElementById('form-ziwei');
  const ziweiMonth = document.getElementById('ziwei-month');
  const ziweiDay = document.getElementById('ziwei-day');
  const ziweiResult = document.getElementById('ziwei-result');
  if (ziweiMonth) ziweiMonth.addEventListener('change', () => updateDayOptionsFor(ziweiMonth, ziweiDay));
  if (formZiwei && ziweiResult) {
    formZiwei.addEventListener('submit', (e) => {
      e.preventDefault();
      const month = parseInt(ziweiMonth?.value, 10);
      const day = parseInt(ziweiDay?.value, 10);
      if (!month || !day) {
        alert('请选择生日');
        return;
      }
      const today = getTodayStr();
      const seed = `${month}-${day}-${today}`;
      const idx = hash(seed) % ZIWEI_STARS.length;
      const star = ZIWEI_STARS[idx];
      const levelClass = { '大吉': 'level-daji', '吉': 'level-ji', '中吉': 'level-zhongji', '小吉': 'level-xiaoji', '平': 'level-ping', '末吉': 'level-moji', '凶': 'level-xiong' };
      const cls = levelClass[star.level] || 'level-ping';
      ziweiResult.innerHTML = `
        <div class="ziwei-star">${star.name}星</div>
        <div class="sign-level ${cls}">${star.level}</div>
        <div class="sign-text">${star.text}</div>
        <div class="sign-advice">💡 ${star.advice}</div>
      `;
      ziweiResult.classList.remove('hidden');
      ziweiResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  /** 相学观相 */
  const formXiangxue = document.getElementById('form-xiangxue');
  const xiangxueMonth = document.getElementById('xiangxue-month');
  const xiangxueDay = document.getElementById('xiangxue-day');
  const xiangxueResult = document.getElementById('xiangxue-result');
  if (xiangxueMonth) xiangxueMonth.addEventListener('change', () => updateDayOptionsFor(xiangxueMonth, xiangxueDay));
  if (formXiangxue && xiangxueResult) {
    formXiangxue.addEventListener('submit', (e) => {
      e.preventDefault();
      const month = parseInt(xiangxueMonth?.value, 10);
      const day = parseInt(xiangxueDay?.value, 10);
      if (!month || !day) {
        alert('请选择生日');
        return;
      }
      const today = getTodayStr();
      const seed = `${month}-${day}-${today}`;
      const partIdx1 = hash(seed) % XIANGXUE_PARTS.length;
      let partIdx2 = (hash(seed + 'x') % XIANGXUE_PARTS.length);
      if (partIdx2 === partIdx1) partIdx2 = (partIdx2 + 1) % XIANGXUE_PARTS.length;
      const careerIdx = hash(seed + 'c') % XIANGXUE_CAREER.length;
      const part1 = XIANGXUE_PARTS[partIdx1];
      const part2 = XIANGXUE_PARTS[partIdx2];
      const career = XIANGXUE_CAREER[careerIdx];
      const levelClass = { '大吉': 'level-daji', '吉': 'level-ji', '中吉': 'level-zhongji', '小吉': 'level-xiaoji', '平': 'level-ping', '末吉': 'level-moji', '凶': 'level-xiong' };
      const cls = levelClass[career.level] || 'level-ping';
      xiangxueResult.innerHTML = `
        <div class="xiangxue-parts">今日面相重点：<strong>${part1.part}</strong>、<strong>${part2.part}</strong></div>
        <div class="sign-text">${part1.desc} ${part2.desc}</div>
        <div class="sign-level ${cls}">${career.level}</div>
        <div class="sign-text">${career.text}</div>
        <div class="sign-advice">💡 ${career.advice}</div>
      `;
      xiangxueResult.classList.remove('hidden');
      xiangxueResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  /** 奇门起局 */
  const qimenBtn = document.getElementById('qimen-btn');
  const qimenResult = document.getElementById('qimen-result');
  if (qimenBtn && qimenResult) {
    qimenBtn.addEventListener('click', () => {
      const today = getTodayStr();
      const seed = hash(today);
      const doorIdx = (seed % QIMEN_DOORS.length + QIMEN_DOORS.length) % QIMEN_DOORS.length;
      const starIdx = ((seed >> 8) % QIMEN_STARS.length + QIMEN_STARS.length) % QIMEN_STARS.length;
      const dirIdx = ((seed >> 16) % QIMEN_DIRECTIONS.length + QIMEN_DIRECTIONS.length) % QIMEN_DIRECTIONS.length;
      const careerIdx = ((seed >> 24) % QIMEN_CAREER.length + QIMEN_CAREER.length) % QIMEN_CAREER.length;
      const career = QIMEN_CAREER[careerIdx];
      const levelClass = { '大吉': 'level-daji', '吉': 'level-ji', '中吉': 'level-zhongji', '小吉': 'level-xiaoji', '平': 'level-ping', '末吉': 'level-moji', '凶': 'level-xiong' };
      const cls = levelClass[career.level] || 'level-ping';
      qimenResult.innerHTML = `
        <div class="qimen-info">今日：${QIMEN_DOORS[doorIdx]} · ${QIMEN_STARS[starIdx]} · 吉方位：${QIMEN_DIRECTIONS[dirIdx]}</div>
        <div class="sign-level ${cls}">${career.level}</div>
        <div class="sign-text">${career.text}</div>
        <div class="sign-advice">💡 ${career.advice}</div>
      `;
      qimenResult.classList.remove('hidden');
      qimenResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  /** 六壬起课 */
  const liurenBtn = document.getElementById('liuren-btn');
  const liurenResult = document.getElementById('liuren-result');
  if (liurenBtn && liurenResult) {
    liurenBtn.addEventListener('click', () => {
      const today = getTodayStr();
      const seed = hash(today);
      const godIdx = (seed % LIUREN_GODS.length + LIUREN_GODS.length) % LIUREN_GODS.length;
      const careerIdx = ((seed >> 8) % LIUREN_CAREER.length + LIUREN_CAREER.length) % LIUREN_CAREER.length;
      const career = LIUREN_CAREER[careerIdx];
      const levelClass = { '大吉': 'level-daji', '吉': 'level-ji', '中吉': 'level-zhongji', '小吉': 'level-xiaoji', '平': 'level-ping', '末吉': 'level-moji', '凶': 'level-xiong' };
      const cls = levelClass[career.level] || 'level-ping';
      liurenResult.innerHTML = `
        <div class="liuren-info">今日发用：<strong>${LIUREN_GODS[godIdx]}</strong></div>
        <div class="sign-level ${cls}">${career.level}</div>
        <div class="sign-text">${career.text}</div>
        <div class="sign-advice">💡 ${career.advice}</div>
      `;
      liurenResult.classList.remove('hidden');
      liurenResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
