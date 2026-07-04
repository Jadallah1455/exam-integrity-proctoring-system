import mysql, { Pool, PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';

let pool: Pool | null = null;
let mysqlAvailable = false;

export async function initDb(): Promise<boolean> {
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || '',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || '',
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
      connectTimeout: 10000,
    });
    const conn = await pool.getConnection();
    conn.release();
    mysqlAvailable = true;
    await createTables();
    console.log('[DB] MySQL connected successfully.');
    return true;
  } catch (err: any) {
    console.warn('[DB] MySQL connection failed, falling back to file-based persistence:', err.message);
    mysqlAvailable = false;
    pool = null;
    return false;
  }
}

async function createTables() {
  if (!pool) return;
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS config (
      config_key VARCHAR(255) PRIMARY KEY,
      config_value LONGTEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS submissions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      data LONGTEXT NOT NULL,
      student_id VARCHAR(255) NOT NULL,
      exam_id VARCHAR(255) NOT NULL,
      session_id VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_student_exam (student_id, exam_id),
      INDEX idx_session (session_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS events (
      id INT AUTO_INCREMENT PRIMARY KEY,
      data LONGTEXT NOT NULL,
      session_id VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_session (session_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS verdicts (
      student_key VARCHAR(255) PRIMARY KEY,
      verdict VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log('[DB] Tables ready.');
}

function getPool(): Pool {
  if (!pool) throw new Error('MySQL pool not initialized');
  return pool;
}

export async function loadConfig(key: string): Promise<any | null> {
  if (!mysqlAvailable || !pool) return null;
  try {
    const [rows] = await pool.execute<RowDataPacket[]>('SELECT config_value FROM config WHERE config_key = ?', [key]);
    if (rows.length > 0) {
      return JSON.parse(rows[0].config_value);
    }
    return null;
  } catch { return null; }
}

export async function saveConfig(key: string, value: any): Promise<void> {
  if (!mysqlAvailable || !pool) return;
  try {
    const json = JSON.stringify(value);
    await pool.execute(
      'INSERT INTO config (config_key, config_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)',
      [key, json]
    );
  } catch (err: any) {
    console.error('[DB] Failed to save config:', err.message);
  }
}

export async function loadAllSubmissions(): Promise<any[]> {
  if (!mysqlAvailable || !pool) return [];
  try {
    const [rows] = await pool.execute<RowDataPacket[]>('SELECT data FROM submissions ORDER BY id ASC');
    return rows.map(r => JSON.parse(r.data));
  } catch { return []; }
}

export async function saveSubmissions(submissions: any[]): Promise<void> {
  if (!mysqlAvailable || !pool) return;
  try {
    await pool.execute('DELETE FROM submissions');
    if (submissions.length === 0) return;
    const placeholders = submissions.map(() => '(?, ?, ?, ?)').join(',');
    const values: any[] = [];
    for (const sub of submissions) {
      values.push(JSON.stringify(sub), sub.studentId || '', sub.examId || '', sub.sessionId || sub.session_id || null);
    }
    await pool.execute(`INSERT INTO submissions (data, student_id, exam_id, session_id) VALUES ${placeholders}`, values);
  } catch (err: any) {
    console.error('[DB] Failed to save submissions:', err.message);
  }
}

export async function saveSubmission(sub: any): Promise<void> {
  if (!mysqlAvailable || !pool) return;
  try {
    await pool.execute(
      'INSERT INTO submissions (data, student_id, exam_id, session_id) VALUES (?, ?, ?, ?)',
      [JSON.stringify(sub), sub.studentId || '', sub.examId || '', sub.sessionId || sub.session_id || null]
    );
  } catch (err: any) {
    console.error('[DB] Failed to save submission:', err.message);
  }
}

export async function loadAllEvents(): Promise<any[]> {
  if (!mysqlAvailable || !pool) return [];
  try {
    const [rows] = await pool.execute<RowDataPacket[]>('SELECT data FROM events ORDER BY id ASC');
    return rows.map(r => JSON.parse(r.data));
  } catch { return []; }
}

export async function saveEvents(events: any[]): Promise<void> {
  if (!mysqlAvailable || !pool) return;
  try {
    await pool.execute('DELETE FROM events');
    if (events.length === 0) return;
    const placeholders = events.map(() => '(?, ?)').join(',');
    const values: any[] = [];
    for (const ev of events) {
      const sessionId = ev.event?.session_id || ev.event?.moodle?.attempt_id || null;
      values.push(JSON.stringify(ev), sessionId);
    }
    await pool.execute(`INSERT INTO events (data, session_id) VALUES ${placeholders}`, values);
  } catch (err: any) {
    console.error('[DB] Failed to save events:', err.message);
  }
}

export async function saveEvent(ev: any): Promise<void> {
  if (!mysqlAvailable || !pool) return;
  try {
    const sessionId = ev.event?.session_id || ev.event?.moodle?.attempt_id || null;
    await pool.execute(
      'INSERT INTO events (data, session_id) VALUES (?, ?)',
      [JSON.stringify(ev), sessionId]
    );
  } catch (err: any) {
    console.error('[DB] Failed to save event:', err.message);
  }
}

export async function loadAllVerdicts(): Promise<Record<string, string>> {
  if (!mysqlAvailable || !pool) return {};
  try {
    const [rows] = await pool.execute<RowDataPacket[]>('SELECT student_key, verdict FROM verdicts');
    const result: Record<string, string> = {};
    for (const r of rows) {
      result[r.student_key] = r.verdict;
    }
    return result;
  } catch { return {}; }
}

export async function saveVerdict(studentKey: string, verdict: string): Promise<void> {
  if (!mysqlAvailable || !pool) return;
  try {
    await pool.execute(
      'INSERT INTO verdicts (student_key, verdict) VALUES (?, ?) ON DUPLICATE KEY UPDATE verdict = VALUES(verdict)',
      [studentKey, verdict]
    );
  } catch (err: any) {
    console.error('[DB] Failed to save verdict:', err.message);
  }
}

export async function deleteVerdict(studentKey: string): Promise<void> {
  if (!mysqlAvailable || !pool) return;
  try {
    await pool.execute('DELETE FROM verdicts WHERE student_key = ?', [studentKey]);
  } catch (err: any) {
    console.error('[DB] Failed to delete verdict:', err.message);
  }
}

export async function saveAllVerdicts(verdicts: Record<string, string>): Promise<void> {
  if (!mysqlAvailable || !pool) return;
  try {
    await pool.execute('DELETE FROM verdicts');
    if (Object.keys(verdicts).length === 0) return;
    const placeholders = Object.keys(verdicts).map(() => '(?, ?)').join(',');
    const values: any[] = [];
    for (const [key, val] of Object.entries(verdicts)) {
      values.push(key, val);
    }
    await pool.execute(`INSERT INTO verdicts (student_key, verdict) VALUES ${placeholders}`, values);
  } catch (err: any) {
    console.error('[DB] Failed to save verdicts:', err.message);
  }
}

export function isDbAvailable(): boolean {
  return mysqlAvailable;
}
