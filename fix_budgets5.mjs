import { readFileSync, writeFileSync } from 'fs';

const p = 'E:\\项目合集\\理财app\\apps\\mobile\\app\\(tabs)\\budgets.tsx';
let c = readFileSync(p, 'utf8');

// Comprehensive replacements using exact Unicode sequences
const fixes = [
  // L59: Alert.alert('示', '效锟?) -> 提示, 请输入有效金额
  ["Alert.alert('\u793a', '\u6548\u951f\u6544?)", "Alert.alert('\u63d0\u793a', '\u8bf7\u8f93\u5165\u6709\u6548\u91d1\u989d')"],
  
  // L110: tabTextActive >锟铰讹拷< -> 月度
  ['\u951f\u94f0\u8bb9\u62f7</Text>', '\u6708\u5ea6</Text>'],
  
  // L113: tabText >锟铰讹拷< -> 月度  (same pattern, replaceAll handles both)
  
  // L119: tabTextActive >锟?< -> 年度
  // This is tricky - the garbled text is just 1 char 锟 before ?
  // Let me find the exact pattern
];

// Do all replacements
for (const [from, to] of fixes) {
  c = c.replaceAll(from, to);
}

// Now handle remaining ones by finding 锟 and replacing context
// Pattern: >锟铰讹拷< should be 月度 (appears in tab labels)
c = c.replaceAll('>\u951f\u94f0\u8bb9\u62f7<', '>\u6708\u5ea6<');

// Pattern: >锟? should be 年度 (tab text)
// Find ">锟?" in context of tabText
c = c.replaceAll("tabTextActive}>\u951f\u6544?</Text>", "tabTextActive}>\u5e74\u5ea6</Text>");
c = c.replaceAll("text}>\u951f\u6544?</Text>", "text}>\u5e74\u5ea6</Text>");

// L142: >锟窖伙拷{ -> 已花：{
c = c.replaceAll('\u951f\u7a95\u4f19\u62f7{', '\u5df2\u82b1\uff1a{');
c = c.replaceAll('\u951f\u7a95\u4f19\u62f7 {', '\u5df2\u82b1 {');

// L143: >剩锟洁：{ -> 剩余：{
c = c.replaceAll('\u5269\u951f\u6d01\uff1a{', '\u5269\u4f59\uff1a{');

// L153: >锟睫凤拷预< -> 暂无分类预算
c = c.replaceAll('\u951f\u7758\u51e4\u62f7\u9884', '\u6682\u65e0\u5206\u7c7b\u9884\u7b97');

// L169: >锟窖伙拷 { / 预算 { -> 已花 { / 预算 { (already handled above)

// L182: >锟皆わ拷锟?< -> 年度总预算
c = c.replaceAll('\u951f\u7686\u308f\u62f7\u951f\u6544?', '\u5e74\u5ea6\u603b\u9884\u7b97');

// L186: same as L142

// L187: same as L143

// L192: >锟铰讹拷细< -> 月度明细
c = c.replaceAll('\u951f\u94f0\u8bb9\u62f7\u7ec6', '\u6708\u5ea6\u660e\u7ec6');

// L234: modalLabel >选啵...< -> 选择分类（可选，留空为总预算）
// This is a long garbled string - find it
const modalLabelIdx = c.indexOf('\u9009\u5576\u02e7\u62f7');
if (modalLabelIdx >= 0) {
  // Find the closing </Text>
  const endIdx = c.indexOf('</Text>', modalLabelIdx);
  if (endIdx >= 0) {
    c = c.substring(0, modalLabelIdx) + '\u9009\u62e9\u5206\u7c7b\uff08\u53ef\u9009\uff0c\u7559\u7a7a\u4e3a\u603b\u9884\u7b97\uff09' + c.substring(endIdx);
    console.log('Fixed modalLabel 1');
  }
}

// L252: >预锟筋（元< -> 预算金额（元）
c = c.replaceAll('\u9884\u951f\u7b4b\uff08\u5143', '\u9884\u7b97\u91d1\u989d\uff08\u5143\uff09');

writeFileSync(p, c, 'utf8');

// Final check
const lines = c.split('\n');
let bad = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('\u951f')) {
    console.log(`BAD L${i+1}: ${lines[i].trim().substring(0, 100)}`);
    bad++;
  }
}
console.log(`Remaining bad: ${bad}`);
