# WhatsUp

WhatsUp is a real-time messaging platform inspired by WhatsApp.

The project focuses on real-time communication, message reliability, security, scalability, and modern web technologies.

WhatsUp is currently being developed as a solo software engineering project.

## Tech Stack

### Frontend
- Next.js
- TypeScript
- Tailwind CSS
- Zustand
- TanStack Query

### Backend
- NestJS
- Socket.IO
- PostgreSQL
- Prisma
- Redis

### Infrastructure
- Docker
- MinIO
- GitHub Actions

## Features

Planned and ongoing features include:

- User authentication
- One-to-one messaging
- Group conversations
- Real-time message delivery
- Optimistic message sending
- Retry and reconnect support
- Online/offline presence
- Typing indicators
- Delivered and read receipts
- Media sharing
- Offline message synchronization
- Message history and catch-up
- Authorization and room security

## Project Structure

```text
apps/
  web/       Next.js frontend
  api/       NestJS backend

packages/
  shared/    Shared TypeScript types and realtime contracts

infrastructure/
  docker/
  nginx/

docs/
  architecture/
  database/
  api/
  planning/

scripts/
  Realtime and development utilities
```

## Realtime Architecture

The real-time layer is built with Socket.IO using a `/chat` namespace.

Shared realtime contracts are defined under:

```text
packages/shared/src/realtime/
```

The realtime system is designed around:

- JWT-authenticated socket connections
- Conversation-based rooms
- Server-side authorization
- Client-generated `clientMessageId`
- ACK-based message delivery
- Idempotent retries
- Reconnect and message catch-up
- Presence and typing state
- Delivered/read receipt synchronization

## Development

Install dependencies:

```bash
npm install
```

Start the frontend:

```bash
npm run dev:web
```

Start the backend:

```bash
npm run dev:api
```

Build the shared package:

```bash
npm run build --workspace=@whatsup/shared
```

## Development Workflow

The project is developed incrementally using feature branches.

Main development flow:

```text
feature/* -> develop -> main
```

Each development milestone is completed with:

- Build verification
- Relevant automated tests
- Regression checks
- Documentation updates
- Git commit and push

## Developer

**Faruk Turnalı**

Software Engineering Student  
Full-Stack & Real-Time Systems Development

## Project Status

Under active development.

Current development focuses on the core messaging system, authentication, Socket.IO realtime infrastructure, chat frontend, reconnect handling, presence, receipts, media support, testing, security, and deployment.
