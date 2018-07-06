'use strict';

const {KEYUTIL, Signature, crypto, RSAKey} = require('jsrsasign');

/**
 * A key
 * @typedef {(RSAKey|crypto.ECDSA)} Key
 */

const KEY_CONFIGS = {
  RSA224: {type: 'RSA', name: '224'}, //here name is the key length
  RSA256: {type: 'RSA', name: '256'},
  RSA384: {type: 'RSA', name: '384'},
  RSA512: {type: 'RSA', name: '512'},
  RSA1024: {type: 'RSA', name: '1024'},
  RSA2048: {type: 'RSA', name: '2048'},
  EC256k1: {type: 'EC', name: 'secp256k1'}, //Here name is the curve
  EC256r1: {type: 'EC', name: 'secp256r1'},
  EC384r1: {type: 'EC', name: 'secp384r1'}
};

/**
 * @description Generate a public and private key pair using a specified algorithm.
 * @param {{type:string, name:string}} [opts=KEY_CONFIGS.EC256r1] Options containing the type (e.g.: RSA, EC) and name (keylength or curve)
 * @return {{pk: Key, sk: Key}}
 */
const genKey = (opts = KEY_CONFIGS.EC256r1) => {
  let kp = KEYUTIL.generateKeypair(opts.type, opts.name);
  return {pk: kp.pubKeyObj, sk: kp.prvKeyObj}
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
  let sig = new Signature({alg: `SHA${bitLen}with${alg}`});
  sig.init(sk);
  return sig.signString(msg);
};

/**
 * @description Verify a signature.
 * @param {Key} pk Public key
 * @param {string} msg Message
 * @param {string} sig Digital signature
 * @param {number} [bitLen=512] Bit length associated to the SHA hash (1, 224, 256, 384, 512) and usually half the key length from genKey().
 * @param {string} [alg='ECDSA'] Algorithm
 * @return {void|boolean} Signature validity
 */
const verify = (pk, msg, sig, bitLen = 512, alg = 'ECDSA') => {
  let tag = new Signature({alg: `SHA${bitLen}with${alg}`});
  tag.init(pk);
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

/*
/!**
 * @description Get the PEM data from a key.
 * @param {RSAKey} keyObj Key object
 * @return {string} PEM data
 *!/
const toPEM = (keyObj) => KEYUTIL.getPEM(keyObj);

/!**
 * @description Get the key from the PEM data.
 * @param {string} PEM PEM data
 * @return {RSAKey} RSA key
 *!/
const fromPEM = (PEM) => KEYUTIL.getKey(PEM);*/

const cloneKey = (type, key) => type === 'EC' ? new crypto.ECDSA(key) : new RSAKey(key);

module.exports = {genKey, sign, verify, encrypt, decrypt, KEY_CONFIGS, cloneKey};