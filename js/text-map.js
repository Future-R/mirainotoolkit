// --- TEXT MAP EDITOR ---
window.App = window.App || {};
window.App.pages = window.App.pages || {};

const TEXT_MAP_LOCALES = {
    'zh-CN': {
        title: '文字地图编辑器',
        subtitle: '你也可以用来拼豆',
        import: '导入',
        undo: '撤销',
        redo: '重做',
        exportErb: '导出 ERB',
        copyAll: '复制全图',
        rows: '行',
        cols: '列',
        font: '字体',
        cursor: '光标',
        mapSettings: '地图参数',
        width: '宽度',
        height: '高度',
        fontSelect: '字体选择',
        fontDefault: '默认',
        installRequired: '需安装',
        installRequiredMarker: '需安装',
        downloadFonts: '下载字体资源 >',
        textStyle: '文本样式',
        foreground: '前景色',
        selectedChar: '选中字符',
        bold: '加粗',
        underline: '下划线',
        strike: '删除线',
        charToolbox: '字符工具箱',
        keyboard: '键盘',
        unselected: '未选中',
        modeText: '文本编辑',
        modeRect: '矩形填充',
        tipText: '文本编辑模式支持一整行原生框选、复制、删除与富文本样式修改；点击下方字符会直接复制。',
        tipRectSelected: '当前填充字符：{char}。拖拽左侧字符位即可按当前文本样式进行矩形填充。',
        tipRectIdle: '矩形填充模式下，请先从字符工具箱选择一个字符，再到左侧拖拽填充。',
        importMapText: '导入地图文本',
        importPlaceholder: '在此处粘贴文本...',
        cancel: '取消',
        confirmImport: '确认导入',
        copyRowTitle: '复制第 {row} 行',
        erbHeader: '; 未来工具箱 之 文字地图编辑器 于 {timestamp} 生成',
        copied: '已复制',
        exported: '已导出'
    },
    'ja-JP': {
        title: 'テキストマップエディタ',
        subtitle: 'ピクセル画を描くのにも使える',
        import: 'インポート',
        undo: '元に戻す',
        redo: 'やり直す',
        exportErb: 'ERB を書き出す',
        copyAll: 'マップ全体をコピー',
        rows: '行',
        cols: '列',
        font: 'フォント',
        cursor: 'カーソル',
        mapSettings: 'マップ設定',
        width: '幅',
        height: '高さ',
        fontSelect: 'フォント選択',
        fontDefault: '標準',
        installRequired: '要インストール',
        installRequiredMarker: '要インストール',
        downloadFonts: 'フォント素材をダウンロード >',
        textStyle: 'テキストスタイル',
        foreground: '文字色',
        selectedChar: '選択文字',
        bold: '太字',
        underline: '下線',
        strike: '取り消し線',
        charToolbox: '文字ツールボックス',
        keyboard: 'キーボード',
        unselected: '未選択',
        modeText: 'テキスト編集',
        modeRect: '矩形塗りつぶし',
        tipText: 'テキスト編集モードでは、1 行単位のネイティブ選択、コピー、削除、リッチテキスト装飾の編集に対応し、下の文字クリックはコピーになります。',
        tipRectSelected: '現在の塗りつぶし文字: {char}。左側の文字マスをドラッグすると、現在のテキストスタイルで矩形塗りつぶしできます。',
        tipRectIdle: '矩形塗りつぶしモードでは、先に文字ツールボックスから文字を選び、そのあと左側をドラッグして塗りつぶしてください。',
        importMapText: 'マップテキストをインポート',
        importPlaceholder: 'ここにテキストを貼り付けてください...',
        cancel: 'キャンセル',
        confirmImport: 'インポートする',
        copyRowTitle: '{row} 行目をコピー',
        erbHeader: '; Mirai Toolkit テキストマップエディタで {timestamp} に生成',
        copied: 'コピー済み',
        exported: '書き出し済み'
    }
};

const getTextMapLocale = () => {
    if (window.App && typeof window.App.getLocale === 'function') {
        return window.App.getLocale();
    }

    const locale = String(document.documentElement.lang || navigator.language || 'zh-CN').toLowerCase();
    return locale.startsWith('ja') ? 'ja-JP' : 'zh-CN';
};

const getTextMapStrings = () => TEXT_MAP_LOCALES[getTextMapLocale()] || TEXT_MAP_LOCALES['zh-CN'];
const formatTextMapString = (template, params = {}) => String(template || '').replace(/\{(\w+)\}/g, (_, key) => params[key] ?? '');

window.App.pages.textMapEditor = {
    config: { rows: 10, cols: 10, font: "'MS Gothic', monospace", maxSize: 40 },

    render: function() {
        const t = getTextMapStrings();
        const toolboxChars = [
            '┌', '┬', '┐', '┏', '┳', '┓', '╔', '╦', '╗', '╭', '─', '╮',
            '├', '┼', '┤', '┣', '╋', '┫', '╠', '╬', '╣', '│', '╳', '┃',
            '└', '┴', '┘', '┗', '┻', '┛', '╚', '╩', '╝', '╰', '━', '╯',
            '┍', '┑', '┎', '┒', '╒', '╕', '╓', '╖', '／', '＼', '┄', '┅',
            '┕', '┙', '┖', '┚', '╘', '╛', '╙', '╜', '＜', '＞', '┆', '┇',
            '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '♨', '✟',
            '※', '◎', '□', '■', '♠', '♥', '♦', '♣', '↑', '↓', '←', '→',
            '○', '●', 'Ｏ', 'Ｘ', '＠', '　', '△', '▽', '◇', '▲', '▼', '◆',
            '〓', '∞', '～', '┄', '┅', '┆', '┇', '≈', '⊙', '░', '▒', '▓'
        ];

        return `
        <div class="flex flex-col items-center justify-center flex-1 w-full fade-in py-6">
            <div class="streamline-shell w-full p-6 bg-gradient-to-br from-white to-teal-50">
                <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 border-b border-zinc-200 pb-4">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white">
                            <i data-lucide="map" class="w-5 h-5"></i>
                        </div>
                        <div>
                            <h2 class="text-lg font-black text-zinc-700 tracking-wider">${t.title}</h2>
                            <div class="text-[10px] text-zinc-400 font-bold">${t.subtitle}</div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 flex-wrap justify-end">
                        <button id="btn-import" type="button" class="px-3 py-2 bg-white border border-zinc-300 rounded text-xs font-bold text-zinc-600 hover:bg-zinc-50 flex items-center gap-1 shadow-sm">
                            <i data-lucide="upload" class="w-3 h-3"></i> ${t.import}
                        </button>
                        <button id="btn-undo" type="button" class="px-3 py-2 bg-white border border-zinc-300 rounded text-xs font-bold text-zinc-600 hover:bg-zinc-50 flex items-center gap-1 shadow-sm">
                            <i data-lucide="undo-2" class="w-3 h-3"></i> ${t.undo}
                        </button>
                        <button id="btn-redo" type="button" class="px-3 py-2 bg-white border border-zinc-300 rounded text-xs font-bold text-zinc-600 hover:bg-zinc-50 flex items-center gap-1 shadow-sm">
                            <i data-lucide="redo-2" class="w-3 h-3"></i> ${t.redo}
                        </button>
                        <button id="btn-export-erb" type="button" class="px-3 py-2 bg-white border border-zinc-300 rounded text-xs font-bold text-zinc-600 hover:bg-zinc-50 flex items-center gap-1 shadow-sm">
                            <i data-lucide="file-down" class="w-3 h-3"></i> ${t.exportErb}
                        </button>
                        <button id="btn-copy-all" type="button" class="px-3 py-2 bg-teal-500 border border-teal-600 rounded text-xs font-bold text-white hover:bg-teal-600 flex items-center gap-1 shadow-sm">
                            <i data-lucide="copy" class="w-3 h-3"></i> ${t.copyAll}
                        </button>
                    </div>
                </div>

                <div class="flex flex-col lg:flex-row gap-6">
                    <div class="flex-1 min-w-0">
                        <div class="device-screen bg-black min-h-[700px] p-6 overflow-auto relative">
                            <div class="flex flex-wrap justify-between gap-3 text-[10px] font-mono text-teal-700 mb-3 select-none">
                                <span>${t.rows}: <span id="lbl-rows">10</span></span>
                                <span>${t.cols}: <span id="lbl-cols">10</span></span>
                                <span>${t.font}: <span id="lbl-font">MS Gothic</span></span>
                                <span>${t.cursor}: <span id="lbl-cursor">1, 1</span></span>
                            </div>
                            <div id="map-container" class="flex flex-col gap-0 w-max min-w-full border border-zinc-800 bg-black rounded p-2">
                                <!-- Rows injected via JS -->
                            </div>
                        </div>
                    </div>

                    <div class="w-full lg:w-96 flex flex-col gap-6">
                        <div class="bg-zinc-100 p-4 rounded-lg border border-zinc-200">
                            <h3 class="text-xs font-bold text-zinc-500 tracking-widest mb-3 uppercase">${t.mapSettings}</h3>
                            <div class="grid grid-cols-2 gap-3 mb-4">
                                <div>
                                    <label class="text-[10px] font-bold text-zinc-400 block mb-1">${t.width} (W)</label>
                                    <input id="inp-cols" type="number" min="1" max="40" value="10" class="w-full bg-white border border-zinc-300 rounded px-2 py-1 text-sm font-mono text-center">
                                </div>
                                <div>
                                    <label class="text-[10px] font-bold text-zinc-400 block mb-1">${t.height} (H)</label>
                                    <input id="inp-rows" type="number" min="1" max="40" value="10" class="w-full bg-white border border-zinc-300 rounded px-2 py-1 text-sm font-mono text-center">
                                </div>
                            </div>
                            <div>
                                <label class="text-[10px] font-bold text-zinc-400 block mb-1">${t.fontSelect}</label>
                                <select id="sel-font" class="w-full bg-white border border-zinc-300 rounded px-2 py-1 text-xs font-bold text-zinc-700">
                                    <option value="'MS Gothic', monospace">MS Gothic (era ${t.fontDefault})</option>
                                    <option value="'ERA MONO SC', 'MS Gothic', monospace">ERA MONO SC (${t.installRequired})</option>
                                    <option value="'EraPixel', 'MS Gothic', monospace">EraPixel (${t.installRequired})</option>
                                </select>
                                <a href="https://gitgud.io/era-games-zh/meta/eraFonts" target="_blank" rel="noopener noreferrer" class="block text-right text-[10px] text-teal-600 font-bold mt-1 hover:underline">${t.downloadFonts}</a>
                            </div>
                        </div>

                        <div class="bg-zinc-100 p-4 rounded-lg border border-zinc-200 flex-1">
                            <div class="flex items-center justify-between gap-3 mb-3">
                                <div class="flex items-center gap-2 flex-wrap">
                                    <h3 class="text-xs font-bold text-zinc-500 tracking-widest uppercase">${t.textStyle}</h3>
                                    <span class="text-[10px] font-bold text-zinc-400 tracking-widest uppercase">${t.charToolbox}</span>
                                </div>
                                <div id="style-sample" class="min-w-12 h-9 px-3 rounded bg-black border border-zinc-700 text-center font-mono text-sm font-black text-white inline-flex items-center justify-center">Aa</div>
                            </div>

                            <div class="flex flex-wrap items-end gap-2 mb-3">
                                <div class="w-24 shrink-0">
                                    <label class="text-[10px] font-bold text-zinc-400 block mb-1">${t.selectedChar}</label>
                                    <input id="inp-selected-char" type="text" inputmode="text" autocomplete="off" spellcheck="false" maxlength="2" class="w-full h-9 px-2 rounded bg-white border border-zinc-300 text-sm font-mono font-black text-center text-zinc-700 focus:outline-none focus:ring-2 focus:ring-teal-500" value="">
                                </div>
                                <div class="shrink-0">
                                    <label class="text-[10px] font-bold text-zinc-400 block mb-1">${t.foreground}</label>
                                    <input id="inp-text-color" type="color" value="#ffffff" class="h-9 w-14 rounded border border-zinc-300 bg-white p-1 cursor-pointer">
                                </div>
                                <div id="lbl-text-color" class="min-w-28 h-9 px-3 rounded bg-white border border-zinc-300 text-xs font-mono font-bold text-zinc-700 inline-flex items-center justify-center">#ffffff</div>
                                <button id="btn-style-bold" type="button" class="px-3 py-2 rounded border text-xs font-bold transition-colors">${t.bold}</button>
                                <button id="btn-style-underline" type="button" class="px-3 py-2 rounded border text-xs font-bold transition-colors">${t.underline}</button>
                                <button id="btn-style-strike" type="button" class="px-3 py-2 rounded border text-xs font-bold transition-colors">${t.strike}</button>
                            </div>

                            <div class="grid grid-cols-2 gap-2 mb-3">
                                <button id="btn-mode-text" type="button" class="px-3 py-2 rounded border text-xs font-bold transition-colors">${t.modeText}</button>
                                <button id="btn-mode-rect" type="button" class="px-3 py-2 rounded border text-xs font-bold transition-colors">${t.modeRect}</button>
                            </div>

                            <div id="tool-mode-tip" class="mb-3 rounded-lg border border-teal-200 bg-white px-3 py-2 text-[10px] font-bold text-zinc-500 leading-5">
                                ${t.tipText}
                            </div>

                            <div class="grid grid-cols-12 gap-px bg-zinc-200 border border-zinc-200 rounded overflow-hidden">
                                ${toolboxChars.map((char) => `
                                    <button type="button" class="btn-char w-full h-6 bg-white hover:bg-teal-500 hover:text-white font-mono text-lg leading-none flex items-center justify-center transition-colors" data-char="${char}">
                                        ${char}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div id="modal-import" class="fixed inset-0 bg-black/50 z-50 hidden flex items-center justify-center p-4">
                <div class="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg border-4 border-zinc-200">
                    <h3 class="text-lg font-black text-zinc-800 mb-4">${t.importMapText}</h3>
                    <textarea id="import-text" class="w-full h-48 bg-zinc-50 border border-zinc-300 rounded-lg p-3 font-mono text-xs mb-4 focus:ring-2 focus:ring-teal-500 outline-none" placeholder="${t.importPlaceholder}"></textarea>
                    <div class="flex justify-end gap-3">
                        <button id="btn-cancel-import" type="button" class="px-4 py-2 text-zinc-500 font-bold hover:bg-zinc-100 rounded">${t.cancel}</button>
                        <button id="btn-confirm-import" type="button" class="px-4 py-2 bg-teal-500 text-white font-bold rounded hover:bg-teal-600">${t.confirmImport}</button>
                    </div>
                </div>
            </div>
        </div>
        `;
    },

    mount: function() {
        if (this._cleanup) this._cleanup();
        const t = getTextMapStrings();

        const blankCell = 'Ｘ';
        const defaultColor = '#ffffff';
        const container = document.getElementById('map-container');
        const inpRows = document.getElementById('inp-rows');
        const inpCols = document.getElementById('inp-cols');
        const selFont = document.getElementById('sel-font');
        const lblRows = document.getElementById('lbl-rows');
        const lblCols = document.getElementById('lbl-cols');
        const lblFont = document.getElementById('lbl-font');
        const lblCursor = document.getElementById('lbl-cursor');
        const btnCopyAll = document.getElementById('btn-copy-all');
        const btnUndo = document.getElementById('btn-undo');
        const btnRedo = document.getElementById('btn-redo');
        const btnExportErb = document.getElementById('btn-export-erb');
        const btnImport = document.getElementById('btn-import');
        const btnModeText = document.getElementById('btn-mode-text');
        const btnModeRect = document.getElementById('btn-mode-rect');
        const toolModeTip = document.getElementById('tool-mode-tip');
        const styleSample = document.getElementById('style-sample');
        const inpSelectedChar = document.getElementById('inp-selected-char');
        const inpTextColor = document.getElementById('inp-text-color');
        const lblTextColor = document.getElementById('lbl-text-color');
        const btnStyleBold = document.getElementById('btn-style-bold');
        const btnStyleUnderline = document.getElementById('btn-style-underline');
        const btnStyleStrike = document.getElementById('btn-style-strike');
        const modal = document.getElementById('modal-import');
        const btnCancelImport = document.getElementById('btn-cancel-import');
        const btnConfirmImport = document.getElementById('btn-confirm-import');
        const txtImport = document.getElementById('import-text');
        const charButtons = Array.from(document.querySelectorAll('.btn-char'));

        let mapData = [];
        let editorMode = 'text';
        let selectedBrush = '';
        let activeRow = 0;
        let selectionState = { row: 0, start: 0, end: 0 };
        let currentTextStyle = { color: defaultColor, bold: false, underline: false, strike: false };
        let rectDrag = null;
        let copyAllResetTimer = null;
        let exportResetTimer = null;
        let composingRow = null;
        let historyStack = [];
        let historyIndex = -1;
        let applyingHistory = false;

        const colorParser = document.createElement('span');
        const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
        const escapeHtml = (value = '') => String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        const normalizeSelectedChar = (value) => {
            const chars = Array.from(String(value ?? '').replace(/\r?\n/g, '').replace(/\u200b/g, ''));
            return chars.length > 0 ? chars[0] : '';
        };
        const normalizeChar = (value) => normalizeSelectedChar(value) || blankCell;
        const normalizeColor = (value) => {
            if (!value) return defaultColor;

            if (/^#[0-9a-f]{6}$/i.test(value)) return value.toLowerCase();

            colorParser.style.color = '';
            colorParser.style.color = value;
            const normalized = colorParser.style.color;
            const rgbMatch = normalized.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/i);

            if (!rgbMatch) return defaultColor;

            return `#${[rgbMatch[1], rgbMatch[2], rgbMatch[3]]
                .map((part) => Number(part).toString(16).padStart(2, '0'))
                .join('')}`;
        };
        const getReadableTextColor = (hexColor) => {
            const color = normalizeColor(hexColor).slice(1);
            const red = parseInt(color.slice(0, 2), 16);
            const green = parseInt(color.slice(2, 4), 16);
            const blue = parseInt(color.slice(4, 6), 16);
            const brightness = (red * 299 + green * 587 + blue * 114) / 1000;
            return brightness >= 160 ? '#18181b' : '#ffffff';
        };
        const createCell = (char = blankCell, style = {}) => ({
            char: normalizeChar(char),
            color: normalizeColor(style.color),
            bold: Boolean(style.bold),
            underline: Boolean(style.underline),
            strike: Boolean(style.strike)
        });
        const cloneCell = (cell) => createCell(cell?.char, cell || {});
        const ensureRowLength = (cells = []) => {
            const normalized = Array.from({ length: this.config.cols }, (_, index) => (
                cells[index] ? cloneCell(cells[index]) : createCell()
            ));
            return normalized.slice(0, this.config.cols);
        };
        const createEmptyMap = (rows, cols) => (
            Array.from({ length: rows }, () => Array.from({ length: cols }, () => createCell()))
        );
        const cloneMapData = (source) => source.map((row) => row.map((cell) => cloneCell(cell)));
        const isSameCell = (left, right) => (
            left.char === right.char &&
            left.color === right.color &&
            left.bold === right.bold &&
            left.underline === right.underline &&
            left.strike === right.strike
        );
        const getCell = (rowIndex, colIndex) => {
            if (!mapData[rowIndex] || !mapData[rowIndex][colIndex]) return createCell();
            return mapData[rowIndex][colIndex];
        };
        const normalizeSelection = (state = selectionState) => ({
            row: clamp(Number(state.row) || 0, 0, this.config.rows - 1),
            start: clamp(Number(state.start) || 0, 0, this.config.cols),
            end: clamp(Number(state.end) || 0, 0, this.config.cols)
        });
        const getPlainTextRow = (rowIndex) => (mapData[rowIndex] || []).map((cell) => cell.char).join('');
        const getPlainTextMap = () => mapData.map((_, rowIndex) => getPlainTextRow(rowIndex)).join('\n');
        const isFullWidthCodePoint = (codePoint) => (
            codePoint >= 0x1100 && (
                codePoint <= 0x115f ||
                codePoint === 0x2329 ||
                codePoint === 0x232a ||
                (codePoint >= 0x2190 && codePoint <= 0x21ff) ||
                (codePoint >= 0x2460 && codePoint <= 0x24ff) ||
                (codePoint >= 0x2500 && codePoint <= 0x257f) ||
                (codePoint >= 0x2580 && codePoint <= 0x259f) ||
                (codePoint >= 0x25a0 && codePoint <= 0x25ff) ||
                (codePoint >= 0x2600 && codePoint <= 0x26ff) ||
                (codePoint >= 0x2e80 && codePoint <= 0xa4cf && codePoint !== 0x303f) ||
                (codePoint >= 0xac00 && codePoint <= 0xd7a3) ||
                (codePoint >= 0xf900 && codePoint <= 0xfaff) ||
                (codePoint >= 0xfe10 && codePoint <= 0xfe19) ||
                (codePoint >= 0xfe30 && codePoint <= 0xfe6f) ||
                (codePoint >= 0xff01 && codePoint <= 0xff60) ||
                (codePoint >= 0xffe0 && codePoint <= 0xffe6) ||
                (codePoint >= 0x1f300 && codePoint <= 0x1f64f) ||
                (codePoint >= 0x1f900 && codePoint <= 0x1f9ff) ||
                (codePoint >= 0x20000 && codePoint <= 0x3fffd)
            )
        );
        const getCharDisplayUnits = (char) => {
            const codePoint = Array.from(String(char || blankCell))[0]?.codePointAt(0) || blankCell.codePointAt(0);
            return isFullWidthCodePoint(codePoint) ? 2 : 1;
        };
        const isSameStyle = (left, right) => (
            left.color === right.color &&
            left.bold === right.bold &&
            left.underline === right.underline &&
            left.strike === right.strike
        );
        const getSelectionBounds = (start, end) => ({
            rowStart: Math.min(start.row, end.row),
            rowEnd: Math.max(start.row, end.row),
            colStart: Math.min(start.col, end.col),
            colEnd: Math.max(start.col, end.col)
        });
        const getSelectionStateFromDom = () => {
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) return null;

            const range = selection.getRangeAt(0);
            const ancestor = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
                ? range.commonAncestorContainer
                : range.commonAncestorContainer.parentElement;
            const rowEl = ancestor?.closest?.('[data-row-editor]');

            if (!rowEl || !container.contains(rowEl)) return null;

            const getIndexFromPoint = (node, offset) => {
                const probe = document.createRange();
                probe.setStart(rowEl, 0);
                try {
                    probe.setEnd(node, offset);
                } catch (error) {
                    return 0;
                }
                return clamp(Array.from(probe.toString().replace(/\r?\n/g, '')).length, 0, this.config.cols);
            };

            return normalizeSelection({
                row: Number(rowEl.dataset.row),
                start: getIndexFromPoint(range.startContainer, range.startOffset),
                end: getIndexFromPoint(range.endContainer, range.endOffset)
            });
        };
        const getPointFromIndex = (rowEl, index) => {
            const walker = document.createTreeWalker(rowEl, NodeFilter.SHOW_TEXT);
            let remaining = clamp(index, 0, this.config.cols);
            let current = walker.nextNode();

            while (current) {
                const chars = Array.from(current.nodeValue || '');
                if (remaining <= chars.length) {
                    const codeUnitOffset = chars.slice(0, remaining).join('').length;
                    return { node: current, offset: codeUnitOffset };
                }
                remaining -= chars.length;
                current = walker.nextNode();
            }

            return { node: rowEl, offset: rowEl.childNodes.length };
        };
        const getRowEditor = (rowIndex) => container.querySelector(`[data-row-editor="${rowIndex}"]`);
        const refreshRowFocusState = () => {
            Array.from(container.querySelectorAll('[data-row-editor]')).forEach((rowEl) => {
                const rowIndex = Number(rowEl.dataset.row);
                const isActive = editorMode === 'text' && rowIndex === activeRow;

                rowEl.classList.toggle('outline-teal-500', isActive);
                rowEl.classList.toggle('bg-zinc-950/60', isActive);
                rowEl.classList.toggle('outline-transparent', !isActive);
                rowEl.classList.toggle('hover:outline-zinc-800', !isActive);
            });
        };
        const restoreSelection = (state = selectionState, options = {}) => {
            if (editorMode !== 'text') return;

            const normalized = normalizeSelection(state);
            const rowEl = getRowEditor(normalized.row);
            if (!rowEl) return;

            const selection = window.getSelection();
            if (!selection) return;

            const startPoint = getPointFromIndex(rowEl, normalized.start);
            const endPoint = getPointFromIndex(rowEl, normalized.end);
            const range = document.createRange();
            range.setStart(startPoint.node, startPoint.offset);
            range.setEnd(endPoint.node, endPoint.offset);
            selection.removeAllRanges();
            selection.addRange(range);

            if (options.focus !== false) rowEl.focus({ preventScroll: true });

            activeRow = normalized.row;
            selectionState = normalized;
            refreshRowFocusState();
        };
        const updateCursorLabel = () => {
            const normalized = normalizeSelection(selectionState);
            lblCursor.textContent = `${normalized.row + 1}, ${Math.min(normalized.start + 1, this.config.cols)}`;
        };
        const buildHistorySnapshot = () => ({
            rows: this.config.rows,
            cols: this.config.cols,
            mapData: cloneMapData(mapData)
        });
        const getHistoryKey = (snapshot) => JSON.stringify(snapshot);
        const syncHistoryButtons = () => {
            const updateButton = (button, enabled) => {
                button.disabled = !enabled;
                button.className = enabled
                    ? 'px-3 py-2 bg-white border border-zinc-300 rounded text-xs font-bold text-zinc-600 hover:bg-zinc-50 flex items-center gap-1 shadow-sm'
                    : 'px-3 py-2 bg-zinc-100 border border-zinc-200 rounded text-xs font-bold text-zinc-400 flex items-center gap-1 shadow-sm cursor-not-allowed';
            };

            updateButton(btnUndo, historyIndex > 0);
            updateButton(btnRedo, historyIndex >= 0 && historyIndex < historyStack.length - 1);
        };
        const applyHistorySnapshot = (snapshot) => {
            applyingHistory = true;

            this.config.rows = snapshot.rows;
            this.config.cols = snapshot.cols;
            inpRows.value = snapshot.rows;
            inpCols.value = snapshot.cols;
            lblRows.textContent = snapshot.rows;
            lblCols.textContent = snapshot.cols;
            mapData = cloneMapData(snapshot.mapData);
            activeRow = clamp(activeRow, 0, this.config.rows - 1);
            selectionState = normalizeSelection({
                row: activeRow,
                start: selectionState.start,
                end: selectionState.end
            });
            rectDrag = null;

            renderRows({ focus: editorMode === 'text' });
            updateCursorLabel();
            updateCurrentStyleFromSelection();

            applyingHistory = false;
        };
        const pushHistory = () => {
            if (applyingHistory) return;

            const snapshot = buildHistorySnapshot();
            const nextKey = getHistoryKey(snapshot);
            const currentKey = historyIndex >= 0 ? getHistoryKey(historyStack[historyIndex]) : '';
            if (nextKey === currentKey) {
                syncHistoryButtons();
                return;
            }

            historyStack = historyStack.slice(0, historyIndex + 1);
            historyStack.push(snapshot);
            if (historyStack.length > 120) historyStack.shift();
            historyIndex = historyStack.length - 1;
            syncHistoryButtons();
        };
        const undoHistory = () => {
            if (historyIndex <= 0) return;
            historyIndex -= 1;
            applyHistorySnapshot(historyStack[historyIndex]);
            syncHistoryButtons();
        };
        const redoHistory = () => {
            if (historyIndex >= historyStack.length - 1) return;
            historyIndex += 1;
            applyHistorySnapshot(historyStack[historyIndex]);
            syncHistoryButtons();
        };
        const getFallbackStyleFromSelection = () => {
            const normalized = normalizeSelection(selectionState);
            const rowCells = mapData[normalized.row] || [];
            const index = clamp(normalized.start > 0 ? normalized.start - 1 : normalized.start, 0, Math.max(this.config.cols - 1, 0));
            const cell = rowCells[index] || createCell();
            return {
                color: normalizeColor(cell.color),
                bold: Boolean(cell.bold),
                underline: Boolean(cell.underline),
                strike: Boolean(cell.strike)
            };
        };
        const updateStyleSample = () => {
            const textDecoration = [
                currentTextStyle.underline ? 'underline' : '',
                currentTextStyle.strike ? 'line-through' : ''
            ].filter(Boolean).join(' ') || 'none';

            inpTextColor.value = currentTextStyle.color;
            lblTextColor.textContent = currentTextStyle.color;
            lblTextColor.style.color = getReadableTextColor(currentTextStyle.color);
            lblTextColor.style.backgroundColor = currentTextStyle.color;
            lblTextColor.style.borderColor = currentTextStyle.color;
            styleSample.textContent = selectedBrush || 'Aa';
            styleSample.style.color = currentTextStyle.color;
            styleSample.style.fontWeight = currentTextStyle.bold ? '700' : '400';
            styleSample.style.textDecoration = textDecoration;
            styleSample.style.backgroundColor = getReadableTextColor(currentTextStyle.color) === '#ffffff' ? '#09090b' : '#fafafa';
            styleSample.style.borderColor = currentTextStyle.color;

            const syncToggleButton = (button, active) => {
                button.className = active
                    ? 'px-3 py-2 rounded border text-xs font-bold transition-colors bg-teal-500 border-teal-600 text-white'
                    : 'px-3 py-2 rounded border text-xs font-bold transition-colors bg-white border-zinc-300 text-zinc-600 hover:bg-zinc-50';
            };

            syncToggleButton(btnStyleBold, currentTextStyle.bold);
            syncToggleButton(btnStyleUnderline, currentTextStyle.underline);
            syncToggleButton(btnStyleStrike, currentTextStyle.strike);
        };
        const updateCurrentStyleFromSelection = () => {
            if (editorMode !== 'text') {
                updateStyleSample();
                return;
            }

            const selection = window.getSelection();
            const rowEl = getRowEditor(activeRow);
            const selectionInsideEditor = Boolean(
                selection &&
                selection.rangeCount > 0 &&
                rowEl &&
                rowEl.contains(selection.anchorNode)
            );

            const safeQueryState = (command) => {
                try {
                    return Boolean(document.queryCommandState(command));
                } catch (error) {
                    return false;
                }
            };
            const safeQueryValue = (command) => {
                try {
                    return document.queryCommandValue(command) || '';
                } catch (error) {
                    return '';
                }
            };

            if (selectionInsideEditor && typeof document.queryCommandState === 'function') {
                const fallbackStyle = getFallbackStyleFromSelection();
                const queriedColorValue = safeQueryValue('foreColor');
                const queriedColor = queriedColorValue ? normalizeColor(queriedColorValue) : fallbackStyle.color;
                currentTextStyle = {
                    color: queriedColor,
                    bold: safeQueryState('bold') || fallbackStyle.bold,
                    underline: safeQueryState('underline') || fallbackStyle.underline,
                    strike: safeQueryState('strikeThrough') || fallbackStyle.strike
                };
            } else {
                currentTextStyle = getFallbackStyleFromSelection();
            }

            updateStyleSample();
        };
        const setSelectedBrush = (value) => {
            selectedBrush = normalizeSelectedChar(value);
            inpSelectedChar.value = selectedBrush;
            updateStyleSample();
            syncModeUI();
        };
        const syncModeUI = () => {
            const isTextMode = editorMode === 'text';
            const isRectMode = editorMode === 'rect';

            btnModeText.className = isTextMode
                ? 'px-3 py-2 rounded border text-xs font-bold transition-colors bg-teal-500 border-teal-600 text-white'
                : 'px-3 py-2 rounded border text-xs font-bold transition-colors bg-white border-zinc-300 text-zinc-600 hover:bg-zinc-50';
            btnModeRect.className = isRectMode
                ? 'px-3 py-2 rounded border text-xs font-bold transition-colors bg-teal-500 border-teal-600 text-white'
                : 'px-3 py-2 rounded border text-xs font-bold transition-colors bg-white border-zinc-300 text-zinc-600 hover:bg-zinc-50';

            inpSelectedChar.className = selectedBrush
                ? 'w-full h-9 px-2 rounded bg-teal-50 border border-teal-400 text-sm font-mono font-black text-center text-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500'
                : 'w-full h-9 px-2 rounded bg-white border border-zinc-300 text-sm font-mono font-black text-center text-zinc-700 focus:outline-none focus:ring-2 focus:ring-teal-500';

            toolModeTip.textContent = isTextMode
                ? t.tipText
                : (selectedBrush ? formatTextMapString(t.tipRectSelected, { char: selectedBrush }) : t.tipRectIdle);

            charButtons.forEach((button) => {
                const isSelected = selectedBrush && button.dataset.char === selectedBrush;
                button.className = isSelected
                    ? 'btn-char w-full h-6 bg-teal-500 text-white ring-2 ring-teal-200 font-mono text-lg leading-none flex items-center justify-center transition-colors'
                    : 'btn-char w-full h-6 bg-white hover:bg-teal-500 hover:text-white font-mono text-lg leading-none flex items-center justify-center transition-colors';
            });
        };
        const buildRunMarkup = (text, style, options = {}) => {
            const styles = [
                `color:${style.color}`,
                `font-weight:${style.bold ? '700' : '400'}`,
                `text-decoration:${[
                    style.underline ? 'underline' : '',
                    style.strike ? 'line-through' : ''
                ].filter(Boolean).join(' ') || 'none'}`
            ].join(';');

            const content = options.preserveSpaces
                ? escapeHtml(text).replace(/ /g, '&nbsp;')
                : escapeHtml(text);

            return `<span style="${styles}">${content}</span>`;
        };
        const buildRichRowHtml = (rowCells, options = {}) => {
            const runs = [];

            rowCells.forEach((cell) => {
                const style = {
                    color: normalizeColor(cell.color),
                    bold: Boolean(cell.bold),
                    underline: Boolean(cell.underline),
                    strike: Boolean(cell.strike)
                };
                const lastRun = runs[runs.length - 1];

                if (lastRun && isSameStyle(lastRun.style, style)) {
                    lastRun.text += cell.char;
                } else {
                    runs.push({ text: cell.char, style });
                }
            });

            return runs.map((run) => buildRunMarkup(run.text, run.style, options)).join('');
        };
        const buildRichClipboardPayloadFromCells = (cells) => ({
            text: cells.map((cell) => cell.char).join(''),
            html: buildRichRowHtml(cells, { preserveSpaces: true })
        });
        const buildRichClipboardPayloadForRow = (rowIndex) => buildRichClipboardPayloadFromCells(mapData[rowIndex] || []);
        const buildRichClipboardPayloadForSelection = (state = selectionState) => {
            const normalized = normalizeSelection(state);
            const start = Math.min(normalized.start, normalized.end);
            const end = Math.max(normalized.start, normalized.end);
            if (start === end) return null;

            const rowCells = (mapData[normalized.row] || []).slice(start, end);
            return buildRichClipboardPayloadFromCells(rowCells);
        };
        const buildRichClipboardPayloadForMap = () => ({
            text: getPlainTextMap(),
            html: mapData.map((rowCells) => buildRichRowHtml(rowCells, { preserveSpaces: true })).join('<br>')
        });
        const copyClipboardPayload = ({ text = '', html = '' }) => {
            if (!text && !html) return Promise.resolve(false);

            if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined' && html) {
                return navigator.clipboard.write([
                    new ClipboardItem({
                        'text/plain': new Blob([text], { type: 'text/plain' }),
                        'text/html': new Blob([html], { type: 'text/html' })
                    })
                ]).then(() => true).catch(() => (
                    navigator.clipboard.writeText(text).then(() => true).catch(() => false)
                ));
            }

            return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
        };
        const buildRectCellMarkup = (cell, rowIndex, colIndex) => {
            const isPreview = Boolean(
                rectDrag &&
                rowIndex >= Math.min(rectDrag.anchor.row, rectDrag.hover.row) &&
                rowIndex <= Math.max(rectDrag.anchor.row, rectDrag.hover.row) &&
                colIndex >= Math.min(rectDrag.anchor.col, rectDrag.hover.col) &&
                colIndex <= Math.max(rectDrag.anchor.col, rectDrag.hover.col)
            );
            const textDecoration = [
                cell.underline ? 'underline' : '',
                cell.strike ? 'line-through' : ''
            ].filter(Boolean).join(' ') || 'none';
            const displayUnits = getCharDisplayUnits(cell.char);
            const displayChar = escapeHtml(cell.char);

            return `
                <span
                    class="inline-flex shrink-0 items-center justify-center border transition-colors ${isPreview ? 'border-amber-300 bg-zinc-900' : 'border-transparent'}"
                    data-char-slot="true"
                    data-row="${rowIndex}"
                    data-col="${colIndex}"
                    style="
                        width:${displayUnits}ch;
                        min-width:${displayUnits}ch;
                        height:1.1em;
                        box-sizing:border-box;
                        color:${cell.color};
                        font-weight:${cell.bold ? '700' : '400'};
                        line-height:1;
                        text-decoration:${textDecoration};
                        vertical-align:top;
                        white-space:pre;
                    "
                >${displayChar}</span>
            `;
        };
        const renderRows = (options = {}) => {
            const isEraMono = this.config.font.includes('ERA MONO SC');

            container.innerHTML = mapData.map((rowCells, rowIndex) => {
                const rowBody = editorMode === 'text'
                    ? buildRichRowHtml(rowCells)
                    : `<div class="inline-flex flex-nowrap items-stretch leading-none whitespace-nowrap align-top">${rowCells.map((cell, colIndex) => buildRectCellMarkup(cell, rowIndex, colIndex)).join('')}</div>`;

                return `
                    <div class="flex items-center gap-2 group w-full">
                        <div class="text-[10px] text-zinc-600 font-mono w-6 text-right select-none shrink-0">${rowIndex + 1}</div>
                        <div
                            class="map-row-editor px-2 py-0 rounded outline outline-1 -outline-offset-1 transition-colors ${editorMode === 'text' ? 'cursor-text selection:bg-teal-500 selection:text-white' : 'cursor-crosshair'} ${editorMode === 'text' && activeRow === rowIndex ? 'outline-teal-500 bg-zinc-950/60' : 'outline-transparent hover:outline-zinc-800'}"
                            data-row-editor="${rowIndex}"
                            data-row="${rowIndex}"
                            contenteditable="${editorMode === 'text' ? 'true' : 'false'}"
                            spellcheck="false"
                            style="
                                white-space:pre;
                                display:block;
                                font-family:${this.config.font};
                                font-size:1.25rem;
                                line-height:1.0;
                                min-width:100%;
                                width:max-content;
                                padding-top:${editorMode === 'text' && isEraMono ? '3px' : '0px'};
                            "
                        >${rowBody}</div>
                        <button
                            type="button"
                            class="opacity-0 group-hover:opacity-100 text-teal-600 hover:text-teal-400 shrink-0 transition-opacity"
                            data-copy-row="${rowIndex}"
                            title="${formatTextMapString(t.copyRowTitle, { row: rowIndex + 1 })}"
                        >
                            <i data-lucide="copy" class="w-3 h-3"></i>
                        </button>
                    </div>
                `;
            }).join('');

            if (window.lucide) window.lucide.createIcons();

            if (editorMode === 'text' && options.restoreSelection !== false) {
                restoreSelection(selectionState, { focus: options.focus !== false });
            } else {
                refreshRowFocusState();
            }
        };
        const parseStyledCellsFromDom = (rootNode, maxCells = this.config.cols) => {
            const cells = [];
            const walk = (node, inheritedStyle) => {
                if (cells.length >= maxCells) return;

                if (node.nodeType === Node.TEXT_NODE) {
                    Array.from((node.nodeValue || '').replace(/\r?\n/g, '').replace(/\u200b/g, '').replace(/\u00a0/g, ' ')).forEach((char) => {
                        if (cells.length < maxCells) cells.push(createCell(char, inheritedStyle));
                    });
                    return;
                }

                if (node.nodeType !== Node.ELEMENT_NODE) return;

                const element = node;
                const tag = element.tagName.toLowerCase();
                if (tag === 'br') return;
                const nextStyle = {
                    color: inheritedStyle.color,
                    bold: inheritedStyle.bold,
                    underline: inheritedStyle.underline,
                    strike: inheritedStyle.strike
                };

                if (tag === 'b' || tag === 'strong') nextStyle.bold = true;
                if (tag === 'u') nextStyle.underline = true;
                if (tag === 's' || tag === 'strike' || tag === 'del') nextStyle.strike = true;

                const attrColor = element.getAttribute('color');
                const inlineColor = element.style.color;
                if (attrColor) nextStyle.color = normalizeColor(attrColor);
                if (inlineColor) nextStyle.color = normalizeColor(inlineColor);

                const inlineWeight = element.style.fontWeight;
                if (inlineWeight && (inlineWeight === 'bold' || parseInt(inlineWeight, 10) >= 600)) nextStyle.bold = true;

                const inlineDecoration = `${element.style.textDecoration || ''} ${element.style.textDecorationLine || ''}`;
                if (inlineDecoration.includes('underline')) nextStyle.underline = true;
                if (inlineDecoration.includes('line-through')) nextStyle.strike = true;

                Array.from(element.childNodes).forEach((child) => walk(child, nextStyle));
            };

            walk(rootNode, { color: defaultColor, bold: false, underline: false, strike: false });
            return cells;
        };
        const parseRowDom = (rowEl) => {
            const cells = parseStyledCellsFromDom(rowEl, this.config.cols);
            return ensureRowLength(cells);
        };
        const syncRowFromEditor = (rowIndex, options = {}) => {
            const rowEl = getRowEditor(rowIndex);
            if (!rowEl) return;

            const domSelection = getSelectionStateFromDom();
            mapData[rowIndex] = parseRowDom(rowEl);

            if (domSelection && domSelection.row === rowIndex) {
                activeRow = domSelection.row;
                selectionState = domSelection;
            } else if (options.selectionState) {
                selectionState = normalizeSelection(options.selectionState);
                activeRow = selectionState.row;
            }

            if (options.render !== false) {
                renderRows({ focus: options.focus !== false });
            }

            updateCursorLabel();
            updateCurrentStyleFromSelection();
            if (options.pushHistory !== false) pushHistory();
        };
        const syncAllRowsFromDom = (options = {}) => {
            if (editorMode !== 'text') return;

            for (let rowIndex = 0; rowIndex < this.config.rows; rowIndex += 1) {
                const rowEl = getRowEditor(rowIndex);
                if (rowEl) mapData[rowIndex] = parseRowDom(rowEl);
            }

            const domSelection = getSelectionStateFromDom();
            if (domSelection) {
                selectionState = domSelection;
                activeRow = domSelection.row;
            }

            if (options.render) renderRows({ focus: options.focus !== false });
        };
        const focusRowAt = (rowIndex, offset) => {
            activeRow = clamp(rowIndex, 0, this.config.rows - 1);
            selectionState = normalizeSelection({ row: activeRow, start: offset, end: offset });
            renderRows({ focus: true });
            updateCursorLabel();
            updateCurrentStyleFromSelection();
        };
        const resizeMap = (rows, cols) => {
            if (editorMode === 'text') syncAllRowsFromDom();

            this.config.rows = clamp(rows, 1, this.config.maxSize);
            this.config.cols = clamp(cols, 1, this.config.maxSize);

            inpRows.value = this.config.rows;
            inpCols.value = this.config.cols;
            lblRows.textContent = this.config.rows;
            lblCols.textContent = this.config.cols;

            const nextMap = createEmptyMap(this.config.rows, this.config.cols);
            for (let rowIndex = 0; rowIndex < this.config.rows; rowIndex += 1) {
                for (let colIndex = 0; colIndex < this.config.cols; colIndex += 1) {
                    if (mapData[rowIndex] && mapData[rowIndex][colIndex]) {
                        nextMap[rowIndex][colIndex] = cloneCell(mapData[rowIndex][colIndex]);
                    }
                }
            }

            mapData = nextMap;
            activeRow = clamp(activeRow, 0, this.config.rows - 1);
            selectionState = normalizeSelection({
                row: activeRow,
                start: selectionState.start,
                end: selectionState.end
            });
            renderRows({ focus: editorMode === 'text' });
            updateCursorLabel();
            updateCurrentStyleFromSelection();
            pushHistory();
        };
        const loadPlainTextMap = (text) => {
            const lines = String(text || '').replace(/\r/g, '').split('\n');
            const safeLines = lines.length > 0 ? lines : [''];
            const nextRows = clamp(safeLines.length, 1, this.config.maxSize);
            const nextCols = clamp(
                safeLines.reduce((maxLength, line) => Math.max(maxLength, Array.from(line).length), 1),
                1,
                this.config.maxSize
            );

            this.config.rows = nextRows;
            this.config.cols = nextCols;
            inpRows.value = nextRows;
            inpCols.value = nextCols;
            lblRows.textContent = nextRows;
            lblCols.textContent = nextCols;

            mapData = createEmptyMap(nextRows, nextCols);
            for (let rowIndex = 0; rowIndex < nextRows; rowIndex += 1) {
                const chars = Array.from(safeLines[rowIndex] || '');
                mapData[rowIndex] = ensureRowLength(chars.map((char) => createCell(char)));
            }

            activeRow = 0;
            selectionState = { row: 0, start: 0, end: 0 };
            renderRows({ focus: editorMode === 'text' });
            updateCursorLabel();
            updateCurrentStyleFromSelection();
            pushHistory();
        };
        const buildErbLine = (rowCells) => {
            const runs = [];

            rowCells.forEach((cell) => {
                const style = {
                    color: normalizeColor(cell.color),
                    bold: Boolean(cell.bold),
                    underline: Boolean(cell.underline),
                    strike: Boolean(cell.strike)
                };
                const lastRun = runs[runs.length - 1];

                if (lastRun && isSameStyle(lastRun.style, style)) {
                    lastRun.text += cell.char;
                } else {
                    runs.push({ text: cell.char, style });
                }
            });

            const html = runs.map((run) => {
                let segment = escapeHtml(run.text).replace(/ /g, '&nbsp;');

                if (run.style.color !== defaultColor) segment = `<font color='${run.style.color}'>${segment}</font>`;
                if (run.style.bold) segment = `<b>${segment}</b>`;
                if (run.style.underline) segment = `<u>${segment}</u>`;
                if (run.style.strike) segment = `<s>${segment}</s>`;

                return segment;
            }).join('');

            return `<nobr>${html}</nobr>`;
        };
        const buildErbScript = () => {
            const now = new Date();
            const timestamp = [
                now.getFullYear(),
                String(now.getMonth() + 1).padStart(2, '0'),
                String(now.getDate()).padStart(2, '0')
            ].join('-');

            const erbLines = [
                formatTextMapString(t.erbHeader, { timestamp }),
                '#DIMS DYNAMIC htmlString',
                'htmlString \'= ""'
            ];

            mapData.forEach((rowCells, rowIndex) => {
                erbLines.push(`htmlString += "${buildErbLine(rowCells)}"`);
                if (rowIndex < mapData.length - 1) {
                    erbLines.push('htmlString += "<br>"');
                }
            });

            erbLines.push('HTML_PRINT htmlString');

            return erbLines.join('\n');
        };
        const downloadFile = (filename, content) => {
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        };
        const applyStyleCommand = (command, value) => {
            if (editorMode !== 'text') return;

            restoreSelection(selectionState, { focus: true });

            try {
                document.execCommand('styleWithCSS', false, true);
            } catch (error) {
                // Ignore unsupported browsers and fall back to normal command calls.
            }

            if (typeof document.execCommand === 'function') {
                document.execCommand(command, false, value);
            }

            const normalized = normalizeSelection(selectionState);
            if (normalized.start !== normalized.end) {
                syncRowFromEditor(activeRow, { focus: true });
            } else {
                updateCurrentStyleFromSelection();
            }
        };
        const parseStyledCellsFromHtml = (html, maxCells = this.config.cols) => {
            const wrapper = document.createElement('div');
            wrapper.innerHTML = html;
            return parseStyledCellsFromDom(wrapper, maxCells);
        };
        const buildSanitizedClipboardHtml = (html, maxCells = this.config.cols) => {
            const cells = parseStyledCellsFromHtml(html, maxCells);
            return cells.length > 0 ? buildRichRowHtml(cells) : '';
        };
        const copyToolCharacter = (char) => copyClipboardPayload(
            buildRichClipboardPayloadFromCells([createCell(char, currentTextStyle)])
        );
        const applyRectangleFill = (start, end) => {
            if (!selectedBrush) return;

            if (editorMode === 'text') syncAllRowsFromDom();

            const bounds = getSelectionBounds(start, end);
            let changed = false;
            for (let rowIndex = bounds.rowStart; rowIndex <= bounds.rowEnd; rowIndex += 1) {
                for (let colIndex = bounds.colStart; colIndex <= bounds.colEnd; colIndex += 1) {
                    const nextCell = createCell(selectedBrush, currentTextStyle);
                    if (!isSameCell(mapData[rowIndex][colIndex], nextCell)) {
                        mapData[rowIndex][colIndex] = nextCell;
                        changed = true;
                    }
                }
            }

            activeRow = bounds.rowStart;
            selectionState = normalizeSelection({ row: activeRow, start: bounds.colStart, end: bounds.colStart });
            renderRows({ focus: false });
            updateCursorLabel();
            updateCurrentStyleFromSelection();
            if (changed) pushHistory();
        };
        const getRectSlotTargetFromEvent = (event) => {
            const slot = event.target.closest('[data-char-slot="true"]');
            if (!slot || !container.contains(slot)) return null;
            return {
                row: Number(slot.dataset.row),
                col: Number(slot.dataset.col)
            };
        };
        const checkFonts = () => {
            const options = selFont.querySelectorAll('option');
            options.forEach((option) => {
                if (!option.innerText.includes(t.installRequiredMarker)) return;

                const fontName = option.value.split(',')[0].replace(/['"]/g, '');
                if (!document.fonts.check(`12px ${fontName}`)) {
                    option.disabled = true;
                    option.style.color = '#ccc';
                }
            });
        };
        const preserveTextSelection = (event) => {
            if (editorMode !== 'text') return;
            if (event.target.matches('input[type="color"]')) return;
            event.preventDefault();
        };
        const captureSelectionFromDom = () => {
            if (editorMode !== 'text') return;

            const domSelection = getSelectionStateFromDom();
            if (!domSelection) return;

            selectionState = domSelection;
            activeRow = domSelection.row;
            refreshRowFocusState();
            updateCursorLabel();
            updateCurrentStyleFromSelection();
        };
        const handleEditorShortcuts = (event) => {
            if (modal && !modal.classList.contains('hidden')) return;
            if (!(event.ctrlKey || event.metaKey)) return;

            const key = event.key.toLowerCase();
            if (key === 'z' && !event.shiftKey) {
                event.preventDefault();
                undoHistory();
            } else if (key === 'y' || (key === 'z' && event.shiftKey)) {
                event.preventDefault();
                redoHistory();
            }
        };

        document.fonts.ready.then(checkFonts);

        if (typeof document.execCommand === 'function') {
            try {
                document.execCommand('styleWithCSS', false, true);
            } catch (error) {
                // Ignore.
            }
        }

        inpRows.addEventListener('change', (event) => resizeMap(parseInt(event.target.value, 10), this.config.cols));
        inpCols.addEventListener('change', (event) => resizeMap(this.config.rows, parseInt(event.target.value, 10)));

        selFont.addEventListener('change', (event) => {
            if (editorMode === 'text') syncAllRowsFromDom();
            this.config.font = event.target.value;
            lblFont.textContent = event.target.options[event.target.selectedIndex].text.split(' ')[0];
            renderRows({ focus: editorMode === 'text' });
        });

        btnModeText.addEventListener('click', () => {
            editorMode = 'text';
            rectDrag = null;
            syncModeUI();
            renderRows({ focus: true });
            updateCursorLabel();
            updateCurrentStyleFromSelection();
        });

        btnModeRect.addEventListener('click', () => {
            if (editorMode === 'text') syncAllRowsFromDom();
            editorMode = 'rect';
            rectDrag = null;
            syncModeUI();
            renderRows({ focus: false });
        });

        [btnStyleBold, btnStyleUnderline, btnStyleStrike].forEach((button) => {
            button.addEventListener('mousedown', preserveTextSelection);
        });
        charButtons.forEach((button) => {
            button.addEventListener('mousedown', preserveTextSelection);
        });

        charButtons.forEach((button) => {
            button.addEventListener('click', () => {
                const currentChar = button.dataset.char || button.innerText;
                setSelectedBrush(currentChar);

                if (editorMode === 'text') {
                    copyToolCharacter(currentChar);
                    return;
                }

                renderRows({ focus: false });
            });
        });

        btnUndo.addEventListener('click', () => undoHistory());
        btnRedo.addEventListener('click', () => redoHistory());

        inpSelectedChar.addEventListener('focus', (event) => {
            event.target.select();
        });
        inpSelectedChar.addEventListener('input', (event) => {
            setSelectedBrush(event.target.value);
        });

        inpTextColor.addEventListener('mousedown', () => {
            if (editorMode === 'text') captureSelectionFromDom();
        });
        inpTextColor.addEventListener('input', (event) => {
            const nextColor = normalizeColor(event.target.value);
            currentTextStyle.color = nextColor;
            updateStyleSample();

            if (editorMode === 'text') applyStyleCommand('foreColor', nextColor);
        });

        btnStyleBold.addEventListener('click', () => applyStyleCommand('bold'));
        btnStyleUnderline.addEventListener('click', () => applyStyleCommand('underline'));
        btnStyleStrike.addEventListener('click', () => applyStyleCommand('strikeThrough'));

        btnCopyAll.addEventListener('click', () => {
            if (editorMode === 'text') syncAllRowsFromDom();

            copyClipboardPayload(buildRichClipboardPayloadForMap());
            btnCopyAll.textContent = t.copied;

            if (copyAllResetTimer) clearTimeout(copyAllResetTimer);
            copyAllResetTimer = setTimeout(() => {
                btnCopyAll.innerHTML = `<i data-lucide="copy" class="w-3 h-3"></i> ${t.copyAll}`;
                if (window.lucide) window.lucide.createIcons();
            }, 2000);
        });

        btnExportErb.addEventListener('click', () => {
            if (editorMode === 'text') syncAllRowsFromDom();

            const now = new Date();
            const filename = `text-map-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}.erb`;
            downloadFile(filename, buildErbScript());
            btnExportErb.textContent = t.exported;

            if (exportResetTimer) clearTimeout(exportResetTimer);
            exportResetTimer = setTimeout(() => {
                btnExportErb.innerHTML = `<i data-lucide="file-down" class="w-3 h-3"></i> ${t.exportErb}`;
                if (window.lucide) window.lucide.createIcons();
            }, 2000);
        });

        btnImport.onclick = () => {
            modal.classList.remove('hidden');
            txtImport.focus();
        };

        btnCancelImport.onclick = () => {
            modal.classList.add('hidden');
            txtImport.value = '';
            if (editorMode === 'text') restoreSelection(selectionState, { focus: true });
        };

        btnConfirmImport.onclick = () => {
            loadPlainTextMap(txtImport.value);
            modal.classList.add('hidden');
            txtImport.value = '';
        };

        container.addEventListener('click', (event) => {
            const copyRowButton = event.target.closest('[data-copy-row]');
            if (copyRowButton) {
                if (editorMode === 'text') syncAllRowsFromDom();
                copyClipboardPayload(buildRichClipboardPayloadForRow(Number(copyRowButton.dataset.copyRow)));
            }
        });

        container.addEventListener('copy', (event) => {
            if (editorMode !== 'text') return;

            const domSelection = getSelectionStateFromDom();
            if (!domSelection) return;

            const rowEl = getRowEditor(domSelection.row);
            if (rowEl) mapData[domSelection.row] = parseRowDom(rowEl);

            const payload = buildRichClipboardPayloadForSelection(domSelection);
            if (!payload) return;

            selectionState = domSelection;
            activeRow = domSelection.row;
            event.preventDefault();

            if (event.clipboardData) {
                event.clipboardData.setData('text/plain', payload.text);
                event.clipboardData.setData('text/html', payload.html);
            } else {
                copyClipboardPayload(payload);
            }
        });

        container.addEventListener('focusin', (event) => {
            const rowEl = event.target.closest('[data-row-editor]');
            if (!rowEl || editorMode !== 'text') return;

            activeRow = Number(rowEl.dataset.row);
            requestAnimationFrame(captureSelectionFromDom);
        });

        container.addEventListener('mouseup', () => {
            if (editorMode !== 'text') return;
            requestAnimationFrame(captureSelectionFromDom);
        });

        container.addEventListener('keyup', (event) => {
            const rowEl = event.target.closest('[data-row-editor]');
            if (!rowEl || editorMode !== 'text') return;

            if (event.key === 'ArrowUp') {
                event.preventDefault();
                const normalized = normalizeSelection(getSelectionStateFromDom() || selectionState);
                focusRowAt(normalized.row - 1, normalized.start);
                return;
            }

            if (event.key === 'ArrowDown') {
                event.preventDefault();
                const normalized = normalizeSelection(getSelectionStateFromDom() || selectionState);
                focusRowAt(normalized.row + 1, normalized.start);
                return;
            }

            requestAnimationFrame(captureSelectionFromDom);
        });

        container.addEventListener('keydown', (event) => {
            const rowEl = event.target.closest('[data-row-editor]');
            if (!rowEl || editorMode !== 'text') return;

            if (event.key === 'Enter') {
                event.preventDefault();
                const normalized = normalizeSelection(getSelectionStateFromDom() || selectionState);
                focusRowAt(normalized.row + 1, normalized.start);
            } else if (event.key === 'Tab') {
                event.preventDefault();
                const normalized = normalizeSelection(getSelectionStateFromDom() || selectionState);
                focusRowAt(activeRow, event.shiftKey ? normalized.start - 1 : normalized.start + 1);
            }
        });

        container.addEventListener('paste', (event) => {
            const rowEl = event.target.closest('[data-row-editor]');
            if (!rowEl || editorMode !== 'text') return;

            event.preventDefault();
            const pastedHtml = event.clipboardData?.getData('text/html') || '';
            const sanitizedHtml = pastedHtml ? buildSanitizedClipboardHtml(pastedHtml) : '';
            const rowIndex = Number(rowEl.dataset.row);

            if (sanitizedHtml && typeof document.execCommand === 'function') {
                document.execCommand('insertHTML', false, sanitizedHtml);
                requestAnimationFrame(() => syncRowFromEditor(rowIndex, { focus: true }));
                return;
            }

            const pastedText = (event.clipboardData?.getData('text/plain') || '').replace(/\r?\n/g, '');
            if (typeof document.execCommand === 'function') {
                document.execCommand('insertText', false, pastedText);
                requestAnimationFrame(() => syncRowFromEditor(rowIndex, { focus: true }));
            }
        });

        container.addEventListener('input', (event) => {
            const rowEl = event.target.closest('[data-row-editor]');
            if (!rowEl || editorMode !== 'text') return;

            const rowIndex = Number(rowEl.dataset.row);
            if (composingRow === rowIndex) return;

            syncRowFromEditor(rowIndex, { focus: true });
        });

        container.addEventListener('compositionstart', (event) => {
            const rowEl = event.target.closest('[data-row-editor]');
            if (!rowEl || editorMode !== 'text') return;
            composingRow = Number(rowEl.dataset.row);
        });

        container.addEventListener('compositionend', (event) => {
            const rowEl = event.target.closest('[data-row-editor]');
            if (!rowEl || editorMode !== 'text') return;

            const rowIndex = Number(rowEl.dataset.row);
            composingRow = null;
            syncRowFromEditor(rowIndex, { focus: true });
        });

        container.addEventListener('mousedown', (event) => {
            if (event.button !== 0) return;

            if (editorMode !== 'rect') return;

            const target = getRectSlotTargetFromEvent(event);
            if (!target || !selectedBrush) return;

            rectDrag = { anchor: target, hover: target };
            activeRow = target.row;
            selectionState = normalizeSelection({ row: target.row, start: target.col, end: target.col });
            renderRows({ focus: false });
            event.preventDefault();
        });

        container.addEventListener('mouseover', (event) => {
            if (editorMode !== 'rect' || !rectDrag) return;

            const target = getRectSlotTargetFromEvent(event);
            if (!target) return;

            if (target.row === rectDrag.hover.row && target.col === rectDrag.hover.col) return;
            rectDrag.hover = target;
            renderRows({ focus: false });
        });

        const handleMouseUp = () => {
            if (editorMode !== 'rect' || !rectDrag) return;

            const finalRect = rectDrag;
            rectDrag = null;
            applyRectangleFill(finalRect.anchor, finalRect.hover);
        };

        document.addEventListener('selectionchange', captureSelectionFromDom);
        document.addEventListener('keydown', handleEditorShortcuts);
        document.addEventListener('mouseup', handleMouseUp);

        mapData = createEmptyMap(10, 10);
        lblFont.textContent = 'MS Gothic';
        syncModeUI();
        renderRows({ focus: true });
        updateCursorLabel();
        updateCurrentStyleFromSelection();
        pushHistory();
        syncHistoryButtons();

        if (window.lucide) window.lucide.createIcons();

        this._cleanup = () => {
            document.removeEventListener('selectionchange', captureSelectionFromDom);
            document.removeEventListener('keydown', handleEditorShortcuts);
            document.removeEventListener('mouseup', handleMouseUp);
            if (copyAllResetTimer) clearTimeout(copyAllResetTimer);
            if (exportResetTimer) clearTimeout(exportResetTimer);
        };
    }
};
