#!/usr/bin/env node
/* Import the user's preserved n8n CSV tables into n8n's native SQLite schema. */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import sqlite3 from '../../.tools/n8n-runtime/node_modules/sqlite3/lib/sqlite3.js';
import { parse } from '../../.tools/n8n-runtime/node_modules/csv-parse/lib/sync.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const source = path.join(root, 'n8n/data & tables');
const database = path.join(root, 'n8n/migrated-runtime/.n8n/database.sqlite');
const projectId = 'WYQBwMy2YK6JYQh7';
const db = new sqlite3.Database(database);
const run = (sql, values = []) => new Promise((ok, fail) => db.run(sql, values, function (err) { err ? fail(err) : ok(this); }));
const get = (sql, values = []) => new Promise((ok, fail) => db.get(sql, values, (err, row) => err ? fail(err) : ok(row)));
const quote = (s) => `"${s.replaceAll('"', '""')}"`;

async function main() {
  await run('BEGIN IMMEDIATE');
  try {
    for (const filename of fs.readdirSync(source).filter((f) => f.endsWith('.csv')).sort()) {
      const name = path.basename(filename, '.csv');
      const input = fs.readFileSync(path.join(source, filename), 'utf8').replace(/^\uFEFF/, '');
      const rows = parse(input, { columns: true, skip_empty_lines: true, relax_column_count: false });
      const headers = Object.keys(rows[0] || parse(input, { to_line: 1 })[0] || {});
      const userColumns = headers.filter((h) => !['id', 'createdAt', 'updatedAt'].includes(h));
      const existing = await get('SELECT id FROM data_table WHERE projectId = ? AND name = ?', [projectId, name]);
      if (existing) throw new Error(`Data Table already exists: ${name}`);
      const id = crypto.randomUUID();
      await run('INSERT INTO data_table (id, name, projectId) VALUES (?, ?, ?)', [id, name, projectId]);
      for (let i = 0; i < userColumns.length; i++) {
        await run('INSERT INTO data_table_column (id, name, type, "index", dataTableId) VALUES (?, ?, ?, ?, ?)', [crypto.randomUUID(), userColumns[i], 'string', i, id]);
      }
      const table = `data_table_user_${id}`;
      const cols = ['"id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL', ...userColumns.map((h) => `${quote(h)} TEXT`), '"createdAt" datetime NOT NULL DEFAULT (STRFTIME(\'%Y-%m-%d %H:%M:%f\', \'NOW\'))', '"updatedAt" datetime NOT NULL DEFAULT (STRFTIME(\'%Y-%m-%d %H:%M:%f\', \'NOW\'))'];
      await run(`CREATE TABLE ${quote(table)} (${cols.join(', ')})`);
      const insertColumns = ['id', ...userColumns, 'createdAt', 'updatedAt'];
      const sql = `INSERT INTO ${quote(table)} (${insertColumns.map(quote).join(', ')}) VALUES (${insertColumns.map(() => '?').join(', ')})`;
      for (const row of rows) await run(sql, insertColumns.map((h) => row[h] === '' ? null : row[h]));
      console.log(`${name}: ${rows.length} rows`);
    }
    await run('COMMIT');
  } catch (error) { await run('ROLLBACK'); throw error; }
}
main().then(() => db.close()).catch((e) => { console.error(e.message); db.close(); process.exitCode = 1; });
