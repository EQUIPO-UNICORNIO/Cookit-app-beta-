const express = require('express');
const { getAll, create, updateById, deleteById } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const items = await getAll('pantry_items', { user_id: req.userId }, { orderBy: 'created_at' });
    res.json(items);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, category, quantity, unit, expiry_date, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Nombre requerido' });
    const item = await create('pantry_items', {
      user_id: req.userId, name, category: category || 'Otros',
      quantity: quantity || '1', unit: unit || 'unidad',
      expiry_date: expiry_date || '', notes: notes || ''
    });
    res.status(201).json(item);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, category, quantity, unit, expiry_date, notes } = req.body;
    await updateById('pantry_items', req.params.id, { name, category, quantity, unit, expiry_date, notes }, req.userId);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await deleteById('pantry_items', req.params.id, req.userId);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
