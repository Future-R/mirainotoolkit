(function() {
    const ns = window.App.textMap;
    if (!ns) return;

    ns.renderPage = function renderPage() {
        const t = ns.getStrings();
        const toolboxChars = ns.TOOLBOX_CHARS;
        const defaultConfig = ns.DEFAULT_CONFIG;

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
                                <span>${t.rows}: <span id="lbl-rows">${defaultConfig.rows}</span></span>
                                <span>${t.cols}: <span id="lbl-cols">${defaultConfig.cols}</span></span>
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
                                    <input id="inp-cols" type="number" min="1" max="${defaultConfig.maxSize}" value="${defaultConfig.cols}" class="w-full bg-white border border-zinc-300 rounded px-2 py-1 text-sm font-mono text-center">
                                </div>
                                <div>
                                    <label class="text-[10px] font-bold text-zinc-400 block mb-1">${t.height} (H)</label>
                                    <input id="inp-rows" type="number" min="1" max="${defaultConfig.maxSize}" value="${defaultConfig.rows}" class="w-full bg-white border border-zinc-300 rounded px-2 py-1 text-sm font-mono text-center">
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
    };
})();
