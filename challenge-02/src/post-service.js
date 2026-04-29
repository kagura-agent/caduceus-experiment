// Post Service - handles blog post CRUD

function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (!local || local.length > 64) return false;
  if (!domain || !domain.includes('.')) return false;
  if (domain.startsWith('.') || domain.endsWith('.')) return false;
  return true;
}

function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[<>&"']/g, (ch) => {
    const map = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' };
    return map[ch];
  });
}

function formatTimestamp(date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}:${s}`;
}

function generateSlug(title) {
  return sanitizeString(title)
    .toLowerCase()
    .replace(/&[a-z]+;/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

class PostService {
  constructor(userService) {
    this.userService = userService;
    this.posts = new Map();
    this.nextId = 1;
  }

  create(data) {
    if (!data || !data.title || !data.authorId) {
      return { error: 'Title and authorId are required' };
    }
    const author = this.userService.getById(data.authorId);
    if (!author) {
      return { error: 'Author not found' };
    }
    const now = new Date();
    const post = {
      id: this.nextId++,
      title: sanitizeString(data.title),
      slug: generateSlug(data.title),
      body: data.body ? sanitizeString(data.body) : '',
      authorId: data.authorId,
      authorName: author.name,
      tags: (data.tags || []).map(t => sanitizeString(t)),
      createdAt: formatTimestamp(now),
      updatedAt: formatTimestamp(now),
    };
    this.posts.set(post.id, post);
    return { post };
  }

  getById(id) {
    return this.posts.get(id) || null;
  }

  getBySlug(slug) {
    for (const [, post] of this.posts) {
      if (post.slug === slug) return post;
    }
    return null;
  }

  update(id, data) {
    const post = this.posts.get(id);
    if (!post) return { error: 'Post not found' };
    if (data.title) {
      post.title = sanitizeString(data.title);
      post.slug = generateSlug(data.title);
    }
    if (data.body !== undefined) post.body = sanitizeString(data.body);
    if (data.tags) post.tags = data.tags.map(t => sanitizeString(t));
    post.updatedAt = formatTimestamp(new Date());
    return { post };
  }

  listByAuthor(authorId, { page = 1, perPage = 10 } = {}) {
    const filtered = [...this.posts.values()].filter(p => p.authorId === authorId);
    const start = (page - 1) * perPage;
    return {
      posts: filtered.slice(start, start + perPage),
      total: filtered.length,
      page,
      perPage,
    };
  }

  delete(id) {
    if (!this.posts.has(id)) return { error: 'Post not found' };
    this.posts.delete(id);
    return { success: true };
  }
}

module.exports = { PostService, generateSlug, sanitizeString, formatTimestamp, validateEmail };
