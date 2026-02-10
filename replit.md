# RolePlay - Encrypted Messaging App

## Overview
A messaging application for voice/chat role-play with changing backgrounds, avatars, and scenario management. Features an AI role-play bot for testing scenarios.

## Architecture
- **Frontend**: React + Vite, Tailwind CSS, shadcn/ui (Sidebar primitives), wouter for routing, TanStack Query
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Replit Auth (OIDC)
- **AI**: OpenAI integration for bot chat (SSE streaming)

## Design System
- **Color palette**: Dark gray neutrals (hsl 220 13% 10-22%) with blue accent (hsl 211 100% 50%)
- **Font**: Inter (system sans-serif stack)
- **Style**: Clean Discord/iMessage-inspired, no gradients or fantasy styling
- **Layout**: Shadcn SidebarProvider at App.tsx level, pages render as children without importing sidebar

## Key Features
- Single and group messaging with media support (text, voice, image, video)
- Scene visualization window at top of chat showing dynamic backgrounds and participant avatars
- Chat messages fade into the scene window from below (CSS mask)
- Default gradient fallback when no scene background image is set
- Scenario and scene management with dynamic backgrounds
- AI role-play bot (`/bot` route) with scenario context, streaming responses, and user feedback learning
- Avatar system, contacts with invites, media library
- User profiles with QR code sharing

## Project Structure
- `shared/schema.ts` - Database schema (Drizzle)
- `shared/routes.ts` - API route definitions with Zod validation
- `server/routes.ts` - Express route handlers
- `server/storage.ts` - Database storage interface
- `server/bot.ts` - AI role-play bot routes (SSE streaming, feedback)
- `client/src/App.tsx` - Root layout with SidebarProvider and routing
- `client/src/components/AppSidebar.tsx` - Shadcn Sidebar navigation
- `client/src/pages/` - React pages (Chats, ChatDetail, BotChat, Scenarios, Library, Contacts, Profile)

## Bot System
- Bot user ID: "rp-bot"
- Routes: POST /api/bot/start, POST /api/bot/chat (SSE), POST /api/bot/feedback
- Feedback stored per-user in memory, injected into system prompt
- Ownership verified before message injection

## Recent Changes
- Major UI overhaul: migrated from purple fantasy theme to clean Discord/iMessage style
- Replaced custom Navigation with Shadcn Sidebar primitives
- Added scene visualization window with dynamic backgrounds and avatars
- Chat text fades into scene window via CSS mask
- Default gradient fallback for chats without scene backgrounds
- All pages unified with consistent header bar and layout structure
