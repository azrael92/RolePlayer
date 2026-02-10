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
- Scene window uses default background from library when no scenario background is set
- Chat messages fade into the scene window from below (CSS mask)
- Scenario and scene management with dynamic backgrounds
- 8 pre-made default scenarios (Enchanted Forest, City of Shadows, Dragon's Keep, etc.)
- AI role-play bot (`/bot` route) with scenario context, streaming responses, and user feedback learning
- Avatar system with 6 species (Human, Elf, Dwarf, Demon, Centaur, Fae), male/female variants, scale control (50-200%)
- Default avatars auto-seeded per user on first access (12 avatars + 12 library character items)
- 15 default background images auto-seeded per user (forest, city, bedroom, castle, tavern, ocean, mountain, desert, cave, dungeon, village, library, throne room, garden, battlefield)
- Contacts with invites, media library
- User profiles with QR code sharing

## Project Structure
- `shared/schema.ts` - Database schema (Drizzle)
- `shared/routes.ts` - API route definitions with Zod validation
- `server/routes.ts` - Express route handlers
- `server/storage.ts` - Database storage interface + seeding logic
- `server/bot.ts` - AI role-play bot routes (SSE streaming, feedback)
- `client/src/App.tsx` - Root layout with SidebarProvider and routing
- `client/src/components/AppSidebar.tsx` - Shadcn Sidebar navigation
- `client/src/pages/` - React pages (Chats, ChatDetail, BotChat, Scenarios, Library, Contacts, Profile)
- `client/public/avatars/` - Default avatar images (6 species x 2 genders)
- `client/public/backgrounds/` - Default background images (15 scenes)

## Avatar System
- 6 species: Human, Elf, Dwarf, Demon, Centaur, Fae
- Each species has male and female variant images
- Scale: 50-200% (default 100%), controls avatar size in scene window
- Avatars table: id, userId, name, imageUrl, species, gender, scale, isDefault
- Library items table: id, userId, type (character/background), name, url, species, gender, isDefault
- Auto-seeded on first GET /api/avatars or GET /api/library call
- Avatar and background seeding are independent (existing users get backgrounds added without re-seeding avatars)
- Ownership verified on update/delete routes
- Scene window in ChatDetail renders first 3 default avatars with scale-based sizing

## Background System
- 15 default backgrounds: forest, city, bedroom, castle, tavern, ocean, mountain, desert, cave, dungeon, village, library, throne-room, garden, battlefield
- Stored in client/public/backgrounds/ as PNG files
- Auto-seeded as library items (type: "background") per user
- ChatDetail scene window picks a default background based on chatId when no scenario background is set
- Users can upload their own backgrounds via the Library page

## Scenario System
- 8 pre-made default scenarios auto-seeded on first GET /api/scenarios
- Scenarios are public and available to all users
- Each scenario has title, description, genre, and maturity rating
- Users can create their own scenarios via the Scenarios page

## Bot System
- Bot user ID: "rp-bot"
- Routes: POST /api/bot/start, POST /api/bot/chat (SSE), POST /api/bot/feedback
- Feedback stored per-user in memory, injected into system prompt
- Ownership verified before message injection

## Recent Changes
- Added Dwarf species (male/female) to avatar system (now 6 species, 12 avatars)
- Generated 15 default background images for the library
- Added default background seeding per user (independent of avatar seeding)
- Created 8 pre-made default scenarios with seeding on first access
- Scene window now shows default background from library instead of plain gradient
- Seeding logic separated: avatars and backgrounds seed independently to handle existing users
