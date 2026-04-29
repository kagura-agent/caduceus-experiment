// EventBus - Advanced pub/sub system
// Implement all TODO methods to make the tests pass!

class EventBus {
  constructor() {
    // Suggested data structures (use these or your own):
    this._listeners = new Map();   // event -> [{handler, priority, once}]
    this._history = [];            // [{event, args, timestamp}]
  }

  // Register a listener for an event
  // priority: higher number = called first (default: 0)
  // Use event '*' for wildcard (receives all events)
  on(event, handler, priority = 0) {
    // TODO: implement
    // Store the listener with its handler, priority, and once=false
    // Keep listeners sorted by priority (highest first), stable for same priority
  }

  // Register a one-time listener (auto-removes after first call)
  once(event, handler, priority = 0) {
    // TODO: implement
    // Same as on() but mark the listener as once=true
  }

  // Remove a specific listener
  // Returns true if listener was found and removed, false otherwise
  off(event, handler) {
    // TODO: implement
    return false;
  }

  // Emit an event with arguments
  // Calls all matching listeners in priority order (highest first)
  // Wildcard ('*') listeners receive: (eventName, ...args)
  // Regular listeners receive: (...args)
  // Records emission in history
  // Returns number of listeners called
  emit(event, ...args) {
    // TODO: implement
    return 0;
  }

  // Get emission history
  // No args: return all history
  // With event: return history for that event only
  getHistory(event) {
    // TODO: implement
    return [];
  }

  // Count registered listeners
  // No args: count all listeners across all events
  // With event: count listeners for that specific event
  listenerCount(event) {
    // TODO: implement
    return 0;
  }

  // Clear listeners
  // No args: clear ALL listeners (but keep history)
  // With event: clear listeners for that event only
  clear(event) {
    // TODO: implement
  }
}

module.exports = { EventBus };
