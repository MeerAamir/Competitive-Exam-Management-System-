const request = require('supertest');
const app = require('../index');
const { sequelize } = require('../db/database');

beforeAll(async () => {
    await sequelize.sync({ force: true });
});

afterAll(async () => {
    await sequelize.close();
});

describe('Auth API', () => {
    it('should register a new user', async () => {
        const res = await request(app)
            .post('/auth/register')
            .send({
                username: 'TestUser',
                email: 'test@example.com',
                password: 'password123',
                role: 'student'
            });
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('message', 'User created successfully');
    });

    it('should login the user', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({
                email: 'test@example.com',
                password: 'password123'
            });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
    });
});
