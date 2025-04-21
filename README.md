# ARXIO (v0.1)

**Real-time code & app vulnerability scans for solo developers**

ARXIO allows solo developers to easily scan their code and applications to identify security issues and vulnerabilities in real-time.

## Key Features

1. **Connect a code repository** (GitHub / GitLab / Bitbucket) and select a branch to scan.
2. **Enter or detect a deployed URL** for the repository.
3. **View static (SAST) and dynamic (DAST) scan results** in real-time while editing code in a browser-integrated code editor.
4. **Fix issues**, commit directly back to Git, and run re-scans - without leaving the platform.

## Technical Documentation

### Architecture
Monorepo project (pnpm workspaces) with:
- Next.js 14 application for UI and API routes
- Python FastAPI microservice for security scans
- Shared UI components and TypeScript types

### Core Technologies
- Database: PostgreSQL 15 via Prisma ORM
- Authentication: NextAuth v5 (JWT), Argon2id hashes, Redis sessions
- Real-time: Socket.IO
- Static Analysis: Semgrep, TruffleHog, Snyk CLI
- Dynamic Scans: OWASP ZAP, custom Python scanners
- Background Jobs: Python RQ
- Containers: Docker + docker-compose

## Installation and Running

```bash
# Install dependencies
pnpm install

# Run the project in development mode
pnpm dev

# Run tests
pnpm test

# Build the project for production
pnpm build

# Run the project in production mode
pnpm start
``` 