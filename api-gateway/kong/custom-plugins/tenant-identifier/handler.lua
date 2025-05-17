-- Custom Kong plugin for tenant identification
-- This plugin extracts tenant information from the hostname and adds it to headers
local plugin = {
  PRIORITY = 1000, -- High priority to run early in the request cycle
  VERSION = "1.0.0"
}

-- Specify the plugin configuration schema
function plugin:schema()
  return {
    name = "tenant-identifier",
    fields = {
      {
        config = {
          type = "record",
          fields = {
            {
              system_domain = { type = "string", required = true, default = "example.com" },
            },
            {
              cache_ttl = { type = "number", default = 300 },
            },
            {
              redis_host = { type = "string", required = true, default = "redis" },
            },
            {
              redis_port = { type = "number", required = true, default = 6379 },
            },
            {
              redis_timeout = { type = "number", default = 2000 },
            },
            {
              redis_database = { type = "number", default = 0 },
            },
            {
              redis_password = { type = "string" },
            }
          }
        }
      }
    }
  }
end

-- Initialize plugin with dependencies
function plugin:init_worker()
  kong.log.debug("Initializing tenant-identifier plugin")
end

-- Handle the request phase
function plugin:access(conf)
  -- Get hostname from the request
  local hostname = kong.request.get_host()
  
  if not hostname then
    kong.log.err("No hostname found in the request")
    return kong.response.exit(400, { message = "Invalid request: Missing hostname" })
  end
  
  kong.log.debug("Processing request for hostname: " .. hostname)
  
  -- Check if this is the system domain (for system admin access)
  if hostname == conf.system_domain then
    kong.log.debug("System domain detected: " .. hostname)
    kong.service.request.set_header("X-Tenant-Type", "system")
    return
  end
  
  -- Try to get tenant info from cache first
  local tenant_cache_key = "tenant:" .. hostname
  
  -- Create Redis connection
  local redis = require "resty.redis"
  local red = redis:new()
  red:set_timeout(conf.redis_timeout)
  
  local ok, err = red:connect(conf.redis_host, conf.redis_port)
  if not ok then
    kong.log.err("Failed to connect to Redis: ", err)
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
  
  -- Try to get tenant from Redis cache
  local tenant_info, err = red:get(tenant_cache_key)
  if tenant_info then
    kong.log.debug("Tenant info found in cache: " .. tenant_info)
    
    -- Parse the JSON string to get tenant details
    local cjson = require "cjson.safe"
    local tenant_data, err = cjson.decode(tenant_info)
    
    if tenant_data then
      -- Set tenant information in request headers
      kong.service.request.set_header("X-Tenant-ID", tenant_data.tenant_id)
      kong.service.request.set_header("X-Tenant-Schema", tenant_data.schema_name)
      kong.service.request.set_header("X-Tenant-Package", tenant_data.package_id)
      kong.service.request.set_header("X-Tenant-Type", "tenant")
      
      -- Keep connection in pool
      local ok, err = red:set_keepalive(10000, 100)
      if not ok then
        kong.log.err("Failed to set Redis keepalive: ", err)
      end
      
      return
    else
      kong.log.err("Failed to decode tenant info: ", err)
    end
  end
  
  -- Tenant not found in cache, query the tenant service
  kong.log.debug("Tenant not found in cache, querying tenant service")
  
  -- Proxy to Tenant Service to resolve the domain
  local httpc = require("resty.http").new()
  local res, err = httpc:request_uri("http://tenant-service:3000/internal/domains/lookup", {
    method = "GET",
    headers = {
      ["Host"] = "tenant-service",
      ["X-Original-Host"] = hostname
    },
    query = { domain = hostname },
    keepalive_timeout = 60,
    keepalive_pool = 10
  })
  
  if not res then
    kong.log.err("Failed to query tenant service: ", err)
    return kong.response.exit(500, { message = "Internal server error" })
  end
  
  if res.status ~= 200 then
    kong.log.warn("Tenant service returned non-200 response: ", res.status)
    
    -- Check if it's a "not found" error
    if res.status == 404 then
      return kong.response.exit(404, { message = "Tenant not found for domain: " .. hostname })
    end
    
    return kong.response.exit(res.status, { message = "Error resolving tenant" })
  end
  
  -- Parse the tenant info
  local cjson = require "cjson.safe"
  local tenant_data, err = cjson.decode(res.body)
  
  if not tenant_data then
    kong.log.err("Failed to decode tenant data: ", err)
    return kong.response.exit(500, { message = "Error processing tenant data" })
  end
  
  -- Set tenant information in request headers
  kong.service.request.set_header("X-Tenant-ID", tenant_data.tenant_id)
  kong.service.request.set_header("X-Tenant-Schema", tenant_data.schema_name)
  kong.service.request.set_header("X-Tenant-Package", tenant_data.package_id)
  kong.service.request.set_header("X-Tenant-Type", "tenant")
  
  -- Cache the tenant information in Redis
  if tenant_data.tenant_id then
    local tenant_json = cjson.encode(tenant_data)
    local ok, err = red:set(tenant_cache_key, tenant_json)
    if not ok then
      kong.log.err("Failed to store tenant in cache: ", err)
    else
      -- Set TTL on the cache entry
      local ok, err = red:expire(tenant_cache_key, conf.cache_ttl)
      if not ok then
        kong.log.err("Failed to set TTL on tenant cache: ", err)
      end
    end
  end
  
  -- Keep connection in pool
  local ok, err = red:set_keepalive(10000, 100)
  if not ok then
    kong.log.err("Failed to set Redis keepalive: ", err)
  end
end

-- Handle the response phase (if needed)
function plugin:header_filter(conf)
  -- For example, you could add tenant info to the response headers
  -- kong.response.set_header("X-Tenant-ID", kong.ctx.shared.tenant_id)
end

-- Export the plugin
return plugin
