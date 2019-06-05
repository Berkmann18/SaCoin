/**
 * @param {string} password Password to pattern match
 * @returns {{...number}} Metrics
 */
const patternMatch = password => {
  const pwArr = password.replace(/\s+/g, '').split(/\s*/);
  let num = 0,
    repChar = 0,
    repInc = 0,
    uppercase = 0,
    lowercase = 0,
    symbol = 0,
    midChar = 0,
    consecNum = 0,
    consecUppercase = 0,
    consecLowercase = 0,
    uniqueChar = 0,
    tmpUppercase = '',
    tmpLowercase = '',
    tmpNum = '';

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

  return {
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
  };
};

module.exports = patternMatch;
