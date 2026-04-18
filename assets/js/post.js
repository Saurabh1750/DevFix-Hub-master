class PostLoader {
  constructor() {
    this.posts = [];
    this.init();
  }

  async init() {
    await this.loadPosts();
    const postId = new URLSearchParams(window.location.search).get('id');
    if (postId) {
      this.loadPost(postId);
    } else {
      document.getElementById('post-content').innerHTML = '<div class="post-hero"><h1>Post Not Found</h1><p class="post-lead">Choose an article from the blog to start reading.</p></div>';
      document.getElementById('related-posts').innerHTML = '<li class="post-note">Open a post to see related articles.</li>';
    }
  }

  async loadPosts() {
    this.posts = await window.DevFixPosts.getAllPosts();
  }

  loadPost(id) {
    const post = this.posts.find(item => item.id == id);
    if (!post) {
      document.getElementById('post-content').innerHTML = '<div class="post-hero"><h1>Post Not Found</h1><p class="post-lead">The requested solution could not be found.</p></div>';
      document.getElementById('related-posts').innerHTML = '<li class="post-note">No related posts available.</li>';
      document.title = 'Post Not Found - DevFix Hub';
      return;
    }

    document.title = `${post.title} - DevFix Hub`;
    document.querySelector('meta[name="description"]').setAttribute('content', post.excerpt);
    const content = this.formatContent(post.content);
    const formattedDate = new Date(post.date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    document.getElementById('post-content').innerHTML = `
      <header class="post-hero">
        <div class="post-eyebrow">
          <span class="category-tag">${post.category.toUpperCase()}</span>
        </div>
        <h1>${post.title}</h1>
        <div class="meta">
          <span>${formattedDate}</span>
          <span class="meta-separator" aria-hidden="true"></span>
          <span>Practical fix guide</span>
        </div>
        <p class="post-lead">${post.excerpt}</p>
      </header>
      ${content}
      <div class="post-footer">
        <a href="blog.html" class="cta-button">&larr; Back to Blog</a>
      </div>
    `;

    this.loadRelatedPosts(post);
  }

  formatContent(rawContent) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = rawContent
      .replace(/<pre><code>/g, '<pre><code class="language-javascript">')
      .replace(/\\n/g, '\n');

    const article = wrapper.querySelector('article');
    const root = article || wrapper;
    const firstTitle = root.querySelector('h1');
    if (firstTitle) {
      firstTitle.remove();
    }

    const sectionKeywords = ['problem', 'cause', 'solution', 'result', 'bonus tips', 'conclusion'];
    Array.from(root.querySelectorAll('h2')).forEach(heading => {
      const section = document.createElement('section');
      const normalizedText = heading.textContent.trim().toLowerCase();
      const keyword = sectionKeywords.find(item => normalizedText.includes(item));
      section.className = `article-section${keyword ? ` article-section-${keyword.replace(/\s+/g, '-')}` : ''}`;
      heading.parentNode.insertBefore(section, heading);
      section.appendChild(heading);

      let sibling = section.nextSibling;
      while (sibling && !(sibling.nodeType === Node.ELEMENT_NODE && sibling.tagName === 'H2')) {
        const nextSibling = sibling.nextSibling;
        section.appendChild(sibling);
        sibling = nextSibling;
      }
    });

    return root.innerHTML;
  }

  loadRelatedPosts(currentPost) {
    const relatedPosts = this.posts
      .filter(post => post.id !== currentPost.id)
      .sort((a, b) => {
        const sameCategoryScore = Number(b.category === currentPost.category) - Number(a.category === currentPost.category);
        if (sameCategoryScore !== 0) return sameCategoryScore;
        return new Date(b.date) - new Date(a.date);
      })
      .slice(0, 3);

    const relatedMarkup = relatedPosts.length
      ? relatedPosts.map(post => `
          <li>
            <a href="post.html?id=${post.id}">${post.title}</a>
            <span>${post.category.toUpperCase()}</span>
          </li>
        `).join('')
      : '<li class="post-note">No related posts yet.</li>';

    document.getElementById('related-posts').innerHTML = relatedMarkup;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new PostLoader();
});
