const supabase = require('../lib/supabase');

async function getAll(table, where = {}, opts = {}) {
  let query = supabase.from(table).select(opts.select || '*');
  for (const [key, value] of Object.entries(where)) {
    query = query.eq(key, value);
  }
  if (opts.orderBy) {
    const dir = opts.direction || 'desc';
    query = query.order(opts.orderBy, { ascending: dir === 'asc' });
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

async function getOne(table, where = {}) {
  const data = await getAll(table, where);
  return data[0] || null;
}

async function create(table, data) {
  const { data: result, error } = await supabase.from(table).insert(data).select();
  if (error) throw new Error(error.message);
  return result ? result[0] : null;
}

async function updateById(table, id, data, userId = null) {
  let query = supabase.from(table).update(data).eq('id', id);
  if (userId) query = query.eq('user_id', userId);
  const { error } = await query;
  if (error) throw new Error(error.message);
}

async function deleteById(table, id, userId = null) {
  let query = supabase.from(table).delete().eq('id', id);
  if (userId) query = query.eq('user_id', userId);
  const { error } = await query;
  if (error) throw new Error(error.message);
}

function saveDb() {}

module.exports = { getAll, getOne, create, updateById, deleteById, saveDb };
