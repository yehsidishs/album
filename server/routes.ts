import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import {
  insertUserSchema,
  insertMemorySchema,
  insertChatMessageSchema,
  insertCounterSchema,
  insertWishlistSchema,
  insertMemoryCommentSchema
} from "@shared/schema";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { z } from "zod";

// ЧИТАЕМ ТОЛЬКО С СЕРВЕРА (без VITE_ фоллбеков)
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL ?? "/api/auth/google/callback";

// Google OAuth включаем, только если заданы оба значения
const GOOGLE_OAUTH_ENABLED = !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);

const loginSchema = z.object({
  emailOrUsername: z.string().min(1),
  password: z.string().min(1),
});

const baseRegisterSchema = z.object({
  email: z.string().email(),
  username: z.string().min(1),
  password: z.string().min(1),
  confirmPassword: z.string(),
  googleId: z.string().optional(),
  role: z.string().default("guest"),
  avatar: z.string().optional(),
  status: z.string().optional(),
  isOnline: z.boolean().optional(),
  lastSeen: z.date().optional(),
  accountId: z.string().optional(),
});

const registerSchema = baseRegisterSchema.refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const invitationLoginSchema = z.object({
  emailOrUsername: z.string().min(1),
  password: z.string().min(1),
  invitationCode: z.string().min(1),
});

const invitationRegisterSchema = baseRegisterSchema.extend({
  invitationCode: z.string().min(1),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export async function registerRoutes(app: Express): Promise<Server> {
  // СЕССИИ настраиваются в server/index.ts (тут НЕ дублируем app.use(session(...)))

  app.use(passport.initialize());
  app.use(passport.session());

  // Подключаем Google OAuth только если заданы переменные
  if (GOOGLE_OAUTH_ENABLED) {
    passport.use(new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID!,
        clientSecret: GOOGLE_CLIENT_SECRET!,
        callbackURL: GOOGLE_CALLBACK_URL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          let user = await storage.getUserByGoogleId(profile.id);

          if (!user) {
            // Создаём аккаунт и пользователя при первом логине через Google
            const account = await storage.createAccount({
              name: `${profile.displayName}'s Account`,
            });

            user = await storage.createUser({
              email: profile.emails?.[0]?.value ?? `user_${profile.id}@example.com`,
              username: profile.displayName || `user_${Date.now()}`,
              googleId: profile.id,
              role: "main_admin",
              accountId: account.id,
              avatar: profile.photos?.[0]?.value,
            });

            await storage.generateInvitationCode(account.id, user.id);
          }

          return done(null, user);
        } catch (error) {
          return done(error as Error);
        }
      }
    ));
  }

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user || null);
    } catch (error) {
      done(error as Error);
    }
  });

  // ======== AUTH ROUTES (email/password) ========

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { emailOrUsername, password } = loginSchema.parse(req.body);

      let user = await storage.getUserByEmail(emailOrUsername);
      if (!user) user = await storage.getUserByUsername(emailOrUsername);

      if (!user || !user.password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.login(user, (err) => {
        if (err) return res.status(500).json({ message: "Login error" });
        res.json({ user });
      });
    } catch {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, username, password } = registerSchema.parse(req.body);

      const existingUser =
        (await storage.getUserByEmail(email)) ||
        (await storage.getUserByUsername(username));
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const account = await storage.createAccount({
        name: `${username}'s Account`,
      });

      const user = await storage.createUser({
        email,
        username,
        password: hashedPassword,
        role: "main_admin",
        accountId: account.id,
      });

      await storage.generateInvitationCode(account.id, user.id);

      req.login(user, (err) => {
        if (err) return res.status(500).json({ message: "Login error" });
        res.json({ user });
      });
    } catch {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  // ======== INVITATION AUTH ========

  app.post("/api/auth/invitation-login", async (req, res) => {
    try {
      const { emailOrUsername, password, invitationCode } =
        invitationLoginSchema.parse(req.body);

      const invitation = await storage.getInvitationByCode(invitationCode);
      if (!invitation || invitation.isUsed) {
        return res.status(400).json({ message: "Invalid invitation code" });
      }

      let user = await storage.getUserByEmail(emailOrUsername);
      if (!user) user = await storage.getUserByUsername(emailOrUsername);

      if (!user || !user.password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      await storage.updateUser(user.id, {
        accountId: invitation.accountId,
        role: "co_admin",
      });
      await storage.useInvitation(invitationCode, user.id);

      req.login(user, (err) => {
        if (err) return res.status(500).json({ message: "Login error" });
        res.json({ user });
      });
    } catch {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.post("/api/auth/invitation-register", async (req, res) => {
    try {
      const { email, username, password, invitationCode } =
        invitationRegisterSchema.parse(req.body);

      const invitation = await storage.getInvitationByCode(invitationCode);
      if (!invitation || invitation.isUsed) {
        return res.status(400).json({ message: "Invalid invitation code" });
      }

      const existingUser =
        (await storage.getUserByEmail(email)) ||
        (await storage.getUserByUsername(username));
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await storage.createUser({
        email,
        username,
        password: hashedPassword,
        role: "co_admin",
        accountId: invitation.accountId,
      });

      await storage.useInvitation(invitationCode, user.id);

      req.login(user, (err) => {
        if (err) return res.status(500).json({ message: "Login error" });
        res.json({ user });
      });
    } catch {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  // ======== GOOGLE OAUTH (если включён) ========

  if (GOOGLE_OAUTH_ENABLED) {
    app.get(
      "/api/auth/google",
      passport.authenticate("google", { scope: ["profile", "email"] })
    );

    app.get(
      "/api/auth/google/callback",
      passport.authenticate("google", { failureRedirect: "/" }),
      (_req, res) => {
        // при удачном логине храним сессию и редиректим в приложение
        res.redirect("/dashboard");
      }
    );
  }

  // ======== SESSION HELPERS ========

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) return res.status(500).json({ message: "Logout error" });
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
      res.json({ user: req.user });
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  // Middleware для охраны API сессией
  const requireAuth = (req: any, res: any, next: any) => {
    if (req.isAuthenticated && req.isAuthenticated()) return next();
    res.status(401).json({ message: "Authentication required" });
  };

  // ======== MEMORIES ========

  app.get("/api/memories", requireAuth, async (req: any, res) => {
    try {
      const user = req.user;
      const { limit = 20, offset = 0 } = req.query;

      const memories = await storage.getMemories(
        user.accountId,
        user.id,
        parseInt(String(limit)),
        parseInt(String(offset))
      );

      res.json(memories);
    } catch {
      res.status(500).json({ message: "Failed to fetch memories" });
    }
  });

  app.post("/api/memories", requireAuth, async (req: any, res) => {
    try {
      const user = req.user;
      const memoryData = insertMemorySchema.parse({
        ...req.body,
        authorId: user.id,
        accountId: user.accountId,
      });

      const memory = await storage.createMemory(memoryData);
      res.json(memory);
    } catch {
      res.status(400).json({ message: "Invalid memory data" });
    }
  });

  app.get("/api/memories/search", requireAuth, async (req: any, res) => {
    try {
      const user = req.user;
      const { q } = req.query;

      if (!q) {
        return res.status(400).json({ message: "Query parameter required" });
      }

      const memories = await storage.searchMemories(user.accountId, String(q));
      res.json(memories);
    } catch {
      res.status(500).json({ message: "Search failed" });
    }
  });

  // ======== COMMENTS ========

  app.get("/api/memories/:id/comments", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const comments = await storage.getMemoryComments(id);
      res.json(comments);
    } catch {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/memories/:id/comments", requireAuth, async (req: any, res) => {
    try {
      const user = req.user;
      const { id } = req.params;

      const commentData = insertMemoryCommentSchema.parse({
        ...req.body,
        memoryId: id,
        authorId: user.id,
      });

      const comment = await storage.createComment(commentData);
      res.json(comment);
    } catch {
      res.status(400).json({ message: "Invalid comment data" });
    }
  });

  // ======== CHAT ========

  app.get("/api/chat/room", requireAuth, async (req: any, res) => {
    try {
      const user = req.user;
      const room = await storage.getChatRoom(user.accountId);
      res.json(room);
    } catch {
      res.status(500).json({ message: "Failed to fetch chat room" });
    }
  });

  app.get("/api/chat/messages", requireAuth, async (req: any, res) => {
    try {
      const user = req.user;
      const { limit = 50, offset = 0 } = req.query;

      const room = await storage.getChatRoom(user.accountId);
      if (!room) return res.status(404).json({ message: "Chat room not found" });

      const messages = await storage.getChatMessages(
        room.id,
        parseInt(String(limit)),
        parseInt(String(offset))
      );
      res.json(messages);
    } catch {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // ======== COUNTERS ========

  app.get("/api/counters", requireAuth, async (req: any, res) => {
    try {
      const user = req.user;
      const counters = await storage.getCounters(user.accountId);
      res.json(counters);
    } catch {
      res.status(500).json({ message: "Failed to fetch counters" });
    }
  });

  app.post("/api/counters", requireAuth, async (req: any, res) => {
    try {
      const user = req.user;
      const counterData = insertCounterSchema.parse({
        ...req.body,
        accountId: user.accountId,
      });

      const counter = await storage.createCounter(counterData);
      res.json(counter);
    } catch {
      res.status(400).json({ message: "Invalid counter data" });
    }
  });

  // ======== WISHLIST ========

  app.get("/api/wishlist", requireAuth, async (req: any, res) => {
    try {
      const user = req.user;
      const wishlist = await storage.getWishlist(user.id);
      res.json(wishlist);
    } catch {
      res.status(500).json({ message: "Failed to fetch wishlist" });
    }
  });

  app.post("/api/wishlist", requireAuth, async (req: any, res) => {
    try {
      const user = req.user;
      const itemData = insertWishlistSchema.parse({
        ...req.body,
        userId: user.id,
      });

      const item = await storage.createWishlistItem(itemData);
      res.json(item);
    } catch {
      res.status(400).json({ message: "Invalid wishlist item data" });
    }
  });

  // ======== ACCOUNT ========

  app.get("/api/account/invitation-code", requireAuth, async (req: any, res) => {
    try {
      const user = req.user;
      if (user.role !== "main_admin") {
        return res.status(403).json({ message: "Only main admin can access invitation codes" });
      }

      const account = await storage.getAccount(user.accountId);
      if (!account?.invitationCode) {
        const newCode = await storage.generateInvitationCode(user.accountId, user.id);
        return res.json({ code: newCode });
      }

      res.json({ code: account.invitationCode });
    } catch {
      res.status(500).json({ message: "Failed to fetch invitation code" });
    }
  });

  app.post("/api/account/generate-invitation", requireAuth, async (req: any, res) => {
    try {
      const user = req.user;
      if (user.role !== "main_admin") {
        return res.status(403).json({ message: "Only main admin can generate invitation codes" });
      }

      const code = await storage.generateInvitationCode(user.accountId, user.id);
      res.json({ code });
    } catch {
      res.status(500).json({ message: "Failed to generate invitation code" });
    }
  });

  // ======== WEBSOCKETS ========

  const httpServer = createServer(app);

  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  const clients = new Map<string, WebSocket>();

  wss.on("connection", (ws: WebSocket) => {
    let userId: string | null = null;

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === "auth") {
          userId = message.userId; // TODO: в идеале проверять подпись (JWT) перед принятием userId
          clients.set(userId, ws);
          await storage.updateUser(userId, { isOnline: true });
        }

        if (message.type === "chat_message" && userId) {
          const user = await storage.getUser(userId);
          if (!user) return;

          const room = await storage.getChatRoom(user.accountId);
          if (!room) return;

          const chatMessage = await storage.createChatMessage({
            roomId: room.id,
            authorId: userId,
            content: message.content,
            type: message.messageType || "text",
            isEphemeral: message.isEphemeral || false,
            // 2 минуты для ephemeral_* (можно вынести в конфиг)
            expiresAt: message.isEphemeral
              ? new Date(Date.now() + 2 * 60 * 1000)
              : undefined,
          });

          // Рассылаем всем пользователям аккаунта
          const accountUsers = await storage.getUsersByAccountId(user.accountId);
          accountUsers.forEach((accountUser) => {
            const client = clients.get(accountUser.id);
            if (client && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: "new_message",
                message: chatMessage,
              }));
            }
          });
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });

    ws.on("close", async () => {
      if (userId) {
        clients.delete(userId);
        await storage.updateUser(userId, {
          isOnline: false,
          lastSeen: new Date(),
        });
      }
    });
  });

  // Чистим просроченные сообщения раз в минуту
  setInterval(async () => {
    try {
      await storage.deleteExpiredMessages();
    } catch (error) {
      console.error("Failed to clean up expired messages:", error);
    }
  }, 60_000);

  return httpServer;
}
