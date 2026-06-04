const { GoogleGenAI } = require('@google/genai');
const { pool } = require('../config/db');
const fs = require('fs');
const path = require('path');

// ══════════════════════════════════════════════════════════════════
// IMAGE SERVICE — Hệ thống lai (Hybrid AI Pipeline) v2
//
// Luồng xử lý:
// 1. Gemini Vision:  Ảnh chân dung → Text mô tả đặc điểm
// 2. Pollinations:   Text → Avatar pixel art (ĐỒNG BỘ, trả về ngay)
// 3. Pollinations:   Text → 3 Sprite pixel art (BẤT ĐỒNG BỘ, chạy ngầm)
// 4. Background Removal: Tách nền cho tất cả ảnh
//
// Tất cả ảnh đều dùng phong cách PIXEL ART nhất quán.
// ══════════════════════════════════════════════════════════════════

const SPRITES_DIR = path.join(__dirname, '../../uploads/sprites');
if (!fs.existsSync(SPRITES_DIR)) {
  fs.mkdirSync(SPRITES_DIR, { recursive: true });
}

// ── Khởi tạo Gemini SDK ───────────────────────────────────────
function getGenAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY chưa được cấu hình.');
  }
  return new GoogleGenAI({ apiKey });
}

// ── Gọi Pollinations.ai sinh ảnh + xóa nền ───────────────────
async function generateAndRemoveBg(promptText, width, height, seed) {
  const { removeBackground } = require('@imgly/background-removal-node');

  const encodedPrompt = encodeURIComponent(promptText);
  const apiKey = process.env.POLLINATIONS_API_KEY || '';
  const url = `https://gen.pollinations.ai/image/${encodedPrompt}?model=klein&width=${width}&height=${height}&seed=${seed}&enhance=false&nologo=true${apiKey ? `&key=${apiKey}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Accept': 'image/png' },
  });

  if (!response.ok) {
    throw new Error(`Pollinations API trả về ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  let buffer = Buffer.from(arrayBuffer);

  if (buffer.length < 1024) {
    throw new Error(`Ảnh trả về bị lỗi (quá nhỏ: ${buffer.length} bytes)`);
  }

  // Xóa nền
  const blobNoBg = await removeBackground(new Blob([buffer], { type: 'image/png' }));
  buffer = Buffer.from(await blobNoBg.arrayBuffer());

  return buffer;
}

const ImageService = {

  // ═══════════════════════════════════════════════════════════════
  // BƯỚC 1: Phân tích ảnh chân dung bằng Gemini Vision
  // ═══════════════════════════════════════════════════════════════
  async analyzePortrait(imageBuffer) {
    console.log(`  🧠 Đang phân tích ảnh chân dung bằng Gemini...`);
    const ai = getGenAIClient();

    const prompt = `
      Analyze this portrait photo and describe the person in deep detail. 
      Focus on these physical characteristics to create a character design prompt:
      - Gender, apparent age, and body type
      - Hair (color, length, style)
      - Face shape, skin tone
      - Eyes (shape, color if visible), nose, lips, facial hair (if any)
      - Notable features (glasses, scars, earrings, tattoos, specific expressions)
      - What kind of clothes they are wearing (color, style)
      
      Respond ONLY with a dense, comma-separated list of visual keywords and short phrases suitable for an AI image generator. 
      Do not use conversational sentences. Start directly with the descriptions.
      Example: "young asian man, 25 years old, athletic build, short messy black hair, fair skin tone, sharp jawline, wearing rectangular black glasses, dark brown eyes, confident expression, wearing a casual red hoodie"
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  data: imageBuffer.toString('base64'),
                  mimeType: 'image/jpeg'
                }
              }
            ]
          }
        ],
        config: { temperature: 0.2 }
      });

      const description = response.text.trim();
      console.log(`  ✅ Phân tích xong đặc điểm: "${description}"`);
      return description;
    } catch (err) {
      console.error(`  ❌ Lỗi Gemini:`, err.message);
      if (err.message.includes('not found')) {
        console.log(`  🔄 Thử lại với gemini-1.5-flash...`);
        const response = await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: [
            {
              role: 'user',
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    data: imageBuffer.toString('base64'),
                    mimeType: 'image/jpeg'
                  }
                }
              ]
            }
          ],
        });
        const description = response.text.trim();
        console.log(`  ✅ Phân tích xong đặc điểm: "${description}"`);
        return description;
      }
      throw err;
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // BƯỚC 2: Sinh Avatar pixel art (ĐỒNG BỘ — trả về ngay)
  // ═══════════════════════════════════════════════════════════════
  async generateAvatar(characterDescription, seed) {
    const avatarPrompt = `2D cartoon doodle style portrait, thick black outline, flat vibrant colors, front facing headshot, expressive face, simple and cute illustration, like a funny mobile game character, plain solid white background, isolated character. Character matching this description: [${characterDescription}]`;

    console.log(`  🎭 Đang sinh avatar doodle art (Seed: ${seed})...`);
    const buffer = await generateAndRemoveBg(avatarPrompt, 256, 256, seed);
    console.log(`  ✅ Avatar pixel art thành công (${buffer.length} bytes)`);
    return buffer;
  },

  // ═══════════════════════════════════════════════════════════════
  // BƯỚC 3: Sinh 1 Sprite pixel art (gọi bởi generateSpritesAsync)
  // ═══════════════════════════════════════════════════════════════
  async generateSprite(characterDescription, spriteType, seed) {
    const baseStyle = `2D cartoon doodle style full body character sprite, thick black outline, flat vibrant colors, clear full body from head to toe, feet on ground, simple and cute illustration, funny mobile game aesthetic, plain solid white background, isolated character.`;

    const posePrompts = {
      idle: `standing in a neutral relaxed idle pose, arms naturally at sides, ready for battle.`,
      attack: `dynamic aggressive fighting pose, striking forward towards the side (facing left or right), martial arts combat strike, intense action.`,
      hurt: `defensive hurt pose, taking damage, forcefully reeling backwards in pain, knocked back, dramatic expression.`,
    };

    const pose = posePrompts[spriteType];
    if (!pose) throw new Error(`Loại sprite không hợp lệ: ${spriteType}`);

    const fullPrompt = `${baseStyle} Character matching this description: [${characterDescription}]. The character is ${pose}`;

    console.log(`  🎨 Đang sinh sprite ${spriteType} (Seed: ${seed})...`);
    const buffer = await generateAndRemoveBg(fullPrompt, 512, 768, seed);
    console.log(`  ✅ Sprite ${spriteType} thành công (${buffer.length} bytes)`);
    return buffer;
  },

  // ═══════════════════════════════════════════════════════════════
  // LUỒNG CHÍNH: Upload ảnh chân dung
  //   → Phân tích đặc điểm (Gemini)
  //   → Sinh Avatar (ĐỒNG BỘ - trả kết quả ngay)
  //   → Sinh 3 Sprites (BẤT ĐỒNG BỘ - chạy ngầm)
  // ═══════════════════════════════════════════════════════════════
  async processPortrait(userId, imageBuffer) {
    console.log(`\n🖼️  Bắt đầu xử lý ảnh chân dung cho User ID ${userId}...`);

    // Lưu ảnh gốc
    const originalFileName = `user_${userId}_original_${Date.now()}.jpg`;
    const originalPath = path.join(SPRITES_DIR, originalFileName);
    fs.writeFileSync(originalPath, imageBuffer);
    const originalRelative = `uploads/sprites/${originalFileName}`;
    await pool.execute('UPDATE users SET avatar_original_url = ? WHERE id = ?', [originalRelative, userId]);

    // Cập nhật trạng thái
    await pool.execute(
      'UPDATE users SET sprite_status = ? WHERE id = ?',
      ['processing', userId]
    );

    // 1. Phân tích chân dung → text
    const characterDescription = await this.analyzePortrait(imageBuffer);

    // Lưu description để dùng lại cho sprite generation
    await pool.execute(
      'UPDATE users SET character_description = ? WHERE id = ?',
      [characterDescription, userId]
    );

    // 2. Sinh Avatar ĐỒNG BỘ (trả về ngay cho frontend hiển thị)
    const seed = userId * 1000 + Math.floor(Date.now() / 100000);
    const avatarBuffer = await this.generateAvatar(characterDescription, seed);

    const avatarFileName = `user_${userId}_avatar_${Date.now()}.png`;
    const avatarPath = path.join(SPRITES_DIR, avatarFileName);
    fs.writeFileSync(avatarPath, avatarBuffer);
    const avatarRelative = `uploads/sprites/${avatarFileName}`;

    await pool.execute(
      'UPDATE users SET avatar_pixel_url = ? WHERE id = ?',
      [avatarRelative, userId]
    );

    console.log(`  🎉 Avatar pixel art đã sẵn sàng cho User ${userId}`);

    // 3. Sinh 3 Sprites BẤT ĐỒNG BỘ (chạy ngầm, không block response)
    this._generateSpritesInBackground(userId, characterDescription, seed)
      .then(() => console.log(`  🎉 Sprites background job hoàn tất cho User ${userId}`))
      .catch(err => console.error(`  ❌ Sprites background job lỗi cho User ${userId}:`, err.message));

    // Trả về kết quả avatar ngay lập tức
    return {
      userId,
      avatarPath,
      avatarSize: avatarBuffer.length,
      characterDescription,
      spriteStatus: 'processing', // Sprites đang chạy ngầm
    };
  },

  // ═══════════════════════════════════════════════════════════════
  // BACKGROUND JOB: Sinh 3 Sprites bất đồng bộ
  // ═══════════════════════════════════════════════════════════════
  async _generateSpritesInBackground(userId, characterDescription, seed) {
    console.log(`\n  ⏳ [BG] Bắt đầu sinh 3 sprites cho User ${userId}...`);

    const spriteTypes = ['idle', 'attack', 'hurt'];
    const results = {};

    for (const type of spriteTypes) {
      try {
        const spriteBuffer = await this.generateSprite(characterDescription, type, seed);

        const fileName = `user_${userId}_${type}_${Date.now()}.png`;
        const filePath = path.join(SPRITES_DIR, fileName);
        fs.writeFileSync(filePath, spriteBuffer);

        results[type] = { localPath: filePath, size: spriteBuffer.length };
      } catch (err) {
        console.error(`  ❌ [BG] Lỗi sprite ${type}:`, err.message);
        results[type] = { error: err.message };
      }
    }

    const successCount = Object.values(results).filter(r => !r.error).length;

    // Cập nhật DB với đường dẫn tương đối
    const idlePath = results.idle?.localPath ? `uploads/sprites/${path.basename(results.idle.localPath)}` : null;
    const attackPath = results.attack?.localPath ? `uploads/sprites/${path.basename(results.attack.localPath)}` : null;
    const hurtPath = results.hurt?.localPath ? `uploads/sprites/${path.basename(results.hurt.localPath)}` : null;

    await pool.execute(
      `UPDATE users SET
        sprite_idle_url = ?, sprite_attack_url = ?, sprite_hurt_url = ?,
        sprite_status = ?
       WHERE id = ?`,
      [idlePath, attackPath, hurtPath, successCount > 0 ? 'ready' : 'failed', userId]
    );

    console.log(`  🎉 [BG] Hoàn tất sprites cho User ${userId}: ${successCount}/3 thành công`);
  },

  // ═══════════════════════════════════════════════════════════════
  // STATUS: Lấy trạng thái ảnh của user
  // ═══════════════════════════════════════════════════════════════
  async getSpriteStatus(userId) {
    const [rows] = await pool.execute(
      `SELECT sprite_status, avatar_pixel_url,
              sprite_idle_url, sprite_attack_url, sprite_hurt_url
       FROM users WHERE id = ?`,
      [userId]
    );
    return rows[0] || null;
  },
};

module.exports = ImageService;
