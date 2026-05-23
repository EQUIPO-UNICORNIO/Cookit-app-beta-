const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
  const { text, targetLang } = req.body;
  if (!text) return res.status(400).json({ error: 'Falta el texto' });

  try {
    const geminiKey = process.env.GEMINI_KEY;
    if (!geminiKey) return res.status(400).json({ error: 'No hay clave de traducción configurada' });

    const langName = targetLang === 'en' ? 'English' : 'Spanish';
    const payload = {
      contents: [{
        parts: [{ text: `Translate the following text to ${langName}. Return ONLY the translated text, nothing else:\n\n${text}` }]
      }]
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    const translated = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (translated) return res.json({ translated });
    return res.json({ translated: text });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;
