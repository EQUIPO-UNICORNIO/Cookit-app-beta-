const express = require('express');
const router = express.Router();

async function translateGoogle(text, targetLang) {
  const source = targetLang === 'en' ? 'es' : 'en';
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const data = await res.json();
  if (data?.[0]) return data[0].map(p => p[0]).filter(Boolean).join('');
  return text;
}

async function translateGemini(text, targetLang) {
  const geminiKey = process.env.GEMINI_KEY;
  if (!geminiKey) return null;
  const langName = targetLang === 'en' ? 'English' : 'Spanish';
  const payload = {
    contents: [{
      parts: [{ text: `Translate to ${langName}. Return ONLY the translated text:\n\n${text}` }]
    }]
  };
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
}

router.post('/', async (req, res) => {
  const { text, targetLang } = req.body;
  if (!text) return res.status(400).json({ error: 'Falta el texto' });

  try {
    let translated = await translateGemini(text, targetLang);
    if (!translated) translated = await translateGoogle(text, targetLang);
    return res.json({ translated: translated || text });
  } catch (e) {
    try {
      const translated = await translateGoogle(text, targetLang);
      return res.json({ translated: translated || text });
    } catch {
      return res.json({ translated: text });
    }
  }
});

module.exports = router;
