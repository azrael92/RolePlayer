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
- Avatar system with 5 species (Human, Elf, Demon, Centaur, Fae), male/female variants, scale control (50-200%)
- Default avatars auto-seeded per user on first access (10 avatars + 10 library items)
- Contacts with invites, media library
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
- `client/public/avatars/` - Default avatar images (5 species x 2 genders)

## Avatar System
- 5 species: Human, Elf, Demon, Centaur, Fae
- Each species has male and female variant images
- Scale: 50-200% (default 100%), controls avatar size in scene window
- Avatars table: id, userId, name, imageUrl, species, gender, scale, isDefault
- Library items table: id, userId, type, name, url, species, gender, isDefault
- Auto-seeded on first GET /api/avatars or GET /api/library call
- Ownership verified on update/delete routes
- Scene window in ChatDetail renders first 3 default avatars with scale-based sizing

## Bot System
- Bot user ID: "rp-bot"
- Routes: POST /api/bot/start, POST /api/bot/chat (SSE), POST /api/bot/feedback
- Feedback stored per-user in memory, injected into system prompt
- Ownership verified before message injection

## Recent Changes
- Added default avatar system with 5 species, male/female variants, and scale control
- Auto-seeding of 10 default avatars + library items per user
- Library page redesigned: Characters tab shows avatar cards with species/gender badges and scale slider
- Scene window updated to show full-body character avatars from avatar system
- Ownership checks on all avatar/library update/delete routes
- Major UI overhaul: migrated from purple fantasy theme to clean Discord/iMessage style
- Replaced custom Navigation with Shadcn Sidebar primitives
