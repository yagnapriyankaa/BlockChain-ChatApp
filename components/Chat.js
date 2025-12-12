import Web3 from 'web3';
import React, { Component } from 'react';
import ChatApp from '../abis/ChatApp.json';
import mainLogo from './arrow.png';

class Chat extends Component {
  constructor(props) {
    super(props);
    const chats = [
      { msg: "This is a blockchain demo, try to tap in!", response: true },
      { msg: 'Enter "send_ether: 0.0001" to send some tokens to your recipient 😃', response: false },
    ];
    this.state = {
      fixedChats: chats,
      chats: [],
      inputValue: '',
      accounts: [],
      account: '',
      recipient: '',
      nbBlocks: 0,
      otherAccount: '',
      accountNbTransactions: 0,
      otherAccountNbTransactions: 0,
      accountBalance: 0,
      otherAccountBalance: 0,
      lastGas: 0,
      blockHash: '',
    };
  }

  async componentDidMount() {
    await this.loadWeb3();
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    this.setState({ account: accounts[0], accounts });
    await this.loadBlockchainData();
  }

  async loadWeb3() {
    this.web3Browser = new Web3("http://127.0.0.1:7545");

    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        this.web3Browser = new Web3(window.ethereum);
      } catch (error) {
        console.error("User denied account access");
        window.alert("Please allow MetaMask to connect.");
      }
    } else {
      window.alert('Non-Ethereum browser detected. Please install MetaMask!');
    }
  }

  async loadBlockchainData() {
    const web3 = this.web3Browser;
    const accounts = await web3.eth.getAccounts();
    if (accounts.length < 2) {
      window.alert("Please connect at least two accounts in MetaMask!");
      return;
    }

    const networkId = await web3.eth.net.getId();
    const chatAppData = ChatApp.networks[networkId];

    if (!chatAppData) {
      console.error("❌ ChatApp not deployed on this network.");
      window.alert('Chat contract not deployed to detected network.');
      return;
    }

    const abi = ChatApp.abi;
    const chatContract = new web3.eth.Contract(abi, chatAppData.address);

    this.setState({
      accounts,
      account: accounts[0],
      otherAccount: accounts[1],
      recipient: accounts[1],
      chatContract,
    });

    await this.fetchAllMsg();
    await this.updateUIData();
  }

  handleMessage = async (message) => {
    const trimmedMsg = message.trim();
    console.log("User message received:", trimmedMsg);
    console.log("number of blocks:", this.state.nbBlocks);
  
    // Save the user's message first
    const userMessage = {
      msg: trimmedMsg,
      response: false, // it's from user
      timestamp: new Date().toISOString(),
    };
  
    this.setState((prevState) => ({
      chats: [...prevState.chats, userMessage],
    }));
  
    if (trimmedMsg.startsWith("send_ether:")) {
      const parts = trimmedMsg.split(":");
      const amountStr = parts.length > 1 ? parts[1].trim() : "";
  
      if (!isNaN(amountStr) && amountStr !== "") {
        this.setState({ inputValue: trimmedMsg });
        await this.sendEtherIfAsked();
        this.setState({ inputValue: '' });
        return;
      } else {
        alert("Invalid Ether amount. Use format: send_ether: 0.001");
        return;
      }
    }
  
    if (trimmedMsg.startsWith("ask_ether:")) {
      const parts = trimmedMsg.split(":");
      const amountStr = parts.length > 1 ? parts[1].trim() : "";
  
      if (!isNaN(amountStr) && amountStr !== "") {
        this.setState({ inputValue: trimmedMsg });
        await this.askEtherIfAsked();
        this.setState({ inputValue: '' });
        return;
      } else {
        alert("Invalid Ether amount. Use format: ask_ether: 0.001");
        return;
      }
    }
  
    await this.didSendMessage(trimmedMsg);
    this.setState({ inputValue: '' });
  };
  

  async didSendMessage(message) {
    if (!this.state.otherAccount || !this.web3Browser.utils.isAddress(this.state.otherAccount)) {
      alert('Please select a valid recipient address!');
      return;
    }

    if (this.state.account.toLowerCase() === this.state.otherAccount.toLowerCase()) {
      alert('Sender and recipient addresses cannot be the same!');
      return;
    }

    try {
      const tx = await this.state.chatContract.methods
        .sendMessage(this.state.otherAccount, message)
        .send({ from: this.state.account });

      await this.waitForTransaction(tx.transactionHash);
      await this.fetchAllMsg();
      await this.updateUIData();
    } catch (error) {
      console.error("❌ Message send failed:", error);
    }
  }

  async waitForTransaction(txHash) {
    let receipt = null;
    while (!receipt) {
      receipt = await this.web3Browser.eth.getTransactionReceipt(txHash);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  sendEtherIfAsked = async () => {
    const { inputValue, account, otherAccount } = this.state;
    const parts = inputValue.split(":");
    const amountStr = parts.length > 1 ? parts[1].trim() : "";

    if (!amountStr || isNaN(amountStr)) {
      alert("Invalid Ether amount. Use format: send_ether: 0.001");
      return;
    }

    try {
      const valueInWei = this.web3Browser.utils.toWei(amountStr, 'ether');

      await this.web3Browser.eth.sendTransaction({
        from: account,
        to: otherAccount,
        value: valueInWei,
      });

      console.log(`✅ Sent ${amountStr} ETH from ${account} to ${otherAccount}`);
    } catch (err) {
      console.error("❌ Transaction failed:", err);
      alert("Transaction failed. See console.");
    }
  };

  async askEtherIfAsked() {
    const parts = this.state.inputValue.split(":");
    const cmd = parts[0];
    const amount = parts.length > 1 ? parts[1].trim() : "";

    if (cmd === 'ask_ether' && this.isNumeric(amount)) {
      const asWei = this.web3Browser.utils.toWei(amount, 'ether');
      await this.state.chatContract.methods
        .askEther(this.state.otherAccount, asWei)
        .send({ from: this.state.account });

      await this.updateUIData();
      return true;
    }

    alert("Invalid format. Use: ask_ether: 0.001");
    return false;
  }

  async fetchAllMsg() {
    try {
      const all = await this.state.chatContract.methods
        .getMessages()
        .call({ from: this.state.account });

      const formatted = all.map(msg => ({
        msg: `${msg.sender}: ${msg.content} (${new Date(msg.timestamp * 1000).toLocaleTimeString()})`,
        response: false
      }));

      this.setState({ chats: [...this.state.fixedChats, ...formatted] });
    } catch (error) {
      console.error("❌ Error fetching messages:", error);
    }
  }

  async updateUIData() {
    await this.updateNbTransactions();
    await this.updateBalances();
    await this.updateBlocks();
    await this.updateLastGas();
  }

  async updateNbTransactions() {
    const accountNbTransactions = await this.web3Browser.eth.getTransactionCount(this.state.account, 'latest');
    const otherAccountNbTransactions = await this.web3Browser.eth.getTransactionCount(this.state.otherAccount, 'latest');
    this.setState({ 
      accountNbTransactions: accountNbTransactions.toString(),
      otherAccountNbTransactions: otherAccountNbTransactions.toString()
    });
  }
  

  async updateBalances() {
    const accountBalance = await this.web3Browser.eth.getBalance(this.state.account);
    const otherAccountBalance = await this.web3Browser.eth.getBalance(this.state.otherAccount);
    this.setState({
      accountBalance: this.web3Browser.utils.fromWei(accountBalance, 'ether'),
      otherAccountBalance: this.web3Browser.utils.fromWei(otherAccountBalance, 'ether'),
    });
  }

  async updateBlocks() {
    const latest = await this.web3Browser.eth.getBlockNumber();
    console.log("🔍 Latest block:", latest);
    this.setState({ nbBlocks: latest.toString() });
  }

  async updateLastGas() {
    const lastBlockNumber = await this.web3Browser.eth.getBlockNumber();
    const block = await this.web3Browser.eth.getBlock(lastBlockNumber);
    if (block.transactions && block.transactions.length > 0) {
      const lastTransaction = block.transactions[block.transactions.length - 1];
      const tx = await this.web3Browser.eth.getTransaction(lastTransaction);
      this.setState({ 
        blockHash: tx.blockHash,
        lastGas: tx.gas.toString() 
      });
    }
  }
  
  async updateAddressSelect(newValue, isOtherAccount) {
    this.setState({
      otherAccount: isOtherAccount ? newValue : this.state.otherAccount,
      account: !isOtherAccount ? newValue : this.state.account,
      chats: this.state.fixedChats,
    });
    await this.fetchAllMsg();
    await this.updateUIData();
  }

  isNumeric(str) {
    return !isNaN(str) && !isNaN(parseFloat(str));
  }

  getMessagesAsDivs() {
    return this.state.chats
      .map((x, idx) =>
        x.response ? (
          <div key={idx} className="message text-only">
            <div className="response">
              <p className="text">{x.msg}</p>
            </div>
          </div>
        ) : (
          <div key={idx} className="message text-only">
            <p className="text">{x.msg}</p>
          </div>
        )
      )
      .reverse();
  }

  getToggleAddresses(isOtherAccount) {
    return this.state.accounts.map((account) => (
      <option key={account} value={account}>
        {account}
      </option>
    ));
  }

  render() {
    return (
      <div className="block-container">
        <div className="row">
          <div className="col-7 left-block">
            <section className="chat">
              <div className="header-chat">
                <div className="left">
                  <img src={mainLogo} className="arrow" alt="logo" />
                  <select
                    className="custom-select"
                    value={this.state.account}
                    onChange={(e) => this.updateAddressSelect(e.target.value, false)}
                  >
                    {this.getToggleAddresses(false)}
                  </select>
                </div>
                <div className="right">
                  <select
                    className="custom-select"
                    value={this.state.otherAccount}
                    onChange={(e) => this.updateAddressSelect(e.target.value, true)}
                  >
                    {this.getToggleAddresses(true)}
                  </select>
                </div>
              </div>
              <div className="messages-chat">{this.getMessagesAsDivs()}
              </div>
            </section>
            <div className="footer-chat">
              <input
                value={this.state.inputValue}
                onChange={(e) => this.setState({ inputValue: e.target.value })}
                type="text"
                className="write-message"
                placeholder="Type your message here"
              />
              <button className="btn btn-success send-btn" onClick={() => this.handleMessage(this.state.inputValue)}>
                Send
              </button>
            </div>
          </div>
          <div className="col-5 right-block">
            <h3>Blockchain state</h3>
            <p>Number of blocks: {this.state.nbBlocks} N</p>
            <p>Last transaction gas: {this.state.lastGas}</p>
            <div className="sender-block blockchain-block">
              <p><b>Sender address:</b> {this.state.account}</p>
              <p>Transactions: {this.state.accountNbTransactions}</p>
              <p>Balance: {this.state.accountBalance} ETH</p>
            </div>
            <div className="recip-block blockchain-block">
              <p><b>Recipient address:</b> {this.state.otherAccount}</p>
              <p>Transactions: {this.state.otherAccountNbTransactions}</p>
              <p>Balance: {this.state.otherAccountBalance} ETH</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Chat;
