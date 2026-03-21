
const app = require('../app')
const request = require('supertest')


describe("Health endpoint test and health payload",()=>{
    it("GET / return 200",async()=>{
        const res = await request(app).get("/");

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
        status: "success",
        message: "urBackend API is running 🚀"
        })
    })
})