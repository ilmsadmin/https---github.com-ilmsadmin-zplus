-- Custom Kong plugin for tenant-aware rate limiting
-- This plugin applies different rate limits based on the tenant's package type
local redis = require "resty.redis"
local plugin = {
  PRIORITY = 900, -- Should run after authentication
  VERSION = "1.0.0"
}

-- Specify the plugin configuration schema
function plugin:schema()
  return {
    name = "tenant-rate-limiter",
    fields = {
      {
        config = {
          type = "record",
          fields = {
            {
              redis_host = { type = "string", required = true, default = "redis" },
            },
            {
              redis_port = { type = "number", required = true, default = 6379 },
            },
            {
              redis_password = { type = "string" },
            },
            {
              redis_timeout = { type = "number", default = 2000 },
            },
            {
              redis_database = { type = "number", default = 0 },
            },            {
              basic_rate = { type = "number", default = 50 },
            },
            {
              pro_rate = { type = "number", default = 300 },
            },
            {
              enterprise_rate = { type = "number", default = 1500 },
            },
            {
              basic_window_size = { type = "number", default = 60 },
            },
            {
              pro_window_size = { type = "number", default = 60 },
            },
            {
              enterprise_window_size = { type = "number", default = 60 },
            },
            {
              basic_burst_size = { type = "number", default = 10 },
            },
            {
              pro_burst_size = { type = "number", default = 50 },
            },
            {
              enterprise_burst_size = { type = "number", default = 200 },
            },
            {
              tenant_service_host = { type = "string", required = true, default = "tenant-service" },
            },
            {
              tenant_service_port = { type = "number", required = true, default = 3000 },
            },
            {
              exempted_paths = { 
                type = "array", 
                elements = { type = "string" }, 
                default = { 
                  "/api/v1/health", 
                  "/api/v1/metrics", 
                  "/api/v1/docs" 
                } 
              },
            }
          }
        }
      }
    }
  }
end

-- Initialize plugin with dependencies
function plugin:init_worker()
  kong.log.debug("Initializing tenant-rate-limiter plugin")
end

-- Check if the current path is exempted from rate limiting
local function is_exempted_path(exempted_paths)
  local path = kong.request.get_path()
  for _, exempted_path in ipairs(exempted_paths) do
    if path:find("^" .. exempted_path) then
      return true
    end
  end
  return false
end

-- Get the rate limit configuration for a package
local function get_rate_limit_config(conf, package_name)
  if package_name == "enterprise" then
    return conf.enterprise_rate, conf.enterprise_window_size, conf.enterprise_burst_size
  elseif package_name == "pro" then
    return conf.pro_rate, conf.pro_window_size, conf.pro_burst_size
  else
    -- Default to basic rate limit
    return conf.basic_rate, conf.basic_window_size, conf.basic_burst_size
  end
end

-- Increment rate limit counter and check if limit is exceeded
local function increment_and_check(red, key, limit, window_size, burst_size)
  -- Use Redis to implement a sliding window rate limiter with burst tolerance
  local now = ngx.time()
  local window_start = now - window_size
  
  -- Remove counts older than the window
  red:zremrangebyscore(key, 0, window_start)
  
  -- Count requests in the current window
  local count = red:zcard(key)
  
  -- Get recent requests in last few seconds to check for burst
  local recent_window = now - 5 -- Last 5 seconds
  local recent_count = red:zcount(key, recent_window, "+inf")
  
  -- Check if limit is exceeded, accounting for burst allowance
  if count >= limit and recent_count >= burst_size then
    return true, count, recent_count
  end
  
  -- Add current request with timestamp as score
  red:zadd(key, now, now .. ":" .. kong.ctx.shared.request_id or kong.request.get_id())
  
  -- Set expiry on the key to auto-cleanup
  red:expire(key, window_size * 2)
  
  -- Return current count and burst count
  return false, count + 1, recent_count + 1
end

-- Handle the request phase
function plugin:access(conf)
  -- Skip rate limiting for exempted paths
  if is_exempted_path(conf.exempted_paths) then
    kong.log.debug("Skipping rate limiting for exempted path")
    return
  end
  
  -- Get tenant information
  local tenant_type = kong.request.get_header("X-Tenant-Type")
  local tenant_id = kong.request.get_header("X-Tenant-ID")
  local tenant_package = kong.request.get_header("X-Tenant-Package")
  
  -- Skip rate limiting for system requests
  if tenant_type == "system" then
    kong.log.debug("Skipping rate limiting for system request")
    return
  end
  
  -- If there's no tenant info, we might need to fetch package from tenant service
  if not tenant_package and tenant_id then
    kong.log.debug("Tenant package information not found in headers, querying tenant service")
    
    -- Connect to tenant service to get package info
    local httpc = require("resty.http").new()
    local res, err = httpc:request_uri("http://" .. conf.tenant_service_host .. ":" .. conf.tenant_service_port .. "/internal/tenants/" .. tenant_id .. "/package", {
      method = "GET",
      headers = {
        ["Host"] = conf.tenant_service_host
      },
      keepalive_timeout = 60,
      keepalive_pool = 10
    })
    
    if not res then
      kong.log.err("Failed to query tenant service: ", err)
      -- Default to basic package if we can't determine
      tenant_package = "basic"
    elseif res.status ~= 200 then
      kong.log.warn("Tenant service returned non-200 response: ", res.status)
      -- Default to basic package if we can't determine
      tenant_package = "basic"
    else
      -- Parse the package info
      local package_info, err = require("cjson.safe").decode(res.body)
      if not package_info then
        kong.log.err("Failed to decode package information: ", err)
        tenant_package = "basic"
      else
        tenant_package = package_info.name or "basic"
      end
    end
  end
  
  -- Default to basic package if we still don't have package info
  tenant_package = tenant_package or "basic"
    -- Get the rate limit configuration for this package
  local rate_limit, window_size, burst_size = get_rate_limit_config(conf, tenant_package:lower())
  
  -- Create Redis connection
  local red = redis:new()
  red:set_timeout(conf.redis_timeout)
  
  local ok, err = red:connect(conf.redis_host, conf.redis_port)
  if not ok then
    kong.log.err("Failed to connect to Redis: ", err)
    -- Allow the request to proceed if we can't check rate limit
    return
  end
  
  -- Authenticate with Redis if password is provided
  if conf.redis_password and conf.redis_password ~= "" then
    local res, err = red:auth(conf.redis_password)
    if not res then
      kong.log.err("Failed to authenticate with Redis: ", err)
      return
    end
  end
  
  -- Select the Redis database
  if conf.redis_database > 0 then
    local res, err = red:select(conf.redis_database)
    if not res then
      kong.log.err("Failed to select Redis database: ", err)
      return
    end
  end
  
  -- Construct rate limit key using tenant ID
  local rate_limit_key = "rate-limit:tenant:" .. tenant_id
  
  -- Check and increment rate limit
  local exceeded, current_count, burst_count = increment_and_check(red, rate_limit_key, rate_limit, window_size, burst_size)
  
  -- Keep connection in pool
  local ok, err = red:set_keepalive(10000, 100)
  if not ok then
    kong.log.err("Failed to set Redis keepalive: ", err)
  end
  
  -- Set rate limit headers
  kong.response.set_header("X-RateLimit-Limit", rate_limit)
  kong.response.set_header("X-RateLimit-Remaining", math.max(0, rate_limit - current_count))
  kong.response.set_header("X-RateLimit-Window", window_size)
  kong.response.set_header("X-RateLimit-Burst", burst_size)
  kong.response.set_header("X-RateLimit-Burst-Count", burst_count)
  
  -- If rate limit exceeded, return 429 Too Many Requests
  if exceeded then
    kong.log.warn("Rate limit exceeded for tenant: " .. tenant_id)
    return kong.response.exit(429, { message = "Rate limit exceeded. Please try again later." })
  end
  
  kong.log.debug("Rate limit check passed for tenant: " .. tenant_id .. " (" .. current_count .. "/" .. rate_limit .. ")")
end

-- Export the plugin
return plugin
