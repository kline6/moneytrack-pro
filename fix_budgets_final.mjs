import { readFileSync, writeFileSync } from 'fs';

const p = 'E:\\项目合集\\理财app\\apps\\mobile\\app\\(tabs)\\budgets.tsx';
let c = readFileSync(p, 'utf8');

// Use line-by-line approach - find lines with 锟 and replace entire line content
const lines = c.split('\n');

for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  if (!l.includes('\u951f')) continue;
  
  // Determine what the line should contain based on context
  if (l.includes('Alert.alert') && l.includes('\u793a')) {
    lines[i] = "    if (!amountNum || amountNum <= 0) { Alert.alert('\u63d0\u793a', '\u8bf7\u8f93\u5165\u6709\u6548\u91d1\u989d'); return; }";
  }
  else if (l.includes('tabTextActive') && l.includes('\u951f\u6544')) {
    lines[i] = l.replace(/\u951f\u6544/, '\u5e74\u5ea6');
  }
  else if (l.includes('tabText') && l.includes('\u951f\u6544') && !l.includes('Active')) {
    lines[i] = l.replace(/\u951f\u6544/, '\u5e74\u5ea6');
  }
  else if (l.includes('totalDetail') && l.includes('\u951f\u7a95\u4f19\u62f7')) {
    lines[i] = l.replace('\u951f\u7a95\u4f19\u62f7', '\u5df2\u82b1\uff1a');
  }
  else if (l.includes('empty') && l.includes('\u951f')) {
    lines[i] = '                <Text style={styles.empty}>\u6682\u65e0\u5206\u7c7b\u9884\u7b97</Text>';
  }
  else if (l.includes('budgetDetail') && l.includes('\u951f\u7a95\u4f19\u62f7')) {
    lines[i] = l.replace('\u951f\u7a95\u4f19\u62f7', '\u5df2\u82b1');
  }
  else if (l.includes('totalLabel') && l.includes('\u951f')) {
    lines[i] = l.replace(/<Text[^>]*>[^<]*<\/Text>/, '<Text style={styles.totalLabel}>\u5e74\u5ea6\u603b\u9884\u7b97</Text>');
  }
  else if (l.includes('totalDetail') && l.includes('\u951f\u7a95\u4f19\u62f7') && l.includes('annual')) {
    lines[i] = l.replace('\u951f\u7a95\u4f19\u62f7', '\u5df2\u82b1\uff1a');
  }
  else if (l.includes('modalLabel') && l.includes('\u9009')) {
    lines[i] = '              <Text style={styles.modalLabel}>\u9009\u62e9\u5206\u7c7b\uff08\u53ef\u9009\uff0c\u7559\u7a7a\u4e3a\u603b\u9884\u7b97\uff09</Text>';
  }
  else if (l.includes('\u5269\u951f')) {
    lines[i] = l.replace('\u5269\u951f\u6d01\uff1a', '\u5269\u4f59\uff1a');
  }
  else {
    console.log(`UNHANDLED L${i+1}: ${l.trim().substring(0, 80)}`);
  }
}

c = lines.join('\n');
writeFileSync(p, c, 'utf8');

// Verify
let bad = 0;
const newLines = c.split('\n');
for (let i = 0; i < newLines.length; i++) {
  if (newLines[i].includes('\u951f')) {
    console.log(`STILL BAD L${i+1}: ${newLines[i].trim().substring(0, 100)}`);
    bad++;
  }
}
console.log(`Final bad: ${bad}`);
