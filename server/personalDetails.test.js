import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';

process.env.PERSONAL_DETAILS_ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');

const {
  decryptPersonalDetail,
  encryptPersonalDetail,
  maskPersonalDetail,
  validatePersonalDetail
} = await import('./personalDetails.js');

test('masks supported detail types without exposing short other values', () => {
  assert.equal(maskPersonalDetail('aadhaar', '236589741258'), 'XXXX XXXX 1258');
  assert.equal(maskPersonalDetail('bank', '1234567890'), 'XXXXXX7890');
  assert.equal(maskPersonalDetail('ifsc', 'SBIN0001234'), 'XXXX0001234');
  assert.equal(maskPersonalDetail('mobile', '9876543210'), 'XXXXXX3210');
  assert.equal(maskPersonalDetail('email', 'test@gmail.com'), 't****@gmail.com');
  assert.equal(maskPersonalDetail('other', 'private test note'), 'XXXX');
  assert.equal(maskPersonalDetail('other', 'x'), 'XXXX');
});

test('validates detail values before encryption', () => {
  assert.equal(validatePersonalDetail('aadhaar', '236589741258').valid, true);
  assert.equal(validatePersonalDetail('aadhaar', '1234').valid, false);
  assert.equal(validatePersonalDetail('email', 'not-an-email').valid, false);
  assert.equal(validatePersonalDetail('unsupported', 'secret').valid, false);
});

test('encrypts values with authenticated encryption and rejects tampering', async () => {
  const encrypted = await encryptPersonalDetail('private test value');
  assert.notEqual(encrypted.ciphertext, 'private test value');
  assert.equal(
    await decryptPersonalDetail(encrypted.ciphertext, encrypted.iv),
    'private test value'
  );

  const tampered = Buffer.from(encrypted.ciphertext, 'base64');
  tampered[0] ^= 1;
  await assert.rejects(decryptPersonalDetail(tampered.toString('base64'), encrypted.iv));
});
