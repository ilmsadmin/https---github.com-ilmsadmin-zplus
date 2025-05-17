#!/bin/bash
# filepath: d:\www\multi-tenant\scripts\minio\05_minio_setup.sh
# MinIO setup script for multi-tenant system
# Creates buckets per tenant with policies for isolation

# Environment variables
MINIO_ENDPOINT="http://localhost:9000"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_ALIAS="myminio"

echo "Setting up MinIO for multi-tenant system..."

# Install MinIO client if not already available
if ! command -v mc &> /dev/null; then
    echo "Installing MinIO client..."
    wget https://dl.min.io/client/mc/release/linux-amd64/mc -O /usr/local/bin/mc
    chmod +x /usr/local/bin/mc
fi

# Configure MinIO client
mc alias set $MINIO_ALIAS $MINIO_ENDPOINT $MINIO_ACCESS_KEY $MINIO_SECRET_KEY

# Enable MinIO server-side encryption (optional)
mc admin config set $MINIO_ALIAS identity_openid encryption_key=minio-encryption-key-change-me

# Create system buckets
mc mb --ignore-existing $MINIO_ALIAS/system-assets
mc mb --ignore-existing $MINIO_ALIAS/system-logs
mc mb --ignore-existing $MINIO_ALIAS/system-backups

# Set lifecycle policy for system logs (delete after 90 days)
cat > /tmp/lifecycle-system-logs.json << EOF
{
  "Rules": [
    {
      "ID": "Expire old logs",
      "Status": "Enabled",
      "Expiration": {
        "Days": 90
      }
    }
  ]
}
EOF
mc ilm import $MINIO_ALIAS/system-logs < /tmp/lifecycle-system-logs.json

# Set lifecycle policy for system backups (delete after 30 days)
cat > /tmp/lifecycle-system-backups.json << EOF
{
  "Rules": [
    {
      "ID": "Expire old backups",
      "Status": "Enabled",
      "Expiration": {
        "Days": 30
      }
    }
  ]
}
EOF
mc ilm import $MINIO_ALIAS/system-backups < /tmp/lifecycle-system-backups.json

# Create tenant buckets (from PostgreSQL tenant table)
# In a real scenario, you would query the database to get tenant IDs/names
# For demo purposes, we'll create buckets for tenant1
TENANTS=("tenant1")
BUCKET_TYPES=("files" "media" "backups" "exports")

for tenant in "${TENANTS[@]}"; do
    # Create tenant buckets
    for type in "${BUCKET_TYPES[@]}"; do
        BUCKET_NAME="${tenant}-${type}"
        echo "Creating bucket: $BUCKET_NAME"
        mc mb --ignore-existing $MINIO_ALIAS/$BUCKET_NAME
        
        # Enable versioning for files bucket
        if [ "$type" == "files" ]; then
            mc version enable $MINIO_ALIAS/$BUCKET_NAME
        fi
        
        # Create tenant policy
        POLICY_NAME="${tenant}-policy"
        cat > /tmp/${POLICY_NAME}.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket",
                "s3:GetBucketLocation",
                "s3:ListBucketMultipartUploads"
            ],
            "Resource": [
                "arn:aws:s3:::${tenant}-*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:ListMultipartUploadParts",
                "s3:AbortMultipartUpload"
            ],
            "Resource": [
                "arn:aws:s3:::${tenant}-*/*"
            ]
        }
    ]
}
EOF
        
        # Set lifecycle policies based on bucket type
        if [ "$type" == "backups" ]; then
            # Backups expire after 7 days
            cat > /tmp/lifecycle-${BUCKET_NAME}.json << EOF
{
  "Rules": [
    {
      "ID": "Expire old backups",
      "Status": "Enabled",
      "Expiration": {
        "Days": 7
      }
    }
  ]
}
EOF
            mc ilm import $MINIO_ALIAS/$BUCKET_NAME < /tmp/lifecycle-${BUCKET_NAME}.json
        fi
        
        if [ "$type" == "exports" ]; then
            # Exports expire after 2 days
            cat > /tmp/lifecycle-${BUCKET_NAME}.json << EOF
{
  "Rules": [
    {
      "ID": "Expire old exports",
      "Status": "Enabled",
      "Expiration": {
        "Days": 2
      }
    }
  ]
}
EOF
            mc ilm import $MINIO_ALIAS/$BUCKET_NAME < /tmp/lifecycle-${BUCKET_NAME}.json
        fi
    done
    
    # Create and apply policy
    mc admin policy add $MINIO_ALIAS $POLICY_NAME /tmp/${POLICY_NAME}.json
    
    # In a real scenario, you would create a user per tenant
    # mc admin user add $MINIO_ALIAS ${tenant}-user ${tenant}-password
    # mc admin policy set $MINIO_ALIAS $POLICY_NAME user=${tenant}-user
done

# Set cors configuration for public access to media files
cat > /tmp/cors-config.json << EOF
{
    "cors": [
        {
            "allowedHeaders": ["*"],
            "allowedMethods": ["GET"],
            "allowedOrigins": ["*"],
            "exposeHeaders": ["ETag", "Content-Length", "Content-Type"],
            "maxAgeSeconds": 3600
        }
    ]
}
EOF

# Apply CORS configuration to media buckets
for tenant in "${TENANTS[@]}"; do
    mc admin bucket cors set $MINIO_ALIAS/${tenant}-media /tmp/cors-config.json
done

# Set up CDN integration example (using MinIO's built-in functionality)
# In a production environment, you would configure a proper CDN like Cloudflare or AWS CloudFront
mc anonymous set download $MINIO_ALIAS/${TENANTS[0]}-media

echo "MinIO setup complete with tenant isolation and lifecycle policies"
