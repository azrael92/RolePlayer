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
- If the user sends an image or describes a visual, incorporate it into the narrative`;

  return prompt;
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
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      await storage.createChatMessage({
        chatId,
        senderId: BOT_USER_ID,
        content: fullResponse,
        type: "text",
      });

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
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

      const chat = await storage.createChat({
        title: title || "Bot Role-Play",
        scenarioId: scenarioId || null,
        type: "direct",
      });

      await storage.addChatParticipant(chat.id, userId, "admin");
      await storage.addChatParticipant(chat.id, BOT_USER_ID, "bot");

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
