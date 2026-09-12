// --- 未来表情包 (STICKER BOOK) ---
// 浏览 / 筛选 / 复制。数据与图片由 tools/build-stickers.py 从本地表情包目录生成，
// 写入 js/sticker-data.js 与 assets/stickers/**，本模块只读不写。
//
// 参考实现：D:\表情包\_manager\web\index.html（那边是本地 Python 服务端 + 可编辑 meta，
// 这里去掉编辑、扫描、拖拽排序，保留目录树、关键字搜索、瀑布流、大图预览与复制）。

window.App = window.App || {};
window.App.pages = window.App.pages || {};

(function () {
    'use strict';

    const FULL = (id) => `assets/stickers/full/${id}.webp`;
    const THUMB = (id) => `assets/stickers/thumb/${id}.webp`;

    // 模块级状态：跨路由保留，再次进入工具时回到上次看的目录与搜索词
    const S = {
        dir: '',
        q: '',
        items: [],
        cards: [],
        lbIndex: -1,
        gen: 0,
        onResize: null,
    };

    // 大图预览与提示条挂在 document.body 上，不放进页面 DOM：
    // 页面根节点带 .fade-in（animation-fill-mode: forwards 会永久保留 transform），
    // 而任何非 none 的 transform 都会让祖先成为 position:fixed 的包含块——
    // 那样浮层会按「整页高度」而不是「视口」去定位，弹窗直接飞到几屏之外，
    // 只剩遮罩铺满页面（看起来就是点了没反应）。挂到 body 上才不受影响。
    let overlay = null;

    function removeOverlay() {
        if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
        overlay = null;
    }

    // 路由离开本工具时自己收尸（core.js 不提供 destroy 钩子）
    window.addEventListener('hashchange', () => {
        const route = window.location.hash.replace(/^#/, '').replace(/\/$/, '');
        if (route !== 'sticker-book') removeOverlay();
    });

    const $ = (id) => document.getElementById(id);

    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));

    const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // 先转义再高亮，避免关键字里的 < > 破坏结构
    const hi = (text, q) => {
        const safe = esc(text);
        if (!q) return safe;
        try {
            return safe.replace(new RegExp(escapeRe(esc(q)), 'gi'), (m) => `<mark>${m}</mark>`);
        } catch (e) {
            return safe;
        }
    };

    const debounce = (fn, ms) => {
        let t;
        return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
    };

    const dataset = () => {
        const d = window.STICKER_DATA;
        return d && Array.isArray(d.items) && d.items.length ? d : null;
    };

    // ------------------------------------------------------------------ 样式
    function injectStyles() {
        if ($('sticker-book-styles')) return;
        const style = document.createElement('style');
        style.id = 'sticker-book-styles';
        style.textContent = `
        .sb-panel{
            background:#fff;border:1px solid #e4e4e7;border-radius:1.25rem;
            box-shadow:0 2px 4px -1px rgba(0,0,0,.04),0 8px 24px -12px rgba(0,0,0,.10);
        }
        .sb-dir{
            display:flex;align-items:center;gap:.5rem;width:100%;text-align:left;
            padding:.45rem .6rem;border-radius:.75rem;cursor:pointer;border:0;background:transparent;
            color:#52525b;font-size:.82rem;font-weight:700;transition:background .15s,color .15s;
        }
        .sb-dir:hover{background:#fafafa;color:#18181b}
        .sb-dir.on{background:#fff7ed;color:#ea580c}
        .sb-dir .sb-cnt{
            margin-left:auto;font-size:.68rem;font-weight:800;background:#f4f4f5;color:#71717a;
            border-radius:999px;padding:.05rem .45rem;font-variant-numeric:tabular-nums;
        }
        .sb-dir.on .sb-cnt{background:#ffedd5;color:#ea580c}
        .sb-dir.zero{opacity:.45}

        .sb-checker{
            background-image:
                linear-gradient(45deg,#f1f1f2 25%,transparent 25%,transparent 75%,#f1f1f2 75%),
                linear-gradient(45deg,#f1f1f2 25%,transparent 25%,transparent 75%,#f1f1f2 75%);
            background-size:18px 18px;background-position:0 0,9px 9px;background-color:#fcfcfc;
        }

        #sb-grid{position:relative;width:100%}
        .sb-card{
            position:absolute;top:0;left:0;will-change:transform;
            background:#fff;border:1px solid #e4e4e7;border-radius:1rem;overflow:hidden;
            display:flex;flex-direction:column;
            box-shadow:0 1px 2px rgba(0,0,0,.04),0 6px 16px -10px rgba(0,0,0,.12);
            transition:transform .24s cubic-bezier(.22,.61,.36,1),box-shadow .18s,border-color .18s;
        }
        #sb-grid.sb-noanim .sb-card{transition:none}
        .sb-card:hover{border-color:#fdba74;box-shadow:0 2px 6px rgba(0,0,0,.05),0 14px 34px -14px rgba(234,88,12,.35)}
        .sb-imgbox{
            position:relative;display:grid;place-items:center;overflow:hidden;cursor:zoom-in;
            border-bottom:1px solid #f4f4f5;
        }
        .sb-imgbox img{width:100%;height:100%;object-fit:contain;display:block}
        .sb-idx{
            position:absolute;left:.4rem;top:.4rem;background:rgba(24,24,27,.72);color:#fff;
            font-size:.68rem;font-weight:800;border-radius:.5rem;padding:.05rem .4rem;
            font-variant-numeric:tabular-nums;backdrop-filter:blur(2px);
        }
        .sb-idx.neg{background:rgba(245,158,11,.95)}
        .sb-long{
            position:absolute;right:.4rem;bottom:.4rem;background:rgba(0,0,0,.55);color:#fff;
            font-size:.65rem;font-weight:700;border-radius:.4rem;padding:.05rem .35rem;
        }
        .sb-body{padding:.5rem .6rem .6rem;display:flex;flex-direction:column;gap:.4rem}
        .sb-file{
            display:flex;align-items:center;gap:.35rem;font-size:.66rem;font-weight:700;color:#a1a1aa;
        }
        .sb-file span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .sb-dirtag{
            flex:0 0 auto;max-width:6rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
            background:#eef2ff;color:#4f46e5;border-radius:.35rem;padding:0 .3rem;font-weight:800;
        }
        .sb-text{
            font-size:.8rem;line-height:1.45;color:#27272a;white-space:pre-wrap;word-break:break-word;
            display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;min-height:1.05rem;
        }
        .sb-text.dim{color:#a1a1aa;font-style:italic;font-size:.75rem}
        .sb-text mark{background:#fde68a;color:inherit;border-radius:.2rem;padding:0 1px}
        .sb-acts{display:flex;gap:.35rem;margin-top:.1rem}
        .sb-btn{
            flex:1;display:inline-flex;align-items:center;justify-content:center;gap:.25rem;
            font-size:.72rem;font-weight:800;padding:.34rem .4rem;border-radius:.6rem;
            border:1px solid #e4e4e7;border-bottom-width:2px;background:#fff;color:#3f3f46;
            cursor:pointer;transition:all .12s;white-space:nowrap;
        }
        .sb-btn:hover{background:#fafafa;color:#18181b;border-color:#d4d4d8}
        .sb-btn:active{transform:translateY(1px);border-bottom-width:1px}
        .sb-btn.on{background:#ecfdf5;border-color:#a7f3d0;color:#047857}
        .sb-btn.warn{background:#fef2f2;border-color:#fecaca;color:#b91c1c}

        .sb-empty{padding:4rem 1rem;text-align:center;color:#a1a1aa}
        .sb-empty .big{font-size:2.5rem;margin-bottom:.5rem}

        .sb-mask{
            position:fixed;inset:0;background:rgba(9,9,11,.55);backdrop-filter:blur(3px);
            z-index:100;display:flex;align-items:center;justify-content:center;padding:1.25rem;
        }
        .sb-mask[hidden]{display:none}
        .sb-modal{
            background:#fff;border-radius:1.25rem;width:min(1080px,100%);max-height:90vh;
            display:flex;flex-direction:column;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.4);
        }
        .sb-modal-top{
            display:flex;align-items:center;gap:.6rem;padding:.7rem 1rem;border-bottom:1px solid #f4f4f5;
        }
        .sb-lb-wrap{display:flex;gap:1rem;padding:1rem;min-height:0;flex:1}
        .sb-lb-img{
            flex:1;min-width:0;display:grid;place-items:center;border:1px solid #e4e4e7;
            border-radius:1rem;overflow:hidden;max-height:72vh;
        }
        .sb-lb-img img{max-width:100%;max-height:72vh;object-fit:contain;display:block}
        .sb-lb-info{
            width:272px;flex:0 0 272px;display:flex;flex-direction:column;gap:.6rem;
            overflow:auto;max-height:72vh;
        }
        .sb-kw{
            background:#fafafa;border:1px solid #f4f4f5;border-radius:.75rem;padding:.6rem .7rem;
            font-size:.82rem;line-height:1.6;white-space:pre-wrap;word-break:break-word;min-height:3.5rem;
        }
        .sb-kv{display:flex;flex-wrap:wrap;gap:.35rem;font-size:.68rem;font-weight:800}
        .sb-kv .t{background:#f4f4f5;color:#52525b;border-radius:.45rem;padding:.12rem .45rem}
        .sb-kv .t.i{background:#fff7ed;color:#ea580c}
        .sb-kv .t.w{background:#fffbeb;color:#b45309}
        .sb-path{font-size:.66rem;color:#a1a1aa;word-break:break-all;line-height:1.5}

        #sb-toasts{position:fixed;right:1rem;bottom:1rem;display:flex;flex-direction:column;
            gap:.5rem;z-index:200;align-items:flex-end;pointer-events:none}
        .sb-toast{
            background:#18181b;color:#fff;padding:.55rem .9rem;border-radius:.75rem;
            font-size:.8rem;font-weight:700;box-shadow:0 10px 30px rgba(0,0,0,.3);
            animation:sbToastIn .18s ease-out;max-width:22rem;
        }
        .sb-toast.ok{background:#059669}
        .sb-toast.err{background:#dc2626}
        @keyframes sbToastIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}

        @media (max-width:1023px){
            .sb-lb-wrap{flex-direction:column}
            .sb-lb-info{width:auto;flex:0 0 auto;max-height:none}
            .sb-lb-img{max-height:44vh}
            .sb-lb-img img{max-height:44vh}
        }
        `;
        document.head.appendChild(style);
    }

    // ------------------------------------------------------------------ 提示
    function toast(msg, kind) {
        const box = $('sb-toasts');
        if (!box) return;
        const d = document.createElement('div');
        d.className = 'sb-toast ' + (kind || '');
        d.textContent = msg;
        box.appendChild(d);
        setTimeout(() => {
            d.style.transition = '.25s';
            d.style.opacity = '0';
            setTimeout(() => d.remove(), 250);
        }, kind === 'err' ? 3600 : 1900);
    }

    // ------------------------------------------------------------------ 筛选
    function haystackOf(it) {
        if (it._hay == null) {
            it._hay = (it.kw || []).join('\n').toLowerCase() + '\n' + it.f + '\n' + it.d;
        }
        return it._hay;
    }

    function computeItems() {
        const data = dataset();
        if (!data) return [];
        const q = S.q.trim().toLowerCase();
        return data.items.filter((it) => {
            if (S.dir && it.d !== S.dir) return false;
            if (q && haystackOf(it).indexOf(q) === -1) return false;
            return true;
        });
    }

    // 侧栏计数：搜索时显示每个目录的命中数，这样「目录 ∩ 关键字」的交集筛选一目了然
    function countIn(dirName) {
        const data = dataset();
        if (!data) return 0;
        const q = S.q.trim().toLowerCase();
        if (!q) {
            if (!dirName) return data.items.length;
            const hit = (data.dirs || []).find((d) => d.name === dirName);
            return hit ? hit.count : 0;
        }
        let n = 0;
        for (const it of data.items) {
            if (dirName && it.d !== dirName) continue;
            if (haystackOf(it).indexOf(q) !== -1) n++;
        }
        return n;
    }

    // ------------------------------------------------------------------ 渲染
    function dirsOf() {
        const data = dataset();
        return data ? data.dirs : [];
    }

    function renderSidebar() {
        const box = $('sb-dirs');
        if (!box) return;
        const searching = !!S.q.trim();
        const total = countIn('');
        const parts = [];

        parts.push(`
            <button class="sb-dir ${S.dir === '' ? 'on' : ''} ${total ? '' : 'zero'}" data-dir="">
                <span>🗂</span><span>全部表情</span><span class="sb-cnt">${total}</span>
            </button>`);

        for (const d of dirsOf()) {
            const c = countIn(d.name);
            parts.push(`
                <button class="sb-dir ${S.dir === d.name ? 'on' : ''} ${c ? '' : 'zero'}"
                        data-dir="${esc(d.name)}" title="${esc(d.name)}${searching ? `（命中 ${c}）` : ''}">
                    <span>📁</span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(d.name)}</span>
                    <span class="sb-cnt">${c}</span>
                </button>`);
        }
        box.innerHTML = parts.join('');
    }

    function renderToolbar() {
        const title = $('sb-view');
        const count = $('sb-count');
        if (!title || !count) return;
        const q = S.q.trim();
        title.textContent = q ? `搜索「${q}」` : (S.dir || '全部表情');

        const parts = [`<span class="t i">${S.items.length} 张</span>`];
        if (q && S.dir) parts.push(`<span class="t">限于「${esc(S.dir)}」</span>`);
        else if (q) parts.push('<span class="t">跨目录搜索</span>');
        else if (S.dir) parts.push('<span class="t">单目录</span>');
        else parts.push('<span class="t">按目录 + 序号排列</span>');
        count.innerHTML = parts.join('');
    }

    function renderGrid() {
        const grid = $('sb-grid');
        const empty = $('sb-empty');
        if (!grid || !empty) return;

        grid.innerHTML = '';
        S.cards = [];

        if (!S.items.length) {
            const q = S.q.trim();
            empty.hidden = false;
            if (q) {
                const elsewhere = countIn('');
                const hint = (S.dir && elsewhere)
                    ? `<br><span style="font-size:.82rem">「${esc(S.dir)}」里没有，其它目录还有 <b>${elsewhere}</b> 张 ——
                       点左侧「全部表情」查看</span>`
                    : `<br><span style="font-size:.82rem">换个关键字试试，例如「我」「好」「急」</span>`;
                empty.innerHTML = `<div class="big">🔍</div>没有找到包含「${esc(q)}」的表情${hint}`;
            } else {
                empty.innerHTML = `<div class="big">📭</div>这个目录里还没有表情`;
            }
            grid.style.height = '0px';
            return;
        }

        empty.hidden = true;
        const frag = document.createDocumentFragment();
        for (const it of S.items) {
            const card = buildCard(it);
            S.cards.push(card);
            frag.appendChild(card);
        }
        grid.appendChild(frag);

        grid.classList.add('sb-noanim');
        layout();
        requestAnimationFrame(() => requestAnimationFrame(() => grid.classList.remove('sb-noanim')));
    }

    function buildCard(it) {
        const card = document.createElement('div');
        card.className = 'sb-card';
        card.dataset.id = it.id;
        card.dataset.w = it.w || 4;
        card.dataset.h = it.h || 3;

        const kws = it.kw || [];
        const idx = it.i > 0 ? it.i : -1;
        const crossDir = !S.dir; // 只有「全部表情」视图才显示目录徽标
        const dirTag = crossDir && it.d
            ? `<span class="sb-dirtag" title="${esc(it.d)}">${esc(it.d)}</span>` : '';

        card.innerHTML = `
            <div class="sb-imgbox sb-checker">
                <span class="sb-idx ${idx < 0 ? 'neg' : ''}">${idx < 0 ? '-1' : '#' + idx}</span>
                <img loading="lazy" decoding="async" src="${THUMB(it.id)}" alt="${esc(it.f)}">
            </div>
            <div class="sb-body">
                <div class="sb-file" title="${esc(it.d ? it.d + '/' + it.f : it.f)}">
                    ${dirTag}<span>${esc(it.f)}</span>
                </div>
                ${kws.length
                    ? `<div class="sb-text">${hi(kws.join('\n'), S.q.trim())}</div>`
                    : `<div class="sb-text dim">（这张图没有关键字）</div>`}
                <div class="sb-acts">
                    <button class="sb-btn" data-act="copy" title="把图片复制到剪贴板（自动转 PNG）">📋 复制</button>
                </div>
            </div>`;

        card.querySelector('img').addEventListener('error', () => {
            card.querySelector('.sb-imgbox').style.opacity = '.35';
        });
        // 点图片本身就是看大图
        card.querySelector('.sb-imgbox').addEventListener('click', () => openLightbox(it.id));
        card.querySelector('[data-act="copy"]').addEventListener('click', (e) => {
            e.stopPropagation();
            copyImage(it, e.currentTarget);
        });
        return card;
    }

    // ------------------------------------------------------------ 瀑布流布局
    function layout() {
        const grid = $('sb-grid');
        if (!grid) return;
        const W = grid.clientWidth;
        if (!S.cards.length || !W) {
            grid.style.height = '0px';
            return;
        }

        const gap = 14;
        const minW = 210;
        const maxCols = 7;
        const maxImgH = 400;

        let cols = Math.max(1, Math.min(maxCols, Math.floor((W + gap) / (minW + gap))));
        const colW = Math.max(120, (W - gap * (cols - 1)) / cols);
        const heights = new Array(cols).fill(0);

        for (const card of S.cards) {
            card.style.width = colW.toFixed(1) + 'px';

            const w = +card.dataset.w || 4;
            const h = +card.dataset.h || 3;
            const natural = colW * h / w;
            const boxH = Math.min(natural, maxImgH);

            const box = card.querySelector('.sb-imgbox');
            box.style.height = Math.max(56, Math.round(boxH)) + 'px';

            const badge = box.querySelector('.sb-long');
            if (natural > maxImgH + 2 && !badge) {
                const b = document.createElement('span');
                b.className = 'sb-long';
                b.textContent = '长图';
                box.appendChild(b);
            } else if (natural <= maxImgH + 2 && badge) {
                badge.remove();
            }

            let c = 0;
            for (let i = 1; i < cols; i++) {
                if (heights[i] < heights[c] - 0.5) c = i;
            }
            const x = c * (colW + gap);
            const y = heights[c];
            card.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;

            // 直接量整张卡的高度（含边框），比「图片框 + 正文」估算更稳
            heights[c] = y + card.offsetHeight + gap;
        }
        grid.style.height = (Math.max(...heights) - gap) + 'px';
    }

    // ------------------------------------------------------------------ 复制
    function blobToPng(blob) {
        return createImageBitmap(blob).then((bmp) => {
            const cv = document.createElement('canvas');
            cv.width = bmp.width;
            cv.height = bmp.height;
            const ctx = cv.getContext('2d');
            ctx.drawImage(bmp, 0, 0);
            if (bmp.close) bmp.close();
            return new Promise((ok, no) => {
                cv.toBlob((b) => (b ? ok(b) : no(new Error('转 PNG 失败'))), 'image/png');
            });
        });
    }

    async function copyImage(it, btn) {
        const original = btn ? btn.innerHTML : '';
        if (btn) { btn.disabled = true; btn.textContent = '复制中…'; }
        try {
            if (!navigator.clipboard || !window.ClipboardItem) {
                throw new Error('浏览器不支持写入剪贴板图片');
            }
            const res = await fetch(FULL(it.id));
            if (!res.ok) throw new Error('读取图片失败');

            let blob = await res.blob();
            // 仓库里是 WebP，绝大多数聊天软件只吃 PNG，这里统一转一下
            if (blob.type !== 'image/png') blob = await blobToPng(blob);

            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
            if (btn) {
                btn.classList.add('on');
                btn.textContent = '✓ 已复制';
                setTimeout(() => {
                    btn.classList.remove('on');
                    btn.innerHTML = original;
                    btn.disabled = false;
                }, 1200);
            }
            toast('已复制到剪贴板 📋', 'ok');
        } catch (err) {
            if (btn) {
                btn.classList.add('warn');
                btn.textContent = '✗ 失败';
                setTimeout(() => {
                    btn.classList.remove('warn');
                    btn.innerHTML = original;
                    btn.disabled = false;
                }, 1600);
            }
            // 退路：至少把关键字复制走，方便手动搜
            const fallback = (it.kw || []).join(' ');
            try {
                if (fallback) await navigator.clipboard.writeText(fallback);
                toast('图片写入剪贴板失败（' + err.message + '），已复制文字', 'err');
            } catch (e2) {
                toast('复制失败：' + err.message, 'err');
            }
        }
    }

    // ------------------------------------------------------------ 大图预览
    function openLightbox(id) {
        const i = S.items.findIndex((x) => x.id === id);
        if (i < 0) return;
        S.lbIndex = i;
        showLightbox();
        const mask = $('sb-lb');
        if (mask) mask.hidden = false;
    }

    function showLightbox() {
        const it = S.items[S.lbIndex];
        if (!it) return;
        const img = $('sb-lb-img');
        const file = $('sb-lb-file');
        const kv = $('sb-lb-kv');
        const kw = $('sb-lb-kw');
        const path = $('sb-lb-path');
        const page = $('sb-lb-page');

        img.src = FULL(it.id);
        file.textContent = it.f;
        kv.innerHTML =
            `<span class="t i">序号 ${it.i > 0 ? it.i : '-1'}</span>` +
            `<span class="t">${esc(it.d || '根目录')}</span>` +
            `<span class="t">${it.w}×${it.h}</span>` +
            `<span class="t">${(it.s / 1024).toFixed(1)} KB</span>`;
        kw.innerHTML = (it.kw || []).length
            ? hi(it.kw.join('\n'), S.q.trim())
            : '<span style="color:#a1a1aa">（这张图没有关键字）</span>';
        path.textContent = it.d ? it.d + '/' + it.f : it.f;
        page.textContent = `${S.lbIndex + 1} / ${S.items.length}`;
    }

    function stepLightbox(d) {
        if (!S.items.length) return;
        S.lbIndex = (S.lbIndex + d + S.items.length) % S.items.length;
        showLightbox();
    }

    function closeLightbox() {
        const mask = $('sb-lb');
        if (mask) mask.hidden = true;
    }

    // ------------------------------------------------------------------ 页面
    // 浮层（大图预览 + 提示条）：挂到 document.body，见文件上方 overlay 的注释
    const OVERLAY_HTML = `
        <div id="sb-lb" class="sb-mask" hidden>
            <div class="sb-modal">
                <div class="sb-modal-top">
                    <i data-lucide="image" class="w-4 h-4 text-zinc-400"></i>
                    <span id="sb-lb-file" class="text-xs font-black text-zinc-700 truncate flex-1"></span>
                    <span id="sb-lb-page" class="text-[10px] font-black text-zinc-400 font-mono"></span>
                    <button id="sb-lb-close" class="sb-btn" style="flex:0 0 auto;padding:.3rem .6rem">关闭 (Esc)</button>
                </div>
                <div class="sb-lb-wrap">
                    <div class="sb-lb-img sb-checker"><img id="sb-lb-img" alt=""></div>
                    <div class="sb-lb-info">
                        <div id="sb-lb-kv" class="sb-kv"></div>
                        <div class="text-[10px] font-black text-zinc-400 tracking-widest">文字注释</div>
                        <div id="sb-lb-kw" class="sb-kw"></div>
                        <div id="sb-lb-path" class="sb-path"></div>
                        <div style="display:flex;gap:.35rem;margin-top:auto">
                            <button id="sb-lb-prev" class="sb-btn">← 上一张</button>
                            <button id="sb-lb-next" class="sb-btn">下一张 →</button>
                        </div>
                        <button id="sb-lb-copy" class="sb-btn" style="flex:0 0 auto;padding:.4rem">📋 复制图片</button>
                    </div>
                </div>
            </div>
        </div>
        <div id="sb-toasts"></div>`;

    window.App.pages.stickerBook = {
        render: function () {
            if (!dataset()) {
                return `
                <div class="flex flex-col flex-1 gap-5 fade-in pb-10">
                    <div class="sb-panel sb-empty">
                        <div class="big">🧩</div>
                        <div class="font-black text-zinc-600 mb-2">表情包数据未加载</div>
                        <div style="font-size:.82rem">
                            缺少 <code class="font-mono">js/sticker-data.js</code>。<br>
                            在仓库根目录执行 <code class="font-mono">python tools/build-stickers.py</code> 生成资源与清单。
                        </div>
                    </div>
                </div>`;
            }

            return `
            <div class="flex flex-col lg:flex-row gap-5 flex-1 fade-in pb-10">
                <!-- 目录 -->
                <aside class="sb-panel p-3 lg:w-56 lg:flex-none h-fit">
                    <div class="flex items-center gap-2 px-2 pt-1 pb-2">
                        <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 text-white flex items-center justify-center shadow-md">
                            <i data-lucide="sticker" class="w-4 h-4"></i>
                        </div>
                        <div class="flex flex-col leading-none">
                            <span class="text-xs font-black text-zinc-700 tracking-wider">未来表情包</span>
                            <span class="text-[9px] font-bold text-zinc-300 tracking-[0.2em] mt-1">STICKER ARCHIVE</span>
                        </div>
                    </div>
                    <div class="h-[1px] bg-zinc-100 my-2 mx-1"></div>
                    <div id="sb-dirs" class="flex flex-col gap-0.5 max-h-52 lg:max-h-none overflow-y-auto"></div>
                    <div class="mt-3 mx-1 px-2 py-2 rounded-lg bg-zinc-50 border border-zinc-100">
                        <div class="text-[10px] font-bold text-zinc-400 leading-relaxed">
                            来源：本地表情包库<br>
                            点图片看大图，<kbd class="shortcut-key">←</kbd><kbd class="shortcut-key">→</kbd> 翻页<br>
                            <kbd class="shortcut-key">/</kbd> 聚焦搜索 · <kbd class="shortcut-key">Esc</kbd> 关闭
                        </div>
                    </div>
                </aside>

                <!-- 主区 -->
                <section class="flex-1 min-w-0 flex flex-col gap-3">
                    <div class="sb-panel px-4 py-3 flex flex-col md:flex-row md:items-center gap-3">
                        <div class="flex items-center gap-2 md:w-52 flex-none">
                            <span id="sb-view" class="text-sm font-black text-zinc-800 tracking-wide truncate"></span>
                        </div>
                        <div class="relative flex-1 min-w-0">
                            <i data-lucide="search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"></i>
                            <input id="sb-q" type="search" autocomplete="off" spellcheck="false"
                                placeholder="搜索关键字（跨目录，例如：急 / 无语 / 好消息）"
                                class="w-full h-10 pl-9 pr-9 rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-bold text-zinc-700
                                       focus:outline-none focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all">
                            <button id="sb-qclear" type="button" title="清空"
                                class="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 hidden">✕</button>
                        </div>
                        <div id="sb-count" class="sb-kv flex-none"></div>
                    </div>

                    <div id="sb-grid"></div>
                    <div id="sb-empty" class="sb-empty" hidden></div>
                </section>
            </div>`;
        },

        mount: function () {
            injectStyles();

            const myGen = ++S.gen;

            const qInput = $('sb-q');
            const qClear = $('sb-qclear');
            const grid = $('sb-grid');

            if (!grid) return; // 数据缺失时的错误页

            removeOverlay();
            overlay = document.createElement('div');
            overlay.id = 'sb-overlay';
            overlay.innerHTML = OVERLAY_HTML;
            document.body.appendChild(overlay);

            // 恢复上次的搜索词
            qInput.value = S.q;
            qClear.classList.toggle('hidden', !S.q);

            const refresh = () => {
                S.items = computeItems();
                renderSidebar();
                renderToolbar();
                renderGrid();
            };

            // --- 目录 ---
            $('sb-dirs').addEventListener('click', (e) => {
                const btn = e.target.closest('[data-dir]');
                if (!btn) return;
                S.dir = btn.dataset.dir || '';
                S.items = computeItems();
                renderSidebar();
                renderToolbar();
                renderGrid();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });

            // --- 搜索 ---
            const onSearch = debounce(() => {
                S.q = qInput.value;
                qClear.classList.toggle('hidden', !S.q);
                refresh();
                window.scrollTo(0, 0);
            }, 220);
            qInput.addEventListener('input', onSearch);
            qInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') { qInput.value = ''; onSearch(); }
            });
            qClear.addEventListener('click', () => {
                qInput.value = '';
                onSearch();
                qInput.focus();
            });

            // --- 大图预览 ---
            $('sb-lb-close').addEventListener('click', closeLightbox);
            $('sb-lb-prev').addEventListener('click', () => stepLightbox(-1));
            $('sb-lb-next').addEventListener('click', () => stepLightbox(1));
            $('sb-lb-copy').addEventListener('click', (e) => {
                const it = S.items[S.lbIndex];
                if (it) copyImage(it, e.currentTarget);
            });
            $('sb-lb').addEventListener('click', (e) => {
                if (e.target === $('sb-lb')) closeLightbox();
            });

            // --- 窗口尺寸变化重排（页面卸载后由代次号自动失效）---
            if (S.onResize) window.removeEventListener('resize', S.onResize);
            S.onResize = debounce(() => { if (myGen === S.gen) layout(); }, 90);
            window.addEventListener('resize', S.onResize);

            // 网页字体加载完文字行高会变，卡片高度跟着变，需要再排一次
            if (document.fonts && document.fonts.ready) {
                document.fonts.ready.then(() => { if (myGen === S.gen) layout(); });
            }

            refresh();
        },

        handleKey: function (e) {
            const lb = $('sb-lb');
            const lbOpen = lb && !lb.hidden;

            if (e.key === 'Escape') {
                if (lbOpen) { closeLightbox(); e.preventDefault(); }
                else if (S.q) {
                    S.q = '';
                    const qi = $('sb-q');
                    if (qi) qi.value = '';
                    const qc = $('sb-qclear');
                    if (qc) qc.classList.add('hidden');
                    S.items = computeItems();
                    renderSidebar();
                    renderToolbar();
                    renderGrid();
                }
                return;
            }

            if (lbOpen) {
                if (e.key === 'ArrowLeft') { stepLightbox(-1); e.preventDefault(); }
                if (e.key === 'ArrowRight') { stepLightbox(1); e.preventDefault(); }
                return;
            }

            if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) {
                const qi = $('sb-q');
                if (qi) { qi.focus(); qi.select(); e.preventDefault(); }
            }
        },
    };
})();
