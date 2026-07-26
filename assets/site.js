/* dannyhanes.com — interactive engine. Vanilla JS, no dependencies.
   Everything degrades gracefully: no JS still yields a styled, readable site. */
(function () {
  'use strict';

  var docEl = document.documentElement;
  var reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Site root, derived from this script's own URL so it works at any depth,
  // on GitHub Pages and on file://.
  var root = document.currentScript
    ? document.currentScript.src.replace(/assets\/site\.js.*$/, '')
    : './';

  // Apple system colors
  var HUES = [
    { h: 211, name: 'Blue' },
    { h: 280, name: 'Purple' },
    { h: 349, name: 'Pink' },
    { h: 135, name: 'Green' },
    { h: 35, name: 'Orange' }
  ];

  function getTheme() { return docEl.getAttribute('data-theme') || 'light'; }
  function getHue() { return parseInt(getComputedStyle(docEl).getPropertyValue('--hue'), 10) || 211; }

  function setTheme(theme, origin) {
    var apply = function () {
      docEl.setAttribute('data-theme', theme);
      try { localStorage.setItem('theme', theme); } catch (e) {}
      dispatchEvent(new CustomEvent('themechange'));
    };
    // Circular reveal from the click point, where supported.
    if (!reducedMotion && document.startViewTransition && origin && document.visibilityState === 'visible') {
      docEl.classList.add('theme-vt');
      var vt = document.startViewTransition(apply);
      vt.ready.then(function () {
        var r = Math.hypot(Math.max(origin.x, innerWidth - origin.x), Math.max(origin.y, innerHeight - origin.y));
        docEl.animate(
          { clipPath: ['circle(0px at ' + origin.x + 'px ' + origin.y + 'px)', 'circle(' + r + 'px at ' + origin.x + 'px ' + origin.y + 'px)'] },
          { duration: 500, easing: 'cubic-bezier(0.16,1,0.3,1)', pseudoElement: '::view-transition-new(root)' }
        );
      }).catch(function () {});
      vt.finished.finally(function () { docEl.classList.remove('theme-vt'); });
    } else {
      apply();
    }
  }

  function setHue(h, name) {
    docEl.style.setProperty('--hue', h);
    try { localStorage.setItem('hue', h); } catch (e) {}
    dispatchEvent(new CustomEvent('themechange'));
    return name;
  }

  /* ---------- Background layers ---------- */
  var aurora = document.createElement('div');
  aurora.className = 'aurora';
  aurora.setAttribute('aria-hidden', 'true');
  document.body.prepend(aurora);

  var spot = document.createElement('div');
  spot.className = 'spotlight';
  spot.setAttribute('aria-hidden', 'true');
  document.body.prepend(spot);
  if (!reducedMotion) {
    addEventListener('pointermove', function (e) {
      spot.style.setProperty('--mx', e.clientX + 'px');
      spot.style.setProperty('--my', e.clientY + 'px');
    }, { passive: true });
  }

  /* ---------- Particle constellation ---------- */
  if (!reducedMotion) {
    var canvas = document.createElement('canvas');
    canvas.id = 'particles';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(canvas);
    var ctx = canvas.getContext('2d');
    var pts = [], W = 0, H = 0, DPR = 1, mouse = { x: -9999, y: -9999 };
    var pColor = '148,163,184';

    var refreshColor = function () {
      var probe = document.createElement('span');
      probe.style.color = 'hsl(' + getHue() + ',' + (getTheme() === 'light' ? '50%,45%' : '80%,62%') + ')';
      document.body.appendChild(probe);
      var m = getComputedStyle(probe).color.match(/(\d+),\s*(\d+),\s*(\d+)/);
      if (m) pColor = m[1] + ',' + m[2] + ',' + m[3];
      probe.remove();
    };
    addEventListener('themechange', refreshColor);

    var resize = function () {
      DPR = Math.min(devicePixelRatio || 1, 2);
      W = innerWidth; H = innerHeight;
      canvas.width = W * DPR; canvas.height = H * DPR;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      var target = Math.min(110, Math.round((W * H) / 16000));
      while (pts.length < target) {
        pts.push({
          x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
          r: Math.random() * 1.6 + 0.6
        });
      }
      pts.length = target;
    };
    addEventListener('resize', resize);
    resize();
    refreshColor();

    addEventListener('pointermove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
    addEventListener('pointerleave', function () { mouse.x = mouse.y = -9999; });

    var LINK = 110, running = true;
    document.addEventListener('visibilitychange', function () {
      running = !document.hidden;
      if (running) requestAnimationFrame(tick);
    });

    var tick = function () {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      var light = getTheme() === 'light';
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < -20) p.x = W + 20; else if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; else if (p.y > H + 20) p.y = -20;
        // gentle pull toward the cursor
        var dx = mouse.x - p.x, dy = mouse.y - p.y, d2 = dx * dx + dy * dy;
        if (d2 < 32400 && d2 > 1) {
          var d = Math.sqrt(d2), f = (180 - d) / 180 * 0.012;
          p.vx += dx / d * f; p.vy += dy / d * f;
        }
        var sp2 = p.vx * p.vx + p.vy * p.vy;
        if (sp2 > 0.9) { p.vx *= 0.96; p.vy *= 0.96; }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + pColor + ',' + (light ? 0.22 : 0.42) + ')';
        ctx.fill();
      }
      for (var a = 0; a < pts.length; a++) {
        for (var b = a + 1; b < pts.length; b++) {
          var ddx = pts[a].x - pts[b].x;
          if (ddx > LINK || ddx < -LINK) continue;
          var ddy = pts[a].y - pts[b].y;
          if (ddy > LINK || ddy < -LINK) continue;
          var dist = Math.sqrt(ddx * ddx + ddy * ddy);
          if (dist < LINK) {
            ctx.beginPath();
            ctx.moveTo(pts[a].x, pts[a].y);
            ctx.lineTo(pts[b].x, pts[b].y);
            ctx.strokeStyle = 'rgba(' + pColor + ',' + ((1 - dist / LINK) * (light ? 0.07 : 0.13)) + ')';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- Header controls (theme + command palette) ---------- */
  var nav = document.querySelector('.site-nav');
  if (nav) {
    var themeBtn = document.createElement('button');
    themeBtn.className = 'nav-btn';
    themeBtn.setAttribute('aria-label', 'Toggle light/dark theme');
    var setThemeIcon = function () {
      themeBtn.innerHTML = getTheme() === 'light'
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4"/></svg>';
    };
    setThemeIcon();
    addEventListener('themechange', setThemeIcon);
    themeBtn.addEventListener('click', function (e) {
      setTheme(getTheme() === 'light' ? 'dark' : 'light', { x: e.clientX || innerWidth - 40, y: e.clientY || 30 });
    });

    var cmdkBtn = document.createElement('button');
    cmdkBtn.className = 'nav-btn';
    cmdkBtn.setAttribute('aria-label', 'Open command palette');
    cmdkBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><span class="kbd">' + (navigator.platform.indexOf('Mac') > -1 ? '⌘' : 'Ctrl') + 'K</span>';
    cmdkBtn.addEventListener('click', function () { openPalette(); });

    nav.appendChild(themeBtn);
    nav.appendChild(cmdkBtn);
  }

  /* ---------- Command palette ---------- */
  var ICONS = {
    page: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v13a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 21V12h6v9"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="4" width="20" height="16" rx="3"/><path d="m2.5 6.5 8.4 6.3a2 2 0 0 0 2.2 0l8.4-6.3"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v3m0 12v3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1M3 12h3m12 0h3M5.6 18.4l2.1-2.1m8.6-8.6 2.1-2.1"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7L12.5 19"/></svg>'
  };

  var actions = [
    { label: 'Home', hint: 'Go', icon: ICONS.home, run: function () { location.href = root + (location.protocol === 'file:' ? 'index.html' : ''); } },
    { label: 'Blog', hint: 'Go', icon: ICONS.page, run: function () { go('blog/'); } },
    { label: 'Custom Lock Card', hint: 'Post', icon: ICONS.page, run: function () { go('blog/home-assistant-lock-card/'); } },
    { label: 'About', hint: 'Go', icon: ICONS.user, run: function () { go('about/'); } },
    { label: 'Career', hint: 'Go', icon: ICONS.user, run: function () { go('career/'); } },
    { label: 'Contact', hint: 'Go', icon: ICONS.mail, run: function () { go('contact/'); } },
    { label: 'Toggle light / dark', hint: 'Theme', icon: ICONS.spark, keep: false, run: function () { setTheme(getTheme() === 'light' ? 'dark' : 'light', { x: innerWidth / 2, y: innerHeight / 3 }); } },
    { label: 'Cycle accent color', hint: 'Theme', icon: ICONS.spark, run: function () { cycleHue(); } },
    { label: 'Copy email address', hint: 'me@dannyhanes.com', icon: ICONS.mail, run: function () { navigator.clipboard && navigator.clipboard.writeText('me@dannyhanes.com'); } },
    { label: 'Email me', hint: 'mailto', icon: ICONS.mail, run: function () { location.href = 'mailto:me@dannyhanes.com'; } },
    { label: 'LinkedIn', hint: '↗', icon: ICONS.link, run: function () { open('https://www.linkedin.com/in/dannyhanes/', '_blank'); } },
    { label: 'Instagram', hint: '↗', icon: ICONS.link, run: function () { open('https://www.instagram.com/danny.hanes', '_blank'); } },
    { label: 'Party mode', hint: '¯\\_(ツ)_/¯', icon: ICONS.spark, run: function () { docEl.classList.toggle('party'); } }
  ];
  function go(path) { location.href = root + path + (location.protocol === 'file:' ? 'index.html' : ''); }
  function cycleHue() {
    var cur = getHue();
    var idx = 0;
    for (var i = 0; i < HUES.length; i++) if (HUES[i].h === cur) { idx = (i + 1) % HUES.length; break; }
    setHue(HUES[idx].h, HUES[idx].name);
    return HUES[idx];
  }

  var overlay = document.createElement('div');
  overlay.className = 'cmdk-overlay';
  overlay.innerHTML = '<div class="cmdk" role="dialog" aria-label="Command palette"><input type="text" placeholder="Where to? Try “career”, “theme”, “party”…" aria-label="Search commands"><div class="cmdk-list" role="listbox"></div></div>';
  document.body.appendChild(overlay);
  var cmdkInput = overlay.querySelector('input');
  var cmdkList = overlay.querySelector('.cmdk-list');
  var activeIdx = 0, filtered = actions;

  function renderList() {
    cmdkList.innerHTML = '';
    if (!filtered.length) {
      cmdkList.innerHTML = '<div class="cmdk-empty">Nothing matches — try “blog” or “theme”.</div>';
      return;
    }
    filtered.forEach(function (a, i) {
      var el = document.createElement('button');
      el.className = 'cmdk-item' + (i === activeIdx ? ' active' : '');
      el.innerHTML = a.icon + '<span>' + a.label + '</span><span class="cmdk-hint">' + a.hint + '</span>';
      el.addEventListener('click', function () { pick(a); });
      el.addEventListener('pointerenter', function () { activeIdx = i; renderList(); });
      cmdkList.appendChild(el);
    });
  }
  function filterList() {
    var q = cmdkInput.value.trim().toLowerCase();
    filtered = !q ? actions : actions.filter(function (a) {
      var l = a.label.toLowerCase();
      if (l.indexOf(q) > -1) return true;
      var qi = 0;
      for (var i = 0; i < l.length && qi < q.length; i++) if (l[i] === q[qi]) qi++;
      return qi === q.length;
    });
    activeIdx = 0;
    renderList();
  }
  function pick(a) { closePalette(); a.run(); }
  function openPalette() {
    overlay.classList.add('open');
    cmdkInput.value = '';
    filterList();
    setTimeout(function () { cmdkInput.focus(); }, 30);
  }
  function closePalette() { overlay.classList.remove('open'); cmdkInput.blur(); }
  overlay.addEventListener('click', function (e) { if (e.target === overlay) closePalette(); });
  cmdkInput.addEventListener('input', filterList);
  addEventListener('keydown', function (e) {
    var isOpen = overlay.classList.contains('open');
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      isOpen ? closePalette() : openPalette();
    } else if (e.key === '/' && !isOpen && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) {
      e.preventDefault();
      openPalette();
    } else if (isOpen) {
      if (e.key === 'Escape') closePalette();
      else if (e.key === 'ArrowDown') { e.preventDefault(); activeIdx = Math.min(activeIdx + 1, filtered.length - 1); renderList(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); activeIdx = Math.max(activeIdx - 1, 0); renderList(); }
      else if (e.key === 'Enter' && filtered[activeIdx]) pick(filtered[activeIdx]);
    }
  });

  /* ---------- Scroll reveal ---------- */
  var main = document.querySelector('main.page');
  if (main && !reducedMotion && 'IntersectionObserver' in window) {
    docEl.classList.add('js-reveal');
    var targets = [];
    Array.prototype.forEach.call(main.children, function (child) { targets.push(child); });
    ['.post-list > li', '.timeline > .job', '.links > li'].forEach(function (sel) {
      main.querySelectorAll(sel).forEach(function (el) { if (targets.indexOf(el) < 0) targets.push(el); });
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -5% 0px' });
    var stagger = 0;
    targets.forEach(function (el) {
      el.classList.add('reveal');
      var rect = el.getBoundingClientRect();
      if (rect.top < innerHeight) { el.style.setProperty('--reveal-delay', (stagger * 70) + 'ms'); stagger++; }
      io.observe(el);
    });
  }

  /* ---------- 3D tilt on cards ---------- */
  if (!reducedMotion && matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.links a, .post-card, .job').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = 'perspective(700px) rotateY(' + (px * 3) + 'deg) rotateX(' + (py * -3) + 'deg) translateY(-2px)';
      });
      card.addEventListener('pointerleave', function () { card.style.transform = ''; });
    });
  }

  /* ---------- Reading progress (article pages) ---------- */
  var article = document.querySelector('article');
  if (article) {
    var bar = document.createElement('div');
    bar.className = 'progress-bar';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    var onScroll = function () {
      var total = article.offsetHeight - innerHeight;
      var gone = Math.min(Math.max(scrollY - article.offsetTop + 80, 0), Math.max(total, 1));
      bar.style.transform = 'scaleX(' + (gone / Math.max(total, 1)) + ')';
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Copy buttons ---------- */
  document.querySelectorAll('.copy-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var code = btn.parentElement.querySelector('code').innerText;
      navigator.clipboard.writeText(code).then(function () {
        btn.textContent = 'Copied!';
        setTimeout(function () { btn.textContent = 'Copy'; }, 1600);
      });
    });
  });

  /* ---------- Footer year ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- file:// browsing: point directory links at index.html ---------- */
  if (location.protocol === 'file:') {
    document.querySelectorAll('a[href]').forEach(function (a) {
      var h = a.getAttribute('href');
      if (h && !/^[a-z]+:/i.test(h) && h.charAt(0) !== '#' && (h.slice(-1) === '/' || h === '.' || h === '..')) {
        a.setAttribute('href', h.replace(/\/?$/, '/') + 'index.html');
      }
    });
  }

  /* ---------- Konami code → party mode ---------- */
  var konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  var kIdx = 0;
  addEventListener('keydown', function (e) {
    kIdx = (e.key === konami[kIdx]) ? kIdx + 1 : (e.key === konami[0] ? 1 : 0);
    if (kIdx === konami.length) { kIdx = 0; docEl.classList.toggle('party'); }
  });

  // Typing effect in the hero tagline. The article ("a"/"an") stays in the
  // plain tagline color; only the identity itself types out in accent blue.
  var typed = document.getElementById('typed');
  if (typed) {
    var article = document.getElementById('typed-article');
    var words = [
      { a: 'a', t: 'husband.' },
      { a: 'a', t: 'father.' },
      { a: 'an', t: 'Apple device management specialist.' },
      { a: 'a', t: 'Founding Solutions Engineer.' },
      { a: 'a', t: 'homelab enthusiast.' },
      { a: 'a', t: 'DIY tinkerer.' },
      { a: 'a', t: 'smart home tinkerer.' }
    ];
    var setArticle = function (w) { if (article) article.textContent = w.a; };
    if (reducedMotion) {
      setArticle(words[0]);
      typed.textContent = words[0].t;
    } else {
      var wIdx = 0, cIdx = 0, deleting = false;
      setArticle(words[0]);
      var typeTick = function () {
        var word = words[wIdx];
        cIdx += deleting ? -1 : 1;
        typed.textContent = word.t.slice(0, cIdx);
        var delay = deleting ? 40 : 75;
        if (!deleting && cIdx === word.t.length) { delay = 2100; deleting = true; }
        else if (deleting && cIdx === 0) {
          deleting = false;
          wIdx = (wIdx + 1) % words.length;
          setArticle(words[wIdx]);
          delay = 350;
        }
        setTimeout(typeTick, delay);
      };
      setTimeout(typeTick, 600);
    }
  }
})();
