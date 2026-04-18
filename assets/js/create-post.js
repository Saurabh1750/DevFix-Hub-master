class CreatePostPage {
  constructor() {
    this.form = document.getElementById('create-post-form');
    this.status = document.getElementById('create-post-status');
    this.preview = document.getElementById('post-preview');
    this.previewTitle = document.getElementById('preview-title');
    this.previewMeta = document.getElementById('preview-meta');
    this.init();
  }

  init() {
    if (!this.form) return;

    this.form.addEventListener('submit', this.handleSubmit.bind(this));
    this.form.addEventListener('input', this.renderPreview.bind(this));
    this.renderPreview();
  }

  escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  formatParagraphs(value) {
    return (value || '')
      .split(/\n{2,}/)
      .map(paragraph => paragraph.trim())
      .filter(Boolean)
      .map(paragraph => `<p>${this.escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
      .join('\n');
  }

  formatList(value) {
    const items = (value || '')
      .split('\n')
      .map(item => item.trim())
      .filter(Boolean);

    if (!items.length) return '';
    return `<ul>\n${items.map(item => `  <li>${this.escapeHtml(item)}</li>`).join('\n')}\n</ul>`;
  }

  buildContent(data) {
    const codeBlock = data.code
      ? `<pre><code>${this.escapeHtml(data.code)}</code></pre>`
      : '';

    const bonusTips = this.formatList(data.bonusTips);
    const resultList = this.formatList(data.result);

    return `<article>
  <h1>${this.escapeHtml(data.title)}</h1>
  ${this.formatParagraphs(data.intro)}

  <h2>The Problem</h2>
  ${this.formatParagraphs(data.problem)}

  <h2>The Cause</h2>
  ${this.formatParagraphs(data.cause)}

  <h2>The Solution</h2>
  ${this.formatParagraphs(data.solution)}
  ${codeBlock}

  <h2>Result</h2>
  ${resultList || this.formatParagraphs(data.result)}

  <h2>Bonus Tips</h2>
  ${bonusTips || '<p>Add a few practical implementation tips here.</p>'}

  <h2>Conclusion</h2>
  ${this.formatParagraphs(data.conclusion)}
</article>`;
  }

  getFormData() {
    const formData = new FormData(this.form);
    return {
      title: formData.get('title').trim(),
      category: formData.get('category').trim(),
      excerpt: formData.get('excerpt').trim(),
      intro: formData.get('intro').trim(),
      problem: formData.get('problem').trim(),
      cause: formData.get('cause').trim(),
      solution: formData.get('solution').trim(),
      code: formData.get('code').trim(),
      result: formData.get('result').trim(),
      bonusTips: formData.get('bonusTips').trim(),
      conclusion: formData.get('conclusion').trim()
    };
  }

  validate(data) {
    return data.title && data.category && data.excerpt && data.intro && data.problem && data.cause && data.solution && data.conclusion;
  }

  renderPreview() {
    if (!this.preview) return;

    const data = this.getFormData();
    this.previewTitle.textContent = data.title || 'Live preview';
    this.previewMeta.textContent = data.category
      ? `${data.category.toUpperCase()} - ${new Date().toLocaleDateString()}`
      : 'Choose a category and start writing';

    this.preview.innerHTML = this.buildContent({
      ...data,
      title: data.title || 'Live preview',
      intro: data.intro || 'Your introduction will appear here.',
      problem: data.problem || 'Describe the user-facing issue clearly.',
      cause: data.cause || 'Explain what is actually causing the issue.',
      solution: data.solution || 'Walk through the fix step by step.',
      result: data.result || 'List the outcome of the fix.',
      conclusion: data.conclusion || 'Wrap up the post with the final takeaway.'
    });
  }

  handleSubmit(event) {
    event.preventDefault();
    const data = this.getFormData();

    if (!this.validate(data)) {
      this.status.textContent = 'Please fill in all required fields before publishing.';
      return;
    }

    const post = {
      id: `custom-${Date.now()}`,
      title: data.title,
      category: data.category,
      excerpt: data.excerpt,
      content: this.buildContent(data),
      date: new Date().toISOString().slice(0, 10),
      isCustom: true
    };

    window.DevFixPosts.savePost(post);
    this.status.innerHTML = `Post published. <a href="post.html?id=${post.id}">Open your new post</a>`;
    this.form.reset();
    this.renderPreview();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new CreatePostPage();
});
