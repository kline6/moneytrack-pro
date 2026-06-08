import { readFileSync, writeFileSync } from 'fs';

const p = 'E:\\项目合集\\理财app\\apps\\mobile\\app\\(tabs)\\budgets.tsx';
let c = readFileSync(p, 'utf8');

// L81: Exact match with the garbled chars
// The garbled text is: '确', '确删锟皆わ拷锟?, [
// Need to match: Alert.alert('确', '确删锟皆わ拷锟?, [
// Unicode: U+786E U+786E U+5220 U+951F U+7686 U+308F U+62F7 U+951F
const garbled81 = "Alert.alert('\u786e', '\u786e\u5220\u951f\u7686\u308f\u62f7\u951f\u65a4?, [";
const correct81 = "Alert.alert('\u786e\u8ba4', '\u786e\u5b9a\u5220\u9664\u8fd9\u4e2a\u9884\u7b97\u5417', [";

if (c.includes(garbled81)) {
  c = c.replace(garbled81, correct81);
  console.log('Fixed L81');
} else {
  // Try to find it differently
  const idx = c.indexOf('\u786e\u5220\u951f\u7686');
  if (idx >= 0) {
    const context = c.substring(idx - 20, idx + 40);
    console.log('Found context:', JSON.stringify(context));
    // Replace from context
    c = c.substring(0, idx - 10) + "'\u786e\u8ba4', '\u786e\u5b9a\u5220\u9664\u8fd9\u4e2a\u9884\u7b97\u5417'" + c.substring(idx + 20);
    console.log('Fixed L81 via context');
  } else {
    console.log('Could not find L81 garbled text');
    // Search for any remaining 锟
    const kuiIdx = c.indexOf('\u951f');
    if (kuiIdx >= 0) {
      console.log('Found 锟 at index', kuiIdx, ':', JSON.stringify(c.substring(kuiIdx - 10, kuiIdx + 20)));
    }
  }
}

writeFileSync(p, c, 'utf8');

// Final check
const lines = c.split('\n');
let bad = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].match(/[\u951f]/)) {
    console.log(`REMAINING BAD L${i+1}: ${lines[i].trim().substring(0, 100)}`);
    bad++;
  }
}
console.log(`Remaining bad: ${bad}`);
