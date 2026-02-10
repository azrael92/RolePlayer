import type { Express, Request, Response } from "express";
import OpenAI from "openai";
import { storage } from "./storage";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const BOT_USER_ID = "rp-bot";

async function ensureBotUser(): Promise<void> {
  const { db } = await import("./db");
  const { users } = await import("@shared/schema");
  const { eq } = await import("drizzle-orm");
  const [existing] = await db.select().from(users).where(eq(users.id, BOT_USER_ID));
  if (!existing) {
    await db.insert(users).values({
      id: BOT_USER_ID,
      username: "roleplay-bot",
      firstName: "RP",
      lastName: "Bot",
      email: "bot@roleplay.local",
      status: "online",
    });
  }
}

let botUserReady = false;
async function getBotReady() {
  if (!botUserReady) {
    await ensureBotUser();
    botUserReady = true;
  }
}

const AVAILABLE_SPECIES = ["human", "elf", "dwarf", "demon", "centaur", "fae"];
const AVAILABLE_BACKGROUNDS = [
  "forest", "city", "bedroom", "castle", "tavern", "ocean",
  "mountain", "desert", "cave", "dungeon", "village", "library",
  "throne-room", "garden", "battlefield"
];

function buildSystemPrompt(scenario: any, scene: any, feedback: string[]): string {
  let prompt = `You are an immersive role-play partner. Stay in character at all times. Be creative, descriptive, and engaging. Match the tone and style the user sets.`;

  if (scenario) {
    prompt += `\n\nScenario: "${scenario.title}"`;
    if (scenario.description) prompt += `\nDescription: ${scenario.description}`;
    if (scenario.genre) prompt += `\nGenre: ${scenario.genre}`;
    if (scenario.maturityRating) prompt += `\nRating: ${scenario.maturityRating}`;
    if (scenario.tags?.length) prompt += `\nThemes: ${scenario.tags.join(", ")}`;
  }

  if (scene) {
    prompt += `\n\nCurrent Scene: "${scene.title}"`;
  }

  if (feedback.length > 0) {
    prompt += `\n\nUser preferences & feedback (apply these to improve the experience):\n`;
    feedback.forEach((f, i) => {
      prompt += `${i + 1}. ${f}\n`;
    });
  }

  prompt += `\n\nGuidelines:
- Write vivid, atmospheric responses that bring the scene to life
- Use *asterisks* for actions and descriptions
- Keep responses concise but immersive (2-4 paragraphs typically)
- React naturally to the user's messages and adapt the story
- If the user sends an image or describes a visual, incorporate it into the narrative

IMPORTANT - Scene Directives:
When the story context suggests a change in your character's species/form or the scene background, you MUST include a directive block at the very end of your response. The directive is a JSON object on a single line wrapped in <RP_DIRECTIVE> tags.

Available species for avatars: ${AVAILABLE_SPECIES.join(", ")}
Available backgrounds: ${AVAILABLE_BACKGROUNDS.join(", ")}

Examples of when to emit directives:
- User says "you transform into a centaur" → change your species to centaur
- The story moves to a cave → change background to cave
- User says "you're an elf now" → change your species to elf

Format (place at very end of response, after all story text):
<RP_DIRECTIVE>{"bot_species":"centaur","bot_gender":"male","background":"cave"}</RP_DIRECTIVE>

Only include fields that should change. Omit fields that stay the same.
Do NOT include the directive if nothing needs to change visually.`;

  return prompt;
}

function parseDirective(text: string): { cleanText: string; directive: any | null } {
  const match = text.match(/<RP_DIRECTIVE>([\s\S]*?)<\/RP_DIRECTIVE>/);
  if (!match) return { cleanText: text, directive: null };
  try {
    const directive = JSON.parse(match[1]);
    const cleanText = text.replace(/<RP_DIRECTIVE>[\s\S]*?<\/RP_DIRECTIVE>/, "").trim();
    return { cleanText, directive };
  } catch {
    return { cleanText: text.replace(/<RP_DIRECTIVE>[\s\S]*?<\/RP_DIRECTIVE>/, "").trim(), directive: null };
  }
}

async function applyDirective(directive: any, chatId: number): Promise<any> {
  const applied: any = {};
  try {
    if (directive.bot_species) {
      const species = directive.bot_species.toLowerCase();
      const gender = (directive.bot_gender || "male").toLowerCase();
      if (AVAILABLE_SPECIES.includes(species)) {
        const botAvatars = await storage.getAvatars(BOT_USER_ID);
        const match = botAvatars.find(a =>
          a.species === species && a.gender === gender
        ) || botAvatars.find(a => a.species === species);
        if (match) {
          await storage.updateParticipantAvatar(chatId, BOT_USER_ID, match.id);
          applied.botAvatar = { id: match.id, species: match.species, gender: match.gender, imageUrl: match.imageUrl, name: match.name };
        }
      }
    }
    if (directive.background) {
      const bgName = directive.background.toLowerCase();
      const bgUrl = `/backgrounds/${bgName}.png`;
      if (AVAILABLE_BACKGROUNDS.includes(bgName)) {
        await storage.updateChat(chatId, { backgroundUrl: bgUrl });
        applied.backgroundUrl = bgUrl;
      }
    }
  } catch (err) {
    console.error("Failed to apply directive:", err);
  }
  return applied;
}

const userFeedback = new Map<string, string[]>();

async function verifyParticipant(chatId: number, userId: string): Promise<boolean> {
  const participants = await storage.getChatParticipants(chatId);
  return participants.some((p: any) => p.participant?.userId === userId || p.userId === userId);
}

export function registerBotRoutes(app: Express): void {
  app.post("/api/bot/chat", async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const userId = user.claims.sub;
      const { chatId, message, scenarioId } = req.body;

      if (!chatId || !message) {
        return res.status(400).json({ message: "chatId and message are required" });
      }

      const isParticipant = await verifyParticipant(chatId, userId);
      if (!isParticipant) {
        return res.status(403).json({ message: "You are not a participant in this chat" });
      }

      await storage.createChatMessage({
        chatId,
        senderId: userId,
        content: message,
        type: "text",
      });

      let scenario = null;
      let scene = null;
      if (scenarioId) {
        scenario = await storage.getScenario(scenarioId);
        if (scenario) {
          const scenes = await storage.getScenes(scenarioId);
          const chat = await storage.getChat(chatId);
          scene = chat?.currentSceneId
            ? scenes.find((s) => s.id === chat.currentSceneId)
            : scenes[0];
        }
      }

      const existingMessages = await storage.getChatMessages(chatId);
      const feedback = userFeedback.get(userId) || [];
      const systemPrompt = buildSystemPrompt(scenario, scene, feedback);

      const chatHistory: { role: "system" | "user" | "assistant"; content: string }[] = [
        { role: "system", content: systemPrompt },
      ];

      const recentMessages = existingMessages.slice(-20);
      for (const m of recentMessages) {
        chatHistory.push({
          role: m.senderId === BOT_USER_ID ? "assistant" : "user",
          content: m.content || "",
        });
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: chatHistory,
        stream: true,
        max_tokens: 1024,
        temperature: 0.9,
      });

      let fullResponse = "";

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullResponse += content;
          const cleanContent = content.replace(/<RP_DIRECTIVE>[\s\S]*?<\/RP_DIRECTIVE>/g, "");
          if (cleanContent) {
            res.write(`data: ${JSON.stringify({ content: cleanContent })}\n\n`);
          }
        }
      }

      const { cleanText, directive } = parseDirective(fullResponse);

      await storage.createChatMessage({
        chatId,
        senderId: BOT_USER_ID,
        content: cleanText,
        type: "text",
      });

      let appliedDirective = null;
      if (directive) {
        appliedDirective = await applyDirective(directive, chatId);
      }

      res.write(`data: ${JSON.stringify({ done: true, directive: appliedDirective })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Bot chat error:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Bot encountered an error" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ message: "Bot error" });
      }
    }
  });

  app.post("/api/bot/start", async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      await getBotReady();

      const userId = user.claims.sub;
      const { scenarioId, title } = req.body;

      await storage.seedDefaultAvatars(userId);
      await storage.seedDefaultAvatars(BOT_USER_ID);

      const userAvatars = await storage.getAvatars(userId);
      const botAvatars = await storage.getAvatars(BOT_USER_ID);
      const userDefaultAvatar = userAvatars.find(a => a.isDefault) || userAvatars[0];
      const botDefaultAvatar = botAvatars.find(a => a.isDefault) || botAvatars[0];

      const userBgs = await storage.getLibraryItems(userId);
      const defaultBgs = userBgs.filter(i => i.type === "background" && i.isDefault);
      const randomBg = defaultBgs.length > 0 ? defaultBgs[Math.floor(Math.random() * defaultBgs.length)] : null;

      const chat = await storage.createChat({
        title: title || "Bot Role-Play",
        scenarioId: scenarioId || null,
        type: "direct",
        backgroundUrl: randomBg?.url || "/backgrounds/forest.png",
      });

      await storage.addChatParticipant(chat.id, userId, "admin");
      await storage.addChatParticipant(chat.id, BOT_USER_ID, "bot");

      if (userDefaultAvatar) {
        await storage.updateParticipantAvatar(chat.id, userId, userDefaultAvatar.id);
      }
      if (botDefaultAvatar) {
        await storage.updateParticipantAvatar(chat.id, BOT_USER_ID, botDefaultAvatar.id);
      }

      let greeting = "*The scene begins to take shape around you...*\n\nHello! I'm your role-play partner. ";
      if (scenarioId) {
        const scenario = await storage.getScenario(scenarioId);
        if (scenario) {
          greeting = `*The world of "${scenario.title}" unfolds before you...*\n\n`;
          if (scenario.description) {
            greeting += `${scenario.description}\n\n`;
          }
          greeting += `I'm ready to begin this journey with you. What would you like to do first?`;
        }
      } else {
        greeting += `Tell me about the scenario you'd like to explore, or just start with a message and I'll follow your lead!`;
      }

      await storage.createChatMessage({
        chatId: chat.id,
        senderId: BOT_USER_ID,
        content: greeting,
        type: "text",
      });

      res.status(201).json(chat);
    } catch (error) {
      console.error("Bot start error:", error);
      res.status(500).json({ message: "Failed to start bot chat" });
    }
  });

  app.post("/api/bot/feedback", async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const userId = user.claims.sub;
      const { feedback, chatId } = req.body;

      if (!feedback) {
        return res.status(400).json({ message: "feedback is required" });
      }

      const existing = userFeedback.get(userId) || [];
      existing.push(feedback);
      if (existing.length > 10) existing.shift();
      userFeedback.set(userId, existing);

      if (chatId) {
        const isParticipant = await verifyParticipant(chatId, userId);
        if (!isParticipant) {
          return res.status(403).json({ message: "You are not a participant in this chat" });
        }
        await storage.createChatMessage({
          chatId,
          senderId: BOT_USER_ID,
          content: `*Takes note of your feedback: "${feedback}"*\n\nGot it! I'll adjust my approach accordingly. Let's continue...`,
          type: "text",
        });
      }

      res.json({ success: true, feedbackCount: existing.length });
    } catch (error) {
      console.error("Bot feedback error:", error);
      res.status(500).json({ message: "Failed to save feedback" });
    }
  });

  app.get("/api/bot/feedback", async (req: Request, res: Response) => {
    const user = req.user as any;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const feedback = userFeedback.get(user.claims.sub) || [];
    res.json(feedback);
  });
}
