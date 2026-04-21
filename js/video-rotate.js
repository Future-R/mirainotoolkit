// --- VIDEO ROTATOR ---
window.App = window.App || {};
window.App.pages = window.App.pages || {};

window.App.pages.videoRotator = {
    ffmpeg: null,
    ffmpegProgressHandler: null,
    ffmpegLogHandler: null,
    resizeHandler: null,
    state: {
        file: null,
        fileUrl: '',
        outputUrl: '',
        rotationSteps: 0,
        rotationOps: 0,
        isPreparingCore: false,
        isConverting: false,
        progress: 0,
        statusText: '请先上传 1 个视频文件',
        statusTone: 'idle',
        lastLog: '等待转换',
        resultName: ''
    },

    render: function() {
        const requiresLocalServer = window.location.protocol === 'file:';

        return `
        <div class="flex flex-col items-center justify-center flex-1 w-full fade-in py-6">
            <div class="streamline-shell w-full max-w-6xl p-6 bg-gradient-to-br from-white to-amber-50">
                <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6 border-b border-zinc-200 pb-4">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white">
                            <i data-lucide="film" class="w-5 h-5"></i>
                        </div>
                        <div>
                            <h2 class="text-lg font-black text-zinc-700 tracking-wider">视频旋转器</h2>
                            <div class="text-[10px] text-zinc-400 font-bold">上传本地视频，连续 90 度旋转后再确认转换</div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <span id="video-rotate-status" class="px-3 py-1 bg-zinc-100 rounded-full text-[10px] font-bold text-zinc-500">等待上传</span>
                    </div>
                </div>

                ${requiresLocalServer ? `
                <div class="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 leading-7">
                    当前页面是通过 <span class="font-mono">file://</span> 打开的，浏览器会拦截视频转换依赖的 Worker 和 WASM 资源。
                    请先在仓库目录运行 <span class="font-mono">node serve-local.js</span>，然后改用
                    <span class="font-mono">http://127.0.0.1:8080/</span> 或 <span class="font-mono">http://localhost:8080/</span> 打开。
                </div>
                ` : ''}

                <div class="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-6">
                    <div class="flex flex-col gap-5">
                        <div class="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
                            <label class="text-[10px] font-bold text-zinc-400 tracking-widest block mb-3">本地视频</label>
                            <label for="video-file-input" class="atom-btn inline-flex items-center justify-center gap-2 px-4 py-3 w-full cursor-pointer">
                                <i data-lucide="upload" class="w-4 h-4"></i>
                                <span>选择 1 个视频文件</span>
                            </label>
                            <input id="video-file-input" type="file" accept="video/*" class="hidden">
                            <div id="video-file-meta" class="mt-4 text-sm text-zinc-500 leading-6">
                                尚未选择文件
                            </div>
                        </div>

                        <div class="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
                            <div class="flex items-center justify-between gap-3 mb-4">
                                <div>
                                    <div class="text-[10px] font-bold text-zinc-400 tracking-widest">旋转控制</div>
                                    <div class="text-xs text-zinc-500 mt-1">每次调整 90 度，确认后才真正开始转换</div>
                                </div>
                                <div id="video-rotation-pill" class="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-black">
                                    当前 0°
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-3 mb-3">
                                <button id="btn-rotate-left" class="atom-btn py-3 px-4 text-sm flex items-center justify-center gap-2">
                                    <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
                                    <span>逆时针 90°</span>
                                </button>
                                <button id="btn-rotate-right" class="atom-btn py-3 px-4 text-sm flex items-center justify-center gap-2">
                                    <i data-lucide="rotate-cw" class="w-4 h-4"></i>
                                    <span>顺时针 90°</span>
                                </button>
                            </div>

                            <button id="btn-rotation-reset" class="w-full px-4 py-3 rounded-full border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-sm font-bold text-zinc-600 transition-colors">
                                重置角度
                            </button>

                            <div id="video-rotation-meta" class="mt-4 text-xs text-zinc-500 leading-6">
                                已旋转 0 次，当前角度 0°
                            </div>
                        </div>

                        <div class="bg-zinc-950 text-zinc-100 p-4 rounded-2xl border border-zinc-800 shadow-sm">
                            <div class="flex items-center justify-between gap-3 mb-3">
                                <div>
                                    <div class="text-[10px] font-bold text-zinc-400 tracking-widest">转换进度</div>
                                    <div id="video-progress-text" class="text-sm font-bold text-white mt-1">等待开始</div>
                                </div>
                                <div id="video-progress-percent" class="text-lg font-black text-amber-400 font-mono">0%</div>
                            </div>
                            <div class="h-3 bg-zinc-800 rounded-full overflow-hidden">
                                <div id="video-progress-bar" class="h-full w-0 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 transition-all duration-300"></div>
                            </div>
                            <div id="video-progress-log" class="mt-3 text-[11px] text-zinc-400 font-mono break-all leading-5">
                                等待转换核心加载
                            </div>
                        </div>

                        <button id="btn-video-confirm" class="atom-btn py-4 w-full bg-amber-50 text-amber-700 border-amber-200 border-b-amber-300 shadow-lg shadow-amber-100 flex items-center justify-center gap-2">
                            <i data-lucide="clapperboard" class="w-4 h-4"></i>
                            <span>确认并开始转换</span>
                        </button>
                    </div>

                    <div class="bg-zinc-100/70 rounded-[2rem] border border-zinc-200 p-4 md:p-6 flex flex-col gap-4 min-w-0">
                        <div class="flex items-center justify-between gap-3">
                            <div>
                                <div class="text-[10px] font-bold text-zinc-400 tracking-widest">预览窗口</div>
                                <div class="text-sm text-zinc-500 mt-1">这里展示的是确认前的旋转效果</div>
                            </div>
                            <div id="video-preview-angle" class="text-xs font-black px-3 py-1 rounded-full bg-white border border-zinc-200 text-zinc-600">
                                预览角度 0°
                            </div>
                        </div>

                        <div id="video-preview-stage" class="relative min-h-[24rem] md:min-h-[32rem] rounded-[1.75rem] bg-zinc-950 border border-zinc-800 overflow-hidden flex items-center justify-center">
                            <div id="video-preview-empty" class="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 gap-3 px-6 text-center">
                                <i data-lucide="video" class="w-12 h-12 text-zinc-700"></i>
                                <div class="text-sm font-bold text-zinc-400">上传视频后可在这里预览旋转结果</div>
                                <div class="text-xs text-zinc-500">视频始终在本地处理，不会上传到服务器</div>
                            </div>

                            <div id="video-preview-frame" class="relative flex items-center justify-center transition-all duration-300 ease-out">
                                <video id="video-preview" class="rounded-2xl shadow-2xl transition-transform duration-300 ease-out bg-black" controls playsinline preload="metadata"></video>
                            </div>

                            <div id="video-busy-mask" class="absolute inset-0 hidden bg-black/70 backdrop-blur-[2px] flex flex-col items-center justify-center gap-4 z-10">
                                <div class="w-12 h-12 border-4 border-white/20 border-t-amber-400 rounded-full animate-spin"></div>
                                <div id="video-busy-text" class="text-xs font-bold tracking-widest text-amber-300">准备转换...</div>
                            </div>
                        </div>

                        <div class="bg-white rounded-2xl border border-zinc-200 p-4 text-sm text-zinc-500 leading-7">
                            <div id="video-result-text">上传视频后，可以多次点击旋转按钮调整方向，然后再开始转换。</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
    },

    mount: function() {
        const state = this.state;
        const page = {
            status: document.getElementById('video-rotate-status'),
            input: document.getElementById('video-file-input'),
            fileMeta: document.getElementById('video-file-meta'),
            rotationPill: document.getElementById('video-rotation-pill'),
            rotationMeta: document.getElementById('video-rotation-meta'),
            rotateLeft: document.getElementById('btn-rotate-left'),
            rotateRight: document.getElementById('btn-rotate-right'),
            reset: document.getElementById('btn-rotation-reset'),
            confirm: document.getElementById('btn-video-confirm'),
            progressText: document.getElementById('video-progress-text'),
            progressPercent: document.getElementById('video-progress-percent'),
            progressBar: document.getElementById('video-progress-bar'),
            progressLog: document.getElementById('video-progress-log'),
            previewStage: document.getElementById('video-preview-stage'),
            previewFrame: document.getElementById('video-preview-frame'),
            previewEmpty: document.getElementById('video-preview-empty'),
            previewVideo: document.getElementById('video-preview'),
            previewAngle: document.getElementById('video-preview-angle'),
            busyMask: document.getElementById('video-busy-mask'),
            busyText: document.getElementById('video-busy-text'),
            resultText: document.getElementById('video-result-text')
        };

        const formatBytes = (bytes) => {
            if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
            const units = ['B', 'KB', 'MB', 'GB'];
            const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
            const value = bytes / Math.pow(1024, index);
            return `${value >= 100 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
        };

        const getNormalizedSteps = () => ((state.rotationSteps % 4) + 4) % 4;
        const getRotationDegrees = () => getNormalizedSteps() * 90;
        const isQuarterTurn = () => {
            const steps = getNormalizedSteps();
            return steps === 1 || steps === 3;
        };

        const buildOutputName = () => {
            if (!state.file) return `rotated-${Date.now()}.mp4`;
            const safeName = state.file.name.replace(/\.[^.]+$/, '');
            const suffix = getRotationDegrees() === 0 ? 'converted' : `rotated-${getRotationDegrees()}deg`;
            return `${safeName}-${suffix}.mp4`;
        };

        const buildRotationFilter = () => {
            const steps = getNormalizedSteps();
            if (steps === 1) return 'transpose=1';
            if (steps === 2) return 'transpose=1,transpose=1';
            if (steps === 3) return 'transpose=2';
            return '';
        };

        const setStatus = (text, tone) => {
            state.statusText = text;
            state.statusTone = tone;

            page.status.textContent = text;
            page.status.className = 'px-3 py-1 rounded-full text-[10px] font-bold';

            if (tone === 'success') {
                page.status.classList.add('bg-green-50', 'text-green-700');
            } else if (tone === 'busy') {
                page.status.classList.add('bg-amber-50', 'text-amber-700');
            } else if (tone === 'error') {
                page.status.classList.add('bg-red-50', 'text-red-700');
            } else {
                page.status.classList.add('bg-zinc-100', 'text-zinc-500');
            }
        };

        const updateProgress = (progress, text, logText) => {
            const safeProgress = Math.max(0, Math.min(1, Number(progress) || 0));
            state.progress = safeProgress;

            page.progressText.textContent = text;
            page.progressPercent.textContent = `${Math.round(safeProgress * 100)}%`;
            page.progressBar.style.width = `${safeProgress * 100}%`;

            if (logText) {
                state.lastLog = logText;
                page.progressLog.textContent = logText;
            }
        };

        const revokeUrl = (key) => {
            if (state[key]) {
                URL.revokeObjectURL(state[key]);
                state[key] = '';
            }
        };

        const syncPreviewLayout = () => {
            if (!state.file || !page.previewVideo.videoWidth || !page.previewVideo.videoHeight) {
                page.previewFrame.style.width = '';
                page.previewFrame.style.height = '';
                page.previewVideo.style.width = '';
                page.previewVideo.style.height = '';
                page.previewVideo.style.transform = `rotate(${getRotationDegrees()}deg)`;
                return;
            }

            const stageRect = page.previewStage.getBoundingClientRect();
            const maxWidth = Math.max((stageRect.width || 0) * 0.88, 240);
            const maxHeight = Math.max((stageRect.height || 0) * 0.88, 240);
            const sourceWidth = page.previewVideo.videoWidth;
            const sourceHeight = page.previewVideo.videoHeight;
            const frameWidth = isQuarterTurn() ? sourceHeight : sourceWidth;
            const frameHeight = isQuarterTurn() ? sourceWidth : sourceHeight;
            const scale = Math.min(maxWidth / frameWidth, maxHeight / frameHeight, 1);

            page.previewFrame.style.width = `${Math.max(frameWidth * scale, 120)}px`;
            page.previewFrame.style.height = `${Math.max(frameHeight * scale, 120)}px`;
            page.previewVideo.style.width = `${Math.max(sourceWidth * scale, 120)}px`;
            page.previewVideo.style.height = `${Math.max(sourceHeight * scale, 120)}px`;
            page.previewVideo.style.transform = `rotate(${getRotationDegrees()}deg)`;
        };

        const syncSummary = () => {
            const degrees = getRotationDegrees();
            const canOperate = !!state.file && !state.isPreparingCore && !state.isConverting;
            const isBusy = state.isPreparingCore || state.isConverting;

            page.rotationPill.textContent = `当前 ${degrees}°`;
            page.rotationMeta.textContent = state.file
                ? `累计操作 ${state.rotationOps} 次，当前生效角度 ${degrees}°`
                : '上传文件后即可开始调整角度';
            page.previewAngle.textContent = `预览角度 ${degrees}°`;

            page.fileMeta.innerHTML = state.file
                ? `
                    <div class="font-bold text-zinc-700 break-all">${state.file.name}</div>
                    <div class="text-xs text-zinc-500 mt-1">大小 ${formatBytes(state.file.size)}</div>
                    <div class="text-xs text-zinc-500">将导出为 MP4 文件</div>
                `
                : '尚未选择文件';

            page.previewEmpty.classList.toggle('hidden', !!state.file);
            page.previewVideo.classList.toggle('hidden', !state.file);

            page.rotateLeft.disabled = !canOperate;
            page.rotateRight.disabled = !canOperate;
            page.reset.disabled = !canOperate;
            page.confirm.disabled = !state.file || isBusy;

            [page.rotateLeft, page.rotateRight, page.reset, page.confirm].forEach((button) => {
                button.classList.toggle('opacity-50', button.disabled);
                button.classList.toggle('cursor-not-allowed', button.disabled);
            });

            page.busyMask.classList.toggle('hidden', !isBusy);
            page.busyText.textContent = state.isPreparingCore ? '正在加载转换核心...' : '正在转换视频...';

            if (!state.file) {
                page.resultText.textContent = '上传视频后，可以多次点击旋转按钮调整方向，然后再开始转换。';
            } else if (state.resultName) {
                page.resultText.textContent = `最近一次输出文件：${state.resultName}`;
            } else {
                page.resultText.textContent = `已准备好转换，当前会输出 ${degrees}° 的旋转结果。`;
            }
        };

        const resetRotation = () => {
            state.rotationSteps = 0;
            state.rotationOps = 0;
            syncPreviewLayout();
            syncSummary();
        };

        const changeRotation = (delta) => {
            if (!state.file || state.isPreparingCore || state.isConverting) return;
            state.rotationSteps += delta;
            state.rotationOps += 1;
            syncPreviewLayout();
            syncSummary();
        };

        const safeDeleteFile = async (path) => {
            if (!this.ffmpeg || !this.ffmpeg.loaded) return;
            try {
                await this.ffmpeg.deleteFile(path);
            } catch (error) {
                // Ignore cleanup errors for files that may not exist.
            }
        };

        const ensureFfmpegLoaded = async () => {
            if (this.ffmpeg && this.ffmpeg.loaded) return;

            if (window.location.protocol === 'file:') {
                throw new Error('当前页面是通过 file:// 打开的。请先在仓库目录运行 node serve-local.js，然后访问 http://127.0.0.1:8080/ 再使用视频转换。');
            }

            if (!window.FFmpegWASM || !window.FFmpegWASM.FFmpeg) {
                throw new Error('ffmpeg.wasm 加载失败，请检查本地脚本资源。');
            }

            if (!this.ffmpeg) {
                this.ffmpeg = new window.FFmpegWASM.FFmpeg();
            }

            if (this.ffmpegProgressHandler) {
                this.ffmpeg.off('progress', this.ffmpegProgressHandler);
            }
            this.ffmpegProgressHandler = ({ progress }) => {
                updateProgress(progress, '正在转换视频', `转换进度 ${Math.round((progress || 0) * 100)}%`);
            };
            this.ffmpeg.on('progress', this.ffmpegProgressHandler);

            if (this.ffmpegLogHandler) {
                this.ffmpeg.off('log', this.ffmpegLogHandler);
            }
            this.ffmpegLogHandler = ({ message }) => {
                if (message) {
                    const cleanMessage = message.trim();
                    if (cleanMessage) {
                        state.lastLog = cleanMessage;
                        page.progressLog.textContent = cleanMessage;
                    }
                }
            };
            this.ffmpeg.on('log', this.ffmpegLogHandler);

            state.isPreparingCore = true;
            setStatus('加载核心中', 'busy');
            updateProgress(0.05, '正在加载转换核心', '首次使用会下载并初始化本地 wasm 核心，请稍等');
            syncSummary();

            try {
                const assetBase = new URL('js/vendor/ffmpeg/', window.location.href.split('#')[0]);
                await this.ffmpeg.load({
                    coreURL: `${assetBase}ffmpeg-core.js`,
                    wasmURL: `${assetBase}ffmpeg-core.wasm`
                });
            } catch (error) {
                state.isPreparingCore = false;
                if (this.ffmpeg) {
                    this.ffmpeg.terminate();
                    this.ffmpeg = null;
                }
                throw error;
            }

            state.isPreparingCore = false;
            setStatus('已就绪', 'idle');
            updateProgress(0, '等待开始', '转换核心已准备完成');
            syncSummary();
        };

        const selectFile = (file) => {
            if (!file) return;

            revokeUrl('fileUrl');
            revokeUrl('outputUrl');
            state.file = file;
            state.fileUrl = URL.createObjectURL(file);
            state.resultName = '';
            state.rotationSteps = 0;
            state.rotationOps = 0;
            page.previewVideo.src = state.fileUrl;
            page.previewVideo.load();
            page.input.value = '';
            setStatus('等待确认', 'idle');
            updateProgress(0, '等待开始', '旋转方向已更新，点击确认后开始转换');
            syncSummary();
        };

        const startConversion = async () => {
            if (!state.file || state.isPreparingCore || state.isConverting) return;

            state.isConverting = true;
            state.resultName = '';
            revokeUrl('outputUrl');
            setStatus('转换中', 'busy');
            updateProgress(0.02, '准备转换', '正在初始化转换流程');
            syncSummary();

            const sourceExtensionMatch = state.file.name.match(/\.([^.]+)$/);
            const inputExtension = sourceExtensionMatch ? `.${sourceExtensionMatch[1].toLowerCase()}` : '.mp4';
            const inputPath = `input${inputExtension}`;
            const outputPath = 'output.mp4';
            const rotationFilter = buildRotationFilter();

            try {
                await ensureFfmpegLoaded();
                await safeDeleteFile(inputPath);
                await safeDeleteFile(outputPath);
                updateProgress(0.08, '写入视频文件', '正在把本地视频载入转换核心');

                const inputData = new Uint8Array(await state.file.arrayBuffer());
                await this.ffmpeg.writeFile(inputPath, inputData);

                const args = ['-i', inputPath];
                if (rotationFilter) {
                    args.push('-vf', rotationFilter);
                }
                args.push('-movflags', 'faststart', outputPath);

                updateProgress(0.12, '开始转换', rotationFilter ? `应用旋转滤镜：${rotationFilter}` : '当前角度为 0°，执行标准转换输出');
                const exitCode = await this.ffmpeg.exec(args, -1);

                if (exitCode !== 0) {
                    throw new Error(`ffmpeg 退出码异常：${exitCode}`);
                }

                const outputData = await this.ffmpeg.readFile(outputPath);
                const resultBlob = new Blob([outputData], { type: 'video/mp4' });
                state.outputUrl = URL.createObjectURL(resultBlob);
                state.resultName = buildOutputName();

                const anchor = document.createElement('a');
                anchor.href = state.outputUrl;
                anchor.download = state.resultName;
                document.body.appendChild(anchor);
                anchor.click();
                document.body.removeChild(anchor);

                updateProgress(1, '转换完成', `已生成 ${state.resultName}`);
                setStatus('转换完成', 'success');
                page.resultText.textContent = `转换完成并开始下载：${state.resultName}`;
            } catch (error) {
                console.error(error);
                const message = error && error.message ? error.message : '未知错误';
                updateProgress(state.progress, '转换失败', message);
                setStatus('转换失败', 'error');
                page.resultText.textContent = `转换失败：${message}`;
            } finally {
                state.isPreparingCore = false;
                state.isConverting = false;
                await safeDeleteFile(inputPath);
                await safeDeleteFile(outputPath);
                syncSummary();
            }
        };

        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
        }
        this.resizeHandler = () => syncPreviewLayout();
        window.addEventListener('resize', this.resizeHandler);

        page.input.addEventListener('change', (event) => {
            const [file] = event.target.files || [];
            selectFile(file || null);
        });

        page.rotateLeft.addEventListener('click', () => changeRotation(-1));
        page.rotateRight.addEventListener('click', () => changeRotation(1));
        page.reset.addEventListener('click', resetRotation);
        page.confirm.addEventListener('click', startConversion);
        page.previewVideo.addEventListener('loadedmetadata', syncPreviewLayout);
        page.previewVideo.addEventListener('loadeddata', syncPreviewLayout);

        setStatus(state.statusText, state.statusTone);
        updateProgress(state.progress, state.file ? '等待开始' : '等待开始', state.lastLog);
        syncSummary();
        syncPreviewLayout();

        if (state.fileUrl) {
            page.previewVideo.src = state.fileUrl;
            page.previewVideo.load();
        }

        if (window.lucide) window.lucide.createIcons();
    }
};
