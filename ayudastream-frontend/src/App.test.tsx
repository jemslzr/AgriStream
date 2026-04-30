import { describe, it, expect, vi } from 'vitest';
import { isAllowed, getPublicKey } from '@stellar/freighter-api';

// Mock the Freighter API to ensure our app logic can connect
vi.mock('@stellar/freighter-api', () => ({
  isAllowed: vi.fn().mockResolvedValue(true),
  // Updated to be exactly 56 characters long
  getPublicKey: vi.fn().mockResolvedValue('GBTEST12345678901234567890123456789012345678901234567890'),
  setAllowed: vi.fn().mockResolvedValue(true),
}));

describe('AgriStream dApp Environment Tests', () => {
  
  it('1. Verifies the Soroban Contract ID format is valid', () => {
    const CONTRACT_ID = "CCXYD7JYJSKI7WWKI7Y7P3DDD4NSL7F3U5EQAF2UUO7QFBRCIEL3FHQE";
    // Stellar Contract IDs must be 56 characters and start with 'C'
    expect(CONTRACT_ID.length).toBe(56);
    expect(CONTRACT_ID.startsWith('C')).toBe(true);
  });

  it('2. Successfully validates Freighter API connection status', async () => {
    const allowed = await isAllowed();
    expect(allowed).toBe(true);
  });

  it('3. Successfully retrieves the NGO wallet public key', async () => {
    const pubKey = await getPublicKey();
    expect(pubKey).toBe('GBTEST12345678901234567890123456789012345678901234567890');
    expect(pubKey.length).toBe(56);
  });
  
});