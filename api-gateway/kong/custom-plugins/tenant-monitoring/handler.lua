-- Custom Kong plugin for enhanced monitoring with Prometheus and OpenTelemetry
-- This plugin collects detailed metrics and distributed tracing information
local plugin = {
  PRIORITY = 700, -- Run after most plugins
  VERSION = "1.0.0"
}

-- Specify the plugin configuration schema
function plugin:schema()
  return {
    name = "tenant-monitoring",
    fields = {
      {
        config = {
          type = "record",
          fields = {
            {
              collect_metrics = { type = "boolean", default = true },
            },
            {
              collect_traces = { type = "boolean", default = true },
            },
            {
              metrics_prefix = { type = "string", default = "kong_tenant_" },
            },
            {
              trace_header_name = { type = "string", default = "X-B3-TraceId" },
            },
            {
              span_header_name = { type = "string", default = "X-B3-SpanId" },
            },
            {
              parent_header_name = { type = "string", default = "X-B3-ParentSpanId" },
            },
            {
              sampled_header_name = { type = "string", default = "X-B3-Sampled" },
            },
            {
              detailed_status_metrics = { type = "boolean", default = true },
            },
            {
              detailed_latency_metrics = { type = "boolean", default = true },
            },
            {
              collect_tenant_metrics = { type = "boolean", default = true },
            },
            {
              collect_status_code_metrics = { type = "boolean", default = true },
            }
          }
        }
      }
    }
  }
end

-- Ensure prometheus library is available
local prometheus

-- Initialize plugin with dependencies
function plugin:init_worker()
  kong.log.debug("Initializing tenant-monitoring plugin")
  
  -- Initialize Prometheus if it's available
  local ok, prom = pcall(require, "kong.plugins.prometheus.prometheus")
  if ok then
    prometheus = prom.new()
    
    -- Define the metrics
    -- Counter for total requests by tenant
    prometheus:counter(
      "tenant_http_requests_total",
      "Total number of HTTP requests by tenant",
      {"tenant_id", "service", "route"}
    )
    
    -- Counter for requests by status code and tenant
    prometheus:counter(
      "tenant_http_requests_status_total",
      "Total number of HTTP requests by status code and tenant",
      {"tenant_id", "service", "route", "status"}
    )
    
    -- Histogram for request latency by tenant
    prometheus:histogram(
      "tenant_http_request_duration_seconds",
      "HTTP request latency in seconds by tenant",
      {"tenant_id", "service", "route"},
      {0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10}
    )
    
    -- Counter for circuit breaker state changes
    prometheus:counter(
      "tenant_circuit_breaker_state_changes_total",
      "Total number of circuit breaker state changes",
      {"service", "from_state", "to_state"}
    )
    
    -- Gauge for circuit breaker state (0=closed, 1=half-open, 2=open)
    prometheus:gauge(
      "tenant_circuit_breaker_state",
      "Current state of the circuit breaker (0=closed, 1=half-open, 2=open)",
      {"service"}
    )
    
    -- Counter for rate limit hits
    prometheus:counter(
      "tenant_rate_limit_hits_total",
      "Total number of rate limit hits by tenant",
      {"tenant_id", "package"}
    )
    
    -- Histogram for request size by tenant
    prometheus:histogram(
      "tenant_http_request_size_bytes",
      "HTTP request size in bytes by tenant",
      {"tenant_id", "service", "route"},
      {10, 100, 1000, 10000, 100000, 1000000, 10000000}
    )
    
    -- Histogram for response size by tenant
    prometheus:histogram(
      "tenant_http_response_size_bytes",
      "HTTP response size in bytes by tenant",
      {"tenant_id", "service", "route"},
      {10, 100, 1000, 10000, 100000, 1000000, 10000000}
    )
    
    kong.log.debug("Tenant monitoring metrics registered")
  else
    kong.log.warn("Prometheus library not available, metrics collection disabled")
  end
end

-- Generate a random trace ID if none is present
local function generate_trace_id()
  return string.format("%016x%016x", 
    math.random(0, 0xFFFFFFFFFFFFFFFF), 
    math.random(0, 0xFFFFFFFFFFFFFFFF)
  )
end

-- Generate a random span ID
local function generate_span_id()
  return string.format("%016x", math.random(0, 0xFFFFFFFFFFFFFFFF))
end

-- Handle the request phase
function plugin:access(conf)
  if not conf.collect_traces then
    return
  end
  
  -- Start timing the request
  kong.ctx.plugin.start_time = ngx.now()
  
  -- Get or generate trace context
  local trace_id = kong.request.get_header(conf.trace_header_name) or generate_trace_id()
  local span_id = kong.request.get_header(conf.span_header_name) or generate_span_id()
  local parent_span_id = kong.request.get_header(conf.parent_header_name)
  local sampled = kong.request.get_header(conf.sampled_header_name) or "1"
  
  -- Store trace context for use in the response
  kong.ctx.plugin.trace_id = trace_id
  kong.ctx.plugin.span_id = span_id
  kong.ctx.plugin.parent_span_id = parent_span_id
  kong.ctx.plugin.sampled = sampled
  
  -- Add trace headers to upstream request
  kong.service.request.set_header(conf.trace_header_name, trace_id)
  kong.service.request.set_header(conf.span_header_name, span_id)
  if parent_span_id then
    kong.service.request.set_header(conf.parent_header_name, parent_span_id)
  end
  kong.service.request.set_header(conf.sampled_header_name, sampled)
  
  -- Add OpenTelemetry trace context
  kong.service.request.set_header("traceparent", "00-" .. trace_id .. "-" .. span_id .. "-" .. (sampled == "1" and "01" or "00"))
  
  -- Get tenant information
  local tenant_id = kong.request.get_header("X-Tenant-ID") or "unknown"
  kong.ctx.plugin.tenant_id = tenant_id
  
  -- Store request size for metrics
  kong.ctx.plugin.request_size = tonumber(kong.request.get_header("content-length")) or 0
end

-- Handle the response headers
function plugin:header_filter(conf)
  if not conf.collect_traces then
    return
  end
  
  -- Add trace headers to response
  if kong.ctx.plugin.trace_id then
    kong.response.set_header(conf.trace_header_name, kong.ctx.plugin.trace_id)
  end
  
  if kong.ctx.plugin.span_id then
    kong.response.set_header(conf.span_header_name, kong.ctx.plugin.span_id)
  end
  
  if kong.ctx.plugin.sampled then
    kong.response.set_header(conf.sampled_header_name, kong.ctx.plugin.sampled)
  end
  
  -- Add OpenTelemetry trace context
  if kong.ctx.plugin.trace_id and kong.ctx.plugin.span_id then
    local sampled_flag = kong.ctx.plugin.sampled == "1" and "01" or "00"
    kong.response.set_header("traceparent", "00-" .. kong.ctx.plugin.trace_id .. "-" .. kong.ctx.plugin.span_id .. "-" .. sampled_flag)
  end
  
  -- Store response size for metrics
  kong.ctx.plugin.response_size = tonumber(kong.response.get_header("content-length")) or 0
end

-- Handle the log phase to record metrics
function plugin:log(conf)
  if not conf.collect_metrics or not prometheus then
    return
  end
  
  local tenant_id = kong.ctx.plugin.tenant_id or "unknown"
  local service_name = "unknown"
  local route_name = "unknown"
  
  -- Try to get service and route names
  local service = kong.router.get_service()
  if service then
    service_name = service.name or service.id or "unknown"
  end
  
  local route = kong.router.get_route()
  if route then
    route_name = route.name or route.id or "unknown"
  end
  
  -- Get status code
  local status = kong.response.get_status()
  
  -- Increment total requests counter
  prometheus:counter_inc(
    "tenant_http_requests_total",
    1,
    {tenant_id, service_name, route_name}
  )
  
  -- Increment requests by status counter
  if conf.collect_status_code_metrics then
    prometheus:counter_inc(
      "tenant_http_requests_status_total",
      1,
      {tenant_id, service_name, route_name, status}
    )
  end
  
  -- Record request latency
  if conf.detailed_latency_metrics and kong.ctx.plugin.start_time then
    local request_latency = ngx.now() - kong.ctx.plugin.start_time
    prometheus:histogram_observe(
      "tenant_http_request_duration_seconds",
      request_latency,
      {tenant_id, service_name, route_name}
    )
  end
  
  -- Record request and response size
  if kong.ctx.plugin.request_size then
    prometheus:histogram_observe(
      "tenant_http_request_size_bytes",
      kong.ctx.plugin.request_size,
      {tenant_id, service_name, route_name}
    )
  end
  
  if kong.ctx.plugin.response_size then
    prometheus:histogram_observe(
      "tenant_http_response_size_bytes",
      kong.ctx.plugin.response_size,
      {tenant_id, service_name, route_name}
    )
  end
  
  -- Record circuit breaker metrics if relevant
  if status >= 500 and kong.ctx.shared.circuit_state and kong.ctx.shared.circuit_service_name then
    local state_value = 0 -- closed
    if kong.ctx.shared.circuit_state.state == "half-open" then
      state_value = 1
    elseif kong.ctx.shared.circuit_state.state == "open" then
      state_value = 2
    end
    
    prometheus:gauge_set(
      "tenant_circuit_breaker_state",
      state_value,
      {kong.ctx.shared.circuit_service_name}
    )
  end
  
  -- Record rate limit hits if status is 429
  if status == 429 and tenant_id ~= "unknown" then
    local tenant_package = kong.request.get_header("X-Tenant-Package") or "unknown"
    prometheus:counter_inc(
      "tenant_rate_limit_hits_total",
      1,
      {tenant_id, tenant_package}
    )
  end
  
  -- Log metrics for debugging
  kong.log.debug("Recorded metrics for tenant: " .. tenant_id .. ", service: " .. service_name .. ", status: " .. status)
end

-- Export the plugin
return plugin
