/* Page interactions and motion; loaded after the page markup. */

/* ============================================================
   0 · HELPERS
   ============================================================ */
const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ============================================================
   1 · THEME TOGGLE
   ============================================================ */
(function theme(){
  const toggle = $('#themeToggle');
  const html = document.documentElement;
  const meta = document.querySelector('meta[name="theme-color"]');

  function apply(theme){
    html.classList.add('theme-transitioning');
    html.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    if (meta) meta.setAttribute('content', theme === 'light' ? '#F5F0E6' : '#0D0B09');
    toggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    refreshCanvasColors();
    setTimeout(() => html.classList.remove('theme-transitioning'), 420);
  }

  toggle.addEventListener('click', () => {
    const cur = html.getAttribute('data-theme') || 'dark';
    apply(cur === 'dark' ? 'light' : 'dark');
  });

  // initial label + canvas colors
  const cur = html.getAttribute('data-theme') || 'dark';
  toggle.setAttribute('aria-label', cur === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
})();

/* ============================================================
   2 · CANVAS THEME COLORS
   ============================================================ */
let rgbAccent = '230,122,74';
let rgbTeal = '107,165,176';
let rgbText = '245,239,228';

function refreshCanvasColors(){
  const root = getComputedStyle(document.documentElement);
  rgbAccent = root.getPropertyValue('--accent-rgb').trim() || rgbAccent;
  rgbTeal   = root.getPropertyValue('--teal-rgb').trim()   || rgbTeal;
  rgbText   = root.getPropertyValue('--text-rgb').trim()   || rgbText;
}
refreshCanvasColors();

/* ============================================================
   3 · PRELOADER
   ============================================================ */
(function preloader(){
  const bar = $('#loadBar'), pct = $('#loadPct'), loader = $('#loader');
  let p = 0, done = false;

  const tick = setInterval(() => {
    p += Math.random() * 18 + 8;
    if (p >= 100){ p = 100; clearInterval(tick); finish(); }
    bar.style.width = p + '%';
    pct.textContent = Math.floor(p);
  }, 100);

  function finish(){
    if (done) return; done = true;
    setTimeout(() => {
      loader.classList.add('done');
      intro();
      startTyping();
      buildStatement();
    }, 260);
  }
  setTimeout(() => { if (!done){ bar.style.width = '100%'; pct.textContent = '100'; finish(); } }, 3200);
})();

/* ============================================================
   4 · SPLIT TEXT
   ============================================================ */
function splitChildren(source, ref){
  const frag = document.createDocumentFragment();
  source.childNodes.forEach(node => {
    if (node.nodeType === 3){
      [...node.textContent].forEach(ch => {
        const s = document.createElement('span');
        s.className = 'char';
        s.textContent = ch === ' ' ? '\u00A0' : ch;
        s.style.transitionDelay = (ref.i++ * 28) + 'ms';
        frag.appendChild(s);
      });
    } else if (node.nodeType === 1){
      const clone = node.cloneNode(false);
      clone.appendChild(splitChildren(node, ref));
      frag.appendChild(clone);
    }
  });
  return frag;
}
function splitText(el){
  const original = el.cloneNode(true);
  el.setAttribute('aria-label', original.textContent.trim());
  el.textContent = '';
  el.appendChild(splitChildren(original, { i: 0 }));
}
$$('[data-split]').forEach(splitText);

function intro(){
  const name = $('.hero-name');
  if (name) name.classList.add('split-in');
  $$('.hero .reveal').forEach(el => el.classList.add('in'));
}

/* ============================================================
   5 · TYPING
   ============================================================ */
let typingStarted = false;
function startTyping(){
  if (typingStarted) return; typingStarted = true;
  const el = $('#typed');
  if (!el) return;
  const phrases = ['reason.', 'retrieve.', 'orchestrate.', 'evaluate.', 'ship.'];
  let pIdx = 0, cIdx = 0, deleting = false;

  function tick(){
    const phrase = phrases[pIdx];
    if (!deleting){
      if (cIdx < phrase.length){
        cIdx++; el.textContent = phrase.slice(0, cIdx);
        setTimeout(tick, 65 + Math.random() * 40);
      } else { deleting = true; setTimeout(tick, 1600); }
    } else {
      if (cIdx > 0){
        cIdx--; el.textContent = phrase.slice(0, cIdx);
        setTimeout(tick, 30);
      } else {
        deleting = false;
        pIdx = (pIdx + 1) % phrases.length;
        setTimeout(tick, 260);
      }
    }
  }
  tick();
}

/* ============================================================
   6 · STATEMENT
   ============================================================ */
function buildStatement(){
  const wrap = $('#statementText');
  if (!wrap) return;
  const text = wrap.textContent.trim();
  wrap.innerHTML = '';
  text.split(/\s+/).forEach(word => {
    const span = document.createElement('span');
    span.className = 'w';
    span.textContent = word;
    wrap.appendChild(span);
    wrap.appendChild(document.createTextNode(' '));
  });
}

/* ============================================================
   7 · OBSERVERS
   ============================================================ */
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const delay = parseFloat(el.dataset.delay || 0);
    el.style.transitionDelay = delay + 'ms';
    el.classList.add('in');
    if (el.hasAttribute('data-split')) el.classList.add('split-in');
    revealObserver.unobserve(el);
  });
}, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

$$('.reveal, [data-split]').forEach(el => {
  if (el.closest('.hero')) return;
  revealObserver.observe(el);
});

const countObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    animateCount(e.target);
    countObserver.unobserve(e.target);
  });
}, { threshold: 0.55 });

function animateCount(el){
  const target = parseFloat(el.dataset.count);
  const dec = parseInt(el.dataset.dec || 0, 10);
  const t0 = performance.now(), dur = 1500;
  (function frame(t){
    const p = clamp((t - t0) / dur, 0, 1);
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = (target * e).toFixed(dec);
    if (p < 1) requestAnimationFrame(frame);
    else el.textContent = target.toFixed(dec);
  })(t0);
}
$$('[data-count]').forEach(el => countObserver.observe(el));

/* ============================================================
   8 · CURSOR
   ============================================================ */
(function cursor(){
  if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  const ring = $('#cursor'), dot = $('#cursorDot');
  let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
  document.body.classList.add('cursor-ready');

  addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`;
  });

  (function loop(){
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
    requestAnimationFrame(loop);
  })();

  const hoverables = 'a, button, .tag, .stat, .panel, .clink, input, textarea, .skill-row';
  document.addEventListener('mouseover', e => {
    if (e.target.closest(hoverables)) ring.classList.add('grow');
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest(hoverables)) ring.classList.remove('grow');
  });
})();

/* ============================================================
   9 · MAGNETIC + TILT
   ============================================================ */
if (!reduceMotion){
  $$('.magnetic').forEach(el => {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      el.style.transform = `translate(${x * 0.12}px, ${y * 0.18}px)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });

  $$('[data-tilt]').forEach(el => {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(900px) rotateY(${px * 7}deg) rotateX(${-py * 7}deg)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });
}

/* ============================================================
   10 · NETWORK CANVAS
   ============================================================ */
(function network(){
  const canvas = $('#net');
  if (!canvas || reduceMotion) return;
  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, dpr = 1, pts = [];

  function build(){
    const count = Math.min(40, Math.floor((w * h) / 32000));
    pts = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.1,
      vy: (Math.random() - 0.5) * 0.1,
      r: Math.random() * 1 + 0.4
    }));
  }
  function resize(){
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
  }
  function draw(){
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < pts.length; i++){
      const p = pts[i];
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rgbText},.4)`;
      ctx.fill();
      for (let j = i + 1; j < pts.length; j++){
        const q = pts[j];
        const d = Math.hypot(p.x - q.x, p.y - q.y);
        if (d < 120){
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = `rgba(${rgbAccent},${(1 - d / 120) * 0.28})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }
  addEventListener('resize', resize);
  resize();
  draw();
})();

/* ============================================================
   11 · SCROLL ENGINE + VERTICAL PROGRESS
   ============================================================ */
const scrollState = {
  lastY: 0,
  vel: 0,
  targetVel: 0,
  progress: 0,
};

const vFill = $('#vprogressFill');
const vDot  = $('#vprogressDot');

function updateScroll(){
  const y = scrollY;
  const delta = y - scrollState.lastY;
  scrollState.targetVel = Math.abs(delta);
  scrollState.lastY = y;

  scrollState.vel = scrollState.vel * 0.85 + scrollState.targetVel * 0.15;
  const velNorm = Math.min(scrollState.vel / 25, 1);

  const docH = document.documentElement.scrollHeight - innerHeight;
  scrollState.progress = clamp(y / (docH || 1), 0, 1);

  const root = document.documentElement;
  root.style.setProperty('--vel', velNorm.toFixed(3));
  root.style.setProperty('--vel-px', (velNorm * 4).toFixed(2) + 'px');
  root.style.setProperty('--scroll', y);

  // horizontal top bar
  $('#progress').style.width = (scrollState.progress * 100) + '%';

  // vertical right bar + dot
  if (vFill && vDot){
    const pct = scrollState.progress * 100;
    vFill.style.height = pct + '%';
    vDot.style.top = pct + '%';
  }

  // timecode
  const totalFrames = 24 * 60;
  const f = Math.floor(scrollState.progress * totalFrames);
  const ff = f % 24;
  const ss = Math.floor(f / 24) % 60;
  const mm = Math.floor(f / (24 * 60)) % 60;
  $('#timecode').textContent =
    '00:' + String(mm).padStart(2,'0') + ':' +
    String(ss).padStart(2,'0') + ':' +
    String(ff).padStart(2,'0');

  // skills active row
  updateSkillsActive();

  requestAnimationFrame(updateScroll);
}

/* ============================================================
   12 · SKILL ROW ACTIVATION (one active at a time)
   ============================================================ */
const skillRows = $$('.skill-row');
function updateSkillsActive(){
  if (!skillRows.length) return;
  const vh = innerHeight;
  const center = vh / 2;
  let closest = null;
  let minDist = Infinity;

  for (let i = 0; i < skillRows.length; i++){
    const r = skillRows[i].getBoundingClientRect();
    // ignore rows entirely off-screen
    if (r.bottom < 0 || r.top > vh) continue;
    const rowCenter = r.top + r.height / 2;
    const d = Math.abs(rowCenter - center);
    if (d < minDist){ minDist = d; closest = skillRows[i]; }
  }

  for (let i = 0; i < skillRows.length; i++){
    skillRows[i].classList.toggle('active', skillRows[i] === closest);
  }
}

updateScroll();

/* ============================================================
   13 · HERO ZOOM-THROUGH
   ============================================================ */
(function heroZoom(){
  if (reduceMotion) return;
  const hero = $('#hero');
  const copy = $('#heroCopy');
  const visual = $('#heroVisual');
  const bg = $('#heroBg');

  function frame(){
    const y = scrollY;
    const h = hero.offsetHeight;
    const p = clamp(y / h, 0, 1);

    if (copy){
      copy.style.transform = `translate3d(0, ${p * 120}px, 0) scale(${1 + p * 0.35})`;
      copy.style.opacity = (1 - p * 1.1).toFixed(3);
      copy.style.filter = `blur(${p * 6}px)`;
    }
    if (visual){
      visual.style.transform = `translate3d(0, ${p * 60}px, 0) scale(${1 + p * 0.2})`;
      visual.style.opacity = (1 - p * 0.9).toFixed(3);
      visual.style.filter = `blur(${p * 4}px)`;
    }
    if (bg){
      bg.style.transform = `translate3d(0, ${p * -80}px, 0) scale(${1 + p * 0.1})`;
    }
    requestAnimationFrame(frame);
  }
  frame();
})();

/* ============================================================
   14 · STATEMENT WORD ILLUMINATION
   ============================================================ */
(function statementScroll(){
  const section = $('#statement');
  if (!section) return;
  const words = $$('.statement-wrap .w');

  function frame(){
    const rect = section.getBoundingClientRect();
    const vh = innerHeight;
    const p = clamp((vh - rect.top) / (vh + rect.height), 0, 1);
    const peak = clamp((p - 0.15) / 0.6, 0, 1);
    const idx = Math.floor(peak * words.length);
    words.forEach((w, i) => w.classList.toggle('hot', i < idx));
    requestAnimationFrame(frame);
  }
  frame();
})();

/* ============================================================
   15 · 3D CORRIDOR
   ============================================================ */
(function corridor(){
  const section = $('#projects');
  const cards = $$('.panel[data-project]');
  const counter = $('#hCount');
  const bar = $('#hBar');
  if (!section || !cards.length) return;

  function frame(){
    const rect = section.getBoundingClientRect();
    const total = section.offsetHeight - innerHeight;
    const progress = clamp(-rect.top / (total || 1), 0, 1);

    if (bar) bar.style.width = (progress * 100) + '%';

    const n = cards.length;
    const segSize = 0.5;
    const segStart = i => i * (0.6 / (n - 1));
    let active = 0;

    cards.forEach((card, i) => {
      const localT = clamp((progress - segStart(i)) / segSize, 0, 1);
      let z, opacity, blur, rotY;

      if (localT < 0.5){
        const k = localT / 0.5;
        z = 2000 * (1 - k);
        opacity = Math.min(1, k * 1.6);
        blur = (1 - k) * 6;
        rotY = (1 - k) * 10;
      } else {
        const k = (localT - 0.5) / 0.5;
        z = -800 * k;
        opacity = Math.max(0, 1 - k * 1.3);
        blur = k * 10;
        rotY = -k * 8;
      }

      card.style.transform =
        `translate(-50%, -50%) translateZ(${z.toFixed(1)}px) rotateY(${rotY.toFixed(2)}deg)`;
      card.style.opacity = opacity.toFixed(3);
      card.style.filter = blur > 0.5 ? `blur(${blur.toFixed(1)}px)` : 'none';

      if (opacity > 0.7 && Math.abs(z) < 200) active = i;
    });

    if (counter){
      counter.textContent =
        String(active + 1).padStart(2, '0') + ' / ' + String(n).padStart(2, '0');
    }
    requestAnimationFrame(frame);
  }
  frame();
})();

/* ============================================================
   16 · SCENE INDICATOR
   ============================================================ */
(function scene(){
  const sections = $$('[data-scene]');
  const label = $('#sceneLabel');
  const name  = $('#sceneName');
  if (!sections.length) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const scene = e.target.dataset.scene;
      const order = String(sections.indexOf(e.target) + 1).padStart(2,'0');
      if (name) name.textContent = scene;
      if (label) label.textContent = order;
    });
  }, { threshold: 0.5, rootMargin: '-30% 0px -30% 0px' });

  sections.forEach(s => obs.observe(s));
})();

/* ============================================================
   17 · NAV STATE
   ============================================================ */
(function nav(){
  const nav = $('#nav');
  const links = $$('[data-nav]');
  const sections = links
    .map(a => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  function onScroll(){
    nav.classList.toggle('scrolled', scrollY > 40);
    let current = '';
    for (const sec of sections){
      if (sec.offsetTop - innerHeight * 0.35 <= scrollY) current = '#' + sec.id;
    }
    links.forEach(a =>
      a.classList.toggle('active', a.getAttribute('href') === current)
    );
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ============================================================
   18 · WARP FLASH
   ============================================================ */
(function warp(){
  if (reduceMotion) {
    $$('[data-warp]').forEach(a => {
      a.addEventListener('click', e => {
        const href = a.getAttribute('href');
        if (!href || !href.startsWith('#')) return;
        e.preventDefault();
        const t = document.querySelector(href);
        if (t) t.scrollIntoView({ behavior: 'smooth' });
      });
    });
    return;
  }

  const flash = document.createElement('div');
  flash.style.cssText = `
    position:fixed;inset:0;z-index:850;pointer-events:none;
    background:radial-gradient(circle at var(--fx,50%) var(--fy,50%),
      rgba(255,255,255,.9), rgba(var(--accent-rgb),.6) 30%, transparent 65%);
    opacity:0;transition:opacity .28s cubic-bezier(.16,1,.3,1);
  `;
  document.body.appendChild(flash);

  let busy = false;

  function run(target, originEl){
    if (busy) return; busy = true;
    const r = originEl.getBoundingClientRect();
    flash.style.setProperty('--fx', ((r.left + r.width/2) / innerWidth * 100) + '%');
    flash.style.setProperty('--fy', ((r.top + r.height/2) / innerHeight * 100) + '%');
    flash.style.opacity = '1';

    setTimeout(() => {
      window.scrollTo({ top: target.offsetTop, behavior: 'auto' });
      flash.style.opacity = '0';
      setTimeout(() => { busy = false; }, 260);
    }, 220);
  }

  $$('[data-warp]').forEach(link => {
    link.addEventListener('click', e => {
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) run(target, link);
    });
  });
})();

/* ============================================================
   AI PROCESS FLOW
   ============================================================ */
(function solveFlow(){
  const shell = $('.solve-flow-shell');
  const steps = $$('.solve-step');
  if (!shell || !steps.length) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stepDuration = 750;
  let activeIndex = 0;
  let timer = 0;
  let hoveredStep = null;
  let pinnedStep = null;
  let inView = false;

  function activate(index){
    activeIndex = index;
    steps.forEach((step, stepIndex) => {
      const active = stepIndex === index;
      step.classList.toggle('active', active);
      step.setAttribute('aria-expanded', active ? 'true' : 'false');
    });
    shell.classList.toggle('feedback-visible', index === steps.length - 1);
  }

  function stop(){
    window.clearInterval(timer);
    timer = 0;
    shell.classList.remove('auto-running');
    shell.classList.add('is-paused');
  }

  function start(){
    stop();
    if (reducedMotion || !inView || hoveredStep || pinnedStep !== null) return;
    shell.style.setProperty('--solve-delay', `${-activeIndex * stepDuration}ms`);
    shell.classList.remove('is-paused');
    shell.classList.add('auto-running');
    timer = window.setInterval(() => activate((activeIndex + 1) % steps.length), stepDuration);
  }

  function setHovered(step){
    hoveredStep = step;
    if (step) {
      stop();
      activate(steps.indexOf(step));
    } else {
      if (pinnedStep) activate(steps.indexOf(pinnedStep));
      else start();
    }
  }

  steps.forEach((step, index) => {
    step.addEventListener('mouseenter', () => setHovered(step));
    step.addEventListener('mouseleave', () => {
      if (hoveredStep === step) setHovered(null);
    });
    step.addEventListener('focus', () => setHovered(step));
    step.addEventListener('blur', () => {
      if (hoveredStep === step) setHovered(null);
    });
    step.addEventListener('click', () => {
      if (pinnedStep === step) {
        pinnedStep = null;
        if (!hoveredStep) start();
      } else {
        pinnedStep = step;
        stop();
        activate(index);
      }
    });
  });

  document.addEventListener('click', event => {
    if (pinnedStep && !event.target.closest('.solve-step')) {
      pinnedStep = null;
      start();
    }
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting;
      if (inView) start();
      else stop();
    }, { threshold: 0.15 });
    observer.observe(shell);
  } else {
    inView = true;
    start();
  }

  if (reducedMotion) {
    activate(0);
    shell.classList.add('is-paused');
  } else {
    activate(0);
  }
})();

/* ============================================================
   19 · PORTAL
   ============================================================ */
(function portal(){
  const portalEl = $('#portal');
  const card = $('.portal-card');
  const content = $('#portalContent');
  const closeBtn = $('.portal-close');
  if (!portalEl) return;

  function open(el){
    const rect = el.getBoundingClientRect();
    const ox = ((rect.left + rect.width / 2) / innerWidth) * 100;
    const oy = ((rect.top + rect.height / 2) / innerHeight) * 100;
    card.style.transformOrigin = `${ox}% ${oy}%`;
    content.innerHTML = el.innerHTML;
    portalEl.classList.add('open');
    portalEl.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function close(){
    portalEl.classList.remove('open');
    portalEl.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    setTimeout(() => { content.innerHTML = ''; }, 400);
  }

  $$('[data-project]').forEach(el => {
    el.addEventListener('click', () => open(el));
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); open(el); }
    });
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'button');
  });

  closeBtn.addEventListener('click', close);
  portalEl.addEventListener('click', e => {
    if (e.target === portalEl) close();
  });
  addEventListener('keydown', e => {
    if (e.key === 'Escape' && portalEl.classList.contains('open')) close();
  });
})();

/* ============================================================
   20 · CONTACT FORM
   ============================================================ */
(function contactForm(){
  const form = $('#contactForm'), note = $('#formNote');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = $('#cName').value.trim();
    const email = $('#cEmail').value.trim();
    const msg = $('#cMsg').value.trim();

    if (!name || !email || !msg){
      note.textContent = 'Please fill in every field.';
      note.classList.remove('ok');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
      note.textContent = "That email doesn't look right.";
      note.classList.remove('ok');
      return;
    }
    const subject = encodeURIComponent(`Portfolio enquiry — ${name}`);
    const body = encodeURIComponent(`${msg}\n\n— ${name}\n${email}`);
    window.location.href = `mailto:saud20607@gmail.com?subject=${subject}&body=${body}`;

    note.textContent = 'Opening your mail client…';
    note.classList.add('ok');
    form.reset();
    setTimeout(() => {
      note.textContent = 'Opens your mail client — no data stored.';
      note.classList.remove('ok');
    }, 4800);
  });
})();

/* ============================================================
   21 · MISC
   ============================================================ */
$('#year').textContent = new Date().getFullYear();
