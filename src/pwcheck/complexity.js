/**
 * @param {number} score Password check score
 */
const getComplexity = score => {
  const res = [
    [-Infinity],
    [0, 'Really weak'],
    [20, 'Very weak'],
    [40, 'Weak'],
    [60, 'Good'],
    [80, 'Strong'],
    [101, 'Very strong'],
    [Infinity, 'Really strong']
  ];

  for (let i = 1; i < res.length; ++i) {
    if (score >= res[i - 1][0] && score < res[i][0]) return res[i][1];
  }
};

module.exports = getComplexity;
