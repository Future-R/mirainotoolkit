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
            <div class="w-full flex justify-center pb-8 p-0 sm:p-4 overflow-hidden relative">
                <div id="ci-scale-wrapper" class="origin-top transition-transform duration-200 flex-shrink-0" style="width: 900px; min-width: 900px;">
                    <div id="character-intro-canvas" class="bg-white text-black p-12 relative shadow-lg w-full box-border" style="min-height: 1000px; font-family: 'Noto Sans SC', 'Microsoft YaHei', sans-serif;">
                    
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
            </div>

            <!-- Crop Modal -->
            <div id="ci-crop-modal" class="fixed inset-0 z-[200] hidden bg-[#141414] flex-col overflow-hidden">
                <!-- Header -->
                <div class="flex items-center justify-between p-4 border-b border-white/10 text-white">
                    <div class="w-8"></div>
                    <div class="font-bold">裁剪图片</div>
                    <button id="btn-crop-close" class="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
                
                <!-- Crop Area -->
                <div class="flex-1 relative overflow-hidden flex items-center justify-center bg-black/80 ci-crop-container touch-none" id="ci-crop-container">
                    <img id="ci-crop-img" class="absolute left-1/2 top-1/2 origin-center cursor-move max-w-none max-h-none pointer-events-none" style="transform: translate(-50%, -50%);" draggable="false" />
                    
                    <!-- Circular Overlay -->
                    <div class="absolute inset-0 pointer-events-none" style="box-shadow: 0 0 0 9999px rgba(0,0,0,0.6); border-radius: 50%; width: 320px; height: 320px; box-sizing: content-box; left: 50%; top: 50%; transform: translate(-50%, -50%);"></div>
                    <div class="absolute inset-0 pointer-events-none border-2 border-white/50 rounded-full" style="width: 320px; height: 320px; left: 50%; top: 50%; transform: translate(-50%, -50%);"></div>
                </div>
                
                <!-- Controls -->
                <div class="bg-[#141414] p-6 pb-8 text-white w-full">
                    <!-- Slider -->
                    <div class="flex items-center gap-4 max-w-md mx-auto mb-8">
                        <i data-lucide="zoom-out" class="w-6 h-6 text-white/70"></i>
                        <input type="range" id="ci-crop-slider" min="0.1" max="3" step="0.01" value="1" class="flex-1 h-1.5 bg-white/20 rounded-full appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full cursor-pointer accent-[#1872F2]" />
                        <i data-lucide="zoom-in" class="w-6 h-6 text-white/70"></i>
                    </div>
                    
                    <!-- Buttons -->
                    <div class="flex items-center justify-center gap-4">
                        <button id="btn-crop-cancel" class="px-8 py-2 rounded-lg border border-white/20 hover:bg-white/10 transition-colors text-sm">取消</button>
                        <button id="btn-crop-save" class="px-8 py-2 rounded-lg bg-[#1872F2] hover:bg-[#1872F2]/90 transition-colors text-sm">保存</button>
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
        // --- Crop State ---
        let ciCropId = null;
        let ciCropScale = 1;
        let ciMinScale = 1;
        let ciPanX = 0;
        let ciPanY = 0;
        let ciStartX = 0;
        let ciStartY = 0;
        let ciIsDragging = false;
        let ciImgNaturalWidth = 0;
        let ciImgNaturalHeight = 0;
        let ciInitialDistance = 0;
        let ciInitialScale = 1;
        const CI_CROP_SIZE = 320;

        const modal = document.getElementById('ci-crop-modal');
        const cropImg = document.getElementById('ci-crop-img');
        const container = document.getElementById('ci-crop-container');
        const slider = document.getElementById('ci-crop-slider');

        const updateCropTransform = () => {
            cropImg.style.transform = `translate(calc(-50% + ${ciPanX}px), calc(-50% + ${ciPanY}px)) scale(${ciCropScale})`;
        };

        const constrainPan = () => {
            const imgBoundWidth = ciImgNaturalWidth * ciCropScale;
            const imgBoundHeight = ciImgNaturalHeight * ciCropScale;
            
            const maxPanX = Math.max(0, (imgBoundWidth - CI_CROP_SIZE) / 2);
            const maxPanY = Math.max(0, (imgBoundHeight - CI_CROP_SIZE) / 2);
            
            ciPanX = Math.max(-maxPanX, Math.min(ciPanX, maxPanX));
            ciPanY = Math.max(-maxPanY, Math.min(ciPanY, maxPanY));
        };

        const openCropModal = (src) => {
            cropImg.onload = () => {
                ciImgNaturalWidth = cropImg.naturalWidth || 1;
                ciImgNaturalHeight = cropImg.naturalHeight || 1;
                
                const scaleX = CI_CROP_SIZE / ciImgNaturalWidth;
                const scaleY = CI_CROP_SIZE / ciImgNaturalHeight;
                ciMinScale = Math.max(scaleX, scaleY); // Ensure we cover the hole
                
                ciCropScale = ciMinScale;
                ciPanX = 0;
                ciPanY = 0;
                
                slider.min = ciMinScale;
                slider.max = ciMinScale * 4;
                slider.value = ciCropScale;
                
                updateCropTransform();
                
                if (window.lucide) window.lucide.createIcons({root: modal});
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            };
            cropImg.src = src;
        };

        const closeCropModal = () => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            ciCropId = null;
            cropImg.src = '';
        };

        document.getElementById('btn-crop-cancel').addEventListener('click', closeCropModal);
        document.getElementById('btn-crop-close').addEventListener('click', closeCropModal);
        
        document.getElementById('btn-crop-save').addEventListener('click', () => {
            if (!ciCropId) return;
            const canvas = document.createElement('canvas');
            canvas.width = CI_CROP_SIZE;
            canvas.height = CI_CROP_SIZE;
            const ctx = canvas.getContext('2d');
            
            // Draw background as white or transparent? Characters usually have white background.
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, CI_CROP_SIZE, CI_CROP_SIZE);
            
            ctx.translate(CI_CROP_SIZE/2, CI_CROP_SIZE/2);
            ctx.translate(ciPanX, ciPanY);
            ctx.scale(ciCropScale, ciCropScale);
            
            ctx.drawImage(cropImg, -ciImgNaturalWidth/2, -ciImgNaturalHeight/2, ciImgNaturalWidth, ciImgNaturalHeight);
            
            const croppedDataUrl = canvas.toDataURL('image/png', 1.0);
            
            const targetImg = document.getElementById(`ci-img-${ciCropId}`);
            const placeholder = document.getElementById(`ci-placeholder-${ciCropId}`);
            targetImg.src = croppedDataUrl;
            targetImg.classList.remove('hidden');
            placeholder.classList.add('hidden');
            
            closeCropModal();
        });

        // Drag handlers
        const getClientPos = (e) => {
            if (e.touches && e.touches.length > 0) {
                return { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
            return { x: e.clientX, y: e.clientY };
        };

        const startDrag = (e) => {
            if (!modal.classList.contains('flex')) return;
            if (e.touches && e.touches.length > 1) return;

            ciIsDragging = true;
            const pos = getClientPos(e);
            
            ciStartX = pos.x - ciPanX;
            ciStartY = pos.y - ciPanY;
        };

        const onDrag = (e) => {
            if (!ciIsDragging || !modal.classList.contains('flex')) return;
            if (e.touches && e.touches.length > 1) return;
            
            if (e.cancelable) {
                e.preventDefault();
            }
            
            const pos = getClientPos(e);
            ciPanX = pos.x - ciStartX;
            ciPanY = pos.y - ciStartY;
            
            constrainPan();
            updateCropTransform();
        };

        const endDrag = () => { ciIsDragging = false; };

        container.addEventListener('mousedown', startDrag);
        container.addEventListener('touchstart', startDrag, { passive: false });
        window.addEventListener('mousemove', onDrag, { passive: false });
        window.addEventListener('touchmove', onDrag, { passive: false });
        window.addEventListener('mouseup', endDrag);
        window.addEventListener('touchend', endDrag);

        // Pinch handlers
        container.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2 && modal.classList.contains('flex')) {
                ciIsDragging = false;
                ciInitialDistance = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
                ciInitialScale = ciCropScale;
            }
        }, {passive: false});

        container.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2 && modal.classList.contains('flex')) {
                if (e.cancelable) e.preventDefault();
                const currentDistance = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
                
                ciCropScale = ciInitialScale * (currentDistance / ciInitialDistance);
                ciCropScale = Math.max(ciMinScale, Math.min(ciCropScale, ciMinScale * 4));
                slider.value = ciCropScale;
                
                constrainPan();
                updateCropTransform();
            }
        }, {passive: false});

        // Wheel Zoom
        container.addEventListener('wheel', (e) => {
            if (!modal.classList.contains('flex')) return;
            if (e.cancelable) e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            ciCropScale = ciCropScale * (1 + delta);
            ciCropScale = Math.max(ciMinScale, Math.min(ciCropScale, ciMinScale * 4));
            
            slider.value = ciCropScale;
            constrainPan();
            updateCropTransform();
        }, { passive: false });

        // Slider
        slider.addEventListener('input', (e) => {
            ciCropScale = parseFloat(e.target.value);
            constrainPan();
            updateCropTransform();
        });

        // File Upload Handlers
        for(let i=1; i<=4; i++) {
            const fileInput = document.getElementById(`ci-file-${i}`);
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if(file && file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        ciCropId = i;
                        openCropModal(event.target.result);
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

        // Resize Scaling
        window.ciIsExporting = false;

        const updateScale = () => {
            if (window.ciIsExporting) return;

            const wrapper = document.getElementById('ci-scale-wrapper');
            if (!wrapper || !wrapper.parentElement) return;
            const containerWidth = wrapper.parentElement.clientWidth;
            
            // Add some margin on extremely small screens
            const padding = containerWidth < 640 ? 16 : 0;
            const targetWidth = containerWidth - padding;

            if (targetWidth < 900) {
                const scale = targetWidth / 900;
                wrapper.style.transform = `scale(${scale})`;
                // Remove the extra visual space caused by CSS transform keeping the original DOM height
                wrapper.style.marginBottom = `-${wrapper.offsetHeight * (1 - scale)}px`;
            } else {
                wrapper.style.transform = 'scale(1)';
                wrapper.style.marginBottom = '0px';
            }
        };

        const resizeObserver = new ResizeObserver(() => updateScale());
        const wrapper = document.getElementById('ci-scale-wrapper');
        if (wrapper) {
            resizeObserver.observe(wrapper);
            if (wrapper.parentElement) resizeObserver.observe(wrapper.parentElement);
        }

        window.addEventListener('resize', updateScale);
        // Initial call
        setTimeout(updateScale, 10);

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
                window.ciIsExporting = true;
                const canvasElement = document.getElementById('character-intro-canvas');
                const wrapperElement = document.getElementById('ci-scale-wrapper');
                
                // Temporarily remove transform for accurate render
                wrapperElement.style.transform = 'scale(1)';
                wrapperElement.style.marginBottom = '0px';
                
                // Wait for browser reflow
                await new Promise(resolve => setTimeout(resolve, 50));

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
                window.ciIsExporting = false;
                // Restore responsive scale
                updateScale();

                overlay.classList.add('hidden');
                overlay.classList.remove('flex');
            }
        });
    }
};
