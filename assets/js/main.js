/* ==========================================================
   Contact settings: edit these before going live
   ========================================================== */
var CONTACT_CONFIG = {
  // Business inbox, shown wherever the page links to email.
  toEmail: 'hiroshiyamamoto@naniwanexus.com',

  // 30-minute call booking page. Availability, time zones and confirmations are managed in Calendly.
  calendlyUrl: 'https://calendly.com/hiroshiyamamoto-naniwanexus/30min'
};

(function () {
  'use strict';
  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Language ---------- */
  var TITLES = {
    en: 'Naniwa Nexus — Lay the stone. Launch the boat.',
    ja: 'Naniwa Nexus — 石を積み、舟を出す。'
  };
  function lang() { return root.classList.contains('lang-ja') ? 'ja' : 'en'; }
  function setLang(l) {
    root.classList.toggle('lang-ja', l === 'ja');
    root.lang = l;
    document.title = TITLES[l];
    try { localStorage.setItem('nn-lang', l); } catch (e) {}
    document.dispatchEvent(new CustomEvent('langchange'));
  }
  setLang(lang());
  document.getElementById('langBtn').addEventListener('click', function () {
    setLang(lang() === 'ja' ? 'en' : 'ja');
  });

  /* ---------- Mobile menu ---------- */
  var menuBtn = document.getElementById('menuBtn');
  var navLinks = document.getElementById('navLinks');
  function closeMenu() { navLinks.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); onScroll(); }
  menuBtn.addEventListener('click', function () {
    var open = navLinks.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
    onScroll();
  });
  navLinks.addEventListener('click', function (e) { if (e.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  /* ---------- Header background on scroll ---------- */
  var header = document.getElementById('siteHeader');
  function onScroll() {
    var top = window.scrollY <= 12;
    header.classList.toggle('scrolled', !top);
    // Light text while the header sits over the dark hero (and the menu is closed)
    header.classList.toggle('on-hero', top && !navLinks.classList.contains('open'));
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Highlight the menu link for the section on screen ---------- */
  (function () {
    if (!('IntersectionObserver' in window)) return;
    var links = {};
    navLinks.querySelectorAll('a[href^="#"]:not(.nav-cta)').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
    // Sections without their own menu link count toward the nearest one before them
    var groups = { focus: 'focus', practice: 'practice', name: 'story', motto: 'story', story: 'story', vision: 'story', philosophy: 'philosophy', world: 'world', contact: 'contact' };
    var current = null;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var key = groups[e.target.id] || null;
        if (key === current) return;
        if (current && links[current]) links[current].classList.remove('active');
        current = key;
        if (current && links[current]) links[current].classList.add('active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('main > section[id]').forEach(function (s) { io.observe(s); });
  })();

  /* ---------- Reveal on scroll ---------- */
  (function () {
    var items = document.querySelectorAll('.reveal');
    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- The concept in practice: play the demo once it is on screen ---------- */
  (function () {
    var demo = document.getElementById('demo');
    if (!demo) return;
    if (reduceMotion || !('IntersectionObserver' in window)) { demo.classList.add('play'); return; }
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { demo.classList.add('play'); io.disconnect(); }
    }, { threshold: 0.35 });
    io.observe(demo);
  })();

  /* ---------- Philosophy: tabs on wide screens, a plain list on small ones ---------- */
  (function () {
    var wrap = document.getElementById('tenets');
    var list = document.getElementById('tenetList');
    if (!wrap || !list) return;
    var tabs = Array.prototype.slice.call(list.querySelectorAll('.tab'));
    var panels = tabs.map(function (t) { return document.getElementById(t.dataset.for); });
    var wide = window.matchMedia('(min-width: 960px)');
    var active = 0;

    function select(i, focus) {
      active = i;
      tabs.forEach(function (t, j) {
        var on = j === i;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        panels[j].hidden = !on;
        panels[j].classList.toggle('fade-in', on && !reduceMotion);
      });
      if (focus) tabs[i].focus();
    }

    function setMode() {
      if (wide.matches) {
        wrap.classList.add('tabbed');
        list.setAttribute('role', 'tablist');
        list.setAttribute('aria-label', lang() === 'ja' ? '経営理念' : 'Management philosophy');
        tabs.forEach(function (t, j) {
          t.setAttribute('role', 'tab');
          t.id = 'tab-' + (j + 1);
          t.setAttribute('aria-controls', panels[j].id);
          panels[j].setAttribute('role', 'tabpanel');
          panels[j].setAttribute('aria-labelledby', t.id);
          panels[j].classList.add('in'); // tabs mode doesn't use the scroll reveal
        });
        select(active, false);
      } else {
        wrap.classList.remove('tabbed');
        list.removeAttribute('role');
        tabs.forEach(function (t, j) {
          t.removeAttribute('role'); t.removeAttribute('aria-selected'); t.removeAttribute('aria-controls');
          panels[j].hidden = false;
          panels[j].removeAttribute('role');
          panels[j].setAttribute('aria-labelledby', panels[j].id + '-title');
        });
      }
    }

    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i, false); });
      t.addEventListener('keydown', function (e) {
        var n = tabs.length, k = e.key, to = null;
        if (k === 'ArrowDown' || k === 'ArrowRight') to = (active + 1) % n;
        else if (k === 'ArrowUp' || k === 'ArrowLeft') to = (active - 1 + n) % n;
        else if (k === 'Home') to = 0;
        else if (k === 'End') to = n - 1;
        if (to !== null) { e.preventDefault(); select(to, true); }
      });
    });
    document.addEventListener('langchange', function () {
      if (wide.matches) list.setAttribute('aria-label', lang() === 'ja' ? '経営理念' : 'Management philosophy');
    });
    if (wide.addEventListener) wide.addEventListener('change', setMode); else wide.addListener(setMode);
    setMode();
  })();

  /* ---------- The concept in practice: staff resolve the uncertain entry ---------- */
  (function () {
    var row = document.getElementById('askRow');
    if (!row) return;
    var value = document.getElementById('askValue');
    var pill = document.getElementById('askPill');
    var choices = document.getElementById('askChoices');
    var status = document.getElementById('demoStatus');
    var send = document.getElementById('demoSend');
    var reset = document.getElementById('demoReset');
    var start = { value: value.innerHTML, pill: pill.innerHTML, pillClass: pill.className, status: status.innerHTML };

    function both(en, ja) { return '<span class="en">' + en + '</span><span class="ja">' + ja + '</span>'; }
    var CHECK = '<svg aria-hidden="true"><use href="#i-check"/></svg>';
    var PERSON = '<svg aria-hidden="true"><use href="#i-person"/></svg>';

    choices.addEventListener('click', function (e) {
      var b = e.target.closest('.choice');
      if (!b) return;
      value.innerHTML = both('White miso ' + b.dataset.size + ' × 12', '白味噌 ' + b.dataset.sizeJa + ' × 12');
      pill.className = 'pill staff';
      pill.innerHTML = PERSON + both('Confirmed by staff', 'スタッフが確定');
      row.classList.remove('ask');
      choices.hidden = true;
      status.className = 'status';
      status.innerHTML = both('All entries confirmed.', 'すべての項目を確認しました。');
      send.disabled = false;
      reset.hidden = false;
      send.focus();
    });

    send.addEventListener('click', function () {
      send.disabled = true;
      send.hidden = true;
      status.className = 'status done';
      status.innerHTML = CHECK.replace('<svg', '<svg style="width:14px;height:14px;display:inline;vertical-align:-2px;margin-right:6px"') +
        both('Stock reserved for Thursday’s delivery.', '木曜日の納品分の在庫を引き当てました。');
      reset.focus();
    });

    reset.addEventListener('click', function () {
      value.innerHTML = start.value;
      pill.className = start.pillClass;
      pill.innerHTML = start.pill;
      row.classList.add('ask');
      choices.hidden = false;
      status.className = 'status';
      status.innerHTML = start.status;
      send.disabled = true;
      send.hidden = false;
      reset.hidden = true;
      var first = choices.querySelector('.choice');
      if (first) first.focus();
    });
  })();

  /* ---------- Contact links ---------- */
  document.querySelectorAll('[data-contact-email]').forEach(function (a) {
    a.href = 'mailto:' + CONTACT_CONFIG.toEmail;
    if (!a.hasAttribute('data-keep-label')) a.textContent = CONTACT_CONFIG.toEmail;
  });
  document.querySelectorAll('[data-calendly-link]').forEach(function (a) { a.href = CONTACT_CONFIG.calendlyUrl; });

  /* ---------- Calendly booking calendar ----------
     Loads when the section comes near the screen, or as soon as someone points at,
     focuses or taps a "Book a call" link, so it is usually ready when they arrive. */
  (function () {
    var embed = document.getElementById('calendlyEmbed');
    var wait = document.getElementById('calendlyWait');
    if (!embed) return;
    var started = false, ready = false;

    function setWaitText(en, ja) {
      var p = wait && wait.querySelector('p');
      if (p) p.innerHTML = '<span class="en">' + en + '</span><span class="ja">' + ja + '</span>';
    }

    window.addEventListener('message', function (e) {
      if (!/^https:\/\/([a-z0-9-]+\.)?calendly\.com$/.test(e.origin) || !e.data || typeof e.data.event !== 'string') return;
      // Let the calendar take the height it needs, so it never scrolls inside its own box
      if (e.data.event === 'calendly.page_height') {
        var h = parseInt(e.data.payload && e.data.payload.height, 10);
        if (h > 300) embed.style.height = h + 'px';
      }
      // The booking page has drawn: the loading message is no longer needed
      if (e.data.event === 'calendly.event_type_viewed') showCalendar();
    });

    function showCalendar() {
      ready = true;
      if (wait) wait.hidden = true;
    }

    function failed() {
      embed.classList.add('failed');
      var frame = embed.querySelector('iframe');
      if (frame) frame.remove();
      setWaitText('The calendar could not load here. You can book on Calendly directly, or email us.',
        'ここではカレンダーを読み込めませんでした。Calendlyで直接ご予約いただくか、メールでご連絡ください。');
    }

    function load() {
      if (started) return;
      started = true;
      var s = document.createElement('script');
      s.src = 'https://assets.calendly.com/assets/external/widget.js';
      s.async = true;
      s.onload = function () {
        if (!window.Calendly) { failed(); return; }
        window.Calendly.initInlineWidget({
          url: CONTACT_CONFIG.calendlyUrl + '?hide_gdpr_banner=1&background_color=fffcf6&text_color=1a2233&primary_color=c4462b',
          parentElement: embed
        });
        // Safety net: never leave the message covering a calendar that has loaded
        var frame = embed.querySelector('iframe');
        if (frame) frame.addEventListener('load', function () { setTimeout(showCalendar, 5000); });
        // Slow connection: keep waiting, but point to the direct link
        setTimeout(function () {
          if (!ready && !embed.classList.contains('failed')) {
            setWaitText('Still loading. You can also open the calendar in Calendly.',
              'まだ読み込み中です。Calendlyで直接開くこともできます。');
          }
        }, 12000);
      };
      s.onerror = failed;
      document.head.appendChild(s);
    }

    document.querySelectorAll('a[href="#call"]').forEach(function (a) {
      ['pointerenter', 'focus', 'touchstart', 'click'].forEach(function (ev) {
        a.addEventListener(ev, load, { once: true, passive: true });
      });
    });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        if (entries.some(function (e) { return e.isIntersecting; })) { io.disconnect(); load(); }
      }, { rootMargin: '1500px 0px' });
      io.observe(embed);
    } else {
      load();
    }
  })();

  /* ---------- Footer year ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
