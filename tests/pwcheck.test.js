const pc = require('../src/pwcheck');

test('Low scores', () => {
  expect(pc('JohnDoe')).toEqual({
    score: 28,
    complexity: 'Weak'
  });
});

test('Medium scores', () => {
  expect(pc('p@ssword123')).toEqual({
    score: 68,
    complexity: 'Strong'
  });
});

test('High scores', () => {
  expect(pc('H31lo W0r!d')).toEqual({
    score: 110,
    complexity: 'Really strong'
  });
});
