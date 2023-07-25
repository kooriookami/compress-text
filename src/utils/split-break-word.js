/**
 * 部分代码修改自 https://github.com/leaferjs/ui/tree/main/packages/text/src
 */
const money = '¥￥＄€£￡¢￠';
const letter = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz';

const langBefore = '《（「〈『〖【〔｛┌＜‘“＝' + money;
const langAfter = '》）」〉』〗】〕｝┐＞’”！？，、。：；‰';
const langSymbol = '≮≯≈≠＝…';
const langBreak = '—／～｜┆·';

const beforeChar = '{[(<\'"' + langBefore;
const afterChar = '>)]}%!?,.:;\'"' + langAfter;
const symbolChar = afterChar + '_#~&*+\\=|' + langSymbol;
const breakChar = '- ' + langBreak;

const cjkRangeList = [
  [0x4E00, 0x9FFF], // CJK Unified Ideographs
  [0x3400, 0x4DBF], // CJK Unified Ideographs Extension A
  [0x20000, 0x2A6DF], // CJK Unified Ideographs Extension B
  [0x2A700, 0x2B73F], // CJK Unified Ideographs Extension C
  [0x2B740, 0x2B81F], // CJK Unified Ideographs Extension D
  [0x2B820, 0x2CEAF], // CJK Unified Ideographs Extension E
  [0x2CEB0, 0x2EBEF], // CJK Unified Ideographs Extension F
  [0x30000, 0x3134F], // CJK Unified Ideographs Extension G
  [0x31350, 0x323AF], // CJK Unified Ideographs Extension H
  [0x2E80, 0x2EFF], // CJK Radicals Supplement
  [0x2F00, 0x2FDF], // Kangxi Radicals
  [0x2FF0, 0x2FFF], // Ideographic Description Characters
  [0x3000, 0x303F], // CJK Symbols and Punctuation
  [0x31C0, 0x31EF], // CJK Strokes
  [0x3200, 0x32FF], // Enclosed CJK Letters and Months
  [0x3300, 0x33FF], // CJK Compatibility
  [0xF900, 0xFAFF], // CJK Compatibility Ideographs
  [0xFE30, 0xFE4F], // CJK Compatibility Forms
  [0x1F200, 0x1F2FF], // Enclosed Ideographic Supplement
  [0x2F800, 0x2FA1F], // CJK Compatibility Ideographs Supplement
];

const cjkReg = new RegExp(cjkRangeList.map(([start, end]) => `[\\u${start.toString(16)}-\\u${end.toString(16)}]`).join('|'));

function mapChar(str) {
  const map = {};
  str.split('').forEach(char => map[char] = true);
  return map;
}

const letterMap = mapChar(letter);
const beforeMap = mapChar(beforeChar);
const afterMap = mapChar(afterChar);
const symbolMap = mapChar(symbolChar);
const breakMap = mapChar(breakChar);

const CharType = {
  Letter: 0, // en... number
  Single: 1, // cjk
  Before: 2, // (
  After: 3, // )
  Symbol: 4, // *
  Break: 5, // space
};

const { Letter, Single, Before, After, Symbol, Break } = CharType;

function getCharType(char) {
  if (letterMap[char]) {
    return Letter;
  } else if (breakMap[char]) {
    return Break;
  } else if (beforeMap[char]) {
    return Before;
  } else if (afterMap[char]) {
    return After;
  } else if (symbolMap[char]) {
    return Symbol;
  } else if (cjkReg.test(char)) {
    return Single;
  } else {
    return Letter;
  }
}

export function splitBreakWord(text) {
  function addChar(char) {
    word += char;
  }

  function addWord() {
    if (word) {
      list.push(word);
      word = '';
    }
  }

  const list = [];
  let word = '';
  let charType, langBreak, afterBreak, lastCharType;
  for (let char of text) {
    charType = getCharType(char);
    langBreak = (charType === Single && (lastCharType === Single || lastCharType === Letter)) || (lastCharType === Single && charType !== After); // break  U字 文字 or 字U  字（  字*  exclude 字。
    afterBreak = ((charType === Before || charType === Single) && (lastCharType === Symbol || lastCharType === After)); // split >(  =文 。哈  ;文

    if (!afterBreak) afterBreak = charType === Letter && lastCharType === After; // split ，S

    if (langBreak || afterBreak || charType === Break || charType === Before || charType === Single) {
      addWord();
    }

    if (charType === Break) {
      if (char === ' ') {
        addWord();
      }
      addChar(char);
      addWord();
    } else if (langBreak || afterBreak) {
      addWord();
      addChar(char);
    } else {
      addChar(char);
    }

    lastCharType = charType;
  }
  addWord();

  return list;
}
