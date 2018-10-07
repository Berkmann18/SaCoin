'use strict';
const SHA256 = require('crypto-js/sha256');

/** @private */
let prvProps = new WeakMap();

/**
 * A tree node.
 * @typedef {TreeNode|LeafNode} Node
 */

/**
 * @description Parse the child of a tree node to prevent calling methods on null.
 * @param {TreeNode} node Node to parse
 * @return {{left: ?string, right: string}} Parsed child
 */
const parseChilds = (node) => {
  let l = node.leftChild, r = node.rightChild;
  let left = l ? l.toString() : null, right = r ? r.toString() : null;
  return {left, right}
};

class TreeNode {
  /**
   * @description Inner tree nodes.
   * @param {Node} leftChild Left Child
   * @param {?Node} [rightChild=null] Right child
   */
  constructor(leftChild, rightChild = null) {
    prvProps.set(this, {
      leftChild,
      rightChild,
      hash: ''
    });

    this.updateHash();
  }

  /**
   * @description Get the left-hand child of this node.
   * @return {?Node} Left child
   */
  get leftChild() {
    return prvProps.get(this).leftChild;
  }

  /**
   * @description Get the right-hand child of this node.
   * @return {?Node} Right child
   */
  get rightChild() {
    return prvProps.get(this).rightChild;
  }

  /**
   * @description Get the node's hash.
   * @return {string} Hash
   */
  get hash() {
    return prvProps.get(this).hash;
  }

  /**
   * @description Calculate the hash of that node.
   * @return {string} Hash of the node
   */
  calculateHash() {
    let l = this.leftChild, r = this.rightChild;
    let left = l ? l.hash : null, right = r ? r.hash : '';
    return SHA256(left + right).toString();
  }

  /**
   * @description Update the node's hash.
   */
  updateHash() {
    prvProps.get(this).hash = this.calculateHash();
  }

  /**
   * @description String representation of the tree node.
   * @return {string} Tree node
   */
  toString() {
    let {left, right} = parseChilds(this);
    return `TreeNode(leftChild=${left}, rightChild=${right}, hash=${this.hash})`;
  }

  /**
   * @description Check if the node is valid.
   * @return {boolean} Validity
   */
  isValid() {
    let _v = (child) => {
      let isNode = child instanceof TreeNode || child instanceof LeafNode;
      return (child && isNode && child.isValid()) || (child === null);
    }; //Present and valid or non existent and ignored
    let validHash = this.hash === this.calculateHash(), validLeft = _v(this.leftChild), validRight = _v(this.rightChild);
    return validHash && validLeft && validRight;
  }
}

class LeafNode {
  /**
   * @description Leaf node of a tree.
   * @param {*} data Data to place in the node
   */
  constructor(data) {
    prvProps.set(this, {
      data,
      hash: ''
    });

    this.updateHash();
  }

  /**
   * @description Get the data.
   * @return {*} Data
   */
  get data() {
    return prvProps.get(this).data
  }

  /**
   * @description Get the hash of the leaf.
   * @return {string} Hash
   */
  get hash() {
    return prvProps.get(this).hash
  }

  /**
   * @description Calculate the hash of that node.
   * @return {string} Hash of the node
   */
  calculateHash() {
    let str = this.data.toString();
    return (str !== '[object Object]') ? SHA256(str).toString() : SHA256(JSON.stringify(this.data)).toString();
  }

  /**
   * @description Update the node's hash.
   */
  updateHash() {
    prvProps.get(this).hash = this.calculateHash();
  }

  /**
   * @description String representation of the leaf node.
   * @return {string} Leaf node
   */
  toString() {
    return `LeafNode(data=${this.data}, hash=${this.hash})`;
  }

  /**
   * @description Check if the node is valid.
   * @return {boolean} Validity
   */
  isValid() {
    return this.hash === this.calculateHash();
  }
}

module.exports = {TreeNode, LeafNode};