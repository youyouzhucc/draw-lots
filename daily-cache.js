/**
 * 每日占卜缓存 - 每类型每天限1次，23:59:59后重置
 * 按用户+日期存储，结果可反复查看
 */
(function () {
  const KEY_PREFIX = 'drawlots_daily_';

  function getTodayStr() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function getKey(nickname) {
    return KEY_PREFIX + (nickname || 'guest');
  }

  function getCache(nickname) {
    try {
      const raw = localStorage.getItem(getKey(nickname));
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function saveCache(nickname, data) {
    try {
      localStorage.setItem(getKey(nickname), JSON.stringify(data));
    } catch (e) {
      console.warn('daily-cache save failed', e);
    }
  }

  window.DailyCache = {
    getTodayStr,
    /** 获取今日某类型的缓存结果，无则返回 null */
    get(nickname, mode) {
      const cache = getCache(nickname);
      if (!cache || cache.date !== getTodayStr()) return null;
      return cache.results && cache.results[mode] ? cache.results[mode] : null;
    },
    /** 保存某类型的结果 */
    set(nickname, mode, result) {
      const today = getTodayStr();
      let cache = getCache(nickname);
      if (!cache || cache.date !== today) {
        cache = { date: today, results: {} };
      }
      if (!cache.results) cache.results = {};
      cache.results[mode] = result;
      saveCache(nickname, cache);
    },
    /** 今日是否已占卜过该类型 */
    hasUsed(nickname, mode) {
      return !!this.get(nickname, mode);
    },
  };
})();
