import api from './api';

export const socialApi = {
  // Gửi lời mời kết bạn (hoặc tự kết bạn nếu bên kia đã mời)
  sendFriendRequest: async (email: string) => {
    const response = await api.post('/social/friend-request', { email });
    return response.data;
  },

  // Chấp nhận lời mời kết bạn
  acceptFriendRequest: async (contactId: number) => {
    const response = await api.put(`/social/friend-request/${contactId}/accept`);
    return response.data;
  },

  // Lấy danh sách lời mời kết bạn (pending)
  getPendingRequests: async () => {
    const response = await api.get('/social/pending');
    return response.data.data;
  },

  // Lấy danh sách bạn bè 1-1 (accepted)
  getFriends: async () => {
    const response = await api.get('/social/friends');
    return response.data.data;
  },

  // Từ chối lời mời kết bạn
  rejectFriendRequest: async (contactId: number) => {
    const response = await api.put(`/social/friend-request/${contactId}/reject`);
    return response.data;
  },

  // Hủy kết bạn
  removeFriend: async (contactId: number) => {
    const response = await api.delete(`/social/friends/${contactId}`);
    return response.data;
  },

  // Tìm kiếm bạn bè
  searchUsers: async (query: string) => {
    const response = await api.get(`/social/search?q=${encodeURIComponent(query)}`);
    return response.data.data;
  }
};
