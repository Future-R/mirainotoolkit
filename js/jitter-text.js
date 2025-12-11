

// --- JITTER TEXT GENERATOR ---
window.App = window.App || {};
window.App.pages = window.App.pages || {};

window.App.pages.jitterText = {
    settings: {
        text: "とても不安です",
        bgColor: "#FFFEFF",
        textColor: "#FF66CC",
        fontSize: 60,
        intensity: 10,
        fps: 30,
        fontFamily: "'Noto Sans SC', sans-serif"
    },
    isRecording: false,
    animationId: null,
    lastFrameTime: 0,

    render: function() {
        return `
        <div class="flex flex-col items-center justify-center flex-1 w-full fade-in py-6">
            <div class="streamline-shell w-full max-w-4xl p-6 bg-gradient-to-br from-white to-green-50">
                <div class="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 border-b border-zinc-200 pb-4">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-green-400 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white">
                            <i data-lucide="vibrate" class="w-5 h-5"></i>
                        </div>
                        <div>
                            <h2 class="text-lg font-black text-zinc-700 tracking-wider">不安抖动器</h2>
                            <div class="text-[10px] text-zinc-400 font-bold">在宇宙中心呼唤不安</div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <span id="status-badge" class="px-3 py-1 bg-zinc-100 rounded-full text-[10px] font-bold text-zinc-400">就绪</span>
                    </div>
                </div>

                <div class="flex flex-col lg:flex-row gap-8">
                    <!-- Left: Controls -->
                    <div class="w-full lg:w-80 flex flex-col gap-5">
                        <div class="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
                            <label class="text-[10px] font-bold text-zinc-400 block mb-2 tracking-widest">输入文本 (支持换行)</label>
                            <textarea id="inp-text" rows="4" class="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-sm font-bold text-zinc-700 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none">${this.settings.text}</textarea>
                        </div>

                        <div class="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm grid grid-cols-2 gap-4">
                             <div>
                                <label class="text-[10px] font-bold text-zinc-400 block mb-2 tracking-widest">文字颜色</label>
                                <div class="flex items-center gap-2">
                                    <input id="inp-color-text" type="color" value="${this.settings.textColor}" class="w-8 h-8 rounded cursor-pointer border-0 p-0">
                                    <span class="text-xs font-mono text-zinc-500" id="lbl-color-text">${this.settings.textColor}</span>
                                </div>
                            </div>
                            <div>
                                <label class="text-[10px] font-bold text-zinc-400 block mb-2 tracking-widest">背景颜色</label>
                                <div class="flex items-center gap-2">
                                    <input id="inp-color-bg" type="color" value="${this.settings.bgColor}" class="w-8 h-8 rounded cursor-pointer border-0 p-0">
                                    <span class="text-xs font-mono text-zinc-500" id="lbl-color-bg">${this.settings.bgColor}</span>
                                </div>
                            </div>
                        </div>

                        <div class="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
                             <div class="mb-4">
                                <label class="text-[10px] font-bold text-zinc-400 block mb-2 tracking-widest flex justify-between">
                                    <span>字号大小</span>
                                    <span id="lbl-fontsize">${this.settings.fontSize}px</span>
                                </label>
                                <input id="inp-fontsize" type="range" min="12" max="120" value="${this.settings.fontSize}" class="w-full accent-green-500 h-2 bg-zinc-100 rounded-lg appearance-none cursor-pointer">
                            </div>
                             <div class="mb-4">
                                <label class="text-[10px] font-bold text-zinc-400 block mb-2 tracking-widest flex justify-between">
                                    <span>抖动强度</span>
                                    <span id="lbl-intensity">${this.settings.intensity}</span>
                                </label>
                                <input id="inp-intensity" type="range" min="0" max="20" value="${this.settings.intensity}" class="w-full accent-green-500 h-2 bg-zinc-100 rounded-lg appearance-none cursor-pointer">
                            </div>
                             <div>
                                <label class="text-[10px] font-bold text-zinc-400 block mb-2 tracking-widest flex justify-between">
                                    <span>帧率 (FPS)</span>
                                    <span id="lbl-fps">${this.settings.fps}</span>
                                </label>
                                <input id="inp-fps" type="range" min="12" max="60" value="${this.settings.fps}" class="w-full accent-green-500 h-2 bg-zinc-100 rounded-lg appearance-none cursor-pointer">
                            </div>
                        </div>

                        <button id="btn-export" class="atom-btn py-4 w-full bg-green-50 text-green-600 border-green-200 border-b-green-300 shadow-lg shadow-green-100">
                            生成 GIF 下载
                        </button>
                    </div>

                    <!-- Right: Preview -->
                    <div class="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden bg-zinc-900/5 rounded-2xl border border-zinc-100">
                        <!-- CRT Screen Container for Preview -->
                        <div class="device-screen relative shadow-2xl rounded-lg overflow-hidden border-4 border-zinc-700 flex items-center justify-center bg-black max-w-full max-h-[600px] overflow-auto">
                            <!-- Canvas will resize automatically -->
                            <canvas id="preview-canvas" class="block"></canvas>
                            
                            <!-- Loading Overlay inside CRT -->
                            <div id="loading-overlay" class="absolute inset-0 bg-black/90 z-20 hidden flex flex-col items-center justify-center">
                                <div class="w-12 h-12 border-4 border-green-900 border-t-green-500 rounded-full animate-spin mb-4"></div>
                                <span class="text-xs font-bold text-green-500 tracking-widest animate-pulse font-mono">RENDERING_GIF...</span>
                            </div>
                        </div>
                        
                        <div class="mt-4 flex items-center gap-2">
                             <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_5px_#22c55e]"></div>
                             <span class="text-[10px] font-bold text-zinc-400 tracking-widest uppercase">CRT PREVIEW ACTIVE</span>
                        </div>
                        <div class="text-[10px] text-zinc-400 mt-1">
                            画布尺寸将随文字自动调整
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
    },

    mount: function() {
        const canvas = document.getElementById('preview-canvas');
        const ctx = canvas.getContext('2d');
        const statusBadge = document.getElementById('status-badge');
        const loadingOverlay = document.getElementById('loading-overlay');
        
        // Inputs
        const inputs = {
            text: document.getElementById('inp-text'),
            textColor: document.getElementById('inp-color-text'),
            bgColor: document.getElementById('inp-color-bg'),
            fontSize: document.getElementById('inp-fontsize'),
            intensity: document.getElementById('inp-intensity'),
            fps: document.getElementById('inp-fps'),
            export: document.getElementById('btn-export')
        };
        
        // Labels
        const labels = {
            textColor: document.getElementById('lbl-color-text'),
            bgColor: document.getElementById('lbl-color-bg'),
            fontSize: document.getElementById('lbl-fontsize'),
            intensity: document.getElementById('lbl-intensity'),
            fps: document.getElementById('lbl-fps')
        };

        // Update Logic
        const updateSettings = () => {
            this.settings.text = inputs.text.value;
            this.settings.textColor = inputs.textColor.value;
            this.settings.bgColor = inputs.bgColor.value;
            this.settings.fontSize = parseInt(inputs.fontSize.value);
            this.settings.intensity = parseInt(inputs.intensity.value);
            this.settings.fps = parseInt(inputs.fps.value);

            // Update Labels
            labels.textColor.innerText = this.settings.textColor;
            labels.bgColor.innerText = this.settings.bgColor;
            labels.fontSize.innerText = this.settings.fontSize + 'px';
            labels.intensity.innerText = this.settings.intensity;
            labels.fps.innerText = this.settings.fps;
        };

        // Auto Resize and Draw Frame
        const drawFrame = () => {
            // 1. Calculate required dimensions
            // We must set font on context to measure text, even if we are going to resize (which clears context)
            ctx.font = `${this.settings.fontSize}px ${this.settings.fontFamily}`;
            const lines = this.settings.text.split('\n');
            const lineHeight = this.settings.fontSize * 1.2;
            
            let maxWidth = 0;
            lines.forEach(line => {
                const w = ctx.measureText(line).width;
                if (w > maxWidth) maxWidth = w;
            });

            // Add padding (intensity * 4 to cover jitters + basic padding)
            const paddingX = Math.max(40, this.settings.intensity * 6);
            const paddingY = Math.max(40, this.settings.intensity * 6);
            
            // Min size 200x200
            const newWidth = Math.max(200, Math.ceil(maxWidth + paddingX * 2));
            const newHeight = Math.max(100, Math.ceil((lines.length * lineHeight) + paddingY * 2));

            // Resize if needed (this clears the canvas)
            if (canvas.width !== newWidth || canvas.height !== newHeight) {
                canvas.width = newWidth;
                canvas.height = newHeight;
            } else {
                 // If not resized, clear manually
                 ctx.clearRect(0, 0, canvas.width, canvas.height);
            }

            // 2. Redraw Background
            ctx.fillStyle = this.settings.bgColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 3. Reset Font (because resize clears context state)
            ctx.font = `${this.settings.fontSize}px ${this.settings.fontFamily}`;
            ctx.textBaseline = 'top';
            
            // 4. Draw Text
            let totalContentHeight = lines.length * lineHeight;
            let startY = (canvas.height - totalContentHeight) / 2;

            lines.forEach((line, lineIndex) => {
                const lineWidth = ctx.measureText(line).width;
                let startX = (canvas.width - lineWidth) / 2;
                
                // Draw each char with jitter
                let cursorX = startX;
                for (let char of line) {
                    const jitterX = (Math.random() - 0.5) * this.settings.intensity * 2;
                    const jitterY = (Math.random() - 0.5) * this.settings.intensity * 2;
                    
                    ctx.fillStyle = this.settings.textColor;
                    ctx.fillText(char, cursorX + jitterX, startY + (lineIndex * lineHeight) + jitterY);
                    
                    cursorX += ctx.measureText(char).width;
                }
            });
        };

        // Animation Loop
        const loop = (timestamp) => {
            if (!this.isRecording) {
                // Calculate time elapsed
                if (!this.lastFrameTime) this.lastFrameTime = timestamp;
                const elapsed = timestamp - this.lastFrameTime;
                
                // Cap framerate based on settings
                const fpsInterval = 1000 / this.settings.fps;

                if (elapsed > fpsInterval) {
                    drawFrame();
                    // Adjust for drift
                    this.lastFrameTime = timestamp - (elapsed % fpsInterval);
                }
                
                this.animationId = requestAnimationFrame(loop);
            }
        };

        // Event Listeners
        Object.values(inputs).forEach(inp => {
            if(inp && inp !== inputs.export) {
                inp.addEventListener('input', updateSettings);
            }
        });

        // Start Loop
        if (this.animationId) cancelAnimationFrame(this.animationId);
        loop();

        // Export GIF
        inputs.export.addEventListener('click', async () => {
            if (this.isRecording) return;
            this.isRecording = true;
            loadingOverlay.classList.remove('hidden');
            cancelAnimationFrame(this.animationId);

            // --- Worker Blob Setup for CORS safety ---
            const workerBlob = new Blob([`
                importScripts('https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js');
            `], { type: 'application/javascript' });
            const workerUrl = URL.createObjectURL(workerBlob);

            try {
                // eslint-disable-next-line no-undef
                const gif = new GIF({
                    workers: 2,
                    quality: 10,
                    workerScript: workerUrl,
                    width: canvas.width,
                    height: canvas.height,
                    background: this.settings.bgColor // optimize transparent pixels if any, though we fill rect
                });

                // Calculate frames
                const fps = this.settings.fps;
                // We want a loop of about 1-2 seconds.
                // 15 frames at 20fps = 0.75s.
                // Let's aim for ~1 second of jitter.
                const framesToRecord = Math.max(10, Math.ceil(fps)); 
                const delay = 1000 / fps;

                for (let i = 0; i < framesToRecord; i++) {
                    drawFrame(); // Draw a new jittered frame
                    gif.addFrame(ctx, {copy: true, delay: delay});
                }

                gif.on('finished', (blob) => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `于${Date.now()}不安.gif`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    
                    // Reset
                    loadingOverlay.classList.add('hidden');
                    this.isRecording = false;
                    URL.revokeObjectURL(workerUrl);
                    loop(); // Restart preview
                });

                gif.render();

            } catch (e) {
                alert("GIF生成失败，请检查浏览器兼容性或网络连接。");
                console.error(e);
                loadingOverlay.classList.add('hidden');
                this.isRecording = false;
                loop();
            }
        });
        
        if(window.lucide) window.lucide.createIcons();
    }
};
