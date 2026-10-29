/*
 * متجر أبو جودة — إحصاءات الصفحة
 * يحفظ الأعداد في localStorage، أي على المتصفح/الجهاز الحالي.
 * لتجميع الأعداد بين جميع الزوار يلزم ربط الموقع بخادم وقاعدة بيانات.
 */
(function () {
  'use strict';

  const VISITS_KEY = 'abu_jouda_page_visits_v1';
  const VISIT_SESSION_KEY = 'abu_jouda_visit_session_v1';
  const REACTIONS_KEY = 'abu_jouda_reaction_totals_v1';

  function readJSON(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (_) {
      return false;
    }
  }

  function getVisitCount() {
    const stats = readJSON(VISITS_KEY, { visits: 0 });
    return Math.max(0, Number(stats.visits) || 0);
  }

  function recordPageVisit() {
    try {
      // احتساب زيارة واحدة لكل جلسة تبويب، لتجنّب زيادة العدد عند تحديث الصفحة.
      if (sessionStorage.getItem(VISIT_SESSION_KEY)) return;
      const stats = readJSON(VISITS_KEY, { visits: 0 });
      stats.visits = Math.max(0, Number(stats.visits) || 0) + 1;
      stats.updatedAt = new Date().toISOString();
      writeJSON(VISITS_KEY, stats);
      sessionStorage.setItem(VISIT_SESSION_KEY, '1');
    } catch (_) {
      // إذا منع المتصفح التخزين، تبقى الصفحة قابلة للاستخدام دون العداد.
    }
  }

  function renderVisitCount() {
    const counter = document.getElementById('pageVisitors');
    if (counter) counter.textContent = getVisitCount().toLocaleString('ar');
  }

  function saveReactionTotals() {
    const likesElement = document.getElementById('allLikes');
    const lovedElement = document.getElementById('allLoved');
    if (!likesElement || !lovedElement) return;

    const toNumber = (text) => {
      const digits = String(text || '').replace(/[^0-9٠-٩۰-۹]/g, '');
      const normalized = digits.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
        .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
      return Math.max(0, Number(normalized) || 0);
    };

    writeJSON(REACTIONS_KEY, {
      likes: toNumber(likesElement.textContent),
      loved: toNumber(lovedElement.textContent),
      updatedAt: new Date().toISOString()
    });
  }

  function initialize() {
    recordPageVisit();
    renderVisitCount();

    // صفحة المتجر تُحدّث هذين الرقمين عند الإعجاب؛ نحفظ ملخصاً محلياً عند تغيرهما.
    const likesElement = document.getElementById('allLikes');
    const lovedElement = document.getElementById('allLoved');
    if (likesElement && lovedElement && window.MutationObserver) {
      const observer = new MutationObserver(saveReactionTotals);
      observer.observe(likesElement, { childList: true, characterData: true, subtree: true });
      observer.observe(lovedElement, { childList: true, characterData: true, subtree: true });
      saveReactionTotals();
    }

    window.addEventListener('storage', (event) => {
      if (event.key === VISITS_KEY) renderVisitCount();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();
