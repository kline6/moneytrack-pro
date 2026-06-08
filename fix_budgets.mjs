import { readFileSync, writeFileSync } from 'fs';

const p = 'E:\\项目合集\\理财app\\apps\\mobile\\app\\(tabs)\\budgets.tsx';
let c = readFileSync(p, 'utf8');

// Replace all garbled Chinese sequences
// Each garbled string was: original UTF-8 Chinese -> read as GBK -> written as UTF-8
// The garbled chars are in Latin-1 supplement range (U+00C0-U+00FF) plus some CJK fragments

// Strategy: find each JSX text node with garbled content and replace with correct Chinese
const lineFixes = [
  // Line 59: Alert.alert
  { find: /Alert\.alert\('[^']*',\s*'[^']*'\); return; \}/, replace: "Alert.alert('\u63d0\u793a', '\u8bf7\u8f93\u5165\u6709\u6548\u91d1\u989d'); return; }" },
  // Line 76: Alert.alert error  
  { find: /Alert\.alert\('[^']*',\s*err\.\w+\?\.\w+\?\.\w+\s*\|\|\s*'[^']*'\)/, replace: "Alert.alert('\u5931\u8d25', err.response?.data?.error?.message || '\u8bf7\u7a0d\u540e\u91cd\u8bd5')" },
  // Line 81-83: confirm dialog
  { find: /Alert\.alert\('[^']*确[^']*'\s*,\s*'确[^']*'\s*,\s*\[/, replace: "Alert.alert('\u786e\u8ba4', '\u786e\u5b9a\u5220\u9664\u8fd9\u4e2a\u9884\u7b97\u5417', [" },
  { find: /\{\s*text:\s*'取[^']*'\s*,\s*style:\s*'cancel'\s*\}/, replace: "{ text: '\u53d6\u6d88', style: 'cancel' }" },
  { find: /\{\s*text:\s*'删[^']*'\s*,\s*style:\s*'destructive'/, replace: "{ text: '\u5220\u9664', style: 'destructive'" },
  // JSX text content - find all <Text ...>garbled</Text> patterns
];

for (const fix of lineFixes) {
  c = c.replace(fix.find, fix.replace);
}

// Now handle all remaining garbled JSX text
// Find patterns like }>garbled< or title="garbled"
const garbledInJsx = />\s*([\u00c0-\u00ff\u951f\u65a4\u62f7\u6548\u786e\u5220\u53d6\u951f]+[^<]{0,30})\s*</g;
const jsxMap = {
  '\u9884': '\u9884\u7b97',  // 预 -> 预算
};

// Actually let me just do a comprehensive line-by-line fix
// Read the file again clean
c = readFileSync(p, 'utf8');

// Fix every line that has garbled content
const replacements = [
  // Header title
  ['>预</Text>', '>\u9884\u7b97</Text>'],
  // Tab labels - month
  ['textActive}>月</Text>', 'textActive}>\u6708\u5ea6</Text>'],
  ['text}>月</Text>', 'text}>\u6708\u5ea6</Text>'],
  // Tab labels - year  
  ['textActive}>年</Text>', 'textActive}>\u5e74\u5ea6</Text>'],
  ['text}>年</Text>', 'text}>\u5e74\u5ea6</Text>'],
];

for (const [from, to] of replacements) {
  c = c.replaceAll(from, to);
}

writeFileSync(p, c, 'utf8');
console.log('Done. Checking remaining garbled...');

const check = readFileSync(p, 'utf8');
const garbledCount = (check.match(/[\u00c0-\u00ff]{3,}/g) || []).length;
console.log(`Remaining garbled sequences: ${garbledCount}`);
