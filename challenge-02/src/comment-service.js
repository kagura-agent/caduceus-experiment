// Comment Service - handles comments on posts

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

class CommentService {
  constructor(userService, postService) {
    this.userService = userService;
    this.postService = postService;
    this.comments = new Map();
    this.nextId = 1;
  }

  create(data) {
    if (!data || !data.body || !data.authorId || !data.postId) {
      return { error: 'Body, authorId, and postId are required' };
    }
    const author = this.userService.getById(data.authorId);
    if (!author) return { error: 'Author not found' };
    const post = this.postService.getById(data.postId);
    if (!post) return { error: 'Post not found' };

    // Validate parent comment if replying
    if (data.parentId) {
      const parent = this.comments.get(data.parentId);
      if (!parent) return { error: 'Parent comment not found' };
      if (parent.postId !== data.postId) return { error: 'Parent comment belongs to different post' };
    }

    const now = new Date();
    const comment = {
      id: this.nextId++,
      body: sanitizeString(data.body),
      authorId: data.authorId,
      authorName: author.name,
      authorEmail: author.email,
      postId: data.postId,
      parentId: data.parentId || null,
      createdAt: formatTimestamp(now),
      updatedAt: formatTimestamp(now),
    };
    this.comments.set(comment.id, comment);
    return { comment };
  }

  getById(id) {
    return this.comments.get(id) || null;
  }

  listByPost(postId, { page = 1, perPage = 20 } = {}) {
    const filtered = [...this.comments.values()]
      .filter(c => c.postId === postId && c.parentId === null);
    const start = (page - 1) * perPage;
    return {
      comments: filtered.slice(start, start + perPage),
      total: filtered.length,
      page,
      perPage,
    };
  }

  getReplies(commentId) {
    return [...this.comments.values()].filter(c => c.parentId === commentId);
  }

  update(id, data) {
    const comment = this.comments.get(id);
    if (!comment) return { error: 'Comment not found' };
    if (data.body !== undefined) {
      comment.body = sanitizeString(data.body);
      comment.updatedAt = formatTimestamp(new Date());
    }
    return { comment };
  }

  delete(id) {
    if (!this.comments.has(id)) return { error: 'Comment not found' };
    // Also delete replies
    const replies = this.getReplies(id);
    for (const reply of replies) {
      this.comments.delete(reply.id);
    }
    this.comments.delete(id);
    return { success: true, deletedCount: 1 + replies.length };
  }

  getThreadCount(postId) {
    return [...this.comments.values()].filter(c => c.postId === postId).length;
  }
}

module.exports = { CommentService, validateEmail, sanitizeString, formatTimestamp };
