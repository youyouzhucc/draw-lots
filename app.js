/**
 * 每日占卜 - 主逻辑
 * 支持职场、恋爱、财富等方向，基于生日+日期生成确定性种子
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

  /** 根据月份获取天数（2月按29天，兼容闰年） */
  function getDaysInMonth(month) {
    const m = parseInt(month, 10);
    if (!m || m < 1 || m > 12) return 31;
    if (m === 2) return 29;
    if ([4, 6, 9, 11].includes(m)) return 30;
    return 31;
  }

  /** 更新日的下拉选项，可选传入要保留的日 overrideDay */
  function updateDayOptions(overrideDay) {
    const month = monthSelect.value;
    if (!month) {
      daySelect.innerHTML = '<option value="">日</option>';
      return;
    }
    const days = getDaysInMonth(month);
    const currentDay = overrideDay != null ? Math.min(Math.max(1, overrideDay), days) : (parseInt(daySelect.value, 10) || 1);
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

  /** 抽签：基于生日+日期+关注类型+心意生成确定性结果，千人千面 */
  function draw(month, day, focus = '', extra = '', heart = {}) {
    const today = getTodayStr();
    const signs = focus && SIGNS_BY_FOCUS[focus] ? SIGNS_BY_FOCUS[focus] : SIGNS_DEFAULT;
    const { thought = '', mood = '', lucky = '' } = heart;
    const seed = `${month}-${day}-${today}-${focus}-${extra}-${thought}-${mood}-${lucky}`;
    const idx = hash(seed) % signs.length;
    return { ...signs[idx], index: idx, moodPrefix: getMoodPrefix(mood) };
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
    const moodLine = data.moodPrefix ? `<div class="mood-prefix">${data.moodPrefix}</div>` : '';

    signCard.innerHTML = `
      ${data.zodiac ? `<div class="sign-zodiac">${data.zodiac}</div>` : ''}
      ${moodLine}
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

  /** 登录注册 - 占卜前需登录，点击提交时未登录则弹窗 */
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
  const logoutLink = document.getElementById('logout-link');

  /** 占卜前检查登录，未登录则弹窗并返回 false */
  function requireAuth() {
    const user = window.Auth && window.Auth.getCurrent();
    if (user) return true;
    if (authModal) authModal.classList.remove('hidden');
    return false;
  }

  /** 获取当前用户昵称（用于每日缓存 key） */
  function getNickname() {
    const user = window.Auth && window.Auth.getCurrent();
    return (user && user.nickname) ? user.nickname : 'guest';
  }

  /** 从缓存恢复某模式的占卜结果 */
  function restoreResult(mode, data) {
    if (!data) return;
    if (mode === 'draw') {
      showResult(data);
      return;
    }
    if (mode === 'liuyao') {
      liuyaoHexagram.innerHTML = data.lineHtml || '';
      liuyaoName.textContent = data.name || '';
      liuyaoMeaning.innerHTML = data.meaningHtml || '';
      liuyaoResult.classList.remove('hidden');
      liuyaoResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }
    const resultEl = document.getElementById(mode + '-result');
    if (resultEl && data.html) {
      resultEl.innerHTML = data.html;
      resultEl.classList.remove('hidden');
      resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function updateRegDayOptions() {
    const m = regMonth?.value;
    if (!m) {
      if (regDay) regDay.innerHTML = '<option value="">请先选择月份</option>';
      return;
    }
    const days = getDaysInMonth(m);
    if (regDay) {
      regDay.innerHTML = '';
      for (let d = 1; d <= days; d++) {
        const opt = document.createElement('option');
        opt.value = d;
        opt.textContent = d + '日';
        if (d === 1) opt.selected = true;
        regDay.appendChild(opt);
      }
    }
  }
  if (regMonth) regMonth.addEventListener('change', updateRegDayOptions);

  setAuthPanelRequired(true);

  function applyAuthState() {
    const user = window.Auth && window.Auth.getCurrent();
    if (user) {
      if (userHint) userHint.classList.remove('hidden');
      if (formBirthday) formBirthday.classList.add('hidden');
      if (formName) formName.classList.add('hidden');
      monthSelect.removeAttribute('required');
      daySelect.removeAttribute('required');
      const m = parseInt(user.month, 10) || 1;
      const d = parseInt(user.day, 10) || 1;
      monthSelect.value = String(m);
      updateDayOptions(d);
      const nameEl = document.getElementById('name');
      if (nameEl) nameEl.value = user.nickname || '';
    } else {
      if (userHint) userHint.classList.add('hidden');
      if (formBirthday) formBirthday.classList.remove('hidden');
      if (formName) formName.classList.remove('hidden');
      monthSelect.setAttribute('required', '');
      daySelect.setAttribute('required', '');
    }
    updateAllDivineBtnStates();
  }
  if (window.Auth) applyAuthState();

  /** 各主题下的关注选项 */
  const FOCUS_OPTIONS = {
    职场: [
      { value: '职场氛围', label: '防小人' },
      { value: '升职加薪', label: '求加薪' },
      { value: '跳槽转岗', label: '想跳槽' },
      { value: '面试求职', label: '面试顺利' },
      { value: '项目推进', label: '项目起飞' },
    ],
    恋爱: [
      { value: '桃花运', label: '桃花运' },
      { value: '恋爱运势', label: '恋爱运势' },
      { value: '复合', label: '想复合' },
      { value: '表白', label: '想表白' },
      { value: '脱单', label: '想脱单' },
    ],
    财富: [
      { value: '正财运', label: '正财运' },
      { value: '偏财运', label: '偏财运' },
      { value: '投资', label: '投资' },
      { value: '创业', label: '创业' },
      { value: '理财', label: '理财' },
    ],
  };

  /** 根据主题更新关注选项 */
  function updateFocusOptions() {
    const themeSelect = document.getElementById('theme');
    const focusSelect = document.getElementById('focus');
    if (!themeSelect || !focusSelect) return;
    const theme = themeSelect.value || '职场';
    const opts = FOCUS_OPTIONS[theme] || FOCUS_OPTIONS['职场'];
    const currentVal = focusSelect.value;
    focusSelect.innerHTML = '<option value="">-- 可选 --</option>';
    opts.forEach((o) => {
      const opt = document.createElement('option');
      opt.value = o.value;
      opt.textContent = o.label;
      if (o.value === currentVal) opt.selected = true;
      focusSelect.appendChild(opt);
    });
  }

  /** 获取当前抽签的缓存 key（按主题+关注类型区分） */
  function getDrawCacheKey() {
    const theme = (document.getElementById('theme')?.value || '职场').trim();
    const focus = (document.getElementById('focus')?.value || '').trim();
    return 'draw:' + theme + ':' + (focus || 'default');
  }

  /** 获取六种占卜的当前主题 */
  function getDivineTheme(mode) {
    const el = document.getElementById(mode + '-theme');
    return (el?.value || '职场').trim();
  }

  /** 获取六种占卜的缓存 key（按模式+主题区分） */
  function getDivineCacheKey(mode) {
    return mode + ':' + getDivineTheme(mode);
  }

  /** 获取占卜心意（心中所念、今日心境、幸运数字），用于种子与千人千面 */
  function getDivineHeart(mode) {
    const prefix = mode === 'draw' ? 'draw' : mode;
    const thought = (document.getElementById(prefix + '-thought')?.value || '').trim().slice(0, 50);
    const mood = (document.getElementById(prefix + '-mood')?.value || '').trim();
    const lucky = (document.getElementById(prefix + '-lucky')?.value || '').trim();
    return { thought, mood, lucky };
  }

  /** 心境对应的个性化开场，千人千面 */
  const MOOD_PREFIX = {
    平静: '',
    期待: '你带着期待而来，卦象如是回应——',
    焦虑: '你今日心事略重，不妨先静一静，再细品下文。',
    迷茫: '你正处迷茫，卦象或可给你一点方向。',
    开心: '你今日心情不错，卦象亦锦上添花。',
  };
  function getMoodPrefix(mood) {
    return (mood && MOOD_PREFIX[mood]) ? MOOD_PREFIX[mood] : '';
  }

  /** 根据当前关注类型是否已抽签，更新抽签按钮状态 */
  function updateDrawBtnState() {
    const drawBtn = document.getElementById('draw-btn');
    if (!drawBtn) return;
    const nickname = getNickname();
    const cacheKey = getDrawCacheKey();
    const used = window.DailyCache && window.DailyCache.hasUsed(nickname, cacheKey);
    if (used) {
      drawBtn.disabled = true;
      drawBtn.textContent = '今日该类型抽签次数已用完';
    } else {
      drawBtn.disabled = false;
      drawBtn.textContent = '抽签';
    }
  }

  /** 更新某占卜类型的按钮状态（六爻/八字/紫微/相学/奇门/六壬） */
  function updateDivineBtnState(mode, btn, usedText, defaultText) {
    if (!btn) return;
    const nickname = getNickname();
    const cacheKey = getDivineCacheKey(mode);
    const used = window.DailyCache && window.DailyCache.hasUsed(nickname, cacheKey);
    if (used) {
      btn.disabled = true;
      btn.textContent = usedText;
    } else {
      btn.disabled = false;
      btn.textContent = defaultText;
    }
  }

  /** 更新所有占卜类型按钮状态 */
  function updateAllDivineBtnStates() {
    updateDrawBtnState();
    updateDivineBtnState('liuyao', document.getElementById('liuyao-btn'), '今日摇卦次数已用完', '摇卦');
    updateDivineBtnState('bazi', document.getElementById('form-bazi')?.querySelector('button[type="submit"]'), '今日排盘次数已用完', '排盘');
    updateDivineBtnState('ziwei', document.getElementById('form-ziwei')?.querySelector('button[type="submit"]'), '今日查星次数已用完', '查星');
    updateDivineBtnState('xiangxue', document.getElementById('form-xiangxue')?.querySelector('button[type="submit"]'), '今日观相次数已用完', '观相');
    updateDivineBtnState('qimen', document.getElementById('qimen-btn'), '今日起局次数已用完', '起局');
    updateDivineBtnState('liuren', document.getElementById('liuren-btn'), '今日起课次数已用完', '起课');
  }

  if (authClose) authClose.addEventListener('click', () => { authModal && authModal.classList.add('hidden'); });
  if (logoutLink) logoutLink.addEventListener('click', (e) => {
    e.preventDefault();
    if (window.Auth) window.Auth.logout();
    applyAuthState();
    form.reset();
    updateDayOptions();
  });

  function setAuthPanelRequired(loginVisible) {
    const loginName = document.getElementById('auth-name');
    const loginPwd = document.getElementById('auth-pwd');
    const regName = document.getElementById('reg-name');
    const regPwd = document.getElementById('reg-pwd');
    if (loginVisible) {
      if (loginName) loginName.setAttribute('required', '');
      if (loginPwd) loginPwd.setAttribute('required', '');
      if (regName) regName.removeAttribute('required');
      if (regPwd) regPwd.removeAttribute('required');
      if (regMonth) regMonth.removeAttribute('required');
      if (regDay) regDay.removeAttribute('required');
    } else {
      if (loginName) loginName.removeAttribute('required');
      if (loginPwd) loginPwd.removeAttribute('required');
      if (regName) regName.setAttribute('required', '');
      if (regPwd) regPwd.setAttribute('required', '');
      if (regMonth) regMonth.setAttribute('required', '');
      if (regDay) regDay.setAttribute('required', '');
    }
  }

  authTabs && authTabs.forEach((t) => {
    t.addEventListener('click', () => {
      authTabs.forEach((x) => x.classList.remove('active'));
      t.classList.add('active');
      const tab = t.dataset.tab;
      if (tab === 'login') {
        authLogin.classList.remove('hidden');
        authRegister.classList.add('hidden');
        authSubmit.textContent = '登录';
        setAuthPanelRequired(true);
      } else {
        authLogin.classList.add('hidden');
        authRegister.classList.remove('hidden');
        authSubmit.textContent = '注册';
        setAuthPanelRequired(false);
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
      const nickname = getNickname();
      const cacheKey = mode === 'draw' ? getDrawCacheKey() : getDivineCacheKey(mode);
      const cached = window.DailyCache && window.DailyCache.get(nickname, cacheKey);
      if (cached) restoreResult(mode, cached);
      updateAllDivineBtnStates();
    });
  });

  /** 主题切换时，更新关注选项并恢复该类型的结果 */
  const themeSelect = document.getElementById('theme');
  if (themeSelect) {
    themeSelect.addEventListener('change', () => {
      updateFocusOptions();
      const nickname = getNickname();
      const cacheKey = getDrawCacheKey();
      const cached = window.DailyCache && window.DailyCache.get(nickname, cacheKey);
      if (cached) {
        showResult(cached);
      } else {
        result.classList.add('hidden');
      }
      updateDrawBtnState();
    });
  }

  /** 关注类型切换时，更新抽签按钮状态并恢复该类型的结果 */
  const focusSelect = document.getElementById('focus');
  if (focusSelect) {
    focusSelect.addEventListener('change', () => {
      const nickname = getNickname();
      const cacheKey = getDrawCacheKey();
      const cached = window.DailyCache && window.DailyCache.get(nickname, cacheKey);
      if (cached) {
        showResult(cached);
      } else {
        result.classList.add('hidden');
      }
      updateDrawBtnState();
    });
  }

  /** 六种占卜主题切换时，恢复该主题的结果并更新按钮状态 */
  const DIVINE_BTN_CONFIG = {
    liuyao: ['liuyao-btn', '今日摇卦次数已用完', '摇卦'],
    bazi: ['form-bazi', '今日排盘次数已用完', '排盘'],
    ziwei: ['form-ziwei', '今日查星次数已用完', '查星'],
    xiangxue: ['form-xiangxue', '今日观相次数已用完', '观相'],
    qimen: ['qimen-btn', '今日起局次数已用完', '起局'],
    liuren: ['liuren-btn', '今日起课次数已用完', '起课'],
  };
  ['liuyao', 'bazi', 'ziwei', 'xiangxue', 'qimen', 'liuren'].forEach((mode) => {
    const themeEl = document.getElementById(mode + '-theme');
    if (themeEl) {
      themeEl.addEventListener('change', () => {
        const nickname = getNickname();
        const cacheKey = getDivineCacheKey(mode);
        const cached = window.DailyCache && window.DailyCache.get(nickname, cacheKey);
        if (cached) {
          restoreResult(mode, cached);
        } else {
          const resultEl = document.getElementById(mode + '-result');
          if (resultEl) resultEl.classList.add('hidden');
        }
        const [id, usedText, defaultText] = DIVINE_BTN_CONFIG[mode];
        const btn = id.startsWith('form-') ? document.getElementById(id)?.querySelector('button[type="submit"]') : document.getElementById(id);
        updateDivineBtnState(mode, btn, usedText, defaultText);
      });
    }
  });

  /** 初始化关注选项 */
  updateFocusOptions();

  /** 初始加载时，若在抽签模式且已有今日缓存，恢复展示 */
  const drawSection = document.getElementById('section-draw');
  if (drawSection && !drawSection.classList.contains('hidden')) {
    const nickname = getNickname();
    const cached = window.DailyCache && window.DailyCache.get(nickname, getDrawCacheKey());
    if (cached) showResult(cached);
  }

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
      if (!requireAuth()) return;
      const nickname = getNickname();
      const theme = getDivineTheme('liuyao');
      const cacheKey = getDivineCacheKey('liuyao');
      const cached = window.DailyCache && window.DailyCache.get(nickname, cacheKey);
      if (cached) {
        restoreResult('liuyao', cached);
        return;
      }
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
      const meanings = HEXAGRAM_MEANINGS_BY_THEME && HEXAGRAM_MEANINGS_BY_THEME[theme] ? HEXAGRAM_MEANINGS_BY_THEME[theme] : HEXAGRAM_MEANINGS;
      const meaning = meanings[idx];
      const levelClass = { '大吉': 'level-daji', '吉': 'level-ji', '中吉': 'level-zhongji', '小吉': 'level-xiaoji', '平': 'level-ping', '末吉': 'level-moji', '凶': 'level-xiong' };
      const cls = levelClass[meaning.level] || 'level-ping';
      const lineHtml = lines.slice().reverse().map((b) =>
        `<div class="liuyao-line-${b ? 'yang' : 'yin'}">${b ? '——' : '— —'}</div>`
      ).join('');
      const heart = getDivineHeart('liuyao');
      const moodPrefix = getMoodPrefix(heart.mood);
      const moodLine = moodPrefix ? `<div class="mood-prefix">${moodPrefix}</div>` : '';
      liuyaoHexagram.innerHTML = lineHtml;
      liuyaoName.textContent = name + '卦';
      const meaningHtml = `${moodLine}<div class="level ${cls}">${meaning.level}</div><div>${meaning.text}</div><div class="advice">💡 ${meaning.advice}</div>`;
      liuyaoMeaning.innerHTML = meaningHtml;
      if (window.DailyCache) window.DailyCache.set(nickname, cacheKey, { lineHtml, name: name + '卦', meaningHtml });
      liuyaoResult.classList.remove('hidden');
      liuyaoResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      updateDivineBtnState('liuyao', liuyaoBtn, '今日摇卦次数已用完', '摇卦');
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
      if (!requireAuth()) return;
      const nickname = getNickname();
      const theme = getDivineTheme('bazi');
      const cacheKey = getDivineCacheKey('bazi');
      const cached = window.DailyCache && window.DailyCache.get(nickname, cacheKey);
      if (cached) {
        restoreResult('bazi', cached);
        return;
      }
      const month = parseInt(baziMonth?.value, 10);
      const day = parseInt(baziDay?.value, 10);
      const shichen = parseInt(document.getElementById('bazi-shichen')?.value || '0', 10);
      if (!month || !day) {
        alert('请选择生日');
        return;
      }
      const today = getTodayStr();
      const heart = getDivineHeart('bazi');
      const seed = `${month}-${day}-${shichen}-${today}-${heart.thought}-${heart.mood}-${heart.lucky}`;
      const arr = BAZI_BY_THEME && BAZI_BY_THEME[theme] ? BAZI_BY_THEME[theme] : BAZI_CAREER;
      const idx = hash(seed) % arr.length;
      const career = arr[idx];
      const s = String(hash(seed));
      const pillar = (i) => TIAN_GAN[Math.abs(hash(s + i)) % 10] + DI_ZHI[Math.abs(hash(s + i + 10)) % 12];
      const levelClass = { '大吉': 'level-daji', '吉': 'level-ji', '中吉': 'level-zhongji', '小吉': 'level-xiaoji', '平': 'level-ping', '末吉': 'level-moji', '凶': 'level-xiong' };
      const cls = levelClass[career.level] || 'level-ping';
      const moodLine = heart.mood && getMoodPrefix(heart.mood) ? `<div class="mood-prefix">${getMoodPrefix(heart.mood)}</div>` : '';
      const html = `
        ${moodLine}
        <div class="bazi-pillars">
          <div class="bazi-labels">年柱 月柱 日柱 时柱</div>
          <div class="bazi-values">${pillar(0)} ${pillar(1)} ${pillar(2)} ${pillar(3)}</div>
        </div>
        <div class="bazi-shichen">出生时辰：${SHI_CHEN[shichen]}</div>
        <div class="sign-level ${cls}">${career.level}</div>
        <div class="sign-text">${career.text}</div>
        <div class="sign-advice">💡 ${career.advice}</div>
      `;
      baziResult.innerHTML = html;
      if (window.DailyCache) window.DailyCache.set(nickname, cacheKey, { html });
      baziResult.classList.remove('hidden');
      baziResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      updateDivineBtnState('bazi', formBazi?.querySelector('button[type="submit"]'), '今日排盘次数已用完', '排盘');
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
      if (!requireAuth()) return;
      const nickname = getNickname();
      const theme = getDivineTheme('ziwei');
      const cacheKey = getDivineCacheKey('ziwei');
      const cached = window.DailyCache && window.DailyCache.get(nickname, cacheKey);
      if (cached) {
        restoreResult('ziwei', cached);
        return;
      }
      const month = parseInt(ziweiMonth?.value, 10);
      const day = parseInt(ziweiDay?.value, 10);
      if (!month || !day) {
        alert('请选择生日');
        return;
      }
      const today = getTodayStr();
      const heart = getDivineHeart('ziwei');
      const seed = `${month}-${day}-${today}-${heart.thought}-${heart.mood}-${heart.lucky}`;
      const arr = ZIWEI_BY_THEME && ZIWEI_BY_THEME[theme] ? ZIWEI_BY_THEME[theme] : ZIWEI_STARS;
      const idx = hash(seed) % arr.length;
      const star = arr[idx];
      const levelClass = { '大吉': 'level-daji', '吉': 'level-ji', '中吉': 'level-zhongji', '小吉': 'level-xiaoji', '平': 'level-ping', '末吉': 'level-moji', '凶': 'level-xiong' };
      const cls = levelClass[star.level] || 'level-ping';
      const moodLine = heart.mood && getMoodPrefix(heart.mood) ? `<div class="mood-prefix">${getMoodPrefix(heart.mood)}</div>` : '';
      const html = `
        ${moodLine}
        <div class="ziwei-star">${star.name}星</div>
        <div class="sign-level ${cls}">${star.level}</div>
        <div class="sign-text">${star.text}</div>
        <div class="sign-advice">💡 ${star.advice}</div>
      `;
      ziweiResult.innerHTML = html;
      if (window.DailyCache) window.DailyCache.set(nickname, cacheKey, { html });
      ziweiResult.classList.remove('hidden');
      ziweiResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      updateDivineBtnState('ziwei', formZiwei?.querySelector('button[type="submit"]'), '今日查星次数已用完', '查星');
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
      if (!requireAuth()) return;
      const nickname = getNickname();
      const theme = getDivineTheme('xiangxue');
      const cacheKey = getDivineCacheKey('xiangxue');
      const cached = window.DailyCache && window.DailyCache.get(nickname, cacheKey);
      if (cached) {
        restoreResult('xiangxue', cached);
        return;
      }
      const month = parseInt(xiangxueMonth?.value, 10);
      const day = parseInt(xiangxueDay?.value, 10);
      if (!month || !day) {
        alert('请选择生日');
        return;
      }
      const today = getTodayStr();
      const heart = getDivineHeart('xiangxue');
      const seed = `${month}-${day}-${today}-${heart.thought}-${heart.mood}-${heart.lucky}`;
      const parts = XIANGXUE_PARTS_BY_THEME && XIANGXUE_PARTS_BY_THEME[theme] ? XIANGXUE_PARTS_BY_THEME[theme] : XIANGXUE_PARTS;
      const careers = XIANGXUE_CAREER_BY_THEME && XIANGXUE_CAREER_BY_THEME[theme] ? XIANGXUE_CAREER_BY_THEME[theme] : XIANGXUE_CAREER;
      const partIdx1 = hash(seed) % parts.length;
      let partIdx2 = (hash(seed + 'x') % parts.length);
      if (partIdx2 === partIdx1) partIdx2 = (partIdx2 + 1) % parts.length;
      const careerIdx = hash(seed + 'c') % careers.length;
      const part1 = parts[partIdx1];
      const part2 = parts[partIdx2];
      const career = careers[careerIdx];
      const levelClass = { '大吉': 'level-daji', '吉': 'level-ji', '中吉': 'level-zhongji', '小吉': 'level-xiaoji', '平': 'level-ping', '末吉': 'level-moji', '凶': 'level-xiong' };
      const cls = levelClass[career.level] || 'level-ping';
      const moodLine = heart.mood && getMoodPrefix(heart.mood) ? `<div class="mood-prefix">${getMoodPrefix(heart.mood)}</div>` : '';
      const html = `
        ${moodLine}
        <div class="xiangxue-parts">今日面相重点：<strong>${part1.part}</strong>、<strong>${part2.part}</strong></div>
        <div class="sign-text">${part1.desc} ${part2.desc}</div>
        <div class="sign-level ${cls}">${career.level}</div>
        <div class="sign-text">${career.text}</div>
        <div class="sign-advice">💡 ${career.advice}</div>
      `;
      xiangxueResult.innerHTML = html;
      if (window.DailyCache) window.DailyCache.set(nickname, cacheKey, { html });
      xiangxueResult.classList.remove('hidden');
      xiangxueResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      updateDivineBtnState('xiangxue', formXiangxue?.querySelector('button[type="submit"]'), '今日观相次数已用完', '观相');
    });
  }

  /** 奇门起局 */
  const qimenBtn = document.getElementById('qimen-btn');
  const qimenResult = document.getElementById('qimen-result');
  if (qimenBtn && qimenResult) {
    qimenBtn.addEventListener('click', () => {
      if (!requireAuth()) return;
      const nickname = getNickname();
      const theme = getDivineTheme('qimen');
      const cacheKey = getDivineCacheKey('qimen');
      const cached = window.DailyCache && window.DailyCache.get(nickname, cacheKey);
      if (cached) {
        restoreResult('qimen', cached);
        return;
      }
      const today = getTodayStr();
      const heart = getDivineHeart('qimen');
      const seedStr = `${today}-${heart.thought}-${heart.mood}-${heart.lucky}`;
      const seed = hash(seedStr);
      const doorIdx = (seed % QIMEN_DOORS.length + QIMEN_DOORS.length) % QIMEN_DOORS.length;
      const starIdx = ((seed >> 8) % QIMEN_STARS.length + QIMEN_STARS.length) % QIMEN_STARS.length;
      const dirIdx = ((seed >> 16) % QIMEN_DIRECTIONS.length + QIMEN_DIRECTIONS.length) % QIMEN_DIRECTIONS.length;
      const arr = QIMEN_BY_THEME && QIMEN_BY_THEME[theme] ? QIMEN_BY_THEME[theme] : QIMEN_CAREER;
      const careerIdx = ((seed >> 24) % arr.length + arr.length) % arr.length;
      const career = arr[careerIdx];
      const levelClass = { '大吉': 'level-daji', '吉': 'level-ji', '中吉': 'level-zhongji', '小吉': 'level-xiaoji', '平': 'level-ping', '末吉': 'level-moji', '凶': 'level-xiong' };
      const cls = levelClass[career.level] || 'level-ping';
      const moodLine = heart.mood && getMoodPrefix(heart.mood) ? `<div class="mood-prefix">${getMoodPrefix(heart.mood)}</div>` : '';
      const html = `
        ${moodLine}
        <div class="qimen-info">今日：${QIMEN_DOORS[doorIdx]} · ${QIMEN_STARS[starIdx]} · 吉方位：${QIMEN_DIRECTIONS[dirIdx]}</div>
        <div class="sign-level ${cls}">${career.level}</div>
        <div class="sign-text">${career.text}</div>
        <div class="sign-advice">💡 ${career.advice}</div>
      `;
      qimenResult.innerHTML = html;
      if (window.DailyCache) window.DailyCache.set(nickname, cacheKey, { html });
      qimenResult.classList.remove('hidden');
      qimenResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      updateDivineBtnState('qimen', qimenBtn, '今日起局次数已用完', '起局');
    });
  }

  /** 六壬起课 */
  const liurenBtn = document.getElementById('liuren-btn');
  const liurenResult = document.getElementById('liuren-result');
  if (liurenBtn && liurenResult) {
    liurenBtn.addEventListener('click', () => {
      if (!requireAuth()) return;
      const nickname = getNickname();
      const theme = getDivineTheme('liuren');
      const cacheKey = getDivineCacheKey('liuren');
      const cached = window.DailyCache && window.DailyCache.get(nickname, cacheKey);
      if (cached) {
        restoreResult('liuren', cached);
        return;
      }
      const today = getTodayStr();
      const heart = getDivineHeart('liuren');
      const seedStr = `${today}-${heart.thought}-${heart.mood}-${heart.lucky}`;
      const seed = hash(seedStr);
      const godIdx = (seed % LIUREN_GODS.length + LIUREN_GODS.length) % LIUREN_GODS.length;
      const arr = LIUREN_BY_THEME && LIUREN_BY_THEME[theme] ? LIUREN_BY_THEME[theme] : LIUREN_CAREER;
      const careerIdx = ((seed >> 8) % arr.length + arr.length) % arr.length;
      const career = arr[careerIdx];
      const levelClass = { '大吉': 'level-daji', '吉': 'level-ji', '中吉': 'level-zhongji', '小吉': 'level-xiaoji', '平': 'level-ping', '末吉': 'level-moji', '凶': 'level-xiong' };
      const cls = levelClass[career.level] || 'level-ping';
      const moodLine = heart.mood && getMoodPrefix(heart.mood) ? `<div class="mood-prefix">${getMoodPrefix(heart.mood)}</div>` : '';
      const html = `
        ${moodLine}
        <div class="liuren-info">今日发用：<strong>${LIUREN_GODS[godIdx]}</strong></div>
        <div class="sign-level ${cls}">${career.level}</div>
        <div class="sign-text">${career.text}</div>
        <div class="sign-advice">💡 ${career.advice}</div>
      `;
      liurenResult.innerHTML = html;
      if (window.DailyCache) window.DailyCache.set(nickname, cacheKey, { html });
      liurenResult.classList.remove('hidden');
      liurenResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      updateDivineBtnState('liuren', liurenBtn, '今日起课次数已用完', '起课');
    });
  }

  /** 表单提交（抽签） */
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!requireAuth()) return;
    const nickname = getNickname();
    const cacheKey = getDrawCacheKey();
    const cached = window.DailyCache && window.DailyCache.get(nickname, cacheKey);
    if (cached) {
      showResult(cached);
      return;
    }
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
    const heart = getDivineHeart('draw');
    const signData = draw(month, day, focus, extra, heart);
    const zodiac = getZodiacSign(month, day);

    signData.zodiac = zodiac;
    signData.userName = name || '你';
    const toSave = { zodiac: signData.zodiac, level: signData.level, title: signData.title, text: signData.text, advice: signData.advice, moodPrefix: signData.moodPrefix };
    if (window.DailyCache) window.DailyCache.set(nickname, cacheKey, toSave);
    showResult(signData);
    updateDrawBtnState();
  });

  form.addEventListener('reset', () => setTimeout(updateDayOptions, 0));

  /** 初始加载时更新所有占卜按钮状态 */
  updateAllDivineBtnStates();
})();
