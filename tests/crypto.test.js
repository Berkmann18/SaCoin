const {genKey, sign, verify, encrypt, decrypt, KEY_CONFIGS, cloneKey} = require('../src/crypto'), BANK = require('../src/config').BANK, {KEYUTIL} = require('jsrsasign');

let pk, sk, len = 2048;
const EC256R1_KEY = genKey(), RSA2048_KEY = genKey(KEY_CONFIGS.RSA2048);

test('KGen', () => {
  let key = EC256R1_KEY || genKey();
  expect('pk' in key).toBeTruthy();
  expect('sk' in key).toBeTruthy();
  pk = key.pk;
  sk = key.sk;
});

test('Customized KGen', () => {
  let key = genKey(KEY_CONFIGS.EC384r1);
  expect('pk' in key).toBeTruthy();
  expect('sk' in key).toBeTruthy();
  expect(typeof key.pk).toBe('object');
  expect(typeof key.sk).toBe('object');
});

test('Sign and Vrf', () => {
  let bl = len / 4, m = 'Hello', sig = sign(sk, m, bl);
  expect(typeof sig).toBe('string');
  expect(sig.length).not.toBe(bl); //It should be equal for RSA but not ECDSA
  expect(sig.length >= 140).toBeTruthy(); //Usually 142-144
  expect(verify(pk, m, sig, bl)).toBeTruthy();
});

test('RSA S&V', () => {
  let key = RSA2048_KEY || genKey(KEY_CONFIGS.RSA2048), m = 'Lorem', bl = 512, alg = 'RSA', sig = sign(key.sk, m, bl, alg);
  expect(sig).toBeDefined();
  expect(sig.length).toBe(bl);
  expect(verify(key.pk, m, sig, bl, alg)).toBeTruthy();
});

test('Enc & Dec', () => {
  let kp = RSA2048_KEY || genKey(KEY_CONFIGS.RSA2048);
  let m = 'Lorem', c, p;
  c = encrypt(kp.pk, m, 'RSA');
  expect(typeof c).toBe('string');
  expect(c.includes(m)).toBeFalsy();
  p = decrypt(kp.sk, c, 'RSA');
  expect(typeof p).toBe('string');
  expect(p.includes(c)).toBeFalsy();
  expect(p).toBe(m);
  expect(c).not.toBe(encrypt(kp.sk, m));
  expect(() => decrypt(pk, c)).toThrow('Cipher.decrypt: unsupported key or algorithm'); //Expected to throw 'Cipher.decrypt: unsupported key or algorithm'
});

test('BANK', () => {
  let m = 'Welcome', sig = sign(BANK.sk, m);
  expect(verify(BANK.pk, m, sig)).toBeTruthy();
});

/*test('Reggy keys', () => {
  let kp = genKey(), key = genKey();
  // console.log('kp=', kp);

  key.pk.setPublicKeyHex(kp.pk.pubKeyHex);
  key.sk.setPrivateKeyHex(kp.sk.prvKeyHex);
  let CJ = require('circular-json');
  // console.log(CJ.stringify(key.pk, null, 2));
  //
  // console.log(CJ.stringify(kp.pk, null, 2));
  let cjKeyPk = CJ.stringify(key.pk, null, 2), cjKeySk = CJ.stringify(key.sk, null, 2),
    cjKpPk = CJ.stringify(kp.pk, null, 2), cjKpSk = CJ.stringify(kp.sk, null, 2);
  expect(cjKeyPk).toEqual(cjKpPk);
  expect(cjKeySk).toEqual(cjKpSk);
  // expect(key.pk).toEqual(kp.pk);
  // expect(key.sk).toEqual(kp.sk);

  // let pub = KEYUTIL.getKeyFromCSRHex(kp.pk.pubKeyHex);
  // let sec = KEYUTIL.getKeyFromCSRHex(kp.sk.prvKeyHex);
  // let pub = KEYUTIL.getKey(kp.pk.pubKeyHex), sec = KEYUTIL.getKey(kp.sk.prvKeyHex);
  // expect(pub).toBe(kp.pk.pubKeyHex);
  // expect(sec).toBe(kp.sk.prvKeyHex);
});*/

test('EC clone', () => {
  let kp = EC256R1_KEY || genKey();
  const CJ = require('circular-json');
  let pub = cloneKey(kp.pk);
  let pk = CJ.stringify(kp.pk, null, 2), p = CJ.stringify(pub, null, 2);
  expect(pub).not.toEqual(kp.pk); //Not equal due to circularity
  expect(p).toEqual(pk);

  let prv = cloneKey(kp.sk);
  let sk = CJ.stringify(kp.sk, null, 2), s = CJ.stringify(prv, null, 2);
  expect(prv).not.toEqual(kp.sk); //Not equal due to circularity
  expect(s).toEqual(sk);
  prv.isPublic = false;
  s = CJ.stringify(prv, null, 2);
  expect(s).toEqual(sk);

  let msg = 'Lorem';
  let sig = sign(kp.sk, msg), cSig = sign(prv, msg);
  let vrf = verify(kp.pk, msg, sig), cVrf = verify(pub, msg, cSig);
  expect(vrf).toBeTruthy();
  expect(cVrf).toBeTruthy();
  let xVrf = verify(kp.pk, msg, cSig), xCVrf = verify(pub, msg, sig);
  expect(xVrf).toBeTruthy();
  expect(xCVrf).toBeTruthy();
});

test('RSA clone', () => {
  let kp = RSA2048_KEY || genKey(KEY_CONFIGS.RSA1024), bl = 256, alg = 'RSA';
  let pub = cloneKey(kp.pk), prv = cloneKey(kp.sk), msg = 'Hi';
  expect(pub).toEqual(kp.pk);
  expect(prv).not.toEqual(kp.sk);
  let sig = sign(kp.sk, msg, bl, alg), cSig = sign(prv, msg, bl, alg);
  expect(cSig).toEqual(sig);
  let vrf = verify(kp.pk, msg, sig, bl, alg), cVrf = verify(pub, msg, cSig, bl, alg);
  expect(vrf).toBeTruthy();
  expect(cVrf).toBeTruthy();
  let xVrf = verify(kp.pk, msg, cSig, bl, alg), xCVrf = verify(pub, msg, sig, bl, alg);
  expect(xVrf).toBeTruthy();
  expect(xCVrf).toBeTruthy();
});