import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { schemaTables } from '../src/index.js';

describe('db schema exports', () => {
  it('lists core tables', () => {
    assert(schemaTables.includes('launches'));
    assert(schemaTables.includes('moderation_flags'));
  });
});
