#![cfg(test)]

mod tests {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Address, Env};
    use soroban_sdk::token::StellarAssetClient;
    use soroban_sdk::token::Client as TokenClient;
    use crate::{ReliefFundContract, ReliefFundContractClient};

    fn setup_test(env: &Env) -> (ReliefFundContractClient, Address, Address, Address, TokenClient) {
        let admin = Address::generate(env);
        let beneficiary = Address::generate(env);
        
        // Setup mock token
        let token_admin = Address::generate(env);
        let token_contract_id = env.register_stellar_asset_contract(token_admin.clone());
        let token_client = TokenClient::new(env, &token_contract_id);
        let token_admin_client = StellarAssetClient::new(env, &token_contract_id);
        
        let contract_id = env.register_contract(None, ReliefFundContract);
        let client = ReliefFundContractClient::new(env, &contract_id);
        
        client.initialize(&admin, &token_contract_id);
        
        // Mint tokens to the contract so it has funds to disburse
        token_admin_client.mint(&contract_id, &1000);
        
        (client, admin, beneficiary, token_contract_id, token_client)
    }

    #[test]
    fn test_1_happy_path() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, admin, beneficiary, _, token_client) = setup_test(&env);

        client.allocate(&admin, &beneficiary, &100);
        assert_eq!(client.get_allocation(&beneficiary), 100);

        client.claim(&beneficiary);
        
        // Verify balance transferred
        assert_eq!(token_client.balance(&beneficiary), 100);
        // Verify allocation reset
        assert_eq!(client.get_allocation(&beneficiary), 0);
    }

    #[test]
    #[should_panic(expected = "No funds allocated for this address")]
    fn test_2_edge_case_unauthorized_claim() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _, beneficiary, _, _) = setup_test(&env);

        // Beneficiary tries to claim without an allocation
        client.claim(&beneficiary);
    }

    #[test]
    fn test_3_state_verification() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, admin, beneficiary, _, _) = setup_test(&env);

        assert_eq!(client.get_allocation(&beneficiary), 0);
        client.allocate(&admin, &beneficiary, &50);
        
        // Assert that contract storage reflects the correct state directly
        assert_eq!(client.get_allocation(&beneficiary), 50);
        
        client.allocate(&admin, &beneficiary, &25);
        // Assert allocations accumulate
        assert_eq!(client.get_allocation(&beneficiary), 75);
    }

    #[test]
    #[should_panic(expected = "Only admin can allocate")]
    fn test_4_edge_case_non_admin_allocation() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _, beneficiary, _, _) = setup_test(&env);
        let fake_admin = Address::generate(&env);

        // Fake admin attempts to allocate funds
        client.allocate(&fake_admin, &beneficiary, &100);
    }

    #[test]
    #[should_panic(expected = "No funds allocated for this address")]
    fn test_5_edge_case_double_claim() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, admin, beneficiary, _, _) = setup_test(&env);

        client.allocate(&admin, &beneficiary, &100);
        client.claim(&beneficiary);
        
        // Second claim should panic because allocation was reset to 0
        client.claim(&beneficiary);
    }
}