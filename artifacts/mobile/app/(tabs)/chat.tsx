import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef } from "react";
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
import { useData } from "@/context/DataContext";
import type { Message } from "@/data/types";
import { useColors } from "@/hooks/useColors";

export default function StudentChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { conversations, sendMessage } = useData();

  const conv = conversations[0];
  const messages = conv?.messages ?? [];
  const trainerName = conv?.participantNames.find((n) => n !== user?.name) ?? "Coach";

  const [input, setInput] = React.useState("");
  const flatRef = useRef<FlatList>(null);

  const handleSend = async () => {
    if (!input.trim() || !conv) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const msg: Message = {
      id: `m${Date.now()}`,
      senderId: user?.id ?? "student1",
      senderName: user?.name ?? "You",
      text: input.trim(),
      timestamp: Date.now(),
      pending: false,
    };
    await sendMessage(conv.id, msg);
    setInput("");
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 80);
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const renderItem = ({ item }: { item: Message }) => {
    const isMe = item.senderId === user?.id;
    return (
      <View style={[styles.bubbleRow, isMe ? styles.bubbleRowRight : styles.bubbleRowLeft]}>
        {!isMe && (
          <View style={[styles.avatar, { backgroundColor: colors.primary + "30" }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {item.senderName.charAt(0)}
            </Text>
          </View>
        )}
        <View
          style={[
            styles.bubble,
            isMe
              ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 }
              : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderBottomLeftRadius: 4 },
            { maxWidth: "75%" },
          ]}
        >
          <Text style={[styles.bubbleText, { color: isMe ? "#fff" : colors.foreground }]}>
            {item.text}
          </Text>
          <Text style={[styles.bubbleTime, { color: isMe ? "rgba(255,255,255,0.6)" : colors.mutedForeground }]}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      style={[styles.root, { backgroundColor: colors.background }]}
    >
      <View
        style={[
          styles.chatHeader,
          { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        <View style={[styles.avatarLg, { backgroundColor: colors.primary + "30" }]}>
          <Text style={[styles.avatarLgText, { color: colors.primary }]}>
            {trainerName.charAt(0)}
          </Text>
        </View>
        <View>
          <Text style={[styles.chatName, { color: colors.foreground }]}>{trainerName}</Text>
          <Text style={[styles.chatSub, { color: colors.mutedForeground }]}>Your trainer</Text>
        </View>
      </View>

      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={renderItem}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={!!messages.length}
      />

      <View
        style={[
          styles.inputRow,
          { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: bottomPad + 8 },
        ]}
      >
        <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TextInput
            style={[styles.textInput, { color: colors.foreground }]}
            placeholder="Message your trainer..."
            placeholderTextColor={colors.mutedForeground}
            value={input}
            onChangeText={setInput}
            multiline
            returnKeyType="default"
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

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  avatarLg: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  avatarLgText: { fontSize: 16, fontWeight: "700" },
  chatName: { fontSize: 16, fontWeight: "700" },
  chatSub: { fontSize: 12, marginTop: 1 },
  messageList: { padding: 16, gap: 10 },
  bubbleRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginBottom: 6 },
  bubbleRowLeft: { justifyContent: "flex-start" },
  bubbleRowRight: { justifyContent: "flex-end" },
  avatar: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 11, fontWeight: "700" },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, gap: 4 },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  bubbleTime: { fontSize: 10, alignSelf: "flex-end" },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  inputBox: { flex: 1, borderRadius: 22, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 10, maxHeight: 120 },
  textInput: { fontSize: 15, lineHeight: 20 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
});
