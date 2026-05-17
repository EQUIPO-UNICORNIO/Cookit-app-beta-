const express = require('express');
const supabase = require('../lib/supabase');
const { create } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const { data: logs, error } = await supabase
      .from('impact_logs')
      .select('id, type, value, description, created_at')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);

    const { data: totals } = await supabase
      .from('impact_logs')
      .select('type, value')
      .eq('user_id', req.userId);

    const summary = {};
    (totals || []).forEach(row => {
      summary[row.type] = (summary[row.type] || 0) + (row.value || 0);
    });

    res.json({ logs: logs || [], summary });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { type, value, description } = req.body;
    if (!type) return res.status(400).json({ error: 'Tipo requerido' });
    const log = await create('impact_logs', {
      user_id: req.userId, type, value: value || 0, description: description || ''
    });
    res.status(201).json(log);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
