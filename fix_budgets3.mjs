import { readFileSync, writeFileSync } from 'fs';

const p = 'E:\\项目合集\\理财app\\apps\\mobile\\app\\(tabs)\\budgets.tsx';
let c = readFileSync(p, 'utf8');

// Direct string replacements for every garbled Chinese text
const fixes = [
  // L59: Alert.alert('示', '效锟?) -> 提示, 请输入有效金额
  ["Alert.alert('\u793a', '\u6548\u951f\u6544?)", "Alert.alert('\u63d0\u793a', '\u8bf7\u8f93\u5165\u6709\u6548\u91d1\u989d')"],

  // L76: Alert.alert('失', err... || '锟皆猴拷') -> 失败, 请稍后重试
  ["Alert.alert('\u5931', err.", "Alert.alert('\u5931\u8d25', err."],
  ["|| '\u951f\u7686\u7334\u62f7')", "|| '\u8bf7\u7a0d\u540e\u91cd\u8bd5')"],

  // L81: Alert.alert('确', '确删锟皆わ拷锟?, [ -> 确认, 确定删除这个预算吗
  ["Alert.alert('\u786e', '\u786e\u5220\u951f\u7686\u308f\u62f7\u951f\u65a4?, [", "Alert.alert('\u786e\u8ba4', '\u786e\u5b9a\u5220\u9664\u8fd9\u4e2a\u9884\u7b97\u5417', ["],

  // L82: { text: '取消' -> already OK

  // L83: { text: '删除' -> already OK

  // L102: >预算< -> already OK

  // L120: tabTextActive >锟?< -> 月度
  ['tabTextActive}>\u951f\u6544?</Text>', 'tabTextActive}>\u6708\u5ea6</Text>'],

  // L123: tabText >锟?< -> 月度
  ['text}>\u951f\u6544?</Text>', 'text}>\u6708\u5ea6</Text>'],

  // L139: totalLabel >锟铰讹拷预< -> 月度总预算
  ['totalLabel}>\u951f\u94f0\u8bb9\u62f7\u9884</Text>', 'totalLabel}>\u6708\u5ea6\u603b\u9884\u7b97</Text>'],

  // L143: totalDetail >锟窖伙拷{ -> 已花：{
  ['totalDetail}>\u951f\u7a95\u4f19\u62f7{formatMoney(overall.spent)}', 'totalDetail}>\u5df2\u82b1\uff1a{formatMoney(overall.spent)}'],

  // L154: empty >锟睫凤拷预< -> 暂无分类预算
  ['empty}>\u951f\u7758\u51e4\u62f7\u9884</Text>', 'empty}>\u6682\u65e0\u5206\u7c7b\u9884\u7b97</Text>'],

  // L234: modalTitle >'锟洁辑预' : '预'< -> 编辑预算 : 添加预算
  ["? '\u951f\u6d01\u8f91\u9884' : '\u9884'", "? '\u7f16\u8f91\u9884\u7b97' : '\u6dfb\u52a0\u9884\u7b97'"],

  // L235: modalLabel >选啵...< -> 选择分类（可选，留空为总预算）
  ['>选\u5576\u02e7\u62f7\u951f\u7a95\u2605\u62f7\u951f\u8f7f\u0316\u62f7\u951f\u7686\u308f\u62f7\u60b5?</Text>', '>\u9009\u62e9\u5206\u7c7b\uff08\u53ef\u9009\uff0c\u7559\u7a7a\u4e3a\u603b\u9884\u7b97\uff09</Text>'],

  // L253: modalLabel >预...(元< -> 预算金额（元）
  ['>\u9884\u7b4b\u7b4b\uff08\u5143?</Text>', '>\u9884\u7b97\u91d1\u989d\uff08\u5143\uff09</Text>'],

  // L265: cancelBtnText >取< -> 取消
  ['cancelBtnText}>\u53d6</Text>', 'cancelBtnText}>\u53d6\u6d88</Text>'],

  // L268: saveBtnText >< -> 保存
  ['saveBtnText}></Text>', 'saveBtnText}>\u4fdd\u5b58</Text>'],

  // Modal title with add/edit
  ["{ editingBudget ? '\u7f16\u8f91\u9884' : '\u6dfb\u52a0\u9884' }", "{ editingBudget ? '\u7f16\u8f91\u9884\u7b97' : '\u6dfb\u52a0\u9884\u7b97' }"],

  // Year total
  ['>\u5e74\u5ea6\u603b\u9884</Text>', '>\u5e74\u5ea6\u603b\u9884\u7b97</Text>'],

  // Month detail section
  ['>\u6708\u5ea6\u660e</Text>', '>\u6708\u5ea6\u660e\u7ec6</Text>'],

  // Category budget name fallback
  ["|| '\u672a", "|| '\u672a\u5206\u7c7b"],

  // Budget detail: 已花 ... / 预算 ...
  ['\u52a0\u8f7d\u4e2d...', '\u52a0\u8f7d\u4e2d...'],

  // title prop
  ['title="\u6dfb\u52a0\u9884"', 'title="\u6dfb\u52a0\u9884\u7b97"'],

  // Year month
  ['{m.month}\u6708</Text>', '{m.month}\u6708</Text>'],
];

for (const [from, to] of fixes) {
  c = c.replaceAll(from, to);
}

writeFileSync(p, c, 'utf8');

// Verify
const lines = c.split('\n');
let bad = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].match(/[\u00c0-\u00ff]{2,}/) || lines[i].match(/\u951f\u65a4\u62f7/)) {
    console.log(`BAD L${i+1}: ${lines[i].trim().substring(0, 100)}`);
    bad++;
  }
}
console.log(`Bad lines: ${bad}`);
