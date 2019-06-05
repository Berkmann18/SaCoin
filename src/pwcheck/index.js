'use strict';
const getComplexity = require('./complex');
const patternMatch = require('./patternMatch');
const seqStrPatterns = require('./seqStrPatterns');
/* istanbul ignore */

const MULT_MID_CHAR = 2,
  MULT_CONSEC_UPPERCASE = 2,
  MULT_CONSEC_LOWERCASE = 2,
  MULT_CONSEC_NUM = 2,
  MULT_SEQ_ALPHA = 3,
  MULT_SEQ_NUM = 3,
  MULT_SEQ_SYM = 3,
  MULT_LEN = 4,
  MULT_NUM = 4,
  N_MULT_SYM = 6,
  MIN_PW_LEN = 8;

/**
 * Modify overall score value based on usage vs requirements.
 * @param {{password: string, ...number}} opts Metrics
 * @returns {number} General points
 */
const generalPoints = ({password, uppercase, lowercase, num, symbol, midChar}) => {
  let points = 0;
  if (uppercase > 0 && uppercase < password.length) points += (password.length - uppercase) * 2;
  if (lowercase > 0 && lowercase < password.length) points += (password.length - lowercase) * 2;
  if (num > 0 && num < password.length) points += num * MULT_NUM;
  if (symbol > 0) points += symbol * N_MULT_SYM;
  if (midChar > 0) points += midChar * MULT_MID_CHAR;
  return points;
};

/**
 * Return a score deduction based on poor practices.
 * @param {{...number}} opts Metrics including the password
 */
const poorPractices = ({
  password,
  lowercase,
  uppercase,
  symbol,
  num,
  repChar,
  repInc,
  consecUppercase,
  consecLowercase,
  consecNum
}) => {
  const {seqAlpha, seqNum, seqSymbol} = seqStrPatterns(password);

  let deductions = 0;
  if ((lowercase > 0 || uppercase > 0) && symbol === 0 && num === 0) deductions += password.length; //Only Letters
  if (lowercase === 0 && uppercase === 0 && symbol === 0 && num > 0) deductions += password.length; //Only Numbers
  if (repChar > 0) deductions += repInc; //Same character exists more than once
  if (consecUppercase > 0) deductions += consecUppercase * MULT_CONSEC_UPPERCASE; //Consecutive Uppercase Letters exist
  if (consecLowercase > 0) deductions += consecLowercase * MULT_CONSEC_LOWERCASE; //Consecutive Lowercase Letters exist
  if (consecNum > 0) deductions += consecNum * MULT_CONSEC_NUM; //Consecutive Numbers exist
  if (seqAlpha > 0) deductions += seqAlpha * MULT_SEQ_ALPHA; //Sequential alpha strings exist (3 characters or more)
  if (seqNum > 0) deductions += seqNum * MULT_SEQ_NUM; //Sequential numeric strings exist (3 characters or more)
  if (seqSymbol > 0) deductions += seqSymbol * MULT_SEQ_SYM; //Sequential symbol strings exist (3 characters or more)
  return deductions;
};

/**
 * Password checker from [EssenceJS 1.1](https://github.com/Berkmann18/EssenceJS/blob/master/1.1/modules/Security.js).
 * <br>Which was inspired by a password meter/checker (I forgot which one :().
 * @param {string} password Password to check
 * @returns {{score: number: complexity: string}} Score (in percentage) with(out) the complexity level
 */
const checkPassword = password => {
  let reqChar = 0,
    score = (password.length * MULT_LEN) | 0;

  /* Loop through password to check for Symbol, Numeric, Lowercase and Uppercase pattern matches */
  const {
    consecUppercase,
    consecLowercase,
    num,
    uppercase,
    lowercase,
    symbol,
    midChar,
    consecNum,
    repChar,
    repInc
  } = patternMatch(password);

  //General point assignment
  score += generalPoints({password, uppercase, lowercase, num, symbol, midChar});

  //Point deductions for poor practices
  score -= poorPractices({
    password,
    lowercase,
    uppercase,
    symbol,
    num,
    repChar,
    repInc,
    consecUppercase,
    consecLowercase,
    consecNum
  });

  //Determine if mandatory requirements have been met
  const arrChars = [password.length, uppercase, lowercase, num, symbol];
  if (password.length >= MIN_PW_LEN) reqChar++;
  for (let c = 0; c < arrChars.length; c++) {
    if (arrChars[c] >= 1) reqChar++;
  }

  const minReqChars = password.length >= MIN_PW_LEN ? 3 : 4;
  if (reqChar > minReqChars) score += reqChar * 2; //One or more required characters exist

  //Determine complexity based on overall score
  return {score, complexity: getComplexity(score)};
};

module.exports = checkPassword;
