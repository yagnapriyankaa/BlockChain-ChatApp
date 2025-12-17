# Secure Exchange – Blockchain Based Chat App

A **simple blockchain-based chat application** that helps users send **secure messages** using Ethereum smart contracts.

## What is this project?

Normally, chat apps store messages on central servers (like WhatsApp servers). If the server is hacked, messages can be leaked or changed.

In this project:

* Messages are **encrypted**
* Messages are **stored on blockchain**
* No central authority controls the data

This makes communication **more secure and tamper-proof**.

---

## Key Features

* Secure message sending between users
* Messages stored safely on blockchain
* Wallet-based login using MetaMask
* Messages cannot be altered once stored
* Ether can be transferred between users

---

## How it Works (Simple Flow)

1. User connects MetaMask wallet
2. Message is encrypted
3. Smart contract verifies sender & receiver
4. Encrypted message is stored on blockchain
5. Receiver fetches and reads the message

---

## Technologies Used

* **Ethereum Blockchain**
* **Solidity** (Smart Contracts)
* **React.js** (Frontend)
* **Web3.js**
* **MetaMask**
* **Ganache**

---

## Requirements

### Software

* Node.js
* MetaMask browser extension
* Ganache

### Hardware

* 4 GB RAM or more
* Any modern laptop/PC

---

## How to Run

```bash
git clone <repo-link>
cd project-folder
npm install
truffle migrate --reset
npm start
```

Make sure MetaMask is connected to Ganache.

---

## Why Blockchain?

* No central server
* Messages are permanent and secure
* Better trust between users
