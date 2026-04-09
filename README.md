# 🌾 AgriStream
**Instant Disaster Relief for Agricultural SMEs**

AgriStream is a decentralized finance (DeFi) solution built on **Stellar Soroban**. It enables NGOs to allocate relief funds (USDC) to farmers instantly following a disaster, bypassing traditional banking delays and ensuring funds are securely held in escrow until claimed.

---

## 🚀 Live on Stellar Testnet
* **Contract ID:** `CCXYD7JYJSKI7WWKI7Y7P3DDD4NSL7F3U5EQAF2UUO7QFBRCIEL3FHQE`
* **Network:** Stellar Testnet
* **Wasm Hash:** `4feaab8ac5d7997ce508201004f6b1133d2897f5b9e40d7581ff6db82c5e36fd`
* **Explorer:** [View on Stellar.Expert](https://stellar.expert/explorer/testnet/contract/CCXYD7JYJSKI7WWKI7Y7P3DDD4NSL7F3U5EQAF2UUO7QFBRCIEL3FHQE)

---

## ✨ Features
* **On-Chain Escrow:** Funds are locked in a smart contract, guaranteeing availability for farmers.
* **Admin Authorization:** Only verified NGO administrators can authorize disbursements to prevent fraud.
* **Transparency:** Every allocation is verifiable on the Stellar blockchain explorer in real-time.
* **Freighter Integration:** Seamless and secure wallet connection for NGO portals.
* **Instant Disbursement:** Removes the 3–5 day waiting period typical of traditional wire transfers.

---

## 🛠️ How It Works
AgriStream operates on a **Commit-and-Claim** architecture:
1.  **Allocation:** An NGO Admin calls the `allocate` function, moving USDC into the contract's escrow and tagging it for a specific farmer's wallet.
2.  **Verification:** The blockchain records the state, which is publicly viewable via `get_allocation`.
3.  **Claiming:** The farmer interacts with the contract to pull the funds directly into their personal wallet.

---

## 📜 Smart Contract Functions
| Function | Parameters | Description |
| :--- | :--- | :--- |
| `allocate` | `admin`, `beneficiary`, `amount` | Locks funds in the contract for a specific beneficiary. |
| `claim` | `beneficiary` | Transfers the allocated amount from the contract to the farmer's wallet. |
| `get_allocation` | `beneficiary` | Returns the current amount of USDC waiting in escrow for a user. |

---

## 💻 Setup & Installation

### Prerequisites
* **Rust & WASM:** `rustc 1.70+` with `wasm32-unknown-unknown` target.
* **Stellar CLI:** For contract deployment and interaction.
* **Node.js & NPM:** For the React/Vite frontend.
* **Freighter Wallet:** Browser extension set to **Testnet**.

### Frontend Setup
1.  Clone the repository:
    ```bash
    git clone [https://github.com/](https://github.com/)[your-username]/agristream.git
    cd agristream
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run the development server:
    ```bash
    npm run dev
    ```

### Contract Deployment (Development Reference)
To re-deploy or update the contract logic:
```powershell
# Build and Optimize
stellar contract build
stellar contract optimize --wasm target/wasm32-unknown-unknown/release/agri_stream.wasm

# Deploy
stellar contract deploy --wasm target/wasm32-unknown-unknown/release/agri_stream.optimized.wasm --source admin_wallet --network testnet