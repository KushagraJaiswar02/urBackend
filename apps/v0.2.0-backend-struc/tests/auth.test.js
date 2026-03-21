const request = require('supertest');
const mongoose = require('mongoose');

const JWT_SECRET =
    process.env.JWT_SECRET ||
    (process.env.NODE_ENV === "test" ? "ci_test_jwt_secret" : null);

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
}


jest.mock('ioredis', () => {
    return jest.fn().mockImplementation(() => ({
        on: jest.fn(),
        quit: jest.fn().mockResolvedValue('OK'),
        status: 'ready',
        set: jest.fn().mockResolvedValue('OK'),
        get: jest.fn().mockResolvedValue(null),
        del: jest.fn().mockResolvedValue(1),
    }));
});

jest.mock('resend', () => {
    return {
        Resend: jest.fn().mockImplementation(() => ({
            emails: {
                send: jest.fn().mockResolvedValue({ data: { id: 'mock_id' }, error: null }),
            },
        })),
    };
});

const app = require('../app');
const Developer = require('../models/Developer');
const bcrypt = require('bcryptjs');
require('dotenv').config();



// --- SETUP 
beforeAll(async () => {
    const uri = process.env.TEST_MONGO_URL;

    // Debugging (Secret is masked as *** in GitHub logs, but we can check the format)
    console.log("URI Length:", uri ? uri.length : 0);
    console.log("URI Starts with mongodb:", uri ? uri.startsWith('mongodb') : false);

    if (!uri || !uri.startsWith('mongodb')) {
        throw new Error(`Invalid TEST_MONGO_URL! Received: ${uri ? 'invalid format' : 'nothing'}`);
    }

    await mongoose.disconnect();
    await mongoose.connect(uri);
});

const redis = require('../config/redis'); // Import redis client

afterAll(async () => {
    await mongoose.connection.close();
    await redis.quit(); // Close Redis connection
});

describe('Auth API Security', () => {

    // Clean DB bedore every test
    beforeEach(async () => {
        await Developer.deleteMany({}); // Clear old data

        // Create a dummy user
        const hashedPassword = await bcrypt.hash('password123', 10);
        await Developer.create({ email: 'test@example.com', password: hashedPassword });
    });

    // Clean DB after every test
    afterEach(async () => {
        await Developer.deleteMany({});
    });

    it('should login successfully with correct credentials', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@example.com',
                password: 'password123'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
    });

    it('should BLOCK NoSQL Injection attempt (Zod Validation)', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: { "$ne": null }, // Attack Payload
                password: 'password123'
            });

        // DEBUGGING LOGS 
        console.log("Status Code:", res.statusCode);
        console.log("Response Body:", res.body);
        console.log("Response Text:", res.text);

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBeDefined();
    });
});
