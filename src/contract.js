// This UNAUDITED contract enables users to buy and sell tokens into a pool 

export function handle(state, action) {
  const calledFunction = action.input.function;
  const caller = action.caller;
  let balances = state.balances;
  if (calledFunction === "buy") {
    // Mint tokens to curve //
    
    let transferTx, contractID, contractInput;
    // grab the contract id of the token they are transferring in the supplied tx
    try {
      transferTx = await SmartWeave.unsafeClient.transactions.get(action.input.tx);
    } catch (err) {
      throw new ContractError(err);
    }

    transferTx.get("tags").forEach((tag) => {
      if (tag.get("name", { decode: true, string: true }) === "Contract") {
        contractID = tag.get("value", { decode: true, string: true });
      }
      if (tag.get("name", { decode: true, string: true }) === "Input") {
        contractInput = JSON.parse(
          tag.get("value", { decode: true, string: true })
        );
      }
    });
    
    ContractAssert(
      typeof contractID === "string",
      "Invalid contract ID in transfer: not a string"
    );
    ContractAssert(
      contractID !== "",
      "No contract ID found in the transfer transaction"
    );
    ContractAssert(
      !state.transfers.includes(transferTx),
      "This transfer has already been used for an order"
    );
    ContractAssert(isAddress(contractID), "Invalid contract ID format");  
    ContractAssert(contractID === state.pair, "Contract ID not paired");

    // Test transferTx for valid contract interaction
    await ensureValidTransfer(contractID, transferTx, caller);
    state.transfers.push(transferTx);

    let amount = contractInput.qty;
    while (amount !== 0) {
      let supply = getCurrentSupply(state);
      let priceToMint = calcPrice(supply);

      if (amount >= priceToMint) {
        balances[caller]++;
        amount -= priceToMint;
      } else if (amount < priceToMint) {
        // Add to foreignCalls to return rest of amount
        state.foreignCalls.push({
          txID: SmartWeave.transaction.id,
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


// Utilities created by Marton Lederer

const isAddress = (addr) => /[a-z0-9_-]{43}/i.test(addr);

const ensureValidTransfer = async (tokenID, transferTx, caller) => {
  // Test tokenTx for valid contract interaction
  await ensureValidInteraction(tokenID, transferTx);

  try {
    const tx = await SmartWeave.unsafeClient.transactions.get(transferTx);

    tx.get("tags").forEach((tag) => {
      if (tag.get("name", { decode: true, string: true }) === "Input") {
        const input = JSON.parse(tag.get("value", { decode: true, string: true }));

        // check if the interaction is a transfer
        ContractAssert(
          input.function === "transfer",
          "The interaction is not a transfer"
        );

        // make sure that the target of the transfer transaction is THIS (the clob) contract
        ContractAssert(
          input.target === SmartWeave.contract.id,
          "The target of this transfer is not this contract"
        );

        // validate the transfer qty
        ContractAssert(input.qty && input.qty > 0, "Invalid transfer quantity");
      }
    });

    // validate the transfer owner
    const transferOwner = tx.get("owner");
    const transferOwnerAddress =
      await SmartWeave.unsafeClient.wallets.ownerToAddress(transferOwner);

    ContractAssert(
      transferOwnerAddress === caller,
      "Transfer owner is not the tx creator"
    );
  } catch (err) {
    throw new ContractError(err);
  }
};


const ensureValidInteraction = async (contractID, interactionID) => {
  const { validity: contractTxValidities } = await SmartWeave.contracts.readContractState(contractID, undefined, true);
    
  // The interaction tx of the token somewhy does not exist
  ContractAssert(
    interactionID in contractTxValidities,
    "The interaction is not associated with this contract"
  );
  
  // Invalid transfer
  ContractAssert(
    contractTxValidities[interactionID],
    "The interaction was invalid"
  );
};
