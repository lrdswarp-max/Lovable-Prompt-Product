import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  conversationsTable,
  conversationParticipantsTable,
  messagesTable,
  usersTable,
} from "@workspace/db";
import { nanoid } from "../lib/id";
import { ListConversationsQueryParams, SendMessageBody, SendMessageParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/conversations", async (req, res) => {
  try {
    const actorId = req.actorId;
    if (!actorId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const actor = await db.query.usersTable.findFirst({ where: eq(usersTable.id, actorId) });
    const isTrainer = actor?.role === "trainer";

    const parsed = ListConversationsQueryParams.safeParse(req.query);

    let userId: string;
    if (isTrainer) {
      if (!parsed.success || !parsed.data.userId || parsed.data.userId === "undefined") {
        userId = actorId;
      } else {
        userId = parsed.data.userId;
      }
    } else {
      userId = actorId;
    }

    const participations = await db.query.conversationParticipantsTable.findMany({
      where: eq(conversationParticipantsTable.userId, userId),
    });

    const result = await Promise.all(
      participations.map(async (p) => {
        const conv = await db.query.conversationsTable.findFirst({
          where: eq(conversationsTable.id, p.conversationId),
        });
        if (!conv) return null;

        const allParticipants = await db.query.conversationParticipantsTable.findMany({
          where: eq(conversationParticipantsTable.conversationId, conv.id),
        });

        const participantUsers = await Promise.all(
          allParticipants.map((ap) =>
            db.query.usersTable.findFirst({ where: eq(usersTable.id, ap.userId) })
          )
        );

        const messages = await db.query.messagesTable.findMany({
          where: eq(messagesTable.conversationId, conv.id),
        });
        const sortedMsgs = [...messages].sort((a, b) => a.timestamp - b.timestamp);
        const lastMessage = sortedMsgs[sortedMsgs.length - 1];

        const validUsers = participantUsers.filter(Boolean);

        return {
          id: conv.id,
          isGroup: conv.isGroup,
          title: conv.title ?? undefined,
          participantIds: validUsers.map((u) => u!.id),
          participantNames: validUsers.map((u) => u!.name),
          lastMessage: lastMessage
            ? {
                id: lastMessage.id,
                conversationId: lastMessage.conversationId,
                senderId: lastMessage.senderId,
                senderName: lastMessage.senderName,
                text: lastMessage.text,
                timestamp: lastMessage.timestamp,
              }
            : undefined,
        };
      })
    );

    res.json(result.filter(Boolean));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list conversations" });
  }
});

router.get("/conversations/:conversationId/messages", async (req, res) => {
  try {
    const actorId = req.actorId;
    if (!actorId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const paramsParsed = SendMessageParams.safeParse(req.params);
    if (!paramsParsed.success) {
      res.status(400).json({ error: "Invalid conversationId" });
      return;
    }

    const conversationId = paramsParsed.data.conversationId;

    const participation = await db.query.conversationParticipantsTable.findFirst({
      where: eq(conversationParticipantsTable.conversationId, conversationId),
    });
    if (!participation) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    const messages = await db.query.messagesTable.findMany({
      where: eq(messagesTable.conversationId, conversationId),
    });
    const sorted = [...messages].sort((a, b) => a.timestamp - b.timestamp);
    res.json(
      sorted.map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        senderId: m.senderId,
        senderName: m.senderName,
        text: m.text,
        timestamp: m.timestamp,
      }))
    );
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list messages" });
  }
});

router.post("/conversations/:conversationId/messages", async (req, res) => {
  try {
    const actorId = req.actorId;
    if (!actorId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const paramsParsed = SendMessageParams.safeParse(req.params);
    if (!paramsParsed.success) {
      res.status(400).json({ error: "Invalid conversationId" });
      return;
    }

    const bodyParsed = SendMessageBody.safeParse(req.body);
    if (!bodyParsed.success) {
      res.status(400).json({ error: "Invalid request", details: bodyParsed.error.flatten() });
      return;
    }

    const conversationId = paramsParsed.data.conversationId;
    const senderId = actorId;

    const actorUser = await db.query.usersTable.findFirst({ where: eq(usersTable.id, actorId) });
    const senderName = actorUser?.name ?? bodyParsed.data.senderName;

    const { text } = bodyParsed.data;

    const id = `msg_${nanoid()}`;
    const timestamp = Date.now();
    await db.insert(messagesTable).values({
      id,
      conversationId,
      senderId,
      senderName,
      text,
      timestamp,
    });

    res.status(201).json({
      id,
      conversationId,
      senderId,
      senderName,
      text,
      timestamp,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

export default router;
