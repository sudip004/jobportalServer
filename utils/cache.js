// Simple in-memory cache with TTL (Time To Live)
class Cache {
    constructor() {
        this.cache = {};
    }

    set(key, value, ttlSeconds = 300) { // 5 minutes default
        const expiresAt = Date.now() + (ttlSeconds * 1000);
        this.cache[key] = { value, expiresAt };
    }

    get(key) {
        const item = this.cache[key];
        
        if (!item) return null;
        
        // Check if expired
        if (Date.now() > item.expiresAt) {
            delete this.cache[key];
            return null;
        }
        
        return item.value;
    }

    delete(key) {
        delete this.cache[key];
    }

    clear() {
        this.cache = {};
    }

    // Clear expired entries periodically
    clearExpired() {
        const now = Date.now();
        Object.keys(this.cache).forEach(key => {
            if (now > this.cache[key].expiresAt) {
                delete this.cache[key];
            }
        });
    }
}

const cache = new Cache();

// Clear expired entries every 5 minutes
setInterval(() => {
    cache.clearExpired();
}, 5 * 60 * 1000);

module.exports = cache;
