// 「未来表情包」端到端自检：用 CDP 驱动无头浏览器，验证浏览 / 筛选 / 复制 / 大图预览。
//
// 用法：
//   1) 起静态服务：  node serve-local.js 8123
//   2) 起无头浏览器：msedge --headless=new --remote-debugging-port=9222 --user-data-dir=%TEMP%\edge-sticker about:blank
//   3) 跑本脚本：    node tools/e2e-stickers.js 9222 http://127.0.0.1:8123/

const port = process.argv[2] || '9222';
const pageUrl = process.argv[3] || 'http://127.0.0.1:8123/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getTarget() {
    for (let i = 0; i < 40; i++) {
        try {
            const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
            const p = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
            if (p) return p;
        } catch (e) { /* 浏览器还没起来 */ }
        await sleep(300);
    }
    throw new Error('找不到 CDP 调试目标');
}

const TEST_JS = `(async () => {
  const log = [];
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const q = s => document.querySelector(s);
  const n = s => document.querySelectorAll(s).length;

  for (let i = 0; i < 80 && n('.sb-card') === 0; i++) await wait(150);

  const data = window.STICKER_DATA;
  log.push('① 清单: ' + data.items.length + ' 张 / ' + data.dirs.length + ' 个目录');

  // 布局
  await wait(400);
  const grid = q('#sb-grid');
  const first = q('.sb-card');
  log.push('② 瀑布流: 卡片 ' + n('.sb-card') + ' | grid 高 ' + grid.style.height +
           ' | 首卡宽 ' + first.style.width + ' transform=' + first.style.transform);

  // 缩略图真的加载出来了？
  await wait(900);
  const imgs = [...document.querySelectorAll('.sb-card img')];
  const broken = imgs.filter(im => im.complete && im.naturalWidth === 0).length;
  const loaded = imgs.filter(im => im.naturalWidth > 0).length;
  log.push('③ 缩略图: 已解码 ' + loaded + ' / ' + imgs.length + '，损坏 ' + broken);

  log.push('④ 侧栏: ' + [...document.querySelectorAll('.sb-dir')].map(d =>
      d.textContent.replace(/\\s+/g, ' ').trim()).join(' | '));

  // 目录 ∩ 关键字 的交集筛选
  const inp = q('#sb-q');
  inp.value = '我';
  inp.dispatchEvent(new Event('input', { bubbles: true }));
  await wait(800);
  log.push('⑤ 搜索「我」: 卡片=' + n('.sb-card') + ' 高亮=' + n('.sb-text mark'));
  log.push('   侧栏命中数: ' + [...document.querySelectorAll('.sb-dir')].map(d =>
      d.textContent.replace(/\\s+/g, ' ').trim()).join(' | '));

  const dirBtn = [...document.querySelectorAll('.sb-dir')].find(d => d.dataset.dir === '喜多川穷哥');
  dirBtn.click();
  await wait(500);
  log.push('⑥ 再叠加目录「喜多川穷哥」: 视图=' + q('#sb-view').textContent +
           ' 卡片=' + n('.sb-card') + ' 徽标=' + q('#sb-count').textContent);
  log.push('   命中注释: ' + [...document.querySelectorAll('.sb-text')].slice(0, 3)
      .map(e => e.textContent.replace(/\\s+/g, ' ').trim()).join(' ‖ '));

  // 交集为空 → 提示其它目录还有
  inp.value = '好消息';
  inp.dispatchEvent(new Event('input', { bubbles: true }));
  await wait(800);
  log.push('⑦ 交集为空: 卡片=' + n('.sb-card') + ' 空态=' + !q('#sb-empty').hidden);
  log.push('   空态文案: ' + q('#sb-empty').textContent.replace(/\\s+/g, ' ').trim());

  // 回全部 + 清空恢复
  [...document.querySelectorAll('.sb-dir')].find(d => d.dataset.dir === '').click();
  await wait(400);
  log.push('⑧ 回到全部（仍带搜索）: 卡片=' + n('.sb-card') + ' 徽标数=' + n('.sb-dirtag'));

  // Esc 清空搜索，并确认侧栏计数跟着回到全量
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await wait(400);
  log.push('⑨ Esc 清空: 卡片=' + n('.sb-card') + ' 输入框="' + q('#sb-q').value + '" 侧栏: ' +
      [...document.querySelectorAll('.sb-dir')].map(d =>
          d.textContent.replace(/\\s+/g, ' ').trim()).join(' | '));

  q('#sb-qclear').click();
  await wait(700);
  log.push('⑨b 清空按钮: 卡片=' + n('.sb-card'));

  // 大图预览
  q('.sb-card .sb-imgbox').click();
  await wait(700);
  const lb = q('#sb-lb');
  const lbImg = q('#sb-lb-img');
  log.push('⑨ 大图预览: 打开=' + !lb.hidden + ' 页码=' + q('#sb-lb-page').textContent +
           ' 原图=' + lbImg.naturalWidth + 'x' + lbImg.naturalHeight +
           ' 注释=' + q('#sb-lb-kw').textContent.replace(/\\s+/g, ' ').trim().slice(0, 30));
  q('#sb-lb-next').click();
  await wait(300);
  log.push('   下一张: 页码=' + q('#sb-lb-page').textContent);
  q('#sb-lb-prev').click();
  await wait(300);
  q('#sb-lb-close').click();
  await wait(200);
  log.push('   关闭: ' + lb.hidden);

  // 复制到剪贴板（无头浏览器里验证 ClipboardItem 的 png 字节数）
  const cardIt = window.STICKER_DATA.items[0];
  const res = await fetch('assets/stickers/full/' + cardIt.id + '.webp');
  const blob = await res.blob();
  const bmp = await createImageBitmap(blob);
  const cv = document.createElement('canvas');
  cv.width = bmp.width; cv.height = bmp.height;
  cv.getContext('2d').drawImage(bmp, 0, 0);
  const png = await new Promise(ok => cv.toBlob(ok, 'image/png'));
  let clipOk = 'n/a';
  try {
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
    const back = await navigator.clipboard.read();
    clipOk = '写入+读回 ' + back[0].types.join(',');
  } catch (e) { clipOk = '异常 ' + e.name + ': ' + e.message; }
  log.push('⑩ 复制: webp ' + blob.type + ' ' + blob.size + 'B -> png ' + png.size + 'B @' +
           bmp.width + 'x' + bmp.height + ' | 剪贴板 ' + clipOk);

  log.push('⑪ 页面错误: ' + JSON.stringify(window.__errs || []));

  // ⑫ 瀑布流几何：卡片不能互相压住，也不能超出 grid 高度
  const rects = [...document.querySelectorAll('.sb-card')].map(c => c.getBoundingClientRect());
  let overlaps = 0, worst = '';
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i], b = rects[j];
      const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (ox > 1 && oy > 1) { overlaps++; if (!worst) worst = i + '×' + j + ' 重叠 ' + ox.toFixed(0) + 'x' + oy.toFixed(0); }
    }
  }
  const gridRect = grid.getBoundingClientRect();
  const maxBottom = Math.max(...rects.map(r => r.bottom)) - gridRect.top;
  const declared = parseFloat(grid.style.height);
  log.push('⑫ 几何: 重叠=' + overlaps + (worst ? ' (' + worst + ')' : '') +
           ' | 最高卡片底边=' + maxBottom.toFixed(0) + 'px, grid 声明高=' + declared.toFixed(0) + 'px' +
           ' | 溢出=' + (maxBottom > declared + 2));

  // ⑬ 首页入口 + 其它工具页回归
  location.hash = '';
  await wait(700);
  const card = [...document.querySelectorAll('.cassette-card')]
      .find(c => c.textContent.includes('未来表情包'));
  log.push('⑬ 首页卡片: 找到=' + !!card +
           ' | 图标已渲染=' + !!(card && card.querySelector('svg')) +
           ' | 描述=' + (card ? card.querySelector('.text-xs').textContent.trim() : ''));
  card.click();
  await wait(900);
  log.push('   点卡片后: hash=' + location.hash + ' 卡片=' + n('.sb-card') +
           ' 标题=' + (q('#sb-view') || {}).textContent);

  for (const route of ['counter', 'dice', 'text-map', 'character-intro', 'card-game']) {
    location.hash = route;
    await wait(450);
    const mc = q('#main-content');
    const broken = !mc || mc.textContent.includes('模块加载错误') || mc.textContent.includes('未找到模块');
    log.push('   回归 ' + route + ': ' + (broken ? '❌ 失败' : '✅ ' + mc.children.length + ' 个子节点'));
  }

  log.push('⑭ 全程页面错误: ' + JSON.stringify(window.__errs || []));
  return log.join('\\n');
})()`;

const MOBILE_JS = `(async () => {
  const log = [];
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const q = s => document.querySelector(s);
  const n = s => document.querySelectorAll(s).length;
  for (let i = 0; i < 80 && n('.sb-card') === 0; i++) await wait(150);
  await wait(700);
  if (!n('.sb-card')) return '窄屏：卡片没渲染出来';

  const aside = q('aside').getBoundingClientRect();
  const grid = q('#sb-grid').getBoundingClientRect();
  log.push('⑮ 窄屏 ' + window.innerWidth + '×' + window.innerHeight + ':');
  log.push('   侧栏底=' + aside.bottom.toFixed(0) + ' 网格顶=' + grid.top.toFixed(0) +
           ' 竖排堆叠=' + (aside.bottom <= grid.top + 1));
  log.push('   横向溢出: scrollWidth=' + document.documentElement.scrollWidth +
           ' vs 视口=' + window.innerWidth + ' → ' +
           (document.documentElement.scrollWidth <= window.innerWidth + 1 ? '无' : '有'));
  log.push('   卡片 ' + n('.sb-card') + ' 张，首卡宽=' + q('.sb-card').style.width +
           '，侧栏内目录 ' + n('.sb-dir') + ' 项横向可滚');

  q('.sb-card .sb-imgbox').click();
  await wait(800);
  const m = q('#sb-lb .sb-modal').getBoundingClientRect();
  log.push('   弹窗 ' + m.width.toFixed(0) + '×' + m.height.toFixed(0) +
           ' 在视口内=' + (m.left >= -1 && m.right <= window.innerWidth + 1 && m.height <= window.innerHeight + 1));
  q('#sb-lb-close').click();
  log.push('   错误: ' + JSON.stringify(window.__errs || []));
  return log.join('\\n');
})()`;

(async () => {
    const target = await getTarget();
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    let id = 0;
    const pending = new Map();
    const send = (method, params) => new Promise((res, rej) => {
        const mid = ++id;
        pending.set(mid, { res, rej });
        ws.send(JSON.stringify({ id: mid, method, params: params || {} }));
    });
    ws.addEventListener('message', (e) => {
        const msg = JSON.parse(e.data);
        if (msg.id && pending.has(msg.id)) {
            const { res, rej } = pending.get(msg.id);
            pending.delete(msg.id);
            msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result);
        }
    });
    await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });

    await send('Runtime.enable');
    await send('Page.enable');
    await send('Browser.grantPermissions', {
        origin: new URL(pageUrl).origin,
        permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'],
    });
    await send('Page.addScriptToEvaluateOnNewDocument', {
        source: `window.__errs=[];addEventListener('error',e=>window.__errs.push(String(e.message)));` +
            `addEventListener('unhandledrejection',e=>window.__errs.push('rej:'+String(e.reason&&e.reason.message||e.reason)));`,
    });
    await send('Emulation.setDeviceMetricsOverride', {
        width: 1440, height: 900, deviceScaleFactor: 1, mobile: false,
    });
    // 注意：只改 hash 的导航不会重新加载文档，加个查询参数强制拿最新的 JS
    await send('Page.navigate', { url: pageUrl + '?e2e=' + Date.now() + '#sticker-book' });
    await sleep(3500);

    const out = await send('Runtime.evaluate', {
        expression: TEST_JS, awaitPromise: true, returnByValue: true,
    });
    if (out.exceptionDetails) {
        console.log('页面异常: ' + JSON.stringify(out.exceptionDetails.exception || out.exceptionDetails));
        process.exitCode = 1;
    }
    console.log(out.result && out.result.value);

    // --- 窄屏复检 ---
    await send('Emulation.setDeviceMetricsOverride', {
        width: 390, height: 844, deviceScaleFactor: 2, mobile: true,
    });
    await send('Page.navigate', { url: pageUrl + '?e2e=' + Date.now() + '#sticker-book' });
    await sleep(3500);
    const out2 = await send('Runtime.evaluate', {
        expression: MOBILE_JS, awaitPromise: true, returnByValue: true,
    });
    if (out2.exceptionDetails) {
        console.log('窄屏异常: ' + JSON.stringify(out2.exceptionDetails.exception || out2.exceptionDetails));
        process.exitCode = 1;
    }
    console.log(out2.result && out2.result.value);

    ws.close();
    process.exit(process.exitCode || 0);
})().catch((e) => { console.error('测试失败: ' + e.message); process.exit(1); });
