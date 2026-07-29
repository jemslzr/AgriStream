#![cfg(test)]

mod tests {
    use crate::{ReliefFundContract, ReliefFundContractClient};
    use soroban_sdk::token::Client as TokenClient;
    use soroban_sdk::token::StellarAssetClient;
    use soroban_sdk::{testutils::Address as _, Address, Env};

    fn setup_test(
        env: &Env,
    ) -> (
        ReliefFundContractClient<'_>,
        Address,
        Address,
        Address,
        TokenClient<'_>,
    ) {
        let admin = Address::generate(env);
        let donor = Address::generate(env);
        let beneficiary = Address::generate(env);

        // Setup mock token
        let token_admin = Address::generate(env);
        let token_contract_id = env
            .register_stellar_asset_contract_v2(token_admin.clone())
            .address();
        let token_client = TokenClient::new(env, &token_contract_id);
        let token_admin_client = StellarAssetClient::new(env, &token_contract_id);

        let contract_id = env.register(ReliefFundContract, ());
        let client = ReliefFundContractClient::new(env, &contract_id);

        client.initialize(&admin, &token_contract_id);

        // Mint tokens to the donor so they have funds to disburse
        token_admin_client.mint(&donor, &1000);

        (client, donor, beneficiary, contract_id, token_client)
    }

    #[test]
    fn test_1_happy_path_allocation() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, donor, beneficiary, contract_id, token_client) = setup_test(&env);

        // Donor allocates funds to beneficiary
        client.allocate(&donor, &beneficiary, &100);

        // Verify donor balance decreased
        assert_eq!(token_client.balance(&donor), 900);

        // Verify contract received the funds
        assert_eq!(token_client.balance(&contract_id), 100);
    }

    #[test]
    #[should_panic(expected = "Amount must be positive")]
    fn test_2_edge_case_zero_allocation() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, donor, beneficiary, _, _) = setup_test(&env);

        // Attempt to allocate 0 funds, expecting a panic
        client.allocate(&donor, &beneficiary, &0);
    }
}
