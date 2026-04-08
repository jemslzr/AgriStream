# AgriStream

A Soroban smart contract for instant, transparent disaster relief fund disbursement.

## Problem & Solution
**Problem:** Women-led agricultural SMEs in rural areas face catastrophic delays when typhoons destroy crops, waiting up to 14 days for physical cash relief and often falling victim to predatory lending.
**Solution:** AgriStream allows NGOs to instantly disburse USDC directly to verified farmers' digital wallets via a Soroban smart contract, ensuring zero-delay, transparent payouts without intermediaries.

## Timeline
* Initial Contract Development: 2 Days
* Frontend Integration: 3 Days
* Testnet Deployment & Demo Scripting: 1 Day

## Stellar Features Used
* Soroban Smart Contracts (for transparent, permissioned fund allocation)
* USDC / Custom Assets (for stable value transfer)

## Vision and Purpose
To empower vulnerable communities by removing friction, corruption, and delays in the disaster relief supply chain, enabling immediate economic recovery following climate crises.

## Prerequisites
* Rust: `rustc 1.76.0` (or newer)
* Soroban CLI: `soroban 20.0.0`
* `wasm32-unknown-unknown` target installed

## Building and Testing

**How to build:**
```bash
soroban contract build