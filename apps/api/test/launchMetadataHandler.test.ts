import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const receipt = {
  status: '0x1',
  to: '0xb39452a805657c6aaef5d804934d44c814f35906',
  from: '0x7dec46c3792e749a804d8923d74bdf59364cad9d',
  blockNumber: '0x10',
  logs: [{
    address: '0xb39452a805657c6aaef5d804934d44c814f35906',
    topics: [
      '0x9011bc3f0b64dfe8696c2a1987d2fad8d1a965a3317b018e3fa2be21a3ccd011',
      '0x000000000000000000000000353b2c04d642ece09815778628e35c79d2d5ad22',
      '0x0000000000000000000000007dec46c3792e749a804d8923d74bdf59364cad9d',
    ],
    data: '0x' + '00'.repeat(32 * 9) + '000000000000000000000000c74c960708f043e04a84038c6d1136ea7fcb16a1',
  }],
};

const tx = {
  from: '0x7dec46c3792e749a804d8923d74bdf59364cad9d',
  to: '0xb39452a805657c6aaef5d804934d44c814f35906',
  value: '0xde0b6b3a7640000',
  input: '0xd928a6db',
};

function makeResponse() {
  const headers = new Map<string, string>();
  return {
    statusCode: 0,
    body: undefined as unknown,
    headers,
    status(code: number) { this.statusCode = code; return this; },
    json(body: unknown) { this.body = body; },
    setHeader(key: string, value: string) { headers.set(key, value); },
    end() { this.body = null; },
  };
}

async function loadHandler(fetchImpl: typeof fetch) {
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
  globalThis.fetch = fetchImpl;
  const module = await import(`../../../api/launch-metadata.ts?case=${Date.now()}-${Math.random()}`);
  return module.default as (req: { method?: string; body?: unknown }, res: ReturnType<typeof makeResponse>) => Promise<void>;
}

const validBody = {
  tokenAddress: '0x353b2c04d642ece09815778628e35c79d2d5ad22',
  chainId: 338,
  creatorAddress: '0x7dec46c3792e749a804d8923d74bdf59364cad9d',
  name: 'Cronus',
  symbol: 'CRONUS',
  description: 'the cronus',
  imageUrl: 'https://example.com/image.png',
  websiteUrl: 'www.google.com',
  xUrl: 'not a url',
  graduationTargetWei: '5000000000000000000',
  reserveRaisedWei: '1000000000000000000',
  antiBotEnabled: true,
  vvsRouter: '0xC74C960708f043E04a84038c6D1136EA7Fcb16a1',
  txHash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  blockNumber: '16',
};

describe('launch metadata handler', () => {
  it('rejects reverted tx hashes before Supabase writes', async () => {
    let supabaseCalled = false;
    const handler = await loadHandler(async (url, init) => {
      const target = String(url);
      if (target.includes('/rest/v1/launches')) {
        supabaseCalled = true;
        return new Response(null, { status: 200 });
      }
      const body = JSON.parse(String(init?.body));
      const result = body.method === 'eth_getTransactionReceipt' ? { ...receipt, status: '0x0', logs: [] } : tx;
      return Response.json({ jsonrpc: '2.0', id: 1, result });
    });
    const res = makeResponse();
    await handler({ method: 'POST', body: validBody }, res);
    assert.equal(res.statusCode, 409);
    assert.deepEqual(res.body, { error: 'tx_not_successful' });
    assert.equal(supabaseCalled, false);
  });

  it('verifies a confirmed TokenCreated tx and stores only normalized safe metadata urls', async () => {
    let stored: Record<string, unknown> | undefined;
    const handler = await loadHandler(async (url, init) => {
      const target = String(url);
      if (target.includes('/rest/v1/launches')) {
        stored = JSON.parse(String(init?.body));
        return new Response(null, { status: 200 });
      }
      const body = JSON.parse(String(init?.body));
      const result = body.method === 'eth_getTransactionReceipt' ? receipt : tx;
      return Response.json({ jsonrpc: '2.0', id: 1, result });
    });
    const res = makeResponse();
    await handler({ method: 'POST', body: validBody }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(stored?.token_address, validBody.tokenAddress);
    assert.equal(stored?.website_url, null);
    assert.equal(stored?.x_url, null);
    assert.equal(stored?.image_url, 'https://example.com/image.png');
  });
});
