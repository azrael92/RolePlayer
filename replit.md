# RolePlay - Encrypted Messaging App

## Overview
A messaging application for voice/chat role-play with changing backgrounds, avatars, and scenario management. Features an AI role-play bot for testing scenarios with immersive scene visualization.

## Architecture
- **Frontend**: React + Vite, Tailwind CSS, shadcn/ui (Sidebar primitives, Sheet), wouter for routing, TanStack Query
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Replit Auth (OIDC)
- **AI**: OpenAI integration for bot chat (SSE streaming with scene directives)

## Design System
- **Color palette**: Dark gray neutrals (hsl 220 13% 10-22%) with blue accent (hsl 211 100% 50%)
- **Font**: Inter (system sans-serif stack)
- **Style**: Clean Discord/iMessage-inspired, no gradients or fantasy styling
- **Layout**: Shadcn SidebarProvider at App.tsx level, pages render as children without importing sidebar

## Key Features
- **Immersive Scene Window**: Upper portion of chat view shows full background + character avatars; messages overlay below
- Single and group messaging with media support (text, voice, image, video)
- Per-chat avatar assignments and background selection
- Chat settings panel (Sheet) to swap avatar and background from library
- 8 pre-made default scenarios (Enchanted Forest, City of Shadows, Dragon's Keep, etc.)
- AI role-play bot (`/bot` route) with scenario context, streaming responses, user feedback learning, and **scene directives** that auto-change avatars/backgrounds based on story context
- Avatar system with 6 species (Human, Elf, Dwarf, Demon, Centaur, Fae), male/female variants, scale control (50-200%)
- Default avatars auto-seeded per user on first access (12 avatars + 12 library character items)
- 15 default background images auto-seeded per user
- Contacts with invites, media library
- User profiles with QR code sharing

## Project Structure
- `shared/schema.ts` - Database schema (Drizzle)
- `shared/routes.ts` - API route definitions with Zod validation
- `server/routes.ts` - Express route handlers
- `server/storage.ts` - Database storage interface + seeding logic
- `server/bot.ts` - AI role-play bot routes (SSE streaming, directives, feedback)
- `client/src/App.tsx` - Root layout with SidebarProvider and routing
- `client/src/components/AppSidebar.tsx` - Shadcn Sidebar navigation
- `client/src/pages/` - React pages (Chats, ChatDetail, BotChat, Scenarios, Library, Contacts, Profile)
- `client/public/avatars/` - Default avatar images (6 species x 2 genders)
- `client/public/backgrounds/` - Default background images (15 scenes)

## Chat Visual System
- **chats.backgroundUrl**: Per-chat background image URL (set on chat creation, changeable via settings)
- **chatParticipants.avatarId**: Per-participant avatar assignment (auto-assigned on bot chat creation)
- **getChatParticipants**: Returns participant data with joined avatar details
- **Settings Panel**: Sheet component in ChatDetail/BotChat for swapping avatar and background
- Routes: `PATCH /api/chats/:id/visuals`, `PATCH /api/chats/:id/participants/:userId/avatar`
- Both routes verify user is a participant; avatar route additionally ensures users can only change their own avatar

## Avatar System
- 6 species: Human, Elf, Dwarf, Demon, Centaur, Fae
- Each species has male and female variant images
- Scale: 50-200% (default 100%), controls avatar size in scene window
- Avatars table: id, userId, name, imageUrl, species, gender, scale, isDefault
- Library items table: id, userId, type (character/background), name, url, species, gender, isDefault
- Auto-seeded on first GET /api/avatars or GET /api/library call
- Avatar and background seeding are independent (existing users get backgrounds added without re-seeding avatars)
- Scene window renders assigned avatars per participant with scale-based sizing

## Background System
- 15 default backgrounds: forest, city, bedroom, castle, tavern, ocean, mountain, desert, cave, dungeon, village, library, throne-room, garden, battlefield
- Stored in client/public/backgrounds/ as PNG files
- Auto-seeded as library items (type: "background") per user
- Random default background assigned on bot chat creation
- Users can swap backgrounds via the settings panel in any chat

## Scenario System
- 8 pre-made default scenarios auto-seeded on first GET /api/scenarios
- Scenarios are public and available to all users
- Each scenario has title, description, genre, and maturity rating

## Bot System
- Bot user ID: "rp-bot"
- Routes: POST /api/bot/start, POST /api/bot/chat (SSE), POST /api/bot/feedback
- On start: auto-seeds bot avatars, assigns default avatars to both user and bot, sets random background
- **Scene Directives**: System prompt instructs bot to emit `<RP_DIRECTIVE>` JSON tags when story context changes avatar species or background. Server parses directives, applies changes (updates DB), and sends applied changes in SSE `done` event. Frontend auto-refreshes chat data to reflect visual changes.
- Feedback stored per-user in memory, injected into system prompt

## Recent Changes
- **Immersive chat layout**: Scene window now dominates the upper portion of chat view with full background + avatars; messages below
- **Per-chat visuals**: Each chat stores backgroundUrl and participant avatar assignments
- **Chat settings panel**: Sheet component in BotChat and ChatDetail for swapping avatar/background from library
- **Bot auto-assignment**: Bot start auto-assigns default avatars and random background
- **AI scene directives**: Bot can change its own avatar species and the background based on story context
- **Access control**: Visual/avatar update routes verify participant membership
