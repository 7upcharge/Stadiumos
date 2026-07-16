import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../server/app.js';

describe('Express API Integration Tests', () => {
  it('should respond to GET /api/health with operational status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('service', 'StadiumOS AI Core Services');
  });

  it('should fail on POST /api/scenario-simulate with empty query (Zod validation)', async () => {
    const res = await request(app)
      .post('/api/scenario-simulate')
      .send({ query: '' });
    
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toContain('Query cannot be empty');
  });

  it('should fail on POST /api/scenario-simulate with excessively long query', async () => {
    const longQuery = 'a'.repeat(501);
    const res = await request(app)
      .post('/api/scenario-simulate')
      .send({ query: longQuery });
    
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toContain('Query exceeds maximum length');
  });

  it('should successfully run POST /api/scenario-simulate with valid query', async () => {
    const res = await request(app)
      .post('/api/scenario-simulate')
      .send({ query: 'What happens if Gate 3 closes due to a medical emergency?' });
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('input');
    expect(res.body).toHaveProperty('parsed');
    expect(res.body).toHaveProperty('simulation');
    expect(res.body).toHaveProperty('reasoning');
    expect(res.body).toHaveProperty('timing');

    // Verify simulation output keys
    expect(res.body.simulation).toHaveProperty('affectedGateId', 'gate-3');
    expect(res.body.simulation).toHaveProperty('affectedGateName', 'Gate 3 (East)');
  });

  it('should list simulations from GET /api/simulations', async () => {
    const res = await request(app).get('/api/simulations');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should fail to save simulation in POST /api/simulations if query is missing', async () => {
    const res = await request(app)
      .post('/api/simulations')
      .send({ result: {} });
    
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Missing query or result in body');
  });

  it('should save simulation in POST /api/simulations', async () => {
    const testRecord = {
      query: 'What happens if Gate 3 closes?',
      result: { status: 'mocked' },
      confidence: 0.95,
      actionPlan: ['Action 1', 'Action 2']
    };

    const res = await request(app)
      .post('/api/simulations')
      .send(testRecord);
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('query', testRecord.query);
    expect(res.body).toHaveProperty('timestamp');
  });

  it('should successfully execute POST /api/ai/copilot and return structured response', async () => {
    const requestData = {
      prompt: 'Check Gate 4 crowd density issues',
      role: 'SECURITY'
    };

    const res = await request(app)
      .post('/api/ai/copilot')
      .send(requestData);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('completion');
    expect(res.body).toHaveProperty('language', 'en');
    expect(res.body).toHaveProperty('confidence');
    expect(res.body.confidence).toHaveProperty('score');
    expect(res.body.confidence).toHaveProperty('reasoning');
    expect(res.body).toHaveProperty('explainability');
    expect(res.body.explainability).toHaveProperty('primaryFactors');
    expect(res.body.explainability).toHaveProperty('reasoningChain');
  });

  it('should reject POST /api/ai/copilot with invalid user roles', async () => {
    const res = await request(app)
      .post('/api/ai/copilot')
      .send({ prompt: 'Test prompt', role: 'INVALID_ROLE' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});
