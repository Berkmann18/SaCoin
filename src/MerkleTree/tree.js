const SHA256 = require('crypto-js/sha256'), {TreeNode, LeafNode} = require('./node');

'use strict';

/** @private */
let prvProps = new WeakMap();

/**
 * @description Convert an array to a LeafNode list.
 * @param {string[]} arr Array
 * @return {LeafNode[]} Leaf nodes
 */
const arrToLeaves = (arr) => arr.map(leaf => new LeafNode(leaf));

class MerkleTree {
  /**
   * @description Create a binary Merkel tree.
   * @param {string[]} leaves Leaves of the tree
   */
  constructor(leaves) {
    prvProps.set(this, {
      leaves,
      layers: [],
      hash: '',
    });

    this.updateHash();
  }

  /**
   * @description Get the hash representing the tree.
   * @return {string} Hash
   */
  get hash() {
    return prvProps.get(this).hash;
  }

  /**
   * @description Get the leaves of the tree.
   * @return {string[]} Leaves
   */
  get leaves() {
    return prvProps.get(this).leaves;
  }

  /**
   * @description Get the layers of the tree that comprises leaf nodes at the beginning and tree nodes in the other layers.
   * @return {Node[]} Layers
   */
  get layers() {
    return prvProps.get(this).layers;
  }

  /**
   * @description Get the root node of the tree.
   * @return {TreeNode} Root
   */
  get root() {
    let layers = this.layers;
    return layers[layers.length - 1][0];
  }

  /**
   * @description Add data to the leaves of the tree and update the relevant hashes.
   * @param {string} data Data
   */
  add(data) {
    prvProps.get(this).leaves.push(data);
    this.updateHash();
  }

  /**
   * @description Get the tree' size.
   * @return {number} Size
   */
  size() {
    return prvProps.get(this).layers.length;
  }

  /**
   * @description Calculate the hash of the tree.
   * @return {string} Hash
   * @throws {Error} No leaves to compute
   */
  calculateHash() {
    let leaves = prvProps.get(this).leaves, layers = prvProps.get(this).layers;
    if (!leaves.length) throw Error('No leaves to compute');
    let leafNodes = arrToLeaves(leaves);
    if (leaves.length < 3) layers = [leafNodes, [new TreeNode(...leafNodes)]];
    else {
      layers = [leafNodes, []];
      for (let i = 0; i < leafNodes.length; i += 2) {
        layers[1].push(new TreeNode(leafNodes[i], leafNodes[i + 1]));
      }
    }

    if (layers !== prvProps.get(this).layers) prvProps.get(this).layers = layers;
    return layers[layers.length - 1][0].hash;
  };

  /**
   * @description Update the tree's hash.
   */
  updateHash() {
    prvProps.get(this).hash = this.calculateHash();
  }

  /**
   * @description String representation of a Merkel tree.
   * @return {string} Merkel tree
   */
  toString() {
    return `MerkleTree(layers=${this.layers})`
  }

  /**
   * @description Check the validity of the tree.
   * @return {boolean} Validity
   */
  isValid() {
    for (let layer of this.layers) {
      for (let node of layer) {
        if (!node.isValid()) return false;
      }
    }

    return true;
  }

  /**
   * @description Print the tree.
   * @param {boolean} [simplified=false] Simplify the output
   * @param {string} [order='in'] Printing order (pre, in, post)
   */
  print(simplified = false, order = 'in') {
    let spacing = 0, chr = '-', inc = 2;
    switch (order) {
      case 'pre':
        let cur = this.root, tree = '';
        while (cur !== null) {
          tree += ' '.repeat(spacing) + chr + cur.toString() + '\n';
          //TreeNode
          if (cur.leftChild !== null) tree += ' '.repeat(spacing + inc) + chr + cur.leftChild.toString();
          if (cur.rightChild !== null) tree += ' '.repeat(spacing + inc) + chr + cur.rightChild.toString();
          //LeafNode
          if (cur.data) tree += ' '.repeat(spacing) + (('toString' in cur.data) ? cur.data.toString() : cur.data) + '\n';
          cur = null;
        }

        break;
      case 'post':

        break;
      default: //in
        for (let layer of this.layers) {
          for (let node of layer) {
            let isLeaf = node instanceof LeafNode;
            let str = simplified ? `${isLeaf ? 'LeafNode(data=' + node.data + ', hash=' + node.hash : node.constructor.name + '(hash=' + node.hash})` : node.toString();
            console.log(' '.repeat(spacing) + chr + str);
          }
          spacing += 2;
        }
        break;
    }
  }
}

module.exports = MerkleTree;