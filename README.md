# Demand Modulated Markets
SmartWeave contract implementation of demand modulated markets

This codebase is an experimental implementation of a DMM built into a typical SmartWeave token contract. It is UNAUDITED and majorly UNTESTED, so use at your own risk.

## AMMs vs DMMs

| ![AMM](https://cdn.discordapp.com/attachments/745338028758925317/994659125898260481/unnamed.png) | ![DMM](https://cdn.discordapp.com/attachments/745338028758925317/994659125663375401/unnamed_1.png) |
| :---: | :---: |
| Automated Market Makers (AMMs) operate by algorithmically modifying the buy and sell price of an asset based on the supply of its trading pair in a liquidity pool. | Demand Modulated Markets (DMMs) operate by algorithmically modifying the buy price, sell price, and total supply of an asset based on the demand of the market. |

## Implications

- Token liquidity can scale proportionally and infinitely to demand
- Prevents the need for liquidity providers and eliminates risk of “rug pulls” by withdrawing liquidity
- A “risk profile” can be defined by the curve of the DMM
- Trading liquidity distributed to each asset individually instead of being managed by a single smart contract

## Use cases

- Optimal for fungible and nonfungible tokens that would traditionally be considered illiquid and thus have difficulty trading in an open market

## Contributing

Feel free to submit a pull request or open an issue.

