// Core App Functionality
const DevFixPosts = {
  storageKey: 'devfixhub_custom_posts',

  async getBasePosts() {
    try {
      const response = await fetch('data/posts.json');
      return await response.json();
    } catch (error) {
      console.error('Failed to load posts:', error);
      return [];
    }
  },

  getCustomPosts() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Failed to read custom posts:', error);
      return [];
    }
  },

  saveCustomPosts(posts) {
    localStorage.setItem(this.storageKey, JSON.stringify(posts));
  },

  savePost(post) {
    const customPosts = this.getCustomPosts();
    customPosts.unshift(post);
    this.saveCustomPosts(customPosts);
  },

  async getAllPosts() {
    const [basePosts, customPosts] = await Promise.all([
      this.getBasePosts(),
      Promise.resolve(this.getCustomPosts())
    ]);

    return [...customPosts, ...basePosts].sort((a, b) => new Date(b.date) - new Date(a.date));
  }
};

window.DevFixPosts = DevFixPosts;

class DevFixHub {
  constructor() {
    this.posts = [];
    this.init();
  }

  async init() {
    this.setupThemeToggle();
    this.setupNavbar();
    this.setActiveNavLink();
    this.handleNavbarScroll();
    await this.loadPosts();
    this.loadFeaturedPosts();
    this.setupCategories();
    this.initScrollAnimations();
    this.loadAnalytics();

    // Init blog search on blog page (after posts loaded)
    if (window.location.pathname.includes('blog.html') && window.initBlogSearch) {
      window.initBlogSearch(this.posts);
    }
  }

  async loadPosts() {
    this.posts = await DevFixPosts.getAllPosts();
  }

  setupNavbar() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
      hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
      });

      // Close mobile menu on link click
      document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', () => {
          hamburger.classList.remove('active');
          navMenu.classList.remove('active');
        });
      });
    }
  }

  setActiveNavLink() {
    const rawPage = window.location.pathname.split('/').pop() || 'index.html';
    const currentPage = ['post.html', 'create-post.html'].includes(rawPage) ? 'blog.html' : rawPage;
    document.querySelectorAll('.nav-menu a').forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentPage) {
        link.classList.add('active');
      }
    });
  }

  handleNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    const toggleScrolled = () => {
      navbar.classList.toggle('scrolled', window.scrollY > 18);
    };

    toggleScrolled();
    window.addEventListener('scroll', toggleScrolled, { passive: true });
  }

  setupThemeToggle() {
    const themeToggles = document.querySelectorAll('.theme-toggle');
    const root = document.documentElement;
    
    // Check for saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      root.setAttribute('data-theme', savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      root.setAttribute('data-theme', 'light');
    }

    themeToggles.forEach(toggle => {
      toggle.addEventListener('click', () => {
        const currentTheme = root.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        root.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
      });
    });
  }

  loadFeaturedPosts() {
    const container = document.getElementById('featured-posts');
    if (!container || !this.posts) return;

    const featured = this.posts.slice(0, 3);
    container.innerHTML = featured.map((post, index) => `
      <article class="post-card" data-stagger="${index}">
        <h3>${post.title}</h3>
        <p class="excerpt">${post.excerpt}</p>
        <div class="meta">
          <span class="category-tag">${post.category.toUpperCase()}</span>
          <span>${post.date ? new Date(post.date).toLocaleDateString() : 'Unknown Date'}</span>
        </div>
        <a href="post.html?id=${post.id}" class="cta-button">Read Solution</a>
      </article>
    `).join('');
  }

  setupCategories() {
    document.querySelectorAll('.category-card').forEach(card => {
      card.addEventListener('click', (e) => {
        e.preventDefault();
        const category = card.dataset.category;
        window.location.href = `blog.html?category=${category}`;
      });
    });
  }

  initScrollAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px"
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    document.querySelectorAll('.hero h1, .hero p, .hero-actions, .section-title, .section-copy, .category-large-card, .post-card, .tool-card, .content-card').forEach(el => {
      el.classList.add('fade-in');
      observer.observe(el);
    });
  }

  loadAnalytics() {
    // Analytics loaded in head
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new DevFixHub();
});
