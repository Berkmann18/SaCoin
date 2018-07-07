# SaCoin (XSC)
With the increasing use and popularity around blockchain (and by extension, cryptocurrencies), I decided to learn more about it, what better ways are there other than learning that by building one?
This project would mainly be for educational purposes whilst being usable for production purposes.

# Introduction

_Blockchain, what is that?_

Well it's an immutable singly-linked **chain of blocks** but how is that different to data-structures like linked-lists and arrays?

**Blocks** are containers associated to a hash based on its information (such as the time it was created, the data it contains, the hash of the previous block, ...) which depends on the hash of the previous (parent) block it's connected to.
<br>A blockchain is also (usually) decentralised, in other words built on a P2P (Peer-to-Peer) network but for the sake of understanding and experimentation, I will also try to build a REST-based version.

There's several types of blockchains, the main one being the transaction based one (i.e. bitcoin and altcoin) which is what I'll be focusing on.

Also, isn't it just a single chain of blocks like linked-lists? No, it's more like a tree (a [merkel tree](https://brilliant.org/wiki/merkle-tree/) to be exact) where the longest chain is considered as the blockchain while the rest are orphans.

# Pre-requisite
It would be preferable if you have a foundation in the following:
- data-structures
- variable scopes
- cryptography
- JavaScript ES5 and 6
- NodeJS

# Step 0
Choosing the right data-structure and approach.
You may have seen some implementations using arrays storing blocks, hash tables storing references from blocks to their
hashes, tree based ones, ...

So let's look at the complexity of each useful data-structures and comparing them:

| Average/Worst    | Merkel trees          | Linked-lists | Arrays    | Hash tables |
|------------------|-----------------------|--------------|-----------|-------------|
| Space            | O(n)                  | O(n)         | O(n)      | O(n)        |
| Search           | O(log2(n))/O(logk(n)) | Θ(n)/O(n)    | Θ(n)/O(n) | **Θ(1)**/O(n)   |
| Traversal/Access | O(n)                  | Θ(n)/O(n)    | **Θ(1)/O(1)** | Θ(n)/O(n+k) |
| Insert           | O(log2(n))/O(logk(n)) | **Θ(1)/O(1)**    | Θ(n)/O(n) | **Θ(1)**/O(n)   |
| Delete           | O(log2(n))/O(logk(n)) | **Θ(1)/O(1)**    | Θ(n)/O(n) | **Θ(1)**/O(n)   |
| Sync             | O(log2(n))/O(n)       |              |           |             |

Now you might be thinking well, there's no clear winner and it's now down to what operations matters to you the most.
But since we're going on about blockchain, we can ignore the delete row.

Why should you care about Merkel trees?
As this [thread](https://www.quora.com/How-are-Merkle-trees-used-in-a-blockchain) points out, it's what is the best when
it comes to distributed crypto-systems but we'll also use arrays (at least for the blocks).

# Step 1
As mentioned above, the foundation of blockchain are blocks so we'll start with that:
<br>So here's the main part of the code:
```js
const DIFFICULTY = require('./config').DIFFICULTY;

let prvProps = new WeakMap();
const ROOT_HASH = 'b076b4ac5dfd570677538e23b54818022a379d2e8da1ef6f1b40f08965b528ff';

class Block {
  /**
   * @description Block.
   * @param {string} [prevHash=ROOT_HASH] Previous hash
   * @param {Transaction[]} [transactions=[]] List of transactions inside the block
   * @param {number} [nonce=0] Nonce associated to the block
   * @param {number} [height=0] Height of the block within a chain
   */
  constructor(prevHash = ROOT_HASH, transactions = [], nonce = 0, height = 0) {
    prvProps.set(this, {
      prevHash,
      difficulty: DIFFICULTY,
      transactions,
      nonce,
      timestamp: Date.now(),
      hash: ''
   });

    this.updateHash();
  }
```
So here you can see that each blocks has a previous hash, a list of transactions, difficulty (I'll come to this later),
nonce (used to get a specific hash) and the height.

__Note__: I'll be using a `WeakMap` (identified as `prvProps`) based approach to ensure the privacy of the fields by restricting what can be accessed
and changed using `get`/`set` methods as such:
```js
/**
 * @description Get the block's hash which also acts as its header.
 * @return {*} Hash
 */
get hash() {
  return prvProps.get(this).hash
}
```

Now we need the chain which is going to contain the blocks.
```js
const Block = require('./block'), DIFFICULTY = require('./config').DIFFICULTY;

class Blockchain {
  /**
     * @description Creates a blockchain
     * @param {number} [difficulty=DIFFICULTY] Difficulty of the hashes
     * @param {Block} [genesisBlock=Blockchain.createGenesisBlock(difficulty)] Genesis block
     * @param {number} [reward=MINING_REWARD] Mining reward
     * @param {string} [currency=CURRENCY] Currency name
     */
    constructor(difficulty = DIFFICULTY, genesisBlock = Blockchain.createGenesisBlock(), reward = MINING_REWARD, currency = CURRENCY) {
      // genesisBlock.mine();
      prvProps.set(this, {
        chain: [genesisBlock],
        difficulty,
        pendingTransactions: [],
        miningReward: reward,
        currency
      });
    }
}
```
With that in mind we need the object that will allow coins to be moved from A to B, which is where transactions come into play:
```js
const {TRANSACTION_FEE} = require('./config'), {sign} = require('./crypto'), SHA256 = require('crypto-js/sha256');
class Transaction {
  /**
   *@description Crypto transaction.
   * @param {string} fromAddr Address of the sender
   * @param {Key} fromPubKey Public key of the sender
   * @param {string} toAddr Wallet of the receiver
   * @param {number} amount Amount of coins
   * @param {string=} signature Signature of the sender
   * @param {number} [fee=0] Transaction fee
   */
  constructor(fromAddr, fromPubKey, toAddr, amount = 0, signature, fee = TRANSACTION_FEE) {
    prvProps.set(this, {
      fromAddr,
      fromPubKey,
      toAddr,
      amount,
      signature,
      hash: null,
      timestamp: Date.now(),
      fee
    });
    this.updateHash();
  }
}
```
As you can see a transaction doesn't only require public keys (unlike some other blockchain implementations), this is because
by adding addresses (`fromAddr` and `toAddr`, so a bit like what Bitcoin has), the visibility of both parties involved (read the sender and receiver) would be
more anonymous and thus less likely to get spoofed by someone else (since their public keys are visible) so it ensures more security.
There's only one public key (the sender's) because he/she owns the `amount` of coins being transferred so we'll need him/her to sign it
but the problem is that he/she would need to do so when the transaction's hash is obtained from the other information as shown below:
```js
/**
 * @description Calculate the hash of the transaction.
 * @return {string} Hash
 */
calculateHash() {
  return SHA256(this.fromAddr + this.toAddr + this.amount + this.fee + this.timestamp).toString();
}
```
So it could then be signed like so:
```js
/**
 * @description Sign this transaction with a given private key.
 * @param {Key} sk Secret key
 */
sign(sk) {
  prvProps.get(this).signature = sign(sk, this.hash);
}
```

We also need to bar in mind that in order to add blocks we need to mine them which would generate a transaction with a reward
for the miner as well as allowing him/her to keep fees on transactions within the block he/she mined.


But wait, how can users know how much money they have without necessarily having to go through the whole chain and doing some
maths to know how many coins they have?
That's where wallets come into play, but unlike real ones, they don't contain any coins but know (based on arithmetic operations)
how many coins people have.
```js
class Wallet {
  /**
   * @description Electronic wallet.
   * @param {Blockchain} blockchain Blockchain associated
   * @param {{pk: Key, sk: Key}} [keyPair=genKey()]
   * @param {string} password Password to access fully access the wallet
   * @param {string} [address=generateAddress(keyPair.pk)] Hex address
   */
  constructor(blockchain, password, keyPair = genKey(), address = Wallet.generateAddress(keyPair.pk, password)) {
    prvProps.set(this, {
        address,
        password: SHA256(password),
        keyPair,
        blockchain,
        balance: 0
      }
    );
  }
  
  /**
   * @description Generate a Wallet address.
   * @param {Key} pubKey Public key of the wallet
   * @param {string} pwd Password
   * @return {string} Address
   */
  static generateAddress(pubKey, pwd) {
    return SHA256(pubKey + Date.now() + pwd).toString();
  }
  
  /**
   * @description Calculate the wallet's balance by going through its associated blockchain.
   * @param {Blockchain} [blockchain=this.blockchain] Blockchain to use
   * @return {number} Calculated balance
   */
  calculateBalance(blockchain = this.blockchain) {
    let balance = 0;
    //Loop over each block and each transaction inside the block
    for (const block of blockchain.chain) {
      for (const tx of block.transactions) {
        //If the given address is the sender -> reduce the balance
        if (tx.fromAddr === this.address) balance -= tx.amount;
        //If the given address is the receiver -> increase the balance
        if (tx.toAddr === this.address) balance += tx.amount;
      }
    }
    return balance;
  }
}
```
But wait, in order to know how much coin I has, my wallet would go through the *whole* chain every time I call that method.
<br>There must be a way to save some computation time by saving those amounts into an object like a hash table that links
addresses to amounts of unspent coins.

And how is are the transactions reflected on the blockchain?
Well they are placed in a pool of **pending transactions** within the blockchain and then placed into a new block that was mined.
It's possible using the Proof of Work which would require the miner to prove that he/she has enough computational power to mine a block
and add it to the chain (otherwise anyone could add any blocks and it would be a mess) but since it takes some computational power to do
this, it's necessary to have an incentive for miners to mine blocks (in other words, a reward).
```js
//block.js
/**
 * @description Increment the nonce until a valid hash is obtained with enough 0's at the beginning (based on the difficulty).
 */
mine() {
  let diff = prvProps.get(this).difficulty;
  while (this.hash.substring(0, diff) !== '0'.repeat(diff)) {
    prvProps.get(this).nonce++;
    this.updateHash();
  }
}

//blockchain.js
/**
 * @description Add a transaction to the list of pending ones.
 * @param {Transaction} transaction New transaction
 * @throws {Error} Undeliverable transaction (negative amount or not enough funds)
 */
addTransaction(transaction) {
  if (transaction.amount < 0) throw `Negative transactions aren\'t doable (from ${transaction.from} to ${transaction.to})`; //throw new Error('Negative transactions aren\'t doable');
  //senderBalance is the balance of the sender
  if (transaction.fromPubKey !== BANK && senderBalance < transaction.amount) throw `The transaction requires more coins than the sender (${transaction.from}) has (${transaction.amount}${this.currencySymbol} off ${senderBalance}${this.currencySymbol})`;//throw new Error(`The transaction requires more coins than the sender has (${transaction.amount} ${this.currencySymbol} off ${senderBalance} ${this.currencySymbol})`);
  prvProps.get(this).pendingTransactions.push(transaction);
}

/**
 * @description Mine a new block and prepare the miner's reward.
 * @param {Wallet} minerWallet Wallet of the miner who gained a mining reward
 */
minePendingTransactions(minerWallet) {
  //Create a new block with all pending transactions and mine it and add the newly mined block to the chain
  this._add(prvProps.get(this).pendingTransactions, minerWallet.address, Date.now());
  //Reset the pending transactions and send the mining reward
  let rewardTx = new Transaction(BANK.address, BANK.pk, minerWallet.address, this.miningReward, '', 0);
  rewardTx.sign(BANK.sk);
  prvProps.get(this).pendingTransactions = [rewardTx];
}

/**
 * @description Add a new block.
 * @param {Transaction[]} transactions Data contained in the block
 * @param {string} [beneficiaryAddr=this.getBlock(-1).beneficiaryAddr] Wallet address of the beneficiary
 */
_add(transactions, beneficiaryAddr) {
  let prevBlock = this.getBlock(-1), ba = beneficiaryAddr || prevBlock.beneficiaryAddr, newBlock = new Block(prevBlock.hash, transactions, 0, prevBlock.height + 1, ba);
  newBlock.mine();
  prvProps.get(this).chain.push(newBlock);

  //Update the UT pool
  let pool = this.utpool;
  transactions.forEach(tx => {
    let amt = tx.amount, fee = tx.fee; //Just to reduce calls
    pool.addUT(tx.fromAddr, -(amt + fee));
    pool.addUT(tx.toAddr, amt);
    pool.addUT(ba, fee);
  });
}
```
As you can see the UT (Unspent Transaction) pool is being used here to permit having an up-to-date idea of how many coins each
addresses has that are interacting with that blockchain (this is what permits users in having an idea of how many coins they have
without having to go through the whole chain even via Wallet.`calculateBalance()`).

The way I went about this UT pool is as follows:
```js
class UTPool {
  /**
   * @description Unspent Transaction Pool.
   * @param {Object} [pool={}] Pool where keys are wallet addresses and values are the amount of unspent coins
   */
  constructor(pool = {}) {
    prvProps.set(this, {pool})
  }
  
  /**
   * @description Get the UT's pool.
   * @return {Object} pool
   */
  get pool() {
    return prvProps.get(this).pool;
  }
  
  /**
   * @description Add an unspent transaction
   * @param {string} addr Wallet address
   * @param {number} amount Amount of coins
   * @throws {TypeError} amount isn't a number
   */
  addUT(addr, amount) {
    if (typeof amount !== 'number') throw new TypeError(`The UT amount needs to be a number not ${amount}`);
    let pool = prvProps.get(this).pool;
  
    if (pool[addr]) {
      if (typeof pool[addr] !== 'number') pool[addr] = Number(pool[addr]);
      pool[addr] += amount;
    } else pool[addr] = amount
  }
}
```

# Contributing
If you think that I did/got something wrong or want to suggest X or Y changes/additions then feel free to create an issue or PR
while following what [this](./wiki/CONTRIBUTING.md) says.
