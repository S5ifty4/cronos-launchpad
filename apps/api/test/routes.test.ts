import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { handleRequest } from '../src/routes.js';

describe('api routes', () => {
  it('serves launch list and nested resources', () => {
    assert.equal(handleRequest('/launches').status, 200);
    assert.equal(handleRequest('/launches/0xcrojack/trades').status, 200);
    assert.equal(handleRequest('/creators/0xabc').status, 200);
  });

  it('404s unknown routes', () => {
    assert.equal(handleRequest('/missing').status, 404);
  });
});
