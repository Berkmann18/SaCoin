const {rev} = require('./utils');

const ALPHA = 'abcdefghijklmnopqrstuvwxyz',
  NUMBERS = '01234567890',
  SYMBOLS = ')!@#$%^&*(';

/**
 * Sequential string patterns
 * @param {string} password Password to check
 * @returns {seqAlpha: number, seqNum: number, seqSymbol: number} Seq* numbers
 */
const seqStrPatterns = password => {
  let s = 0,
    seqAlpha = 0,
    seqNum = 0,
    seqSymbol = 0,
    sFwd,
    sRev;
  const pw = password.toLowerCase();
  //Check for sequential alpha string patterns (forward and reverse)
  for (; s < 23; s++) {
    sFwd = ALPHA.substring(s, s + 3);
    sRev = rev(sFwd);
    if (pw.includes(sFwd) || pw.includes(sRev)) seqAlpha++;
  }

  /* @TODO Loop-fuse both loops below */
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

  return {seqAlpha, seqNum, seqSymbol};
};

module.exports = seqStrPatterns;
