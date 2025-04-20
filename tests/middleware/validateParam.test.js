import request from 'supertest';
import express from 'express';
import { validateNumericParam } from '../../src/middleware/validateParam.js';

const app = express();

app.get('/test/:id', validateNumericParam('id'), (req, res) => {
  res.status(200).json({ message: 'Valid ID' });
});

describe('validateNumericParam middleware', () => {
  it('allows valid numeric ID as number', async () => {
    const res = await request(app).get('/test/123');
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Valid ID');
  });

  it('allows valid numeric ID as string', async () => {
    const res = await request(app).get('/test/00123');
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Valid ID');
  });

  it('rejects alphabetic string', async () => {
    const res = await request(app).get('/test/abc');
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/invalid.*id/i);
  });

  it('rejects alphanumeric string', async () => {
    const res = await request(app).get('/test/12ab');
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/invalid.*id/i);
  });

  it('rejects missing ID (empty param)', async () => {
    const res = await request(app).get('/test/');
    expect(res.statusCode).toBe(404);
  });
});
