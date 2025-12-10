
// --- TEXT MAP EDITOR ---
window.App = window.App || {};
window.App.pages = window.App.pages || {};

window.App.pages.textMapEditor = {
    config: { rows: 10, cols: 10, font: "'MS Gothic', monospace", maxSize: 40 },
    render: function() {
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
                        <button id="btn-import" class="px-3 py-2 bg-white border border-zinc-300 rounded text-xs font-bold text-zinc-600 hover:bg-zinc-50 flex items-center gap-1 shadow-sm">
                            <i data-lucide="upload" class="w-3 h-3"></i> 导入
                        </button>
                        <button id="btn-copy-all" class="px-3 py-2 bg-teal-500 border border-teal-600 rounded text-xs font-bold text-white hover:bg-teal-600 flex items-center gap-1 shadow-sm">
                            <i data-lucide="copy" class="w-3 h-3"></i> 复制全图
                        </button>
                    </div>
                </div>

                <div class="flex flex-col lg:flex-row gap-6">
                    <div class="flex-1 min-w-0">
                        <!-- Map Container Area -->
                        <div class="device-screen bg-black min-h-[700px] p-6 overflow-auto relative">
                            <div class="flex justify-between text-[10px] font-mono text-teal-700 mb-2 select-none">
                                <span>行: <span id="lbl-rows">10</span></span>
                                <span>列: <span id="lbl-cols">10</span></span>
                                <span>字体: <span id="lbl-font">MS Gothic</span></span>
                            </div>
                            <!-- Actual Grid Container -->
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
                                    <option value="'MS Gothic', monospace">MS Gothic (era默认)</option>
                                    <option value="'ERA MONO SC', 'MS Gothic', monospace">ERA MONO SC (需安装)</option>
                                    <option value="'EraPixel', 'MS Gothic', monospace">EraPixel (需安装)</option>
                                </select>
                                <a href="https://gitgud.io/era-games-zh/meta/eraFonts" target="_blank" class="block text-right text-[10px] text-teal-600 font-bold mt-1 hover:underline">下载字体资源 ></a>
                            </div>
                        </div>
                        <div class="bg-zinc-100 p-4 rounded-lg border border-zinc-200 flex-1">
                            <h3 class="text-xs font-bold text-zinc-500 tracking-widest mb-3 uppercase">字符工具箱</h3>
                            <div class="grid grid-cols-12 gap-px bg-zinc-200 border border-zinc-200 rounded overflow-hidden">
                                ${['┌','┬','┐','┏','┳','┓','╔','╦','╗','╭','─','╮',
                                    '├','┼','┤','┣','╋','┫','╠','╬','╣','│','╳','┃',
                                    '└','┴','┘','┗','┻','┛','╚','╩','╝','╰','━','╯',
                                    '┍','┑','┎','┒','╒','╕','╓','╖','╱','╲','┄','┅',
                                    '┕','┙','┖','┚','╘','╛','╙','╜','╲','╱','┆','┇',
                                    '①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩','♨','✟',
                                    '※','◎','□','■','♠','♥','♦','♣','↑','↓','←','→'].map(c => `<button class="btn-char w-full h-6 bg-white hover:bg-teal-500 hover:text-white font-mono text-xs flex items-center justify-center transition-colors">${c}</button>`).join('')}
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
                        <button id="btn-cancel-import" class="px-4 py-2 text-zinc-500 font-bold hover:bg-zinc-100 rounded">取消</button>
                        <button id="btn-confirm-import" class="px-4 py-2 bg-teal-500 text-white font-bold rounded hover:bg-teal-600">确认导入</button>
                    </div>
                </div>
            </div>
        </div>
        `;
    },
    mount: function() {
        const container = document.getElementById('map-container');
        const inpRows = document.getElementById('inp-rows');
        const inpCols = document.getElementById('inp-cols');
        const selFont = document.getElementById('sel-font');
        const lblRows = document.getElementById('lbl-rows');
        const lblCols = document.getElementById('lbl-cols');
        const lblFont = document.getElementById('lbl-font');
        const btnCopyAll = document.getElementById('btn-copy-all');
        const modal = document.getElementById('modal-import');
        const btnImport = document.getElementById('btn-import');
        const btnCancelImport = document.getElementById('btn-cancel-import');
        const btnConfirmImport = document.getElementById('btn-confirm-import');
        const txtImport = document.getElementById('import-text');
        let mapData = [];
        
        const checkFonts = () => {
                const options = selFont.querySelectorAll('option');
                options.forEach(opt => {
                    if (opt.innerText.includes('需安装')) {
                        const fontName = opt.value.split(',')[0].replace(/['"]/g, '');
                        if (!document.fonts.check(`12px ${fontName}`)) {
                            opt.disabled = true;
                            opt.style.color = '#ccc';
                        }
                    }
                });
        };
        document.fonts.ready.then(checkFonts);

        const initMap = (r, c) => {
            this.config.rows = Math.min(Math.max(r, 1), this.config.maxSize);
            this.config.cols = Math.min(Math.max(c, 1), this.config.maxSize);
            inpRows.value = this.config.rows;
            inpCols.value = this.config.cols;
            lblRows.innerText = this.config.rows;
            lblCols.innerText = this.config.cols;
            const newData = [];
            for(let i=0; i<this.config.rows; i++) {
                let rowStr = "";
                if (mapData[i]) rowStr = mapData[i].padEnd(this.config.cols, 'Ｘ').substring(0, this.config.cols);
                else rowStr = 'Ｘ'.repeat(this.config.cols);
                newData.push(rowStr);
            }
            mapData = newData;
            renderGrid();
        };

        const renderGrid = () => {
            container.innerHTML = '';
            mapData.forEach((rowText, idx) => {
                const rowEl = document.createElement('div');
                rowEl.className = "flex items-center gap-2 group w-full";
                const lineNum = document.createElement('div');
                lineNum.className = "text-[10px] text-zinc-600 font-mono w-4 text-right select-none shrink-0";
                lineNum.innerText = idx;
                
                const input = document.createElement('input');
                input.type = 'text';
                input.value = rowText;
                input.className = "bg-transparent text-white font-mono border-none outline-none p-0 m-0 block focus:bg-zinc-900 focus:text-teal-400 selection:bg-teal-500 selection:text-white shrink-0";
                input.style.fontFamily = this.config.font;
                input.style.fontSize = "1.25rem";
                input.style.lineHeight = "1.0";
                input.style.letterSpacing = "0px";
                input.style.height = "1.0em";
                // Fixed Width Logic: 40 chars * 2em approx to ensure fit
                input.style.width = "60rem"; 
                input.style.minWidth = "100%";
                input.spellcheck = false;
                
                input.addEventListener('input', (e) => mapData[idx] = e.target.value);
                
                const btnCopy = document.createElement('button');
                btnCopy.className = "opacity-0 group-hover:opacity-100 text-teal-600 hover:text-teal-400 shrink-0";
                btnCopy.innerHTML = '<i data-lucide="copy" class="w-3 h-3"></i>';
                btnCopy.onclick = () => navigator.clipboard.writeText(mapData[idx]);
                
                rowEl.appendChild(lineNum);
                rowEl.appendChild(input);
                rowEl.appendChild(btnCopy);
                container.appendChild(rowEl);
            });
            if(window.lucide) window.lucide.createIcons();
        };

        inpRows.addEventListener('change', (e) => initMap(parseInt(e.target.value), this.config.cols));
        inpCols.addEventListener('change', (e) => initMap(this.config.rows, parseInt(e.target.value)));
        selFont.addEventListener('change', (e) => {
            this.config.font = e.target.value;
            lblFont.innerText = e.target.options[e.target.selectedIndex].text.split(' ')[0];
            renderGrid();
        });
        document.querySelectorAll('.btn-char').forEach(btn => {
            btn.addEventListener('click', () => navigator.clipboard.writeText(btn.innerText));
        });
        btnCopyAll.addEventListener('click', () => {
            navigator.clipboard.writeText(mapData.join('\n'));
            btnCopyAll.innerText = "已复制!";
            setTimeout(() => btnCopyAll.innerHTML = '<i data-lucide="copy" class="w-3 h-3"></i> 复制全图', 2000);
        });
        btnImport.onclick = () => modal.classList.remove('hidden');
        btnCancelImport.onclick = () => modal.classList.add('hidden');
        btnConfirmImport.onclick = () => {
            const text = txtImport.value;
            const lines = text.split('\n');
            if (lines.length > 0) {
                const newRows = lines.length;
                let newCols = 0;
                lines.forEach(l => { if(l.length > newCols) newCols = l.length; });
                mapData = lines;
                initMap(newRows, newCols);
            }
            modal.classList.add('hidden');
            txtImport.value = '';
        };
        initMap(10, 10);
        if(window.lucide) window.lucide.createIcons();
    }
};
