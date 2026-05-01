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

  const prompt = `Bạn là AI assistant giúp phân tích nhiệm vụ từ ngôn ngữ tự nhiên tiếng Việt.
Hôm nay là ${today} (UTC+7, Việt Nam).

Phân tích câu sau và trả về JSON hợp lệ với các trường:
- "title": tên task ngắn gọn (tiếng Việt, tối đa 60 ký tự)
- "due_date": ISO 8601 datetime với timezone +07:00 (nếu có ngày/giờ cụ thể)
- "duration_minutes": số nguyên phút ước tính (nếu có, null nếu không có)
- "tags": mảng string tags phù hợp (VD: ["thể thao", "sức khỏe"])
- "priority": "low", "medium", hoặc "high" dựa theo mức độ quan trọng
- "description": mô tả ngắn thêm nếu cần (có thể null)

Câu nhập: "${text}"

Chỉ trả về JSON thuần, không có markdown, không có text thêm, không có code block.`;

  try {
    const model = getClient().getGenerativeModel({ model: 'gemini-1.5-flash' });
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
    const model = getClient().getGenerativeModel({ model: 'gemini-1.5-flash' });
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
