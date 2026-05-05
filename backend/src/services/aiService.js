/**
 * Gemini AI Service
 * - parseTaskFromText: Parses natural language → task fields
 * - evaluateDifficulty: Evaluates task difficulty → easy/normal/hard/epic
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;

function getClient() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'REPLACE_WITH_YOUR_GEMINI_KEY') {
      throw new Error('GEMINI_API_KEY not configured. Please add your key to .env file. Get one at https://aistudio.google.com/app/apikey');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

/**
 * Parse natural language text into task fields.
 * @param {string} text - User input like "ngày mai 8 giờ đá bóng 2 tiếng"
 * @returns {{ title, due_date, duration_minutes, tags, priority, description }}
 */
async function parseTaskFromText(text) {
  const now = new Date();
  const vietnamOffset = 7 * 60; // UTC+7
  const localNow = new Date(now.getTime() + vietnamOffset * 60000);
  const today = localNow.toISOString().slice(0, 10);

  const localTime = `${String(localNow.getHours()).padStart(2, '0')}:${String(localNow.getMinutes()).padStart(2, '0')}`;

  const prompt = `Bạn là AI assistant giúp phân tích nhiệm vụ từ ngôn ngữ tự nhiên tiếng Việt.
Hôm nay là ${today} (UTC+7, Việt Nam). Giờ hiện tại là ${localTime}.

Phân tích câu sau và trả về JSON hợp lệ với các trường:
- "title": tên task ngắn gọn (tiếng Việt, tối đa 60 ký tự)
- "due_date": ISO 8601 datetime với timezone +07:00. NẾU CÓ THỜI GIAN: Nếu nói chung chung -> "sáng" (08:00), "trưa" (12:00), "chiều" (14:00), "tối" (19:00). Nếu nói "ngay bây giờ", "ngay lúc này" -> cộng thêm 5 phút từ ${localTime}. Nếu không nhắc gì đến thời gian -> null.
- "duration_minutes": TỐI QUAN TRỌNG: Nếu người dùng không nhập rõ độ dài thời gian (chỉ nói "đi chợ" thay vì "đi chợ 30 phút"), BẮT BUỘC trả về null. Không được tự suy diễn!
- "tags": mảng string (BẮT BUỘC CHỈ CHỌN trong danh sách: "Học tập", "Công việc", "Sức khỏe", "Nhà cửa", "Giải trí")
- "priority": "low", "medium", hoặc "high". Nếu việc diễn ra "ngay lúc này" hoặc rất sát giờ hiện tại -> BẮT BUỘC "high".
- "description": mô tả ngắn thêm nếu cần
- "is_lazy": true nếu đây là hành động lười biếng, trì hoãn, vô bổ (như lướt top top, ngủ nướng, chơi game quá mức...), ngược lại false.

Câu nhập: "${text}"

Chỉ trả về JSON thuần, không có markdown, không có text thêm, không có code block.`;

  try {
    const model = getClient().getGenerativeModel({ model: 'gemini-flash-latest' });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    // Clean up markdown code blocks if present
    const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      title: parsed.title || text.slice(0, 60),
      due_date: parsed.due_date || null,
      duration_minutes: parsed.duration_minutes || null,
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      priority: ['low', 'medium', 'high'].includes(parsed.priority) ? parsed.priority : 'medium',
      description: parsed.description || null,
      is_lazy: !!parsed.is_lazy,
    };
  } catch (error) {
    if (error.message.includes('GEMINI_API_KEY')) throw error;
    console.error('AI parse error:', error.message);
    // Fallback: return basic task
    return {
      title: text.slice(0, 60),
      due_date: null,
      duration_minutes: null,
      tags: [],
      priority: 'medium',
      description: null,
      is_lazy: false,
    };
  }
}

/**
 * Evaluate task difficulty based on its properties.
 * @returns {{ difficulty: 'easy'|'normal'|'hard'|'epic', reason: string }}
 */
async function evaluateDifficulty(taskData) {
  const { title, description, duration_minutes, priority, tags } = taskData;

  const prompt = `Bạn là AI đánh giá độ khó của nhiệm vụ trong app quản lý thời gian gamification.

Đánh giá độ khó dựa trên:
- Easy (Dễ): Task đơn giản, ≤30 phút, thường ngày (VD: uống nước, đọc 10 trang)
- Normal (Bình thường): Task trung bình, 30-90 phút (VD: đi gym, học bài 1 tiếng)
- Hard (Khó): Task phức tạp, >90 phút hoặc quan trọng cao (VD: làm đề tài, họp quan trọng)
- Epic (Sử thi): Task rất lớn, milestone dài hạn (VD: hoàn thành luận văn, thi đại học)

Thông tin task:
- Tiêu đề: ${title}
- Mô tả: ${description || 'Không có'}
- Thời lượng: ${duration_minutes ? duration_minutes + ' phút' : 'Không rõ'}
- Ưu tiên: ${priority}
- Tags: ${tags && tags.length > 0 ? tags.join(', ') : 'Không có'}

Trả về JSON: {"difficulty": "easy|normal|hard|epic", "reason": "lý do ngắn gọn (tối đa 100 ký tự)"}
Chỉ JSON thuần, không markdown.`;

  try {
    const model = getClient().getGenerativeModel({ model: 'gemini-flash-latest' });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    const validDifficulties = ['easy', 'normal', 'hard', 'epic'];
    return {
      difficulty: validDifficulties.includes(parsed.difficulty) ? parsed.difficulty : 'normal',
      reason: parsed.reason || '',
    };
  } catch (error) {
    if (error.message.includes('GEMINI_API_KEY')) throw error;
    console.error('AI difficulty eval error:', error.message);
    // Fallback heuristic
    if (!duration_minutes) return { difficulty: 'normal', reason: 'Ước tính mặc định' };
    if (duration_minutes <= 30) return { difficulty: 'easy', reason: 'Thời lượng ngắn' };
    if (duration_minutes <= 90) return { difficulty: 'normal', reason: 'Thời lượng trung bình' };
    if (duration_minutes <= 180) return { difficulty: 'hard', reason: 'Thời lượng dài' };
    return { difficulty: 'epic', reason: 'Thời lượng rất dài' };
  }
}

module.exports = { parseTaskFromText, evaluateDifficulty };
