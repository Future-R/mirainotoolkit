// --- TEXT MAP EDITOR ---
window.App = window.App || {};
window.App.pages = window.App.pages || {};

window.App.pages.textMapEditor = {
    config: { rows: 10, cols: 10, font: "'MS Gothic', monospace", maxSize: 40 },

    render: function() {
        const toolboxChars = [
            '┌','┬','┐','┏','┳','┓','╔','╦','╗','╭','─','╮',
            '├','┼','┤','┣','╋','┫','╠','╬','╣','│','╳','┃', 
            '└','┴','┘','┗','┻','┛','╚','╩','╝','╰','━','╯', 
            '┍','┑','┎','┒','╒','╕','╓','╖','／','＼','┄','┅',
            '┕','┙','┖','┚','╘','╛','╙','╜','＜','＞','┆','┇',
            '①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩','♨','✟',
            '※','◎','□','■','♠','♥','♦','♣','↑','↓','←','→',
            '○','●','Ｏ','Ｘ','＠','　','△','▽','◇','▲','▼','◆',
            '〓','∞','～','┄','┅','┆','┇','≈','⊙','░','▒','▓'
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
                            <h2 class="text-lg font-black text-zinc-700 tracking-wider">文字地图编辑器</h2>
                            <div class="text-[10px] text-zinc-400 font-bold">ERA 终端制图</div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button id="btn-import" type="button" class="px-3 py-2 bg-white border border-zinc-300 rounded text-xs font-bold text-zinc-600 hover:bg-zinc-50 flex items-center gap-1 shadow-sm">
                            <i data-lucide="upload" class="w-3 h-3"></i> 导入
                        </button>
                        <button id="btn-copy-all" type="button" class="px-3 py-2 bg-teal-500 border border-teal-600 rounded text-xs font-bold text-white hover:bg-teal-600 flex items-center gap-1 shadow-sm">
                            <i data-lucide="copy" class="w-3 h-3"></i> 复制全图
                        </button>
                    </div>
                </div>

                <div class="flex flex-col lg:flex-row gap-6">
                    <div class="flex-1 min-w-0">
                        <div class="device-screen bg-black min-h-[700px] p-6 overflow-auto relative">
                            <div class="flex justify-between text-[10px] font-mono text-teal-700 mb-2 select-none">
                                <span>行: <span id="lbl-rows">10</span></span>
                                <span>列: <span id="lbl-cols">10</span></span>
                                <span>字体: <span id="lbl-font">MS Gothic</span></span>
                            </div>
                            <div id="map-container" class="flex flex-col gap-0 w-max min-w-full border border-zinc-800 bg-black">
                                <!-- Rows injected via JS -->
                            </div>
                        </div>
                    </div>

                    <div class="w-full lg:w-96 flex flex-col gap-6">
                        <div class="bg-zinc-100 p-4 rounded-lg border border-zinc-200">
                            <h3 class="text-xs font-bold text-zinc-500 tracking-widest mb-3 uppercase">地图参数</h3>
                            <div class="grid grid-cols-2 gap-3 mb-4">
                                <div>
                                    <label class="text-[10px] font-bold text-zinc-400 block mb-1">宽度 (W)</label>
                                    <input id="inp-cols" type="number" min="1" max="40" value="10" class="w-full bg-white border border-zinc-300 rounded px-2 py-1 text-sm font-mono text-center">
                                </div>
                                <div>
                                    <label class="text-[10px] font-bold text-zinc-400 block mb-1">高度 (H)</label>
                                    <input id="inp-rows" type="number" min="1" max="40" value="10" class="w-full bg-white border border-zinc-300 rounded px-2 py-1 text-sm font-mono text-center">
                                </div>
                            </div>
                            <div class="mb-4">
                                <label class="text-[10px] font-bold text-zinc-400 block mb-1">字体选择</label>
                                <select id="sel-font" class="w-full bg-white border border-zinc-300 rounded px-2 py-1 text-xs font-bold text-zinc-700">
                                    <option value="'MS Gothic', monospace">MS Gothic (era 默认)</option>
                                    <option value="'ERA MONO SC', 'MS Gothic', monospace">ERA MONO SC (需安装)</option>
                                    <option value="'EraPixel', 'MS Gothic', monospace">EraPixel (需安装)</option>
                                </select>
                                <a href="https://gitgud.io/era-games-zh/meta/eraFonts" target="_blank" rel="noopener noreferrer" class="block text-right text-[10px] text-teal-600 font-bold mt-1 hover:underline">下载字体资源 ></a>
                            </div>
                        </div>

                        <div class="bg-zinc-100 p-4 rounded-lg border border-zinc-200 flex-1">
                            <div class="flex items-center justify-between gap-3 mb-3">
                                <h3 class="text-xs font-bold text-zinc-500 tracking-widest uppercase">字符工具箱</h3>
                                <div id="brush-preview" class="min-w-16 px-3 py-1 rounded bg-white border border-zinc-300 text-center font-mono text-sm font-black text-zinc-700">未选中</div>
                            </div>

                            <div class="grid grid-cols-2 gap-2 mb-3">
                                <button id="btn-mode-copy" type="button" class="px-3 py-2 rounded border text-xs font-bold transition-colors">复制模式</button>
                                <button id="btn-mode-paint" type="button" class="px-3 py-2 rounded border text-xs font-bold transition-colors">画笔模式</button>
                                <button id="btn-mode-rect" type="button" class="px-3 py-2 rounded border text-xs font-bold transition-colors col-span-2">矩形模式</button>
                            </div>

                            <div id="tool-mode-tip" class="mb-3 rounded-lg border border-teal-200 bg-white px-3 py-2 text-[10px] font-bold text-zinc-500 leading-5">
                                点击字符会复制到剪贴板。
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
                    <h3 class="text-lg font-black text-zinc-800 mb-4">导入地图文本</h3>
                    <textarea id="import-text" class="w-full h-48 bg-zinc-50 border border-zinc-300 rounded-lg p-3 font-mono text-xs mb-4 focus:ring-2 focus:ring-teal-500 outline-none" placeholder="在此处粘贴文本..."></textarea>
                    <div class="flex justify-end gap-3">
                        <button id="btn-cancel-import" type="button" class="px-4 py-2 text-zinc-500 font-bold hover:bg-zinc-100 rounded">取消</button>
                        <button id="btn-confirm-import" type="button" class="px-4 py-2 bg-teal-500 text-white font-bold rounded hover:bg-teal-600">确认导入</button>
                    </div>
                </div>
            </div>
        </div>
        `;
    },

    mount: function() {
        const blankCell = 'Ｘ';
        const container = document.getElementById('map-container');
        const inpRows = document.getElementById('inp-rows');
        const inpCols = document.getElementById('inp-cols');
        const selFont = document.getElementById('sel-font');
        const lblRows = document.getElementById('lbl-rows');
        const lblCols = document.getElementById('lbl-cols');
        const lblFont = document.getElementById('lbl-font');
        const btnCopyAll = document.getElementById('btn-copy-all');
        const btnImport = document.getElementById('btn-import');
        const btnModeCopy = document.getElementById('btn-mode-copy');
        const btnModePaint = document.getElementById('btn-mode-paint');
        const btnModeRect = document.getElementById('btn-mode-rect');
        const toolModeTip = document.getElementById('tool-mode-tip');
        const brushPreview = document.getElementById('brush-preview');
        const modal = document.getElementById('modal-import');
        const btnCancelImport = document.getElementById('btn-cancel-import');
        const btnConfirmImport = document.getElementById('btn-confirm-import');
        const txtImport = document.getElementById('import-text');
        const charButtons = Array.from(document.querySelectorAll('.btn-char'));

        let mapData = [];
        let editorMode = 'copy';
        let selectedBrush = '';
        let rectStart = null;
        let copyAllResetTimer = null;

        const copyText = (text) => navigator.clipboard.writeText(text).catch(() => {});
        const normalizeRow = (text = '') => text.padEnd(this.config.cols, blankCell).substring(0, this.config.cols);

        const syncModeUI = () => {
            const isCopyMode = editorMode === 'copy';
            const isPaintMode = editorMode === 'paint';
            const isRectMode = editorMode === 'rect';

            btnModeCopy.className = isCopyMode
                ? 'px-3 py-2 rounded border text-xs font-bold transition-colors bg-teal-500 border-teal-600 text-white'
                : 'px-3 py-2 rounded border text-xs font-bold transition-colors bg-white border-zinc-300 text-zinc-600 hover:bg-zinc-50';
            btnModePaint.className = isPaintMode
                ? 'px-3 py-2 rounded border text-xs font-bold transition-colors bg-teal-500 border-teal-600 text-white'
                : 'px-3 py-2 rounded border text-xs font-bold transition-colors bg-white border-zinc-300 text-zinc-600 hover:bg-zinc-50';
            btnModeRect.className = isRectMode
                ? 'px-3 py-2 rounded border text-xs font-bold transition-colors col-span-2 bg-teal-500 border-teal-600 text-white'
                : 'px-3 py-2 rounded border text-xs font-bold transition-colors col-span-2 bg-white border-zinc-300 text-zinc-600 hover:bg-zinc-50';

            if (isCopyMode) {
                brushPreview.className = 'min-w-16 px-3 py-1 rounded bg-white border border-zinc-300 text-center font-mono text-sm font-black text-zinc-700';
                brushPreview.textContent = '复制中';
                toolModeTip.textContent = '点击字符会复制到剪贴板。';
            } else if (selectedBrush) {
                brushPreview.className = 'min-w-16 px-3 py-1 rounded bg-teal-500 border border-teal-600 text-center font-mono text-sm font-black text-white';
                brushPreview.textContent = selectedBrush;
                if (isPaintMode) {
                    toolModeTip.textContent = `当前画笔：${selectedBrush}。点击左侧地图任意位置，会直接替换该位置的字符。`;
                } else if (rectStart) {
                    toolModeTip.textContent = `当前矩形字符：${selectedBrush}。已选起点 (${rectStart.row}, ${rectStart.col})，请再点击一个终点来填满矩形。`;
                } else {
                    toolModeTip.textContent = `当前矩形字符：${selectedBrush}。先点击左侧地图选择矩形起点，再点击终点完成填充。`;
                }
            } else {
                brushPreview.className = 'min-w-16 px-3 py-1 rounded bg-amber-50 border border-amber-200 text-center font-mono text-sm font-black text-amber-700';
                brushPreview.textContent = '未选中';
                toolModeTip.textContent = isRectMode
                    ? '矩形模式下，请先从字符工具箱选择一个字符，再点击左侧地图选择起点。'
                    : '画笔模式下，请先从字符工具箱选择一个字符，再点击左侧地图。';
            }

            charButtons.forEach((button) => {
                const isSelected = !isCopyMode && selectedBrush && button.dataset.char === selectedBrush;
                button.className = isSelected
                    ? 'btn-char w-full h-6 bg-teal-500 text-white ring-2 ring-teal-200 font-mono text-lg leading-none flex items-center justify-center transition-colors'
                    : 'btn-char w-full h-6 bg-white hover:bg-teal-500 hover:text-white font-mono text-lg leading-none flex items-center justify-center transition-colors';
            });
        };

        const applyBrush = (rowIndex, colIndex) => {
            if (editorMode !== 'paint' || !selectedBrush) return;

            const rowText = normalizeRow(mapData[rowIndex] || '');
            const safeColIndex = Math.max(0, Math.min(colIndex, this.config.cols - 1));
            const updatedRow = `${rowText.slice(0, safeColIndex)}${selectedBrush}${rowText.slice(safeColIndex + 1)}`;

            mapData[rowIndex] = updatedRow;

            const rowInput = container.querySelector(`input[data-row="${rowIndex}"]`);
            if (rowInput) {
                rowInput.value = updatedRow;
                rowInput.focus();
                const nextCaret = Math.min(safeColIndex + 1, updatedRow.length);
                rowInput.setSelectionRange(nextCaret, nextCaret);
            }
        };

        const fillRectangle = (start, end) => {
            if (!selectedBrush) return;

            const minRow = Math.max(0, Math.min(start.row, end.row));
            const maxRow = Math.min(this.config.rows - 1, Math.max(start.row, end.row));
            const minCol = Math.max(0, Math.min(start.col, end.col));
            const maxCol = Math.min(this.config.cols - 1, Math.max(start.col, end.col));

            for (let rowIndex = minRow; rowIndex <= maxRow; rowIndex += 1) {
                const rowText = normalizeRow(mapData[rowIndex] || '');
                const fillText = selectedBrush.repeat(maxCol - minCol + 1);
                const updatedRow = `${rowText.slice(0, minCol)}${fillText}${rowText.slice(maxCol + 1)}`;
                mapData[rowIndex] = updatedRow;

                const rowInput = container.querySelector(`input[data-row="${rowIndex}"]`);
                if (rowInput) {
                    rowInput.value = updatedRow;
                }
            }
        };

        const checkFonts = () => {
            const options = selFont.querySelectorAll('option');
            options.forEach((option) => {
                if (option.innerText.includes('需安装')) {
                    const fontName = option.value.split(',')[0].replace(/['"]/g, '');
                    if (!document.fonts.check(`12px ${fontName}`)) {
                        option.disabled = true;
                        option.style.color = '#ccc';
                    }
                }
            });
        };

        const initMap = (rows, cols) => {
            this.config.rows = Math.min(Math.max(rows, 1), this.config.maxSize);
            this.config.cols = Math.min(Math.max(cols, 1), this.config.maxSize);

            inpRows.value = this.config.rows;
            inpCols.value = this.config.cols;
            lblRows.innerText = this.config.rows;
            lblCols.innerText = this.config.cols;

            const newData = [];
            for (let i = 0; i < this.config.rows; i += 1) {
                newData.push(normalizeRow(mapData[i] || ''));
            }

            mapData = newData;
            rectStart = null;
            renderGrid();
        };

        const renderGrid = () => {
            container.innerHTML = '';
            const isEraMono = this.config.font.includes('ERA MONO SC');

            mapData.forEach((rowText, rowIndex) => {
                const rowEl = document.createElement('div');
                rowEl.className = 'flex items-center gap-2 group w-full';

                const lineNum = document.createElement('div');
                lineNum.className = 'text-[10px] text-zinc-600 font-mono w-4 text-right select-none shrink-0';
                lineNum.innerText = rowIndex;

                const input = document.createElement('input');
                input.type = 'text';
                input.value = rowText;
                input.dataset.row = String(rowIndex);
                input.className = 'bg-transparent text-white font-mono border-none outline-none p-0 m-0 block focus:bg-zinc-900 focus:text-teal-400 selection:bg-teal-500 selection:text-white shrink-0';
                input.style.fontFamily = this.config.font;
                input.style.fontSize = '1.25rem';
                input.style.lineHeight = '1.0';
                input.style.letterSpacing = '0px';
                input.style.height = '1.0em';
                input.style.width = '60rem';
                input.style.minWidth = '100%';
                input.spellcheck = false;

                if (isEraMono) {
                    input.style.paddingTop = '3px';
                }

                input.addEventListener('input', (event) => {
                    mapData[rowIndex] = event.target.value;
                });

                input.addEventListener('click', (event) => {
                    const clickIndex = Math.max(0, Math.min(input.selectionStart ?? 0, this.config.cols - 1));

                    if (editorMode === 'paint' && selectedBrush) {
                        applyBrush(rowIndex, clickIndex);
                        event.preventDefault();
                        return;
                    }

                    if (editorMode === 'rect' && selectedBrush) {
                        if (!rectStart) {
                            rectStart = { row: rowIndex, col: clickIndex };
                            syncModeUI();
                        } else {
                            fillRectangle(rectStart, { row: rowIndex, col: clickIndex });
                            rectStart = null;
                            syncModeUI();
                        }
                        event.preventDefault();
                    }
                });

                const btnCopy = document.createElement('button');
                btnCopy.type = 'button';
                btnCopy.className = 'opacity-0 group-hover:opacity-100 text-teal-600 hover:text-teal-400 shrink-0';
                btnCopy.innerHTML = '<i data-lucide="copy" class="w-3 h-3"></i>';
                btnCopy.onclick = () => copyText(mapData[rowIndex]);

                rowEl.appendChild(lineNum);
                rowEl.appendChild(input);
                rowEl.appendChild(btnCopy);
                container.appendChild(rowEl);
            });

            syncModeUI();
            if (window.lucide) window.lucide.createIcons();
        };

        document.fonts.ready.then(checkFonts);

        inpRows.addEventListener('change', (event) => initMap(parseInt(event.target.value, 10), this.config.cols));
        inpCols.addEventListener('change', (event) => initMap(this.config.rows, parseInt(event.target.value, 10)));

        selFont.addEventListener('change', (event) => {
            this.config.font = event.target.value;
            lblFont.innerText = event.target.options[event.target.selectedIndex].text.split(' ')[0];
            renderGrid();
        });

        btnModeCopy.addEventListener('click', () => {
            editorMode = 'copy';
            rectStart = null;
            syncModeUI();
        });

        btnModePaint.addEventListener('click', () => {
            editorMode = 'paint';
            rectStart = null;
            syncModeUI();
        });

        btnModeRect.addEventListener('click', () => {
            editorMode = 'rect';
            rectStart = null;
            syncModeUI();
        });

        charButtons.forEach((button) => {
            button.addEventListener('click', () => {
                const currentChar = button.dataset.char || button.innerText;

                if (editorMode === 'paint' || editorMode === 'rect') {
                    selectedBrush = currentChar;
                    if (editorMode === 'rect') rectStart = null;
                    syncModeUI();
                    return;
                }

                copyText(currentChar);
            });
        });

        btnCopyAll.addEventListener('click', () => {
            copyText(mapData.join('\n'));
            btnCopyAll.innerText = '已复制';

            if (copyAllResetTimer) clearTimeout(copyAllResetTimer);
            copyAllResetTimer = setTimeout(() => {
                btnCopyAll.innerHTML = '<i data-lucide="copy" class="w-3 h-3"></i> 复制全图';
                if (window.lucide) window.lucide.createIcons();
            }, 2000);
        });

        btnImport.onclick = () => modal.classList.remove('hidden');
        btnCancelImport.onclick = () => modal.classList.add('hidden');

        btnConfirmImport.onclick = () => {
            const text = txtImport.value;
            const lines = text.split('\n');

            if (lines.length > 0) {
                const newRows = lines.length;
                let newCols = 0;
                lines.forEach((line) => {
                    if (line.length > newCols) newCols = line.length;
                });
                mapData = lines;
                initMap(newRows, newCols);
            }

            modal.classList.add('hidden');
            txtImport.value = '';
        };

        initMap(10, 10);
        syncModeUI();
        if (window.lucide) window.lucide.createIcons();
    }
};
