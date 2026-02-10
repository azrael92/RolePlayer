import { db } from "./db";
import { 
  scenarios, scenes, chats, chatMessages, chatParticipants, avatars, contacts, libraryItems, users,
  type Scenario, type InsertScenario,
  type Scene, type InsertScene,
  type Chat, type ChatMessage, 
  type Avatar, type Contact, type LibraryItem
} from "@shared/schema";
import { eq, desc, and, ne } from "drizzle-orm";

export interface IStorage {
  // Scenarios
  getScenarios(): Promise<Scenario[]>;
  getScenario(id: number): Promise<Scenario | undefined>;
  createScenario(scenario: InsertScenario): Promise<Scenario>;
  updateScenario(id: number, scenario: Partial<InsertScenario>): Promise<Scenario>;
  
  // Scenes
  getScenes(scenarioId: number): Promise<Scene[]>;
  createScene(scene: InsertScene): Promise<Scene>;

  // Chats
  getChats(userId: string): Promise<Chat[]>;
  getChat(id: number): Promise<Chat | undefined>;
  createChat(chat: { title?: string, scenarioId?: number, currentSceneId?: number }): Promise<Chat>;
  getChatMessages(chatId: number): Promise<ChatMessage[]>;
  createChatMessage(message: { chatId: number, senderId?: string, content?: string, type: string, fileUrl?: string, audioUrl?: string }): Promise<ChatMessage>;
  addChatParticipant(chatId: number, userId: string, role?: string): Promise<void>;
  getChatParticipants(chatId: number): Promise<any[]>;

  // Avatars
  getAvatars(userId: string): Promise<Avatar[]>;
  createAvatar(avatar: any): Promise<Avatar>;
  updateAvatar(id: number, updates: Partial<any>): Promise<Avatar>;
  deleteAvatar(id: number): Promise<void>;

  // Contacts
  getContacts(userId: string): Promise<any[]>;
  createContact(userId: string, contactId: string): Promise<void>;
  updateContactStatus(id: number, status: string): Promise<void>;
  getContactByUsername(username: string): Promise<any | undefined>;

  // Library
  getLibraryItems(userId: string): Promise<LibraryItem[]>;
  createLibraryItem(item: any): Promise<LibraryItem>;
  updateLibraryItem(id: number, updates: Partial<any>): Promise<LibraryItem>;
  deleteLibraryItem(id: number): Promise<void>;

  // Users (Profile)
  updateUser(id: string, updates: Partial<any>): Promise<any>;

  // Seeding
  seedDefaultAvatars(userId: string): Promise<void>;
  hasDefaultAvatars(userId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Scenarios
  async getScenarios(): Promise<Scenario[]> {
    return await db.select().from(scenarios).orderBy(desc(scenarios.createdAt));
  }
  
  async getScenario(id: number): Promise<Scenario | undefined> {
    const [scenario] = await db.select().from(scenarios).where(eq(scenarios.id, id));
    return scenario;
  }

  async createScenario(scenario: InsertScenario): Promise<Scenario> {
    const [newScenario] = await db.insert(scenarios).values(scenario).returning();
    return newScenario;
  }

  async updateScenario(id: number, updates: Partial<InsertScenario>): Promise<Scenario> {
    const [updated] = await db.update(scenarios).set(updates).where(eq(scenarios.id, id)).returning();
    return updated;
  }

  // Scenes
  async getScenes(scenarioId: number): Promise<Scene[]> {
    return await db.select().from(scenes).where(eq(scenes.scenarioId, scenarioId)).orderBy(scenes.order);
  }

  async createScene(scene: InsertScene): Promise<Scene> {
    const [newScene] = await db.insert(scenes).values(scene).returning();
    return newScene;
  }

  // Chats
  async getChats(userId: string): Promise<Chat[]> {
    // Get chats where user is a participant
    const participantRows = await db.select({ chatId: chatParticipants.chatId }).from(chatParticipants).where(eq(chatParticipants.userId, userId));
    const chatIds = participantRows.map(r => r.chatId);
    
    if (chatIds.length === 0) return [];
    
    const result = await db.select().from(chats).where(inArray(chats.id, chatIds)).orderBy(desc(chats.updatedAt));
    return result; 
  }

  async getChat(id: number): Promise<Chat | undefined> {
    const [chat] = await db.select().from(chats).where(eq(chats.id, id));
    return chat;
  }

  async createChat(chatData: { title?: string, scenarioId?: number, currentSceneId?: number, type?: string }): Promise<Chat> {
    const [chat] = await db.insert(chats).values(chatData).returning();
    return chat;
  }

  async getChatMessages(chatId: number): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages).where(eq(chatMessages.chatId, chatId)).orderBy(chatMessages.createdAt);
  }

  async createChatMessage(message: { chatId: number, senderId?: string, content?: string, type: string, fileUrl?: string, audioUrl?: string }): Promise<ChatMessage> {
    const [msg] = await db.insert(chatMessages).values(message).returning();
    return msg;
  }

  async addChatParticipant(chatId: number, userId: string, role: string = 'member'): Promise<void> {
    await db.insert(chatParticipants).values({ chatId, userId, role });
  }

  async getChatParticipants(chatId: number): Promise<any[]> {
    return await db.select({
      participant: chatParticipants,
      user: users
    })
    .from(chatParticipants)
    .innerJoin(users, eq(chatParticipants.userId, users.id))
    .where(eq(chatParticipants.chatId, chatId));
  }

  // Avatars
  async getAvatars(userId: string): Promise<Avatar[]> {
    return await db.select().from(avatars).where(eq(avatars.userId, userId));
  }

  async createAvatar(avatar: any): Promise<Avatar> {
    const [newAvatar] = await db.insert(avatars).values(avatar).returning();
    return newAvatar;
  }

  async updateAvatar(id: number, updates: Partial<any>): Promise<Avatar> {
    const [updated] = await db.update(avatars).set(updates).where(eq(avatars.id, id)).returning();
    return updated;
  }

  async deleteAvatar(id: number): Promise<void> {
    await db.delete(avatars).where(eq(avatars.id, id));
  }

  // Contacts
  async getContacts(userId: string): Promise<any[]> {
    return await db.select({
      contactRecord: contacts,
      user: users
    })
    .from(contacts)
    .innerJoin(users, eq(contacts.contactId, users.id))
    .where(eq(contacts.userId, userId));
  }

  async createContact(userId: string, contactId: string): Promise<void> {
    await db.insert(contacts).values({ userId, contactId });
  }

  async updateContactStatus(id: number, status: string): Promise<void> {
    await db.update(contacts).set({ status }).where(eq(contacts.id, id));
  }
  
  async getContactByUsername(username: string): Promise<any | undefined> {
     const [user] = await db.select().from(users).where(eq(users.username, username));
     return user;
  }

  // Library
  async getLibraryItems(userId: string): Promise<LibraryItem[]> {
    return await db.select().from(libraryItems).where(eq(libraryItems.userId, userId));
  }

  async createLibraryItem(item: any): Promise<LibraryItem> {
    const [newItem] = await db.insert(libraryItems).values(item).returning();
    return newItem;
  }

  async updateLibraryItem(id: number, updates: Partial<any>): Promise<LibraryItem> {
    const [updated] = await db.update(libraryItems).set(updates).where(eq(libraryItems.id, id)).returning();
    return updated;
  }

  async deleteLibraryItem(id: number): Promise<void> {
    await db.delete(libraryItems).where(eq(libraryItems.id, id));
  }

  // Users
  async updateUser(id: string, updates: Partial<any>): Promise<any> {
    const [updated] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return updated;
  }

  // Seeding
  async hasDefaultAvatars(userId: string): Promise<boolean> {
    const existing = await db.select({ id: avatars.id }).from(avatars)
      .where(and(eq(avatars.userId, userId), eq(avatars.isDefault, true)))
      .limit(1);
    return existing.length > 0;
  }

  async seedDefaultAvatars(userId: string): Promise<void> {
    try {
      const has = await this.hasDefaultAvatars(userId);
      if (has) return;
    } catch {
      return;
    }

    const defaults = [
      { species: "human", gender: "male", name: "Human Male", imageUrl: "/avatars/human-male.png" },
      { species: "human", gender: "female", name: "Human Female", imageUrl: "/avatars/human-female.png" },
      { species: "elf", gender: "male", name: "Elf Male", imageUrl: "/avatars/elf-male.png" },
      { species: "elf", gender: "female", name: "Elf Female", imageUrl: "/avatars/elf-female.png" },
      { species: "demon", gender: "male", name: "Demon Male", imageUrl: "/avatars/demon-male.png" },
      { species: "demon", gender: "female", name: "Demon Female", imageUrl: "/avatars/demon-female.png" },
      { species: "centaur", gender: "male", name: "Centaur Male", imageUrl: "/avatars/centaur-male.png" },
      { species: "centaur", gender: "female", name: "Centaur Female", imageUrl: "/avatars/centaur-female.png" },
      { species: "fae", gender: "male", name: "Fae Male", imageUrl: "/avatars/fae-male.png" },
      { species: "fae", gender: "female", name: "Fae Female", imageUrl: "/avatars/fae-female.png" },
    ];

    try {
      for (const d of defaults) {
        await db.insert(avatars).values({
          userId,
          name: d.name,
          imageUrl: d.imageUrl,
          species: d.species,
          gender: d.gender,
          scale: 100,
          isDefault: true,
          description: `Default ${d.species} ${d.gender} avatar`,
        });
        await db.insert(libraryItems).values({
          userId,
          type: "character",
          name: d.name,
          url: d.imageUrl,
          species: d.species,
          gender: d.gender,
          isDefault: true,
        });
      }
    } catch {
      // Ignore duplicate seeding errors from race conditions
    }
  }
}

import { sql, inArray } from "drizzle-orm";

export const storage = new DatabaseStorage();
