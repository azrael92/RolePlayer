# RolePlay - Encrypted Messaging App

## Overview
A messaging application for voice/chat role-play with changing backgrounds, avatars, and scenario management. Features an AI role-play bot for testing scenarios.

## Architecture
- **Frontend**: React + Vite, Tailwind CSS, shadcn/ui, wouter for routing, TanStack Query
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Replit Auth (OIDC)
- **AI**: OpenAI integration for bot chat (SSE streaming)

## Key Features
- Single and group messaging with media support (text, voice, image, video)
- Scenario and scene management with dynamic backgrounds
- AI role-play bot (`/bot` route) with scenario context, streaming responses, and user feedback learning
- Avatar system, contacts with invites, media library
- User profiles

## Project Structure
- `shared/schema.ts` - Database schema (Drizzle)
- `shared/routes.ts` - API route definitions with Zod validation
- `server/routes.ts` - Express route handlers
- `server/storage.ts` - Database storage interface
- `server/bot.ts` - AI role-play bot routes (SSE streaming, feedback)
- `client/src/pages/` - React pages (Chats, ChatDetail, BotChat, Scenarios, Library, Contacts, Profile)
- `client/src/components/Navigation.tsx` - Sidebar navigation

## Bot System
- Bot user ID: "rp-bot"
- Routes: POST /api/bot/start, POST /api/bot/chat (SSE), POST /api/bot/feedback
- Feedback stored per-user in memory, injected into system prompt
- Ownership verified before message injection

## Recent Changes
- Added role-play bot with streaming AI responses
- Added ownership verification on bot chat routes
- Added feedback system that persists across sessions
