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
    await request(app).post('/auth/register').send({
        username: 'Admin', email: 'admin@test.com', password: 'password', role: 'admin'
    });
});

afterAll(async () => {
    await sequelize.close();
});

describe('Move Question API', () => {
    let token;
    let subject1, subject2;
    let question;

    beforeAll(async () => {
        const res = await request(app).post('/auth/login').send({
            email: 'admin@test.com', password: 'password'
        });
        token = res.body.token;

        subject1 = await Subject.create({ name: 'Subject 1' });
        subject2 = await Subject.create({ name: 'Subject 2' });
        question = await Question.create({
            text: 'Move Me', options: JSON.stringify(['A', 'B']), correctOption: 1, difficulty: 'easy', SubjectId: subject1.id
        });
    });

    it('should move question to another subject', async () => {
        const res = await request(app)
            .put(`/admin/questions/${question.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ SubjectId: subject2.id });

        expect(res.statusCode).toEqual(200);

        const updatedQ = await Question.findByPk(question.id);
        expect(updatedQ.SubjectId).toBe(subject2.id);
    });

    it('should bulk move questions', async () => {
        const q2 = await Question.create({
            text: 'Bulk Move 1', options: JSON.stringify(['A', 'B']), correctOption: 1, difficulty: 'easy', SubjectId: subject1.id
        });
        const q3 = await Question.create({
            text: 'Bulk Move 2', options: JSON.stringify(['A', 'B']), correctOption: 1, difficulty: 'easy', SubjectId: subject1.id
        });

        const res = await request(app)
            .put('/admin/questions/bulk-move')
            .set('Authorization', `Bearer ${token}`)
            .send({ ids: [q2.id, q3.id], subjectId: subject2.id });

        expect(res.statusCode).toEqual(200);

        const updatedQ2 = await Question.findByPk(q2.id);
        const updatedQ3 = await Question.findByPk(q3.id);
        expect(updatedQ2.SubjectId).toBe(subject2.id);
        expect(updatedQ3.SubjectId).toBe(subject2.id);
    });
});
