/* ==========================================================
   Naniwa Nexus — animated illustrations
   1. Hero: plan a bridge, lay its stone abutments, join the deck in the middle,
      then put it to work: orders flow across as data while boats launch below.
   2. River band (Creating with the world): many crews, each on its own boat.
   Each scene is drawn as a function of time, so it can pause while off screen.
   ========================================================== */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function f1(n) { return (Math.round(n * 10) / 10).toString(); }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function easeOut(u) { return 1 - Math.pow(1 - u, 3); }
  function easeInOut(u) { return u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; }
  // only touch the DOM when a value actually changes
  function set(node, name, v) { if (node['_' + name] !== v) { node.setAttribute(name, v); node['_' + name] = v; } }
  function lang() { return root.classList.contains('lang-ja') ? 'ja' : 'en'; }

  function glow(defs, id, color, a) {
    if (document.getElementById(id)) return;
    var g = el('radialGradient', { id: id }, defs);
    el('stop', { offset: 0, 'stop-color': color, 'stop-opacity': a }, g);
    el('stop', { offset: .38, 'stop-color': color, 'stop-opacity': a * .3 }, g);
    el('stop', { offset: 1, 'stop-color': color, 'stop-opacity': 0 }, g);
  }
  function fade(defs, id, color, a, horizontal) {
    if (document.getElementById(id)) return;
    var g = el('linearGradient', { id: id, x1: 0, y1: 0, x2: horizontal ? 1 : 0, y2: horizontal ? 0 : 1 }, defs);
    el('stop', { offset: 0, 'stop-color': color, 'stop-opacity': a }, g);
    el('stop', { offset: 1, 'stop-color': color, 'stop-opacity': 0 }, g);
  }
  function sharedDefs(defs) {
    glow(defs, 'gGold', '#ffd27a', .9);
    glow(defs, 'gCyan', '#7fe0ff', .9);
    glow(defs, 'gAmber', '#ffb347', .95);
    glow(defs, 'gGreen', '#7be0a6', .9);
    glow(defs, 'gShu', '#ff6a4a', .95);
    glow(defs, 'gWhite', '#dfe8ff', .7);
    fade(defs, 'reflGold', '#ffd27a', .55);
    fade(defs, 'reflCyan', '#9fdcff', .5);
    // Boat wakes: brightest at the stern, fading out behind
    if (!document.getElementById('wakeG')) {
      var w = el('linearGradient', { id: 'wakeG', x1: 1, y1: 0, x2: 0, y2: 0 }, defs);
      el('stop', { offset: 0, 'stop-color': '#dfe8ff', 'stop-opacity': .5 }, w);
      el('stop', { offset: 1, 'stop-color': '#dfe8ff', 'stop-opacity': 0 }, w);
    }
  }

  // Owner marks, carved into stones: the castle's ◎ beside the marks of software work
  var MARKS = [
    'M-2-4.5L-5.5 0L-2 4.5M2-4.5L5.5 0L2 4.5',                                   // code
    'M-4.5-3a4.5 1.7 0 1 0 9 0a4.5 1.7 0 1 0-9 0M-4.5-3V3a4.5 1.7 0 0 0 9 0V-3',  // database
    'M-5 0a5 5 0 1 0 10 0a5 5 0 1 0-10 0M-1.7 0a1.7 1.7 0 1 0 3.4 0a1.7 1.7 0 1 0-3.4 0', // ◎
    'M-3.5-3.5H3.5V3.5H-3.5ZM-1.5-5.5V-3.5M1.5-5.5V-3.5M-1.5 3.5V5.5M1.5 3.5V5.5', // chip
    'M-4.5 0L-1.2 3.4L4.8-3.4',                                                   // check
    'M-4.2 2.8a2.6 2.6 0 0 1 .4-5.2a3.3 3.3 0 0 1 6.2.7a2.3 2.3 0 0 1-.3 4.5Z'       // cloud
  ];
  var CREW = ['#7fe0ff', '#ffd27a', '#ff8a66', '#7be0a6', '#b9a6ff', '#ff9ec4'];

  function stonePoints(r, x1, y1, x2, y2) {
    var g = 1.4; x1 += g; y1 += g; x2 -= g; y2 -= g;
    var c = function () { return 1.5 + r() * 4; };
    var j = function () { return (r() - 0.5) * 2.2; };
    var pts = [
      [x1 + c(), y1 + j()], [x2 - c(), y1 + j()], [x2 + j(), y1 + c()], [x2 + j(), y2 - c()],
      [x2 - c(), y2 + j()], [x1 + c(), y2 + j()], [x1 + j(), y2 - c()], [x1 + j(), y1 + c()]
    ];
    return pts.map(function (p) { return f1(p[0]) + ',' + f1(p[1]); }).join(' ');
  }
  function stoneFill(r, light) {
    return 'hsl(' + (212 + r() * 18).toFixed(0) + ',' + (7 + r() * 8).toFixed(0) + '%,' + (light + r() * 11).toFixed(1) + '%)';
  }

  // A lantern boat carrying glowing data crates, centred on 0,0 at the waterline, bow to the right
  function drawBoat(p, o) {
    var hull = '#060a12';
    el('path', { d: 'M-210 3L-84 7M-210 21L-84 10', stroke: 'url(#wakeG)', 'stroke-width': 1.6, fill: 'none', 'stroke-linecap': 'round' }, p);
    el('path', { d: 'M-64 12H72L62 28H-54Z', fill: '#02050b', opacity: .45 }, p);
    [-44, -26, -8, 10, 28, 46].forEach(function (x) {
      el('rect', { x: x - 2.2, y: 14, width: 4.4, height: 28, rx: 2.2, fill: 'url(#reflGold)' }, p);
    });
    el('path', { d: 'M-82-8Q-72 0-58 0H72Q86-3 96-16L90 10Q20 14-58 11Q-74 5-82-8Z', fill: hull }, p);
    el('path', { d: 'M-56 0V-33M0 0V-33M56 0V-33', stroke: hull, 'stroke-width': 2.6 }, p);
    el('path', { d: 'M-68-33H70L58-44H-56Z', fill: hull }, p);
    el('rect', { x: -58, y: -33, width: 118, height: 4.5, fill: o.color, opacity: .6 }, p);
    [-44, -26, -8, 10, 28, 46].forEach(function (x) {
      el('circle', { cx: x, cy: -22, r: 12, fill: 'url(#gGold)', 'class': 'lg', style: 'animation-delay:' + (-o.r() * 3).toFixed(2) + 's' }, p);
      el('rect', { x: x - 3.4, y: -27, width: 6.8, height: 9.5, rx: 3, fill: '#ffd99a' }, p);
    });
    [-40, -14, 12, 38].forEach(function (x) {
      el('circle', { cx: x + 4, cy: -6, r: 11, fill: 'url(#' + o.glow + ')' }, p);
      el('rect', { x: x, y: -9.5, width: 9, height: 7.5, rx: 1.6, fill: o.crate }, p);
    });
    el('path', { d: 'M76-12V-60', stroke: hull, 'stroke-width': 2 }, p);
    el('path', { d: 'M76-60L98-54L76-48Z', fill: o.color }, p);
  }

  function ripples(layer, r, n, x0, x1, y0, y1, colors) {
    for (var i = 0; i < n; i++) {
      var t = Math.pow(r(), 1.15), y = y0 + t * (y1 - y0), len = (8 + r() * 46) * (0.5 + t);
      el('path', {
        d: 'M' + f1(x0 + r() * (x1 - x0)) + ' ' + f1(y) + 'h' + f1(len),
        stroke: colors[Math.floor(r() * colors.length)], 'stroke-width': f1(0.8 + t * 1.1),
        'stroke-opacity': (0.1 + r() * 0.32).toFixed(2), 'stroke-linecap': 'round',
        'class': 'rip', style: 'animation-duration:' + (4 + r() * 5).toFixed(1) + 's;animation-delay:' + (-r() * 9).toFixed(1) + 's'
      }, layer);
    }
  }

  // Run update(t) on the real clock, minus time spent off screen or in a hidden tab
  function run(box, update, still) {
    if (reduceMotion) { update(still); return; }
    var t0 = performance.now(), pausedFor = 0, pausedAt = null, raf = null, visible = true;
    function frame(now) {
      update(Math.max(0, now - t0 - pausedFor) / 1000);
      raf = pausedAt === null ? requestAnimationFrame(frame) : null;
    }
    function sync() {
      var on = visible && !document.hidden;
      box.classList.toggle('is-paused', !on);
      if (!on && pausedAt === null) pausedAt = performance.now();
      if (on && pausedAt !== null) {
        pausedFor += performance.now() - pausedAt;
        pausedAt = null;
        if (!raf) raf = requestAnimationFrame(frame);
      }
    }
    update(0);
    raf = requestAnimationFrame(frame);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; sync(); }).observe(box);
    document.addEventListener('visibilitychange', sync);
  }

  /* ==========================================================
     1. Hero
     ========================================================== */
  (function () {
    var svg = document.getElementById('sceneSvg');
    if (!svg) return;
    var box = document.getElementById('heroScene');
    var defs = svg.querySelector('defs');
    var r = rng(808);
    function L(id) { return document.getElementById('s-' + id); }
    sharedDefs(defs);
    fade(defs, 'reflDark', '#02060e', .75);

    // Geometry (viewBox 1440 x 640)
    var HZ = 446;                    // far bank
    var FOOT = 488, DT = 262, DB = 274;  // abutment foot in the water; deck top and bottom
    var A1L = 760, A1R = 860, A2L = 1340, FLARE = 26;
    function flare(y) { return FLARE * Math.pow(clamp01((y - DB) / (FOOT - DB)), 2.2); }
    function a1Left(y) { return A1L - flare(y); }
    function a1Right(y) { return A1R + flare(y); }
    function a2Left(y) { return A2L - flare(y); }
    var SPR = 448, CROWN = 306;
    var xA = a1Right(SPR), xB = a2Left(SPR), CX = (xA + xB) / 2, NX = CX;
    function archY(x) { var t = (x - xA) / (xB - xA); return SPR - 4 * (SPR - CROWN) * t * (1 - t); }

    // Timeline (seconds). Two stone boats sail in while the plan is drawn. From T_ST their cargo is
    // unloaded: one stone at a time lifts off a deck and arcs into its place in an abutment
    var T_ST = 1.7, UNLOAD = 3.4, FLIGHT = .9;
    var T_DECK = T_ST + .2 + UNLOAD + FLIGHT + .1, T_MEET = T_DECK + 1.2, T_LIVE = T_MEET + 1.4;

    // Sky: an engineering grid, a few stars
    var gp = '';
    for (var gx = 0; gx <= 1440; gx += 48) gp += 'M' + gx + ' 0V' + HZ;
    for (var gy = 14; gy < HZ; gy += 48) gp += 'M0 ' + gy + 'H1440';
    el('path', { d: gp, stroke: '#7fb4ff', 'stroke-opacity': .075, 'stroke-width': 1, fill: 'none' }, L('grid'));
    for (var si = 0; si < 46; si++) {
      el('circle', { cx: f1(r() * 1440), cy: f1(r() * 280), r: f1(.5 + r() * .9), fill: '#dfe8ff', opacity: (.3 + r() * .5).toFixed(2), 'class': 'tw', style: 'animation-delay:' + (-r() * 4).toFixed(1) + 's' }, L('stars'));
    }

    // The city across the river: some windows lit already, more light up once the bridge is working
    var city = L('city'), bx = -10, tallest = [];
    while (bx < 1450) {
      var mid = bx > 740;
      var bw = 18 + r() * 42, bh = (24 + r() * (mid ? 120 : 64)) * (r() < .12 ? 1.45 : 1);
      el('rect', { x: f1(bx), y: f1(HZ - bh), width: f1(bw), height: f1(bh + 1), fill: ['#0c172d', '#0f1c34', '#0b1529'][Math.floor(r() * 3)] }, city);
      tallest.push([bx + bw / 2, HZ - bh]);
      for (var wy = HZ - bh + 6; wy < HZ - 7; wy += 9) {
        for (var wx = bx + 4; wx < bx + bw - 5; wx += 7) {
          var q = r(), color = r() < .7 ? '#f4c27a' : '#9fdcff';
          if (q < .1) el('rect', { x: f1(wx), y: f1(wy), width: 2.4, height: 3, fill: color, opacity: (.3 + r() * .45).toFixed(2) }, city);
          else if (q < .3) el('rect', { x: f1(wx), y: f1(wy), width: 2.4, height: 3, fill: color, opacity: (.45 + r() * .5).toFixed(2), 'class': 'win', style: '--d:' + (T_LIVE + r() * 4.5).toFixed(2) + 's' }, city);
        }
      }
      bx += bw + r() * 5;
    }
    tallest.sort(function (a, b) { return a[1] - b[1]; });
    tallest.slice(0, 3).forEach(function (p, i) {
      el('circle', { cx: f1(p[0]), cy: f1(p[1] - 3), r: 1.8, fill: '#ff5a4a', 'class': 'blink', style: 'animation-delay:' + (-i * .8) + 's' }, city);
    });

    // River
    ripples(L('ripples'), r, 130, 0, 1440, HZ + 4, 636, ['#f0b86a', '#f0b86a', '#7fe0ff', '#9fb8ff']);
    for (var ci = 0; ci < 14; ci++) {
      el('rect', { x: f1(740 + r() * 700), y: HZ + 1, width: f1(1.6 + r() * 2.4), height: f1(18 + r() * 40), fill: r() < .7 ? 'url(#reflGold)' : 'url(#reflCyan)', opacity: (.25 + r() * .35).toFixed(2), 'class': 'rip', style: 'animation-delay:' + (-r() * 6).toFixed(1) + 's' }, L('ripples'));
    }

    // The plan: a blueprint of the bridge, drawn before anything is built
    var plan = L('plan');
    function outline(fnL, fnR, xr) {
      var d = 'M' + f1(fnL(FOOT)) + ' ' + FOOT;
      for (var y = FOOT - 8; y >= DB; y -= 8) d += 'L' + f1(fnL(y)) + ' ' + y;
      d += 'L' + f1(fnL(DB)) + ' ' + DB;
      if (fnR) { for (var y2 = DB; y2 <= FOOT; y2 += 8) d += 'L' + f1(fnR(y2)) + ' ' + y2; d += 'L' + f1(fnR(FOOT)) + ' ' + FOOT; }
      else d += 'H' + xr;
      return d;
    }
    var dash = { fill: 'none', stroke: '#7fb4ff', 'stroke-opacity': .6, 'stroke-width': 1.3, 'stroke-dasharray': '5 6' };
    el('path', Object.assign({ d: outline(a1Left, a1Right) }, dash), plan);
    el('path', Object.assign({ d: outline(a2Left, null, 1450) }, dash), plan);
    el('path', Object.assign({ d: 'M' + f1(xA) + ' ' + SPR + 'Q' + f1(CX) + ' ' + (SPR - 2 * (SPR - CROWN)) + ' ' + f1(xB) + ' ' + SPR }, dash), plan);
    el('rect', Object.assign({ x: A1L, y: DT, width: 1450 - A1L, height: DB - DT }, dash), plan);
    var DY = DT - 66;
    el('path', { d: 'M' + f1(xA) + ' ' + DY + 'H' + f1(xB) + 'M' + f1(xA) + ' ' + (DY - 7) + 'V' + (DY + 7) + 'M' + f1(xB) + ' ' + (DY - 7) + 'V' + (DY + 7) + 'M' + f1(xA) + ' ' + (DY + 7) + 'V' + (SPR - 6) + 'M' + f1(xB) + ' ' + (DY + 7) + 'V' + (SPR - 6), fill: 'none', stroke: '#7fb4ff', 'stroke-opacity': .35, 'stroke-width': 1, 'stroke-dasharray': '2 4' }, plan);
    el('path', { d: 'M' + f1(NX - 9) + ' ' + (DT + 6) + 'H' + f1(NX + 9) + 'M' + f1(NX) + ' ' + (DT - 3) + 'V' + (DT + 15), stroke: '#7fb4ff', 'stroke-opacity': .7, 'stroke-width': 1.2 }, plan);
    el('circle', { cx: f1(NX), cy: DT + 6, r: 6, fill: 'none', stroke: '#7fb4ff', 'stroke-opacity': .7, 'stroke-width': 1.2 }, plan);
    var planLabel = el('text', { x: f1(CX), y: DY - 10, 'text-anchor': 'middle', 'class': 'mono', fill: '#9fc3ff', 'fill-opacity': .75, 'font-size': 12 }, plan);
    planLabel.dataset.en = 'plan · span ' + Math.round(xB - xA);
    planLabel.dataset.ja = '設計 · 支間 ' + Math.round(xB - xA);

    // Behind the abutments: boats on the far side of the river
    var farLayer = L('far'), far = [];
    for (var fi = 0; fi < 2; fi++) {
      var fg = el('g', null, farLayer);
      var fb = el('g', { 'class': 'bob', style: 'animation-delay:' + (-r() * 5).toFixed(1) + 's' }, el('g', { transform: 'scale(-.36 .36)' }, fg));
      drawBoat(fb, { color: CREW[fi + 2], crate: fi ? '#ffd27a' : '#7be0a6', glow: fi ? 'gGold' : 'gGreen', r: r });
      far.push({ g: fg, off: fi * 850 });
    }

    // Stone abutments, laid course by course from the waterline up
    var stonesLayer = L('stones'), stones = [], marked = [];
    var bands = [];   // dark joints behind each course, filled in as its stones land
    // Reflections of the abutments in the water
    var reflect = L('reflect');
    function reflPoly(fnL, fnR, xr) {
      var pts = [];
      for (var y = FOOT; y >= FOOT - 70; y -= 7) pts.push(f1(fnL(y)) + ',' + f1(2 * FOOT - y));
      if (fnR) for (var y2 = FOOT - 70; y2 <= FOOT; y2 += 7) pts.push(f1(fnR(y2)) + ',' + f1(2 * FOOT - y2));
      else pts.push(xr + ',' + (FOOT + 70), xr + ',' + FOOT);
      return pts.join(' ');
    }
    el('polygon', { points: reflPoly(a1Left, a1Right), fill: 'url(#reflDark)' }, reflect);
    el('polygon', { points: reflPoly(a2Left, null, 1452), fill: 'url(#reflDark)' }, reflect);
    set(reflect, 'opacity', '0');

    // Returns the abutment's stones in laying order: course by course from the waterline up
    function lay(fnL, fnR, xr) {
      var rows = [], y = FOOT, list = [];
      while (y > DB + 1) {
        var h = Math.min(y - DB, 21 + r() * 8);
        if (y - h < DB + 12) h = y - DB;
        rows.push([y - h, y]);
        y -= h;
      }
      rows.forEach(function (row, i) {
        var top = row[0], bot = row[1], h = bot - top, m = (top + bot) / 2;
        var xl = fnL(m), xrr = fnR ? fnR(m) : xr, x = xl, first = true;
        var course = [];
        bands.push({ row: course, el: el('rect', { x: f1(xl), y: f1(top), width: f1(xrr - xl), height: f1(h), fill: '#060b16', opacity: 0 }, stonesLayer) });
        while (x < xrr - 1) {
          var w = first && i % 2 ? 22 + r() * 12 : 30 + r() * 26;
          first = false;
          if (xrr - x - w < 22) w = xrr - x;
          var st = { cx: x + w / 2, cy: m, w: w, h: h };
          st.outer = el('g', { transform: 'translate(' + f1(st.cx) + ' ' + f1(st.cy) + ')', opacity: 0 }, stonesLayer);
          st.inner = el('g', null, st.outer);
          el('polygon', { points: stonePoints(r, -w / 2, -h / 2, w / 2, h / 2), fill: stoneFill(r, 22 + (1 - i / rows.length) * 4) }, st.inner);
          st.hl = el('path', { d: 'M' + f1(-w / 2 + 4) + ' ' + f1(-h / 2 + 2.2) + 'H' + f1(w / 2 - 4), stroke: '#a9bde0', 'stroke-opacity': .16, 'stroke-width': 1.2, 'stroke-linecap': 'round' }, st.inner);
          if (i > 0 && i < rows.length - 1 && w > 30 && r() < .3) {
            var k = Math.min(h, 26) * .036;
            st.mark = el('path', { d: MARKS[marked.length % MARKS.length], transform: 'scale(' + k.toFixed(2) + ')', fill: 'none', stroke: CREW[marked.length % CREW.length], 'stroke-width': (1.3 / k).toFixed(2), 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, st.inner);
            marked.push(st);
          }
          stones.push(st); course.push(st); list.push(st);
          x += w;
        }
      });
      return list;
    }
    var cargoA = lay(a1Left, a1Right, 0), cargoB = lay(a2Left, null, 1452);
    // Landing steps where the boats moor, there before the boats arrive
    [[466, 474, 652], [474, 482, 630], [482, 490, 608]].forEach(function (s, k) {
      var x = s[2], x1 = a1Left(s[1]) + 1;
      while (x < x1 - 1) {
        var w = Math.min(20 + r() * 22, x1 - x);
        var st = { cx: x + w / 2, cy: (s[0] + s[1]) / 2, w: w, h: s[1] - s[0], layAt: .7 + .06 * (2 - k) + r() * .1 };
        st.outer = el('g', { transform: 'translate(' + f1(st.cx) + ' ' + f1(st.cy) + ')', opacity: 0 }, stonesLayer);
        st.inner = el('g', null, st.outer);
        el('polygon', { points: stonePoints(r, -w / 2, -st.h / 2, w / 2, st.h / 2), fill: stoneFill(r, 24 + k * 2) }, st.inner);
        stones.push(st);
        x += w;
      }
    });

    // The stone boats. Each moors beside an abutment with a pile of stones on deck; the pile
    // shrinks as its stones are lifted off and flown into place
    var sbLayer = el('g'), flights = el('g');
    stonesLayer.parentNode.insertBefore(flights, stonesLayer.nextSibling);   // flying stones over the boats
    stonesLayer.parentNode.insertBefore(sbLayer, flights);
    var sg = el('linearGradient', { id: 'sailG', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    el('stop', { offset: 0, 'stop-color': '#efe6d2' }, sg);
    el('stop', { offset: 1, 'stop-color': '#b6a684' }, sg);
    var PILE = [[-24, -19, 30], [10, -19, 28], [28, -6.5, 32], [-44, -6.5, 30], [-8, -6.5, 34]];   // x, y, width; first to go first
    function drawStoneBoat(p, o) {   // bow to the right, waterline at y=0
      var hull = '#060a12', b = {};
      b.wake = el('path', { d: 'M-224 3L-88 7M-224 21L-88 10', stroke: 'url(#wakeG)', 'stroke-width': 1.6, fill: 'none', 'stroke-linecap': 'round', opacity: 0 }, p);
      el('path', { d: 'M-66 13H70L60 28H-56Z', fill: '#02050b', opacity: .45 }, p);
      el('rect', { x: -72.5, y: 8, width: 5, height: 30, rx: 2.5, fill: 'url(#reflGold)' }, p);
      el('path', { d: 'M6 0V-98M-24-92H36M-70-4V-24', stroke: hull, 'stroke-width': 2.4, 'stroke-linecap': 'round' }, p);
      el('path', { d: 'M-22-90Q6-94 34-90Q41-62 34-36Q6-32-22-36Q-15-62-22-90Z', fill: 'url(#sailG)', opacity: .92 }, p);
      el('path', { d: 'M-12-91V-35M-2-92V-34M14-92V-34M24-91V-35', stroke: '#283048', 'stroke-opacity': .2, 'stroke-width': 1 }, p);
      el('path', { d: o.mark, transform: 'translate(6 -63) scale(2.5)', fill: 'none', stroke: '#22304d', 'stroke-width': .9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, p);
      el('path', { d: 'M6-98L-16-93.5L6-89Z', fill: o.color }, p);
      el('path', { d: 'M92-12Q84-2 68 0H-70L-78-7L-74 12Q0 16 66 12Q82 6 92-12Z', fill: hull }, p);
      el('path', { d: 'M-74-3L-68 1H70L88-9', fill: 'none', stroke: o.color, 'stroke-opacity': .5, 'stroke-width': 1.6, 'stroke-linecap': 'round' }, p);
      b.pile = PILE.map(function (q) {
        var g = el('g', { transform: 'translate(' + q[0] + ' ' + q[1] + ')' }, p), w = q[2], h = w * .42;
        el('polygon', { points: stonePoints(r, -w / 2, -h / 2, w / 2, h / 2), fill: stoneFill(r, 34) }, g);
        el('path', { d: 'M' + f1(-w / 2 + 3) + ' ' + f1(-h / 2 + 1.6) + 'H' + f1(w / 2 - 3), stroke: '#dfe8ff', 'stroke-opacity': .45, 'stroke-width': 1.2, 'stroke-linecap': 'round' }, g);
        return { g: g, x: q[0], y: q[1] - h / 2 };
      });
      el('circle', { cx: -70, cy: -18, r: 12, fill: 'url(#gGold)', 'class': 'lg' }, p);
      el('rect', { x: -74, y: -23, width: 8, height: 10, rx: 3, fill: '#ffd99a' }, p);
      return b;
    }
    // Where each boat comes from, where it moors, and where it sails off to: [x, y, scale].
    // On narrow screens the left boat moors between the abutments, where it stays in view
    var SBOATS = [
      { cargo: cargoA, start: T_ST, color: '#ff8a66', mark: MARKS[2], dir: 1, t0: 0, t1: 1.9,
        wide: { from: [150, 542, .68], berth: [684, 524, .7], away: [1000, 466, .28] },
        narrow: { from: [560, 546, .72], berth: [958, 526, .7], away: [1036, 467, .28] } },
      { cargo: cargoB, start: T_ST + .2, color: '#7fe0ff', mark: MARKS[0], dir: -1, t0: .1, t1: 2.0,
        wide: { from: [1600, 550, .78], berth: [1226, 532, .74], away: [1084, 467, .28] } }
    ];
    function placeBoats(narrow) {
      SBOATS.forEach(function (sb) { var c = narrow && sb.narrow || sb.wide; sb.from = c.from; sb.berth = c.berth; sb.away = c.away; });
    }
    placeBoats(false);
    var LEAVE = 3.2;
    SBOATS.forEach(function (sb) {
      sb.g = el('g', { opacity: 0 }, sbLayer);
      var parts = drawStoneBoat(el('g', { 'class': 'bob', style: 'animation-delay:' + (-r() * 5).toFixed(1) + 's' }, sb.g), sb);
      sb.wake = parts.wake; sb.pile = parts.pile;
      var n = sb.cargo.length;
      sb.cargo.forEach(function (st, j) {
        st.flyAt = sb.start + UNLOAD * j / Math.max(1, n - 1);
        st.layAt = st.flyAt + FLIGHT;
        // it lifts off from the top of what is left of the pile
        st.sb = sb; st.pq = sb.pile[PILE.length - Math.ceil(PILE.length * (n - j) / n)];
        st.flight = el('g', { opacity: 0 }, flights);
        el('circle', { r: 22, fill: 'url(#gWhite)', opacity: .3 }, st.flight);
        var copy = st.inner.cloneNode(true);
        copy.querySelector('path').setAttribute('stroke-opacity', '.5');
        st.flight.appendChild(copy);
      });
      sb.leaveAt = sb.cargo[n - 1].flyAt + .35;
    });
    bands.forEach(function (bd) { bd.at = Math.max.apply(null, bd.row.map(function (s) { return s.layAt; })); });

    // Sail in and slow down; moor; then sail off upriver, under where the bridge will be
    function boatAt(sb, t) {
      var a = sb.from, b = sb.berth, c = sb.away;
      if (t < sb.t1) {
        var u = clamp01((t - sb.t0) / (sb.t1 - sb.t0)), e = 1 - (1 - u) * (1 - u);
        return { x: a[0] + (b[0] - a[0]) * e, y: a[1] + (b[1] - a[1]) * e, s: a[2] + (b[2] - a[2]) * e, op: clamp01((t - sb.t0) / .8), wake: 1 - e };
      }
      if (t < sb.leaveAt) return { x: b[0], y: b[1], s: b[2], op: 1, wake: 0 };
      var v = clamp01((t - sb.leaveAt) / LEAVE), ev = v * v;
      var s = 1 / (1 / b[2] + (1 / c[2] - 1 / b[2]) * ev), w = (s - b[2]) / (c[2] - b[2]);   // even steps in depth
      var op = 1 - clamp01((ev - .55) / .45);
      return { x: b[0] + (c[0] - b[0]) * w, y: b[1] + (c[1] - b[1]) * w, s: s, op: op, wake: Math.min(1, v * 3) * op };
    }
    var BUILD_END = Math.max.apply(null, SBOATS.map(function (sb) { return sb.leaveAt + LEAVE; }).concat(stones.map(function (s) { return s.layAt + .8; }))) + .1;

    // The bridge
    var bridge = L('bridge');
    var hangers = [];
    for (var hx = xA + 26; hx < xB - 20; hx += 26) {
      hangers.push({ x: hx, el: el('path', { d: 'M' + f1(hx) + ' ' + DB + 'V' + f1(archY(hx) - 3), stroke: '#4c6185', 'stroke-width': 1.6, opacity: 0 }, bridge) });
    }
    var cy0 = SPR - 2 * (SPR - CROWN);
    var halfA = 'M' + f1(xA) + ' ' + SPR + 'Q' + f1((xA + CX) / 2) + ' ' + CROWN + ' ' + f1(CX) + ' ' + CROWN;
    var halfB = 'M' + f1(xB) + ' ' + SPR + 'Q' + f1((xB + CX) / 2) + ' ' + CROWN + ' ' + f1(CX) + ' ' + CROWN;
    var ribs = [];
    [halfA, halfB].forEach(function (d) {
      ribs.push(el('path', { d: d, fill: 'none', stroke: '#1b2a45', 'stroke-width': 8, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 1 }, bridge));
      ribs.push(el('path', { d: d, fill: 'none', stroke: '#a9bde0', 'stroke-opacity': .75, 'stroke-width': 1.6, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 1, transform: 'translate(0 -2.5)' }, bridge));
    });
    var archRefl = el('path', { d: 'M' + f1(xA) + ' ' + (2 * FOOT - SPR) + 'Q' + f1(CX) + ' ' + f1(2 * FOOT - cy0) + ' ' + f1(xB) + ' ' + (2 * FOOT - SPR), fill: 'none', stroke: '#a9bde0', 'stroke-opacity': .1, 'stroke-width': 3, 'stroke-dasharray': '60 14 30 18', opacity: 0 }, L('reflect'));
    var deckL = el('rect', { x: A1L, y: DT, width: 0, height: DB - DT, fill: '#17243c' }, bridge);
    var deckR = el('rect', { x: 1452, y: DT, width: 0, height: DB - DT, fill: '#17243c' }, bridge);
    var lineL = el('rect', { x: A1L, y: DT, width: 0, height: 1.6, fill: '#b9cdee', opacity: .6 }, bridge);
    var lineR = el('rect', { x: 1452, y: DT, width: 0, height: 1.6, fill: '#b9cdee', opacity: .6 }, bridge);
    var rd = 'M' + A1L + ' ' + (DT - 12) + 'H1452';
    for (var px = A1L + 4; px < 1452; px += 16) rd += 'M' + px + ' ' + (DT - 12) + 'V' + DT;
    var rail = el('path', { d: rd, stroke: '#4c6185', 'stroke-width': 1.3, fill: 'none', opacity: 0 }, bridge);
    var lamps = el('g', { opacity: 0 }, bridge);
    [A1R - 8, 1012, 1190, A2L + 8].forEach(function (x) {
      el('path', { d: 'M' + x + ' ' + (DT - 12) + 'V' + (DT - 33), stroke: '#4c6185', 'stroke-width': 2 }, lamps);
      el('circle', { cx: x, cy: DT - 36, r: 22, fill: 'url(#gGold)', 'class': 'lg' }, lamps);
      el('circle', { cx: x, cy: DT - 36, r: 3.4, fill: '#ffe4a8' }, lamps);
    });

    // The working system: nodes along the deck, orders travelling across as data
    var data = L('data');
    var PY = DT - 5, X_IN = 792, X_AI = 962, X_REV = 1236, X_OUT = 1392;
    var nodesG = el('g', { opacity: 0 }, data);
    var NODES = [
      { x: X_IN, en: 'orders', ja: '受注' },
      { x: X_AI, en: 'AI', ja: 'AI' },
      { x: X_REV, en: 'review', ja: '確認' },
      { x: X_OUT, en: 'shared records', ja: '共有記録', anchor: 'end', dx: 10 }
    ];
    var labels = [planLabel];
    NODES.forEach(function (n) {
      el('circle', { cx: n.x, cy: PY, r: 15, fill: 'url(#gCyan)' }, nodesG);
      el('circle', { cx: n.x, cy: PY, r: 3.4, fill: '#bff0ff' }, nodesG);
      var t = el('text', { x: n.x + (n.dx || 0), y: DT - 20, 'text-anchor': n.anchor || 'middle', 'class': 'mono', fill: '#a9c6ee', 'fill-opacity': .85, 'font-size': 11.5 }, nodesG);
      t.dataset.en = n.en; t.dataset.ja = n.ja;
      labels.push(t);
      n.ring = el('circle', { cx: n.x, cy: PY, r: 4, fill: 'none', stroke: '#7fe0ff', 'stroke-width': 1.4, opacity: 0 }, data);
    });
    function applyLabels() { var l = lang(); labels.forEach(function (t) { t.textContent = t.dataset[l]; }); }
    applyLabels();
    document.addEventListener('langchange', applyLabels);

    // The meeting point of the two halves: the nexus
    var nexusFlash = el('circle', { cx: f1(NX), cy: DT + 6, r: 0, fill: 'none', stroke: '#ff8a66', 'stroke-width': 2, opacity: 0 }, data);
    var nexus = el('g', { opacity: 0 }, data);
    el('circle', { cx: f1(NX), cy: DT + 6, r: 28, fill: 'url(#gShu)', 'class': 'lg' }, nexus);
    el('circle', { cx: f1(NX), cy: DT + 6, r: 5.2, fill: '#ff6a4a' }, nexus);

    var SPAWN = 1.25, V = 105, HOLD = 1.9, POOL = 9;
    var TO_AI = (X_AI - X_IN) / V, TO_REV = (X_REV - X_IN) / V, TO_OUT = (X_OUT - X_IN) / V;
    function flagged(i) { return i % 5 === 3; }
    var packets = [];
    for (var pi = 0; pi < POOL; pi++) {
      var pg = el('g', { opacity: 0 }, data);
      packets.push({ g: pg, halo: el('circle', { cx: 0, cy: 0, r: 13, fill: 'url(#gWhite)' }, pg), body: el('rect', { x: -4, y: -4, width: 8, height: 8, rx: 4, fill: '#c9d6ec' }, pg) });
    }
    // The person who checks what the AI is unsure about
    var reviewer = el('g', { opacity: 0, transform: 'translate(' + X_REV + ' ' + (DT - 52) + ')' }, data);
    el('circle', { cx: 0, cy: 0, r: 22, fill: 'url(#gAmber)' }, reviewer);
    el('circle', { cx: 0, cy: -4, r: 4.2, fill: '#ffe2b0' }, reviewer);
    el('path', { d: 'M-7.5 8.5Q-7 1.5 0 1.5Q7 1.5 7.5 8.5Z', fill: '#ffe2b0' }, reviewer);
    var tick = el('path', { d: 'M8 -2L11 1L16.5 -5', fill: 'none', stroke: '#7be0a6', 'stroke-width': 2.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0 }, reviewer);

    // Boats launched from the landing, carrying the work out into the world
    var nearLayer = L('near'), boats = [], BOAT_EVERY = 8.5, BOAT_POOL = 4, T_BOAT = T_LIVE + .4;
    var KINDS = [
      { color: '#ff6a4a', crate: '#8fe6ff', glow: 'gCyan' },
      { color: '#7fe0ff', crate: '#ffd27a', glow: 'gGold' },
      { color: '#ffd27a', crate: '#7be0a6', glow: 'gGreen' },
      { color: '#7be0a6', crate: '#8fe6ff', glow: 'gCyan' }
    ];
    for (var bi = 0; bi < BOAT_POOL; bi++) {
      var g = el('g', { opacity: 0 }, nearLayer);
      var o = KINDS[bi]; o.r = r;
      drawBoat(el('g', { 'class': 'bob', style: 'animation-delay:' + (-r() * 5).toFixed(1) + 's' }, g), o);
      boats.push(g);
    }

    var steps = document.querySelectorAll('#buildSteps li');
    var lastPhase = -1;

    function update(t) {
      // Build progress shown under the hero text
      var phase = t < T_ST ? 0 : t < T_DECK ? 1 : t < T_LIVE ? 2 : 3;
      if (phase !== lastPhase) {
        lastPhase = phase;
        steps.forEach(function (li, i) { li.classList.toggle('on', i === phase); li.classList.toggle('done', i < phase); });
      }

      // The plan comes first, then gives way to the real thing
      set(plan, 'opacity', (clamp01(t / .8) * (1 - clamp01((t - T_LIVE + .6) / 1.2))).toFixed(2));

      // Stones: boats bring them, and each one is flown off a deck into its place
      if (t < BUILD_END || !update.settled) {
        bands.forEach(function (bd) { set(bd.el, 'opacity', clamp01((t - bd.at) / .4).toFixed(2)); });
        set(reflect, 'opacity', (clamp01((t - T_ST - .6) / 1.2) * .9).toFixed(2));
        stones.forEach(function (st) {
          if (st.mark) set(st.mark, 'stroke-opacity', (.55 + .45 * (1 - clamp01((t - st.layAt - .4) / 1.4))).toFixed(2));
          if (!st.flight) {   // the landing steps simply settle into place
            var e = easeOut(clamp01((t - st.layAt) / .55));
            set(st.outer, 'opacity', e.toFixed(2));
            set(st.inner, 'transform', 'translate(0 ' + f1(-(1 - e) * 18) + ')');
            return;
          }
          var placed = t >= st.layAt;
          set(st.outer, 'opacity', placed ? '1' : '0');
          set(st.hl, 'stroke-opacity', placed ? (.16 + .6 * (1 - clamp01((t - st.layAt) / .6))).toFixed(2) : '.16');   // a glint as it seats
          var u = (t - st.flyAt) / FLIGHT;
          if (u <= 0 || u >= 1) { set(st.flight, 'opacity', '0'); return; }
          var P = st.sb.berth, x0 = P[0] + st.sb.dir * st.pq.x * P[2], y0 = P[1] + st.pq.y * P[2];
          var k0 = Math.min(.8, 30 * P[2] / st.w), rot = st.cx > x0 ? -12 : 12;
          var ef = easeInOut(u), lift = 44 + (y0 - st.cy) * .22;
          var fx = x0 + (st.cx - x0) * ef, fy = y0 + (st.cy - y0) * ef - lift * 4 * ef * (1 - ef);
          set(st.flight, 'opacity', '1');
          set(st.flight, 'transform', 'translate(' + f1(fx) + ' ' + f1(fy) + ') rotate(' + f1((1 - ef) * rot) + ') scale(' + (k0 + (1 - k0) * ef).toFixed(3) + ')');
        });
        SBOATS.forEach(function (sb) {
          var q = boatAt(sb, t), n = sb.cargo.length, sent = 0;
          set(sb.g, 'transform', 'translate(' + f1(q.x) + ' ' + f1(q.y) + ') scale(' + (sb.dir * q.s).toFixed(3) + ' ' + q.s.toFixed(3) + ')');
          set(sb.g, 'opacity', q.op.toFixed(2));
          set(sb.wake, 'opacity', q.wake.toFixed(2));
          while (sent < n && sb.cargo[sent].flyAt <= t) sent++;
          var left = Math.ceil(PILE.length * (n - sent) / n);
          sb.pile.forEach(function (p, i) { set(p.g, 'opacity', i >= PILE.length - left ? '1' : '0'); });
        });
        if (t > BUILD_END) update.settled = true;
      }

      // Deck halves grow from each side and meet in the middle
      var d = easeInOut(clamp01((t - T_DECK) / (T_MEET - T_DECK)));
      var wl = (NX - A1L) * d, wr = (1452 - NX) * d;
      set(deckL, 'width', f1(wl)); set(lineL, 'width', f1(wl));
      set(deckR, 'x', f1(1452 - wr)); set(deckR, 'width', f1(wr));
      set(lineR, 'x', f1(1452 - wr)); set(lineR, 'width', f1(wr));
      var a = easeInOut(clamp01((t - T_DECK - .5) / 1.2));
      ribs.forEach(function (rb) { set(rb, 'stroke-dashoffset', (1 - a).toFixed(3)); });
      hangers.forEach(function (h) {
        var dist = Math.abs(h.x - NX) / (xB - xA);
        set(h.el, 'opacity', clamp01((t - T_MEET - .1 - dist * 1.2) / .35).toFixed(2));
      });
      var built = clamp01((t - T_MEET - .3) / .7);
      set(rail, 'opacity', built.toFixed(2));
      set(lamps, 'opacity', clamp01((t - T_MEET - .7) / .6).toFixed(2));
      set(archRefl, 'opacity', built.toFixed(2));
      var fu = (t - T_MEET) / .9;
      set(nexusFlash, 'opacity', fu > 0 && fu < 1 ? (1 - fu).toFixed(2) : '0');
      set(nexusFlash, 'r', fu > 0 && fu < 1 ? f1(4 + 40 * easeOut(fu)) : '0');
      set(nexus, 'opacity', clamp01(fu * 2).toFixed(2));
      set(nodesG, 'opacity', clamp01((t - T_LIVE + .6) / .6).toFixed(2));

      // Orders flowing across
      var live = t - T_LIVE, now = Math.floor(live / SPAWN), holding = -1, lastAi = -1, lastOut = -1, lastFix = -1;
      for (var k = 0; k < POOL; k++) {
        var p = packets[k], i = now - ((now - k) % POOL + POOL) % POOL, age = t - (T_LIVE + i * SPAWN);
        if (live < 0 || i < 0 || age < 0) { set(p.g, 'opacity', '0'); continue; }
        var fl = flagged(i), x, hu = -1;
        if (age < TO_REV) x = X_IN + V * age;
        else if (fl && age < TO_REV + HOLD) { x = X_REV; hu = (age - TO_REV) / HOLD; }
        else x = X_REV + V * (age - TO_REV - (fl ? HOLD : 0));
        if (x > X_OUT) { set(p.g, 'opacity', '0'); continue; }
        var raw = x < X_AI, color, glowId, rx;
        if (raw) { color = '#c9d6ec'; glowId = 'gWhite'; rx = '4'; }
        else if (fl && (hu < 0 ? x < X_REV : hu < .55)) { color = '#ffb347'; glowId = 'gAmber'; rx = '1.6'; }
        else if (fl) { color = '#7be0a6'; glowId = 'gGreen'; rx = '1.6'; }
        else { color = '#8fe6ff'; glowId = 'gCyan'; rx = '1.6'; }
        if (hu >= 0) holding = hu;
        set(p.g, 'transform', 'translate(' + f1(x) + ' ' + PY + ')');
        set(p.g, 'opacity', (clamp01(age / .3) * clamp01((X_OUT - x) / 14)).toFixed(2));
        set(p.body, 'fill', color); set(p.body, 'rx', rx);
        set(p.halo, 'fill', 'url(#' + glowId + ')');
      }
      // Pulses at the nodes when work passes through them
      for (var j = now; j >= Math.max(0, now - POOL); j--) {
        var ts = T_LIVE + j * SPAWN, extra = flagged(j) ? HOLD : 0;
        if (lastAi < 0 && ts + TO_AI <= t) lastAi = ts + TO_AI;
        if (lastOut < 0 && ts + TO_OUT + extra <= t) lastOut = ts + TO_OUT + extra;
        if (lastFix < 0 && flagged(j) && ts + TO_REV + HOLD * .55 <= t) lastFix = ts + TO_REV + HOLD * .55;
      }
      [[NODES[1], lastAi, '#7fe0ff'], [NODES[2], lastFix, '#7be0a6'], [NODES[3], lastOut, '#7fe0ff']].forEach(function (q) {
        var u = q[1] < 0 ? 1 : (t - q[1]) / .7;
        set(q[0].ring, 'opacity', u >= 0 && u < 1 ? ((1 - u) * .8).toFixed(2) : '0');
        set(q[0].ring, 'r', f1(4 + 16 * clamp01(u)));
        set(q[0].ring, 'stroke', q[2]);
      });
      var rv = holding < 0 ? 0 : holding < .12 ? holding / .12 : holding > .86 ? (1 - holding) / .14 : 1;
      set(reviewer, 'opacity', rv.toFixed(2));
      set(tick, 'opacity', holding > .55 ? '1' : '0');

      // Boats: slide off the landing, then sail out under the bridge
      var bl = t - T_BOAT, bn = Math.floor(bl / BOAT_EVERY);
      for (var b = 0; b < BOAT_POOL; b++) {
        var g = boats[b], n = bn - ((bn - b) % BOAT_POOL + BOAT_POOL) % BOAT_POOL, ba = bl - n * BOAT_EVERY;
        if (bl < 0 || n < 0 || ba < 0) { set(g, 'opacity', '0'); continue; }
        var u2 = easeInOut(clamp01(ba / 3)), bxp, byp, bs;
        if (ba < 3) { bxp = 700 - 80 * u2; byp = 494 + 42 * u2; bs = .6 + .32 * u2; }
        else { bxp = 620 - 44 * (ba - 3); byp = 536; bs = .92; }
        if (bxp < -260) { set(g, 'opacity', '0'); continue; }
        set(g, 'transform', 'translate(' + f1(bxp) + ' ' + f1(byp) + ') scale(' + (-bs).toFixed(3) + ' ' + bs.toFixed(3) + ')');
        set(g, 'opacity', clamp01(ba / .6).toFixed(2));
      }
      // Far boats drift the other way, behind the abutments
      far.forEach(function (fb) {
        var fx = 1520 - ((t * 15 + fb.off) % 1700);
        set(fb.g, 'transform', 'translate(' + f1(fx) + ' 459)');
      });
    }

    // On narrow screens, frame the bridge rather than the open water
    function frameScene() {
      var rect = box.getBoundingClientRect();
      var narrow = !!rect.height && rect.width / rect.height < 1.4;
      set(svg, 'viewBox', narrow ? '600 0 840 640' : '0 0 1440 640');
      placeBoats(narrow);
    }
    frameScene();
    window.addEventListener('resize', frameScene);

    run(box, update, T_LIVE + 9.3);
  })();

  /* ==========================================================
     2. River band: many crews, one river
     ========================================================== */
  (function () {
    var svg = document.getElementById('bandSvg');
    if (!svg) return;
    var box = document.getElementById('band');
    var defs = svg.querySelector('defs');
    var r = rng(1730);
    sharedDefs(defs);
    var city = document.getElementById('b-city');
    var bx = -10;
    while (bx < 1450) {
      var bw = 16 + r() * 36, bh = 8 + r() * 34;
      el('rect', { x: f1(bx), y: f1(62 - bh), width: f1(bw), height: f1(bh + 1), fill: r() < .5 ? '#0e1a30' : '#122039' }, city);
      for (var k = 0; k < bh / 8; k++) if (r() < .45) el('rect', { x: f1(bx + 3 + r() * (bw - 7)), y: f1(62 - bh + 4 + k * 8), width: 2.2, height: 2.6, fill: r() < .7 ? '#f4c27a' : '#9fdcff', opacity: (.3 + r() * .5).toFixed(2) }, city);
      bx += bw + r() * 6;
    }
    ripples(document.getElementById('b-ripples'), r, 90, 0, 1440, 66, 236, ['#f0b86a', '#7fe0ff', '#9fb8ff']);
    var layer = document.getElementById('b-boats'), boats = [];
    var TRAVEL = 1900;
    // Two lanes going opposite ways: work travelling out from Osaka, and back from partners
    function addBoat(i, lane) {
      var o = { color: CREW[i % CREW.length], crate: CREW[(i + 2) % CREW.length], glow: ['gCyan', 'gGold', 'gAmber', 'gGreen'][i % 4], r: r };
      var g = el('g', null, layer);
      var pos = el('g', null, g);
      drawBoat(el('g', { 'class': 'bob', style: 'animation-delay:' + (-r() * 5).toFixed(1) + 's' }, pos), o);
      boats.push({ g: g, pos: pos, x0: lane.x0 + i * lane.gap + r() * 90, y: lane.y + r() * 8, s: lane.s + r() * .05, v: lane.v, dir: lane.dir });
    }
    var LANES = [
      { y: 104, s: .44, v: 10, dir: -1, x0: 40, gap: 330 },
      { y: 176, s: .7, v: 17, dir: 1, x0: -60, gap: 390 }
    ];
    for (var a = 0; a < 6; a++) addBoat(a, LANES[0]);
    for (var b2 = 0; b2 < 5; b2++) addBoat(b2 + 6, LANES[1]);
    boats.sort(function (p, q) { return p.y - q.y; }).forEach(function (bt) { layer.appendChild(bt.g); });
    function update(t) {
      boats.forEach(function (bt) {
        var x = ((bt.x0 + bt.v * t * bt.dir) % TRAVEL + TRAVEL) % TRAVEL - 230;
        set(bt.pos, 'transform', 'translate(' + f1(x) + ' ' + f1(bt.y) + ') scale(' + (bt.dir * bt.s).toFixed(3) + ' ' + bt.s.toFixed(3) + ')');
      });
    }
    run(box, update, 0);
  })();
})();
