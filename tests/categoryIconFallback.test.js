import test from 'node:test';
import assert from 'node:assert/strict';

// Match the same category-key resolution used by the rendered category list and edit sheet.
const resolveIcon = (icons, flow, mode, parent, name, suggest) => {
  const key = mode === 'sub' ? `${flow}/sub/${parent}/${name}` : `${flow}/main/${name}`;
  return mode === 'sub'
    ? (icons[key] || icons[`${flow}/main/${parent}`] || suggest(parent || ''))
    : (icons[key] || suggest(name || ''));
};

test('子分類未單獨設定圖示時，編輯視窗與外層一樣沿用主分類圖示', () => {
  assert.equal(resolveIcon({'expense/main/居家生活':'house'},'expense','sub','居家生活','瓦斯費',()=> 'tags'), 'house');
});
test('子分類有自訂圖示時，優先使用自己的圖示', () => {
  assert.equal(resolveIcon({'expense/main/居家生活':'house','expense/sub/居家生活/瓦斯費':'flame'},'expense','sub','居家生活','瓦斯費',()=> 'tags'), 'flame');
});
test('主分類既有圖示維持不變', () => {
  assert.equal(resolveIcon({'expense/main/居家生活':'house'},'expense','main','','居家生活',()=> 'tags'), 'house');
});
