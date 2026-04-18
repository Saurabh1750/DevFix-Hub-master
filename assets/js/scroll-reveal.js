// Subtle Scroll Reveal Animations
class ScrollReveal {
  constructor() {
    this.observer = null;
    this.init();
  }

  init() {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(this.reveal.bind(this), {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      });
      
      document.querySelectorAll('.post-card, .category-card, .tool-card, section').forEach(el => {
        el.classList.add('reveal-item');
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        this.observer.observe(el);
      });
    }
  }

  reveal(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.transition = 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        this.observer.unobserve(entry.target);
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new ScrollReveal();
});

