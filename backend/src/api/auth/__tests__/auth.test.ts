
import request from 'supertest';
import express from 'express';
import authRouter from '../auth.router';

const app = express();
app.use(express.json());
app.use('/auth', authRouter);

describe('Auth API', () => {
  it('should return 400 for missing email or password', async () => {
    const res = await request(app).post('/auth/login');
    expect(res.status).toBe(400);
  });
});
