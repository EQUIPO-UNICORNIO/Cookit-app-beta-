const express = require('express');
const supabase = require('../lib/supabase');
const { getAll, getOne, create, updateById, deleteById } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const sessions = await getAll('cooking_sessions', { user_id: req.userId }, { orderBy: 'created_at' });
    res.json(sessions.map(s => ({ ...s, steps: JSON.parse(s.steps || '[]'), completed: !!s.completed })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { recipe_name, steps } = req.body;
    if (!recipe_name) return res.status(400).json({ error: 'Nombre de receta requerido' });
    const session = await create('cooking_sessions', {
      user_id: req.userId, recipe_name, steps: JSON.stringify(steps || [])
    });
    res.status(201).json({ ...session, steps: steps || [], completed: !!session.completed });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id/step', async (req, res) => {
  try {
    const { current_step } = req.body;
    const session = await getOne('cooking_sessions', { id: req.params.id, user_id: req.userId });
    if (!session) return res.status(404).json({ error: 'No encontrado' });
    const steps = JSON.parse(session.steps || '[]');
    const completed = current_step >= steps.length - 1;
    await updateById('cooking_sessions', req.params.id, {
      current_step, completed: completed ? 1 : 0
    }, req.userId);
    res.json({ success: true, completed });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await deleteById('cooking_sessions', req.params.id, req.userId);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
