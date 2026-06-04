import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../constants/theme';
import { socialApi } from '../services/socialApi';
import { messageApi } from '../services/messageApi';
import { useAuthStore } from './authStore';

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  is_read: boolean | number;
  created_at: string;
  sender_name?: string;
}

interface InboxItem {
  contact_id: number;
  contact_name: string;
  contact_avatar: string | null;
  last_message_time: string;
  unread_count: number;
}

interface SocialState {
  socket: Socket | null;
  isConnected: boolean;
  
  friends: any[];
  pendingRequests: any[];
  inbox: InboxItem[];
  
  onlineFriends: number[];
  
  activeChatId: number | null;
  activeChatMessages: Message[];

  // Actions
  connectSocket: (userId: number) => void;
  disconnectSocket: () => void;
  
  fetchFriends: () => Promise<void>;
  fetchPending: () => Promise<void>;
  fetchInbox: () => Promise<void>;
  
  openChat: (contactId: number) => Promise<void>;
  sendMessage: (contactId: number, content: string) => Promise<void>;
  receiveMessage: (msg: Message) => void;

  // Search & Friend actions
  searchResults: any[];
  searchUsers: (query: string) => Promise<void>;
  sendFriendRequest: (email: string) => Promise<void>;
  acceptRequest: (requestId: number) => Promise<void>;
  rejectRequest: (requestId: number) => Promise<void>;
  removeFriend: (contactId: number) => Promise<void>;
}

export const useSocialStore = create<SocialState>((set, get) => ({
  socket: null,
  isConnected: false,
  
  friends: [],
  pendingRequests: [],
  inbox: [],
  
  onlineFriends: [],
  
  activeChatId: null,
  activeChatMessages: [],

  connectSocket: (userId: number) => {
    const currentSocket = get().socket;
    if (currentSocket) return;

    const newSocket = io(API_BASE_URL);

    newSocket.on('connect', () => {
      set({ isConnected: true });
      newSocket.emit('identify', userId);
    });

    newSocket.on('disconnect', () => {
      set({ isConnected: false });
    });

    newSocket.on('new_message', (msg: Message) => {
      get().receiveMessage(msg);
    });

    newSocket.on('friend_online', ({ userId }: { userId: number }) => {
      set((state) => ({
        onlineFriends: [...state.onlineFriends.filter(id => id !== userId), userId]
      }));
    });

    newSocket.on('friend_offline', ({ userId }: { userId: number }) => {
      set((state) => ({
        onlineFriends: state.onlineFriends.filter(id => id !== userId)
      }));
    });

    newSocket.on('online_friends_list', (onlineIds: number[]) => {
      set({ onlineFriends: onlineIds });
    });

    newSocket.on('messages_read', ({ readerId }: { readerId: number }) => {
      const { activeChatId, activeChatMessages } = get();
      if (activeChatId === readerId) {
        set({
          activeChatMessages: activeChatMessages.map(msg => 
            msg.is_read ? msg : { ...msg, is_read: true }
          )
        });
      }
    });

    set({ socket: newSocket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },

  fetchFriends: async () => {
    try {
      const friends = await socialApi.getFriends();
      set({ friends });
    } catch (err) {
      console.error('Lỗi tải bạn bè:', err);
    }
  },

  fetchPending: async () => {
    try {
      const pending = await socialApi.getPendingRequests();
      set({ pendingRequests: pending });
    } catch (err) {
      console.error('Lỗi tải lời mời:', err);
    }
  },

  fetchInbox: async () => {
    try {
      const inbox = await messageApi.getInbox();
      set({ inbox });
    } catch (err) {
      console.error('Lỗi tải inbox:', err);
    }
  },

  openChat: async (contactId: number) => {
    set({ activeChatId: contactId, activeChatMessages: [] });
    try {
      const res = await messageApi.getConversation(contactId);
      // Backend trả về cũ->mới. Dùng FlashList inverted nên cần data mới nhất ở ĐẦU mảng
      set({ activeChatMessages: res.data.reverse() });
      get().fetchInbox(); // Refresh inbox để cập nhật unread_count về 0
    } catch (err) {
      console.error('Lỗi tải tin nhắn:', err);
    }
  },

  sendMessage: async (contactId: number, content: string) => {
    try {
      const sentMsg = await messageApi.sendMessage(contactId, content);
      const newMsg = {
        id: sentMsg.data.id || Date.now(), // fallback
        sender_id: sentMsg.data.sender_id || 0,
        receiver_id: contactId,
        content,
        is_read: false,
        created_at: new Date().toISOString(),
      };
      // Thêm vào chat hiện tại
      set((state) => ({
        activeChatMessages: [newMsg, ...state.activeChatMessages]
      }));
      // Cập nhật inbox
      get().fetchInbox();
    } catch (err) {
      console.error('Lỗi gửi tin nhắn:', err);
    }
  },

  receiveMessage: (msg: Message) => {
    const { activeChatId, activeChatMessages } = get();
    
    // Nếu đang mở chat với người gửi, thêm vào danh sách và mark as read (cần update backend if needed, nhưng lấy lúc mở là đủ)
    if (activeChatId === msg.sender_id) {
      set({ activeChatMessages: [msg, ...activeChatMessages] });
    }
    
    // Luôn refresh inbox khi có tin nhắn mới
    get().fetchInbox();
  },

  searchResults: [],
  searchUsers: async (query: string) => {
    try {
      if (!query.trim()) {
        set({ searchResults: [] });
        return;
      }
      const results = await socialApi.searchUsers(query);
      set({ searchResults: results });
    } catch (err) {
      console.error('Lỗi tìm kiếm:', err);
    }
  },

  sendFriendRequest: async (email: string) => {
    try {
      await socialApi.sendFriendRequest(email);
      // Cập nhật lại searchResults (chuyển relationship sang request_sent)
      set((state) => ({
        searchResults: state.searchResults.map((u) => 
          u.email === email ? { ...u, relationship: 'request_sent' } : u
        )
      }));
    } catch (err: any) {
      console.error('Lỗi gửi lời mời:', err.response?.data?.message || err.message);
      throw err;
    }
  },

  acceptRequest: async (requestId: number) => {
    try {
      await socialApi.acceptFriendRequest(requestId);
      get().fetchPending();
      get().fetchFriends();
    } catch (err: any) {
      console.error('Lỗi chấp nhận:', err.response?.data?.message || err.message);
    }
  },

  rejectRequest: async (requestId: number) => {
    try {
      await socialApi.rejectFriendRequest(requestId);
      get().fetchPending();
    } catch (err: any) {
      console.error('Lỗi từ chối:', err.response?.data?.message || err.message);
    }
  },

  removeFriend: async (contactId: number) => {
    try {
      await socialApi.removeFriend(contactId);
      get().fetchFriends();
    } catch (err: any) {
      console.error('Lỗi xóa bạn:', err.response?.data?.message || err.message);
    }
  }
}));
