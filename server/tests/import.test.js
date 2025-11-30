const request = require('supertest');
const express = require('express');
const { sequelize } = require('../db/database');
const { User, Question, Subject, AdminAction } = require('../models');
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
    await Subject.create({ name: 'Test Subject' });
});

afterAll(async () => {
    await sequelize.close();
});

describe('Import API', () => {
    let token;
    let subjectId;

    beforeAll(async () => {
        const res = await request(app).post('/auth/login').send({
            email: 'admin@test.com', password: 'password'
        });
        token = res.body.token;
        const sub = await Subject.findOne({ where: { name: 'Test Subject' } });
        subjectId = sub.id;
    });

    it('should preview numbered questions correctly', async () => {
        const text = `
1. What is 2+2?
A) 3
B) 4
C) 5
D) 6
Answer: B

2. What is 3+3?
A) 5
B) 6
C) 7
D) 8
Answer: B
        `;
        const res = await request(app)
            .post('/admin/import/preview')
            .set('Authorization', `Bearer ${token}`)
            .send({ text, subjectId });

        expect(res.statusCode).toEqual(200);
        expect(res.body.count).toBe(2);
        expect(res.body.questions[0].isValid).toBe(true);
        expect(res.body.questions[0].text).toContain('What is 2+2?');
    });

    it('should preview CSV questions correctly', async () => {
        const text = `What is 2+2?,3,4,5,6,B`;
        const res = await request(app)
            .post('/admin/import/preview')
            .set('Authorization', `Bearer ${token}`)
            .send({ text, subjectId });

        expect(res.statusCode).toEqual(200);
        expect(res.body.count).toBe(1);
        expect(res.body.questions[0].isValid).toBe(true);
        expect(res.body.questions[0].text).toBe('What is 2+2?');
    });

    it('should confirm import with valid data', async () => {
        const questions = [
            { text: 'Q1', options: ['A', 'B', 'C', 'D'], correctOption: 1, SubjectId: subjectId, isValid: true }
        ];
        const res = await request(app)
            .post('/admin/import/confirm')
            .set('Authorization', `Bearer ${token}`)
            .send({ questions });

        expect(res.statusCode).toEqual(200);
        const count = await Question.count();
        expect(count).toBe(1);
    });

    it('should fail import without SubjectId', async () => {
        const questions = [
            { text: 'Q2', options: ['A', 'B', 'C', 'D'], correctOption: 1, isValid: true }
        ];
        const res = await request(app)
            .post('/admin/import/confirm')
            .set('Authorization', `Bearer ${token}`)
            .send({ questions });

        // Should fail because SubjectId is null and we enforced allowNull: false
        // However, bulkCreate might catch it or DB might throw error.
        // Since we are using SQLite in tests, it should throw constraint error.
        expect(res.statusCode).toEqual(500);
    });
});
