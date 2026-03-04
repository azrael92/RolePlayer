# RolePlayer

A real-time role-play chat platform where users create characters, pick scenarios, and run tabletop-style sessions with friends or an AI game master. Think D&D meets Discord — full scene visuals, swappable avatars, and a bot that actually drives the story forward.

## What it does

- **Scene-driven chat** — each conversation renders a full background with positioned character avatars. Messages appear as an overlay, visual-novel style.
- **AI game master** — powered by GPT-4o-mini with streaming responses. The bot reads the scenario context and emits scene directives mid-conversation to change backgrounds or swap character appearances as the story unfolds.
- **Scenario library** — 8 built-in scenarios (Enchanted Forest, Dragon's Keep, City of Shadows, etc.) plus user-created ones with genre tags and maturity ratings.
- **Avatar system** — 12 default characters across 6 species (Human, Elf, Dwarf, Demon, Centaur, Fae) with male/female variants. Adjustable scale (50–200%), per-chat assignments.
- **15 themed backgrounds** — forest, castle, tavern, dungeon, ocean, cave, battlefield, and more. Auto-assigned on new chats, swappable anytime.
- **Contacts & group chat** — add friends by username, start direct or group conversations, assign different avatars per participant per chat.
- **User profiles** — editable profiles with QR code sharing for quick contact exchange.

## Tech stack

| Layer | Tools |
|-------|-------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, wouter, TanStack Query, Framer Motion |
| Backend | Express 5, TypeScript, Node.js |
| Database | PostgreSQL, Drizzle ORM |
| Auth | Replit Auth (OpenID Connect) via Passport.js |
| AI | OpenAI API (GPT-4o-mini), Server-Sent Events for streaming |
| Validation | Zod (shared schemas between client and server) |

## Project structure

```
client/
  src/
    pages/          Chat views, bot chat, scenarios, library, contacts, profile
    components/     Sidebar nav, scenario cards, audio player, shadcn/ui primitives
    hooks/          Auth, chat CRUD, scenarios, social features
    lib/            Query client, auth utilities
  public/
    avatars/        12 character PNGs (6 species x 2 genders)
    backgrounds/    15 scene PNGs

server/
    routes.ts       REST API endpoints
    bot.ts          AI game master logic, SSE streaming, scene directives
    storage.ts      Database layer, auto-seeding
    db.ts           Drizzle + PostgreSQL connection

shared/
    schema.ts       Database schema (Drizzle ORM)
    routes.ts       API route contracts with Zod validation
```

## How the AI game master works

The bot receives the full scenario context (description, genre, maturity rating, tags) plus any user feedback from previous sessions. During a conversation, it can emit `<RP_DIRECTIVE>` tags inline with its response to trigger visual changes:

```
<RP_DIRECTIVE>{"bot_species":"centaur","background":"cave"}</RP_DIRECTIVE>
```

The server parses these out of the stream, applies the avatar/background changes to the database, and notifies the client through the SSE done event. The frontend refreshes the scene automatically — so the story's visuals shift as the narrative progresses without any manual input from the player.

## Getting started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- An OpenAI API key
- A Replit app (for OIDC auth) or equivalent OIDC provider

### Setup

```bash
git clone https://github.com/azrael92/Chatapp.git
cd Chatapp
npm install
```

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Push the database schema:

```bash
npm run db:push
```

Run the dev server:

```bash
npm run dev
```

The app runs on `http://localhost:5000` by default.

### Production build

```bash
npm run build
npm start
```

## Database

10 tables covering users, sessions, scenarios, scenes, chats, participants, messages, avatars, library items, and contacts. Full schema lives in `shared/schema.ts`. Relationships are straightforward — users own scenarios and avatars, chats reference scenarios, participants join chats with per-chat avatar assignments.

## API overview

- `POST /api/bot/start` — spin up a bot chat with auto-assigned avatars and a random background
- `POST /api/bot/chat` — send a message, get back a streamed response with optional scene directives
- `POST /api/bot/feedback` — thumbs up/down on bot responses (fed back into the system prompt)
- Standard CRUD for scenarios, chats, messages, avatars, library items, and contacts
- All protected routes require authentication

## License

MIT
