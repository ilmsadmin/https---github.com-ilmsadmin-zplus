// MongoDB setup script for multi-tenant system
// Creates database, collections, indexes, and time series collection

// Connect to MongoDB instance
// Use admin database to create new database
db = db.getSiblingDB('admin');

// Create multi_tenant database with authorization
db.createUser({
  user: 'multi_tenant_admin',
  pwd: 'secure_password', // Replace with secure password in production
  roles: [
    { role: 'dbOwner', db: 'multi_tenant' }
  ]
});

// Switch to multi_tenant database
db = db.getSiblingDB('multi_tenant');

// Create collections
db.createCollection("system_logs");
db.createCollection("analytics_data");
db.createCollection("module_configs");
db.createCollection("user_events");

// Create time-series collection for performance metrics
db.createCollection("performance_metrics", {
  timeseries: {
    timeField: "timestamp",
    metaField: "metadata",
    granularity: "seconds"
  }
});

// Create indexes for system_logs collection
db.system_logs.createIndex({ "level": 1, "timestamp": -1 });
db.system_logs.createIndex({ "tenant_id": 1, "timestamp": -1 });
db.system_logs.createIndex({ "service": 1, "timestamp": -1 });
db.system_logs.createIndex({ "timestamp": -1 });
db.system_logs.createIndex({ 
  "message": "text", 
  "context": "text" 
}, { name: "logs_text_search" });

// Set TTL (Time To Live) for logs based on their level
db.system_logs.createIndex({ "timestamp": 1 }, { 
  expireAfterSeconds: 30 * 24 * 60 * 60, // 30 days for regular logs
  partialFilterExpression: { "level": { $in: ["info", "debug"] } }
});
db.system_logs.createIndex({ "timestamp": 1 }, { 
  expireAfterSeconds: 90 * 24 * 60 * 60, // 90 days for warning and error logs
  partialFilterExpression: { "level": { $in: ["warning", "error"] } }
});

// Create indexes for analytics_data collection
db.analytics_data.createIndex({ "tenant_id": 1, "timestamp": -1 });
db.analytics_data.createIndex({ "type": 1, "timestamp": -1 });
db.analytics_data.createIndex({ "timestamp": -1 });
db.analytics_data.createIndex({ "tenant_id": 1, "type": 1, "timestamp": -1 });

// Set TTL for analytics data
db.analytics_data.createIndex({ "timestamp": 1 }, { 
  expireAfterSeconds: 365 * 24 * 60 * 60 // 1 year retention
});

// Create indexes for module_configs collection
db.module_configs.createIndex({ "tenant_id": 1, "module_id": 1 }, { unique: true });
db.module_configs.createIndex({ "module_id": 1 });

// Create indexes for user_events collection
db.user_events.createIndex({ "tenant_id": 1, "user_id": 1, "timestamp": -1 });
db.user_events.createIndex({ "event_type": 1, "timestamp": -1 });
db.user_events.createIndex({ "timestamp": -1 });

// Set TTL for user events
db.user_events.createIndex({ "timestamp": 1 }, { 
  expireAfterSeconds: 180 * 24 * 60 * 60 // 6 months retention
});

// Create indexes for performance_metrics time-series collection
db.performance_metrics.createIndex({ "metadata.tenant_id": 1, "timestamp": -1 });
db.performance_metrics.createIndex({ "metadata.service": 1, "timestamp": -1 });
db.performance_metrics.createIndex({ "metadata.tenant_id": 1, "metadata.service": 1, "timestamp": -1 });

// Create validation rules for collections
db.runCommand({
  collMod: "system_logs",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["level", "message", "timestamp", "service"],
      properties: {
        level: {
          bsonType: "string",
          enum: ["debug", "info", "warning", "error", "critical"]
        },
        message: {
          bsonType: "string"
        },
        timestamp: {
          bsonType: "date"
        },
        service: {
          bsonType: "string"
        },
        tenant_id: {
          bsonType: ["string", "null"]
        }
      }
    }
  }
});

db.runCommand({
  collMod: "module_configs",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["tenant_id", "module_id", "config"],
      properties: {
        tenant_id: {
          bsonType: "string"
        },
        module_id: {
          bsonType: "string"
        },
        config: {
          bsonType: "object"
        },
        version: {
          bsonType: "string"
        }
      }
    }
  }
});

// Create sample documents
db.system_logs.insertMany([
  {
    level: "info",
    message: "System initialized",
    timestamp: new Date(),
    service: "system-service",
    context: {
      init_time: 1200,
      component: "core"
    }
  },
  {
    level: "debug",
    message: "Connection pool established",
    timestamp: new Date(),
    service: "database-service",
    context: {
      pool_size: 10,
      timeout: 30000
    }
  }
]);

// Insert sample module config
db.module_configs.insertOne({
  tenant_id: "550e8400-e29b-41d4-a716-446655440010",
  module_id: "550e8400-e29b-41d4-a716-446655440002",
  config: {
    theme: {
      primaryColor: "#1976d2",
      secondaryColor: "#dc004e",
      textColor: "#333333",
      fontSize: "16px"
    },
    features: {
      fileUpload: true,
      commenting: true,
      sharing: true
    },
    notifications: {
      email: true,
      inApp: true,
      sms: false
    }
  },
  version: "1.0.0",
  created_at: new Date(),
  updated_at: new Date()
});

print("MongoDB setup complete: multi_tenant database configured with collections, indexes, and TTL settings");
