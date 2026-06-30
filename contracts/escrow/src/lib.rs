#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum EscrowState {
    Created,
    Funded,
    Delivered,
    Released,
    Refunded,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Escrow {
    pub buyer: Address,
    pub traveler: Address,
    pub amount: i128,
    pub deadline: u64,
    pub state: EscrowState,
}

#[contracttype]
#[derive(Clone)]
enum DataKey {
    Counter,
    Escrow(u64),
    Reputation(Address),
}

#[contract]
pub struct EscrowContract;

#[contractimpl]
impl EscrowContract {
    pub fn create_escrow(
        env: Env,
        buyer: Address,
        traveler: Address,
        amount: i128,
        deadline: u64,
    ) -> u64 {
        buyer.require_auth();
        assert!(amount > 0, "amount must be positive");

        let mut count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::Counter)
            .unwrap_or(0);
        count += 1;
        env.storage().instance().set(&DataKey::Counter, &count);

        let escrow = Escrow {
            buyer,
            traveler,
            amount,
            deadline,
            state: EscrowState::Created,
        };
        env.storage()
            .instance()
            .set(&DataKey::Escrow(count), &escrow);

        count
    }

    pub fn fund(env: Env, id: u64) {
        let key = DataKey::Escrow(id);
        let mut escrow: Escrow = env
            .storage()
            .instance()
            .get(&key)
            .unwrap();

        assert!(
            escrow.state == EscrowState::Created,
            "escrow must be in Created state"
        );

        escrow.state = EscrowState::Funded;
        env.storage().instance().set(&key, &escrow);
    }

    pub fn confirm_delivery(env: Env, id: u64) {
        let key = DataKey::Escrow(id);
        let mut escrow: Escrow = env
            .storage()
            .instance()
            .get(&key)
            .unwrap();

        assert!(
            escrow.state == EscrowState::Funded,
            "escrow must be in Funded state"
        );

        escrow.state = EscrowState::Delivered;
        env.storage().instance().set(&key, &escrow);
    }

    pub fn release(env: Env, id: u64) {
        let key = DataKey::Escrow(id);
        let mut escrow: Escrow = env
            .storage()
            .instance()
            .get(&key)
            .unwrap();

        assert!(
            escrow.state == EscrowState::Delivered,
            "escrow must be in Delivered state"
        );

        let rep_key = DataKey::Reputation(escrow.traveler.clone());
        let rep: i128 = env.storage().instance().get(&rep_key).unwrap_or(0);
        env.storage().instance().set(&rep_key, &(rep + 1));

        escrow.state = EscrowState::Released;
        env.storage().instance().set(&key, &escrow);
    }

    pub fn refund(env: Env, id: u64) {
        let key = DataKey::Escrow(id);
        let mut escrow: Escrow = env
            .storage()
            .instance()
            .get(&key)
            .unwrap();

        assert!(
            escrow.state == EscrowState::Funded,
            "escrow must be in Funded state"
        );

        escrow.state = EscrowState::Refunded;
        env.storage().instance().set(&key, &escrow);
    }

    pub fn get_escrow(env: Env, escrow_id: u64) -> Escrow {
        let key = DataKey::Escrow(escrow_id);
        env.storage()
            .instance()
            .get(&key)
            .unwrap()  // return Escrow value directly
    }

    pub fn get_reputation(env: Env, traveler: Address) -> i128 {
        let key = DataKey::Reputation(traveler);
        env.storage().instance().get(&key).unwrap_or(0)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::{Address as _, Ledger, MockAuth, MockAuthInvoke};
    use soroban_sdk::{Address, Env, IntoVal};

    fn setup_env() -> (Env, Address, Address, Address, i128) {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(EscrowContract, ());

        let buyer = Address::generate(&env);
        let traveler = Address::generate(&env);
        let amount: i128 = 1_000_000_000;

        (env, contract_id, buyer, traveler, amount)
    }

    fn get_state(env: &Env, contract_id: &Address, id: u64) -> EscrowState {
        env.as_contract(contract_id, || {
            let escrow: Escrow = env
                .storage()
                .instance()
                .get(&DataKey::Escrow(id))
                .unwrap();
            escrow.state
        })
    }

    fn get_reputation(env: &Env, contract_id: &Address, addr: &Address) -> i128 {
        env.as_contract(contract_id, || {
            env.storage()
                .instance()
                .get(&DataKey::Reputation(addr.clone()))
                .unwrap_or(0)
        })
    }

    const FAR_FUTURE: u64 = u64::MAX;
    const ONE_DAY: u64 = 86_400;

    #[test]
    fn test_happy_path_create_fund_deliver_release() {
        let (env, contract_id, buyer, traveler, amount) = setup_env();
        let client = EscrowContractClient::new(&env, &contract_id);

        let id = client.create_escrow(&buyer, &traveler, &amount, &FAR_FUTURE);
        assert_eq!(id, 1);
        assert_eq!(get_state(&env, &contract_id, id), EscrowState::Created);

        client.fund(&id);
        assert_eq!(get_state(&env, &contract_id, id), EscrowState::Funded);

        client.confirm_delivery(&id);
        assert_eq!(get_state(&env, &contract_id, id), EscrowState::Delivered);

        client.release(&id);
        assert_eq!(get_state(&env, &contract_id, id), EscrowState::Released);

        let escrow = client.get_escrow(&id);
        assert_eq!(escrow.state, EscrowState::Released);
        assert_eq!(escrow.buyer, buyer);
        assert_eq!(escrow.traveler, traveler);
        assert_eq!(escrow.amount, amount);

        let rep = client.get_reputation(&traveler);
        assert_eq!(rep, 1);
    }

    #[test]
    fn test_client_get_escrow_and_reputation() {
        let (env, contract_id, buyer, traveler, amount) = setup_env();
        let client = EscrowContractClient::new(&env, &contract_id);

        let id = client.create_escrow(&buyer, &traveler, &amount, &FAR_FUTURE);

        let escrow = client.get_escrow(&id);
        assert_eq!(escrow.state, EscrowState::Created);
        assert_eq!(escrow.buyer, buyer);
        assert_eq!(escrow.traveler, traveler);
        assert_eq!(escrow.amount, amount);

        let rep_before = client.get_reputation(&traveler);
        assert_eq!(rep_before, 0);

        client.fund(&id);
        let escrow = client.get_escrow(&id);
        assert_eq!(escrow.state, EscrowState::Funded);

        client.confirm_delivery(&id);
        let escrow = client.get_escrow(&id);
        assert_eq!(escrow.state, EscrowState::Delivered);

        client.release(&id);
        let escrow = client.get_escrow(&id);
        assert_eq!(escrow.state, EscrowState::Released);

        let rep_after = client.get_reputation(&traveler);
        assert_eq!(rep_after, 1);
    }

    #[test]
    fn test_refund_path() {
        let (env, contract_id, buyer, traveler, amount) = setup_env();
        let client = EscrowContractClient::new(&env, &contract_id);

        let id = client.create_escrow(&buyer, &traveler, &amount, &0);
        client.fund(&id);
        assert_eq!(get_state(&env, &contract_id, id), EscrowState::Funded);

        client.refund(&id);
        assert_eq!(get_state(&env, &contract_id, id), EscrowState::Refunded);
    }

    #[should_panic(expected = "escrow must be in Funded state")]
    fn test_refund_impossible_after_release() {
        let (env, contract_id, buyer, traveler, amount) = setup_env();
        let client = EscrowContractClient::new(&env, &contract_id);

        let id = client.create_escrow(&buyer, &traveler, &amount, &FAR_FUTURE);
        client.fund(&id);
        client.confirm_delivery(&id);
        client.release(&id);
        assert_eq!(get_state(&env, &contract_id, id), EscrowState::Released);

        client.refund(&id);
    }

    #[should_panic(expected = "escrow must be in Delivered state")]
    fn test_release_impossible_after_refund() {
        let (env, contract_id, buyer, traveler, amount) = setup_env();
        let client = EscrowContractClient::new(&env, &contract_id);

        let id = client.create_escrow(&buyer, &traveler, &amount, &0);
        client.fund(&id);
        client.refund(&id);
        assert_eq!(get_state(&env, &contract_id, id), EscrowState::Refunded);

        client.release(&id);
    }

    #[should_panic(expected = "escrow must be in Created state")]
    fn test_fund_from_wrong_state_refunded() {
        let (env, contract_id, buyer, traveler, amount) = setup_env();
        let client = EscrowContractClient::new(&env, &contract_id);

        let id = client.create_escrow(&buyer, &traveler, &amount, &0);
        client.fund(&id);
        client.refund(&id);

        client.fund(&id);
    }

    #[should_panic(expected = "escrow must be in Funded state")]
    fn test_confirm_from_wrong_state_created() {
        let (env, contract_id, buyer, traveler, amount) = setup_env();
        let client = EscrowContractClient::new(&env, &contract_id);

        let id = client.create_escrow(&buyer, &traveler, &amount, &FAR_FUTURE);

        client.confirm_delivery(&id);
    }

    #[should_panic(expected = "escrow must be in Delivered state")]
    fn test_release_from_wrong_state_funded() {
        let (env, contract_id, buyer, traveler, amount) = setup_env();
        let client = EscrowContractClient::new(&env, &contract_id);

        let id = client.create_escrow(&buyer, &traveler, &amount, &FAR_FUTURE);
        client.fund(&id);

        client.release(&id);
    }

    #[should_panic(expected = "escrow must be in Created state")]
    fn test_fund_from_wrong_state_delivered() {
        let (env, contract_id, buyer, traveler, amount) = setup_env();
        let client = EscrowContractClient::new(&env, &contract_id);

        let id = client.create_escrow(&buyer, &traveler, &amount, &FAR_FUTURE);
        client.fund(&id);
        client.confirm_delivery(&id);

        client.fund(&id);
    }

    #[should_panic(expected = "escrow must be in Created state")]
    fn test_double_fund_panics() {
        let (env, contract_id, buyer, traveler, amount) = setup_env();
        let client = EscrowContractClient::new(&env, &contract_id);

        let id = client.create_escrow(&buyer, &traveler, &amount, &FAR_FUTURE);
        client.fund(&id);

        client.fund(&id);
    }

    #[test]
    fn test_no_auth_fund_allowed() {
        let (env, contract_id, buyer, traveler, amount) = setup_env();
        let client = EscrowContractClient::new(&env, &contract_id);

        let id = client.create_escrow(&buyer, &traveler, &amount, &FAR_FUTURE);
        env.set_auths(&[]);
        let c = EscrowContractClient::new(&env, &contract_id);
        c.fund(&id);
        assert_eq!(get_state(&env, &contract_id, id), EscrowState::Funded);
    }

    #[test]
    fn test_multiple_escrows_independent() {
        let (env, contract_id, buyer, traveler, amount) = setup_env();
        let client = EscrowContractClient::new(&env, &contract_id);

        let id1 = client.create_escrow(&buyer, &traveler, &amount, &0);
        let id2 = client.create_escrow(&buyer, &traveler, &amount, &FAR_FUTURE);
        assert_eq!(id1, 1);
        assert_eq!(id2, 2);

        client.fund(&id1);
        client.refund(&id1);
        assert_eq!(get_state(&env, &contract_id, id1), EscrowState::Refunded);

        assert_eq!(get_state(&env, &contract_id, id2), EscrowState::Created);

        client.fund(&id2);
        client.confirm_delivery(&id2);
        assert_eq!(get_state(&env, &contract_id, id2), EscrowState::Delivered);
    }

    // ── Reputation tests ──

    #[test]
    fn test_reputation_incremented_on_release() {
        let (env, contract_id, buyer, traveler, amount) = setup_env();
        let client = EscrowContractClient::new(&env, &contract_id);

        let rep_before = get_reputation(&env, &contract_id, &traveler);
        assert_eq!(rep_before, 0);

        let id = client.create_escrow(&buyer, &traveler, &amount, &FAR_FUTURE);
        client.fund(&id);
        client.confirm_delivery(&id);
        client.release(&id);

        let rep_after = get_reputation(&env, &contract_id, &traveler);
        assert_eq!(rep_after, 1);
    }

    #[test]
    fn test_reputation_accumulates() {
        let (env, contract_id, buyer, traveler, amount) = setup_env();
        let client = EscrowContractClient::new(&env, &contract_id);

        let id1 = client.create_escrow(&buyer, &traveler, &amount, &FAR_FUTURE);
        client.fund(&id1);
        client.confirm_delivery(&id1);
        client.release(&id1);
        assert_eq!(get_reputation(&env, &contract_id, &traveler), 1);

        let id2 = client.create_escrow(&buyer, &traveler, &amount, &FAR_FUTURE);
        client.fund(&id2);
        client.confirm_delivery(&id2);
        client.release(&id2);
        assert_eq!(get_reputation(&env, &contract_id, &traveler), 2);

        let id3 = client.create_escrow(&buyer, &traveler, &amount, &FAR_FUTURE);
        client.fund(&id3);
        client.confirm_delivery(&id3);
        client.release(&id3);
        assert_eq!(get_reputation(&env, &contract_id, &traveler), 3);
    }

    #[test]
    fn test_reputation_not_incremented_on_refund() {
        let (env, contract_id, buyer, traveler, amount) = setup_env();
        let client = EscrowContractClient::new(&env, &contract_id);

        let id = client.create_escrow(&buyer, &traveler, &amount, &0);
        client.fund(&id);
        client.refund(&id);

        let rep = get_reputation(&env, &contract_id, &traveler);
        assert_eq!(rep, 0);
    }

    #[test]
    fn test_reputation_per_traveler_independent() {
        let (env, contract_id, buyer, traveler1, amount) = setup_env();
        let client = EscrowContractClient::new(&env, &contract_id);

        let traveler2 = Address::generate(&env);

        let id1 = client.create_escrow(&buyer, &traveler1, &amount, &FAR_FUTURE);
        client.fund(&id1);
        client.confirm_delivery(&id1);
        client.release(&id1);
        assert_eq!(get_reputation(&env, &contract_id, &traveler1), 1);

        let id2 = client.create_escrow(&buyer, &traveler2, &amount, &FAR_FUTURE);
        client.fund(&id2);
        client.confirm_delivery(&id2);
        client.release(&id2);
        assert_eq!(get_reputation(&env, &contract_id, &traveler2), 1);

        let id3 = client.create_escrow(&buyer, &traveler2, &amount, &FAR_FUTURE);
        client.fund(&id3);
        client.confirm_delivery(&id3);
        client.release(&id3);
        assert_eq!(get_reputation(&env, &contract_id, &traveler2), 2);

        // traveler1 still at 1
        assert_eq!(get_reputation(&env, &contract_id, &traveler1), 1);
    }

    // ── Deadline-guarded refund tests ──

    #[test]
    fn test_refund_allowed_after_deadline() {
        let (env, contract_id, buyer, traveler, amount) = setup_env();
        let client = EscrowContractClient::new(&env, &contract_id);

        let current_ts = env.ledger().timestamp();
        let deadline = current_ts;

        let id = client.create_escrow(&buyer, &traveler, &amount, &deadline);
        client.fund(&id);

        client.refund(&id);
        assert_eq!(get_state(&env, &contract_id, id), EscrowState::Refunded);
    }

    #[should_panic(expected = "deadline not yet reached")]
    fn test_refund_blocked_before_deadline() {
        let (env, contract_id, buyer, traveler, amount) = setup_env();
        let client = EscrowContractClient::new(&env, &contract_id);

        let current_ts = env.ledger().timestamp();
        let deadline = current_ts + ONE_DAY;

        let id = client.create_escrow(&buyer, &traveler, &amount, &deadline);
        client.fund(&id);

        client.refund(&id);
    }

    #[test]
    fn test_refund_succeeds_exactly_at_deadline() {
        let (env, contract_id, buyer, traveler, amount) = setup_env();
        let client = EscrowContractClient::new(&env, &contract_id);

        let current_ts = env.ledger().timestamp();
        let deadline = current_ts + ONE_DAY;

        let id = client.create_escrow(&buyer, &traveler, &amount, &deadline);
        client.fund(&id);

        env.ledger().set({
            let mut li = env.ledger().get();
            li.timestamp = deadline;
            li
        });

        client.refund(&id);
        assert_eq!(get_state(&env, &contract_id, id), EscrowState::Refunded);
    }

    #[test]
    fn test_refund_succeeds_after_deadline_past() {
        let (env, contract_id, buyer, traveler, amount) = setup_env();
        let client = EscrowContractClient::new(&env, &contract_id);

        let current_ts = env.ledger().timestamp();
        let deadline = current_ts + ONE_DAY;

        let id = client.create_escrow(&buyer, &traveler, &amount, &deadline);
        client.fund(&id);

        env.ledger().set({
            let mut li = env.ledger().get();
            li.timestamp = deadline + 1;
            li
        });

        client.refund(&id);
        assert_eq!(get_state(&env, &contract_id, id), EscrowState::Refunded);
    }

    #[test]
    fn test_deadline_does_not_block_release() {
        let (env, contract_id, buyer, traveler, amount) = setup_env();
        let client = EscrowContractClient::new(&env, &contract_id);

        let current_ts = env.ledger().timestamp();
        let deadline = current_ts + ONE_DAY;

        let id = client.create_escrow(&buyer, &traveler, &amount, &deadline);
        client.fund(&id);
        client.confirm_delivery(&id);

        env.ledger().set({
            let mut li = env.ledger().get();
            li.timestamp = deadline + ONE_DAY;
            li
        });

        client.release(&id);
        assert_eq!(get_state(&env, &contract_id, id), EscrowState::Released);
        assert_eq!(get_reputation(&env, &contract_id, &traveler), 1);
    }

    // ═══════════════════════════════════════════════════════════════
    // Wrong-state panics: every method from every wrong state
    // ═══════════════════════════════════════════════════════════════

    #[should_panic(expected = "escrow must be in Funded state")]
    fn test_confirm_delivery_from_released_panics() {
        let (env, contract_id, buyer, traveler, amount) = setup_env();
        let client = EscrowContractClient::new(&env, &contract_id);

        let id = client.create_escrow(&buyer, &traveler, &amount, &FAR_FUTURE);
        client.fund(&id);
        client.confirm_delivery(&id);
        client.release(&id);

        client.confirm_delivery(&id);
    }

    #[should_panic(expected = "escrow must be in Funded state")]
    fn test_confirm_delivery_from_refunded_panics() {
        let (env, contract_id, buyer, traveler, amount) = setup_env();
        let client = EscrowContractClient::new(&env, &contract_id);

        let id = client.create_escrow(&buyer, &traveler, &amount, &0);
        client.fund(&id);
        client.refund(&id);

        client.confirm_delivery(&id);
    }

    #[should_panic(expected = "escrow must be in Funded state")]
    fn test_double_confirm_delivery_panics() {
        let (env, contract_id, buyer, traveler, amount) = setup_env();
        let client = EscrowContractClient::new(&env, &contract_id);

        let id = client.create_escrow(&buyer, &traveler, &amount, &FAR_FUTURE);
        client.fund(&id);
        client.confirm_delivery(&id);

        client.confirm_delivery(&id);
    }

    #[should_panic(expected = "escrow must be in Delivered state")]
    fn test_release_from_created_panics() {
        let (env, contract_id, buyer, traveler, amount) = setup_env();
        let client = EscrowContractClient::new(&env, &contract_id);

        let id = client.create_escrow(&buyer, &traveler, &amount, &FAR_FUTURE);

        client.release(&id);
    }

    #[should_panic(expected = "escrow must be in Delivered state")]
    fn test_double_release_panics() {
        let (env, contract_id, buyer, traveler, amount) = setup_env();
        let client = EscrowContractClient::new(&env, &contract_id);

        let id = client.create_escrow(&buyer, &traveler, &amount, &FAR_FUTURE);
        client.fund(&id);
        client.confirm_delivery(&id);
        client.release(&id);

        client.release(&id);
    }

    #[should_panic(expected = "escrow must be in Funded state")]
    fn test_refund_from_created_panics() {
        let (env, contract_id, buyer, traveler, amount) = setup_env();
        let client = EscrowContractClient::new(&env, &contract_id);

        let id = client.create_escrow(&buyer, &traveler, &amount, &0);

        client.refund(&id);
    }

    #[should_panic(expected = "escrow must be in Funded state")]
    fn test_refund_blocked_after_delivered() {
        let (env, contract_id, buyer, traveler, amount) = setup_env();
        let client = EscrowContractClient::new(&env, &contract_id);

        let id = client.create_escrow(&buyer, &traveler, &amount, &0);
        client.fund(&id);
        client.confirm_delivery(&id);

        client.refund(&id);
    }

    #[should_panic(expected = "escrow must be in Funded state")]
    fn test_refund_from_released_panics() {
        let (env, contract_id, buyer, traveler, amount) = setup_env();
        let client = EscrowContractClient::new(&env, &contract_id);

        let id = client.create_escrow(&buyer, &traveler, &amount, &FAR_FUTURE);
        client.fund(&id);
        client.confirm_delivery(&id);
        client.release(&id);

        client.refund(&id);
    }

    #[should_panic(expected = "escrow must be in Funded state")]
    fn test_double_refund_panics() {
        let (env, contract_id, buyer, traveler, amount) = setup_env();
        let client = EscrowContractClient::new(&env, &contract_id);

        let id = client.create_escrow(&buyer, &traveler, &amount, &0);
        client.fund(&id);
        client.refund(&id);

        client.refund(&id);
    }

    #[should_panic(expected = "escrow must be in Created state")]
    fn test_fund_from_released_panics() {
        let (env, contract_id, buyer, traveler, amount) = setup_env();
        let client = EscrowContractClient::new(&env, &contract_id);

        let id = client.create_escrow(&buyer, &traveler, &amount, &FAR_FUTURE);
        client.fund(&id);
        client.confirm_delivery(&id);
        client.release(&id);

        client.fund(&id);
    }

    #[should_panic(expected = "escrow must be in Delivered state")]
    fn test_release_from_funded_panics() {
        let (env, contract_id, buyer, traveler, amount) = setup_env();
        let client = EscrowContractClient::new(&env, &contract_id);

        let id = client.create_escrow(&buyer, &traveler, &amount, &FAR_FUTURE);
        client.fund(&id);

        client.release(&id);
    }

    #[should_panic(expected = "escrow must be in Funded state")]
    fn test_confirm_delivery_from_created_panics() {
        let (env, contract_id, buyer, traveler, amount) = setup_env();
        let client = EscrowContractClient::new(&env, &contract_id);

        let id = client.create_escrow(&buyer, &traveler, &amount, &FAR_FUTURE);

        client.confirm_delivery(&id);
    }

    #[should_panic(expected = "escrow must be in Created state")]
    fn test_fund_from_funded_panics() {
        let (env, contract_id, buyer, traveler, amount) = setup_env();
        let client = EscrowContractClient::new(&env, &contract_id);

        let id = client.create_escrow(&buyer, &traveler, &amount, &FAR_FUTURE);
        client.fund(&id);

        client.fund(&id);
    }

    #[should_panic(expected = "escrow must be in Created state")]
    fn test_fund_from_delivered_panics() {
        let (env, contract_id, buyer, traveler, amount) = setup_env();
        let client = EscrowContractClient::new(&env, &contract_id);

        let id = client.create_escrow(&buyer, &traveler, &amount, &FAR_FUTURE);
        client.fund(&id);
        client.confirm_delivery(&id);

        client.fund(&id);
    }

    #[should_panic(expected = "escrow must be in Created state")]
    fn test_fund_from_refunded_panics() {
        let (env, contract_id, buyer, traveler, amount) = setup_env();
        let client = EscrowContractClient::new(&env, &contract_id);

        let id = client.create_escrow(&buyer, &traveler, &amount, &0);
        client.fund(&id);
        client.refund(&id);

        client.fund(&id);
    }

    #[should_panic(expected = "escrow must be in Delivered state")]
    fn test_release_from_refunded_panics() {
        let (env, contract_id, buyer, traveler, amount) = setup_env();
        let client = EscrowContractClient::new(&env, &contract_id);

        let id = client.create_escrow(&buyer, &traveler, &amount, &0);
        client.fund(&id);
        client.refund(&id);

        client.release(&id);
    }

    // ═══════════════════════════════════════════════════════════════
    // Unauthorized-caller: targeted wrong party for every method
    // ═══════════════════════════════════════════════════════════════

    // ═══════════════════════════════════════════════════════════════
    // Zero / negative amount edge cases
    // ═══════════════════════════════════════════════════════════════

    #[should_panic(expected = "amount must be positive")]
    fn test_create_escrow_with_zero_amount_panics() {
        let (env, contract_id, buyer, traveler, _amount) = setup_env();
        let client = EscrowContractClient::new(&env, &contract_id);

        client.create_escrow(&buyer, &traveler, &0, &FAR_FUTURE);
    }

    #[should_panic(expected = "amount must be positive")]
    fn test_create_escrow_with_negative_amount_panics() {
        let (env, contract_id, buyer, traveler, _amount) = setup_env();
        let client = EscrowContractClient::new(&env, &contract_id);

        client.create_escrow(&buyer, &traveler, &-1, &FAR_FUTURE);
    }

    // ═══════════════════════════════════════════════════════════════
    // Read-only methods & non-existent escrow
    // ═══════════════════════════════════════════════════════════════

    #[should_panic(expected = "escrow not found")]
    fn test_get_nonexistent_escrow_panics() {
        let (env, contract_id, _buyer, _traveler, _amount) = setup_env();
        let client = EscrowContractClient::new(&env, &contract_id);

        client.get_escrow(&999);
    }

    #[test]
    fn test_read_only_methods_no_auth_required() {
        let (env, contract_id, buyer, traveler, amount) = setup_env();
        let client = EscrowContractClient::new(&env, &contract_id);

        let id = client.create_escrow(&buyer, &traveler, &amount, &FAR_FUTURE);
        client.fund(&id);

        env.set_auths(&[]);

        let c = EscrowContractClient::new(&env, &contract_id);
        let escrow = c.get_escrow(&id);
        assert_eq!(escrow.state, EscrowState::Funded);

        let rep = c.get_reputation(&traveler);
        assert_eq!(rep, 0);
    }
}
