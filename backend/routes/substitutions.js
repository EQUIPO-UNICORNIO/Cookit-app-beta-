const express = require('express');
const { getAll, create, deleteById } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const subs = await getAll('ingredient_substitutions', { user_id: req.userId }, { orderBy: 'created_at' });
    res.json(subs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { ingredient, substitute, reason } = req.body;
    if (!ingredient || !substitute) return res.status(400).json({ error: 'Ingrediente y sustituto requeridos' });
    const sub = await create('ingredient_substitutions', {
      user_id: req.userId, ingredient, substitute, reason: reason || ''
    });
    res.status(201).json(sub);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await deleteById('ingredient_substitutions', req.params.id, req.userId);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
