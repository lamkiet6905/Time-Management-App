import api from './api';

export const messageApi = {
  // Lấy danh sách hộp thoại (Inbox)
  getInbox: async () => {
    const response = await api.get('/messages/inbox');
    return response.data.data;
  },

  // Lấy lịch sử chat với 1 người cụ thể
  getConversation: async (contactId: number, page: number = 1, limit: number = 50) => {
    const response = await api.get(`/messages/${contactId}?page=${page}&limit=${limit}`);
    return response.data; // Trả về cả count và page
  },

  // Gửi tin nhắn mới
  sendMessage: async (contactId: number, content: string) => {
    const response = await api.post(`/messages/${contactId}`, { content });
    return response.data;
  },
};
