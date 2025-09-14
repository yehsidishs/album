import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password"),
  googleId: text("google_id").unique(),
  role: text("role").notNull().default("guest"), // main_admin, co_admin, guest
  avatar: text("avatar"),
  status: text("status"),
  isOnline: boolean("is_online").default(false),
  lastSeen: timestamp("last_seen"),
  accountId: varchar("account_id"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const accounts = pgTable("accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  invitationCode: text("invitation_code").unique(),
  theme: text("theme").default("dark"),
  font: text("font").default("Inter"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const memories = pgTable("memories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  authorId: varchar("author_id").references(() => users.id),
  accountId: varchar("account_id").references(() => accounts.id),
  type: text("type").notNull(), // photo, video, quote, multi
  content: jsonb("content").notNull(),
  description: text("description"),
  hashtags: text("hashtags").array(),
  visibility: text("visibility").default("all"), // all, admins, specific_guests
  visibleTo: text("visible_to").array(),
  isPinned: boolean("is_pinned").default(false),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const memoryComments = pgTable("memory_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memoryId: varchar("memory_id").references(() => memories.id, { onDelete: "cascade" }),
  authorId: varchar("author_id").references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const chatRooms = pgTable("chat_rooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").references(() => accounts.id),
  participant1Id: varchar("participant1_id").references(() => users.id),
  participant2Id: varchar("participant2_id").references(() => users.id),
  passwordHash: text("password_hash"),
  background: text("background"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id").references(() => chatRooms.id, { onDelete: "cascade" }),
  authorId: varchar("author_id").references(() => users.id),
  content: text("content"),
  type: text("type").notNull(), // text, photo, video, ephemeral_photo, ephemeral_video
  attachments: jsonb("attachments"),
  isEphemeral: boolean("is_ephemeral").default(false),
  expiresAt: timestamp("expires_at"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const counters = pgTable("counters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").references(() => accounts.id),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // countdown, count_up
  targetDate: timestamp("target_date"),
  startDate: timestamp("start_date"),
  isEnabled: boolean("is_enabled").default(true),
  icon: text("icon"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const wishlists = pgTable("wishlists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  link: text("link"),
  priority: integer("priority").default(0),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const invitations = pgTable("invitations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  accountId: varchar("account_id").references(() => accounts.id),
  createdById: varchar("created_by_id").references(() => users.id),
  isUsed: boolean("is_used").default(false),
  usedById: varchar("used_by_id").references(() => users.id),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const games = pgTable("games", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").references(() => accounts.id),
  type: text("type").notNull(),
  data: jsonb("data"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
  createdAt: true,
});

export const insertMemorySchema = createInsertSchema(memories).omit({
  id: true,
  createdAt: true,
});

export const insertMemoryCommentSchema = createInsertSchema(memoryComments).omit({
  id: true,
  createdAt: true,
});

export const insertChatRoomSchema = createInsertSchema(chatRooms).omit({
  id: true,
  createdAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertCounterSchema = createInsertSchema(counters).omit({
  id: true,
  createdAt: true,
});

export const insertWishlistSchema = createInsertSchema(wishlists).omit({
  id: true,
  createdAt: true,
});

export const insertInvitationSchema = createInsertSchema(invitations).omit({
  id: true,
  createdAt: true,
});

export const insertGameSchema = createInsertSchema(games).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;

export type Memory = typeof memories.$inferSelect;
export type InsertMemory = z.infer<typeof insertMemorySchema>;

export type MemoryComment = typeof memoryComments.$inferSelect;
export type InsertMemoryComment = z.infer<typeof insertMemoryCommentSchema>;

export type ChatRoom = typeof chatRooms.$inferSelect;
export type InsertChatRoom = z.infer<typeof insertChatRoomSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type Counter = typeof counters.$inferSelect;
export type InsertCounter = z.infer<typeof insertCounterSchema>;

export type Wishlist = typeof wishlists.$inferSelect;
export type InsertWishlist = z.infer<typeof insertWishlistSchema>;

export type Invitation = typeof invitations.$inferSelect;
export type InsertInvitation = z.infer<typeof insertInvitationSchema>;

export type Game = typeof games.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;
