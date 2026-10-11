/**
 * Node.js + Express Backend for Kural Padivam
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

import { initDb, dbRun, dbGet, dbAll } from './db.js';
import { DETECT_FIELDS_PROMPT, EXTRACT_VALUES_PROMPT, EXPLAIN_FIELD_PROMPT } from './prompts.js';
import { createPersonalDetailsRouter } from './personalDetailsRouter.js';
import { getPersistentServerSecret } from './serverSecrets.js';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
let JWT_SECRET = process.env.JWT_SECRET;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const app = express();
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.status(400).json({ error: 'HTTPS is required.' });
  }
  next();
});

// Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: 'அதிகப்படியான கோரிக்கைகள். சிறிது நேரம் கழித்து முயற்சிக்கவும்.' }
});
app.use('/api/', apiLimiter);

// Sensitive digit inspection middleware for AI endpoints
const rejectSensitiveNumericRuns = (req, res, next) => {
  const bodyStr = JSON.stringify(req.body || {});
  if (/\b\d{9,}\b/.test(bodyStr)) {
    return res.status(400).json({
      error: 'பாதுகாப்பு எச்சரிக்கை: 9 அல்லது அதற்கு மேற்பட்ட இலக்கங்களைக் கொண்ட ரகசிய எண்கள் AI சேவையகத்திற்கு அனுப்பப்படக்கூடாது.'
    });
  }
  next();
};

// Initialize Gemini Client if key present
let aiClient = null;
if (GEMINI_API_KEY) {
  try {
    aiClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    console.log('Gemini AI Client initialized successfully.');
  } catch (err) {
    console.warn('Failed to initialize Gemini AI Client:', err.message);
  }
}

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
  if (!token) {
    return res.status(401).json({ error: 'உள்நுழைவு தேவை' });
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'செல்லுபடியாகாத டோக்கன்' });
    req.user = user;
    next();
  });
};

app.use('/api/personal-details', createPersonalDetailsRouter(authenticateToken));

// --- AUTHENTICATION ROUTES ---

// Signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, password, pin, recoveryCode } = req.body;
    if (!username || !password || !recoveryCode) {
      return res.status(400).json({ error: 'அனைத்து தகவல்களையும் வழங்கவும்' });
    }

    const existingUser = await dbGet('SELECT * FROM users WHERE username = ?', [username]);
    if (existingUser) {
      return res.status(400).json({ error: 'இந்த பயனர் பெயர் ஏற்கனவே உள்ளது' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const pinHash = pin ? await bcrypt.hash(pin, 10) : null;
    const recoveryCodeHash = await bcrypt.hash(recoveryCode, 10);

    const result = await dbRun(
      'INSERT INTO users (username, password_hash, pin_hash, recovery_code_hash) VALUES (?, ?, ?, ?)',
      [username, passwordHash, pinHash, recoveryCodeHash]
    );

    const token = jwt.sign({ id: result.lastID, username }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 3600 * 1000 });

    res.json({ message: 'கணக்கு வெற்றிகரமாக உருவாக்கப்பட்டது', user: { id: result.lastID, username }, token });
  } catch (err) {
    res.status(500).json({ error: 'சேவையகப் பிழை: ' + err.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await dbGet('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) {
      return res.status(400).json({ error: 'பயனர் பெயர் அல்லது கடவுச்சொல் தவறானது' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: 'பயனர் பெயர் அல்லது கடவுச்சொல் தவறானது' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 3600 * 1000 });

    res.json({ message: 'வெற்றிகரமாக உள்நுழைந்தீர்கள்', user: { id: user.id, username: user.username }, token });
  } catch (err) {
    res.status(500).json({ error: 'சேவையகப் பிழை: ' + err.message });
  }
});

// Get Current User
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  res.json({ user: req.user });
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'வெளியேறினீர்கள்' });
});

// Recover Password
app.post('/api/auth/recover', async (req, res) => {
  try {
    const { username, recoveryCode, newPassword } = req.body;
    const user = await dbGet('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) {
      return res.status(400).json({ error: 'பயனர் பெயர் காணப்படவில்லை' });
    }

    const validRecovery = await bcrypt.compare(recoveryCode, user.recovery_code_hash);
    if (!validRecovery) {
      return res.status(400).json({ error: 'செல்லுபடியாகாத மீட்புக் குறியீடு' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await dbRun('UPDATE users SET password_hash = ? WHERE id = ?', [newPasswordHash, user.id]);

    res.json({ message: 'கடவுச்சொல் வெற்றிகரமாக மாற்றப்பட்டது' });
  } catch (err) {
    res.status(500).json({ error: 'சேவையகப் பிழை: ' + err.message });
  }
});

// Change Password
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await dbGet('SELECT * FROM users WHERE id = ?', [req.user.id]);

    const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: 'தற்போதைய கடவுச்சொல் தவறானது' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await dbRun('UPDATE users SET password_hash = ? WHERE id = ?', [newPasswordHash, user.id]);

    res.json({ message: 'கடவுச்சொல் வெற்றிகரமாக புதுப்பிக்கப்பட்டது' });
  } catch (err) {
    res.status(500).json({ error: 'சேவையகப் பிழை: ' + err.message });
  }
});

// Delete Account
app.delete('/api/auth/account', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    await dbRun('DELETE FROM users WHERE id = ?', [userId]);
    res.clearCookie('token');
    res.json({ message: 'கணக்கு நிரந்தரமாக நீக்கப்பட்டது' });
  } catch (err) {
    res.status(500).json({ error: 'சேவையகப் பிழை: ' + err.message });
  }
});

// --- AI & FORM ASSISTANCE ENDPOINTS ---

// Field Detection Endpoint
app.post('/api/detect-fields', rejectSensitiveNumericRuns, async (req, res) => {
  try {
    const { title, text } = req.body;
    if (aiClient) {
      const response = await aiClient.models.generateContent({
        model: GEMINI_MODEL,
        contents: [
          { role: 'user', parts: [{ text: `${DETECT_FIELDS_PROMPT}\nForm Title: ${title || 'Form'}\nForm Text: ${text || ''}` }] }
        ],
        config: { responseMimeType: 'application/json' }
      });
      const parsed = JSON.parse(response.text);
      return res.json(parsed);
    }
  } catch (err) {
    console.warn('Gemini detect-fields failed, using local fallback:', err.message);
  }

  // Local fallback response
  return res.json({
    fields: [
      { id: 'fullName', labelTa: 'முழு பெயர்', labelEn: 'Full Name', type: 'text', isSensitive: false, required: true },
      { id: 'fatherName', labelTa: 'தந்தை / கணவர் பெயர்', labelEn: 'Father / Husband Name', type: 'text', isSensitive: false, required: true },
      { id: 'dob', labelTa: 'பிறந்த தேதி', labelEn: 'Date of Birth', type: 'date', isSensitive: false, required: true },
      { id: 'phone', labelTa: 'தொலைபேசி எண்', labelEn: 'Phone Number', type: 'text', isSensitive: true, required: true },
      { id: 'aadhaar', labelTa: 'ஆதார் எண்', labelEn: 'Aadhaar Number', type: 'text', isSensitive: true, required: true },
      { id: 'address', labelTa: 'முகவரி', labelEn: 'Address', type: 'text', isSensitive: false, required: true }
    ]
  });
});

// Voice All-at-once Value Extraction Endpoint
app.post('/api/extract', rejectSensitiveNumericRuns, async (req, res) => {
  try {
    const { transcript, fields } = req.body;
    if (!transcript) return res.status(400).json({ error: 'உரை தேவை' });

    if (aiClient) {
      const promptText = `${EXTRACT_VALUES_PROMPT}\nInput Sentence: "${transcript}"\nTarget Fields: ${JSON.stringify(fields)}`;
      const response = await aiClient.models.generateContent({
        model: GEMINI_MODEL,
        contents: [{ role: 'user', parts: [{ text: promptText }] }],
        config: { responseMimeType: 'application/json' }
      });
      const parsed = JSON.parse(response.text);
      return res.json(parsed);
    }
  } catch (err) {
    console.warn('Gemini extraction failed, using deterministic local extraction:', err.message);
  }

  // Local deterministic rule-based extraction
  const extracted = {};
  const lower = req.body.transcript || '';

  if (req.body.fields) {
    for (const field of req.body.fields) {
      if (field.id === 'studentName' || field.id === 'fullName' || field.id === 'headName') {
        const nameMatch = lower.match(/(?:பெயர்|name|நான்)\s+([அ-ஹa-zA-Z\s]+?)(?=\s+(?:வயது|வருமானம்|ஆதார்|முகவரி|போன்|$))/i);
        if (nameMatch) extracted[field.id] = nameMatch[1].trim();
      }
      if (field.id === 'income') {
        const incomeMatch = lower.match(/(?:வருமானம்|income|வருஷம்)\s+([0-9]+)/i);
        if (incomeMatch) extracted[field.id] = incomeMatch[1];
      }
      if (field.isSensitive) {
        const numMatch = lower.match(/\[NUM\d+\]/);
        if (numMatch) extracted[field.id] = numMatch[0];
      }
    }
  }

  return res.json({ extracted, confidence: 0.85 });
});

// Explain Field Endpoint
app.post('/api/explain', rejectSensitiveNumericRuns, async (req, res) => {
  try {
    const { fieldLabelTa, fieldLabelEn } = req.body;
    if (aiClient) {
      const promptText = `${EXPLAIN_FIELD_PROMPT}\nField: ${fieldLabelTa} (${fieldLabelEn})`;
      const response = await aiClient.models.generateContent({
        model: GEMINI_MODEL,
        contents: [{ role: 'user', parts: [{ text: promptText }] }],
        config: { responseMimeType: 'application/json' }
      });
      const parsed = JSON.parse(response.text);
      return res.json(parsed);
    }
  } catch (err) {
    console.warn('Gemini explain failed, returning local response:', err.message);
  }

  return res.json({
    explanationTa: `${req.body.fieldLabelTa || 'இந்த புலம்'}: உங்கள் அதிகாரப்பூர்வ ஆவணத்தில் உள்ள தகவலை இங்கே சரியாக நிரப்பவும்.`,
    explanationEn: `Please enter the details exactly as shown on your official document.`
  });
});

// Document Guidance API
app.get('/api/guide/:id', (req, res) => {
  try {
    const guidePath = path.join(__dirname, 'data', 'guide.json');
    const guideData = JSON.parse(fs.readFileSync(guidePath, 'utf8'));
    const item = guideData[req.params.id];
    if (item) {
      res.json(item);
    } else {
      res.status(404).json({
        error: 'வழிகாட்டி காணப்படவில்லை',
        fallbackTa: 'இந்த தகவல் எங்கே கிடைக்கும் என்று தெரியவில்லை. VAO அலுவலகம் அல்லது இ-சேவை மையத்தில் கேளுங்கள்.',
        fallbackEn: 'Location information for this document is unavailable. Please consult your local VAO office or e-Sevai centre.'
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- RECORD MANAGEMENT ENDPOINTS ---

// Save Record
app.post('/api/records', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { formTitle, formType, nonSensitiveData, sensitiveFields } = req.body;

    const recordResult = await dbRun(
      'INSERT INTO records (user_id, form_title, form_type, non_sensitive_data) VALUES (?, ?, ?, ?)',
      [userId, formTitle, formType, JSON.stringify(nonSensitiveData || {})]
    );

    const recordId = recordResult.lastID;

    if (sensitiveFields && Array.isArray(sensitiveFields)) {
      for (const field of sensitiveFields) {
        await dbRun(
          'INSERT INTO sensitive_fields (record_id, field_name, masked_value, ciphertext, iv, salt) VALUES (?, ?, ?, ?, ?, ?)',
          [recordId, field.fieldName, field.maskedValue, field.ciphertext, field.iv, field.salt]
        );
      }
    }

    // Log Action
    await dbRun(
      'INSERT INTO access_logs (user_id, record_id, action, status) VALUES (?, ?, ?, ?)',
      [userId, recordId, 'SAVE_RECORD', 'SUCCESS']
    );

    res.json({ message: 'படிவம் பாதுகாப்பாக சேமிக்கப்பட்டது', recordId });
  } catch (err) {
    res.status(500).json({ error: 'சேமிப்பதில் பிழை: ' + err.message });
  }
});

// Get User Records
app.get('/api/records', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const records = await dbAll('SELECT * FROM records WHERE user_id = ? ORDER BY created_at DESC', [userId]);

    for (const rec of records) {
      rec.non_sensitive_data = JSON.parse(rec.non_sensitive_data || '{}');
      rec.sensitive_fields = await dbAll('SELECT id, field_name, masked_value, ciphertext, iv, salt FROM sensitive_fields WHERE record_id = ?', [rec.id]);
    }

    res.json({ records });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reveal Sensitive Field Authorization & Verification Endpoint
app.post('/api/records/:id/reveal', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const recordId = req.params.id;
    const { password, pin, fieldName } = req.body;

    // Check Lockout Status (5 failed attempts = 5 min lock)
    const failedRecord = await dbGet('SELECT * FROM failed_attempts WHERE user_id = ?', [userId]);
    if (failedRecord && failedRecord.locked_until) {
      const lockedUntil = new Date(failedRecord.locked_until);
      if (new Date() < lockedUntil) {
        return res.status(429).json({
          error: '5 முறை தவறான முயற்சி செய்யப்பட்டதால் 5 நிமிடங்களுக்கு அணுகல் முடக்கப்பட்டுள்ளது.',
          lockedUntil
        });
      }
    }

    // Verify Password or PIN
    const user = await dbGet('SELECT * FROM users WHERE id = ?', [userId]);
    let authorized = false;

    if (password) {
      authorized = await bcrypt.compare(password, user.password_hash);
    } else if (pin && user.pin_hash) {
      authorized = await bcrypt.compare(pin, user.pin_hash);
    }

    if (!authorized) {
      // Track failed attempt
      const currentAttempts = (failedRecord ? failedRecord.attempts : 0) + 1;
      let lockedUntil = null;
      if (currentAttempts >= 5) {
        lockedUntil = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      }

      await dbRun(
        'INSERT OR REPLACE INTO failed_attempts (user_id, attempts, locked_until) VALUES (?, ?, ?)',
        [userId, currentAttempts, lockedUntil]
      );

      await dbRun(
        'INSERT INTO access_logs (user_id, record_id, field_name, action, status) VALUES (?, ?, ?, ?, ?)',
        [userId, recordId, fieldName, 'REVEAL_FIELD', 'FAILED']
      );

      return res.status(401).json({
        error: 'தவறான கடவுச்சொல் / PIN.',
        attemptsRemaining: Math.max(0, 5 - currentAttempts)
      });
    }

    // Reset failed attempts on success
    await dbRun('INSERT OR REPLACE INTO failed_attempts (user_id, attempts, locked_until) VALUES (?, 0, NULL)', [userId]);

    // Fetch Encrypted Field Payload
    const sensitiveField = await dbGet(
      'SELECT ciphertext, iv, salt, masked_value FROM sensitive_fields WHERE record_id = ? AND field_name = ?',
      [recordId, fieldName]
    );

    if (!sensitiveField) {
      return res.status(404).json({ error: 'புலம் காணப்படவில்லை' });
    }

    // Audit Log (Never log decrypted value!)
    await dbRun(
      'INSERT INTO access_logs (user_id, record_id, field_name, action, status) VALUES (?, ?, ?, ?, ?)',
      [userId, recordId, fieldName, 'REVEAL_FIELD', 'SUCCESS']
    );

    res.json({
      ciphertext: sensitiveField.ciphertext,
      iv: sensitiveField.iv,
      salt: sensitiveField.salt,
      maskedValue: sensitiveField.masked_value
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Record
app.delete('/api/records/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const recordId = req.params.id;

    await dbRun('DELETE FROM records WHERE id = ? AND user_id = ?', [recordId, userId]);
    await dbRun('INSERT INTO access_logs (user_id, record_id, action, status) VALUES (?, ?, ?, ?)', [userId, recordId, 'DELETE_RECORD', 'SUCCESS']);

    res.json({ message: 'பதிவு நீக்கப்பட்டது' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Access Logs
app.get('/api/logs', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const logs = await dbAll('SELECT * FROM access_logs WHERE user_id = ? ORDER BY timestamp DESC LIMIT 50', [userId]);
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server
Promise.all([
  initDb(),
  getPersistentServerSecret('JWT_SECRET', 'jwt.key')
]).then(([, jwtSecret]) => {
  JWT_SECRET = jwtSecret;
  app.listen(PORT, () => {
    console.log(`Kural Padivam Server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database server:', err);
});
