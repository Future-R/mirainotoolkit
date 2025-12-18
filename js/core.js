

// Initialize or extend window.App
window.App = window.App || {};

// Explicitly define properties to avoid Object.assign race conditions
window.App.config = window.App.config || { tools: [] };
window.App.pages = window.App.pages || {};
window.App.activePage = null;

// Define Init Function
window.App.init = async function() {
    console.log("App initializing...");
    
    // 1. Load Configuration
    if (window.TOOLBOX_CONFIG) {
        window.App.config = window.TOOLBOX_CONFIG;
        console.log("Config loaded from JS file.");
    } else {
        console.warn("Config.js not found. Using default built-in configuration.");
        // Fallback default config
        window.App.config = {
            "name": "未来工具箱",
            "description": "各种小工具。",
            "tools": [
                { "id": "card-game", "name": "阿不然打牌啰2", "desc": "运气也是实力的一部分", "path": "card-game", "icon": "dog", "type": "internal", "labelClass": "bg-[#dc2626]", "iconColor": "text-white" },
                { "id": "counter", "name": "手动计数器", "desc": "可能是打击感最强的计数器", "path": "counter", "icon": "mouse-pointer-2", "type": "internal", "labelClass": "bg-[#f05e1c]", "iconColor": "text-white" },
                { "id": "anime-namer", "name": "二次元起名器", "desc": "味儿超冲", "path": "anime-namer", "icon": "sparkles", "type": "internal", "labelClass": "bg-[#e03c8a]", "iconColor": "text-white" },
                { "id": "dice", "name": "电子骰子", "desc": "爱信不信", "path": "dice", "icon": "box", "type": "internal", "labelClass": "bg-[#6B64EF]", "iconColor": "text-white" },
                { "id": "text-map", "name": "文字地图编辑器", "desc": "如果你不知道有什么用，那它就没用", "path": "text-map", "icon": "map", "type": "internal", "labelClass": "bg-[#5f27cd]", "iconColor": "text-white" }
            ]
        };
    }

    // 2. Init Router
    if (window.App.Router) {
        window.App.Router.init();
        // 3. Render Initial Route
        window.App.Router.handleRoute();
    } else {
        console.error("Router module missing!");
    }
    
    // 4. Global Key Handler
    document.addEventListener('keydown', (e) => {
        if (window.App.activePage && window.App.activePage.handleKey) {
            window.App.activePage.handleKey(e);
        }
    });

    // 5. Restore CRT State (Defaults to Enabled)
    const crtEnabled = localStorage.getItem('crt_enabled');
    // If explicitly 'false', turn it off. Otherwise (null or true), keep it on.
    if (crtEnabled === 'false') {
        document.body.classList.add('no-crt');
    }
};

// --- ROUTER ---
window.App.Router = {
    routes: {
        '': 'dashboard',
        'counter': 'counter',
        'anime-namer': 'animeNamer',
        'dice': 'diceRoller',
        'text-map': 'textMapEditor',
        'jitter-text': 'jitterText',
        'card-game': 'cardGame'
    },

    init: function() {
        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('popstate', () => this.handleRoute());
    },

    handleRoute: function() {
        const hash = window.location.hash.slice(1) || '';
        const cleanHash = hash.replace(/\/$/, "");
        const pageName = this.routes[cleanHash] || 'dashboard';
        const pageModule = window.App.pages[pageName];

        const appContainer = document.getElementById('app');
        
        // Render Layout
        if (window.App.Layout) {
            appContainer.innerHTML = window.App.Layout.render(cleanHash);
            window.App.Layout.attachListeners();
        }

        const mainContent = document.getElementById('main-content');
        if (pageModule && mainContent) {
            try {
                window.App.activePage = pageModule;
                mainContent.innerHTML = pageModule.render();
                // Mount lifecycle hook
                if (pageModule.mount) pageModule.mount(mainContent);
            } catch (e) {
                console.error(e);
                mainContent.innerHTML = `<div class="text-red-600 p-8">模块加载错误: ${e.message}</div>`;
            }
        } else {
             if (mainContent) mainContent.innerHTML = `<div class="text-zinc-400 p-8 text-center">未找到模块: ${pageName}</div>`;
        }

        if (window.lucide) window.lucide.createIcons();
        window.scrollTo(0,0);
    },

    navigate: function(path) {
        window.location.hash = path;
    }
};

// --- LAYOUT ---
window.App.Layout = {
    render: function(currentPath) {
        const isHome = currentPath === '' || currentPath === '/';
        const isCardGame = currentPath === 'card-game';
        const title = (window.App.config && window.App.config.name) ? window.App.config.name : "未来工具箱";
        // Check if CRT is DISABLED (if class no-crt is present)
        // If no-crt is present, isCrtOn is FALSE.
        const isCrtOn = !document.body.classList.contains('no-crt');
        
        const backButton = !isHome ? `
            <button onclick="window.App.Router.navigate('')"
                class="flex items-center gap-2 px-5 py-2 
                  bg-zinc-100 hover:bg-white
                  rounded-full border border-zinc-300
                  shadow-sm hover:shadow
                  text-zinc-600 font-bold text-sm
                  transition-all active:scale-95">
                <i data-lucide="arrow-left" class="w-4 h-4"></i>
                <span>返回</span>
            </button>
        ` : '';

        // Conditionally render Footer
        const footerContent = isCardGame ? '' : `
        <footer class="w-full py-10 text-center mt-auto relative z-10">
            <div class="inline-flex flex-col items-center gap-2">
                <div class="inline-flex items-center gap-4 px-6 py-2 bg-white/80 backdrop-blur rounded-full border border-zinc-200">
                    <a href="https://github.com/Future-R" target="_blank" rel="noopener noreferrer"
                    class="flex items-center gap-2 text-zinc-400 hover:text-zinc-800 transition-colors">
                        <i data-lucide="github" class="w-4 h-4"></i>
                        <span class="text-xs font-bold tracking-widest">Github 主页</span>
                    </a>
                </div>
                <span class="text-[10px] text-zinc-400 font-bold tracking-widest">未来科技 © 2025</span>
            </div>
        </footer>`;

        return `
        <header class="w-full pt-6 px-4 pb-2 relative z-20">
            <div class="max-w-[90rem] mx-auto">
                <div class="bg-gradient-to-r from-white to-zinc-50 rounded-[2.5rem] px-8 py-5 flex flex-col md:flex-row items-center justify-between shadow-[0_4px_10px_rgba(0,0,0,0.05)] border border-white ring-1 ring-zinc-100 relative overflow-hidden gap-4">
                    <!-- Streamline Stripe -->
                    <div class="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-16 bg-orange-500 rounded-r-full hidden md:block"></div>
                    
                    <div class="flex items-center gap-5 cursor-pointer z-10 md:pl-6" onclick="window.App.Router.navigate('')">
                        <div class="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-zinc-600 relative overflow-hidden">
                            <div class="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                            <i data-lucide="atom" class="w-6 h-6 animate-[spin_10s_linear_infinite]"></i>
                        </div>
                        <div class="flex flex-col">
                            <h1 class="text-2xl font-black text-zinc-800 tracking-wider flex items-center gap-2">
                                ${title}
                            </h1>
                            <div class="flex items-center gap-1 mt-1">
                                <div class="h-1 w-8 bg-zinc-300 rounded-full"></div>
                                <div class="h-1 w-2 bg-orange-400 rounded-full"></div>
                                <div class="h-1 w-2 bg-sky-400 rounded-full"></div>
                            </div>
                        </div>
                    </div>

                    <div class="flex items-center gap-4">
                         <!-- CRT Toggle -->
                        <button id="btn-toggle-crt" class="flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-200 bg-zinc-50 hover:bg-white transition-all active:scale-95 group">
                            <div class="w-4 h-4 rounded-full border border-zinc-400 ${isCrtOn ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-zinc-200'} transition-colors"></div>
                            <span class="text-xs font-bold text-zinc-600 group-hover:text-zinc-900">CRT滤镜</span>
                            <i data-lucide="scan-line" class="w-3 h-3 text-zinc-400"></i>
                        </button>
                        ${backButton}
                    </div>
                </div>
            </div>
        </header>

        <main id="main-content" class="flex-1 w-full max-w-[90rem] mx-auto p-4 md:p-6 flex flex-col relative z-10">
            <!-- Page Content -->
        </main>

        ${footerContent}
        `;
    },
    
    attachListeners: function() {
        const btn = document.getElementById('btn-toggle-crt');
        if (btn) {
            btn.addEventListener('click', () => {
                // If currently has no-crt, it means it was OFF. We remove it to turn ON.
                // If currently doesn't have it, it was ON. We add it to turn OFF.
                const isCurrentlyOff = document.body.classList.contains('no-crt');
                
                if (isCurrentlyOff) {
                    document.body.classList.remove('no-crt');
                    localStorage.setItem('crt_enabled', 'true');
                } else {
                    document.body.classList.add('no-crt');
                    localStorage.setItem('crt_enabled', 'false');
                }

                // Update Button UI
                const isOnNow = !document.body.classList.contains('no-crt');
                const dot = btn.querySelector('div');
                if (isOnNow) {
                    dot.classList.remove('bg-zinc-200');
                    dot.classList.add('bg-green-500', 'shadow-[0_0_8px_#22c55e]');
                } else {
                    dot.classList.add('bg-zinc-200');
                    dot.classList.remove('bg-green-500', 'shadow-[0_0_8px_#22c55e]');
                }
            });
        }
    }
};