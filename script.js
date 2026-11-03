/* ==========================================================================
   Portafolio · Deiber Camilo Díaz
   Sin dependencias. Cada bloque es independiente y se desactiva solo
   cuando el dispositivo no lo necesita (sin cursor, movimiento reducido).
   ========================================================================== */

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
const hasObserver = 'IntersectionObserver' in window;

/* ---------- Año del pie de página ---------- */
const year = $('#current-year');
if (year) year.textContent = new Date().getFullYear();

/* ---------- Menú móvil ---------- */
const header = $('.site-header');
const menuButton = $('.menu-toggle');
const nav = $('.site-nav');
const menuQuery = window.matchMedia('(max-width: 820px)');

function setMenu(open) {
  menuButton?.classList.toggle('is-open', open);
  nav?.classList.toggle('is-open', open);
  document.body.classList.toggle('menu-open', open);
  menuButton?.setAttribute('aria-expanded', String(open));
  menuButton?.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
}

menuButton?.addEventListener('click', () => setMenu(!menuButton.classList.contains('is-open')));
$$('.site-nav a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setMenu(false); });
menuQuery.addEventListener('change', () => setMenu(false));

/* ---------- Scroll: progreso, estado del header ---------- */
const progress = $('.scroll-progress');
const ball = $('.scroll-progress__ball');
let scrollTicking = false;

function updateScroll() {
  scrollTicking = false;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
  const width = window.innerWidth;

  progress?.style.setProperty('--progress', ratio.toFixed(4));
  ball?.style.setProperty('--ball-x', `${(5 + ratio * (width - 10)).toFixed(1)}px`);
  ball?.style.setProperty('--ball-r', `${(ratio * 1800).toFixed(0)}deg`);
  progress?.classList.toggle('is-moving', ratio > 0.002);
  header?.classList.toggle('is-scrolled', window.scrollY > 8);
}

function requestScrollUpdate() {
  if (scrollTicking) return;
  scrollTicking = true;
  requestAnimationFrame(updateScroll);
}

window.addEventListener('scroll', requestScrollUpdate, { passive: true });
window.addEventListener('resize', requestScrollUpdate, { passive: true });
updateScroll();

/* ---------- Enlace activo según la sección visible ---------- */
if (hasObserver) {
  const links = new Map();
  $$('.site-nav a[href^="#"]').forEach((link) => links.set(link.getAttribute('href').slice(1), link));

  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((link) => link.removeAttribute('aria-current'));
      links.get(entry.target.id)?.setAttribute('aria-current', 'true');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });

  links.forEach((_, id) => { const section = document.getElementById(id); if (section) spy.observe(section); });

  // Al volver al inicio no debe quedar nada marcado
  const hero = $('#inicio');
  if (hero) new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) links.forEach((link) => link.removeAttribute('aria-current'));
  }, { rootMargin: '-45% 0px -50% 0px' }).observe(hero);
}

/* ---------- Aparición de secciones ---------- */
const revealElements = $$('.reveal');

// Retraso escalonado solo dentro de grillas y listas cortas
$$('[data-stagger]').forEach((group) => {
  $$('.reveal', group).forEach((el, index) => el.style.setProperty('--d', `${Math.min(index, 4) * 90}ms`));
});

if (hasObserver && !reducedMotion.matches) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add('is-visible'));
}

/* ---------- Pausar animaciones infinitas fuera de pantalla ---------- */
if (hasObserver) {
  const pauseObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => entry.target.classList.toggle('is-offscreen', !entry.isIntersecting));
  });
  $$('.hero, .ticker, .contact-section').forEach((el) => pauseObserver.observe(el));
}

/* ---------- Marcador con cuenta animada ---------- */
(function initCounters() {
  const counters = $$('[data-count]');
  if (!counters.length || !hasObserver || reducedMotion.matches) return; // el HTML ya trae el valor final

  const format = (el, value) => String(value).padStart(Number(el.dataset.pad) || 0, '0');
  counters.forEach((el) => { el.textContent = format(el, Number(el.dataset.from) || 0); });

  const run = (el) => {
    const from = Number(el.dataset.from) || 0;
    const to = Number(el.dataset.count);
    const duration = 1400;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 4);
      el.textContent = format(el, Math.round(from + (to - from) * eased));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      setTimeout(() => run(entry.target), 900); // espera a que termine la entrada del hero
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.6 });
  counters.forEach((el) => observer.observe(el));
})();

/* ---------- Efectos con cursor (solo escritorio con mouse) ---------- */
(function initPointerEffects() {
  if (!finePointer.matches || reducedMotion.matches) return;

  /* Luz suave que sigue al cursor */
  const glow = $('.cursor-glow');
  if (glow) {
    let targetX = 0, targetY = 0, x = 0, y = 0, running = false;

    const loop = () => {
      x += (targetX - x) * 0.14;
      y += (targetY - y) * 0.14;
      glow.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      if (Math.abs(targetX - x) > 0.4 || Math.abs(targetY - y) > 0.4) requestAnimationFrame(loop);
      else running = false;
    };

    window.addEventListener('pointermove', (event) => {
      if (event.pointerType !== 'mouse') return;
      targetX = event.clientX;
      targetY = event.clientY;
      if (!glow.classList.contains('is-active')) { x = targetX; y = targetY; glow.classList.add('is-active'); }
      if (!running) { running = true; requestAnimationFrame(loop); }
    }, { passive: true });

    document.documentElement.addEventListener('mouseleave', () => glow.classList.remove('is-active'));
  }

  /* Inclinación 3D sutil y resplandor interno: data-tilt="grados" / data-spotlight */
  $$('[data-tilt], [data-spotlight]').forEach((el) => {
    const max = parseFloat(el.dataset.tilt) || 0;
    let frame = 0;

    el.addEventListener('pointermove', (event) => {
      if (event.pointerType !== 'mouse') return;
      const rect = el.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
        el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
        if (max) {
          el.style.setProperty('--ry', `${((px - 0.5) * 2 * max).toFixed(2)}deg`);
          el.style.setProperty('--rx', `${((0.5 - py) * 2 * max).toFixed(2)}deg`);
        }
      });
    });

    el.addEventListener('pointerleave', () => {
      cancelAnimationFrame(frame);
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    });
  });

  /* Paralaje leve de los elementos decorativos del hero */
  const art = $('[data-parallax]');
  const hero = $('.hero');
  if (art && hero) {
    let frame = 0;
    hero.addEventListener('pointermove', (event) => {
      if (event.pointerType !== 'mouse') return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = art.getBoundingClientRect();
        const dx = (event.clientX - (rect.left + rect.width / 2)) / window.innerWidth;
        const dy = (event.clientY - (rect.top + rect.height / 2)) / window.innerHeight;
        art.style.setProperty('--px', (dx * 2).toFixed(3));
        art.style.setProperty('--py', (dy * 2).toFixed(3));
      });
    });
    hero.addEventListener('pointerleave', () => {
      art.style.setProperty('--px', 0);
      art.style.setProperty('--py', 0);
    });
  }
})();

/* ---------- Táctil: la tarjeta centrada en pantalla toma el efecto "hover" ---------- */
if (hasObserver && window.matchMedia('(hover: none)').matches) {
  const centerObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => entry.target.classList.toggle('is-inview', entry.isIntersecting));
  }, { rootMargin: '-35% 0px -35% 0px' });
  $$('.project-card').forEach((card) => centerObserver.observe(card));
}
