const request = require('supertest');
const express = require('express');
const {app} = require('./app')

describe('GET /', () => {
    test('should respond with 200 status code', async () => {
      const response = await request(app).get('/products');
      expect(response.statusCode).toBe(200);
    });
  });
  
