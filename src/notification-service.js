// Notification Service - sends notifications for various events

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

class NotificationService {
  constructor() {
    this.notifications = [];
    this.subscribers = new Map(); // userId -> { email, preferences }
  }

  subscribe(userId, email, preferences = {}) {
    if (!validateEmail(email)) {
      return { error: 'Invalid email' };
    }
    this.subscribers.set(userId, {
      email,
      preferences: {
        comments: preferences.comments !== false,
        replies: preferences.replies !== false,
        mentions: preferences.mentions !== false,
      },
    });
    return { success: true };
  }

  unsubscribe(userId) {
    if (!this.subscribers.has(userId)) return { error: 'Not subscribed' };
    this.subscribers.delete(userId);
    return { success: true };
  }

  notify(type, data) {
    const now = new Date();
    const notification = {
      id: this.notifications.length + 1,
      type,
      message: sanitizeString(data.message || ''),
      recipientId: data.recipientId,
      senderId: data.senderId,
      postId: data.postId || null,
      commentId: data.commentId || null,
      read: false,
      createdAt: formatTimestamp(now),
    };

    // Check subscriber preferences
    const sub = this.subscribers.get(data.recipientId);
    if (!sub) return { skipped: true, reason: 'not subscribed' };
    if (sub.preferences[type] === false) {
      return { skipped: true, reason: `${type} notifications disabled` };
    }

    this.notifications.push(notification);
    return { notification, delivered: true };
  }

  getForUser(userId, { unreadOnly = false } = {}) {
    let result = this.notifications.filter(n => n.recipientId === userId);
    if (unreadOnly) result = result.filter(n => !n.read);
    return result;
  }

  markRead(notificationId) {
    const n = this.notifications.find(n => n.id === notificationId);
    if (!n) return { error: 'Notification not found' };
    n.read = true;
    return { success: true };
  }

  markAllRead(userId) {
    let count = 0;
    for (const n of this.notifications) {
      if (n.recipientId === userId && !n.read) {
        n.read = true;
        count++;
      }
    }
    return { success: true, count };
  }
}

module.exports = { NotificationService, validateEmail, sanitizeString, formatTimestamp };
