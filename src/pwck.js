'use strict';
/* istanbul ignore */
const rev = str =>
  str
    .split('')
    .reverse()
    .join('');

/**
 * Password checker from [EssenceJS 1.1](https://github.com/Berkmann18/EssenceJS/blob/master/1.1/modules/Security.js).
 * @param {string} password Password to check
 * @returns {{score: number: complexity: string}} Score (in percentage) with(out) the complexity level
 */
const checkPassword = (password) => {
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
  const multMidChar = 2,
    multiConsecUppercase = 2,
    multConsecLowercase = 2,
    multiConsecNum = 2,
    multiSeqAlpha = 3,
    multiSeqNum = 3,
    multiSeqSymbol = 3,
    multLength = 4,
    multNum = 4,
    nMultSymbol = 6;
  let tmpUppercase = '',
    tmpLowercase = '',
    tmpNum = '',
    minPwLen = 8;
  const alpha = 'abcdefghijklmnopqrstuvwxyz',
    numbers = '01234567890',
    symbols = ')!@#$%^&*()';
  score = (password.length * multLength) | 0;
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
    } else if (pwArr[i].match(/[0-9]/g)) {
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
  //Check for sequential alpha string patterns (forward and reverse)
  for (; s < 23; s++) {
    sFwd = alpha.substring(s, s + 3);
    sRev = rev(sFwd);
    if (password.toLowerCase().includes(sFwd) || password.toLowerCase().includes(sRev)) seqAlpha++;
  }

  //Check for sequential numeric string patterns (forward and reverse)
  for (s = 0; s < 8; s++) {
    sFwd = numbers.substring(s, s + 3);
    sRev = rev(sFwd);
    if (password.toLowerCase().includes(sFwd) || password.toLowerCase().includes(sRev)) seqNum++;
  }

  //Check for sequential symbol string patterns (forward and reverse)
  for (s = 0; s < 8; s++) {
    sFwd = symbols.substring(s, s + 3);
    sRev = rev(sFwd);
    if (password.toLowerCase().includes(sFwd) || password.toLowerCase().includes(sRev)) seqSymbol++;
  }

  //Modify overall score value based on usage vs requirements
  //General point assignment
  if (uppercase > 0 && uppercase < password.length)
    score = score + (password.length - uppercase) * 2;
  if (lowercase > 0 && lowercase < password.length)
    score = score + (password.length - lowercase) * 2;
  if (num > 0 && num < password.length) score = score + num * multNum;
  if (symbol > 0) score = score + symbol * nMultSymbol;
  if (midChar > 0) score = score + midChar * multMidChar;

  //Point deductions for poor practices
  if ((lowercase > 0 || uppercase > 0) && symbol === 0 && num === 0)
    score = score - password.length; //Only Letters
  if (lowercase === 0 && uppercase === 0 && symbol === 0 && num > 0)
    score = score - password.length; //Only Numbers
  if (repChar > 0) score = score - repInc; //Same character exists more than once
  if (consecUppercase > 0) score = score - consecUppercase * multiConsecUppercase; //Consecutive Uppercase Letters exist
  if (consecLowercase > 0) score = score - consecLowercase * multConsecLowercase; //Consecutive Lowercase Letters exist
  if (consecNum > 0) score = score - consecNum * multiConsecNum; //Consecutive Numbers exist
  if (seqAlpha > 0) score = score - seqAlpha * multiSeqAlpha; //Sequential alpha strings exist (3 characters or more)
  if (seqNum > 0) score = score - seqNum * multiSeqNum; //Sequential numeric strings exist (3 characters or more)
  if (seqSymbol > 0) score = score - seqSymbol * multiSeqSymbol; //Sequential symbol strings exist (3 characters or more)

  //Determine if mandatory requirements have been met and set image indicators accordingly
  const arrChars = [password.length, uppercase, lowercase, num, symbol];
  const arrCharsIds = ['nLength', 'nAlphaUC', 'nAlphaLC', 'nNumber', 'nSymbol'];
  for (let c = 0; c < arrChars.length; c++) {
    const minVal = arrCharsIds[c] === 'nLength' ? minPwLen - 1 : 0;
    if (arrChars[c] >= minVal + 1) reqChar++;
  }

  const minReqChars = password.length >= minPwLen ? 3 : 4;
  if (reqChar > minReqChars) score = score + reqChar * 2; //One or more required characters exist

  //Determine complexity based on overall score
  let complexity;

  if (score < 0) complexity = 'Really weak';
  else if (score >= 0 && score < 20) complexity = 'Very weak';
  else if (score >= 20 && score < 40) complexity = 'Weak';
  else if (score >= 40 && score < 60) complexity = 'Good';
  else if (score >= 60 && score < 80) complexity = 'Strong';
  else if (score >= 80 && score <= 100) complexity = 'Very strong';
  else if (score > 100) complexity = 'Really strong';
  else complexity = 'Too short';
  return {score, complexity};
};

module.exports = checkPassword
