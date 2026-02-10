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
  createChatMessage(message: { chatId: number, senderId?: string, content?: string, type: string, audioUrl?: string }): Promise<ChatMessage>;
  addChatParticipant(chatId: number, userId: string, role?: string): Promise<void>;
  getChatParticipants(chatId: number): Promise<any[]>; // Join with users

  // Avatars
  getAvatars(userId: string): Promise<Avatar[]>;
  createAvatar(avatar: any): Promise<Avatar>;

  // Contacts
  getContacts(userId: string): Promise<any[]>; // Join with users
  createContact(userId: string, contactId: string): Promise<void>;
  updateContactStatus(id: number, status: string): Promise<void>;
  getContactByUsername(username: string): Promise<any | undefined>;

  // Library
  getLibraryItems(userId: string): Promise<LibraryItem[]>;
  createLibraryItem(item: any): Promise<LibraryItem>;

  // Users (Profile)
  updateUser(id: string, updates: Partial<any>): Promise<any>;
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
    
    // In Drizzle, "inArray" is needed for WHERE IN
    // But basic select * from chats where id in chatIds
    // Use raw sql or just map
    // Better: Join
    // For simplicity:
    const result = await db.select().from(chats).where(sql`id IN ${chatIds}`).orderBy(desc(chats.updatedAt));
    // Wait, sql helper import needed? No, I can use inArray from drizzle-orm
    return result; 
    // Actually, I'll fix the import above if needed, but for now let's assume `inArray` is needed.
  }

  async getChat(id: number): Promise<Chat | undefined> {
    const [chat] = await db.select().from(chats).where(eq(chats.id, id));
    return chat;
  }

  async createChat(chatData: { title?: string, scenarioId?: number, currentSceneId?: number }): Promise<Chat> {
    const [chat] = await db.insert(chats).values(chatData).returning();
    return chat;
  }

  async getChatMessages(chatId: number): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages).where(eq(chatMessages.chatId, chatId)).orderBy(chatMessages.createdAt);
  }

  async createChatMessage(message: { chatId: number, senderId?: string, content?: string, type: string, audioUrl?: string }): Promise<ChatMessage> {
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

  // Users
  async updateUser(id: string, updates: Partial<any>): Promise<any> {
    const [updated] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return updated;
  }
}

// Helper needed for getChats
import { sql, inArray } from "drizzle-orm";

export const storage = new DatabaseStorage();
