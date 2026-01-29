import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { nanoid } from 'nanoid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '../data');
const dbFile = path.join(dataDir, 'holidaymax.db');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbFile);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const ensureSchema = () => {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      avatar TEXT NOT NULL,
      color TEXT NOT NULL,
      country TEXT NOT NULL,
      city TEXT NOT NULL,
      isoCountryCode TEXT,
      isoRegionCode TEXT,
      totalAllowance INTEGER NOT NULL DEFAULT 30
    );
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS vacations (
      id TEXT PRIMARY KEY,
      profileId TEXT NOT NULL,
      startDate TEXT NOT NULL,
      endDate TEXT NOT NULL,
      type TEXT NOT NULL,
      commuteHours INTEGER NOT NULL DEFAULT 0,
      note TEXT,
      FOREIGN KEY (profileId) REFERENCES profiles(id) ON DELETE CASCADE
    );
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS app_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      year INTEGER NOT NULL,
      minPtoDays INTEGER NOT NULL,
      maxPtoDays INTEGER NOT NULL,
      minEfficiency REAL NOT NULL
    );
  `).run();

  const row = db.prepare('SELECT 1 FROM app_settings WHERE id = 1').get();
  if (!row) {
    db.prepare(`
      INSERT INTO app_settings (id, year, minPtoDays, maxPtoDays, minEfficiency)
      VALUES (1, ?, ?, ?, ?)
    `).run(new Date().getFullYear(), 1, 5, 1.5);
  }
};

ensureSchema();

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

const mapProfileRow = (row) => ({
  id: row.id,
  name: row.name,
  avatar: row.avatar,
  color: row.color,
  country: row.country,
  city: row.city,
  isoCountryCode: row.isoCountryCode || undefined,
  isoRegionCode: row.isoRegionCode || undefined,
  totalAllowance: row.totalAllowance,
});

const getVacationsForProfile = db.prepare('SELECT * FROM vacations WHERE profileId = ? ORDER BY startDate ASC');

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/settings', (_req, res) => {
  const row = db.prepare('SELECT year, minPtoDays, maxPtoDays, minEfficiency FROM app_settings WHERE id = 1').get();
  res.json(row);
});

app.put('/api/settings', (req, res) => {
  const { year, minPtoDays, maxPtoDays, minEfficiency } = req.body ?? {};
  if (!year || !minPtoDays || !maxPtoDays || !minEfficiency) {
    return res.status(400).json({ message: 'Invalid settings payload' });
  }
  db.prepare(`
    UPDATE app_settings
    SET year = ?, minPtoDays = ?, maxPtoDays = ?, minEfficiency = ?
    WHERE id = 1
  `).run(year, minPtoDays, maxPtoDays, minEfficiency);
  res.json({ year, minPtoDays, maxPtoDays, minEfficiency });
});

app.get('/api/profiles', (_req, res) => {
  const profiles = db.prepare('SELECT * FROM profiles ORDER BY name ASC').all();
  const payload = profiles.map((row) => ({
    ...mapProfileRow(row),
    vacations: getVacationsForProfile.all(row.id),
    holidays: [],
    suggestions: [],
  }));
  res.json(payload);
});

app.post('/api/profiles', (req, res) => {
  const { name, avatar, color, country, city, isoCountryCode, isoRegionCode, totalAllowance = 30 } = req.body ?? {};
  if (!name || !avatar || !color || !country || !city) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  const id = nanoid();
  db.prepare(`
    INSERT INTO profiles (id, name, avatar, color, country, city, isoCountryCode, isoRegionCode, totalAllowance)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, avatar, color, country, city, isoCountryCode || null, isoRegionCode || null, totalAllowance);
  res.status(201).json({
    id,
    name,
    avatar,
    color,
    country,
    city,
    isoCountryCode,
    isoRegionCode,
    totalAllowance,
    holidays: [],
    suggestions: [],
    vacations: [],
  });
});

app.put('/api/profiles/:id', (req, res) => {
  const { id } = req.params;
  const { name, avatar, color, country, city, isoCountryCode, isoRegionCode, totalAllowance = 30 } = req.body ?? {};
  const existing = db.prepare('SELECT id FROM profiles WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ message: 'Profile not found' });
  }
  db.prepare(`
    UPDATE profiles SET
      name = ?,
      avatar = ?,
      color = ?,
      country = ?,
      city = ?,
      isoCountryCode = ?,
      isoRegionCode = ?,
      totalAllowance = ?
    WHERE id = ?
  `).run(name, avatar, color, country, city, isoCountryCode || null, isoRegionCode || null, totalAllowance, id);
  const updated = db.prepare('SELECT * FROM profiles WHERE id = ?').get(id);
  res.json({
    ...mapProfileRow(updated),
    vacations: getVacationsForProfile.all(id),
    holidays: [],
    suggestions: [],
  });
});

app.delete('/api/profiles/:id', (req, res) => {
  const { changes } = db.prepare('DELETE FROM profiles WHERE id = ?').run(req.params.id);
  if (changes === 0) {
    return res.status(404).json({ message: 'Profile not found' });
  }
  db.prepare('DELETE FROM vacations WHERE profileId = ?').run(req.params.id);
  res.status(204).send();
});

app.post('/api/vacations', (req, res) => {
  const { profileId, startDate, endDate, type = 'PTO', commuteHours = 0, note } = req.body ?? {};
  if (!profileId || !startDate || !endDate) {
    return res.status(400).json({ message: 'Missing vacation fields' });
  }
  const profile = db.prepare('SELECT id FROM profiles WHERE id = ?').get(profileId);
  if (!profile) {
    return res.status(404).json({ message: 'Profile not found' });
  }
  const id = nanoid();
  db.prepare(`
    INSERT INTO vacations (id, profileId, startDate, endDate, type, commuteHours, note)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, profileId, startDate, endDate, type, commuteHours, note || null);
  res.status(201).json({ id, profileId, startDate, endDate, type, commuteHours, note });
});

app.put('/api/vacations/:id', (req, res) => {
  const { id } = req.params;
  const { startDate, endDate, type = 'PTO', commuteHours = 0, note } = req.body ?? {};
  const existing = db.prepare('SELECT id FROM vacations WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ message: 'Vacation not found' });
  }
  db.prepare(`
    UPDATE vacations SET
      startDate = ?,
      endDate = ?,
      type = ?,
      commuteHours = ?,
      note = ?
    WHERE id = ?
  `).run(startDate, endDate, type, commuteHours, note || null, id);
  const updated = db.prepare('SELECT * FROM vacations WHERE id = ?').get(id);
  res.json(updated);
});

app.delete('/api/vacations/:id', (req, res) => {
  const { changes } = db.prepare('DELETE FROM vacations WHERE id = ?').run(req.params.id);
  if (changes === 0) {
    return res.status(404).json({ message: 'Vacation not found' });
  }
  res.status(204).send();
});

const distDir = path.resolve(__dirname, '../dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

const PORT = process.env.PORT || 4173;
app.listen(PORT, () => {
  console.log(`Holiday Maximizer server listening on port ${PORT}`);
});
