# Jessoft Sales Backend

Backend API for Jessoft Sales, built with Node.js, TypeScript and Express.

## Requirements

- Node.js 22+
- MySQL 8+

## Setup

```bash
npm install
Copy-Item .env.example .env
```

Set a `JWT_SECRET` with at least 32 characters in `.env`, then run:

```bash
npm run dev
```

The API starts at `http://localhost:3000`.

## Available endpoints

- `GET /` - service status
- `GET /api/health` - health status

## Project structure

```text
src/
  api/              # Controllers, routes and HTTP middleware
  application/      # Services and use cases
  domain/           # Entities and value objects
  infrastructure/   # Database, repositories and external services
  config/           # Environment and application configuration
  shared/           # Cross-cutting shared utilities
```
