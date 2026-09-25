# WhatsUp

WhatsUp is a real-time messaging platform inspired by WhatsApp.

The project is developed by a team of four developers
with a focus on real-time communication, scalability,
security, and modern web technologies.

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

Planned features include:

- User authentication
- One-to-one messaging
- Group conversations
- Real-time message delivery
- Online/offline presence
- Typing indicators
- Read receipts
- Media sharing
- Offline message synchronization

## Project Structure

```text
apps/
  web/       Next.js frontend
  api/       NestJS backend

packages/
  shared/    Shared TypeScript types

infrastructure/
  docker/
  nginx/

docs/
  architecture/
  database/
  api/
  planning/
```

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

## Team

Developed by a team of four software developers.

## Project Status

Under active development.
