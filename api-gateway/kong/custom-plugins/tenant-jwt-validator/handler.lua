-- Custom Kong plugin for JWT validation with tenant context
-- This plugin extends the built-in JWT plugin to validate tenant context
local jwt_decoder = require "kong.plugins.jwt.jwt_parser"
local plugin = {
  PRIORITY = 1010, -- Should run after tenant-identifier plugin
  VERSION = "1.0.0"
}

-- Specify the plugin configuration schema
function plugin:schema()
  return {
    name = "tenant-jwt-validator",
    fields = {
      {
        config = {
          type = "record",
          fields = {
            {
              uri_param_names = { type = "array", elements = { type = "string" }, default = { "jwt" } },
            },
            {
              cookie_names = { type = "array", elements = { type = "string" }, default = {} },
            },
            {
              header_names = { type = "array", elements = { type = "string" }, default = { "authorization" } },
            },
            {
              auth_service_host = { type = "string", required = true, default = "auth-service" },
            },
            {
              auth_service_port = { type = "number", required = true, default = 3000 },
            },
            {
              auth_service_path = { type = "string", required = true, default = "/internal/auth/validate" },
            },
            {
              key_claim_name = { type = "string", default = "iss" },
            },
            {
              system_scope = { type = "string", default = "system:admin" },
            },
            {
              public_paths = { 
                type = "array", 
                elements = { type = "string" }, 
                default = { "/api/v1/auth/login", "/api/v1/auth/register", "/api/v1/auth/forgot-password" } 
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
  kong.log.debug("Initializing tenant-jwt-validator plugin")
end

-- Check if the current path is in the list of public paths
local function is_public_path(public_paths)
  local path = kong.request.get_path()
  for _, public_path in ipairs(public_paths) do
    if path:find("^" .. public_path) then
      return true
    end
  end
  return false
end

-- Extract the JWT token from the request
local function extract_token(conf)
  -- Check for token in URI parameters
  for _, v in ipairs(conf.uri_param_names) do
    local token = kong.request.get_query_arg(v)
    if token then return token end
  end
  
  -- Check for token in cookies
  for _, v in ipairs(conf.cookie_names) do
    local token = kong.request.get_header("cookie:" .. v)
    if token then return token end
  end
  
  -- Check for token in headers
  for _, v in ipairs(conf.header_names) do
    local token = kong.request.get_header(v)
    if token then
      -- Strip 'Bearer ' prefix if it exists
      local bearer = "Bearer "
      if token:sub(1, #bearer):lower() == bearer:lower() then
        token = token:sub(#bearer + 1)
      end
      return token
    end
  end
  
  return nil
end

-- Handle the request phase
function plugin:access(conf)
  -- Skip public paths
  if is_public_path(conf.public_paths) then
    kong.log.debug("Skipping JWT validation for public path")
    return
  end
  
  -- Get tenant information set by the tenant-identifier plugin
  local tenant_type = kong.request.get_header("X-Tenant-Type")
  local tenant_id = kong.request.get_header("X-Tenant-ID")
  local tenant_schema = kong.request.get_header("X-Tenant-Schema")
  
  -- Skip JWT validation for OPTIONS requests (preflight CORS)
  if kong.request.get_method() == "OPTIONS" then
    kong.log.debug("Skipping JWT validation for OPTIONS request")
    return
  end
  
  -- Extract the JWT token
  local token = extract_token(conf)
  if not token then
    kong.log.err("No JWT token found in the request")
    return kong.response.exit(401, { message = "Unauthorized: Missing authentication token" })
  end
  
  -- Parse the JWT token to extract claims before validation
  local jwt, err = jwt_decoder:new(token)
  if err then
    kong.log.err("Failed to decode JWT: ", err)
    return kong.response.exit(401, { message = "Unauthorized: Invalid token format" })
  end
  
  -- Extract claims
  local claims = jwt.claims
  
  -- Pass the token to Auth service for full validation
  local httpc = require("resty.http").new()
  local res, err = httpc:request_uri("http://" .. conf.auth_service_host .. ":" .. conf.auth_service_port .. conf.auth_service_path, {
    method = "POST",
    headers = {
      ["Content-Type"] = "application/json",
      ["X-Original-Host"] = kong.request.get_host()
    },
    body = require("cjson").encode({
      token = token,
      tenant_id = tenant_id,
      tenant_schema = tenant_schema,
      tenant_type = tenant_type
    }),
    keepalive_timeout = 60,
    keepalive_pool = 10
  })
  
  if not res then
    kong.log.err("Failed to connect to Auth service: ", err)
    return kong.response.exit(500, { message = "Internal server error during authentication" })
  end
  
  if res.status ~= 200 then
    kong.log.warn("Auth service returned non-200 response: ", res.status)
    return kong.response.exit(401, { message = "Unauthorized: Invalid or expired token" })
  end
  
  -- Parse validation result
  local validation_result, err = require("cjson.safe").decode(res.body)
  if not validation_result then
    kong.log.err("Failed to decode Auth service response: ", err)
    return kong.response.exit(500, { message = "Internal server error during authentication" })
  end
  
  -- Check if token is valid
  if not validation_result.valid then
    kong.log.warn("Token validation failed: ", validation_result.message)
    return kong.response.exit(401, { message = "Unauthorized: " .. (validation_result.message or "Invalid token") })
  end
  
  -- For system domain, verify system scope
  if tenant_type == "system" and not (claims.scope and claims.scope:find(conf.system_scope)) then
    kong.log.warn("Missing system admin scope for system domain access")
    return kong.response.exit(403, { message = "Forbidden: Insufficient permissions for system access" })
  end
  
  -- For tenant domain, verify tenant context matches token
  if tenant_type == "tenant" and claims.tenant_id ~= tenant_id then
    kong.log.warn("Token tenant_id mismatch: expected " .. tenant_id .. ", got " .. (claims.tenant_id or "nil"))
    return kong.response.exit(403, { message = "Forbidden: Token not valid for this tenant" })
  end
  
  -- Set user information in headers
  kong.service.request.set_header("X-User-ID", claims.sub)
  kong.service.request.set_header("X-User-Email", claims.email or "")
  kong.service.request.set_header("X-User-Roles", claims.roles or "")
  
  -- Store authentication information in Kong context for later use
  kong.ctx.shared.authenticated_user_id = claims.sub
  kong.ctx.shared.authenticated_user_email = claims.email
  kong.ctx.shared.authenticated_tenant_id = tenant_id
  
  kong.log.debug("JWT validation successful for user: " .. claims.sub)
end

-- Export the plugin
return plugin
