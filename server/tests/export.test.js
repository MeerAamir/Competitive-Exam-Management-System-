const request = require('supertest');
const express = require('express');
const { sequelize } = require('../db/database');
const { User, Question, Subject } = require('../models');
const adminRoutes = require('../routes/admin');
const authRoutes = require('../routes/auth');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
app.use('/admin', adminRoutes);
app.use('/auth', authRoutes);

beforeAll(async () => {
    await sequelize.sync({ force: true });
    // Create Admin
    await request(app).post('/auth/register').send({
        username: 'Admin', email: 'admin@test.com', password: 'password', role: 'admin'
    });
    // Create Subject
    const sub = await Subject.create({ name: 'Test Subject' });
    // Create Question
    await Question.create({
        text: 'Test Q', options: JSON.stringify(['A', 'B', 'C', 'D']), correctOption: 1, difficulty: 'easy', SubjectId: sub.id
    });
});

afterAll(async () => {
    await sequelize.close();
});

describe('Export API', () => {
    let token;

    beforeAll(async () => {
        const res = await request(app).post('/auth/login').send({
            email: 'admin@test.com', password: 'password'
        });
        token = res.body.token;
    });

    it('should export JSON by default', async () => {
        const res = await request(app)
            .get('/admin/questions/export')
            .set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body[0].text).toBe('Test Q');
    });

    it('should export CSV', async () => {
        const res = await request(app)
            .get('/admin/questions/export?format=csv')
            .set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toEqual(200);
        expect(res.header['content-type']).toContain('text/csv');
    });

    it('should export XLSX', async () => {
        const res = await request(app)
            .get('/admin/questions/export?format=xlsx')
            .set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toEqual(200);
        expect(res.header['content-type']).toContain('spreadsheetml');
    });

    it('should export PDF with answers', async () => {
        const res = await request(app)
            .get('/admin/questions/export')
            .query({ format: 'pdf', includeAnswers: 'true' })
            .set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toEqual(200);
        expect(res.header['content-type']).toContain('application/pdf');
    });

    it('should export questions with date filter', async () => {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 1);
        const endDate = new Date();

        const res = await request(app)
            .get('/admin/questions/export')
            .query({
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            })
            .set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
});
