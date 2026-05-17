// Script to migrate data from SQLite (cookit.db) to Supabase PostgreSQL
// Usage: SUPABASE_URL=https://... SUPABASE_SERVICE_KEY=eyJ... node scripts/migrate-to-supabase.js

const path = require('path');
const fs = require('fs');

const modDir = path.join(__dirname, '..', 'backend', 'node_modules');
const initSqlJs = require(path.join(modDir, 'sql.js'));
const { createClient } = require(path.join(modDir, '@supabase', 'supabase-js'));

const DB_PATH = path.join(__dirname, '..', 'backend', 'cookit.db');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: Set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  console.log('=== Migrating cookit.db to Supabase ===\n');

  // Load SQLite database
  const SQL = await initSqlJs();
  if (!fs.existsSync(DB_PATH)) {
    console.error('ERROR: cookit.db not found at', DB_PATH);
    process.exit(1);
  }
  const db = new SQL.Database(fs.readFileSync(DB_PATH));

  function queryAll(sql, params = []) {
    const stmt = db.prepare(sql);
    if (params.length > 0) stmt.bind(params);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return rows;
  }

  // --- Migrate users ---
  const users = queryAll('SELECT * FROM users ORDER BY id');
  console.log(`Found ${users.length} users`);
  for (const u of users) {
    const { data: existing } = await supabase.from('users').select('id').eq('email', u.email).maybeSingle();
    if (existing) {
      console.log(`  User ${u.email} already exists (id=${existing.id}), skipping`);
    } else {
      const { data, error } = await supabase.from('users').insert({
        id: u.id, name: u.name, email: u.email,
        password: u.password, avatar: u.avatar || '',
        created_at: u.created_at
      }).select();
      if (error) {
        console.error(`  Error inserting user ${u.email}:`, error.message);
      } else {
        console.log(`  Inserted user ${u.email} (id=${data[0].id})`);
      }
    }
  }

  // --- Migrate pantry_items ---
  const pantryItems = queryAll('SELECT * FROM pantry_items ORDER BY id');
  console.log(`\nFound ${pantryItems.length} pantry items`);
  for (const item of pantryItems) {
    const { error } = await supabase.from('pantry_items').upsert({
      id: item.id, user_id: item.user_id, name: item.name,
      category: item.category || 'Otros', quantity: item.quantity || '1',
      unit: item.unit || 'unidad', expiry_date: item.expiry_date || '',
      notes: item.notes || '', created_at: item.created_at
    }).select();
    if (error) console.error(`  Error inserting pantry item ${item.name}:`, error.message);
  }
  console.log(`  Inserted ${pantryItems.length} pantry items`);

  // --- Migrate shopping_items ---
  const shoppingItems = queryAll('SELECT * FROM shopping_items ORDER BY id');
  console.log(`\nFound ${shoppingItems.length} shopping items`);
  for (const item of shoppingItems) {
    const { error } = await supabase.from('shopping_items').upsert({
      id: item.id, user_id: item.user_id, name: item.name,
      category: item.category || 'Otros', quantity: item.quantity || '1',
      unit: item.unit || 'unidad', checked: item.checked || 0,
      created_at: item.created_at
    }).select();
    if (error) console.error(`  Error inserting shopping item ${item.name}:`, error.message);
  }
  console.log(`  Inserted ${shoppingItems.length} shopping items`);

  // --- Migrate meal_plans ---
  const mealPlans = queryAll('SELECT * FROM meal_plans ORDER BY id');
  console.log(`\nFound ${mealPlans.length} meal plans`);
  for (const meal of mealPlans) {
    const { error } = await supabase.from('meal_plans').upsert({
      id: meal.id, user_id: meal.user_id, name: meal.name,
      day: meal.day || '', meal_type: meal.meal_type || 'comida',
      recipe: meal.recipe || '', ingredients: meal.ingredients || '[]',
      instructions: meal.instructions || '', photo: meal.photo || '',
      created_at: meal.created_at
    }).select();
    if (error) console.error(`  Error inserting meal ${meal.name}:`, error.message);
  }
  console.log(`  Inserted ${mealPlans.length} meal plans`);

  // --- Migrate challenges ---
  const challenges = queryAll('SELECT * FROM challenges ORDER BY id');
  console.log(`\nFound ${challenges.length} challenges`);
  for (const c of challenges) {
    const { error } = await supabase.from('challenges').upsert({
      id: c.id, user_id: c.user_id, title: c.title,
      description: c.description || '', progress: c.progress || 0,
      goal: c.goal || 1, completed: c.completed || 0,
      created_at: c.created_at
    }).select();
    if (error) console.error(`  Error inserting challenge ${c.title}:`, error.message);
  }
  console.log(`  Inserted ${challenges.length} challenges`);

  // --- Migrate community_posts ---
  const posts = queryAll('SELECT * FROM community_posts ORDER BY id');
  console.log(`\nFound ${posts.length} community posts`);
  for (const p of posts) {
    const { error } = await supabase.from('community_posts').upsert({
      id: p.id, user_id: p.user_id, content: p.content,
      likes: p.likes || 0, meal_id: p.meal_id || 0,
      meal_name: p.meal_name || '', photo: p.photo || '',
      ingredients: p.ingredients || '[]',
      instructions: p.instructions || '',
      created_at: p.created_at
    }).select();
    if (error) console.error(`  Error inserting post ${p.id}:`, error.message);
  }
  console.log(`  Inserted ${posts.length} posts`);

  // --- Migrate impact_logs ---
  const impactLogs = queryAll('SELECT * FROM impact_logs ORDER BY id');
  console.log(`\nFound ${impactLogs.length} impact logs`);
  for (const log of impactLogs) {
    const { error } = await supabase.from('impact_logs').upsert({
      id: log.id, user_id: log.user_id, type: log.type,
      value: log.value || 0, description: log.description || '',
      created_at: log.created_at
    }).select();
    if (error) console.error(`  Error inserting impact log:`, error.message);
  }
  console.log(`  Inserted ${impactLogs.length} impact logs`);

  // --- Migrate cooking_sessions ---
  const sessions = queryAll('SELECT * FROM cooking_sessions ORDER BY id');
  console.log(`\nFound ${sessions.length} cooking sessions`);
  for (const s of sessions) {
    const { error } = await supabase.from('cooking_sessions').upsert({
      id: s.id, user_id: s.user_id, recipe_name: s.recipe_name,
      steps: s.steps || '[]', current_step: s.current_step || 0,
      completed: s.completed || 0, created_at: s.created_at
    }).select();
    if (error) console.error(`  Error inserting session ${s.recipe_name}:`, error.message);
  }
  console.log(`  Inserted ${sessions.length} cooking sessions`);

  // --- Migrate ingredient_substitutions ---
  const subs = queryAll('SELECT * FROM ingredient_substitutions ORDER BY id');
  console.log(`\nFound ${subs.length} ingredient substitutions`);
  for (const s of subs) {
    const { error } = await supabase.from('ingredient_substitutions').upsert({
      id: s.id, user_id: s.user_id, ingredient: s.ingredient,
      substitute: s.substitute, reason: s.reason || '',
      created_at: s.created_at
    }).select();
    if (error) console.error(`  Error inserting substitution ${s.ingredient}:`, error.message);
  }
  console.log(`  Inserted ${subs.length} substitutions`);

  // --- Migrate post_likes ---
  const likes = queryAll('SELECT * FROM post_likes ORDER BY id');
  console.log(`\nFound ${likes.length} post likes`);
  for (const l of likes) {
    const { error } = await supabase.from('post_likes').upsert({
      id: l.id, post_id: l.post_id, user_id: l.user_id,
      created_at: l.created_at
    }).select();
    if (error) console.error(`  Error inserting like:`, error.message);
  }
  console.log(`  Inserted ${likes.length} likes`);

  // --- Migrate post_comments ---
  const comments = queryAll('SELECT * FROM post_comments ORDER BY id');
  console.log(`\nFound ${comments.length} post comments`);
  for (const c of comments) {
    const { error } = await supabase.from('post_comments').upsert({
      id: c.id, post_id: c.post_id, user_id: c.user_id,
      content: c.content, created_at: c.created_at
    }).select();
    if (error) console.error(`  Error inserting comment:`, error.message);
  }
  console.log(`  Inserted ${comments.length} comments`);

  db.close();
  console.log('\n=== Migration complete! ===');
}

migrate().catch(e => {
  console.error('Migration failed:', e);
  process.exit(1);
});
