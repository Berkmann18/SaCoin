/**
 * @param {number} score Password check score
 */
const getComplexity = score => {
  if (score < 0) return 'Really weak';
  else if (score >= 0 && score < 20) return 'Very weak';
  else if (score >= 20 && score < 40) return 'Weak';
  else if (score >= 40 && score < 60) return 'Good';
  else if (score >= 60 && score < 80) return 'Strong';
  else if (score >= 80 && score <= 100) return 'Very strong';
  else if (score > 100) return 'Really strong';
  else return 'Too short';
};

module.exports = getComplexity;
