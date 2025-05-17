-- Custom Kong plugin for tenant-aware request/response transformation
-- This plugin modifies requests and responses according to tenant-specific rules
local plugin = {
  PRIORITY = 790, -- Run after tenant identification but before proxy execution
  VERSION = "1.0.0"
}

-- Specify the plugin configuration schema
function plugin:schema()
  return {
    name = "tenant-transformer",
    fields = {
      {
        config = {
          type = "record",
          fields = {
            {
              remove_sensitive_headers = { type = "boolean", default = true },
            },
            {
              sensitive_headers = { 
                type = "array", 
                elements = { type = "string" }, 
                default = { 
                  "Authorization", 
                  "api-key", 
                  "apikey", 
                  "x-api-key", 
                  "X-API-Key" 
                } 
              },
            },
            {
              add_tenant_headers = { type = "boolean", default = true },
            },
            {
              sanitize_paths = { type = "boolean", default = true },
            },
            {
              sanitize_query_params = { type = "boolean", default = true },
            },
            {
              allowed_content_types = { 
                type = "array", 
                elements = { type = "string" }, 
                default = { 
                  "application/json", 
                  "application/xml", 
                  "application/x-www-form-urlencoded", 
                  "multipart/form-data", 
                  "text/plain" 
                } 
              },
            },
            {
              max_request_size_bytes = { type = "number", default = 10485760 }, -- 10MB
            }
          }
        }
      }
    }
  }
end

-- Initialize plugin with dependencies
function plugin:init_worker()
  kong.log.debug("Initializing tenant-transformer plugin")
end

-- Sanitize a path to prevent directory traversal attacks
local function sanitize_path(path)
  -- Remove multiple slashes
  path = path:gsub("//+", "/")
  
  -- Remove relative path components
  while path:find("/%.%.") or path:find("/%.") do
    path = path:gsub("/%.%.", "")
    path = path:gsub("/%.%.", "")
    path = path:gsub("/%.%.", "")
    path = path:gsub("/%.%.", "")
    path = path:gsub("/%.", "")
  end
  
  return path
end

-- Sanitize a value for XSS prevention
local function sanitize_value(value)
  if type(value) == "string" then
    -- Simple XSS prevention: replace < and > with their HTML entities
    value = value:gsub("<", "&lt;"):gsub(">", "&gt;")
    
    -- Replace script tags
    value = value:gsub("script", "s&#99;ript")
    
    -- Remove potential SQL injection patterns
    value = value:gsub("'%s*--", ""):gsub("'%s*;", "")
    
    return value
  end
  
  return value
end

-- Handle the request phase
function plugin:access(conf)
  -- Get request information
  local request_size = tonumber(kong.request.get_header("content-length")) or 0
  local content_type = kong.request.get_header("content-type") or ""
  local method = kong.request.get_method()
  
  -- Check request size
  if conf.max_request_size_bytes > 0 and request_size > conf.max_request_size_bytes then
    kong.log.warn("Request size exceeds maximum allowed: " .. request_size .. " bytes")
    return kong.response.exit(413, { message = "Request entity too large" })
  end
  
  -- Validate content type if not a GET/HEAD/OPTIONS request
  if method ~= "GET" and method ~= "HEAD" and method ~= "OPTIONS" and content_type ~= "" then
    local valid_content_type = false
    for _, allowed_type in ipairs(conf.allowed_content_types) do
      if content_type:find(allowed_type, 1, true) then
        valid_content_type = true
        break
      end
    end
    
    if not valid_content_type then
      kong.log.warn("Unsupported content type: " .. content_type)
      return kong.response.exit(415, { message = "Unsupported media type" })
    end
  end
  
  -- Sanitize path if enabled
  if conf.sanitize_paths then
    local path = kong.request.get_path()
    local sanitized_path = sanitize_path(path)
    
    if path ~= sanitized_path then
      kong.log.debug("Sanitized path from " .. path .. " to " .. sanitized_path)
      
      -- If path was changed, modify the request
      local query = kong.request.get_raw_query()
      if query then
        kong.service.request.set_path(sanitized_path .. "?" .. query)
      else
        kong.service.request.set_path(sanitized_path)
      end
    end
  end
  
  -- Sanitize query parameters if enabled
  if conf.sanitize_query_params then
    local sanitized_query_params = {}
    local has_changes = false
    
    for key, value in pairs(kong.request.get_query()) do
      local sanitized_value = sanitize_value(value)
      sanitized_query_params[key] = sanitized_value
      
      if value ~= sanitized_value then
        has_changes = true
        kong.log.debug("Sanitized query param " .. key)
      end
    end
    
    if has_changes then
      kong.service.request.set_query(sanitized_query_params)
    end
  end
  
  -- Remove sensitive headers if enabled
  if conf.remove_sensitive_headers then
    for _, header_name in ipairs(conf.sensitive_headers) do
      local header_value = kong.request.get_header(header_name)
      if header_value then
        -- Don't completely remove Authorization headers as they may be needed
        -- Instead, preserve their presence but don't forward the value
        if header_name:lower() == "authorization" then
          -- The JWT plugin will add the header back with decoded information
          kong.log.debug("Hiding sensitive header: " .. header_name)
          kong.service.request.clear_header(header_name)
        else
          kong.log.debug("Removing sensitive header: " .. header_name)
          kong.service.request.clear_header(header_name)
        end
      end
    end
  end
  
  -- Add tenant headers to upstream services if enabled
  if conf.add_tenant_headers then
    -- Get tenant information
    local tenant_type = kong.request.get_header("X-Tenant-Type")
    local tenant_id = kong.request.get_header("X-Tenant-ID")
    local tenant_schema = kong.request.get_header("X-Tenant-Schema")
    
    if tenant_type and tenant_id then
      -- Add tenant headers to upstream
      kong.service.request.set_header("X-Forwarded-Tenant-ID", tenant_id)
      
      if tenant_schema then
        kong.service.request.set_header("X-Forwarded-Tenant-Schema", tenant_schema)
      end
      
      kong.service.request.set_header("X-Forwarded-Tenant-Type", tenant_type)
    end
  end
  
  -- Add standard headers
  kong.service.request.set_header("X-Forwarded-For", kong.client.get_forwarded_ip())
  kong.service.request.set_header("X-Forwarded-Host", kong.request.get_host())
  kong.service.request.set_header("X-Forwarded-Proto", kong.request.get_scheme())
  kong.service.request.set_header("X-Real-IP", kong.client.get_ip())
  
  -- Add request ID for tracing
  local request_id = kong.request.get_header("X-Request-ID") or kong.request.get_id()
  kong.service.request.set_header("X-Request-ID", request_id)
  kong.ctx.shared.request_id = request_id
end

-- Handle the response headers
function plugin:header_filter(conf)
  -- Add security headers
  kong.response.set_header("X-Content-Type-Options", "nosniff")
  kong.response.set_header("X-Frame-Options", "SAMEORIGIN")
  kong.response.set_header("X-XSS-Protection", "1; mode=block")
  kong.response.set_header("Referrer-Policy", "strict-origin-when-cross-origin")
  
  -- Add CORS headers if Origin header is present
  local origin = kong.request.get_header("Origin")
  if origin then
    -- In a real implementation, we would check if the origin is allowed
    kong.response.set_header("Access-Control-Allow-Origin", origin)
    kong.response.set_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    kong.response.set_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
    kong.response.set_header("Access-Control-Allow-Credentials", "true")
    kong.response.set_header("Access-Control-Max-Age", "3600")
  end
  
  -- Add request ID for tracing
  if kong.ctx.shared.request_id then
    kong.response.set_header("X-Request-ID", kong.ctx.shared.request_id)
  end
  
  -- Remove any sensitive information from response headers
  kong.response.clear_header("Server")
  kong.response.clear_header("X-Powered-By")
end

-- Export the plugin
return plugin
