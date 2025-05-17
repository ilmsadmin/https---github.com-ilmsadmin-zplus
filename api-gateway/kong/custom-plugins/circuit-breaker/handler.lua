-- Custom Kong plugin for implementing circuit breaker pattern
-- This plugin helps prevent cascading failures when downstream services are unavailable
local plugin = {
  PRIORITY = 800, -- Run before the proxy is executed
  VERSION = "1.0.0"
}

-- Specify the plugin configuration schema
function plugin:schema()
  return {
    name = "circuit-breaker",
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
            },
            {
              error_threshold = { type = "number", default = 50 },
            },
            {
              window_size = { type = "number", default = 10 },
            },
            {
              min_calls = { type = "number", default = 5 },
            },
            {
              open_circuit_timeout = { type = "number", default = 60 },
            },
            {
              health_check_interval = { type = "number", default = 5 },
            },
            {
              exempted_paths = { 
                type = "array", 
                elements = { type = "string" }, 
                default = { 
                  "/api/v1/health", 
                  "/api/v1/metrics", 
                  "/internal/health" 
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
  kong.log.debug("Initializing circuit-breaker plugin")
end

-- Check if the current path is exempted from circuit breaking
local function is_exempted_path(exempted_paths)
  local path = kong.request.get_path()
  for _, exempted_path in ipairs(exempted_paths) do
    if path:find("^" .. exempted_path) then
      return true
    end
  end
  return false
end

-- Get the state of the circuit
local function get_circuit_state(red, service_name)
  local circuit_key = "circuit-breaker:" .. service_name
  
  -- Get circuit state
  local circuit_state = red:hgetall(circuit_key)
  
  -- If no state exists, initialize with default values
  if not circuit_state or #circuit_state == 0 then
    return {
      state = "closed",
      failures = 0,
      successes = 0,
      total = 0,
      last_failure_time = 0,
      last_success_time = 0,
      last_checked_time = 0
    }
  end
  
  -- Convert Redis hash to Lua table
  local state = {}
  for i = 1, #circuit_state, 2 do
    local key = circuit_state[i]
    local value = circuit_state[i + 1]
    -- Convert numeric strings to numbers
    if key ~= "state" then
      value = tonumber(value)
    end
    state[key] = value
  end
  
  return state
end

-- Save circuit state to Redis
local function save_circuit_state(red, service_name, state)
  local circuit_key = "circuit-breaker:" .. service_name
  
  -- Save state to Redis
  red:hmset(circuit_key,
    "state", state.state,
    "failures", state.failures,
    "successes", state.successes,
    "total", state.total,
    "last_failure_time", state.last_failure_time,
    "last_success_time", state.last_success_time,
    "last_checked_time", state.last_checked_time
  )
  
  -- Set key expiration
  red:expire(circuit_key, 86400) -- 24 hours TTL for circuit state
end

-- Record a success for the circuit
local function record_success(red, service_name, state)
  local now = ngx.time()
  
  state.successes = state.successes + 1
  state.total = state.total + 1
  state.last_success_time = now
  state.last_checked_time = now
  
  -- If circuit is half-open and we've had a success, close it
  if state.state == "half-open" then
    state.state = "closed"
    state.failures = 0
    kong.log.notice("Circuit for " .. service_name .. " changed from half-open to closed")
  end
  
  save_circuit_state(red, service_name, state)
end

-- Record a failure for the circuit
local function record_failure(red, service_name, state, conf)
  local now = ngx.time()
  
  state.failures = state.failures + 1
  state.total = state.total + 1
  state.last_failure_time = now
  state.last_checked_time = now
  
  -- Check if we should open the circuit
  if state.state == "closed" and state.total >= conf.min_calls then
    local failure_rate = (state.failures / state.total) * 100
    
    if failure_rate >= conf.error_threshold then
      state.state = "open"
      kong.log.warn("Circuit for " .. service_name .. " changed from closed to open (failure rate: " .. 
                    string.format("%.2f", failure_rate) .. "%)")
    end
  end
  
  save_circuit_state(red, service_name, state)
end

-- Check if the circuit is open and should remain open
local function is_circuit_open(state, conf)
  if state.state == "open" then
    local now = ngx.time()
    local time_since_last_failure = now - state.last_failure_time
    
    -- Check if it's time to try again (transition to half-open)
    if time_since_last_failure >= conf.open_circuit_timeout then
      state.state = "half-open"
      kong.log.notice("Circuit changed from open to half-open")
      return false
    end
    
    return true
  end
  
  return false
end

-- Handle the access phase to check circuit state
function plugin:access(conf)
  -- Skip for exempted paths
  if is_exempted_path(conf.exempted_paths) then
    kong.log.debug("Skipping circuit breaker for exempted path")
    return
  end
  
  -- Get the upstream service name from the route
  local service_name = kong.router.get_service().name
  
  if not service_name then
    kong.log.warn("No service name found for route, using route ID")
    service_name = kong.router.get_route().id
  end
  
  -- Create Redis connection
  local redis = require "resty.redis"
  local red = redis:new()
  red:set_timeout(conf.redis_timeout)
  
  local ok, err = red:connect(conf.redis_host, conf.redis_port)
  if not ok then
    kong.log.err("Failed to connect to Redis: ", err)
    -- Allow the request to proceed if we can't check circuit state
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
  
  -- Get circuit state
  local state = get_circuit_state(red, service_name)
  
  -- Check if circuit is open
  if is_circuit_open(state, conf) then
    -- Keep connection in pool
    local ok, err = red:set_keepalive(10000, 100)
    if not ok then
      kong.log.err("Failed to set Redis keepalive: ", err)
    end
    
    -- Return service unavailable response
    kong.log.warn("Circuit is open for service: " .. service_name)
    return kong.response.exit(503, { 
      message = "Service temporarily unavailable. Please try again later.",
      circuit_state = "open",
      retry_after = conf.open_circuit_timeout
    })
  end
  
  -- If circuit is half-open, we'll allow this request to test the service
  if state.state == "half-open" then
    kong.log.debug("Circuit is half-open for service: " .. service_name .. ", allowing test request")
  end
  
  -- Store the circuit state and service name in shared context for the log phase
  kong.ctx.shared.circuit_state = state
  kong.ctx.shared.circuit_service_name = service_name
  
  -- Keep connection in pool
  local ok, err = red:set_keepalive(10000, 100)
  if not ok then
    kong.log.err("Failed to set Redis keepalive: ", err)
  end
end

-- Handle log phase to record success or failure
function plugin:log(conf)
  -- If we didn't check the circuit in access phase, skip
  if not kong.ctx.shared.circuit_state or not kong.ctx.shared.circuit_service_name then
    return
  end
  
  local state = kong.ctx.shared.circuit_state
  local service_name = kong.ctx.shared.circuit_service_name
  local status = kong.response.get_status()
  
  -- Create Redis connection
  local redis = require "resty.redis"
  local red = redis:new()
  red:set_timeout(conf.redis_timeout)
  
  local ok, err = red:connect(conf.redis_host, conf.redis_port)
  if not ok then
    kong.log.err("Failed to connect to Redis in log phase: ", err)
    return
  end
  
  -- Authenticate with Redis if password is provided
  if conf.redis_password and conf.redis_password ~= "" then
    local res, err = red:auth(conf.redis_password)
    if not res then
      kong.log.err("Failed to authenticate with Redis in log phase: ", err)
      return
    end
  end
  
  -- Select the Redis database
  if conf.redis_database > 0 then
    local res, err = red:select(conf.redis_database)
    if not res then
      kong.log.err("Failed to select Redis database in log phase: ", err)
      return
    end
  end
  
  -- Determine if request was successful (non-5xx response)
  if status >= 500 then
    record_failure(red, service_name, state, conf)
    kong.log.debug("Recorded failure for service: " .. service_name .. " (status: " .. status .. ")")
  else
    record_success(red, service_name, state)
    kong.log.debug("Recorded success for service: " .. service_name .. " (status: " .. status .. ")")
  end
  
  -- Keep connection in pool
  local ok, err = red:set_keepalive(10000, 100)
  if not ok then
    kong.log.err("Failed to set Redis keepalive in log phase: ", err)
  end
end

-- Export the plugin
return plugin
