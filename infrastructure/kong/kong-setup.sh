#!/bin/bash
# Kong Gateway Service Registration Script
# Run after Kong is up: ./infrastructure/kong/kong-setup.sh

KONG_ADMIN="http://localhost:8001"

echo "Registering CaseConnect services with Kong..."

# Doctor Service
curl -s -X POST "$KONG_ADMIN/services" \
  -d name=doctor-service \
  -d url=http://host.docker.internal:3001

curl -s -X POST "$KONG_ADMIN/services/doctor-service/routes" \
  -d 'paths[]=/api/v1/case-sheets' \
  -d 'paths[]=/api/v1/op-sheets' \
  -d 'paths[]=/api/v1/emergency' \
  -d 'paths[]=/api/v1/follow-ups' \
  -d name=doctor-routes \
  -d strip_path=false

# HMS Service
curl -s -X POST "$KONG_ADMIN/services" \
  -d name=hms-service \
  -d url=http://host.docker.internal:3002

curl -s -X POST "$KONG_ADMIN/services/hms-service/routes" \
  -d 'paths[]=/api/v1/beds' \
  -d 'paths[]=/api/v1/documents' \
  -d 'paths[]=/api/v1/appointments' \
  -d 'paths[]=/api/v1/schedules' \
  -d name=hms-routes \
  -d strip_path=false

# Patient Service
curl -s -X POST "$KONG_ADMIN/services" \
  -d name=patient-service \
  -d url=http://host.docker.internal:3003

curl -s -X POST "$KONG_ADMIN/services/patient-service/routes" \
  -d 'paths[]=/api/v1/patients' \
  -d 'paths[]=/api/v1/health-vault' \
  -d 'paths[]=/api/v1/triage' \
  -d 'paths[]=/api/v1/consents' \
  -d name=patient-routes \
  -d strip_path=false

# Student Service
curl -s -X POST "$KONG_ADMIN/services" \
  -d name=student-service \
  -d url=http://host.docker.internal:3004

curl -s -X POST "$KONG_ADMIN/services/student-service/routes" \
  -d 'paths[]=/api/v1/cases/practice' \
  -d 'paths[]=/api/v1/learning' \
  -d 'paths[]=/api/v1/leaderboard' \
  -d name=student-routes \
  -d strip_path=false

# Voice AI Service
curl -s -X POST "$KONG_ADMIN/services" \
  -d name=voice-ai-service \
  -d url=http://host.docker.internal:8100

curl -s -X POST "$KONG_ADMIN/services/voice-ai-service/routes" \
  -d 'paths[]=/api/v1/voice' \
  -d name=voice-routes \
  -d strip_path=false

# Analytics Service
curl -s -X POST "$KONG_ADMIN/services" \
  -d name=analytics-service \
  -d url=http://host.docker.internal:3005

curl -s -X POST "$KONG_ADMIN/services/analytics-service/routes" \
  -d 'paths[]=/api/v1/analytics' \
  -d name=analytics-routes \
  -d strip_path=false

# Enable JWT plugin globally
curl -s -X POST "$KONG_ADMIN/plugins" \
  -d name=jwt \
  -d config.claims_to_verify=exp

# Enable rate limiting globally
curl -s -X POST "$KONG_ADMIN/plugins" \
  -d name=rate-limiting \
  -d config.minute=100 \
  -d config.policy=redis \
  -d config.redis_host=cc-redis \
  -d config.redis_port=6379

# Enable request logging
curl -s -X POST "$KONG_ADMIN/plugins" \
  -d name=file-log \
  -d config.path=/dev/stdout

# Enable CORS
curl -s -X POST "$KONG_ADMIN/plugins" \
  -d name=cors \
  -d config.origins=http://localhost:5173 \
  -d config.origins=http://localhost:3000 \
  -d config.methods=GET \
  -d config.methods=POST \
  -d config.methods=PUT \
  -d config.methods=PATCH \
  -d config.methods=DELETE \
  -d config.headers=Authorization \
  -d config.headers=Content-Type \
  -d config.credentials=true

echo "Kong setup complete!"
