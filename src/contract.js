// This UNAUDITED contract enables users to buy and sell tokens into a pool 

export function handle(state, action) {
  const calledFunction = action.input.function;
  let balances = state.balances;
  if (calledFunction === "buy") {
    // Mint tokens to curve
    
    // TODO: Validate amount of transfer
    let amount = 100;
    while (amount !== 0) {
      let supply = getCurrentSupply(state);
      let priceToMint = calcPrice(supply);

      if (amount >= priceToMint) {
        balances[caller]++;
        amount -= priceToMint;
      } else if (amount < priceToMint) {
        // TODO: Add to foreignCalls to return rest of amount
      }
    }
  } else if (calledFunction === "sell") {
    // Burn tokens and return funds

    

  } else if (calledFunction === "transfer") {
    // Transfer tokens to another wallet
    const target = input.target
    const qty = input.qty

    if (!Number.isInteger(qty)) {
      throw new ContractError('Invalid value for "qty". Must be an integer');
    }

    if (!target) {
      throw new ContractError('No target specified');
    }

    if (qty <= 0 || caller === target) {
      throw new ContractError('Invalid token transfer');
    }

    if (balances[caller] < qty) {
      throw new ContractError(`Caller balance not high enough to send ${qty} token(s)!`);
    }

    // Lower the token balance of the caller
    balances[caller] -= qty;
    if (target in balances) {
      // Wallet already exists in state, add new tokens
      balances[target] += qty;
    } else {
      // Wallet is new, set starting balance
      balances[target] = qty;
    }

    return { state };
  }
}

function getCurrentSupply(state) {
  return Object.values(state.balances).reduce((a, b) => a + b);
}

function calcPrice(supply) {
  // y=x
  return supply;
}