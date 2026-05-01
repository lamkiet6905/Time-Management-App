import * as SQLite from 'expo-sqlite';
import { v4 as uuidv4 } from 'uuid';

let db: SQLite.SQLiteDatabase | null = null;

async function getDb() {
  if (!db) {
    db = await SQLite.openDatabaseAsync('liferpg.db');
    await initDb(db);
  }
  return db;
}

async function initDb(database: SQLite.SQLiteDatabase) {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS offline_tasks (
      client_id TEXT PRIMARY KEY,
      user_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      due_date TEXT,
      priority TEXT DEFAULT 'medium',
      difficulty TEXT DEFAULT 'normal',
      exp_reward INTEGER DEFAULT 50,
      hp_penalty INTEGER DEFAULT 10,
      status TEXT DEFAULT 'pending',
      source TEXT DEFAULT 'manual',
      ai_raw_input TEXT,
      tags TEXT DEFAULT '[]',
      duration_minutes INTEGER,
      completed_at TEXT,
      is_synced INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export async function saveOfflineTask(task: {
  title: string;
  description?: string;
  due_date?: string;
  priority?: string;
  difficulty?: string;
  exp_reward?: number;
  hp_penalty?: number;
  source?: string;
  ai_raw_input?: string;
  tags?: string[];
  duration_minutes?: number;
}) {
  const database = await getDb();
  const clientId = uuidv4();

  await database.runAsync(
    `INSERT INTO offline_tasks (client_id, title, description, due_date, priority, difficulty, exp_reward, hp_penalty, source, ai_raw_input, tags, duration_minutes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      clientId,
      task.title,
      task.description || null,
      task.due_date || null,
      task.priority || 'medium',
      task.difficulty || 'normal',
      task.exp_reward || 50,
      task.hp_penalty || 10,
      task.source || 'manual',
      task.ai_raw_input || null,
      JSON.stringify(task.tags || []),
      task.duration_minutes || null,
    ]
  );

  return clientId;
}

export async function getUnsyncedTasks() {
  const database = await getDb();
  const rows = await database.getAllAsync<any>('SELECT * FROM offline_tasks WHERE is_synced = 0');
  return rows.map(r => ({ ...r, tags: JSON.parse(r.tags || '[]') }));
}

export async function markTaskSynced(clientId: string) {
  const database = await getDb();
  await database.runAsync('UPDATE offline_tasks SET is_synced = 1 WHERE client_id = ?', [clientId]);
}

export async function getAllOfflineTasks() {
  const database = await getDb();
  const rows = await database.getAllAsync<any>('SELECT * FROM offline_tasks ORDER BY created_at DESC');
  return rows.map(r => ({ ...r, tags: JSON.parse(r.tags || '[]') }));
}

export async function deleteOfflineTask(clientId: string) {
  const database = await getDb();
  await database.runAsync('DELETE FROM offline_tasks WHERE client_id = ?', [clientId]);
}

export async function countUnsyncedTasks(): Promise<number> {
  const database = await getDb();
  const result = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM offline_tasks WHERE is_synced = 0'
  );
  return result?.count || 0;
}
