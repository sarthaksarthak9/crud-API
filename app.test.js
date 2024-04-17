const request = require('supertest');
const express = require('express');
const app  = require('./index');
const { getProducts, getProduct, createProduct, updateProduct, deleteProduct } = require('../controllers/product.controller');

// Mocking the Product model
jest.mock('../models/product.model', () => ({
  find: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
}));

const app = express();

// Mocking the routes
app.get('/', getProducts);
app.get('/:id', getProduct);
app.post('/', createProduct);
app.put('/:id', updateProduct);
app.delete('/:id', deleteProduct);

describe('GET /', () => {
  test('It should respond with status 200 and return products', async () => {
    const mockProducts = [{ name: 'Product 1' }, { name: 'Product 2' }];
    const Product = require('../models/product.model');
    Product.find.mockResolvedValueOnce(mockProducts);

    await request(app)
      .get('/')
      .expect(200)
      .expect('Content-Type', /json/)
      .then((response) => {
        expect(response.body).toEqual(mockProducts);
      });
  });
});

describe('GET /:id', () => {
  test('It should respond with status 200 and return a product', async () => {
    const mockProduct = { _id: '1', name: 'Product 1' };
    const Product = require('../models/product.model');
    Product.findById.mockResolvedValueOnce(mockProduct);

    await request(app)
      .get('/1')
      .expect(200)
      .expect('Content-Type', /json/)
      .then((response) => {
        expect(response.body).toEqual(mockProduct);
      });
  });
});

describe('POST /', () => {
  test('It should respond with status 200 and create a new product', async () => {
    const newProduct = { name: 'New Product' };
    const createdProduct = { _id: '2', name: 'New Product' };
    const Product = require('../models/product.model');
    Product.create.mockResolvedValueOnce(createdProduct);

    await request(app)
      .post('/')
      .send(newProduct)
      .expect(200)
      .expect('Content-Type', /json/)
      .then((response) => {
        expect(response.body).toEqual(createdProduct);
      });
  });
});

describe('PUT /:id', () => {
  test('It should respond with status 200 and update an existing product', async () => {
    const updatedProduct = { _id: '1', name: 'Updated Product' };
    const Product = require('../models/product.model');
    Product.findByIdAndUpdate.mockResolvedValueOnce(updatedProduct);

    await request(app)
      .put('/1')
      .send({ name: 'Updated Product' })
      .expect(200)
      .expect('Content-Type', /json/)
      .then((response) => {
        expect(response.body).toEqual(updatedProduct);
      });
  });
});

describe('DELETE /:id', () => {
  test('It should respond with status 200 and delete an existing product', async () => {
    const Product = require('../models/product.model');
    Product.findByIdAndDelete.mockResolvedValueOnce({ _id: '1', name: 'Deleted Product' });

    await request(app)
      .delete('/1')
      .expect(200)
      .expect('Content-Type', /json/)
      .then((response) => {
        expect(response.body).toEqual({ message: 'Product deleted successfully' });
      });
  });
});
