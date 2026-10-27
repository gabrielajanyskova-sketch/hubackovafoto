// Ochrana osobních údajů — odvolání / změna souhlasu s cookies
(function () {
  'use strict';
  const btn = document.getElementById('cookie-reset');
  if (!btn) return;
  btn.addEventListener('click', () => {
    try { localStorage.removeItem('cookie-consent'); } catch { /* soukromé okno */ }
    const host = location.hostname.replace(/^www\./, '');
    document.cookie.split(';').map(c => c.trim().split('=')[0]).filter(n => /^_ga/.test(n)).forEach(n => {
      ['', '; domain=' + host, '; domain=.' + host].forEach(d => {
        document.cookie = n + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + d;
      });
    });
    location.href = '/';
  });
})();
