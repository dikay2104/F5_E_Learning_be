const Course = require('../models/Course');
const fetch = require('node-fetch');

const API_KEY = process.env.AI_API_KEY || "sk-C4wNtPDOw2GmaZMf4723A75f58Cd48139b1477CeE40f0867";
const BASE_URL = "https://api.sv2.llm.ai.vn/v1/chat/completions";
const MODEL_NAME = "openai:gpt-4.1";
const DOMAIN = 'http://localhost:3000';

function isCourseQuery(message) {
  const keywords = [
    'khoá học', 'khóa học', 'course', 'học gì', 'gợi ý', 'recommend', 'learn', 'nên học', 'tư vấn', 'suggest'
  ];
  return keywords.some(kw => message.toLowerCase().includes(kw));
}

// Hàm đơn giản tách từ khóa khóa học từ câu hỏi
function extractCourseKeyword(message) {
  // Tìm cụm từ sau "khóa học" hoặc "course"
  const match = message.match(/khoá học|khóa học|course\s+([\w\s]+)/i);
  if (match && match[1]) {
    return match[1].trim();
  }
  // Nếu không match, thử lấy toàn bộ message (có thể refine sau)
  return '';
}

exports.aiChat = async (req, res) => {
  try {
    const { message } = req.body;
    let prompt = '';
    let courses = [];
    let isCourseIntent = false;
    if (isCourseQuery(message)) {
      isCourseIntent = true;
      // Ưu tiên tìm khóa học theo từ khóa trong câu hỏi
      let keyword = extractCourseKeyword(message);
      if (keyword) {
        courses = await Course.find({
          status: 'approved',
          $or: [
            { title: { $regex: keyword, $options: 'i' } },
            { description: { $regex: keyword, $options: 'i' } }
          ]
        }).limit(2).select('title description level category price _id');
      }
      // Nếu không tìm thấy, lấy top khóa học nổi bật
      if (!courses || courses.length === 0) {
        courses = await Course.find({ status: 'approved' })
          .sort({ studentsCount: -1 })
          .limit(2)
          .select('title description level category price _id');
      }
      prompt = `Người dùng hỏi: "${message}". Dưới đây là 1-2 khoá học phù hợp nhất trên nền tảng:\n` +
        courses.map((c, i) => `${i+1}. ${c.title} (${c.level}, ${c.category}) - ${c.description}`).join('\n') +
        `\nHãy gợi ý cho người dùng một khoá học phù hợp nhất, giải thích lý do chọn.`;
    } else {
      prompt = message;
    }
    const payload = {
      model: MODEL_NAME,
      messages: [
        {
          role: "system",
          content: "Bạn là Trợ lý AI của nền tảng F5-Online-Learning, chỉ trả lời các câu hỏi liên quan đến học tập, khoá học, kỹ năng, công nghệ. Nếu câu hỏi không liên quan, hãy từ chối tinh tế."
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 300
    };
    const aiRes = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const aiText = await aiRes.text();
    let aiContent = '';
    try {
      const aiObj = JSON.parse(aiText);
      aiContent = aiObj?.choices?.[0]?.message?.content || '(No answer)';
    } catch {
      aiContent = aiText;
    }
    // Trả về cả danh sách courses nếu là intent recommend khoá học
    if (isCourseIntent) {
      return res.json({ answer: aiContent, courses });
    }
    res.json({ answer: aiContent });
  } catch (err) {
    res.status(500).json({ message: 'AI chat error', error: err.message });
  }
}; 