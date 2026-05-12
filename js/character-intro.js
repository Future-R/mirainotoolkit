// --- CHARACTER INTRO ---
window.App = window.App || {};
window.App.pages = window.App.pages || {};

window.App.pages.characterIntro = {
    render: function() {
        return `
        <div class="flex flex-col items-center justify-start flex-1 w-full fade-in pb-20">
            <!-- Toolbar -->
            <div class="bg-white/80 backdrop-blur border border-zinc-200 shadow-sm rounded-2xl p-4 mb-6 flex flex-wrap gap-4 items-center justify-center sticky top-4 z-50">
               <button id="btn-export-img" class="atom-btn px-6 py-2 flex items-center gap-2">
                   <i data-lucide="download" class="w-4 h-4"></i>
                   导出为图片
               </button>
               <button id="btn-clear-all" class="atom-btn px-6 py-2 flex items-center gap-2">
                   <i data-lucide="trash-2" class="w-4 h-4"></i>
                   清空内容
               </button>
               <span class="text-xs text-zinc-400 font-bold ml-4">点击图片或文字即可进行修改</span>
            </div>

            <!-- Canvas Container (Responsive Wrapper) -->
            <div class="w-full overflow-x-auto flex justify-center pb-8 p-4">
                <div id="character-intro-canvas" class="bg-white text-black p-12 relative flex-shrink-0 shadow-lg" style="width: 900px; min-height: 1000px; font-family: 'Noto Sans SC', 'Microsoft YaHei', sans-serif;">
                    
                    <!-- Header -->
                    <div class="mb-10 text-left">
                        <div class="text-[52px] font-black mb-4 mx-2 outline-none whitespace-nowrap min-w-[200px]" contenteditable="true" spellcheck="false" id="ci-main-title">登场人物介绍</div>
                        <div class="w-full flex flex-col gap-1">
                            <div class="w-full h-3 bg-black"></div>
                            <div class="w-full h-1 bg-black"></div>
                        </div>
                    </div>
                    
                    <!-- Grid -->
                    <div class="grid grid-cols-2 gap-y-16 gap-x-12 px-6 mt-12 pb-12">
                        ${this.renderCharacterItem(1, "人类少年", "很在意村里的精灵大姐姐。")}
                        ${this.renderCharacterItem(2, "精灵大姐姐", "对同村的人类少年温柔。")}
                        ${this.renderCharacterItem(3, "哥布林小子", "刚搬入村就对精灵大姐姐动歪心思。")}
                        ${this.renderCharacterItem(4, "矮人大叔", "村头老实本分的铁匠但没够着头像框。")}
                    </div>

                </div>
            </div>
            <!-- Generating Overlay -->
            <div id="export-overlay" class="fixed inset-0 bg-white/80 backdrop-blur z-[100] hidden items-center justify-center flex-col gap-4">
                <i data-lucide="loader-2" class="w-10 h-10 animate-spin text-orange-500"></i>
                <div class="text-zinc-600 font-bold tracking-widest text-sm">正在生成图片...</div>
            </div>
        </div>
        `;
    },
    
    renderCharacterItem: function(id, defaultName, defaultDesc) {
        return `
        <div class="flex flex-col items-center character-item" data-id="${id}">
            <div class="w-[320px] h-[320px] rounded-full border-[3px] border-black overflow-hidden relative cursor-pointer group bg-white mx-auto flex items-center justify-center avatar-container" onclick="document.getElementById('ci-file-${id}').click()">
                <img id="ci-img-${id}" class="w-full h-full object-cover hidden" />
                <span id="ci-placeholder-${id}" class="text-zinc-300 group-hover:text-zinc-500 transition-colors pointer-events-none flex flex-col items-center">
                    <i data-lucide="upload" class="w-12 h-12 mb-2"></i>
                    <span class="text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">上传头像</span>
                </span>
                <input type="file" id="ci-file-${id}" class="hidden flex-shrink-0" accept="image/*">
            </div>
            <div class="mt-8 text-center w-full px-2">
                <div class="text-[38px] font-bold outline-none mb-3 character-name" contenteditable="true" spellcheck="false">${defaultName}</div>
                <div class="text-[18px] font-normal text-zinc-800 outline-none character-desc" contenteditable="true" spellcheck="false">${defaultDesc}</div>
            </div>
        </div>
        `;
    },

    mount: function() {
        if(window.lucide) window.lucide.createIcons();
        this.attachEvents();
    },

    attachEvents: function() {
        // File Upload Handlers
        for(let i=1; i<=4; i++) {
            const fileInput = document.getElementById(`ci-file-${i}`);
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if(file && file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const img = document.getElementById(`ci-img-${i}`);
                        const placeholder = document.getElementById(`ci-placeholder-${i}`);
                        img.src = event.target.result;
                        img.classList.remove('hidden');
                        placeholder.classList.add('hidden');
                        
                        // Clear input to allow re-uploading the same file if needed
                        fileInput.value = '';
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        // Clear All
        const btnClear = document.getElementById('btn-clear-all');
        btnClear.addEventListener('click', () => {
             document.getElementById('ci-main-title').innerText = "登场人物介绍";
             for(let i=1; i<=4; i++) {
                 const img = document.getElementById(`ci-img-${i}`);
                 const placeholder = document.getElementById(`ci-placeholder-${i}`);
                 img.src = '';
                 img.classList.add('hidden');
                 placeholder.classList.remove('hidden');
             }
             
             const defaultTexts = [
                 ["人类少年", "很在意村里的精灵大姐姐。"],
                 ["精灵大姐姐", "对同村的人类少年温柔。"],
                 ["哥布林小子", "刚搬入村就对精灵大姐姐动歪心思。"],
                 ["矮人大叔", "村头老实本分的铁匠但没够着头像框。"]
             ];
             
             const items = document.querySelectorAll('.character-item');
             items.forEach((item, index) => {
                 item.querySelector('.character-name').innerText = defaultTexts[index][0];
                 item.querySelector('.character-desc').innerText = defaultTexts[index][1];
             });
        });

        // Export Image
        const btnExport = document.getElementById('btn-export-img');
        const overlay = document.getElementById('export-overlay');
        
        btnExport.addEventListener('click', async () => {
            if (typeof html2canvas === 'undefined') {
                alert('html2canvas 取未加载，请刷新页面后重试。');
                return;
            }

            // Unfocus any active element to remove carets (text cursors) from output
            if (document.activeElement) {
                document.activeElement.blur();
            }

            // Briefly show overlay
            overlay.classList.remove('hidden');
            overlay.classList.add('flex');

            try {
                const canvasElement = document.getElementById('character-intro-canvas');
                
                // Keep original scale but use a solid scale for html2canvas
                const canvas = await html2canvas(canvasElement, {
                    scale: 2, // High quality
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    logging: false
                });

                const imgData = canvas.toDataURL('image/png');
                
                const link = document.createElement('a');
                link.download = '登场人物介绍.png';
                link.href = imgData;
                link.click();
            } catch (error) {
                console.error("Export failed:", error);
                alert("导出失败，请查看控制台日志。");
            } finally {
                overlay.classList.add('hidden');
                overlay.classList.remove('flex');
            }
        });
    }
};
