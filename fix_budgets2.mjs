import { readFileSync, writeFileSync } from 'fs';

const p = 'E:\\项目合集\\理财app\\apps\\mobile\\app\\(tabs)\\budgets.tsx';
let c = readFileSync(p, 'utf8');

// Complete line-by-line replacement map
// Key: garbled text fragment -> Value: correct Chinese
const fixes = [
  // Alert dialogs
  ["Alert.alert('\u786e', '\u786e\u5220\u951f\u7686\u308f\u62f7\u951f\u65a4", "Alert.alert('\u786e\u8ba4', '\u786e\u5b9a\u5220\u9664\u8fd9\u4e2a\u9884\u7b97\u5417"],
  ["{ text: '\u53d6', style: 'cancel' }", "{ text: '\u53d6\u6d88', style: 'cancel' }"],
  ["{ text: '\u5220', style: 'destructive'", "{ text: '\u5220\u9664', style: 'destructive'"],
  ["\u52a0\u8f7d\u4e2d...", "\u52a0\u8f7d\u4e2d..."],

  // JSX text nodes  
  ['>\u9884</Text>', '>\u9884\u7b97</Text>'],
  ['>\u9884</Text>', '>\u9884\u7b97</Text>'],  // might appear twice

  // Tab labels
  ['textActive}>\u6708</Text>', 'textActive}>\u6708\u5ea6</Text>'],
  ['text}>\u6708</Text>', 'text}>\u6708\u5ea6</Text>'],
  ['textActive}>\u5e74</Text>', 'textActive}>\u5e74\u5ea6</Text>'],
  ['text}>\u5e74</Text>', 'text}>\u5e74\u5ea6</Text>'],

  // Total card labels
  ['>\u6708\u5ea6\u603b\u9884</Text>', '>\u6708\u5ea6\u603b\u9884\u7b97</Text>'],
  ['>\u5e74\u5ea6\u603b\u9884</Text>', '>\u5e74\u5ea6\u603b\u9884\u7b97</Text>'],

  // Section titles
  ['>\u5206\u7c7b\u9884</Text>', '>\u5206\u7c7b\u9884\u7b97</Text>'],
  ['>\u6708\u5ea6\u660e</Text>', '>\u6708\u5ea6\u660e\u7ec6</Text>'],

  // Empty states
  ['>\u6682\u65e0\u5206\u7c7b\u9884</Text>', '>\u6682\u65e0\u5206\u7c7b\u9884\u7b97</Text>'],
  ['>...</Text>', '>\u52a0\u8f7d\u4e2d...</Text>'],

  // Budget details
  ['\u5df2\u82b1 {', '\u5df2\u82b1 {'],
  [' / \u9884 {', ' / \u9884\u7b97 {'],
  ['\u5df2\u82b1\uff1a{', '\u5df2\u82b1\uff1a{'],
  ['\u5269\u4f59\uff1a{', '\u5269\u4f59\uff1a{'],

  // Modal
  ['>\u7f16\u8f91\u9884</Text>', '>\u7f16\u8f91\u9884\u7b97</Text>'],
  ['>\u6dfb\u52a0\u9884</Text>', '>\u6dfb\u52a0\u9884\u7b97</Text>'],

  // Modal labels
  ['\u9884\u91d1\u989d\uff08\u5143', '\u9884\u7b97\u91d1\u989d\uff08\u5143\uff09'],

  // Buttons
  ['>\u4fdd\u5b58</Text>', '>\u4fdd\u5b58</Text>'],
  ['>\u53d6</Text>', '>\u53d6\u6d88</Text>'],

  // Budget name fallback
  ["|| '\u672a", "|| '\u672a\u5206\u7c7b"],

  // Year detail
  ['{m.month}\u6708', '{m.month}\u6708'],

  // title prop
  ['title="\u6dfb\u52a0\u9884"', 'title="\u6dfb\u52a0\u9884\u7b97"'],
];

for (const [from, to] of fixes) {
  c = c.replaceAll(from, to);
}

writeFileSync(p, c, 'utf8');

// Verify
const check = readFileSync(p, 'utf8');
const lines = check.split('\n');
let bad = 0;
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  // Check for any char in 0xC0-0xFF range that's not part of valid UTF-8 Chinese
  if (l.match(/[\u00c0-\u00ff]{2,}/) || l.match(/\u951f\u65a4\u62f7/)) {
    console.log(`BAD L${i+1}: ${l.trim().substring(0, 100)}`);
    bad++;
  }
}
console.log(`Total bad lines: ${bad}`);
