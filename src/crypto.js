'use strict';

/**
 * @fileoverview Cryptography functions.
 * @module
 */

const { KEYUTIL, Signature, crypto, RSAKey } = require('jsrsasign');

/**
 * @description A key.
 * @typedef {(RSAKey|crypto.ECDSA)} Key
 */

/**
 * @description Default key configurations for RSA and EC.
 * @type {string: Object}
 * @alias crypto.KEY_CONFIGS
 */
const KEY_CONFIGS = {
  RSA224: { type: 'RSA', name: '224' }, //here name is the key length
  RSA256: { type: 'RSA', name: '256' },
  RSA384: { type: 'RSA', name: '384' },
  RSA512: { type: 'RSA', name: '512' },
  RSA1024: { type: 'RSA', name: '1024' },
  RSA2048: { type: 'RSA', name: '2048' },
  EC256k1: { type: 'EC', name: 'secp256k1' }, //Here name is the curve
  EC256r1: { type: 'EC', name: 'P-256', curve: 'secp256r1' },
  EC384r1: { type: 'EC', name: 'P-384', curve: 'secp384r1' }
};

/**
 * @description Generate a public and private key pair using a specified algorithm.
 * @param {{type:string, name:string}} [opts=KEY_CONFIGS.EC256r1] Options containing the type (e.g.: RSA, EC) and name (keylength or curve)
 * @return {{pk: Key, sk: Key}} Key pair
 */
const genKey = (opts = KEY_CONFIGS.EC256r1) => {
  let kp = KEYUTIL.generateKeypair(opts.type, opts.name);
  return { pk: kp.pubKeyObj, sk: kp.prvKeyObj }
};

/**
 * @description Sign a message with a private key.
 * @param {Key} sk Secret key
 * @param {string} msg Message
 * @param {number} [bitLen=512] Byte length associated to the SHA hash (1, 224, 256, 384, 512) and usually half the key length from genKey().
 * @param {string} [alg='ECDSA'] Algorithm
 * @return {void|string} (byteLen / 2)-bite signature
 */
const sign = (sk, msg, bitLen = 512, alg = 'ECDSA') => {
  let sig = new Signature({ alg: `SHA${bitLen}with${alg}` });
  sig.init(sk);
  return sig.signString(msg);
};

/**
 * @description Verify a signature.
 * @param {Object} arg Arguments
 * @param {Key} arg.pubKey Public key
 * @param {string} arg.msg Message
 * @param {string} arg.sig Digital signature
 * @param {number} [arg.bitLen=512] Bit length associated to the SHA hash (1, 224, 256, 384, 512) and usually half the key length from genKey().
 * @param {string} [arg.alg='ECDSA'] Algorithm
 * @return {void|boolean} Signature validity
 */
const verify = ({ pubKey, msg, sig, bitLen = 512, alg = 'ECDSA' } = {}) => {
  let tag = new Signature({ alg: `SHA${bitLen}with${alg}` });
  tag.init(pubKey);
  tag.updateString(msg);
  return tag.verify(sig);
};

/**
 * @description Encrypt a plaintext.
 * @param {Key} pk Public key
 * @param {string} msg Message
 * @param {string} [alg='RSA'] Algorithm to use
 * @return {string} hex ciphertext
 */
const encrypt = (pk, msg, alg = 'RSA') => crypto.Cipher.encrypt(msg, pk, alg);

/**
 * @description Decrypt a ciphertext.
 * @param {Key} sk Secret key
 * @param {string} cipher Ciphertext
 * @param {string} [alg='RSA'] Algorithm to use
 * @return {string} Plaintext
 */
const decrypt = (sk, cipher, alg = 'RSA') => crypto.Cipher.decrypt(cipher, sk, alg);

/**
 * @description Clone a key.
 * @param {Key} key Original key
 * @return {Key} clone
 */
const cloneKey = (key) => {
  let clone = KEYUTIL.getKey(KEYUTIL.getJWKFromKey(key));
  if (key.isPublic !== clone.isPublic) clone.isPublic = key.isPublic;
  return clone;
};

module.exports = { genKey, sign, verify, encrypt, decrypt, KEY_CONFIGS, cloneKey };