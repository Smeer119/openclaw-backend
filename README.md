# OpenClaw - Second Brain Intelligence Engine

OpenClaw is the TypeScript backend intelligence engine for Cortex.

## Architecture

**Cortex** (React Frontend) → **OpenClaw** (Node.js/TypeScript Backend) → Vector DB + PostgreSQL

## Tech Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL + Prisma ORM
- **Vector DB**: Pinecone
- **AI**: Google Gemini API
- **Auth**: Clerk JWT verification

## Deployment

OpenClaw runs on a secure VPS (AWS, Railway, or DigitalOcean).

## Features

- Memory CRUD operations
- Semantic search with embeddings
- Knowledge graph generation
- Auto-linking related memories
- Real-time sync
- JWT authentication
- Rate limiting

## Setup

See `DEPLOYMENT.md` for deployment instructions.

## Environment Variables

Required on VPS:
```
GEMINI_API_KEY=your_gemini_api_key
PINECONE_API_KEY=your_pinecone_api_key
CLERK_SECRET_KEY=your_clerk_secret_key
DATABASE_URL=postgresql://user:pass@host/db
PORT=8000
ALLOWED_ORIGINS=https://cortex.yourdomain.com
```
