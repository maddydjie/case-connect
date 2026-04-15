# CaseConnect

AI-powered medical documentation and hospital management platform for the Indian healthcare ecosystem.

## Architecture

- **Web App**: React 18 + Vite + Tailwind CSS + shadcn/ui
- **Mobile App**: React Native + Expo
- **API Gateway**: Kong (JWT + RBAC + Rate Limiting)
- **Backend Services**: Node.js + Express + TypeScript
- **Voice AI**: Python FastAPI + Whisper + scispaCy
- **Primary DB**: PostgreSQL 16 + Prisma ORM
- **Cache**: Redis 7
- **Document Store**: MongoDB 7
- **Search**: Elasticsearch 8
- **Object Storage**: MinIO (S3-compatible)
- **Auth**: Auth0 (MFA + SSO)
- **Realtime**: Socket.io

## Getting Started

### Prerequisites

- Node.js >= 20
- pnpm >= 9.12
- Docker & Docker Compose
- Python >= 3.11 (for voice-ai service)

### Setup

```bash
# Install dependencies
pnpm install

# Start infrastructure (PostgreSQL, Redis, MongoDB, Elasticsearch, MinIO, Kong)
pnpm docker:up

# Generate Prisma client
pnpm db:generate

# Push database schema
pnpm db:push

# Start all services in development mode
pnpm dev
```

### Environment Variables

Copy `.env.example` to `.env` in each service directory and configure:

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `MONGODB_URL` - MongoDB connection string
- `AUTH0_DOMAIN` - Auth0 tenant domain
- `AUTH0_AUDIENCE` - Auth0 API audience
- `AUTH0_CLIENT_ID` - Auth0 application client ID
- `ELASTICSEARCH_URL` - Elasticsearch connection
- `MINIO_ENDPOINT` - MinIO/S3 endpoint

## Project Structure

```
caseconnect/
├── apps/
│   ├── web/              # React 18 web application
│   ├── mobile/           # React Native + Expo mobile app
│   └── api/              # Express.js API orchestrator
├── services/
│   ├── doctor-service/   # Clinical documentation
│   ├── student-service/  # Medical education
│   ├── hms-service/      # Hospital management (LiveBedMap, DocuStream, Scheduling)
│   ├── patient-service/  # Patient health vault + ABDM
│   ├── voice-ai/         # Voice AI pipeline (Python FastAPI)
│   └── analytics-service/# Analytics & reporting
├── packages/
│   ├── ui/               # Shared React components
│   ├── config/           # Shared configs (TSConfig, ESLint, Tailwind)
│   ├── database/         # Prisma schema + client
│   ├── types/            # Shared TypeScript types
│   ├── utils/            # Shared utilities
│   └── auth/             # Auth0 SDK wrappers + RBAC
└── infrastructure/
    ├── docker/           # Dockerfiles
    ├── docker-compose.yml
    ├── kong/             # Kong gateway config
    └── terraform/        # Cloud infrastructure
```

## Key Features

- **Voice-First Documentation**: 67% reduction in doctor documentation time
- **LiveBedMap**: Real-time hospital bed occupancy visualization
- **DocuStream**: Automated report pipeline with OCR
- **AI Case Tutor**: Medical education with 10K+ case simulations
- **Patient Health Vault**: ABDM-compliant unified health records
- **Enterprise Security**: AES-256, TLS 1.3, DPDP Act compliance

## License

Proprietary - All rights reserved.
