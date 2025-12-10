
// --- ANIME NAMER ---
window.App = window.App || {};
window.App.pages = window.App.pages || {};

window.App.pages.animeNamer = {
    history: [],
    handleKey: function(e) {
        if (e.code === 'Enter') {
            e.preventDefault();
            document.getElementById('btn-gen').click();
        }
    },
    render: function() {
        return `
        <div class="flex flex-col items-center justify-center flex-1 w-full fade-in py-6">
            <div class="streamline-shell w-full max-w-lg p-8">
                <div class="flex items-center gap-3 mb-6 border-b border-zinc-200 pb-4">
                    <div class="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white">
                        <i data-lucide="sparkles" class="w-5 h-5"></i>
                    </div>
                    <h2 class="text-lg font-black text-zinc-700 tracking-wider">下个项目就用这个名字</h2>
                </div>

                <div class="device-screen min-h-[160px] flex flex-col items-center justify-center mb-6 p-6 bg-[#1a0510]">
                    <h2 id="name-display" class="relative z-10 text-4xl font-black text-center text-pink-400 break-all leading-relaxed drop-shadow-[0_0_8px_rgba(244,114,182,0.8)] tracking-wide">
                        <span class="text-zinc-700 text-sm font-bold tracking-widest animate-pulse">等待指令...</span>
                    </h2>
                </div>
                
                <div class="mb-8 px-4 py-2 bg-zinc-100 rounded-lg border-l-4 border-pink-400">
                        <div class="text-[10px] font-bold text-zinc-400 mb-1 tracking-widest">历史记录</div>
                        <div id="history-list" class="flex flex-col gap-1 h-20 overflow-y-auto custom-scrollbar">
                            <div class="text-zinc-300 text-xs italic">暂无记录</div>
                        </div>
                </div>

                <div class="flex flex-col gap-4">
                    <button id="btn-gen" class="atom-btn py-4 text-sm tracking-widest bg-white hover:bg-pink-50 text-pink-600 border-pink-200 border-b-pink-300">
                        随机生成 <span class="shortcut-key ml-2">ENTER</span>
                    </button>
                </div>
            </div>
        </div>
        `;
    },
    mount: function() {
        const btn = document.getElementById('btn-gen');
        const display = document.getElementById('name-display');
        const historyList = document.getElementById('history-list');
        const prefixes = [ "少女", "旅人", "勇者", "魔神", "终焉", "灰烬", "空想", "弑神", "奥术", "虚空", "神授", "诸神", "灵子", "不灭", "湮灭", "超载", "奇迹", "共鸣", "嗜血", "灵魂", "灾厄", "究极", "超越", "光明", "混沌", "希望", "绝望", "灭亡", "无限", "无想", "悲鸣", "原初", "心象", "星屑", "白夜", "零点", "绝对", "幻想", "沉默", "熔解", "弥生", "水无", "千年", "暴走", "青枫", "浮世", "胧月", "红莲", "黄泉", "鬼杀", "妖怪", "人间", "伊甸", "银河", "破碎", "真理", "空想", "天命", "死亡", "爆裂", "异邦", "终末" ];
        const suffixes = [ "代码", "计划", "指令", "结界", "领域", "地带", "力量", "王冠", "次元", "风暴", "黎明", "地狱", "枷锁", "梦境", "轮回", "沙漏", "残响", "之花", "之魂", "之翼", "之心", "默示录", "序曲", "终章", "诗篇", "战车", "阳炎", "红炎", "失格", "宣告", "审判", "契约", "乐队", "杀手", "使徒", "统领", "纹章", "深渊", "鸟居", "特攻", "游戏", "英雄", "余晖", "纪元", "核心", "武装", "战争", "此端", "彼端", "纷争", "教会", "禁止", "转生", "三日月", "圆舞曲", "协奏曲", "奏鸣曲", "狂想曲", "华尔兹", "理想乡", "决战兵器", "暗潮", "猎人" ];

        const generateName = () => {
            const r = () => Math.random();
            const ri = (max) => Math.floor(Math.random() * max);
            const prefixIdx = ri(prefixes.length);
            const suffixIdx = ri(suffixes.length);
            let prefix = prefixes[prefixIdx];
            let suffix = suffixes[suffixIdx];
            let code = "";
            let story = "";
            const roll = ri(200);
            if (roll < 5) code = "代号:";
            else if (roll < 7) code = "Re:";
            else if (roll === 7) code = "The ";
            else if (roll === 8) code = "此乃";
            else if (roll === 9) code = "其为";
            else if (roll >= 10 && roll < 12) story = "物语";
            else if (roll >= 12 && roll < 15) story = "传说";
            else if (roll === 15) story = "与猫";
            else if (roll === 16) story = "战线";
            else if (roll === 17) story = "战纪";
            else if (roll === 18) story = "英雄传";
            else if (roll === 19) code = "ERROR:";
            let extraPrefix = "";
            if (ri(100) < 4) extraPrefix = prefixes[ri(prefixes.length)];
            let star = "";
            if (ri(100) < 4) star = "☆";
            const isReverse = ri(100) < 5;
            let result = "";
            if (isReverse) {
                if (suffix.startsWith("の") || suffix.startsWith("之")) result = code + extraPrefix + suffix.substring(1) + "の" + prefix + story;
                else result = code + extraPrefix + suffix + star + prefix + story;
            } else {
                if (prefix.startsWith("の") || prefix.startsWith("之")) result = code + extraPrefix + prefix.substring(1) + "の" + suffix + story;
                else result = code + extraPrefix + prefix + star + suffix + story;
            }
            return result;
        };

        btn.addEventListener('click', () => {
            const name = generateName();
            display.innerText = name;
            this.history.unshift(name);
            if(this.history.length > 5) this.history.pop();
            historyList.innerHTML = this.history.map(n => `<div class="text-sm font-mono text-zinc-600 border-b border-zinc-200 pb-1 last:border-0">${n}</div>`).join('');
        });
        if(window.lucide) window.lucide.createIcons();
    }
};
