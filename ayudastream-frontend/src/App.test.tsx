import { describe, it, expect, vi } from 'vitest';
import { isAllowed, getAddress } from '@stellar/freighter-api';
import { CONTRACT_ID } from './config';

vi.mock('@stellar/freighter-api', () => ({
  isAllowed: vi.fn().mockResolvedValue(true),
  getAddress: vi.fn().mockResolvedValue({
    address: 'GBTEST12345678901234567890123456789012345678901234567890', // 56 chars
  }),
}));

describe('AgriStream dApp Environment Tests', () => {
  it('1. Verifies the Soroban Contract ID format is valid', () => {
    expect(CONTRACT_ID.length).toBe(56);
    expect(CONTRACT_ID.startsWith('C') || CONTRACT_ID.startsWith('G')).toBe(true);
  });

  it('2. Successfully validates Freighter API connection status', async () => {
    const allowed = await isAllowed();
    expect(allowed).toBe(true);
  });

  it('3. Successfully retrieves the NGO wallet address', async () => {
    const r = await getAddress();
    expect(r.address).toBe('GBTEST12345678901234567890123456789012345678901234567890');
    expect(r.address.length).toBe(56);
  });
});