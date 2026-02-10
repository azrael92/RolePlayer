import { pgTable, serial, integer, text, timestamp, boolean, jsonb, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations, sql } from "drizzle-orm";

export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  username: varchar("username").unique(),
  profileImageUrl: varchar("profile_image_url"),
  aboutMe: text("about_me"),
  status: varchar("status").default("offline"),
  lastSeen: timestamp("last_seen").defaultNow(),
  preferences: jsonb("preferences").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const scenarios = pgTable("scenarios", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  genre: text("genre"),
  maturityRating: text("maturity_rating"),
  tags: text("tags").array(),
  authorId: varchar("author_id").references(() => users.id),
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

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const chats = pgTable("chats", {
  id: serial("id").primaryKey(),
  scenarioId: integer("scenario_id").references(() => scenarios.id),
  currentSceneId: integer("current_scene_id").references(() => scenes.id),
  title: text("title"),
  type: text("type").default("direct"),
  backgroundUrl: text("background_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const chatParticipants = pgTable("chat_participants", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").notNull().references(() => chats.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  role: text("role").default("member"),
  avatarId: integer("avatar_id"),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").notNull().references(() => chats.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id").references(() => users.id),
  content: text("content"),
  type: text("type").default("text"),
  fileUrl: text("file_url"),
  audioUrl: text("audio_url"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const avatars = pgTable("avatars", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  scenarioId: integer("scenario_id").references(() => scenarios.id),
  name: text("name").notNull(),
  imageUrl: text("image_url"),
  description: text("description"),
  species: text("species").default("human"),
  gender: text("gender").default("male"),
  scale: integer("scale").default(100),
  isDefault: boolean("is_default").default(false),
});

export const libraryItems = pgTable("library_items", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  species: text("species"),
  gender: text("gender"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  contactId: varchar("contact_id").notNull().references(() => users.id),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

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

export const insertScenarioSchema = createInsertSchema(scenarios).omit({ id: true, createdAt: true });
export const insertSceneSchema = createInsertSchema(scenes).omit({ id: true });
export const insertChatSchema = createInsertSchema(chats).omit({ id: true, createdAt: true, updatedAt: true });
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, createdAt: true });
export const insertAvatarSchema = createInsertSchema(avatars).omit({ id: true });
export const insertContactSchema = createInsertSchema(contacts).omit({ id: true, createdAt: true });
export const insertLibraryItemSchema = createInsertSchema(libraryItems).omit({ id: true, createdAt: true });

export type Scenario = typeof scenarios.$inferSelect;
export type InsertScenario = z.infer<typeof insertScenarioSchema>;
export type Scene = typeof scenes.$inferSelect;
export type Chat = typeof chats.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertScene = z.infer<typeof insertSceneSchema>;
export type Avatar = typeof avatars.$inferSelect;
export type InsertAvatar = z.infer<typeof insertAvatarSchema>;
export type Contact = typeof contacts.$inferSelect;
export type LibraryItem = typeof libraryItems.$inferSelect;
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
