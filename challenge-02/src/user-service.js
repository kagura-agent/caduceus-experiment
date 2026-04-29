// User Service - handles user CRUD and validation

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

class UserService {
  constructor() {
    this.users = new Map();
    this.nextId = 1;
  }

  create(data) {
    if (!data || !data.name || !data.email) {
      return { error: 'Name and email are required' };
    }
    const email = data.email.toLowerCase();
    if (!validateEmail(email)) {
      return { error: 'Invalid email format' };
    }
    // Check for duplicate email
    for (const [, user] of this.users) {
      if (user.email === email) {
        return { error: 'Email already exists' };
      }
    }
    const now = new Date();
    const user = {
      id: this.nextId++,
      name: sanitizeString(data.name),
      email: email,
      bio: data.bio ? sanitizeString(data.bio) : '',
      createdAt: formatTimestamp(now),
      updatedAt: formatTimestamp(now),
    };
    this.users.set(user.id, user);
    return { user };
  }

  getById(id) {
    return this.users.get(id) || null;
  }

  update(id, data) {
    const user = this.users.get(id);
    if (!user) return { error: 'User not found' };
    if (data.email) {
      const email = data.email.toLowerCase();
      if (!validateEmail(email)) {
        return { error: 'Invalid email format' };
      }
      for (const [uid, u] of this.users) {
        if (uid !== id && u.email === email) {
          return { error: 'Email already exists' };
        }
      }
      user.email = email;
    }
    if (data.name) user.name = sanitizeString(data.name);
    if (data.bio !== undefined) user.bio = sanitizeString(data.bio);
    user.updatedAt = formatTimestamp(new Date());
    return { user };
  }

  list({ page = 1, perPage = 10 } = {}) {
    const all = [...this.users.values()];
    const start = (page - 1) * perPage;
    return {
      users: all.slice(start, start + perPage),
      total: all.length,
      page,
      perPage,
    };
  }

  delete(id) {
    if (!this.users.has(id)) return { error: 'User not found' };
    this.users.delete(id);
    return { success: true };
  }
}

module.exports = { UserService, validateEmail, sanitizeString, formatTimestamp };
