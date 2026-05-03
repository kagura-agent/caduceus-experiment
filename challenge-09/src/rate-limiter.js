// Rate Limiter with sliding window + token bucket hybrid
// Used for API endpoint protection

class RateLimiter {
  constructor(config = {}) {
    this.windowMs = config.windowMs || 60000;          // 1 minute default
    this.maxRequests = config.maxRequests || 100;       // per window
    this.tokenBucketSize = config.tokenBucketSize || 20; // burst capacity
    this.tokenRefillRate = config.tokenRefillRate || 2;  // tokens per second
    this.penaltyMultiplier = config.penaltyMultiplier || 1.5;
    this.penaltyThreshold = config.penaltyThreshold || 0.9; // 90% of maxRequests
    
    this.clients = new Map();
  }

  _getClient(clientId) {
    if (!this.clients.has(clientId)) {
      this.clients.set(clientId, {
        windowStart: Date.now(),
        requestCount: 0,
        tokens: this.tokenBucketSize,
        lastRefill: Date.now(),
        penaltyUntil: 0,
        totalRequests: 0,
        windowHistory: []
      });
    }
    return this.clients.get(clientId);
  }

  _refillTokens(client) {
    const now = Date.now();
    const elapsed = (now - client.lastRefill) / 1000; // seconds
    const newTokens = elapsed * this.tokenRefillRate;
    client.tokens = Math.min(this.tokenBucketSize, client.tokens + newTokens);
    client.lastRefill = now;
  }

  _checkWindow(client) {
    const now = Date.now();
    if (now - client.windowStart >= this.windowMs) {
      // Save window history before reset
      client.windowHistory.push({
        start: client.windowStart,
        count: client.requestCount
      });
      // Keep only last 10 windows
      if (client.windowHistory.length > 10) {
        client.windowHistory = client.windowHistory.slice(-10);
      }
      client.windowStart = now;
      client.requestCount = 0;
    }
  }

  _isPenalized(client) {
    return Date.now() < client.penaltyUntil;
  }

  _applyPenalty(client) {
    const penaltyDuration = this.windowMs * this.penaltyMultiplier;
    client.penaltyUntil = Date.now() + penaltyDuration;
    client.tokens = 0; // drain tokens on penalty
  }

  tryRequest(clientId) {
    const client = this._getClient(clientId);
    
    this._checkWindow(client);
    this._refillTokens(client);

    // Check penalty first
    if (this._isPenalized(client)) {
      return { allowed: false, reason: 'penalized', retryAfter: client.penaltyUntil - Date.now() };
    }

    // Check sliding window
    if (client.requestCount >= this.maxRequests) {
      return { allowed: false, reason: 'rate_limited', retryAfter: this.windowMs - (Date.now() - client.windowStart) };
    }

    // Check token bucket for burst
    if (client.tokens < 1) {
      return { allowed: false, reason: 'burst_limited', retryAfter: 1000 / this.tokenRefillRate };
    }

    // Allow request
    client.requestCount++;
    client.tokens--;
    client.totalRequests++;

    // Check if penalty threshold reached
    if (client.requestCount >= this.maxRequests * this.penaltyThreshold) {
      this._applyPenalty(client);
    }

    return { allowed: true, remaining: this.maxRequests - client.requestCount, tokens: Math.floor(client.tokens) };
  }

  getStats(clientId) {
    const client = this._getClient(clientId);
    this._checkWindow(client);
    this._refillTokens(client);
    
    const avgPerWindow = client.windowHistory.length > 0
      ? client.windowHistory.reduce((sum, w) => sum + w.count, 0) / client.windowHistory.length
      : 0;

    return {
      currentWindow: client.requestCount,
      maxRequests: this.maxRequests,
      tokens: Math.floor(client.tokens),
      tokenBucketSize: this.tokenBucketSize,
      isPenalized: this._isPenalized(client),
      penaltyRemaining: Math.max(0, client.penaltyUntil - Date.now()),
      totalRequests: client.totalRequests,
      avgRequestsPerWindow: Math.round(avgPerWindow * 100) / 100,
      windowsTracked: client.windowHistory.length
    };
  }

  resetClient(clientId) {
    this.clients.delete(clientId);
  }
}

module.exports = { RateLimiter };
