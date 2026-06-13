#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};
use soroban_sdk::token::Client as TokenClient;

#[contracttype]
pub enum DataKey {
    Admin,
    Token,
    Allocation(Address), // Maps a user's address to their allocated relief amount
}

#[contract]
pub struct ReliefFundContract;

#[contractimpl]
impl ReliefFundContract {
    /// Initializes the contract with the NGO admin address and the USDC token address.
    pub fn initialize(env: Env, admin: Address, token: Address) {
        assert!(!env.storage().instance().has(&DataKey::Admin), "Already initialized");
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Token, &token);
    }

    /// Admin allocates a specific amount of relief funds to a beneficiary's address.
    pub fn allocate(env: Env, admin: Address, beneficiary: Address, amount: i128) {
        admin.require_auth();
        let stored_admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        assert!(admin == stored_admin, "Only admin can allocate");
        assert!(amount > 0, "Amount must be positive");

        let current_allocation = env
            .storage()
            .persistent()
            .get::<_, i128>(&DataKey::Allocation(beneficiary.clone()))
            .unwrap_or(0);
            
        env.storage()
            .persistent()
            .set(&DataKey::Allocation(beneficiary), &(current_allocation + amount));
    }

    /// Beneficiary claims their allocated funds, transferring tokens from the contract to them.
    pub fn claim(env: Env, beneficiary: Address) {
        beneficiary.require_auth();
        
        let allocation_key = DataKey::Allocation(beneficiary.clone());
        let amount: i128 = env.storage().persistent().get(&allocation_key).unwrap_or(0);
        assert!(amount > 0, "No funds allocated for this address");

        // Reset allocation to prevent double-spending before transferring
        // Reset allocation to prevent double-spending before transferring
        env.storage().persistent().set(&allocation_key, &0i128);

        let token_id: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = TokenClient::new(&env, &token_id);
        
        // Transfer funds from contract to beneficiary
        token_client.transfer(&env.current_contract_address(), &beneficiary, &amount);
    }
    
    /// Helper to check a beneficiary's current allocation.
    pub fn get_allocation(env: Env, beneficiary: Address) -> i128 {
        env.storage().persistent().get(&DataKey::Allocation(beneficiary)).unwrap_or(0)
    }
}
#[cfg(test)]
mod test; 