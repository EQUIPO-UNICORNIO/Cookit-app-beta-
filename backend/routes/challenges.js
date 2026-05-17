const express = require('express');
const { getAll, getOne, create, updateById, deleteById } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const challenges = await getAll('challenges', { user_id: req.userId }, { orderBy: 'created_at' });
    res.json(challenges.map(c => ({ ...c, completed: !!c.completed })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { title, description, goal } = req.body;
    if (!title) return res.status(400).json({ error: 'Título requerido' });
    const chal = await create('challenges', {
      user_id: req.userId, title, description: description || '', goal: goal || 1
    });
    res.status(201).json({ ...chal, completed: !!chal.completed });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id/progress', async (req, res) => {
  try {
    const { progress } = req.body;
    const chal = await getOne('challenges', { id: req.params.id, user_id: req.userId });
    if (!chal) return res.status(404).json({ error: 'No encontrado' });
    const completed = progress >= chal.goal;
    await updateById('challenges', req.params.id, { progress, completed: completed ? 1 : 0 }, req.userId);
    res.json({ success: true, completed });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await deleteById('challenges', req.params.id, req.userId);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
