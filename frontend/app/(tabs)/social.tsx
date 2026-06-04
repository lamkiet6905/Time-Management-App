import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius, DoodleStyle } from '../../constants/theme';
import { useSocialStore } from '../../stores/socialStore';
import { useAuthStore } from '../../stores/authStore';

type Tab = 'inbox' | 'friends' | 'requests';

export default function SocialScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { 
    inbox, friends, pendingRequests, searchResults, onlineFriends,
    fetchInbox, fetchFriends, fetchPending,
    connectSocket, searchUsers, sendFriendRequest, acceptRequest, rejectRequest, removeFriend
  } = useSocialStore();
  
  const [activeTab, setActiveTab] = useState<Tab>('inbox');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Khởi tạo data & kết nối Socket
  useEffect(() => {
    if (user?.id) {
      connectSocket(user.id);
      loadData();
    }
  }, [user]);

  // Debounce search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length > 0) {
        setIsSearching(true);
        await searchUsers(searchQuery);
        setIsSearching(false);
      } else {
        searchUsers(''); // clear search
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const loadData = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchInbox(),
      fetchFriends(),
      fetchPending()
    ]);
    setRefreshing(false);
  };

  const handleAddFriend = async (email: string) => {
    try {
      await sendFriendRequest(email);
      Alert.alert('Thành công', 'Đã gửi lời mời kết bạn!');
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể gửi lời mời');
    }
  };

  const handleRemoveFriend = (friendId: number, friendName: string) => {
    Alert.alert('Hủy kết bạn', `Bạn có chắc chắn muốn hủy kết bạn với ${friendName}?`, [
      { text: 'Hủy', style: 'cancel' },
      { 
        text: 'Đồng ý', 
        style: 'destructive',
        onPress: () => removeFriend(friendId)
      }
    ]);
  };

  // ── RENDERS ────────────────────────────────────────────────────────

  const renderInboxItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.listItem}
      onPress={() => router.push(`/chat/${item.contact_id}`)}
    >
      <View style={styles.avatarPlaceholder}>
        <Ionicons name="person" size={24} color={Colors.brand.cyan} />
        {onlineFriends.includes(item.contact_id) && <View style={styles.onlineDot} />}
      </View>
      <View style={styles.listContent}>
        <Text style={styles.listTitle}>{item.contact_name}</Text>
        <Text style={styles.listSubtitle} numberOfLines={1}>Chạm để trò chuyện</Text>
      </View>
      <View style={styles.listRight}>
        {item.unread_count > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unread_count}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderFriendItem = ({ item }: { item: any }) => {
    const contactName = item.name;
    const contactId = item.friend_id;

    return (
      <TouchableOpacity 
        style={styles.listItem}
        onPress={() => router.push(`/chat/${contactId}`)}
      >
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="people" size={24} color={Colors.brand.violet} />
          {onlineFriends.includes(contactId) && <View style={styles.onlineDot} />}
        </View>
        <View style={styles.listContent}>
          <Text style={styles.listTitle}>{contactName}</Text>
          <Text style={styles.listSubtitle}>{onlineFriends.includes(contactId) ? 'Đang hoạt động' : 'Ngoại tuyến'}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: Colors.status.error + '20', marginRight: 12 }]} 
            onPress={() => handleRemoveFriend(contactId, contactName)}
          >
            <Ionicons name="person-remove" size={18} color={Colors.status.error} />
          </TouchableOpacity>
          <Ionicons name="chatbubble-ellipses" size={24} color={Colors.brand.cyan} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderSearchItem = ({ item }: { item: any }) => (
    <View style={styles.listItem}>
      <View style={styles.avatarPlaceholder}>
        <Ionicons name="person-outline" size={24} color={Colors.text.secondary} />
      </View>
      <View style={styles.listContent}>
        <Text style={styles.listTitle}>{item.name}</Text>
        <Text style={styles.listSubtitle}>Cấp {item.level}</Text>
      </View>
      <View style={styles.listRight}>
        {item.relationship === 'friend' ? (
          <Ionicons name="checkmark-circle" size={28} color={Colors.brand.emerald} />
        ) : item.relationship === 'request_sent' || item.relationship === 'request_received' ? (
          <Text style={{ color: Colors.text.muted, fontWeight: 'bold' }}>Đang chờ...</Text>
        ) : (
          <TouchableOpacity 
            style={styles.addBtn}
            onPress={() => handleAddFriend(item.email)}
          >
            <Ionicons name="person-add" size={16} color="#FFF" />
            <Text style={styles.addBtnText}>Kết bạn</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderPendingItem = ({ item }: { item: any }) => {
    const contactName = item.requester_name;

    return (
      <View style={styles.listItem}>
        <View style={styles.listContent}>
          <Text style={styles.listTitle}>{contactName}</Text>
          <Text style={styles.listSubtitle}>Muốn kết bạn với bạn</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.brand.emerald }]} onPress={() => acceptRequest(item.id)}>
            <Ionicons name="checkmark" size={20} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.status.error }]} onPress={() => rejectRequest(item.id)}>
            <Ionicons name="close" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderTabContent = () => {
    if (activeTab === 'inbox') {
      return (
        <FlatList
          data={inbox}
          keyExtractor={(item) => item.contact_id.toString()}
          renderItem={renderInboxItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor={Colors.brand.cyan} />}
          ListEmptyComponent={<Text style={styles.emptyText}>Chưa có tin nhắn nào</Text>}
        />
      );
    }
    if (activeTab === 'friends') {
      return (
        <>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={Colors.text.muted} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm bạn bè theo tên/email..."
              placeholderTextColor={Colors.text.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
            {isSearching && <ActivityIndicator size="small" color={Colors.brand.violet} />}
          </View>

          {searchQuery.trim().length > 0 ? (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderSearchItem}
              ListEmptyComponent={<Text style={styles.emptyText}>Không tìm thấy ai</Text>}
            />
          ) : (
            <FlatList
              data={friends}
              keyExtractor={(item) => item.friend_id.toString()}
              renderItem={renderFriendItem}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor={Colors.brand.cyan} />}
              ListEmptyComponent={<Text style={styles.emptyText}>Bạn chưa có người bạn nào</Text>}
            />
          )}
        </>
      );
    }
    return (
      <FlatList
        data={pendingRequests}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderPendingItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor={Colors.brand.cyan} />}
        ListEmptyComponent={<Text style={styles.emptyText}>Không có lời mời nào</Text>}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabHeader}>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'inbox' && styles.tabActive]} onPress={() => setActiveTab('inbox')}>
          <Text style={[styles.tabText, activeTab === 'inbox' && styles.tabTextActive]}>Tin nhắn</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'friends' && styles.tabActive]} onPress={() => { setActiveTab('friends'); setSearchQuery(''); }}>
          <Text style={[styles.tabText, activeTab === 'friends' && styles.tabTextActive]}>Bạn bè</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'requests' && styles.tabActive]} onPress={() => setActiveTab('requests')}>
          <Text style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}>
            Lời mời {pendingRequests.length > 0 && `(${pendingRequests.length})`}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {renderTabContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  tabHeader: { flexDirection: 'row', paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.sm, gap: Spacing.sm },
  tabButton: { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center', borderRadius: BorderRadius.full, backgroundColor: Colors.bg.card },
  tabActive: { backgroundColor: Colors.brand.cyan },
  tabText: { color: Colors.text.secondary, fontWeight: '600', fontSize: FontSize.sm },
  tabTextActive: { color: Colors.bg.primary, fontWeight: '800' },
  content: { flex: 1, paddingHorizontal: Spacing.md },
  
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bg.elevated,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    marginBottom: Spacing.md,
  },
  searchInput: { flex: 1, fontSize: FontSize.base, color: Colors.text.primary, fontWeight: 'bold' },

  listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border.default },
  avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.bg.elevated, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  listContent: { flex: 1 },
  listTitle: { color: Colors.text.primary, fontSize: FontSize.base, fontWeight: '700' },
  listSubtitle: { color: Colors.text.secondary, fontSize: FontSize.sm, marginTop: 2 },
  listRight: { alignItems: 'flex-end', justifyContent: 'center' },
  
  unreadBadge: { backgroundColor: Colors.status.error, borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  unreadText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  emptyText: { color: Colors.text.muted, textAlign: 'center', marginTop: Spacing.xl, fontSize: FontSize.base, fontWeight: 'bold' },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.brand.violet,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: BorderRadius.sm,
  },
  addBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: FontSize.sm },
  
  actionBtn: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.brand.emerald,
    borderWidth: 2,
    borderColor: Colors.bg.primary,
  },
});
