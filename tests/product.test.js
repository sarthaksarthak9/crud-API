require("dotenv").config();

const mongoose = require("mongoose");
const request = require("supertest");
const app = require("../app");

/* Connecting to the database before each test. */
beforeEach(async () => {
    await mongoose.connect(process.env.MONGODB_URL);
  });
  
/* Closing database connection after each test. */
afterEach(async () => {
    await mongoose.connection.close();
  });

describe("GET /api/products", () => {
    it("should return all products", async () => {
      const res = await request(app).get("/api/products");
      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

describe("GET /api/products/:id", () => {
    it("should return a product", async () => {
      const res = await request(app).get(
        "/api/products/661fdd741595e378925b0879"
      );
      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe("Product 1");
    });
  });
  
describe("POST /api/products", () => {
    it("should create a product", async () => {
      const res = await request(app).post("/api/products").send({
        name: "airpods",
        quantity : 2,
        price: 200,
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe("airpods");
    });
  });
  
describe("PUT /api/products/:id", () => {
    it("should update a product", async () => {
      const res = await request(app)
        .patch("/api/products/661fdd741595e378925b0879")
        .send({
          name: "airpods",
          quantity : 2,
          price: 200,          
        });
      expect(res.statusCode).toBe(200);
    });
  });
  
describe("DELETE /api/products/:id", () => {
    it("should delete a product", async () => {
      const res = await request(app).delete(
        "/api/products/661fdd741595e378925b0879"
      );
      expect(res.statusCode).toBe(200);
    });
  });

  