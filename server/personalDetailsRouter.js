import express from 'express';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import { dbAll, dbGet, dbRun } from './db.js';
import {
  decryptPersonalDetail,
  encryptPersonalDetail,
  maskPersonalDetail,
  validatePersonalDetail
} from './personalDetails.js';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 5 * 60 * 1000;
const WRONG_PASSWORD = {
  code: 'INCORRECT_PASSWORD',
  error: 'Incorrect password. Please try again.',
  errorTa: 'கடவுச்சொல் தவறு. மீண்டும் முயற்சிக்கவும்.'
};

async function audit(userId, detailId, action, status) {
  await dbRun(
    'INSERT INTO personal_detail_audit (user_id, detail_id, action, status) VALUES (?, ?, ?, ?)',
    [userId, detailId || null, action, status]
  );
}

async function verifyPassword(userId, password) {
  const attempt = await dbGet(
    'SELECT attempts, locked_until FROM personal_detail_attempts WHERE user_id = ?',
    [userId]
  );
  if (attempt?.locked_until && new Date(attempt.locked_until).getTime() > Date.now()) {
    return { locked: true };
  }

  const user = await dbGet('SELECT password_hash FROM users WHERE id = ?', [userId]);
  const valid = typeof password === 'string'
    && typeof user?.password_hash === 'string'
    && await bcrypt.compare(password, user.password_hash);

  if (!valid) {
    const attempts = attempt?.locked_until ? 1 : (attempt?.attempts || 0) + 1;
    const lockedUntil = attempts >= MAX_FAILED_ATTEMPTS
      ? new Date(Date.now() + LOCK_DURATION_MS).toISOString()
      : null;
    await dbRun(
      `INSERT INTO personal_detail_attempts (user_id, attempts, locked_until) VALUES (?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET attempts = excluded.attempts, locked_until = excluded.locked_until`,
      [userId, attempts, lockedUntil]
    );
    return { valid: false, locked: Boolean(lockedUntil) };
  }

  await dbRun('DELETE FROM personal_detail_attempts WHERE user_id = ?', [userId]);
  return { valid: true };
}

function getDetailInput(body) {
  const type = typeof body?.type === 'string' ? body.type : '';
  const label = typeof body?.label === 'string' ? body.label.trim() : '';
  const result = validatePersonalDetail(type, body?.value, label);
  return { ...result, type, label };
}

async function storeDetail(userId, detail, value) {
  const encrypted = await encryptPersonalDetail(JSON.stringify({
    value,
    label: detail.label || null
  }));
  return dbRun(
    `INSERT INTO personal_details (user_id, type, label, masked_value, ciphertext, iv)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, detail.type, null, maskPersonalDetail(detail.type, value), encrypted.ciphertext, encrypted.iv]
  );
}

export function createPersonalDetailsRouter(authenticateToken) {
  const router = express.Router();
  const sensitiveActionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Too many secure details requests. Please try again later.' }
  });

  router.use(authenticateToken, sensitiveActionLimiter, async (req, res, next) => {
    try {
      const user = await dbGet('SELECT id FROM users WHERE id = ?', [req.user.id]);
      if (!user) return res.status(401).json({ error: 'Please sign in again.' });
      res.set('Cache-Control', 'no-store');
      next();
    } catch {
      res.status(500).json({ error: 'Unable to verify your session.' });
    }
  });

  router.get('/', async (req, res) => {
    try {
      const records = await dbAll(
        `SELECT id, type, label, masked_value AS maskedValue, created_at AS createdAt, updated_at AS updatedAt
         FROM personal_details WHERE user_id = ? ORDER BY created_at DESC, id DESC`,
        [req.user.id]
      );
      res.json({ details: records });
    } catch {
      res.status(500).json({ error: 'Unable to load secure personal details.' });
    }
  });

  router.post('/', async (req, res) => {
    const detail = getDetailInput(req.body);
    if (!detail.valid) return res.status(400).json({ error: detail.error });

    try {
      const authorization = await verifyPassword(req.user.id, req.body.password);
      if (!authorization.valid) {
        await audit(req.user.id, null, 'CREATE', 'FAILED');
        return res.status(authorization.locked ? 429 : 401).json(
          authorization.locked
            ? { code: 'TEMPORARILY_LOCKED', error: 'Too many failed password attempts. Please try again later.' }
            : WRONG_PASSWORD
        );
      }

      const result = await storeDetail(req.user.id, detail, detail.normalizedValue);
      await audit(req.user.id, result.lastID, 'CREATE', 'SUCCESS');
      res.status(201).json({ message: 'Secure personal detail saved.' });
    } catch {
      res.status(500).json({ error: 'Unable to save this secure personal detail.' });
    }
  });

  router.post('/:id/reveal', async (req, res) => {
    try {
      const authorization = await verifyPassword(req.user.id, req.body?.password);
      if (!authorization.valid) {
        await audit(req.user.id, req.params.id, 'REVEAL', 'FAILED');
        return res.status(authorization.locked ? 429 : 401).json(
          authorization.locked
            ? { code: 'TEMPORARILY_LOCKED', error: 'Too many failed password attempts. Please try again later.' }
            : WRONG_PASSWORD
        );
      }

      const record = await dbGet(
        'SELECT id, type, label, ciphertext, iv FROM personal_details WHERE id = ? AND user_id = ?',
        [req.params.id, req.user.id]
      );
      if (!record) return res.status(404).json({ error: 'Secure personal detail not found.' });

      const decrypted = JSON.parse(await decryptPersonalDetail(record.ciphertext, record.iv));
      await audit(req.user.id, record.id, 'REVEAL', 'SUCCESS');
      res.set('Cache-Control', 'no-store');
      res.json({ id: record.id, type: record.type, label: decrypted.label, value: decrypted.value });
    } catch {
      res.status(500).json({ error: 'Unable to reveal this secure personal detail.' });
    }
  });

  router.patch('/:id', async (req, res) => {
    const detail = getDetailInput(req.body);
    if (!detail.valid) return res.status(400).json({ error: detail.error });

    try {
      const authorization = await verifyPassword(req.user.id, req.body.password);
      if (!authorization.valid) {
        await audit(req.user.id, req.params.id, 'UPDATE', 'FAILED');
        return res.status(authorization.locked ? 429 : 401).json(
          authorization.locked
            ? { code: 'TEMPORARILY_LOCKED', error: 'Too many failed password attempts. Please try again later.' }
            : WRONG_PASSWORD
        );
      }

      const existing = await dbGet(
        'SELECT id FROM personal_details WHERE id = ? AND user_id = ?',
        [req.params.id, req.user.id]
      );
      if (!existing) return res.status(404).json({ error: 'Secure personal detail not found.' });

      const current = await dbGet(
        'SELECT ciphertext, iv FROM personal_details WHERE id = ? AND user_id = ?',
        [req.params.id, req.user.id]
      );
      const currentSecret = JSON.parse(await decryptPersonalDetail(current.ciphertext, current.iv));
      const encrypted = await encryptPersonalDetail(JSON.stringify({
        value: detail.normalizedValue,
        label: detail.label || currentSecret.label || null
      }));
      await dbRun(
        `UPDATE personal_details
         SET type = ?, label = ?, masked_value = ?, ciphertext = ?, iv = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ?`,
        [
          detail.type,
          null,
          maskPersonalDetail(detail.type, detail.normalizedValue),
          encrypted.ciphertext,
          encrypted.iv,
          req.params.id,
          req.user.id
        ]
      );
      await audit(req.user.id, req.params.id, 'UPDATE', 'SUCCESS');
      res.json({ message: 'Secure personal detail updated.' });
    } catch {
      res.status(500).json({ error: 'Unable to update this secure personal detail.' });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      const authorization = await verifyPassword(req.user.id, req.body?.password);
      if (!authorization.valid) {
        await audit(req.user.id, req.params.id, 'DELETE', 'FAILED');
        return res.status(authorization.locked ? 429 : 401).json(
          authorization.locked
            ? { code: 'TEMPORARILY_LOCKED', error: 'Too many failed password attempts. Please try again later.' }
            : WRONG_PASSWORD
        );
      }

      const result = await dbRun(
        'DELETE FROM personal_details WHERE id = ? AND user_id = ?',
        [req.params.id, req.user.id]
      );
      if (!result.changes) return res.status(404).json({ error: 'Secure personal detail not found.' });

      await audit(req.user.id, req.params.id, 'DELETE', 'SUCCESS');
      res.json({ message: 'Secure personal detail deleted.' });
    } catch {
      res.status(500).json({ error: 'Unable to delete this secure personal detail.' });
    }
  });

  return router;
}
