import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerAudioRoutes } from "./replit_integrations/audio";
import { registerImageRoutes } from "./replit_integrations/image";
import { registerBotRoutes } from "./bot";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // 1. Setup Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // 2. Register Integration Routes
  registerAudioRoutes(app); // Voice chat API
  registerImageRoutes(app); // Image generation
  registerBotRoutes(app);   // Role-play bot

  // 3. App Routes

  // Scenarios
  app.get(api.scenarios.list.path, async (req, res) => {
    const scenarios = await storage.getScenarios();
    res.json(scenarios);
  });

  app.post(api.scenarios.create.path, async (req, res) => {
    try {
      const input = api.scenarios.create.input.parse(req.body);
      const user = req.user as any;
      const scenario = await storage.createScenario({ ...input, authorId: user?.claims?.sub });
      res.status(201).json(scenario);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  });

  app.get(api.scenarios.get.path, async (req, res) => {
    const scenario = await storage.getScenario(Number(req.params.id));
    if (!scenario) return res.status(404).json({ message: "Scenario not found" });
    const scenes = await storage.getScenes(Number(req.params.id));
    res.json({ ...scenario, scenes });
  });

  app.put(api.scenarios.update.path, async (req, res) => {
    const input = api.scenarios.update.input.parse(req.body);
    const updated = await storage.updateScenario(Number(req.params.id), input);
    res.json(updated);
  });

  // Scenes
  app.post(api.scenes.create.path, async (req, res) => {
    const input = api.scenes.create.input.parse(req.body);
    const scene = await storage.createScene(input);
    res.status(201).json(scene);
  });

  // Chats
  app.get(api.chats.list.path, async (req, res) => {
    const user = req.user as any;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const chats = await storage.getChats(user.claims.sub);
    res.json(chats);
  });

  app.post(api.chats.create.path, async (req, res) => {
    const user = req.user as any;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const { scenarioId, participantIds, title } = req.body;
    
    // Create chat
    const chat = await storage.createChat({ 
      title: title || "New Chat", 
      scenarioId, 
      type: participantIds?.length > 1 ? 'group' : 'direct'
    });

    // Add participants (creator + invited)
    await storage.addChatParticipant(chat.id, user.claims.sub, 'admin');
    for (const uid of participantIds || []) {
      await storage.addChatParticipant(chat.id, uid, 'member');
    }

    res.status(201).json(chat);
  });

  app.get(api.chats.get.path, async (req, res) => {
    const chat = await storage.getChat(Number(req.params.id));
    if (!chat) return res.status(404).json({ message: "Chat not found" });
    const participants = await storage.getChatParticipants(chat.id);
    const messages = await storage.getChatMessages(chat.id);
    res.json({ ...chat, participants, messages });
  });

  app.get(api.chats.messages.list.path, async (req, res) => {
    const messages = await storage.getChatMessages(Number(req.params.id));
    res.json(messages);
  });

  app.post(api.chats.messages.create.path, async (req, res) => {
    const user = req.user as any;
    const chatId = Number(req.params.id);
    const input = api.chats.messages.create.input.parse(req.body);
    
    const message = await storage.createChatMessage({
      chatId,
      senderId: user?.claims?.sub,
      ...input
    });
    
    res.status(201).json(message);
  });

  // Avatars
  app.post(api.avatars.seed.path, async (req, res) => {
    const user = req.user as any;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    await storage.seedDefaultAvatars(user.claims.sub);
    res.json({ seeded: true });
  });

  app.get(api.avatars.list.path, async (req, res) => {
    const user = req.user as any;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    await storage.seedDefaultAvatars(user.claims.sub);
    const avatarList = await storage.getAvatars(user.claims.sub);
    res.json(avatarList);
  });

  app.post(api.avatars.create.path, async (req, res) => {
    const user = req.user as any;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const input = api.avatars.create.input.parse(req.body);
    const avatar = await storage.createAvatar({ ...input, userId: user.claims.sub });
    res.status(201).json(avatar);
  });

  app.patch(api.avatars.update.path, async (req, res) => {
    const user = req.user as any;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const avatarList = await storage.getAvatars(user.claims.sub);
    const owned = avatarList.find(a => a.id === Number(req.params.id));
    if (!owned) return res.status(403).json({ message: "Not your avatar" });
    const input = api.avatars.update.input.parse(req.body);
    const avatar = await storage.updateAvatar(Number(req.params.id), input);
    res.json(avatar);
  });

  app.delete(api.avatars.delete.path, async (req, res) => {
    const user = req.user as any;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const avatarList = await storage.getAvatars(user.claims.sub);
    const owned = avatarList.find(a => a.id === Number(req.params.id));
    if (!owned) return res.status(403).json({ message: "Not your avatar" });
    await storage.deleteAvatar(Number(req.params.id));
    res.json({ success: true });
  });

  // Contacts
  app.get(api.contacts.list.path, async (req, res) => {
    const user = req.user as any;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const contacts = await storage.getContacts(user.claims.sub);
    res.json(contacts);
  });

  app.post(api.contacts.invite.path, async (req, res) => {
    const user = req.user as any;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const { username } = req.body;
    
    const contactUser = await storage.getContactByUsername(username);
    if (!contactUser) return res.status(404).json({ message: "User not found" });

    await storage.createContact(user.claims.sub, contactUser.id);
    res.status(201).json({ message: "Invitation sent" });
  });

  app.patch(api.contacts.updateStatus.path, async (req, res) => {
    const { status } = req.body;
    await storage.updateContactStatus(Number(req.params.id), status);
    res.json({ success: true });
  });

  // Library
  app.get(api.library.list.path, async (req, res) => {
    const user = req.user as any;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    await storage.seedDefaultAvatars(user.claims.sub);
    const items = await storage.getLibraryItems(user.claims.sub);
    res.json(items);
  });

  app.post(api.library.create.path, async (req, res) => {
    const user = req.user as any;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const input = api.library.create.input.parse(req.body);
    const item = await storage.createLibraryItem({ ...input, userId: user.claims.sub });
    res.status(201).json(item);
  });

  app.patch(api.library.update.path, async (req, res) => {
    const user = req.user as any;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const items = await storage.getLibraryItems(user.claims.sub);
    const owned = items.find(i => i.id === Number(req.params.id));
    if (!owned) return res.status(403).json({ message: "Not your library item" });
    const input = api.library.update.input.parse(req.body);
    const item = await storage.updateLibraryItem(Number(req.params.id), input);
    res.json(item);
  });

  app.delete(api.library.delete.path, async (req, res) => {
    const user = req.user as any;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const items = await storage.getLibraryItems(user.claims.sub);
    const owned = items.find(i => i.id === Number(req.params.id));
    if (!owned) return res.status(403).json({ message: "Not your library item" });
    await storage.deleteLibraryItem(Number(req.params.id));
    res.json({ success: true });
  });

  // Users (Profile)
  app.get(api.users.me.path, async (req, res) => {
    const user = req.user as any;
    // The auth integration route /api/auth/user already handles this, but we can have an alias or extra data
    // Let's forward to auth route or handle it here if we added extra fields
    res.redirect('/api/auth/user'); 
  });

  app.patch(api.users.update.path, async (req, res) => {
    const user = req.user as any;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const input = req.body;
    const updated = await storage.updateUser(user.claims.sub, input);
    res.json(updated);
  });

  return httpServer;
}
