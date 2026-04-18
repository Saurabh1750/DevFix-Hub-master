// Blog Search & Filter - Standalone
window.initBlogSearch = function(posts) {
  if (typeof BlogSearch !== 'undefined') {
    new BlogSearch(posts);
  }
};

class BlogSearch {
  constructor(posts) {
    this.posts = posts || [];
    this.init();
  }

  init() {
    this.searchInput = document.getElementById('search-input');
    this.filterBtns = document.querySelectorAll('.filter-btn');
    this.postsContainer = document.getElementById('blog-posts');
    
    if (!this.postsContainer) {
      console.log('Blog container not found - not on blog page');
      return;
    }
    
    // Setup search
    if (this.searchInput) {
      this.searchInput.addEventListener('input', debounce(this.handleSearch.bind(this), 300));
    }
    
    // Setup filters
    this.filterBtns.forEach(btn => {
      btn.addEventListener('click', () => this.handleFilter(btn));
    });

    // Load initial state from URL
    this.loadFromURL();
    const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
    const query = this.searchInput ? this.searchInput.value.toLowerCase() : '';
    this.renderPosts(this.filterPosts(activeFilter, query));
  }

  handleSearch(e) {
    const query = e.target.value.toLowerCase();
    const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
    const filtered = this.filterPosts(activeFilter, query);
    this.renderPosts(filtered);
    this.updateURL(activeFilter, query);
  }

  handleFilter(btn) {
    this.filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;
    const query = this.searchInput ? this.searchInput.value.toLowerCase() : '';
    const filtered = this.filterPosts(filter, query);
    this.renderPosts(filtered);
    this.updateURL(filter, query);
  }

  filterPosts(category, query) {
    return this.posts.filter(post => {
      const matchesCategory = category === 'all' || post.category === category;
      const matchesQuery = !query || 
        post.title.toLowerCase().includes(query) || 
        post.excerpt.toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
  }

  renderPosts(posts = this.posts) {
    this.postsContainer.innerHTML = posts.map((post, index) => `
      <article class="post-card" data-stagger="${index}">
        <h3>${post.title}</h3>
        <p class="excerpt">${post.excerpt}</p>
        <div class="meta">
          <span class="category-tag">${post.category.toUpperCase()}</span>
          <span>${post.date ? new Date(post.date).toLocaleDateString() : 'Unknown Date'}</span>
        </div>
        <a href="post.html?id=${post.id}" class="cta-button">Read Full Solution</a>
      </article>
    `).join('');
  }

  loadFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category') || 'all';
    const query = urlParams.get('q') || '';

    // Set active filter button
    const activeBtn = document.querySelector(`[data-filter="${category}"]`);
    if (activeBtn) {
      this.filterBtns.forEach(b => b.classList.remove('active'));
      activeBtn.classList.add('active');
    }

    // Set search value
    if (this.searchInput) {
      this.searchInput.value = query;
    }
  }

  updateURL(category, query) {
    const params = new URLSearchParams();
    if (category !== 'all') params.set('category', category);
    if (query) params.set('q', query);
    const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
    window.history.replaceState({}, '', newUrl);
  }
}

// Debounce utility
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
