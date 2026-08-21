import './style.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/* ------------------------------------------------------------------ */
/* In-page anchor scrolling (JS-driven, not CSS scroll-behavior:        */
/* smooth — that fights GSAP ScrollTrigger's scroll-position tracking) */
/* ------------------------------------------------------------------ */
function initAnchorScroll(): void {
  const header = document.getElementById('site-header');

  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const id = link.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;

      event.preventDefault();
      const headerOffset = (header?.offsetHeight ?? 0) + 16;
      const top = target.getBoundingClientRect().top + window.scrollY - headerOffset;

      window.scrollTo({
        top,
        behavior: prefersReducedMotion.matches ? 'auto' : 'smooth',
      });
    });
  });
}

/* ------------------------------------------------------------------ */
/* Mobile full-screen menu                                             */
/* ------------------------------------------------------------------ */
function initMobileMenu(): void {
  const toggle = document.getElementById('menu-toggle');
  const menu = document.getElementById('mobile-menu');
  const iconMenu = document.getElementById('icon-menu');
  const iconClose = document.getElementById('icon-close');
  if (!toggle || !menu || !iconMenu || !iconClose) return;

  const closeMenu = () => {
    menu.classList.add('hidden');
    menu.classList.remove('flex');
    menu.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menú de navegación');
    iconMenu.classList.remove('hidden');
    iconClose.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  };

  const openMenu = () => {
    menu.classList.remove('hidden');
    menu.classList.add('flex');
    menu.setAttribute('aria-hidden', 'false');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Cerrar menú de navegación');
    iconMenu.classList.add('hidden');
    iconClose.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  };

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    isOpen ? closeMenu() : openMenu();
  });

  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });
}

/* ------------------------------------------------------------------ */
/* Header: solid-on-scroll + hide-on-scroll-down / show-on-scroll-up    */
/* ------------------------------------------------------------------ */
function initHeaderScroll(): void {
  const header = document.getElementById('site-header');
  if (!header) return;

  let lastY = window.scrollY;
  const hideThreshold = 120;

  const onScroll = () => {
    const y = window.scrollY;

    header.classList.toggle('is-scrolled', y > 40);

    if (y > hideThreshold && y > lastY) {
      header.classList.add('is-hidden');
    } else {
      header.classList.remove('is-hidden');
    }

    lastY = y;
  };

  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* ------------------------------------------------------------------ */
/* Scroll reveal (fade + translateY, ease-out-expo)                     */
/* ------------------------------------------------------------------ */
function initReveal(): void {
  const items = gsap.utils.toArray<HTMLElement>('.reveal');

  items.forEach((el, index) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: 'expo.out',
      delay: (index % 3) * 0.04,
      scrollTrigger: {
        trigger: el,
        start: 'top 88%',
        toggleActions: 'play none none reverse',
      },
    });
  });
}

/* ------------------------------------------------------------------ */
/* Treatments grid stagger                                             */
/* ------------------------------------------------------------------ */
function initTreatmentsStagger(): void {
  const grid = document.getElementById('treatments-grid');
  if (!grid) return;
  const cards = grid.querySelectorAll('.treatment-card');
  if (!cards.length) return;

  gsap.set(cards, { opacity: 0, y: 32 });

  gsap.to(cards, {
    opacity: 1,
    y: 0,
    duration: 0.7,
    ease: 'expo.out',
    stagger: { each: 0.08, grid: 'auto', from: 'start' },
    scrollTrigger: {
      trigger: grid,
      start: 'top 85%',
      toggleActions: 'play none none reverse',
    },
  });
}

/* ------------------------------------------------------------------ */
/* Subtle parallax (hero + one key section)                            */
/* ------------------------------------------------------------------ */
function initParallax(): void {
  const layers = gsap.utils.toArray<HTMLElement>('.parallax-layer');

  layers.forEach((layer) => {
    const section = layer.closest('section');
    if (!section) return;

    gsap.to(layer, {
      yPercent: 15,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 0.6,
      },
    });
  });
}

/* ------------------------------------------------------------------ */
/* Animated count-up for social-proof figures                          */
/* ------------------------------------------------------------------ */
function initCounters(): void {
  const counters = document.querySelectorAll<HTMLElement>('[data-counter]');

  counters.forEach((el) => {
    const target = Number(el.dataset.target ?? '0');
    const prefix = el.dataset.prefix ?? '';
    const suffix = el.dataset.suffix ?? '';
    const proxy = { value: 0 };

    ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      once: true,
      onEnter: () => {
        if (prefersReducedMotion.matches) {
          el.textContent = `${prefix}${target.toLocaleString('es-MX')}${suffix}`;
          return;
        }

        gsap.to(proxy, {
          value: target,
          duration: 1.8,
          ease: 'power2.out',
          onUpdate: () => {
            el.textContent = `${prefix}${Math.round(proxy.value).toLocaleString('es-MX')}${suffix}`;
          },
        });
      },
    });
  });
}

/* ------------------------------------------------------------------ */
/* "Cómo trabajamos" scroll-pinned storytelling (desktop only)         */
/* ------------------------------------------------------------------ */
function initProcessPin(): void {
  const track = document.getElementById('process-pin-track');
  const stage = document.getElementById('process-pin-stage');
  const dots = gsap.utils.toArray<HTMLElement>('.process-dot');
  const panels = gsap.utils.toArray<HTMLElement>('.process-panel');
  if (!track || !stage || !panels.length) return;

  const setActive = (index: number) => {
    panels.forEach((panel, i) => panel.classList.toggle('is-active', i === index));
    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
  };

  setActive(0);

  const mm = gsap.matchMedia();

  mm.add('(min-width: 1024px)', () => {
    const steps = panels.length;
    const trigger = ScrollTrigger.create({
      trigger: track,
      start: 'top top',
      end: 'bottom bottom',
      pin: stage,
      scrub: 0.5,
      onUpdate: (self) => {
        const index = Math.min(steps - 1, Math.floor(self.progress * steps));
        setActive(index);
      },
    });

    return () => trigger.kill();
  });
}

/* ------------------------------------------------------------------ */
/* Bootstrap                                                            */
/* ------------------------------------------------------------------ */
function init(): void {
  initAnchorScroll();
  initMobileMenu();
  initHeaderScroll();
  initCounters();

  if (prefersReducedMotion.matches) {
    document.querySelectorAll('.reveal').forEach((el) => {
      (el as HTMLElement).style.opacity = '1';
      (el as HTMLElement).style.transform = 'none';
    });
    return;
  }

  initReveal();
  initTreatmentsStagger();
  initParallax();
  initProcessPin();

  window.addEventListener('load', () => ScrollTrigger.refresh());
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
