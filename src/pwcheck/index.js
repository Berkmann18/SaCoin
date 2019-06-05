'use strict';
const {rev} = require('./utils');
const getComplexity = require('./complex');
/* istanbul ignore */

/**
 * Password checker from [EssenceJS 1.1](https://github.com/Berkmann18/EssenceJS/blob/master/1.1/modules/Security.js).
 * <br>Which was inspired by a password meter/checker (I forgot which one :().
 * @param {string} password Password to check
 * @returns {{score: number: complexity: string}} Score (in percentage) with(out) the complexity level
 */
const checkPassword = password => {
  let score = 0,
    uppercase = 0,
    lowercase = 0,
    num = 0,
    symbol = 0,
    midChar = 0,
    uniqueChar = 0,
    repChar = 0,
    repInc = 0,
    consecUppercase = 0,
    consecLowercase = 0,
    consecNum = 0,
    seqAlpha = 0,
    seqNum = 0,
    seqSymbol = 0,
    reqChar = 0;
  let tmpUppercase = '',
    tmpLowercase = '',
    tmpNum = '';
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
    MIN_PW_LEN = 8,
    ALPHA = 'abcdefghijklmnopqrstuvwxyz',
    NUMBERS = '01234567890',
    SYMBOLS = ')!@#$%^&*(';
  score = (password.length * MULT_LEN) | 0;
  const pwArr = password.replace(/\s+/g, '').split(/\s*/);

  /* Loop through password to check for Symbol, Numeric, Lowercase and Uppercase pattern matches */
  for (let i = 0; i < pwArr.length; i++) {
    if (pwArr[i].match(/[A-Z]/g)) {
      if (tmpUppercase !== '' && tmpUppercase + 1 === i) consecUppercase++;
      tmpUppercase = i;
      uppercase++;
    } else if (pwArr[i].match(/[a-z]/g)) {
      if (tmpLowercase !== '' && tmpLowercase + 1 === i) consecLowercase++;
      tmpLowercase = i;
      lowercase++;
    } else if (pwArr[i].match(/\d/g)) {
      if (i > 0 && i < pwArr.length - 1) midChar++;
      if (tmpNum !== '' && tmpNum + 1 === i) consecNum++;
      tmpNum = i;
      num++;
    } else if (pwArr[i].match(/[^a-zA-Z0-9_]/g)) {
      if (i > 0 && i < pwArr.length - 1) midChar++;
      symbol++;
    }
    //Repetition check
    let bCharExists = false;
    for (let j = 0; j < pwArr.length; j++) {
      if (pwArr[i] === pwArr[j] && i != j) {
        //Repetition present
        bCharExists = true;
        /*
       Calculate increment deduction based on proximity to identical characters
       Deduction is incremented each time a new match is discovered
       Deduction amount is based on total password length divided by the
       difference of distance between currently selected match
       */
        repInc += Math.abs(pwArr.length / (j - i));
      }
    }
    if (bCharExists) {
      repChar++;
      uniqueChar = pwArr.length - repChar;
      repInc = (uniqueChar ? repInc / uniqueChar : repInc) | 1;
    }
  }

  let s = 0,
    sFwd,
    sRev;
  const pw = password.toLowerCase();
  //Check for sequential alpha string patterns (forward and reverse)
  for (; s < 23; s++) {
    sFwd = ALPHA.substring(s, s + 3);
    sRev = rev(sFwd);
    if (pw.includes(sFwd) || pw.includes(sRev)) seqAlpha++;
  }

  //Check for sequential numeric string patterns (forward and reverse)
  for (s = 0; s < 8; s++) {
    sFwd = NUMBERS.substring(s, s + 3);
    sRev = rev(sFwd);
    if (pw.includes(sFwd) || pw.includes(sRev)) seqNum++;
  }

  //Check for sequential symbol string patterns (forward and reverse)
  for (s = 0; s < 8; s++) {
    sFwd = SYMBOLS.substring(s, s + 3);
    sRev = rev(sFwd);
    if (pw.includes(sFwd) || pw.includes(sRev)) seqSymbol++;
  }

  //Modify overall score value based on usage vs requirements
  //General point assignment
  if (uppercase > 0 && uppercase < password.length) score += (password.length - uppercase) * 2;
  if (lowercase > 0 && lowercase < password.length) score += (password.length - lowercase) * 2;
  if (num > 0 && num < password.length) score += num * MULT_NUM;
  if (symbol > 0) score += symbol * N_MULT_SYM;
  if (midChar > 0) score += midChar * MULT_MID_CHAR;

  //Point deductions for poor practices
  if ((lowercase > 0 || uppercase > 0) && symbol === 0 && num === 0) score -= password.length; //Only Letters
  if (lowercase === 0 && uppercase === 0 && symbol === 0 && num > 0) score -= password.length; //Only Numbers
  if (repChar > 0) score -= repInc; //Same character exists more than once
  if (consecUppercase > 0) score -= consecUppercase * MULT_CONSEC_UPPERCASE; //Consecutive Uppercase Letters exist
  if (consecLowercase > 0) score -= consecLowercase * MULT_CONSEC_LOWERCASE; //Consecutive Lowercase Letters exist
  if (consecNum > 0) score -= consecNum * MULT_CONSEC_NUM; //Consecutive Numbers exist
  if (seqAlpha > 0) score -= seqAlpha * MULT_SEQ_ALPHA; //Sequential alpha strings exist (3 characters or more)
  if (seqNum > 0) score -= seqNum * MULT_SEQ_NUM; //Sequential numeric strings exist (3 characters or more)
  if (seqSymbol > 0) score -= seqSymbol * MULT_SEQ_SYM; //Sequential symbol strings exist (3 characters or more)

  //Determine if mandatory requirements have been met and set image indicators accordingly
  const arrChars = [password.length, uppercase, lowercase, num, symbol];
  const arrCharsIds = ['nLength', 'nAlphaUC', 'nAlphaLC', 'nNumber', 'nSymbol'];
  for (let c = 0; c < arrChars.length; c++) {
    const minVal = arrCharsIds[c] === 'nLength' ? MIN_PW_LEN : 1;
    if (arrChars[c] >= minVal) reqChar++;
  }

  const minReqChars = password.length >= MIN_PW_LEN ? 3 : 4;
  if (reqChar > minReqChars) score += reqChar * 2; //One or more required characters exist

  //Determine complexity based on overall score
  return {score, complexity: getComplexity(score)};
};

module.exports = checkPassword;
