import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  users, accounts, memories, memoryComments, chatRooms, chatMessages,
  counters, wishlists, invitations, games,
  type User, type InsertUser, type Account, type InsertAccount,
  type Memory, type InsertMemory, type MemoryComment, type InsertMemoryComment,
  type ChatRoom, type InsertChatRoom, type ChatMessage, type InsertChatMessage,
  type Counter, type InsertCounter, type Wishlist, type InsertWishlist,
  type Invitation, type InsertInvitation, type Game, type InsertGame
} from "@shared/schema";
import { eq, desc, and, or, ilike, gte, lte, isNull } from "drizzle-orm";
import { randomUUID } from "crypto";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client);

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;
  getUsersByAccountId(accountId: string): Promise<User[]>;

  // Account management
  getAccount(id: string): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: string, updates: Partial<InsertAccount>): Promise<Account>;
  generateInvitationCode(accountId: string, createdById: string): Promise<string>;
  getInvitationByCode(code: string): Promise<Invitation | undefined>;
  useInvitation(code: string, userId: string): Promise<void>;

  // Memory management
  getMemories(accountId: string, userId?: string, limit?: number, offset?: number): Promise<Memory[]>;
  getMemory(id: string): Promise<Memory | undefined>;
  createMemory(memory: InsertMemory): Promise<Memory>;
  updateMemory(id: string, updates: Partial<InsertMemory>): Promise<Memory>;
  deleteMemory(id: string): Promise<void>;
  searchMemories(accountId: string, query: string): Promise<Memory[]>;

  // Comments
  getMemoryComments(memoryId: string): Promise<MemoryComment[]>;
  createComment(comment: InsertMemoryComment): Promise<MemoryComment>;
  deleteComment(id: string): Promise<void>;

  // Chat management
  getChatRoom(accountId: string): Promise<ChatRoom | undefined>;
  createChatRoom(chatRoom: InsertChatRoom): Promise<ChatRoom>;
  updateChatRoom(id: string, updates: Partial<InsertChatRoom>): Promise<ChatRoom>;
  getChatMessages(roomId: string, limit?: number, offset?: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  deleteExpiredMessages(): Promise<void>;

  // Counters
  getCounters(accountId: string): Promise<Counter[]>;
  createCounter(counter: InsertCounter): Promise<Counter>;
  updateCounter(id: string, updates: Partial<InsertCounter>): Promise<Counter>;
  deleteCounter(id: string): Promise<void>;

  // Wishlist
  getWishlist(userId: string): Promise<Wishlist[]>;
  createWishlistItem(item: InsertWishlist): Promise<Wishlist>;
  updateWishlistItem(id: string, updates: Partial<InsertWishlist>): Promise<Wishlist>;
  deleteWishlistItem(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.googleId, googleId));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }

  async getUsersByAccountId(accountId: string): Promise<User[]> {
    return db.select().from(users).where(eq(users.accountId, accountId));
  }

  async getAccount(id: string): Promise<Account | undefined> {
    const result = await db.select().from(accounts).where(eq(accounts.id, id));
    return result[0];
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    const result = await db.insert(accounts).values(account).returning();
    return result[0];
  }

  async updateAccount(id: string, updates: Partial<InsertAccount>): Promise<Account> {
    const result = await db.update(accounts).set(updates).where(eq(accounts.id, id)).returning();
    return result[0];
  }

  async generateInvitationCode(accountId: string, createdById: string): Promise<string> {
    const code = `${Math.random().toString(36).substr(2, 4).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    
    await db.insert(invitations).values({
      code,
      accountId,
      createdById,
    });

    await db.update(accounts).set({ invitationCode: code }).where(eq(accounts.id, accountId));

    return code;
  }

  async getInvitationByCode(code: string): Promise<Invitation | undefined> {
    const result = await db.select().from(invitations).where(eq(invitations.code, code));
    return result[0];
  }

  async useInvitation(code: string, userId: string): Promise<void> {
    await db.update(invitations)
      .set({ isUsed: true, usedById: userId, usedAt: new Date() })
      .where(eq(invitations.code, code));
  }

  async getMemories(accountId: string, userId?: string, limit = 20, offset = 0): Promise<Memory[]> {
    let conditions = [eq(memories.accountId, accountId)];
    
    if (userId) {
      // Filter based on visibility and user permissions
      const user = await this.getUser(userId);
      if (user?.role === 'guest') {
        // For guest users, only show memories visible to all or specific guests
        conditions.push(eq(memories.visibility, 'all'));
      }
    }

    return db.select().from(memories)
      .where(and(...conditions))
      .orderBy(desc(memories.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getMemory(id: string): Promise<Memory | undefined> {
    const result = await db.select().from(memories).where(eq(memories.id, id));
    return result[0];
  }

  async createMemory(memory: InsertMemory): Promise<Memory> {
    const result = await db.insert(memories).values(memory).returning();
    return result[0];
  }

  async updateMemory(id: string, updates: Partial<InsertMemory>): Promise<Memory> {
    const result = await db.update(memories).set(updates).where(eq(memories.id, id)).returning();
    return result[0];
  }

  async deleteMemory(id: string): Promise<void> {
    await db.delete(memories).where(eq(memories.id, id));
  }

  async searchMemories(accountId: string, query: string): Promise<Memory[]> {
    return db.select().from(memories)
      .where(
        and(
          eq(memories.accountId, accountId),
          or(
            ilike(memories.description, `%${query}%`),
            // Note: Array field searching would need proper array operators in production
          )
        )
      )
      .orderBy(desc(memories.createdAt));
  }

  async getMemoryComments(memoryId: string): Promise<MemoryComment[]> {
    return db.select().from(memoryComments)
      .where(eq(memoryComments.memoryId, memoryId))
      .orderBy(desc(memoryComments.createdAt));
  }

  async createComment(comment: InsertMemoryComment): Promise<MemoryComment> {
    const result = await db.insert(memoryComments).values(comment).returning();
    return result[0];
  }

  async deleteComment(id: string): Promise<void> {
    await db.delete(memoryComments).where(eq(memoryComments.id, id));
  }

  async getChatRoom(accountId: string): Promise<ChatRoom | undefined> {
    const result = await db.select().from(chatRooms).where(eq(chatRooms.accountId, accountId));
    return result[0];
  }

  async createChatRoom(chatRoom: InsertChatRoom): Promise<ChatRoom> {
    const result = await db.insert(chatRooms).values(chatRoom).returning();
    return result[0];
  }

  async updateChatRoom(id: string, updates: Partial<InsertChatRoom>): Promise<ChatRoom> {
    const result = await db.update(chatRooms).set(updates).where(eq(chatRooms.id, id)).returning();
    return result[0];
  }

  async getChatMessages(roomId: string, limit = 50, offset = 0): Promise<ChatMessage[]> {
    return db.select().from(chatMessages)
      .where(eq(chatMessages.roomId, roomId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const result = await db.insert(chatMessages).values(message).returning();
    return result[0];
  }

  async deleteExpiredMessages(): Promise<void> {
    await db.delete(chatMessages)
      .where(
        and(
          eq(chatMessages.isEphemeral, true),
          lte(chatMessages.expiresAt || new Date(), new Date())
        )
      );
  }

  async getCounters(accountId: string): Promise<Counter[]> {
    return db.select().from(counters)
      .where(eq(counters.accountId, accountId))
      .orderBy(desc(counters.createdAt));
  }

  async createCounter(counter: InsertCounter): Promise<Counter> {
    const result = await db.insert(counters).values(counter).returning();
    return result[0];
  }

  async updateCounter(id: string, updates: Partial<InsertCounter>): Promise<Counter> {
    const result = await db.update(counters).set(updates).where(eq(counters.id, id)).returning();
    return result[0];
  }

  async deleteCounter(id: string): Promise<void> {
    await db.delete(counters).where(eq(counters.id, id));
  }

  async getWishlist(userId: string): Promise<Wishlist[]> {
    return db.select().from(wishlists)
      .where(eq(wishlists.userId, userId))
      .orderBy(desc(wishlists.priority), desc(wishlists.createdAt));
  }

  async createWishlistItem(item: InsertWishlist): Promise<Wishlist> {
    const result = await db.insert(wishlists).values(item).returning();
    return result[0];
  }

  async updateWishlistItem(id: string, updates: Partial<InsertWishlist>): Promise<Wishlist> {
    const result = await db.update(wishlists).set(updates).where(eq(wishlists.id, id)).returning();
    return result[0];
  }

  async deleteWishlistItem(id: string): Promise<void> {
    await db.delete(wishlists).where(eq(wishlists.id, id));
  }
}

export const storage = new DatabaseStorage();
