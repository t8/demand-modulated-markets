// This UNAUDITED contract enables users to buy and sell tokens into a pool 

export function handle(state, action) {
  const calledFunction = action.input.function;
  const caller = action.caller;
  let balances = state.balances;
  if (calledFunction === "buy") {
    // Mint tokens to curve //
    
    // TODO: Validate amount of transfer
    let amount = 100;

    while (amount !== 0) {
      let supply = getCurrentSupply(state);
      let priceToMint = calcPrice(supply);

      if (amount >= priceToMint) {
        balances[caller]++;
        amount -= priceToMint;
      } else if (amount < priceToMint) {
        // Add to foreignCalls to return rest of amount
        state.foreignCalls.push({
          tdID: SmartWeave.transaction.id,
          contract: state.pair,
          input: {
            function: "transfer",
            target: caller,
            qty: amount
          }
        });
      }
    }
   
    state.balances = balances;
    return { state };

  } else if (calledFunction === "sell") {
    // Burn tokens and return funds //

    let amount = action.input.qty;
    let returns = 0;
    while (amount !== 0) {
      let supply = getCurrentSupply(state);
      let burnPrice = calcPrice(supply);

      if (amount >= burnPrice && amount - burnPrice >= 0) {
        balances[caller]--;
        amount -= burnPrice;
        returns += burnPrice;
      }
    }

    // Add to foreignCalls to give tokens back to user
    state.foreignCalls.push({
      txID: SmartWeave.transaction.id,
      contract: state.pair,
      input: {
        function: "transfer",
        target: caller,
        qty: returns
      }
    });    

    state.balances = balances;
    return { state };

  } else if (calledFunction === "transfer") {
    // Transfer tokens to another wallet //
    
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

    state.balances = balances;
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