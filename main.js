// hubackovafoto.cz — menu, galerie, lightbox, formulář, mapa, souhlas s cookies
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── HAMBURGER MENU ──
  const hamburger = $('hamburger');
  const mobileMenu = $('mobile-menu');
  function setMenu(open) {
    mobileMenu.classList.toggle('open', open);
    hamburger.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', open);
    hamburger.setAttribute('aria-label', open ? 'Zavřít mobilní menu' : 'Otevřít mobilní menu');
    mobileMenu.setAttribute('aria-hidden', !open);
    document.body.style.overflow = open ? 'hidden' : '';
  }
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => setMenu(!mobileMenu.classList.contains('open')));
    mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  }

  // ── NAV SCROLL + SCROLLSPY ──
  const navbar = $('navbar');
  const navLinks = Array.from(document.querySelectorAll('.nav-links a[data-section]'));
  if ('IntersectionObserver' in window) {
    const spyObs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(a => a.classList.toggle('active', a.dataset.section === entry.target.id));
        }
      });
    }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });
    navLinks.forEach(a => { const el = $(a.dataset.section); if (el) spyObs.observe(el); });
  }
  let scrollTicking = false;
  window.addEventListener('scroll', () => {
    if (scrollTicking) return;
    scrollTicking = true;
    const scrolled = window.scrollY > 50;
    requestAnimationFrame(() => {
      navbar.classList.toggle('scrolled', scrolled);
      scrollTicking = false;
    });
  }, { passive: true });

  // ── SLIDESHOW ──
  const track = $('slideshow-track');
  const slides = track ? Array.from(track.querySelectorAll('.slide')) : [];
  const dotsContainer = $('slide-dots');
  const pauseBtn = $('slide-pause');
  const mobileMq = window.matchMedia('(max-width: 900px)');
  let currentSlide = 0;
  let slideInterval = null;
  let userPaused = reducedMotion; // při omezení pohybu se galerie sama neposouvá
  let hoverPaused = false;
  let slideDots = [];

  const getMaxSlide = () => Math.max(0, slides.length - (mobileMq.matches ? 1 : 3));

  function goToSlide(n) {
    const max = getMaxSlide();
    currentSlide = n > max ? 0 : n < 0 ? max : n;
    track.style.setProperty('--slide-index', currentSlide);
    slideDots.forEach((d, i) => {
      if (i === currentSlide) d.setAttribute('aria-current', 'true');
      else d.removeAttribute('aria-current');
      d.classList.toggle('active', i === currentSlide);
    });
  }
  function stopInterval() { clearInterval(slideInterval); slideInterval = null; }
  function syncInterval() {
    stopInterval();
    if (!userPaused && !hoverPaused && !document.hidden) {
      slideInterval = setInterval(() => goToSlide(currentSlide + 1), 4000);
    }
  }
  function buildDots() {
    dotsContainer.textContent = '';
    for (let i = 0; i <= getMaxSlide(); i++) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'slide-dot';
      dot.setAttribute('aria-label', 'Přejít na fotografii ' + (i + 1));
      dot.addEventListener('click', () => { goToSlide(i); syncInterval(); });
      dotsContainer.appendChild(dot);
    }
    slideDots = Array.from(dotsContainer.children);
    goToSlide(Math.min(currentSlide, getMaxSlide()));
  }
  function setPaused(paused) {
    userPaused = paused;
    pauseBtn.setAttribute('aria-pressed', paused);
    pauseBtn.setAttribute('aria-label', paused ? 'Spustit automatické přehrávání' : 'Zastavit automatické přehrávání');
    pauseBtn.innerHTML = paused
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="8 5 19 12 8 19 8 5"/></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><line x1="9" y1="6" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="18"/></svg>';
    syncInterval();
  }

  if (track && slides.length) {
    buildDots();
    setPaused(userPaused);
    $('slide-prev').addEventListener('click', () => { goToSlide(currentSlide - 1); syncInterval(); });
    $('slide-next').addEventListener('click', () => { goToSlide(currentSlide + 1); syncInterval(); });
    pauseBtn.addEventListener('click', () => setPaused(!userPaused));
    const wrap = track.closest('.slideshow-wrap');
    const holdOn = () => { hoverPaused = true; syncInterval(); };
    const holdOff = () => { hoverPaused = false; syncInterval(); };
    wrap.addEventListener('mouseenter', holdOn);
    wrap.addEventListener('mouseleave', holdOff);
    wrap.addEventListener('focusin', holdOn);
    wrap.addEventListener('focusout', e => { if (!wrap.contains(e.relatedTarget)) holdOff(); });
    document.addEventListener('visibilitychange', syncInterval);
    mobileMq.addEventListener('change', buildDots);

    slides.forEach((slide, i) => {
      slide.addEventListener('click', () => openLightbox(i));
      slide.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(i); }
      });
      // Klávesnicí na slide mimo viditelnou část → posunout galerii
      slide.addEventListener('focus', () => {
        const max = getMaxSlide();
        if (i < currentSlide || i > currentSlide + (mobileMq.matches ? 0 : 2)) goToSlide(Math.min(i, max));
      });
    });
  }

  // ── LIGHTBOX ──
  const lightbox = $('lightbox');
  const lightboxImg = $('lightbox-img');
  const lightboxData = slides.map(s => {
    const img = s.querySelector('img');
    return { src: img.getAttribute('src'), alt: img.getAttribute('alt') };
  });
  let currentLightbox = 0;
  let lastFocus = null;

  function showLightbox(i) {
    currentLightbox = (i + lightboxData.length) % lightboxData.length;
    lightboxImg.src = lightboxData[currentLightbox].src;
    lightboxImg.alt = lightboxData[currentLightbox].alt;
  }
  function openLightbox(i) {
    lastFocus = document.activeElement;
    showLightbox(i);
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
    hoverPaused = true; syncInterval();
    $('lightbox-close').focus();
  }
  function closeLightbox() {
    if (!lightbox.classList.contains('open')) return;
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
    hoverPaused = false; syncInterval();
    if (lastFocus) lastFocus.focus();
  }
  if (lightbox) {
    $('lightbox-close').addEventListener('click', closeLightbox);
    $('lightbox-prev').addEventListener('click', () => showLightbox(currentLightbox - 1));
    $('lightbox-next').addEventListener('click', () => showLightbox(currentLightbox + 1));
    lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
  }

  document.addEventListener('keydown', e => {
    if (lightbox && lightbox.classList.contains('open')) {
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') showLightbox(currentLightbox - 1);
      else if (e.key === 'ArrowRight') showLightbox(currentLightbox + 1);
      else if (e.key === 'Tab') {
        // Fokus zůstává uvnitř prohlížeče
        const items = Array.from(lightbox.querySelectorAll('button'));
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    } else if (e.key === 'Escape' && mobileMenu && mobileMenu.classList.contains('open')) {
      setMenu(false);
      hamburger.focus();
    }
  });

  // ── FORMULÁŘ (Web3Forms) ──
  const form = $('contact-form');
  const status = $('form-status');
  function showStatus(msg, isError) {
    status.innerHTML = msg;
    status.classList.toggle('error', !!isError);
  }
  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      const btn = form.querySelector('button[type="submit"]');
      const orig = btn.innerHTML;
      btn.textContent = 'Odesílám…';
      btn.disabled = true;
      btn.setAttribute('aria-busy', 'true');
      showStatus('');
      try {
        const data = Object.fromEntries(new FormData(form));
        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(data)
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.success) throw new Error(json.message || res.status);
        window.location.href = '/dekujeme';
      } catch (err) {
        btn.innerHTML = orig;
        btn.disabled = false;
        btn.removeAttribute('aria-busy');
        showStatus('Zprávu se nepodařilo odeslat. Zkuste to prosím znovu, nebo mi napište na <a href="mailto:nikola@hubackovafoto.cz">nikola@hubackovafoto.cz</a> či zavolejte na <a href="tel:+420739486263">739&nbsp;486&nbsp;263</a>.', true);
      }
    });
  }

  // ── MAPA — načte se až po kliknutí (Google ukládá cookies) ──
  const mapBtn = $('map-load');
  if (mapBtn) {
    mapBtn.addEventListener('click', () => {
      const iframe = document.createElement('iframe');
      iframe.className = 'map-embed';
      iframe.src = 'https://www.google.com/maps?q=Un%C4%8Dovice+69%2C+784+01+Litovel&output=embed';
      iframe.title = 'Mapa — ateliér Nikoly Hubáčkové, Unčovice 69, 784 01 Litovel (u Olomouce)';
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'no-referrer-when-downgrade';
      iframe.allowFullscreen = true;
      $('map').replaceWith(iframe);
      iframe.focus();
    });
  }

  // ── SOUHLAS S COOKIES + Google Analytics ──
  const GA_ID = 'G-GPTE9Y6YJV';
  const CONSENT_KEY = 'cookie-consent';
  const cookieBar = $('cookie-bar');
  const getConsent = () => { try { return localStorage.getItem(CONSENT_KEY); } catch { return null; } };
  const setConsent = v => { try { localStorage.setItem(CONSENT_KEY, v); } catch { /* soukromé okno */ } };

  function loadAnalytics() {
    if (window.gtag) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
  }
  function removeAnalyticsCookies() {
    const host = location.hostname.replace(/^www\./, '');
    document.cookie.split(';').map(c => c.trim().split('=')[0]).filter(n => /^_ga/.test(n)).forEach(n => {
      ['', '; domain=' + host, '; domain=.' + host].forEach(d => {
        document.cookie = n + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + d;
      });
    });
  }

  if (cookieBar) {
    const consent = getConsent();
    if (consent === 'granted') loadAnalytics();
    else if (consent !== 'denied') cookieBar.hidden = false;

    $('cookie-accept').addEventListener('click', () => {
      setConsent('granted');
      cookieBar.hidden = true;
      loadAnalytics();
    });
    $('cookie-reject').addEventListener('click', () => {
      const wasGranted = getConsent() === 'granted';
      setConsent('denied');
      cookieBar.hidden = true;
      removeAnalyticsCookies();
      if (wasGranted) location.reload(); // zastaví už načtený GA
    });
    const settings = $('cookie-settings');
    if (settings) settings.addEventListener('click', () => {
      cookieBar.hidden = false;
      $('cookie-accept').focus();
    });
  }

  // ── REVEAL ──
  const revealEls = document.querySelectorAll('.reveal, .reveal-left');
  if ('IntersectionObserver' in window && !reducedMotion) {
    const revObs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); revObs.unobserve(e.target); } });
    }, { threshold: 0.1 });
    revealEls.forEach(el => revObs.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('visible'));
  }
})();
