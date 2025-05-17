#!/bin/bash
# filepath: d:\www\multi-tenant\scripts\redis\06_redis_setup.sh
# Redis setup script for multi-tenant system
# Configures Redis for caching, session management, and pub/sub with tenant isolation

# Environment variables
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""  # Set your password here for production environments

echo "Setting up Redis for multi-tenant system..."

# Install redis-cli if not already available
if ! command -v redis-cli &> /dev/null; then
    echo "Installing redis-cli..."
    apt-get update && apt-get install -y redis-tools
fi

# Function to run Redis commands
run_redis_command() {
    if [ -z "$REDIS_PASSWORD" ]; then
        redis-cli -h $REDIS_HOST -p $REDIS_PORT $@
    else
        redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD $@
    fi
}

# Check Redis connection
echo "Checking Redis connection..."
if ! run_redis_command PING | grep -q "PONG"; then
    echo "Cannot connect to Redis server. Please check if Redis is running."
    exit 1
fi

# Configure Redis for production use (these are best practices for multi-tenant)
echo "Configuring Redis settings..."

# Update Redis configuration
REDIS_CONFIG_UPDATES=(
    # Memory management
    "CONFIG SET maxmemory 1gb"
    "CONFIG SET maxmemory-policy allkeys-lru"
    
    # Key eviction policy (LRU - Least Recently Used)
    "CONFIG SET maxmemory-samples 10"
    
    # Persistence
    "CONFIG SET save 900 1"
    "CONFIG SET save 300 10"
    "CONFIG SET save 60 10000"
    
    # Security (uncomment for production)
    # "CONFIG SET protected-mode yes"
    # "CONFIG SET requirepass $REDIS_PASSWORD"
    
    # Replication (if using Redis Sentinel)
    # "CONFIG SET repl-diskless-sync yes"
    # "CONFIG SET repl-diskless-sync-delay 5"
    
    # Performance
    "CONFIG SET tcp-keepalive 300"
    "CONFIG SET timeout 0"
    "CONFIG SET appendonly yes"
    "CONFIG SET appendfsync everysec"
)

# Apply Redis configuration
for config in "${REDIS_CONFIG_UPDATES[@]}"; do
    run_redis_command $config
done

# Save configuration
run_redis_command CONFIG REWRITE

# Create namespace prefixes for tenant isolation
NAMESPACE_TYPES=("cache" "session" "queue" "pubsub" "rate-limit")
TENANT_NAMESPACES=("system" "tenant1")

# Create key expiration policies
KEY_EXPIRATION_POLICIES=(
    # Format: "namespace:type:pattern ttl_seconds"
    "tenant:session:* 3600"         # Session keys expire after 1 hour
    "tenant:cache:basic:* 300"      # Basic cache expires after 5 minutes
    "tenant:cache:medium:* 1800"    # Medium cache expires after 30 minutes
    "tenant:cache:long:* 86400"     # Long cache expires after 24 hours
    "tenant:queue:* 86400"          # Queued jobs expire after 24 hours
    "tenant:rate-limit:* 60"        # Rate limiting expires after 1 minute
)

# Placeholder function to set up Redis key expiration in a real environment
# This would be implemented in application code, but we showcase the logic here
setup_key_expiration() {
    echo "Setting up key expiration policies..."
    for policy in "${KEY_EXPIRATION_POLICIES[@]}"; do
        read -r pattern ttl <<< "$policy"
        echo "For pattern $pattern, setting TTL to $ttl seconds"
        # In real application code, you would apply an EXPIRE command when setting keys
    done
}

# Demo: Set up some example keys with expiry to demonstrate the pattern
for tenant in "${TENANT_NAMESPACES[@]}"; do
    if [ "$tenant" != "system" ]; then
        # Create session key example
        run_redis_command SET "${tenant}:session:user123" "{\"user_id\":\"123\",\"role\":\"admin\"}"
        run_redis_command EXPIRE "${tenant}:session:user123" 3600
        
        # Create cache key example
        run_redis_command SET "${tenant}:cache:basic:products" "[{\"id\":1,\"name\":\"Product 1\"},{\"id\":2,\"name\":\"Product 2\"}]"
        run_redis_command EXPIRE "${tenant}:cache:basic:products" 300
    fi
done

# Pub/Sub channel setup example
echo "Setting up Pub/Sub channels..."
# In Redis, channels don't need to be created explicitly,
# but we document the channel patterns here for reference:
#   - system:events:*       # System-wide events
#   - tenant1:events:*      # Tenant-specific events
#   - tenant1:notifications # User notifications
#   - tenant1:changes:*     # Data change events

# Example: Publish a message to demonstrate
run_redis_command PUBLISH "system:events:startup" "{\"message\":\"Redis configuration completed\",\"timestamp\":\"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"}"

# Setup Redis Sentinel configuration (for high availability)
if [ -f "/etc/redis/sentinel.conf" ]; then
    echo "Creating Redis Sentinel configuration..."
    cat > /tmp/sentinel.conf << EOF
port 26379
sentinel monitor mymaster $REDIS_HOST $REDIS_PORT 2
sentinel down-after-milliseconds mymaster 5000
sentinel failover-timeout mymaster 60000
sentinel parallel-syncs mymaster 1
EOF
    echo "Redis Sentinel configuration created at /tmp/sentinel.conf"
    echo "To apply: mv /tmp/sentinel.conf /etc/redis/sentinel.conf && service redis-sentinel restart"
fi

echo "Creating Redis namespaces script for application use..."
# Create a script that demonstrates how to use Redis namespaces in application code
cat > /tmp/redis-namespaces.js << EOF
/**
 * Redis namespace utility for multi-tenant application
 * This is a sample implementation for Node.js applications using ioredis
 */

const Redis = require('ioredis');

class RedisNamespaceClient {
  constructor(config) {
    this.redis = new Redis(config);
    this.defaultExpiry = {
      cache: 300,      // 5 minutes
      session: 3600,   // 1 hour
      rateLimiting: 60 // 1 minute
    };
  }

  /**
   * Get namespaced key
   * @param {string} tenantId - Tenant identifier
   * @param {string} type - Key type (cache, session, queue, etc.)
   * @param {string} key - Base key
   * @returns {string} Namespaced key
   */
  getNamespacedKey(tenantId, type, key) {
    return \`\${tenantId}:\${type}:\${key}\`;
  }

  /**
   * Set a cache value with tenant isolation
   */
  async setCache(tenantId, key, value, expiry = this.defaultExpiry.cache) {
    const nsKey = this.getNamespacedKey(tenantId, 'cache', key);
    await this.redis.set(nsKey, JSON.stringify(value), 'EX', expiry);
  }

  /**
   * Get a cache value with tenant isolation
   */
  async getCache(tenantId, key) {
    const nsKey = this.getNamespacedKey(tenantId, 'cache', key);
    const value = await this.redis.get(nsKey);
    return value ? JSON.parse(value) : null;
  }

  /**
   * Set session data with tenant isolation
   */
  async setSession(tenantId, sessionId, data, expiry = this.defaultExpiry.session) {
    const nsKey = this.getNamespacedKey(tenantId, 'session', sessionId);
    await this.redis.set(nsKey, JSON.stringify(data), 'EX', expiry);
  }

  /**
   * Apply rate limiting with tenant isolation
   */
  async checkRateLimit(tenantId, key, limit, windowSecs = this.defaultExpiry.rateLimiting) {
    const nsKey = this.getNamespacedKey(tenantId, 'rate-limit', key);
    const count = await this.redis.incr(nsKey);
    
    if (count === 1) {
      await this.redis.expire(nsKey, windowSecs);
    }
    
    return { 
      allowed: count <= limit,
      current: count, 
      limit,
      remaining: Math.max(0, limit - count)
    };
  }

  /**
   * Publish event to tenant-specific channel
   */
  async publishEvent(tenantId, eventType, data) {
    const channel = \`\${tenantId}:events:\${eventType}\`;
    await this.redis.publish(channel, JSON.stringify({
      tenantId,
      eventType,
      data,
      timestamp: new Date().toISOString()
    }));
  }

  /**
   * Subscribe to tenant-specific events
   */
  subscribeToEvents(tenantId, eventType, callback) {
    const channel = \`\${tenantId}:events:\${eventType}\`;
    const subscriber = this.redis.duplicate();
    
    subscriber.subscribe(channel, (err, count) => {
      if (err) {
        console.error(\`Failed to subscribe to \${channel}:, err);
        return;
      }
      console.log(\`Subscribed to \${count} channels, including \${channel}\`);
    });
    
    subscriber.on('message', (channel, message) => {
      try {
        const parsedMessage = JSON.parse(message);
        callback(parsedMessage);
      } catch (e) {
        console.error('Failed to parse message:', e);
      }
    });
    
    return subscriber;
  }
}

module.exports = RedisNamespaceClient;
EOF

echo "Redis setup complete with tenant isolation and key expiration policies"
