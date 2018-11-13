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
  let bitLen = len / 4, msg = 'Hello', sig = sign(sk, msg, bitLen);
  expect(typeof sig).toBe('string');
  expect(sig.length).not.toBe(bitLen); //It should be equal for RSA but not ECDSA
  expect(sig.length >= 140).toBeTruthy(); //Usually 142-144
  expect(verify({
    pubKey: pk,
    msg,
    sig,
    bitLen
  })).toBeTruthy();
  expect(verify({
    pubKey: pk,
    msg,
    sig,
    alg: 'ECDSA'
  })).toBeTruthy();
});

test('RSA S&V', () => {
  let key = RSA2048_KEY || genKey(KEY_CONFIGS.RSA2048), msg = 'Lorem', bitLen = 512, alg = 'RSA', sig = sign(key.sk, msg, bitLen, alg);
  expect(sig).toBeDefined();
  expect(sig.length).toBe(bitLen);
  expect(verify({
    pubKey: key.pk,
    msg,
    sig,
    bitLen,
    alg
  })).toBeTruthy();
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
  let msg = 'Welcome', sig = sign(BANK.sk, msg);
  expect(verify({
    pubKey: BANK.pk,
    msg,
    sig
  })).toBeTruthy();
});

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
  let vrf = verify({
      pubKey: kp.pk,
      msg,
      sig
    }), cVrf = verify({
      pubKey: pub,
      msg,
      sig: cSig
    });
  expect(vrf).toBeTruthy();
  expect(cVrf).toBeTruthy();
  let xVrf = verify({
      pubKey: kp.pk,
      msg,
      sig: cSig
    }), xCVrf = verify({
      pubKey: pub,
      msg,
      sig
    });
  expect(xVrf).toBeTruthy();
  expect(xCVrf).toBeTruthy();
});

test('RSA clone', () => {
  let kp = RSA2048_KEY || genKey(KEY_CONFIGS.RSA1024), bitLen = 256, alg = 'RSA';
  let pub = cloneKey(kp.pk), prv = cloneKey(kp.sk), msg = 'Hi';
  expect(pub).toEqual(kp.pk);
  expect(prv).not.toEqual(kp.sk);
  let sig = sign(kp.sk, msg, bitLen, alg), cSig = sign(prv, msg, bitLen, alg);
  expect(cSig).toEqual(sig);
  let vrf = verify({
      pubKey: kp.pk,
      msg,
      sig,
      bitLen,
      alg
    }), cVrf = verify({
      pubKey: pub,
      msg,
      sig: cSig,
      bitLen,
      alg
    });
  expect(vrf).toBeTruthy();
  expect(cVrf).toBeTruthy();
  let xVrf = verify({
      pubKey: kp.pk,
      msg,
      sig: cSig,
      bitLen,
      alg
    }), xCVrf = verify({
      pubKey: pub,
      msg,
      sig,
      bitLen,
      alg
    });
  expect(xVrf).toBeTruthy();
  expect(xCVrf).toBeTruthy();
});

test('Verify something', () => {
  expect(() => verify()).toThrowError('init failed:TypeError: Cannot read property \'curve\' of undefined');
});