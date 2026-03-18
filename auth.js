/**
 * 登录注册 - 基于 localStorage，仅供本地保存
 */
(function () {
  const USERS_KEY = 'drawlots_users';
  const CURRENT_KEY = 'drawlots_current';

  function getUsers() {
    try {
      return JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
    } catch {
      return {};
    }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function getCurrent() {
    try {
      return JSON.parse(localStorage.getItem(CURRENT_KEY) || 'null');
    } catch {
      return null;
    }
  }

  function setCurrent(user) {
    if (user) {
      localStorage.setItem(CURRENT_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_KEY);
    }
  }

  window.Auth = {
    getCurrent,
    setCurrent,
    register(nickname, month, day, password) {
      const users = getUsers();
      if (users[nickname]) return { ok: false, msg: '该昵称已注册' };
      const m = parseInt(month, 10) || 1;
      const d = parseInt(day, 10) || 1;
      users[nickname] = { month: m, day: d, password };
      saveUsers(users);
      setCurrent({ nickname, month: m, day: d });
      return { ok: true };
    },
    login(nickname, password) {
      const users = getUsers();
      const u = users[nickname];
      if (!u) return { ok: false, msg: '昵称不存在' };
      if (u.password !== password) return { ok: false, msg: '密码错误' };
      setCurrent({ nickname, month: u.month, day: u.day });
      return { ok: true };
    },
    logout() {
      setCurrent(null);
    },
  };
})();
