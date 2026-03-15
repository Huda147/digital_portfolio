/**
 * ALEX CHEN — PORTFOLIO SCRIPT
 * Handles: dark/light mode, mobile nav, scroll animations,
 *          project card rendering from projects.json.
 */

'use strict';

/* ─────────────────────────────────────────────────────────────────
   1. THEME TOGGLE
───────────────────────────────────────────────────────────────── */
(function initTheme() {
  const root        = document.documentElement;
  const toggleBtn   = document.getElementById('themeToggle');
  const STORAGE_KEY = 'portfolio-theme';

  // Honour saved preference or OS preference
  const saved   = localStorage.getItem(STORAGE_KEY);
  const prefers = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const initial = saved || prefers;
  root.setAttribute('data-theme', initial);

  toggleBtn.addEventListener('click', () => {
    const current = root.getAttribute('data-theme');
    const next    = current === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem(STORAGE_KEY, next);
  });
})();


/* ─────────────────────────────────────────────────────────────────
   2. STICKY NAV — add shadow when scrolled
───────────────────────────────────────────────────────────────── */
(function initStickyNav() {
  const nav = document.getElementById('nav');

  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load
})();


/* ─────────────────────────────────────────────────────────────────
   3. MOBILE NAVIGATION DRAWER
───────────────────────────────────────────────────────────────── */
(function initMobileNav() {
  const burger = document.getElementById('navBurger');
  const drawer = document.getElementById('navDrawer');
  const links  = drawer.querySelectorAll('.nav__link');

  function toggleDrawer(forceClose = false) {
    const isOpen = burger.classList.contains('open') && !forceClose;
    burger.classList.toggle('open',   !isOpen);
    drawer.style.display = isOpen ? 'none' : 'block';
    burger.setAttribute('aria-expanded', String(!isOpen));
    drawer.setAttribute('aria-hidden',   String(isOpen));
  }

  burger.addEventListener('click', () => toggleDrawer());

  // Close drawer when a link is tapped
  links.forEach(link => link.addEventListener('click', () => toggleDrawer(true)));
})();


/* ─────────────────────────────────────────────────────────────────
   4. SMOOTH SCROLL — intercept anchor clicks
───────────────────────────────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (!target) return;
    e.preventDefault();

    const navHeight = document.getElementById('nav').offsetHeight;
    const top       = target.getBoundingClientRect().top + window.scrollY - navHeight - 16;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});


/* ─────────────────────────────────────────────────────────────────
   5. SCROLL REVEAL (IntersectionObserver)
───────────────────────────────────────────────────────────────── */
(function initReveal() {
  const items = document.querySelectorAll('.reveal');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // animate once
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  items.forEach(el => observer.observe(el));
})();


/* ─────────────────────────────────────────────────────────────────
   6. PROJECT CARDS — load from projects.json
───────────────────────────────────────────────────────────────── */
(async function initProjects() {
  const grid    = document.getElementById('projectsGrid');
  const loading = document.getElementById('projectsLoading');

  try {
    const res      = await fetch('./projects.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const projects = await res.json();

    // Remove loading indicator
    loading.remove();

    // Render each card
    projects.forEach((project, index) => {
      const card = buildProjectCard(project, index);
      grid.appendChild(card);
    });

    // Observe cards for scroll-reveal (with staggered delay)
    const cards = grid.querySelectorAll('.project-card');
    const cardObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          cardObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

    cards.forEach(card => cardObserver.observe(card));

  } catch (err) {
    // Graceful fallback if JSON fails to load
    loading.innerHTML = `
      <span style="color: var(--text-3); font-size: 0.875rem;">
        Could not load projects. 
        <a href="https://github.com/username" class="text-link" target="_blank" rel="noopener">
          View on GitHub →
        </a>
      </span>
    `;
    console.warn('projects.json load error:', err);
  }
})();

/**
 * Build a single project card DOM element.
 * @param {Object} project
 * @param {number} index
 * @returns {HTMLElement}
 */
function buildProjectCard(project, index) {
  const card = document.createElement('article');
  card.className = 'project-card' + (project.featured ? ' project-card--featured' : '');
  // Stagger reveal delay
  card.style.transitionDelay = `${index * 0.07}s`;

  // Tech tags HTML
  const techHTML = (project.technologies || [])
    .map(t => `<span class="tech-tag">${escHtml(t)}</span>`)
    .join('');

  // Action links
  const githubLink = project.github
    ? `<a href="${escHtml(project.github)}" class="project-card__link" target="_blank" rel="noopener" aria-label="View ${escHtml(project.title)} on GitHub">
         <i class="ph ph-github-logo"></i> GitHub
       </a>`
    : '';

  const demoLink = project.demo
    ? `<a href="${escHtml(project.demo)}" class="project-card__link" target="_blank" rel="noopener" aria-label="Live demo of ${escHtml(project.title)}">
         <i class="ph ph-arrow-square-out"></i> Demo
       </a>`
    : '';

  const featuredDot = project.featured
    ? `<div class="project-card__featured-dot" title="Featured project" aria-label="Featured"></div>`
    : '';

  card.innerHTML = `
    <div class="project-card__header">
      <h3 class="project-card__title">${escHtml(project.title)}</h3>
      ${featuredDot}
    </div>
    <p class="project-card__desc">${escHtml(project.description)}</p>
    <div class="project-card__tech">${techHTML}</div>
    <div class="project-card__links">${githubLink}${demoLink}</div>
  `;

  return card;
}

/**
 * Escape HTML special characters to prevent XSS.
 */
function escHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}


/* ─────────────────────────────────────────────────────────────────
   7. VIDEO INTRO PLAYER
   Clicking the thumbnail swaps it for an embedded iframe
   Supports YouTube and Vimeo
───────────────────────────────────────────────────────────────── */
(function initVideoPlayer() {
  const thumb   = document.getElementById('videoThumb');
  const embed   = document.getElementById('videoEmbed');
  if (!thumb || !embed) return;

  thumb.addEventListener('click', playVideo);
  // Allow keyboard activation
  thumb.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); playVideo(); }
  });

  function playVideo() {
    const videoId   = thumb.dataset.videoId;
    const platform  = thumb.dataset.videoPlatform || 'youtube';

    if (!videoId) {
      console.warn('Set data-video-id on #videoThumb to enable the player.');
      return;
    }

    let src = '';
    if (platform === 'youtube') {
      src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
    } else if (platform === 'vimeo') {
      src = `https://player.vimeo.com/video/${videoId}?autoplay=1&title=0&byline=0&portrait=0`;
    }

    const iframe = document.createElement('iframe');
    iframe.src             = src;
    iframe.allow           = 'autoplay; fullscreen; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.title           = 'Intro video';

    embed.innerHTML = '';
    embed.appendChild(iframe);

    // Show embed, hide thumbnail
    embed.classList.add('active');
    embed.setAttribute('aria-hidden', 'false');
    thumb.style.display = 'none';
  }
})();


/* ─────────────────────────────────────────────────────────────────
   8. FOOTER YEAR — auto-update copyright year
───────────────────────────────────────────────────────────────── */
(function initFooterYear() {
  const el = document.getElementById('footerYear');
  if (el) el.textContent = new Date().getFullYear();
})();


/* ─────────────────────────────────────────────────────────────────
   9. HERO REVEAL — stagger on page load
───────────────────────────────────────────────────────────────── */
(function initHeroReveal() {
  // The hero .reveal elements animate via CSS opacity/transform.
  // We simply mark them visible after a brief RAF to allow paint first.
  const heroReveals = document.querySelectorAll('.hero .reveal');
  requestAnimationFrame(() => {
    setTimeout(() => {
      heroReveals.forEach((el, i) => {
        setTimeout(() => el.classList.add('visible'), i * 120);
      });
    }, 80);
  });
})();
