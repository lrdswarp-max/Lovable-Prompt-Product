import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { api, type ApiConversation, type ApiMessage } from "@/lib/api";
import { useColors } from "@/hooks/useColors";

export default function TrainerChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [selected, setSelected] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ApiConversation[]>([]);
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [input, setInput] = useState("");
  const flatRef = useRef<FlatList>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 + 34 : insets.bottom;

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      let active = true;

      api.conversations.list(user.id).then((convs) => {
        if (active) setConversations(convs);
      }).catch(() => {});

      return () => { active = false; };
    }, [user])
  );

  useEffect(() => {
    if (!selected) return;
    let active = true;

    const loadMessages = () => {
      api.conversations.messages(selected).then((msgs) => {
        if (active) setMessages(msgs);
      }).catch(() => {});
    };

    loadMessages();
    pollRef.current = setInterval(loadMessages, 5000);
    return () => {
      active = false;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [selected]);

  const handleSend = async () => {
    if (!input.trim() || !selected || !user) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const text = input.trim();
    setInput("");
    try {
      const msg = await api.conversations.sendMessage(selected, {
        senderId: user.id,
        senderName: user.name,
        text,
      });
      setMessages((prev) => [...prev, msg]);
      // Refresh conversation list to update last message
      api.conversations.list(user.id).then(setConversations).catch(() => {});
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      // ignore
    }
  };

  const activeConv = conversations.find((c) => c.id === selected);

  if (selected && activeConv) {
    const convTitle = activeConv.isGroup
      ? (activeConv.title ?? "Group Chat")
      : activeConv.participantNames.find((n) => n !== user?.name) ?? "Student";

    return (
      <KeyboardAvoidingView behavior="padding" style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.chatHeader, { paddingTop: topPad + 12, borderBottomColor: colors.border, backgroundColor: colors.background }]}>
          <Pressable onPress={() => setSelected(null)} style={styles.backBtn} hitSlop={8}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
          <View style={[styles.convAvatar, { backgroundColor: colors.primary + "30" }]}>
            {activeConv.isGroup ? (
              <Feather name="users" size={18} color={colors.primary} />
            ) : (
              <Text style={[styles.convAvatarText, { color: colors.primary }]}>{convTitle.charAt(0)}</Text>
            )}
          </View>
          <View style={styles.convTitleBlock}>
            <Text style={[styles.convName, { color: colors.foreground }]}>{convTitle}</Text>
            {activeConv.isGroup && (
              <Text style={[styles.convSub, { color: colors.mutedForeground }]} numberOfLines={1}>
                {activeConv.participantNames.filter((n) => n !== user?.name).join(", ")}
              </Text>
            )}
          </View>
        </View>

        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => {
            const isMe = item.senderId === user?.id;
            return (
              <View style={[msgStyles.row, isMe ? msgStyles.rowRight : msgStyles.rowLeft]}>
                {!isMe && activeConv.isGroup && (
                  <View style={[msgStyles.avatar, { backgroundColor: colors.secondary ?? colors.muted }]}>
                    <Text style={[msgStyles.avatarText, { color: colors.mutedForeground }]}>{item.senderName.charAt(0)}</Text>
                  </View>
                )}
                <View style={msgStyles.bubbleWrapper}>
                  {!isMe && activeConv.isGroup && (
                    <Text style={[msgStyles.senderName, { color: colors.mutedForeground }]}>{item.senderName}</Text>
                  )}
                  <View style={[
                    msgStyles.bubble,
                    isMe
                      ? { backgroundColor: colors.primary }
                      : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
                  ]}>
                    <Text style={[msgStyles.text, { color: isMe ? "#fff" : colors.foreground }]}>{item.text}</Text>
                    <Text style={[msgStyles.time, { color: isMe ? "rgba(255,255,255,0.6)" : colors.mutedForeground }]}>
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                  </View>
                </View>
              </View>
            );
          }}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={messages.length > 0}
        />

        <View style={[styles.inputRow, { borderTopColor: colors.border, paddingBottom: Math.max(bottomPad, 8) + 8 }]}>
          <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.textInput, { color: colors.foreground }]}
              placeholder="Message..."
              placeholderTextColor={colors.mutedForeground}
              value={input}
              onChangeText={setInput}
              multiline
            />
          </View>
          <Pressable
            onPress={handleSend}
            style={[styles.sendBtn, { backgroundColor: input.trim() ? colors.primary : colors.muted }]}
          >
            <Feather name="send" size={18} color={input.trim() ? "#fff" : colors.mutedForeground} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.listHeader, { paddingTop: topPad + 16, borderBottomColor: colors.border }]}>
        <Text style={[styles.listTitle, { color: colors.foreground }]}>Messages</Text>
      </View>
      <FlatList
        data={conversations}
        keyExtractor={(c) => c.id}
        contentContainerStyle={[styles.convList, { paddingBottom: bottomPad + 16 }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={conversations.length > 0}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="message-circle" size={40} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No conversations yet</Text>
          </View>
        }
        renderItem={({ item }: { item: ApiConversation }) => {
          const lastMsg = item.lastMessage;
          const convTitle = item.isGroup
            ? (item.title ?? "Group")
            : item.participantNames.find((n) => n !== user?.name) ?? "Student";
          return (
            <Pressable
              onPress={() => setSelected(item.id)}
              style={[styles.convRow, { borderBottomColor: colors.border }]}
            >
              <View style={[styles.convAvatarLg, { backgroundColor: colors.primary + "30" }]}>
                {item.isGroup ? (
                  <Feather name="users" size={20} color={colors.primary} />
                ) : (
                  <Text style={[styles.convAvatarLgText, { color: colors.primary }]}>{convTitle.charAt(0)}</Text>
                )}
              </View>
              <View style={styles.convInfo}>
                <View style={styles.convTopRow}>
                  <Text style={[styles.convTitle, { color: colors.foreground }]}>{convTitle}</Text>
                  {lastMsg && (
                    <Text style={[styles.convTime, { color: colors.mutedForeground }]}>
                      {new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                  )}
                </View>
                {lastMsg && (
                  <Text style={[styles.convPreview, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {lastMsg.senderName === user?.name ? "You: " : ""}{lastMsg.text}
                  </Text>
                )}
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const msgStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginBottom: 8 },
  rowLeft: { justifyContent: "flex-start" },
  rowRight: { justifyContent: "flex-end" },
  avatar: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 11, fontWeight: "700" },
  bubbleWrapper: { gap: 2, maxWidth: "75%" },
  senderName: { fontSize: 11, fontWeight: "600", marginLeft: 2 },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, gap: 3 },
  text: { fontSize: 15, lineHeight: 21 },
  time: { fontSize: 10, alignSelf: "flex-end" },
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  chatHeader: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { padding: 4 },
  convAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  convAvatarText: { fontSize: 14, fontWeight: "700" },
  convTitleBlock: { flex: 1 },
  convName: { fontSize: 16, fontWeight: "700" },
  convSub: { fontSize: 11, marginTop: 1 },
  messageList: { padding: 16 },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 10, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1 },
  inputBox: { flex: 1, borderRadius: 22, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 10, maxHeight: 120 },
  textInput: { fontSize: 15, lineHeight: 20 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  listHeader: { paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  listTitle: { fontSize: 28, fontWeight: "800" },
  convList: { padding: 0 },
  convRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  convAvatarLg: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" },
  convAvatarLgText: { fontSize: 20, fontWeight: "700" },
  convInfo: { flex: 1, gap: 4 },
  convTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  convTitle: { fontSize: 16, fontWeight: "700" },
  convTime: { fontSize: 12 },
  convPreview: { fontSize: 13, lineHeight: 18 },
  empty: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 16 },
});
