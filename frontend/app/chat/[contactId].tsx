import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, SafeAreaView, Image, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius, API_BASE_URL } from '../../constants/theme';
import { useSocialStore } from '../../stores/socialStore';
import { useAuthStore } from '../../stores/authStore';

export default function ChatScreen() {
  const { contactId } = useLocalSearchParams();
  const router = useRouter();
  const cid = parseInt(contactId as string, 10);
  
  const { user } = useAuthStore();
  const { 
    activeChatMessages, 
    openChat, 
    sendMessage,
    inbox, friends, onlineFriends
  } = useSocialStore();

  const [contactInfo, setContactInfo] = useState<{ name: string; avatar: string | null; level?: number }>(
    { name: 'Trò chuyện', avatar: null, level: undefined }
  );

  useEffect(() => {
    const friend = friends.find(f => f.friend_id === cid);
    const inboxItem = inbox.find(i => i.contact_id === cid);

    if (friend) {
      setContactInfo({
        name: friend.name,
        avatar: friend.avatar_original_url || friend.sprite_idle_url || null,
        level: friend.level,
      });
    } else if (inboxItem) {
      setContactInfo({ name: inboxItem.contact_name, avatar: inboxItem.contact_avatar });
    }
  }, [cid, friends, inbox]);

  const isOnline = onlineFriends.includes(cid);

  const [text, setText] = useState('');

  useEffect(() => {
    if (cid) {
      openChat(cid);
    }
  }, [cid]);

  const handleSend = () => {
    if (text.trim() === '') return;
    sendMessage(cid, text.trim());
    setText('');
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMine = item.sender_id === user?.id;
    return (
      <View style={[styles.messageWrapper, isMine ? styles.messageMine : styles.messageTheirs]}>
        <View style={[styles.messageBubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
          <Text style={[styles.messageText, isMine ? styles.textMine : styles.textTheirs]}>
            {item.content}
          </Text>
        </View>
        <Text style={styles.timeText}>
          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  // Build avatar URI
  let avatarUri = contactInfo.avatar;
  if (avatarUri && avatarUri.includes('uploads/') && !avatarUri.startsWith('http')) {
    avatarUri = `${API_BASE_URL}/${avatarUri}`;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* ── CUSTOM CHAT HEADER ── */}
      <View style={styles.chatHeader}>
        {/* Nút quay lại */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={Colors.text.primary} />
        </TouchableOpacity>

        {/* Avatar */}
        <View style={styles.avatarWrapper}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={24} color={Colors.brand.cyan} />
            </View>
          )}
          {/* Online dot */}
          <View style={[
            styles.onlineDot,
            { backgroundColor: isOnline ? Colors.brand.emerald : Colors.text.muted }
          ]} />
        </View>

        {/* Name + Status */}
        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>{contactInfo.name}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusIndicator, {
              backgroundColor: isOnline ? Colors.brand.emerald : Colors.text.muted,
            }]} />
            <Text style={[styles.headerStatus, {
              color: isOnline ? Colors.brand.emerald : Colors.text.muted,
            }]}>
              {isOnline ? 'Đang hoạt động' : 'Ngoại tuyến'}
            </Text>
            {contactInfo.level ? (
              <Text style={styles.levelChip}>Lv.{contactInfo.level}</Text>
            ) : null}
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={10}
      >
        <FlatList
          data={activeChatMessages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMessage}
          inverted
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Nhập tin nhắn..."
            placeholderTextColor={Colors.text.muted}
            value={text}
            onChangeText={setText}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, text.trim() === '' && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={text.trim() === ''}
          >
            <Ionicons name="send" size={20} color={text.trim() === '' ? Colors.text.muted : '#FFF'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
  },
  container: {
    flex: 1,
  },

  // ── Chat Header ──────────────────────────────────────
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.bg.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
    gap: Spacing.sm,
  },
  backBtn: {
    padding: 4,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: Colors.brand.cyan,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.bg.elevated,
    borderWidth: 2,
    borderColor: Colors.brand.cyan,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Colors.bg.card,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  statusIndicator: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  headerStatus: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  levelChip: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.brand.gold,
    backgroundColor: Colors.brand.gold + '20',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
    marginLeft: 4,
    overflow: 'hidden',
  },

  // ── Messages ─────────────────────────────────────────
  listContent: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  messageWrapper: {
    maxWidth: '80%',
    marginBottom: Spacing.sm,
  },
  messageMine: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  messageTheirs: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleMine: {
    backgroundColor: Colors.brand.cyan,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: Colors.bg.card,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  messageText: {
    fontSize: FontSize.base,
    lineHeight: 20,
  },
  textMine: {
    color: '#000',
    fontWeight: '500',
  },
  textTheirs: {
    color: Colors.text.primary,
  },
  timeText: {
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    marginTop: 4,
    marginHorizontal: 4,
  },

  // ── Input ────────────────────────────────────────────
  inputContainer: {
    flexDirection: 'row',
    padding: Spacing.md,
    backgroundColor: Colors.bg.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border.default,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: Colors.bg.elevated,
    color: Colors.text.primary,
    borderRadius: 20,
    paddingHorizontal: Spacing.md,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: FontSize.base,
    maxHeight: 100,
    minHeight: 40,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.brand.cyan,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
    marginBottom: 0,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.bg.elevated,
  },
});
