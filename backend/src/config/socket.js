const { Server } = require('socket.io');

// ══════════════════════════════════════════════════════════════════
// SOCKET.IO SERVER CONFIG
// Quản lý kết nối real-time, online status và đẩy tin nhắn
// ══════════════════════════════════════════════════════════════════

let io;
// Map lưu trữ: userId (int) -> socketId (string)
const userSockets = new Map();

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: '*', // Cho phép mọi kết nối (vì React Native gọi từ localhost)
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 [Socket.IO] Client connected: ${socket.id}`);

    // Client gửi event 'identify' ngay khi kết nối kèm theo userId
    socket.on('identify', async (userId) => {
      userSockets.set(userId, socket.id);
      console.log(`   👤 User ID ${userId} identified on socket ${socket.id}`);
      console.log(`   🟢 Users online: ${userSockets.size}`);

      // Lấy danh sách bạn bè
      const FriendModel = require('../models/friendModel');
      const friends = await FriendModel.getFriendsList(userId);
      
      const onlineFriends = [];
      
      friends.forEach(friend => {
        const friendId = friend.friend_id;
        if (userSockets.has(friendId)) {
          onlineFriends.push(friendId);
          // Báo cho bạn bè biết mình online
          io.to(userSockets.get(friendId)).emit('friend_online', { userId });
        }
      });

      // Báo cho chính mình biết những ai đang online
      socket.emit('online_friends_list', onlineFriends);
    });

    socket.on('disconnect', async () => {
      // Tìm userId sở hữu socket này để xoá
      for (const [userId, socketId] of userSockets.entries()) {
        if (socketId === socket.id) {
          userSockets.delete(userId);
          console.log(`🔌 [Socket.IO] User ID ${userId} disconnected`);
          console.log(`   🟢 Users online: ${userSockets.size}`);

          // Báo cho bạn bè biết mình offline
          const FriendModel = require('../models/friendModel');
          const friends = await FriendModel.getFriendsList(userId);
          
          friends.forEach(friend => {
            const friendId = friend.friend_id;
            if (userSockets.has(friendId)) {
              io.to(userSockets.get(friendId)).emit('friend_offline', { userId });
            }
          });

          break;
        }
      }
    });
  });

  return io;
}

// Hàm đẩy event trực tiếp tới user cụ thể
function emitToUser(userId, eventName, payload) {
  if (!io) return;
  const socketId = userSockets.get(userId);
  if (socketId) {
    io.to(socketId).emit(eventName, payload);
    return true; // Push thành công
  }
  return false; // User không online
}

module.exports = {
  initSocket,
  emitToUser,
};
