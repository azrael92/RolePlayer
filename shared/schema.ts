import { pgTable, serial, integer, text, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { users } from "./models/auth";

// Export auth and chat models from integrations
export * from "./models/auth";
export * from "./models/chat";

// === SCENARIOS & SCENES ===
export const scenarios = pgTable("scenarios", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  genre: text("genre"),
  maturityRating: text("maturity_rating"), // PG, PG-13, R, etc.
  tags: text("tags").array(),
  authorId: text("author_id").references(() => users.id),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const scenes = pgTable("scenes", {
  id: serial("id").primaryKey(),
  scenarioId: integer("scenario_id").notNull().references(() => scenarios.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  backgroundImageUrl: text("background_image_url"),
  order: integer("order").default(0),
});

// === USER-TO-USER CHATS ===
export const chats = pgTable("chats", {
  id: serial("id").primaryKey(),
  scenarioId: integer("scenario_id").references(() => scenarios.id),
  currentSceneId: integer("current_scene_id").references(() => scenes.id),
  title: text("title"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const chatParticipants = pgTable("chat_participants", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").notNull().references(() => chats.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id),
  role: text("role").default("member"), // admin, member
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").notNull().references(() => chats.id, { onDelete: "cascade" }),
  senderId: text("sender_id").references(() => users.id), // Nullable for system messages
  content: text("content"),
  type: text("type").default("text"), // text, voice, image, system
  audioUrl: text("audio_url"),
  metadata: jsonb("metadata"), // For extra data like sentiment, reaction
  createdAt: timestamp("created_at").defaultNow(),
});

// === AVATARS & LIBRARY ===
export const avatars = pgTable("avatars", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  scenarioId: integer("scenario_id").references(() => scenarios.id),
  name: text("name").notNull(),
  imageUrl: text("image_url"),
  description: text("description"),
});

export const libraryItems = pgTable("library_items", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // background, character
  name: text("name").notNull(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// === CONTACTS ===
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  contactId: text("contact_id").notNull().references(() => users.id),
  status: text("status").default("pending"), // pending, accepted, blocked
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===
export const scenariosRelations = relations(scenarios, ({ one, many }) => ({
  author: one(users, { fields: [scenarios.authorId], references: [users.id] }),
  scenes: many(scenes),
  chats: many(chats),
}));

export const scenesRelations = relations(scenes, ({ one }) => ({
  scenario: one(scenarios, { fields: [scenes.scenarioId], references: [scenarios.id] }),
}));

export const chatsRelations = relations(chats, ({ one, many }) => ({
  scenario: one(scenarios, { fields: [chats.scenarioId], references: [scenarios.id] }),
  scene: one(scenes, { fields: [chats.currentSceneId], references: [scenes.id] }),
  participants: many(chatParticipants),
  messages: many(chatMessages),
}));

export const chatParticipantsRelations = relations(chatParticipants, ({ one }) => ({
  chat: one(chats, { fields: [chatParticipants.chatId], references: [chats.id] }),
  user: one(users, { fields: [chatParticipants.userId], references: [users.id] }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  chat: one(chats, { fields: [chatMessages.chatId], references: [chats.id] }),
  sender: one(users, { fields: [chatMessages.senderId], references: [users.id] }),
}));

// === ZOD SCHEMAS ===
export const insertScenarioSchema = createInsertSchema(scenarios).omit({ id: true, createdAt: true });
export const insertSceneSchema = createInsertSchema(scenes).omit({ id: true });
export const insertChatSchema = createInsertSchema(chats).omit({ id: true, createdAt: true, updatedAt: true });
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, createdAt: true });
export const insertAvatarSchema = createInsertSchema(avatars).omit({ id: true });
export const insertContactSchema = createInsertSchema(contacts).omit({ id: true, createdAt: true });
export const insertLibraryItemSchema = createInsertSchema(libraryItems).omit({ id: true, createdAt: true });

// === TYPES ===
export type Scenario = typeof scenarios.$inferSelect;
export type InsertScenario = z.infer<typeof insertScenarioSchema>;
export type Scene = typeof scenes.$inferSelect;
export type Chat = typeof chats.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type Avatar = typeof avatars.$inferSelect;
export type Contact = typeof contacts.$inferSelect;
