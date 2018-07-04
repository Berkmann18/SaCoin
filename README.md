# SaCoin (XSC)
With the increasing use and popularity around blockchain (and by extension, cryptocurrencies), I decided to learn more about it what better ways are there other than learning by building one?
This project would mainly be for educational purposes whilst being usable for production purposes.

# Introduction

_Blockchain, what is that?_

Well it's an immutable singly-linked **chain of blocks** but how is that different to data-structures like linked-lists and arrays?

**Blocks** are containers associated to a hash based on its information (such as the time it was created, the data it contains, the hash of the previous block, ...) which depends on the hash of the previous (parent) block it's connected to.
<br>Blockchain is also (usually) decentralised, in other words built on a P2P (Peer-to-Peer) network but for the sake of understanding and experimentation, I will also try to build a REST-based version.

There's several types of blockchain, the main one being the transaction based one (i.e. bitcoin and altcoin) which is what I'll be focusing on.

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
it comes to distributed crypto-systems but we'll also use arrays.

# Step 1
As mentioned above, the foundation of blockchain are blocks so we'll start with that:
So here's the main part of the code:
```js
class Block {
  /**
   * @description Block.
   * @param {string} prevHash Previous hash
   * @param {Transaction[]} [transactions=[]] List of transactions inside the block
   * @param {number} [nonce=0] Nonce associated to the block
   * @param {number} [height=0] Height of the block within a chain
   */
  constructor(prevHash, transactions = [], nonce = 0, height = 0) {
    prvProps.set(this, {prevHash,
    difficulty: 3,
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

Now we need the chain which is going to contain the blocks.
```js
const Block = require('./block'), DIFFICULTY = require('./config');

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
class Transaction {
  constructor(fromPubKey, toPubKey, amount = 0, fee = 0) {

  }
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
}
```

And how is are the transactions reflected on the blockchain?
Well they are placed in a pool of **pending transactions** within the blockchain and then placed into a new block that was mined;
that using the Proof of Work
```js
//block.js
/**
   * @description Increment the nonce until a valid hash is obtained with enough 0's at the beginning (based on the difficulty).
   * @param {string} beneficiarySig Signature of the beneficiary
   */
mine(beneficiarySig) {
  while (this.hash.substring(0, prvProps.get(this).difficulty) !== '0'.repeat(prvProps.get(this).difficulty)) {
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
 * @description Mine a new block and send the reward to the miner.
 * @param {(string|RSAKey|crypto.ECDSA)} miningRewardAddr Address of the miner who gained a mining reward
 */
minePendingTransaction(miningRewardAddr) {
  //Create a new block with all pending transactions and mine it and add the newly mined block to the chain
  this._add(prvProps.get(this).pendingTransactions, miningRewardAddr);
   //Reset the pending transactions and send the mining reward
  prvProps.get(this).pendingTransactions = [new Transaction(BANK.pk, miningRewardAddr, this.miningReward)];
}
```

# Contributing
If you think that I did/got something wrong or want to suggest X or Y changes/additions then feel free to create an issue or PR
while following what [this](./wiki/CONTRIBUTING.md) says.
