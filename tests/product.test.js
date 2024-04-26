require("dotenv").config();

const mongoose = require("mongoose");
const request = require("supertest");
const Product = require("../models/product.model");
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

    it("should return 500 if an error occurs", async () => {
      // Force an error by not connecting to the database
      await mongoose.disconnect();

      const res = await request(app).get("/api/products");

      expect(res.statusCode).toBe(500);
      expect(res.body).toHaveProperty("message");
    });
});

describe("GET /api/products/:id", () => {
    it("should return a product", async () => {
      const res = await request(app).get(
        "/api/products/661fdd741595e378925b087d"
      );
      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe("lava");
    });

    it("should return 500 if an error occurs", async () => {
      // Disconnect from the database to force an error
      await mongoose.disconnect();

      const res = await request(app).get("/api/products/66252004d297ba96df87ba4a");

      expect(res.statusCode).toBe(500);
      expect(res.body).toHaveProperty("message");
    });
});
  
describe("POST /api/products", () => {
    it("should create a product", async () => {
      const res = await request(app)
        .post("/api/products")
        .send({
          name : "iPad",
          quantity : 4,
          price : 20000,
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.quantity).toBe(4);
    });
    
    it("should return 500 if an error occurs", async () => {
      // Disconnect from the database to force an error
      await mongoose.disconnect();

      const res = await request(app)
        .post("/api/products")
        .send({
          name: "iPad",
          quantity : 4,
          price: 20000,
        });

      expect(res.statusCode).toBe(500);
      expect(res.body.quantity).toBe(4);
    });
});

  
describe("PUT /api/products/:id", () => {
  it("should update a product", async () => {
      // Insert a sample product into the database
      // const sampleProduct = await Product.create({ name: "ZenZ", quantity: 10, price: 100 });

      const res = await request(app)
          .put("/api/products/662399b3e24d0c5ecc531e0d")
          .send({quantity : 20 },{price : 10000});

      expect(res.statusCode).toBe(200);
      expect(res.body.quantity).toBe(20);
  });

  it("should return 404 if product ID does not exist", async () => {
      const res = await request(app)
          .patch("/api/products/6068b2447917f4b3f089cc35")
          .send({ name: "Updated Product" });

      expect(res.statusCode).toBe(404);
  });
});
  
describe("DELETE /api/products/:id", () => {
    it("should delete a product", async () => {
      const res = await request(app).delete(
        "/api/products/6627cf60e07904852930e0e8"
      );
      expect(res.statusCode).toBe(200);
    });

    it("should return 404 if product ID does not exist", async () => {
     
      const res = await request(app).delete("/api/products/6627cf60e07904852930e0e8");

      // Assertions
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty("message", "Product not found");
    });

    it("should return 500 if an error occurs", async () => {
        // Disconnect from the database to force an error
        await mongoose.disconnect();

        const res = await request(app).delete("/api/products/6627cf60e07904852930e0e8");

        // Assertions
        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty("message");
    });
});

  