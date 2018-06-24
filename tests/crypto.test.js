const {genKey, sign, verify, encrypt, decrypt, KEY_CONFIGS} = require('../src/crypto');

let pk, sk, len = 2048;

test('KGen', () => {
  let key = genKey();
  expect('pk' in key).toBeTruthy();
  expect('sk' in key).toBeTruthy();
  pk = key.pk;
  sk = key.sk;
});

test('Sign and Vrf', () => {
  if (!sk && !pk) {
    let kp = genKey();
    sk = kp.sk;
    pk = kp.pk;
  }
  let bl = len / 4, m = 'Hello', sig = sign(sk, m, 512);
  expect(typeof sig).toBe('string');
  expect(sig.length).not.toBe(bl); //It should be equal for RSA but not ECDSA
  expect(sig.length >= 140).toBeTruthy(); //Usually 142-144
  expect(verify(pk, m, sig, bl)).toBeTruthy();
});

test('Enc & Dec', () => {
  let kp = genKey(KEY_CONFIGS.RSA2048);
  sk = kp.sk;
  pk = kp.pk;
  let m = 'Lorem', c = null, p = null;
  c = encrypt(pk, m, 'RSA');
  expect(typeof c).toBe('string');
  expect(c.includes(m)).toBeFalsy();
  p = decrypt(sk, c, 'RSA');
  expect(typeof p).toBe('string');
  expect(p.includes(c)).toBeFalsy();
  expect(p).toBe(m);
  expect(c).not.toBe(encrypt(sk, m));
  //expect(p).not.toBe(decrypt(pk, c)); //Expected to throw 'Cipher.decrypt: unsupported key or algorithm'
});
