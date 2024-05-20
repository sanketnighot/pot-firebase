# Random Number Generator [EVM]

## Problem Statement

We have a smart contract written in solidity. There is a function in the smart contract as the `getRandomNumber()`. When the user calls the function, it emits an event called `GENERATE_RANDOM_NUMBER(address user_address)`.
This smart contract also has another function called `updateRandomNumber(address user_address, uint256 random_number)`
The `user_address` and `random_number` are stored in a mapping later.

Develop an application where whenever the `GENERATE_RANDOM_NUMBER` event gets emitted application will need to listen to it then, generate a `random_number`, and call the `updateRandomNumber()` function of the smart contract.

### Requirements

1. For listening to events and calling smart contracts `ethers` npm package is used.
2. The application needs to respond to the smart contract within seconds of the event getting emitted. So, to handle multiple events at a single point **asynchronous function with queue implementation** is used.
3. To avoid delay we have private keys of multiple accounts to make more contract calls whenever needed.
4. A queue is maintained to store and execute the events according to requirements.

## Authors

- [@sanketnighot](https://www.github.com/sanketnighot)

## Badges

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Node](https://img.shields.io/badge/node-14.17.0-green.svg)](https://nodejs.org/en/)
[![Ethers.JS](https://img.shields.io/badge/ethersjs-5.4.0-green.svg)](https://docs.ethers.io/v5/)
[![EVM](https://img.shields.io/badge/EVM-2.0.0-green.svg)](https://ethereum.org/en/developers/docs/evm/)

## Setup

1. Clone [this](https://github.com/sanketnighot/random-number-script.git) repository

   ```bash
   git clone https://github.com/sanketnighot/random-number-script.git
   ```

2. Install requirements

   ```bash
   npm install
   ```

3. Create a `.env` file and add the following **API Key** and **Private Keys**.

   ```bash
   ALCHEMY_KEY=xxxx
   PRIVATE_KEY_1=xxxx
   PRIVATE_KEY_2=xxxx
   PRIVATE_KEY_3=xxxx
   ```

4. [Example Smart Contract](./MainServer/contracts/RandomNumberGen.sol) that was created for reference
5. All logs will be stored in `combined.log` and `error.log`.
6. Now run script

   ```bash
   npm start
   ```

## Note

You need to run Hardhat Local Node to test this locally.
To use it in produciton you need to change

- RPC URL
- API Key
- Update Contract Address
- Update Private keys

---
