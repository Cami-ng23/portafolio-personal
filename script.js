const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.site-nav');
const navLinks = document.querySelectorAll('.site-nav a');
const year = document.querySelector('#current-year');

if (year) year.textContent = new Date().getFullYear();

menuButton?.addEventListener('click', () => {
  const isOpen = menuButton.classList.toggle('is-open');
  nav.classList.toggle('is-open', isOpen);
  document.body.classList.toggle('menu-open', isOpen);
  menuButton.setAttribute('aria-expanded', String(isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
});

navLinks.forEach((link) => {
  link.addEventListener('click', () => {
    menuButton?.classList.remove('is-open');
    nav?.classList.remove('is-open');
    document.body.classList.remove('menu-open');
    menuButton?.setAttribute('aria-expanded', 'false');
    menuButton?.setAttribute('aria-label', 'Abrir menú');
  });
});

const revealElements = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    observer.unobserve(entry.target);
  });
}, { threshold: 0.12 });

revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add('is-visible'));
}