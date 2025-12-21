
// --- CARD GAME UI & RENDERERS ---
window.App = window.App || {};
window.App.pages = window.App.pages || {};
window.App.pages.cardGame = window.App.pages.cardGame || {};

Object.assign(window.App.pages.cardGame, {
    isPortrait: function() { return window.innerHeight > window.innerWidth; },

    render: function() {
        const isPort = this.isPortrait();
        const containerClass = isPort 
            ? "flex flex-col h-[calc(100vh-80px)] w-full fade-in relative overflow-hidden bg-zinc-50" 
            : "flex flex-col h-[calc(100vh-140px)] w-full fade-in relative max-w-7xl mx-auto";
        return `<div class="${containerClass}"><div id="game-board" class="flex-1 flex flex-col relative h-full transition-all duration-500">${this.renderContent()}</div></div>`;
    },
    
    renderGame: function() {
        const board = document.getElementById('game-board');
        if(board) { 
            board.innerHTML = this.renderContent(); 
            if(window.lucide) window.lucide.createIcons(); 
            if (this.isGlobalReverse()) board.classList.add('reverse-active');
            else board.classList.remove('reverse-active');

            // 渲染后确保日志滚动到底部
            const logContainer = document.getElementById('game-log-content');
            if (logContainer) logContainer.scrollTop = logContainer.scrollHeight;
        }
    },

    renderContent: function() {
        switch(this.state.mode) {
            case 'intro': return this.renderIntro();
            case 'character_select': return this.renderCharacterSelect();
            case 'map': return this.renderMap();
            case 'battle': 
            case 'scoring': return this.isPortrait() ? this.renderBattlePortrait() : this.renderBattleLandscape();
            case 'reward': return this.renderReward();
            case 'event': return this.renderEvent();
            default: return this.renderIntro();
        }
    },

    getCardTooltip: function(card) {
        if (!card) return '';
        const isMine = card.owner === 0;
        const ownerName = isMine ? "我方" : "对方";
        const ownerColor = isMine ? "text-green-400" : "text-rose-400";
        const typeName = this.CONST.COLOR_NAMES[card.color] || '常规';
        const skills = card.skills.length > 0 ? card.skills.map(s => `
            <div class="flex items-start gap-2.5 mb-2 last:mb-0">
                <span class="bg-white/20 px-2 rounded text-[13px] font-black shrink-0 mt-0.5">${this.CONST.SKILLS[s].name}</span>
                <span class="text-[13px] opacity-100 font-bold leading-tight">${this.CONST.SKILLS[s].desc}</span>
            </div>
        `).join('') : '<div class="text-[11px] text-zinc-500 font-bold">常规资源卡</div>';
        
        return `
            <div class="tooltip-box absolute bottom-full left-1/2 -translate-x-1/2 mb-5 w-72 md:w-80 bg-zinc-900 text-white p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-2 border-white/10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2.5">
                <div class="text-sm font-black border-b border-white/20 pb-2 flex justify-between items-center">
                    <span class="${ownerColor} tracking-tighter">[${typeName}] ${ownerName}</span>
                    <span class="bg-zinc-800 px-2.5 py-0.5 rounded text-white font-mono text-base">P ${this.getCardValue(card)}</span>
                </div>
                <div class="flex flex-col">${skills}</div>
                <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-zinc-900 rotate-45 border-r-2 border-b-2 border-white/10"></div>
            </div>
        `;
    },

    renderIntro: function() {
        return `
        <div class="flex flex-col items-center justify-center h-full gap-8 text-center p-4">
            <div class="relative">
                <div class="absolute -inset-4 bg-gradient-to-r from-red-600 via-amber-500 to-sky-600 rounded-full opacity-20 blur-xl animate-pulse"></div>
                <div class="w-24 h-24 bg-zinc-900 rounded-2xl flex items-center justify-center text-white shadow-2xl relative z-10 border border-white/10"><i data-lucide="paw-print" class="w-12 h-12"></i></div>
            </div>
            <div>
                <h1 class="text-4xl font-black text-zinc-800 mb-2 uppercase tracking-tighter">阿不然打牌啰 2</h1>
                <p class="text-zinc-400 font-bold tracking-widest uppercase text-xs">策略卡牌·镜像博弈</p>
            </div>
            <div class="max-w-md w-full bg-white p-6 rounded-xl shadow-sm border border-zinc-200">
                <p class="mb-4 font-bold text-zinc-400 uppercase tracking-widest text-[10px]">请选择模式</p>
                <div class="grid grid-cols-1 gap-4">
                    <button onclick="window.App.pages.cardGame.selectMode('classic')" class="group p-5 bg-white text-zinc-800 rounded-2xl border-2 border-zinc-200 hover:border-sky-500 transition-all flex items-center gap-4 text-left shadow-sm">
                        <div class="w-12 h-12 bg-sky-500 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform"><i data-lucide="swords" class="w-7 h-7"></i></div>
                        <div class="flex-1"><div class="font-black text-lg">经典对决</div><div class="text-[11px] text-zinc-400 font-bold">对等牌组 · 无尽博弈</div></div>
                    </button>
                    <button onclick="window.App.pages.cardGame.selectMode('adventure')" class="group p-5 bg-zinc-50 text-zinc-600 rounded-2xl border-2 border-zinc-200 hover:border-amber-400 transition-all flex items-center gap-4 text-left relative overflow-hidden">
                        <div class="absolute top-0 right-0 px-3 py-0.5 bg-amber-400 text-white text-[9px] font-black uppercase rounded-bl-lg">实验</div>
                        <div class="w-12 h-12 bg-zinc-200 rounded-xl flex items-center justify-center group-hover:bg-amber-100 group-hover:text-amber-600 transition-colors"><i data-lucide="map" class="w-7 h-7"></i></div>
                        <div class="flex-1"><div class="font-black text-lg opacity-80">冒险模式</div><div class="text-[11px] opacity-60 font-bold uppercase">探索区域 · 强化构筑</div></div>
                    </button>
                </div>
            </div>
        </div>`;
    },

    renderCharacterSelect: function() {
        return `
        <div class="flex flex-col items-center justify-center h-full gap-8 p-4">
            <h2 class="text-2xl font-black text-zinc-700 uppercase tracking-widest">选择派系</h2>
            <div class="flex flex-col md:flex-row gap-6 w-full max-w-2xl">
                ${Object.entries(this.CONST.CHARACTERS).map(([id, char]) => `
                    <div onclick="window.App.pages.cardGame.selectCharacter('${id}')" class="flex-1 bg-white border-4 border-zinc-200 rounded-2xl p-6 flex flex-col items-center text-center cursor-pointer hover:border-amber-400 hover:shadow-xl transition-all group active:scale-95">
                        <div class="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mb-4 border-2 border-zinc-200 group-hover:bg-amber-50 group-hover:border-amber-200"><i data-lucide="${char.icon}" class="w-10 h-10 ${char.color}"></i></div>
                        <h3 class="text-xl font-black text-zinc-800 mb-2">${char.name}</h3>
                        <p class="text-xs text-zinc-400 font-bold leading-relaxed">${char.desc}</p>
                    </div>
                `).join('')}
            </div>
            <button onclick="window.App.pages.cardGame.initGame()" class="text-zinc-400 font-bold hover:text-zinc-600 text-sm underline uppercase tracking-widest">取消</button>
        </div>`;
    },

    renderMap: function() {
        const isClassic = this.state.gameMode === 'classic';
        return `
        <div class="flex flex-col items-center justify-center h-full gap-6 p-4">
            <h2 class="text-2xl font-black text-zinc-700 uppercase tracking-widest">${isClassic ? "对决备战" : "冒险前哨"}</h2>
            <div class="grid grid-cols-2 gap-4 max-w-lg w-full">
                <div class="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col items-center gap-2"><div class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">起始资源</div><div class="text-3xl font-black text-zinc-800">${isClassic ? 6 : 5}</div></div>
                <div class="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col items-center gap-2"><div class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">下个对手</div><div class="text-xl font-black text-rose-500 truncate w-full text-center">${isClassic ? "镜像对手" : "区域精锐"}</div></div>
            </div>
            <button onclick="window.App.pages.cardGame.enterBattle()" class="atom-btn px-16 py-5 text-xl bg-red-600 text-white border-red-700 shadow-xl shadow-red-200 animate-bounce">开启对局</button>
            <button onclick="window.App.pages.cardGame.initGame()" class="text-zinc-400 font-bold text-sm underline">放弃</button>
        </div>`;
    },

    renderCardDetailModal: function(card) {
        if (!card) return '';
        const bg = this.CONST.COLORS[card.color];
        const skillItems = card.skills.length > 0 ? card.skills.map(s => `
            <div class="bg-zinc-50 border border-zinc-200 p-3 rounded-xl mb-2">
                <div class="flex items-center gap-2 mb-1"><span class="bg-zinc-800 text-white text-[10px] px-1.5 py-0.5 rounded font-black">${this.CONST.SKILLS[s].name}</span></div>
                <div class="text-xs text-zinc-500 font-bold leading-relaxed">${this.CONST.SKILLS[s].desc}</div>
            </div>
        `).join('') : '<div class="text-center py-6 text-zinc-300 text-xs font-bold">该卡牌无特殊技能</div>';
        return `
        <div onclick="window.App.pages.cardGame.closePreview()" class="fixed inset-0 z-[1000] bg-black/80 flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div onclick="event.stopPropagation()" class="bg-white rounded-[2rem] w-full max-w-xs overflow-hidden shadow-2xl animate-in zoom-in duration-300">
                <div class="h-40 ${bg} relative flex flex-col items-center justify-center text-white border-b-8 border-white/20">
                     <div class="absolute top-4 left-6 bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest">${this.CONST.COLOR_NAMES[card.color]}</div>
                     <div class="text-8xl font-black drop-shadow-lg">${this.getCardValue(card)}</div>
                </div>
                <div class="p-6">
                    <div class="flex justify-between items-center mb-4 border-b border-zinc-100 pb-2"><span class="text-[10px] font-black text-zinc-400 uppercase tracking-widest">持有者</span><span class="font-black ${card.owner === 0 ? "text-green-500" : "text-rose-500"}">${card.owner === 0 ? "我方" : "对方"}</span></div>
                    <div class="max-h-60 overflow-y-auto custom-scrollbar">${skillItems}</div>
                    <button onclick="window.App.pages.cardGame.closePreview()" class="w-full mt-6 py-3 bg-zinc-900 text-white rounded-xl font-black text-sm uppercase transition-all active:scale-95">确定</button>
                </div>
            </div>
        </div>`;
    },

    renderBattlePortrait: function() {
        const p = window.App.pages.cardGame;
        const s = p.state;
        let scores = [0,1,2].map(i => p.calculateStackScore(i));
        let totalP, totalA;
        if (s.mode === 'scoring' && s.scoringState) { totalP = s.scoringState.totalP; totalA = s.scoringState.totalA; }
        else { totalP = scores.reduce((a,b)=>a+b.player, 0); totalA = scores.reduce((a,b)=>a+b.ai, 0); }
        const isRev = this.isGlobalReverse();
        const selCount = s.selectedCardIndices.length;
        const enemy = s.enemyData || { name: '对手', icon: 'cat', color: 'text-zinc-500' };

        let actionBtnHTML = (selCount > 0) ? `
            <button onclick="window.App.pages.cardGame.handleDiscardAction()" class="absolute bottom-32 right-6 z-[60] w-16 h-16 rounded-full ${selCount >= 2 ? "bg-sky-500 border-sky-600" : "bg-orange-500 border-orange-600"} text-white border-b-4 shadow-xl flex flex-col items-center justify-center active:translate-y-1 transition-all animate-bounce">
                <i data-lucide="${selCount >= 2 ? 'refresh-cw' : 'trash-2'}" class="w-6 h-6"></i>
                <span class="text-[10px] font-black mt-0.5">${selCount >= 2 ? "更替" : "弃牌"}</span>
            </button>` : '';

        let modalHtml = '';
        if (s.discardConfirmOpen) modalHtml = p.renderDiscardModal();
        else if (s.trainingPending) modalHtml = p.renderTrainModal();
        else if (s.pileViewMode) modalHtml = p.renderPileModal();
        if (s.previewCard) modalHtml += p.renderCardDetailModal(s.previewCard);

        const hand = s.hands[0]; const centerIdx = (hand.length - 1) / 2;
        const handVisuals = hand.map((card, i) => {
            const isSel = s.selectedCardIndices.includes(i); const offset = i - centerIdx;
            let rot = offset * 6, ty = Math.abs(offset) * 8, tx = offset * 32, sc = 0.65, zi = i;
            if (isSel) { rot = 0; ty = -100; sc = 0.95; zi = 100; } 
            return `<div class="absolute bottom-0 origin-bottom transition-all duration-300 ease-out" style="transform: translateX(${tx}px) translateY(${ty}px) rotate(${rot}deg) scale(${sc}); z-index: ${zi};">${p.renderPlayerCard(card, i, true)}</div>`;
        }).join('');

        const latestMsg = s.log.length > 0 ? s.log[s.log.length - 1].text : "等待出牌...";
        const shouldShowHint = !s.hintDismissed && s.ippon[0]+s.ippon[1] === 0 && (s.gameMode === 'classic' || s.level === 1);

        return `
            <div class="flex flex-col h-full relative overflow-hidden bg-zinc-100 text-zinc-800">
                ${isRev ? `<div class="absolute top-16 left-0 right-0 z-[150] bg-violet-600 text-white py-1 px-4 text-center font-black text-[10px] animate-pulse uppercase tracking-[0.2em] shadow-xl">逆转：大小颠倒</div>` : ''}
                ${modalHtml}
                ${(s.mode === 'scoring' && s.scoringState?.finished) ? `<div class="absolute inset-x-0 bottom-40 z-[60] flex justify-center pointer-events-none"><button onclick="window.App.pages.cardGame.confirmRoundEnd()" class="pointer-events-auto bg-white text-zinc-900 text-lg font-black py-4 px-12 rounded-full shadow-2xl border-4 border-zinc-100 animate-bounce">${p.getSettlementButtonText(totalP, totalA)}</button></div>` : ''}
                ${s.showLog ? `<div onclick="window.App.pages.cardGame.toggleLog()" class="fixed inset-0 z-[200] bg-black/60 flex items-end p-4 pb-20 animate-in fade-in duration-200"><div onclick="event.stopPropagation()" class="bg-zinc-900 border border-zinc-700 w-full rounded-2xl max-h-[60vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300"><div class="p-3 border-b border-zinc-800 flex justify-between items-center shrink-0"><span class="text-[10px] font-black text-zinc-500 uppercase tracking-widest">对战记录</span><button onclick="window.App.pages.cardGame.toggleLog()" class="w-6 h-6 flex items-center justify-center text-zinc-500"><i data-lucide="x" class="w-4 h-4"></i></button></div><div class="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-2 font-mono">${s.log.map(l => `<div class="text-[10px] ${l.color} mb-1 border-b border-white/5 pb-1">${l.text}</div>`).join('')}</div></div></div>` : ''}
                
                <div class="h-16 shrink-0 bg-white border-b border-zinc-200 shadow-sm flex justify-between items-center px-4 relative z-20">
                    <div class="flex items-center gap-2"><div class="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center border border-zinc-200 relative"><i data-lucide="${s.playerAvatar}" class="w-5 h-5 text-zinc-600"></i><div class="absolute -top-1 -left-1 flex gap-0.5"><div class="w-2 h-2 rounded-full ${s.ippon[0]>0?'bg-green-500 shadow-[0_0_5px_#22c55e]':'bg-zinc-300'} border border-white"></div><div class="w-2 h-2 rounded-full ${s.ippon[0]>1?'bg-green-500 shadow-[0_0_5px_#22c55e]':'bg-zinc-300'} border border-white"></div></div></div><div class="flex flex-col"><span class="text-xs text-zinc-400 font-black">我方</span><span class="text-xl font-black text-green-500 leading-none">${totalP}</span></div></div>
                    <button onclick="window.App.pages.cardGame.toggleLog()" class="flex-1 flex flex-col items-center px-4 max-w-[200px] cursor-pointer"><div class="text-[8px] font-black text-zinc-400 mb-0.5">第 ${s.ippon[0]+s.ippon[1]+1} 局</div><div id="portrait-top-log" class="text-[10px] text-zinc-500 font-bold truncate w-full text-center bg-zinc-50 py-1.5 px-3 rounded-lg border border-zinc-200 shadow-inner">${latestMsg}</div></button>
                    <div class="flex items-center gap-2 flex-row-reverse text-right"><div class="w-10 h-10 ${enemy.bg || 'bg-rose-100'} rounded-xl flex items-center justify-center border border-zinc-200 relative shadow-sm"><i data-lucide="${enemy.icon}" class="w-5 h-5 ${enemy.color || 'text-rose-500'}"></i><div class="absolute -top-1 -right-1 flex gap-0.5"><div class="w-2 h-2 rounded-full ${s.ippon[1]>0?'bg-rose-500 shadow-[0_0_5px_#f43f5e]':'bg-zinc-300'} border border-white"></div><div class="w-2 h-2 rounded-full ${s.ippon[1]>1?'bg-rose-500 shadow-[0_0_5px_#f43f5e]':'bg-zinc-300'} border border-white"></div></div></div><div class="flex flex-col"><span class="text-xs text-zinc-400 font-black">对方</span><span class="text-xl font-black text-rose-500 leading-none">${totalA}</span></div></div>
                </div>
                <div class="h-8 bg-zinc-50 flex justify-between items-center px-4 relative z-10 border-b border-zinc-200"><div class="flex items-center gap-1">${s.hands[1].map((c) => `<div id="ai-card-${c.id}" class="w-3 h-4 bg-zinc-300 rounded-[2px] border border-zinc-200 transition-all"></div>`).join('')}</div><div class="flex gap-2 text-[9px] font-black text-zinc-400 uppercase tracking-widest"><span onclick="window.App.pages.cardGame.viewPile('discard', 1)" class="flex items-center gap-1 bg-white border border-zinc-300 px-2 py-0.5 rounded shadow-sm cursor-pointer hover:bg-zinc-100"><i data-lucide="trash" class="w-2.5 h-2.5 text-rose-400"></i> ${s.discardPiles[1].length}</span><span class="flex items-center gap-1 bg-white border border-zinc-300 px-2 py-0.5 rounded shadow-sm"><i data-lucide="layers" class="w-2.5 h-2.5"></i> ${s.decks[1].length}</span></div></div>
                <div class="flex-1 grid grid-cols-3 gap-2.5 p-3 pb-44 overflow-hidden relative">${[0, 1, 2].map(idx => `<div class="${(s.mode === 'scoring' && s.scoringState?.activeField !== -1 && s.scoringState?.activeField !== idx) ? 'opacity-20 grayscale' : ''} h-full relative z-0 transition-all duration-300 min-w-0 field-stack">${this.renderFieldStackPortrait(idx, scores[idx])}</div>`).join('')}</div>
                ${actionBtnHTML}
                
                <button onclick="window.App.pages.cardGame.viewPile('draw', 0)" class="absolute bottom-60 left-6 z-50 w-12 h-12 bg-white rounded-xl border border-zinc-200 shadow-lg flex flex-col items-center justify-center text-zinc-500 active:scale-95 transition-all"><i data-lucide="layers" class="w-4 h-4 mb-0.5"></i><span class="text-[10px] font-black">${s.decks[0].length}</span></button>
                <button onclick="window.App.pages.cardGame.viewPile('discard', 0)" class="absolute bottom-10 right-6 z-50 w-12 h-12 bg-white rounded-xl border border-zinc-200 shadow-lg flex flex-col items-center justify-center text-zinc-500 active:scale-95 transition-all"><i data-lucide="trash-2" class="w-4 h-4 mb-0.5 text-rose-500"></i><span class="text-[10px] font-black">${s.discardPiles[0].length}</span></button>
                
                <div class="absolute bottom-4 left-0 right-0 h-0 z-40 flex justify-center items-end pointer-events-none">
                    <div class="relative w-1 h-1 flex justify-center items-end pointer-events-auto overflow-visible">
                         ${hand.length === 0 ? '<div class="absolute bottom-32 w-32 text-center text-zinc-300 text-[10px] font-black animate-pulse -ml-16">牌组已空</div>' : handVisuals}
                         ${shouldShowHint ? `<div class="absolute bottom-72 w-44 text-center text-amber-500 text-[10px] font-black bg-white/95 border-2 border-amber-300 shadow-xl py-2 px-3 rounded-full animate-bounce -ml-22 z-[110]">💡 长按牌面查看详情</div>` : ''}
                    </div>
                </div>
            </div>`;
    },

    renderBattleLandscape: function() {
        const p = window.App.pages.cardGame; const s = p.state;
        let scores = [0,1,2].map(i => p.calculateStackScore(i));
        let totalP, totalA;
        if (s.mode === 'scoring' && s.scoringState) { totalP = s.scoringState.totalP; totalA = s.scoringState.totalA; }
        else { totalP = scores.reduce((a,b)=>a+b.player, 0); totalA = scores.reduce((a,b)=>a+b.ai, 0); }
        const selCount = s.selectedCardIndices.length; const enemy = s.enemyData || { name: '对手', icon: 'cat', color: 'text-zinc-500' };
        const isRev = this.isGlobalReverse();

        let actionBtnHTML = (selCount > 0) ? `<div class="absolute right-6 bottom-8 z-20"><button onclick="window.App.pages.cardGame.handleDiscardAction()" class="w-24 h-24 rounded-full border-4 font-black transition-all flex flex-col items-center justify-center gap-1 shadow-2xl active:scale-95 ${selCount >= 2 ? "bg-sky-100 text-sky-600 border-sky-200" : "bg-orange-100 text-orange-600 border-orange-200"}"><i data-lucide="${selCount >= 2 ? 'refresh-cw' : 'trash-2'}" class="w-7 h-7"></i><span class="text-[10px] uppercase tracking-widest">${selCount >= 2 ? "更替" : "弃牌"}</span></button></div>` : '';
        let modalHtml = '';
        if (s.discardConfirmOpen) modalHtml = p.renderDiscardModal();
        else if (s.trainingPending) modalHtml = p.renderTrainModal();
        else if (s.pileViewMode) modalHtml = p.renderPileModal();
        if (s.previewCard) modalHtml += p.renderCardDetailModal(s.previewCard);

        return `
            <div class="flex flex-col md:flex-row h-full gap-4 relative">
                ${isRev ? `<div class="absolute inset-0 z-[140] pointer-events-none border-[12px] border-violet-500/40 animate-pulse shadow-[inset_0_0_100px_rgba(139,92,246,0.2)] rounded-[3rem]"></div>` : ''}
                ${isRev ? `<div class="absolute top-2 left-1/2 -translate-x-1/2 z-[150] bg-violet-600 text-white py-1.5 px-10 rounded-full font-black text-xs animate-bounce shadow-2xl">逆转：大小颠倒</div>` : ''}
                ${modalHtml}
                ${(s.mode === 'scoring' && s.scoringState?.finished) ? `<div class="absolute inset-x-0 bottom-32 z-[60] flex justify-center pointer-events-none"><button onclick="window.App.pages.cardGame.confirmRoundEnd()" class="pointer-events-auto bg-white text-zinc-900 text-xl font-black py-4 px-12 rounded-full shadow-2xl border-4 border-zinc-100 animate-bounce">${p.getSettlementButtonText(totalP, totalA)}</button></div>` : ''}
                <div class="hidden md:flex w-64 flex-col gap-2 shrink-0">
                     <div class="bg-white p-5 rounded-2xl shadow-lg border border-zinc-200 relative overflow-hidden"><div class="flex items-center gap-3 mb-4"><div class="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-white shadow-sm"><i data-lucide="${s.playerAvatar}" class="w-6 h-6"></i></div><div><div class="text-[9px] text-zinc-400 font-black">博弈者</div><div class="font-black text-zinc-800 truncate">${s.character ? (p.CONST.CHARACTERS[s.character]?.name) : '挑战者'}</div></div></div><div class="flex justify-between items-end border-t border-zinc-100 pt-3"><div class="flex flex-col"><span class="text-[10px] text-zinc-400 font-black">分数</span><span class="text-4xl font-black text-green-500">${totalP}</span></div><div class="flex gap-1.5 mb-1.5"><div class="w-2.5 h-2.5 rounded-full ${s.ippon[0]>0?'bg-green-500 shadow-[0_0_8px_#22c55e]':'bg-zinc-200'}"></div><div class="w-2.5 h-2.5 rounded-full ${s.ippon[0]>1?'bg-green-500 shadow-[0_0_8px_#22c55e]':'bg-zinc-200'}"></div></div></div></div>
                     <div class="bg-white p-5 rounded-2xl shadow-lg border border-zinc-200 relative overflow-hidden"><div class="flex items-center gap-3 mb-4"><div class="w-10 h-10 ${enemy.bg || 'bg-rose-100'} rounded-xl flex items-center justify-center border border-rose-200/50 shadow-sm ${enemy.color || 'text-rose-500'}"><i data-lucide="${enemy.icon}" class="w-6 h-6"></i></div><div><div class="text-[9px] text-zinc-400 font-black">对手</div><div class="font-black ${enemy.color || 'text-rose-600'} truncate">${enemy.name}</div></div></div><div class="flex justify-between items-end border-t border-zinc-100 pt-3"><div class="flex flex-col"><span class="text-[10px] text-zinc-400 font-black">分数</span><span class="text-4xl font-black text-rose-500">${totalA}</span></div><div class="flex gap-1.5 mb-1.5"><div class="w-2.5 h-2.5 rounded-full ${s.ippon[1]>0?'bg-rose-500 shadow-[0_0_8px_#f43f5e]':'bg-zinc-200'}"></div><div class="w-2.5 h-2.5 rounded-full ${s.ippon[1]>1?'bg-rose-500 shadow-[0_0_8px_#f43f5e]':'bg-zinc-200'}"></div></div></div></div>
                     <div class="flex-1 bg-zinc-900 rounded-2xl border border-zinc-800 p-4 overflow-hidden flex flex-col shadow-inner min-h-0"><div id="game-log-content" class="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 font-mono h-[200px] scroll-smooth">${s.log.map(l => `<div class="text-lg md:text-xl font-black leading-relaxed ${l.color} mb-1 border-b border-white/5 pb-1">${l.text}</div>`).join('')}</div></div>
                </div>
                <div class="flex-1 flex flex-col gap-2 min-w-0 relative">
                    <div class="flex justify-between items-end px-4 h-20"><div class="flex -space-x-3">${s.hands[1].map((c) => `<div id="ai-card-${c.id}" class="w-10 h-14 bg-zinc-700 border border-zinc-600 rounded-lg shadow-xl transition-all"></div>`).join('')}</div><div class="flex gap-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                             <div class="flex flex-col items-center"><i data-lucide="layers" class="w-4 h-4 mb-1"></i>${s.decks[1].length}</div>
                             <div class="flex flex-col items-center cursor-pointer p-2 bg-rose-50 rounded-xl border-2 border-rose-400 text-rose-600 shadow-md hover:scale-105 active:scale-95 transition-all" onclick="window.App.pages.cardGame.viewPile('discard', 1)"><i data-lucide="trash-2" class="w-5 h-5 mb-0.5"></i><span class="text-[8px] font-black">${s.discardPiles[1].length}</span></div>
                    </div></div>
                    <div class="flex-1 grid grid-cols-3 gap-4 p-4 bg-zinc-200/50 rounded-[2.5rem] border border-zinc-300 shadow-inner relative z-0 transform-gpu">${[0, 1, 2].map(idx => `<div class="${(s.mode === 'scoring' && s.scoringState?.activeField !== -1 && s.scoringState?.activeField !== idx) ? 'opacity-20 grayscale' : ''} h-full relative z-10 field-stack">${p.renderFieldStack(idx, scores[idx])}</div>`).join('')}</div>
                    <div class="h-48 relative flex items-end px-4 gap-4 ${(s.mode === 'scoring') ? 'opacity-50 pointer-events-none grayscale' : ''}">
                        <div class="flex flex-col gap-3 mb-6 shrink-0 z-10"><button onclick="window.App.pages.cardGame.viewPile('draw', 0)" class="w-12 h-16 bg-zinc-800 rounded-xl border-2 border-zinc-700 flex flex-col items-center justify-center text-zinc-400 shadow-xl group"><i data-lucide="layers" class="w-5 h-5 mb-1 text-zinc-400 group-hover:text-white"></i><span class="text-[10px] font-black">${s.decks[0].length}</span></button><button onclick="window.App.pages.cardGame.viewPile('discard', 0)" class="w-12 h-16 bg-white rounded-xl border border-zinc-300 flex flex-col items-center justify-center text-zinc-500 shadow-lg hover:bg-zinc-50 group"><i data-lucide="trash-2" class="w-5 h-5 mb-1 group-hover:text-rose-500"></i><span class="text-[10px] font-black">${s.discardPiles[0].length}</span></button></div>
                        <div class="flex-1 flex items-end justify-center gap-4 -ml-6 mr-24"> ${s.hands[0].map((card, i) => p.renderPlayerCard(card, i)).join('')}</div>
                        ${actionBtnHTML}
                    </div>
                </div>
                ${s.awaitingTarget ? `<div class="absolute inset-0 bg-black/60 z-50 flex items-center justify-center pointer-events-none transform-gpu"><div class="bg-white text-zinc-900 px-8 py-4 rounded-full shadow-2xl border-4 border-zinc-200 animate-bounce font-black uppercase tracking-widest pointer-events-auto">点击指定目标区域</div></div>` : ''}
            </div>`;
    },
    
    renderSmallCard: function(card, index, topPos, isPortraitStack = false) {
        const bg = this.CONST.COLORS[card.color]; const isMine = card.owner === 0;
        const borderClass = isMine ? 'border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.25)]' : 'border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.25)]';
        const skillIcons = card.skills.slice(0, 3).map(s => `<div class="w-5 h-5 bg-black/60 rounded-full text-[9px] flex items-center justify-center text-white font-bold ring-1 ring-white/20">${this.CONST.SKILLS[s].short}</div>`).join('');
        const style = (topPos !== undefined && !isPortraitStack) ? `top: ${topPos}px; left: 10%; width: 80%; z-index: ${index};` : '';
        
        const canClick = !this.state.awaitingTarget && this.state.selectedCardIndices.length === 0;
        const clickAction = canClick ? `onclick="event.stopPropagation(); window.App.pages.cardGame.previewCard(${JSON.stringify(card).replace(/"/g, '&quot;')})"` : '';
        const tooltip = !this.isPortrait() && canClick ? window.App.pages.cardGame.getCardTooltip(card) : '';

        return `
        <div id="small-card-${card.id}" style="${style}" ${clickAction} class="${isPortraitStack ? '' : 'absolute'} h-32 w-24 rounded-xl border-[3px] ${borderClass} ${bg} shadow-lg flex flex-col items-center justify-center text-white transition-all transform hover:scale-105 shrink-0 group cursor-pointer overflow-visible transform-gpu">
             ${tooltip}
             <div class="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
                <div class="absolute top-1.5 right-1.5 flex gap-1 flex-wrap justify-end max-w-[80%]">${skillIcons}</div>
                <div class="text-4xl font-black drop-shadow-md absolute top-1.5 left-1.5 leading-none">${this.getCardValue(card)}</div>
             </div>
        </div>`;
    },

    renderFieldStackPortrait: function(idx, score) {
        const stack = this.state.fields[idx]; const stackColor = this.getStackColor(idx);
        const borderColor = stackColor === 0 ? 'border-red-200' : stackColor === 1 ? 'border-amber-200' : 'border-sky-200';
        let cardPositions = []; const step = 9; for(let i=0; i<stack.length; i++) cardPositions.push(Math.min(i * step, 65));
        const stackVisuals = stack.map((c, i) => `<div style="top: ${cardPositions[i]}%; left: 0; right: 0; position: absolute; display: flex; justify-content: center; z-index: ${i}; overflow: visible;"><div class="transform scale-[0.8] origin-top overflow-visible">${this.renderSmallCard(c, i, undefined, true)}</div></div>`).join('');
        const canPlace = (this.state.selectedCardIndices.length === 1 && this.state.turn === 0 && !this.state.awaitingTarget && this.canPlay(this.state.hands[0][this.state.selectedCardIndices[0]], idx));
        return `
        <div onclick="window.App.pages.cardGame.handleStackClick(${idx})" class="relative h-full rounded-2xl border-2 ${borderColor} ${stackColor === 0 ? 'bg-red-50/50' : stackColor === 1 ? 'bg-amber-50/50' : 'bg-sky-50/50'} ${canPlace ? 'ring-4 ring-green-400 shadow-[0_0_15px_rgba(74,222,128,0.5)] bg-green-50' : this.state.awaitingTarget ? 'ring-4 ring-rose-500/50 bg-rose-50/80' : ''} flex flex-col overflow-visible transition-all active:scale-95 shadow-sm transform-gpu">
            ${canPlace ? `<div class="absolute -top-3 -left-3 z-30 bg-green-500 text-white w-7 h-7 flex items-center justify-center rounded-full border-2 border-white shadow-lg animate-bounce"><i data-lucide="check" class="w-4 h-4 stroke-[3]"></i></div>` : ''}
            ${(stack.length > 0 && this.hasSkill(stack[stack.length-1], 'lock')) ? `<div class="absolute -top-2 -right-2 z-30 bg-zinc-900 text-white w-7 h-7 flex items-center justify-center rounded-full border-2 border-white shadow-xl animate-pulse"><i data-lucide="lock" class="w-3.5 h-3.5"></i></div>` : ''}
            <div class="h-12 border-b ${borderColor} bg-white/90 flex flex-col items-center justify-center shrink-0 z-20 rounded-t-2xl">
                 <span class="text-[10px] font-black uppercase tracking-widest ${stackColor === 0 ? 'text-red-600' : stackColor === 1 ? 'text-amber-600' : 'text-sky-600'}">${this.CONST.COLOR_NAMES[stackColor]}</span>
                 <div class="flex items-center gap-2 text-[9px] font-black"><span class="text-rose-500">${score.ai}</span><span class="text-zinc-300">/</span><span class="text-green-600">${score.player}</span></div>
            </div>
            <div id="stack-container-${idx}" class="relative flex-1 w-full overflow-visible transform-gpu">${stackVisuals}</div>
        </div>`;
    },

    renderFieldStack: function(idx, score) {
        const stack = this.state.fields[idx]; const stackColor = this.getStackColor(idx);
        const standardStep = 138; let step = standardStep;
        if (stack.length > 1 && (stack.length-1) * standardStep + 128 > 400) step = (400 - 128) / (stack.length - 1);
        const stackVisuals = stack.map((c, i) => this.renderSmallCard(c, i, i * step)).join('');
        const canPlace = (this.state.selectedCardIndices.length === 1 && this.state.turn === 0 && !this.state.awaitingTarget && this.canPlay(this.state.hands[0][this.state.selectedCardIndices[0]], idx));
        return `
        <div onclick="window.App.pages.cardGame.handleStackClick(${idx})" class="relative h-[460px] border-2 ${this.CONST.COLOR_BORDERS[stackColor]} ${stackColor === 0 ? 'bg-red-50' : stackColor === 1 ? 'bg-amber-50' : 'bg-sky-50'} rounded-2xl flex flex-col transition-all cursor-pointer hover:bg-black/5 overflow-visible z-0 transform-gpu ${canPlace ? 'ring-4 ring-green-400 shadow-[0_0_20px_rgba(74,222,128,0.4)]' : ''}">
            ${canPlace ? `<div class="absolute -top-4 -left-4 z-30 bg-green-500 text-white w-10 h-10 flex items-center justify-center rounded-full border-4 border-white shadow-xl animate-bounce"><i data-lucide="check" class="w-6 h-6 stroke-[4]"></i></div>` : ''}
            ${(stack.length > 0 && this.hasSkill(stack[stack.length-1], 'lock')) ? `<div class="absolute -top-3 -right-3 z-30 bg-zinc-800 text-white w-8 h-8 flex items-center justify-center rounded-full border-2 border-white shadow-lg animate-pulse"><i data-lucide="lock" class="w-4 h-4"></i></div>` : ''}
            <div class="absolute top-0 left-0 right-0 p-2 flex justify-between items-start pointer-events-none z-20 bg-gradient-to-b from-white/95 to-transparent h-12 rounded-t-xl overflow-hidden">
                 <div class="bg-white/95 px-2 py-1 rounded text-[10px] font-black ${this.CONST.COLOR_TEXT[stackColor]} shadow-sm border border-black/5">${this.CONST.COLOR_NAMES[stackColor]}</div>
                 <div class="flex flex-col items-end"><span class="text-xs font-black ${score.ai > score.player ? 'text-red-500' : 'text-zinc-400'}">${score.ai}</span><div class="w-full h-[1px] bg-zinc-300 my-0.5"></div><span class="text-sm font-black ${score.player > score.ai ? 'text-green-500' : 'text-zinc-600'}">${score.player}</span></div>
            </div>
            <div id="stack-container-${idx}" class="relative w-full h-full mt-10 overflow-visible pointer-events-none transform-gpu"><div class="pointer-events-auto">${stackVisuals}</div></div>
        </div>`;
    },

    renderPlayerCard: function(card, idx, isPortraitFan = false) {
        const isSelected = this.state.selectedCardIndices.includes(idx);
        const bg = this.CONST.COLORS[card.color];
        let activeClass = isPortraitFan 
            ? (isSelected ? 'border-amber-400 shadow-2xl ring-4 ring-amber-300/30' : 'border-white shadow-lg')
            : (isSelected ? 'border-amber-400 -translate-y-12 shadow-2xl ring-4 ring-amber-300/30 z-20' : 'border-white hover:-translate-y-8 hover:shadow-xl z-10');
        
        const clickAction = `onclick="window.App.pages.cardGame.selectCard(${idx})"`;
        const canPreview = !this.state.awaitingTarget && this.state.selectedCardIndices.length === 0;
        const longPressAction = canPreview ? `oncontextmenu="event.preventDefault(); window.App.pages.cardGame.previewCard(${JSON.stringify(card).replace(/"/g, '&quot;')})"` : 'oncontextmenu="event.preventDefault();"';
        
        return `
        <div id="card-${card.id}" class="group relative flex flex-col items-center ${(Date.now() - (card.drawnAt || 0) < 500) ? 'animate-draw' : ''} overflow-visible transform-gpu">
            ${canPreview ? window.App.pages.cardGame.getCardTooltip(card) : ''}
            <div ${clickAction} ${longPressAction} class="w-32 h-48 shrink-0 rounded-[1.25rem] ${bg} border-[5px] ${activeClass} relative flex flex-col items-center p-3 text-white cursor-pointer transition-all duration-300 select-none overflow-hidden shadow-2xl">
                <div class="absolute top-2.5 right-3 opacity-40"><i data-lucide="${this.CONST.COLOR_ICONS[card.color]}" class="w-7 h-7"></i></div>
                ${isPortraitFan ? `<div class="absolute top-1.5 left-3 text-5xl font-black drop-shadow-md z-10 leading-none">${this.getCardValue(card)}</div>` : `<div class="mt-6 text-7xl font-black drop-shadow-md">${this.getCardValue(card)}</div>`}
                <div class="mt-auto w-full flex flex-col gap-1.5 mb-1">${card.skills.map(s => `<div class="bg-black/40 rounded px-1 text-xs font-black text-center py-0.5 border border-white/10 font-mono tracking-tighter">${this.CONST.SKILLS[s].name}</div>`).join('')}</div>
                ${isSelected ? '<div class="absolute -top-3 -right-3 w-8 h-8 bg-amber-400 text-white rounded-full flex items-center justify-center shadow-xl border-4 border-white"><i data-lucide="check" class="w-4 h-4 stroke-[4]"></i></div>' : ''}
            </div>
        </div>`;
    },

    renderPileModal: function() {
        const mode = this.state.pileViewMode; if (!mode) return '';
        const isEnemy = mode.owner === 1; const ownerName = isEnemy ? '对方' : '我方';
        
        let cards;
        if (this.state.mode === 'reward' && mode.owner === 0) {
            cards = [...this.state.playerDeck].sort((a,b) => (a.color - b.color) || (a.number - b.number));
        } else {
            cards = (mode.type === 'draw') ? [...this.state.decks[mode.owner]].sort((a,b) => (a.color - b.color) || (a.number - b.number)) : [...this.state.discardPiles[mode.owner]];
        }

        const isPort = this.isPortrait();
        return `
        <div onclick="window.App.pages.cardGame.closeModal()" class="fixed inset-0 z-[600] bg-black/80 flex items-center justify-center p-4 animate-in fade-in duration-200 transform-gpu">
            <div onclick="event.stopPropagation()" class="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden border-4 ${isEnemy ? 'border-rose-400' : 'border-zinc-100'}">
                <div class="p-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50 shrink-0">
                    <div class="flex flex-col"><span class="text-[9px] font-black text-zinc-400 uppercase tracking-widest">${ownerName}</span><h3 class="text-lg font-black ${isEnemy ? 'text-rose-500' : 'text-zinc-800'}">${mode.type === 'draw' ? '当前牌库' : '弃牌区'} (${cards.length})</h3></div>
                    <button onclick="window.App.pages.cardGame.closeModal()" class="w-10 h-10 flex items-center justify-center hover:bg-zinc-200 rounded-full transition-colors"><i data-lucide="x" class="w-6 h-6"></i></button>
                </div>
                <div class="flex-1 overflow-y-auto p-6 bg-zinc-100">
                    <div class="${isPort ? "grid grid-cols-4 gap-2 place-items-center" : "flex flex-wrap justify-center gap-5"} overflow-visible mt-8">
                        ${cards.length === 0 ? '<div class="col-span-4 text-zinc-300 font-black py-20 w-full text-center tracking-[0.3em] text-sm uppercase">暂无数据</div>' : cards.map(c => `
                            <div style="${isPort ? 'width: 76px; height: 114px;' : 'width: 128px; height: 192px;'}" class="relative overflow-visible shrink-0 transform-gpu">
                                <div style="${isPort ? 'transform: scale(0.6); transform-origin: top left;' : 'transform: scale(0.9);'}" class="overflow-visible transform-gpu">
                                    ${this.renderSmallCard(c)}
                                </div>
                            </div>`).join('')}
                    </div>
                </div>
            </div>
        </div>`;
    },

    renderDiscardModal: function() {
        return `<div class="fixed inset-0 z-[500] bg-black/70 flex items-center justify-center p-6 transform-gpu"><div class="bg-white rounded-[2rem] shadow-2xl max-w-sm w-full p-8 border-4 border-zinc-100 animate-in zoom-in duration-200"><div class="text-center"><div class="w-16 h-16 bg-sky-50 text-sky-500 rounded-2xl flex items-center justify-center mx-auto mb-6"><i data-lucide="refresh-cw" class="w-8 h-8"></i></div><h3 class="text-xl font-black mb-3 text-zinc-800">战术重置</h3><p class="text-sm text-zinc-500 mb-8 font-bold leading-relaxed">确定弃置 ${this.state.selectedCardIndices.length} 张牌并换领 1 张新资源吗？</p><div class="flex gap-3"><button id="discard-cancel" onclick="window.App.pages.cardGame.cancelDiscard()" class="flex-1 py-4 bg-zinc-100 rounded-2xl font-black text-sm uppercase transition-colors">取消</button><button id="discard-confirm" onclick="window.App.pages.cardGame.confirmDiscard()" class="flex-1 py-4 bg-sky-500 text-white rounded-2xl font-black text-sm shadow-lg shadow-sky-100 active:scale-95 transition-transform">确认</button></div></div></div></div>`;
    },
    
    renderTrainModal: function() {
        return `<div class="fixed inset-0 z-[500] bg-black/70 flex items-center justify-center p-6 transform-gpu"><div class="bg-white rounded-[2rem] shadow-2xl max-w-sm w-full p-8 border-4 border-zinc-100 animate-in zoom-in duration-200"><div class="text-center"><div class="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-6"><i data-lucide="hammer" class="w-8 h-8"></i></div><h3 class="text-xl font-black mb-3 text-zinc-800">特训方向</h3><p class="text-sm text-zinc-500 mb-8 font-bold">请指定相邻卡牌的变动极性：</p><div class="flex gap-4"><button id="train-minus" onclick="window.App.pages.cardGame.handleTrainChoice(-1)" class="flex-1 py-5 bg-zinc-100 text-2xl font-black rounded-2xl border-2 border-zinc-200 active:scale-95 transition-transform">-1</button><button id="train-plus" onclick="window.App.pages.cardGame.handleTrainChoice(1)" class="flex-1 py-5 bg-amber-500 text-white text-2xl font-black rounded-2xl shadow-xl shadow-amber-200 border-2 border-amber-600 active:scale-95 transition-transform">+1</button></div></div></div></div>`;
    },

    renderReward: function() {
        const rewards = this.state.rewardGroups || [];
        const isPort = this.isPortrait();
        let modalHtml = '';
        if (this.state.previewCard) modalHtml = this.renderCardDetailModal(this.state.previewCard);
        else if (this.state.pileViewMode) modalHtml = this.renderPileModal();
        
        return `
        <div class="flex flex-col items-center h-full gap-2 md:gap-6 p-4 overflow-y-auto bg-zinc-50 relative">
            ${modalHtml}
            <div class="text-center shrink-0 mb-2 mt-4">
                <h2 class="text-2xl font-black text-amber-500 uppercase tracking-tighter">对决大捷</h2>
                <p class="text-[10px] text-zinc-400 font-black uppercase tracking-[0.2em] mt-0.5">请从下列组合中挑选心仪的资源</p>
            </div>
            <div class="${isPort ? "flex flex-col w-full gap-2 pb-2" : "flex flex-col w-full max-w-6xl gap-5 pt-8 pb-12"} overflow-visible">
                ${rewards.length > 0 ? rewards.map((group, idx) => {
                    if (!group) return '';
                    const cardsHtml = group.map(card => {
                         const json = JSON.stringify(card).replace(/"/g, '&quot;');
                         return `
                         <div onclick="window.App.pages.cardGame.previewCard(${json})" class="relative shrink-0 transition-transform hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center">
                            <div class="${isPort ? 'scale-[0.45] -mx-6' : 'scale-[1.15] mx-6'} transform-gpu">
                                ${this.renderCardStatic(card)}
                            </div>
                         </div>`;
                    }).join('');
                    
                    return `
                    <div class="bg-white rounded-[2rem] border-2 border-zinc-100 ${isPort ? 'p-1 h-28' : 'p-6 h-auto'} flex flex-row items-center justify-between gap-1 shadow-sm hover:shadow-xl transition-all group/pack overflow-visible z-10 relative">
                        <div class="w-8 h-8 bg-zinc-50 rounded-lg flex items-center justify-center shrink-0 border border-zinc-100 ml-2"><span class="font-black text-zinc-300 text-sm">${idx+1}</span></div>
                        <div class="flex-1 flex justify-center items-center overflow-visible">${cardsHtml}</div>
                        <button onclick="window.App.pages.cardGame.selectRewardGroup(${idx})" class="bg-zinc-900 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 shadow-lg shrink-0 mr-2">选取</button>
                    </div>`;
                }).join('') : '<div class="text-zinc-300 font-black text-xl animate-pulse">资源整备中...</div>'}
            </div>
            
            <div class="flex items-center gap-8 shrink-0 mt-2 mb-8">
                <button onclick="window.App.pages.cardGame.viewPile('draw', 0)" class="text-zinc-600 font-black text-[11px] uppercase tracking-widest flex items-center gap-2 px-6 py-3 bg-white border-2 border-zinc-200 rounded-full shadow-md hover:bg-zinc-50 active:scale-95 transition-all">
                    <i data-lucide="layers" class="w-4 h-4 text-amber-500"></i> 查看我的牌库
                </button>
                <button onclick="window.App.pages.cardGame.skipReward()" class="text-zinc-400 hover:text-zinc-600 text-[11px] font-black underline uppercase tracking-[0.2em] px-4 py-2">不，直接出发</button>
            </div>
        </div>`;
    },

    renderEvent: function() {
        const evt = this.state.eventData; let content = '';
        if (evt.type === 'shop') {
             const remMode = evt.removalMode;
             content = `<div class="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm"><i data-lucide="store" class="w-8 h-8"></i></div><h3 class="text-2xl font-black text-zinc-800 mb-1">对战整备</h3><div class="flex items-center gap-2 mb-8 bg-yellow-50 px-4 py-1.5 rounded-full border border-yellow-200 text-yellow-700 font-black text-xs shadow-sm"><i data-lucide="coins" class="w-4 h-4"></i> ${this.state.gold} 金币</div><div class="grid grid-cols-2 gap-4 w-full max-w-lg mb-4"><button id="btn-buy-pack" onclick="window.App.pages.cardGame.buyCardPack()" class="flex flex-col items-center p-8 bg-white border-2 border-zinc-100 rounded-3xl hover:border-purple-300 transition-all"><i data-lucide="package-plus" class="w-8 h-8 text-purple-500 mb-3"></i><span class="font-black text-sm uppercase tracking-widest text-zinc-700">随机包</span><span class="text-[10px] font-black text-yellow-600 mt-1">50 G</span></button><button id="btn-toggle-removal" onclick="window.App.pages.cardGame.toggleRemovalMode()" class="flex flex-col items-center p-8 bg-white border-2 border-zinc-100 rounded-3xl hover:border-rose-300 transition-all ${remMode ? 'ring-4 ring-rose-500/20 border-rose-500' : ''}"><i data-lucide="trash-2" class="w-8 h-8 text-rose-500 mb-3"></i><span class="font-black text-sm uppercase tracking-widest text-zinc-700">精简</span><span class="text-[10px] font-black text-yellow-600 mt-1">100 G</span></button></div>${remMode ? `<div class="w-full mt-6"><p class="text-center text-rose-500 text-[10px] font-black mb-4 animate-pulse">选择要移除的卡牌</p><div class="flex flex-wrap justify-center gap-2 max-h-[300px] overflow-y-auto p-4 bg-zinc-100 rounded-2xl transform-gpu">${this.state.playerDeck.map((c, i) => `<div onclick="window.App.pages.cardGame.buyRemoval(${i})" class="scale-[0.6] -mx-7 cursor-pointer hover:opacity-80 transition-opacity relative group transform-gpu"><div class="absolute inset-0 bg-rose-500/40 z-10 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 font-black text-white text-[10px] uppercase">销毁</div>${this.renderCardStatic(c)}</div>`).join('')}</div></div>` : ''}<button onclick="window.App.pages.cardGame.resolveEvent()" class="mt-8 text-zinc-400 hover:text-zinc-600 font-black text-[10px] uppercase tracking-[0.3em]">离开</button>`;
        } else if (evt.type === 'blacksmith') {
             content = `<div class="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm"><i data-lucide="hammer" class="w-8 h-8"></i></div><h3 class="text-2xl font-black text-zinc-800 mb-1">强化设施</h3><p class="text-zinc-500 mb-8 text-center max-w-xs font-bold text-sm leading-relaxed">指定一张牌进行特殊强化：点数额外+1并随机获得一个技能。</p><div class="flex flex-wrap justify-center gap-2 max-h-[350px] overflow-y-auto p-4 bg-zinc-100 rounded-2xl w-full max-w-3xl transform-gpu">${this.state.playerDeck.map((c, i) => `<div onclick="window.App.pages.cardGame.state.eventData.selectedIdx = ${i}; window.App.pages.cardGame.resolveEvent()" class="scale-[0.6] -mx-7 cursor-pointer hover:opacity-80 transition-opacity transform-gpu"> ${this.renderCardStatic(c)} </div>`).join('')}</div><button onclick="window.App.pages.cardGame.state.eventData.selectedIdx = null; window.App.pages.cardGame.resolveEvent()" class="mt-10 text-zinc-400 hover:text-zinc-600 font-black text-[10px] uppercase tracking-[0.3em]">跳过</button>`;
        } else content = `<div class="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm"><i data-lucide="tent" class="w-8 h-8"></i></div><h3 class="text-2xl font-black text-zinc-800 mb-1">临时安全区</h3><p class="text-zinc-500 mb-8 text-center max-w-xs font-bold text-sm leading-relaxed">暂时休整以应对后续挑战。</p><button onclick="window.App.pages.cardGame.resolveEvent()" class="atom-btn px-12 py-4 bg-zinc-900 text-white shadow-xl shadow-zinc-200 transition-transform active:scale-95">重新出发</button>`;
        return `<div class="flex flex-col items-center justify-center h-full fade-in p-6">${content}</div>`;
    },

    renderCardStatic: function(card) {
        if (!card) return '';
        const bg = this.CONST.COLORS[card.color];
        return `
        <div class="group relative w-32 h-48 select-none overflow-visible transform-gpu">
            ${!this.isPortrait() ? window.App.pages.cardGame.getCardTooltip(card) : ''}
            <div class="absolute inset-0 rounded-[1.25rem] ${bg} border-[5px] border-white shadow-xl flex flex-col items-center p-4 text-white overflow-hidden">
                <div class="absolute top-2.5 right-3 opacity-40"><i data-lucide="${this.CONST.COLOR_ICONS[card.color]}" class="w-7 h-7"></i></div>
                <div class="mt-6 text-7xl font-black drop-shadow-md leading-none">${this.getCardValue(card)}</div>
                <div class="mt-auto w-full flex flex-col gap-1.5">${card.skills.map(s => `<div class="bg-black/40 rounded px-1.5 text-xs font-black text-center py-0.5 border border-white/10 uppercase font-mono">${this.CONST.SKILLS[s].name}</div>`).join('')}${card.skills.length === 0 ? '<div class="text-[9px] text-white/40 text-center font-black uppercase tracking-widest">常规</div>' : ''}</div>
            </div>
        </div>`;
    },

    animateElementExit: async function(elementId, isAi = false) {
        const el = document.getElementById(elementId);
        if(el) {
            el.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            el.style.transform = isAi ? 'scale(0) translateY(100px)' : 'translateY(-150px) scale(0.8) rotate(10deg)';
            el.style.opacity = '0';
            await new Promise(r => setTimeout(r, 300));
        }
    },
    
    showFloatingScore: function(targetEl, text, color) {
        const rect = targetEl.getBoundingClientRect();
        const floatEl = document.createElement('div');
        floatEl.className = 'fixed z-[100] pointer-events-none font-black text-3xl drop-shadow-lg animate-float-up';
        floatEl.style.color = color;
        floatEl.style.left = `${rect.left + rect.width / 2}px`;
        floatEl.style.top = `${rect.top}px`;
        floatEl.style.transform = 'translateX(-50%)';
        floatEl.innerText = text;
        document.body.appendChild(floatEl);
        setTimeout(() => floatEl.remove(), 1000);
    },

    getSettlementButtonText: function(totalP, totalA) {
        if (totalP > totalA) return "夺取本轮胜利 🐾";
        if (totalA > totalP) return "再接再厉 💦";
        return "平局 ⚖️";
    },

    injectStyles: function() {
        if (!document.getElementById('card-game-styles')) {
            const style = document.createElement('style');
            style.id = 'card-game-styles';
            style.innerHTML = `
                @keyframes drawCard { 0% { transform: translateY(100px) scale(0.7); opacity: 0; } 100% { transform: translateY(0) scale(1); opacity: 1; } }
                .animate-draw { animation: drawCard 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
                @keyframes boomEffect { 0% { transform: scale(1); filter: brightness(1); } 20% { transform: scale(1.3) rotate(5deg); filter: brightness(2); } 100% { transform: scale(0); opacity: 0; } }
                .animate-boom { animation: boomEffect 0.6s ease-in forwards !important; }
                @keyframes bounceEffect { 0% { transform: translateY(0); } 20% { transform: translateY(15px); } 100% { transform: translateY(-300px); opacity: 0; } }
                .animate-bounce-up { animation: bounceEffect 0.6s ease-in forwards !important; }
                @keyframes floatUp { 0% { transform: translate(-50%, 0) scale(0.8); opacity: 0; } 30% { transform: translate(-50%, -30px) scale(1.3); opacity: 1; } 100% { transform: translate(-50%, -100px) scale(1); opacity: 0; } }
                .animate-float-up { animation: floatUp 1s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
                .reverse-active {
                    position: relative;
                }
                .reverse-active::before {
                    content: ''; position: absolute; inset: 0; z-index: 50; pointer-events: none;
                    box-shadow: inset 0 0 120px rgba(139, 92, 246, 0.5);
                    animation: reverse-pulse 2s infinite alternate;
                    border: 8px solid rgba(139, 92, 246, 0.4);
                }
                @keyframes reverse-pulse { 0% { opacity: 0.4; } 100% { opacity: 0.8; } }
                .tooltip-box { pointer-events: none; visibility: hidden; opacity: 0; transition: none !important; z-index: 100000 !important; }
                .group:hover > .tooltip-box { visibility: visible; opacity: 1; transition: opacity 0.2s ease-in-out !important; }
                .group:hover { z-index: 99999 !important; }
                .field-stack:hover { z-index: 1000 !important; }
                .transform-gpu { transform: translateZ(0); will-change: transform; }
            `;
            document.head.appendChild(style);
        }
    }
});
