
// --- CARD GAME CORE LOGIC ---
window.App = window.App || {};
window.App.pages = window.App.pages || {};
window.App.pages.cardGame = window.App.pages.cardGame || {};

Object.assign(window.App.pages.cardGame, {
    state: {
        mode: 'intro',
        gameMode: 'classic',
        level: 1,
        maxLevel: 10,
        playerDeck: [], 
        gold: 100, 
        character: null,
        turn: 0,
        ippon: [0, 0],
        fields: [[], [], []],
        hands: [[], []], 
        decks: [[], []], 
        discardPiles: [[], []], 
        log: [],
        selectedCardIndices: [],
        isProcessing: false,
        battleWinner: null,
        awaitingTarget: null, 
        effectQueue: [],
        pendingDraw: 0,
        lastPlayedCard: { id: null, time: 0 }, 
        discardConfirmOpen: false,
        trainingPending: null,
        pileViewMode: null, 
        scoringState: null, 
        showLog: false,
        previewCard: null,
        hasPlayedInThisRound: false,
        hintDismissed: false,
        playerAvatar: 'paw-print',
        enemyData: null,
        rewardGroups: []
    },

    createCard: function(ownerId, color, number, skills = []) {
        return {
            id: Math.random().toString(36).substr(2, 9),
            owner: ownerId,
            color: color,
            originalColor: color,
            number: number,
            skills: [...skills],
            drawnAt: 0 
        };
    },

    initStarterDeck: function(charType) {
        const deck = [];
        if (charType === 'dog') {
            for (let c = 0; c < 3; c++) {
                for (let n = 1; n <= 7; n++) deck.push(this.createCard(0, c, n, []));
            }
        } else if (charType === 'cat') {
            for (let n = 1; n <= 7; n++) {
                deck.push(this.createCard(0, 2, n, []));
                deck.push(this.createCard(0, 2, n, []));
            }
            const shuffle = deck.sort(() => Math.random() - 0.5);
            shuffle[0].skills.push('dye'); shuffle[1].skills.push('dye');
            shuffle[2].skills.push('discolor'); shuffle[3].skills.push('discolor');
        }
        return deck;
    },

    initClassicDeck: function(ownerId) {
        const deck = [];
        for (let c = 0; c < 3; c++) {
            for (let n = 1; n <= 7; n++) {
                deck.push(this.createCard(ownerId, c, n, []));
                deck.push(this.createCard(ownerId, c, n, []));
            }
        }
        const skillKeys = Object.keys(this.CONST.SKILLS);
        const skillPool = [];
        skillKeys.forEach(s => { skillPool.push(s, s); });
        skillPool.sort(() => Math.random() - 0.5);
        for (const skill of skillPool) {
            const validCards = deck.filter(card => {
                if (card.skills.length >= 3) return false;
                if (card.skills.includes(skill)) return false;
                if (skill === 'max' && card.skills.includes('min')) return false;
                if (skill === 'min' && card.skills.includes('max')) return false;
                return true;
            });
            if (validCards.length > 0) {
                validCards[Math.floor(Math.random() * validCards.length)].skills.push(skill);
            }
        }
        return deck.sort(() => Math.random() - 0.5);
    },

    generateAiDeck: function(level) {
        const enemyIdx = (level - 1) % this.CONST.ENEMIES.length;
        const config = this.CONST.ENEMIES[enemyIdx].deckConfig;
        const deck = [];
        config.colors.forEach(c => {
            config.nums.forEach(n => {
                for(let i=0; i<config.copies; i++) deck.push(this.createCard(1, c, n, []));
            });
        });
        const skillKeys = Object.keys(this.CONST.SKILLS);
        const skillCount = Math.floor(level / 2) + 2;
        for (let i = 0; i < skillCount; i++) {
            const card = deck[Math.floor(Math.random() * deck.length)];
            const s = skillKeys[Math.floor(Math.random() * skillKeys.length)];
            if (!card.skills.includes(s)) card.skills.push(s);
        }
        return deck.sort(() => Math.random() - 0.5);
    },

    initGame: function() {
        this.injectStyles();
        this.state.mode = 'intro';
        this.state.hintDismissed = false;
        this.renderGame();
    },

    selectMode: function(mode) {
        this.state.gameMode = mode;
        if (mode === 'classic') {
            this.state.character = null;
            this.state.playerAvatar = 'dog';
            this.state.mode = 'map'; 
            this.renderGame();
        } else {
            this.state.mode = 'character_select';
            this.renderGame();
        }
    },

    selectCharacter: function(charType) {
        this.state.character = charType;
        this.state.playerAvatar = this.CONST.CHARACTERS[charType].icon;
        this.state.playerDeck = this.initStarterDeck(charType);
        this.state.level = 1;
        this.state.gold = 100;
        this.state.mode = 'map';
        this.renderGame();
    },

    enterBattle: function() {
        this.state.mode = 'battle';
        this.state.turn = 0;
        this.state.ippon = [0, 0];
        this.state.fields = [[], [], []];
        this.state.showLog = false;
        this.state.previewCard = null;
        this.state.hasPlayedInThisRound = false;
        
        if (this.state.gameMode === 'classic') {
            this.state.log = [{ text: `阿不然打牌啰 2：系统初始化。`, color: 'text-sky-400 font-bold' }];
            this.state.decks = [this.initClassicDeck(0), this.initClassicDeck(1)];
            this.state.enemyData = { name: '镜像对手', icon: 'cat', color: 'text-rose-500', bg: 'bg-rose-100' };
        } else {
            this.state.log = [{ text: `第 ${this.state.level} 区域战役开始。`, color: 'text-zinc-400' }];
            this.state.decks = [
                JSON.parse(JSON.stringify(this.state.playerDeck)).map(c => ({...c, owner: 0})).sort(() => Math.random() - 0.5),
                this.generateAiDeck(this.state.level)
            ];
            const enemyIdx = (this.state.level - 1) % this.CONST.ENEMIES.length;
            this.state.enemyData = this.CONST.ENEMIES[enemyIdx];
        }

        this.state.discardPiles = [[], []];
        this.state.hands = [[], []];
        this.state.effectQueue = [];
        this.state.pendingDraw = 0;
        this.state.isProcessing = false;

        this.drawCards(0, 6); 
        this.drawCards(1, 6);
        this.renderGame();

        if (this.isPortrait()) {
            setTimeout(() => {
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            }, 100);
        }
    },

    drawCards: function(playerId, count) {
        const now = Date.now();
        for (let i = 0; i < count; i++) {
            if (this.state.decks[playerId].length === 0) {
                if (this.state.discardPiles[playerId].length > 0) {
                    if(playerId === 0) this.log("牌库已空，洗切弃牌堆。", "text-zinc-500");
                    this.state.decks[playerId] = [...this.state.discardPiles[playerId]];
                    this.state.discardPiles[playerId] = [];
                    this.state.decks[playerId].sort(() => Math.random() - 0.5);
                } else break;
            }
            if (this.state.decks[playerId].length > 0) {
                const card = this.state.decks[playerId].pop();
                card.drawnAt = now + (i * 100);
                this.state.hands[playerId].push(card);
            }
        }
    },

    sendToDiscard: function(card, playerId) {
        card.color = card.originalColor; 
        this.state.discardPiles[playerId].push(card);
    },
    
    getStackColor: function(fieldIdx) {
        const stack = this.state.fields[fieldIdx];
        if (!stack) return fieldIdx;
        for (let i = stack.length - 1; i >= 0; i--) {
            if (stack[i] && stack[i].skills && stack[i].skills.includes('dye')) return stack[i].color;
        }
        return fieldIdx;
    },

    isGlobalReverse: function() {
        let count = 0;
        this.state.fields.forEach(stack => { stack.forEach(c => { if (this.hasSkill(c, 'reverse')) count++; }); });
        return count % 2 !== 0;
    },

    getCardValue: function(card) {
        if (!card) return 0;
        if (card.skills.includes('min')) return 0;
        if (card.skills.includes('max')) return 8;
        return card.number;
    },

    hasSkill: function(card, skillName) {
        return card && card.skills && card.skills.includes(skillName);
    },

    canPlay: function(card, fieldIdx) {
        if (!card) return false;
        const stack = this.state.fields[fieldIdx];
        const top = stack.length > 0 ? stack[stack.length - 1] : null;
        const stackColor = this.getStackColor(fieldIdx);
        const isReversed = this.isGlobalReverse();
        const isWild = this.hasSkill(card, 'discolor') || this.hasSkill(card, 'dye');
        let lockedColors = [];
        this.state.fields.forEach(s => {
            const t = s.length > 0 ? s[s.length - 1] : null;
            if (t && t.owner !== this.state.turn && this.hasSkill(t, 'lock')) lockedColors.push(t.color);
        });
        if (lockedColors.length > 0 && !lockedColors.includes(card.color)) return false;
        if (card.color !== stackColor && !isWild) return false;
        if (!top) return true;
        if (top.owner === this.state.turn && this.hasSkill(top, 'handover')) return true;
        if (this.hasSkill(card, 'domineer')) return true;
        const myVal = this.getCardValue(card);
        const topVal = this.getCardValue(top);
        if (this.hasSkill(card, 'replace')) {
             if (isReversed) return myVal <= topVal;
             return myVal >= topVal;
        }
        if (isReversed) return myVal < topVal;
        return myVal > topVal;
    },

    calculateStackScore: function(fieldIdx) {
        const stack = this.state.fields[fieldIdx];
        if (!stack || stack.length === 0) return { player: 0, ai: 0 };
        const top = stack[stack.length - 1];
        let pScore = 0; let aScore = 0;
        stack.forEach(c => {
            let val = 1;
            if (this.hasSkill(c, 'add1')) val += 1;
            if (this.hasSkill(c, 'add2')) val += 2;
            if (this.hasSkill(c, 'add3')) val += 3;
            if (c.owner === 0) pScore += val; else aScore += val;
        });
        if (this.hasSkill(top, 'double')) { if (top.owner === 0) pScore *= 2; else aScore *= 2; }
        return { player: pScore, ai: aScore };
    },

    handleStackClick: async function(fieldIdx) {
        if (this.state.mode !== 'battle') return;
        if (this.state.awaitingTarget) { await this.resolveDiscardEffect(fieldIdx); return; }
        if (!this.state.isProcessing && this.state.turn === 0 && this.state.selectedCardIndices.length === 1) {
            const cardIdx = this.state.selectedCardIndices[0];
            const card = this.state.hands[0][cardIdx];
            if (this.canPlay(card, fieldIdx)) {
                if (this.hasSkill(card, 'train')) {
                    this.state.trainingPending = { type: 'play', indices: [cardIdx], targetField: fieldIdx };
                    this.renderGame();
                    return;
                }
                this.playCard(0, cardIdx, fieldIdx);
            }
        }
    },

    playCard: async function(playerId, cardIdx, fieldIdx) {
        if (this.state.isProcessing) return;
        this.state.isProcessing = true;
        
        // 我方出牌会消除长按提示
        if (playerId === 0) {
            this.state.hasPlayedInThisRound = true;
            this.state.hintDismissed = true;
        }
        
        const hand = this.state.hands[playerId];
        const card = hand[cardIdx];
        if (playerId === 0) await this.animateElementExit(`card-${card.id}`);
        else await this.animateElementExit(`ai-card-${card.id}`, true);
        hand.splice(cardIdx, 1);
        this.state.selectedCardIndices = [];
        const stack = this.state.fields[fieldIdx];
        const top = stack.length > 0 ? stack[stack.length - 1] : null;

        if (this.hasSkill(card, 'replace') && top) {
             if (this.hasSkill(top, 'guard')) {
                 this.log(`${playerId===0?'我方':'对方'} [背刺] 无效：目标拥有 [格挡]`);
             } else {
                 this.log(`${playerId===0?'我方':'对方'} [背刺] 摧毁顶牌`);
                 const topEl = document.getElementById(`small-card-${top.id}`);
                 if (topEl) { topEl.classList.add('animate-boom'); await new Promise(r => setTimeout(r, 450)); }
                 const destroyed = stack.pop();
                 this.sendToDiscard(destroyed, destroyed.owner);
             }
        }
        if (this.hasSkill(card, 'copy') && stack.length > 0) {
            const last = stack[stack.length-1];
            this.log(`${playerId===0?'我方':'对方'} [模仿] 复制技能`);
            card.skills = [...last.skills];
        }
        if (this.hasSkill(card, 'discolor')) card.color = fieldIdx;
        stack.push(card);
        this.state.lastPlayedCard = { id: card.id, time: Date.now() };
        if (this.hasSkill(card, 'continue')) {
            this.log(`[补给] 双方各抽 1 张牌`);
            this.drawCards(0, 1); this.drawCards(1, 1);
            this.renderGame(); await new Promise(r => setTimeout(r, 400));
        }
        if (this.hasSkill(card, 'control') && stack.length >= 3) {
            const b1 = stack[stack.length - 2]; const b2 = stack[stack.length - 3];
            const myVal = this.getCardValue(card); const v1 = this.getCardValue(b1); const v2 = this.getCardValue(b2);
            const isRev = this.isGlobalReverse();
            const d1 = isRev ? (v1 - myVal) : (myVal - v1); const d2 = isRev ? (v2 - myVal) : (myVal - v2);
            if (d1 === 1 && d2 === 2) { this.log(`[魅惑] 捕获下方控制权`); b1.owner = playerId; b2.owner = playerId; }
        }
        this.renderGame();
        if (this.hasSkill(card, 'rush')) {
            await new Promise(r => setTimeout(r, 400));
            const valids = [];
            for(let i=0; i<hand.length; i++) {
                for(let f=0; f<3; f++) if (this.canPlay(hand[i], f)) { valids.push({i,f}); break; }
            }
            if (valids.length > 0) {
                this.log(`[连斩] 追加行动`);
                const move = valids[Math.floor(Math.random() * valids.length)];
                this.state.isProcessing = false; await this.playCard(playerId, move.i, move.f); return;
            }
        }
        this.state.isProcessing = false;
        await this.checkTurnEnd();
    },

    executeDiscard: async function() {
        this.state.isProcessing = true;
        const indices = this.state.selectedCardIndices;
        this.log(indices.length >= 2 ? `战术更替：弃置 ${indices.length} 张并补牌` : "弃置手牌");
        
        if (indices.length >= 2) this.state.pendingDraw = 1;

        const sorted = [...indices].sort((a, b) => b - a);
        for (const idx of sorted) await this.animateElementExit(`card-${this.state.hands[0][idx].id}`);
        const discards = [];
        sorted.forEach(idx => {
            const c = this.state.hands[0][idx]; discards.push(c);
            this.sendToDiscard(c, 0); this.state.hands[0].splice(idx, 1);
        });
        this.state.selectedCardIndices = []; this.renderGame(); 
        let hasHammer = false;
        discards.forEach(card => {
             if (this.hasSkill(card, 'hammer')) hasHammer = true;
             if (this.hasSkill(card, 'boom')) this.state.effectQueue.push({ type: 'boom', card: card, source: 0 });
             if (this.hasSkill(card, 'bounce')) this.state.effectQueue.push({ type: 'bounce', card: card, source: 0 });
        });
        if (hasHammer) {
            this.log("[整备] 重洗手牌");
            const count = this.state.hands[0].length;
            const oldHand = this.state.hands[0].splice(0, count);
            oldHand.forEach(c => this.state.decks[0].push(c));
            this.state.decks[0].sort(() => Math.random() - 0.5);
            this.drawCards(0, count);
        }
        await this.processNextEffect();
    },

    processNextEffect: async function() {
        if (this.state.effectQueue.length > 0) {
            const effect = this.state.effectQueue.shift();
            this.state.awaitingTarget = { type: effect.type, sourcePlayer: effect.source, cardData: effect.card };
            this.log(`请指定 [${effect.type === 'boom' ? '爆裂' : '击退'}] 目标...`, "text-amber-500 animate-pulse");
            this.renderGame();
        } else {
            if (this.state.pendingDraw > 0) { 
                this.log("补充一张新的资源卡");
                this.drawCards(0, 1); 
                this.state.pendingDraw = 0; 
            }
            this.state.isProcessing = false; 
            this.renderGame(); 
            await this.checkTurnEnd(); 
        }
    },

    resolveDiscardEffect: async function(targetIdx) {
        if (!this.state.awaitingTarget) return;
        const { type, sourcePlayer } = this.state.awaitingTarget;
        const stack = this.state.fields[targetIdx];
        this.state.awaitingTarget = null;
        if (stack.some(c => this.hasSkill(c, 'guard')) && type === 'boom') this.log(`[爆裂] 被 [格挡] 抵消`);
        else {
            if (type === 'boom' && stack.length > 0) {
                this.log(`${sourcePlayer===0?'我方':'对方'} [爆裂] 净空区域`, "text-red-500");
                const el = document.getElementById(`stack-container-${targetIdx}`);
                if (el) Array.from(el.children).forEach(c => c.classList.add('animate-boom'));
                await new Promise(r => setTimeout(r, 500));
                stack.forEach(c => this.sendToDiscard(c, c.owner)); this.state.fields[targetIdx] = [];
            } else if (type === 'bounce' && stack.length > 0) {
                this.log(`${sourcePlayer===0?'我方':'对方'} [击退] 顶牌撤回`);
                const top = stack.pop();
                const topEl = document.getElementById(`small-card-${top.id}`);
                if (topEl) { topEl.classList.add('animate-bounce-up'); await new Promise(r => setTimeout(r, 450)); }
                this.state.decks[top.owner].push(top); this.state.decks[top.owner].sort(() => Math.random() - 0.5);
            }
        }
        this.renderGame(); await this.processNextEffect();
    },

    evaluateAiMove: function(card, fieldIdx) {
        if (!this.canPlay(card, fieldIdx)) return -Infinity;
        
        const stack = this.state.fields[fieldIdx];
        const top = stack.length > 0 ? stack[stack.length - 1] : null;
        const score = this.calculateStackScore(fieldIdx);
        const myVal = this.getCardValue(card);
        const isReversed = this.isGlobalReverse();
        const hand = this.state.hands[1];
        
        let weight = 0;
        
        // 核心逻辑重构：可持续发展
        if (!top) {
            // 在空地上，点数越小的牌权重越高（保留上升空间）
            // 基础权重 = (8 - 点数) * 2。 出 1 得到 14 分，出 7 得到 2 分。
            weight = (9 - myVal) * 2;
        } else {
            const topVal = this.getCardValue(top);
            const gap = isReversed ? (topVal - myVal) : (myVal - topVal);
            
            // 阶梯衔接惩罚：跨度越大惩罚越高
            // 跨度为 1 (例如 2 上放 3)：+10 分
            // 跨度为 6 (例如 1 上放 7)：-20 分
            weight = (8 - gap) * 3;
            
            // 协同检测：如果这张牌出掉后，会导致手里的某张牌在这一列变得不可用，扣分
            hand.forEach(h => {
                if (h.id === card.id) return;
                const hVal = this.getCardValue(h);
                // 模拟出牌后的情况：假设这张牌已经在顶端
                const canStillPlayH = isReversed ? hVal < myVal : hVal > myVal;
                // 特殊技能除外
                if (!canStillPlayH && !this.hasSkill(h, 'domineer') && !this.hasSkill(h, 'replace')) {
                    weight -= 5;
                }
            });
        }
        
        // 战术权重修正
        if (this.hasSkill(card, 'replace') && top && top.owner === 0) {
            // 刺杀高点数敌方牌：目标越大越值得
            weight += this.getCardValue(top) * 4;
        }
        if (this.hasSkill(card, 'lock')) weight += 15; // 威慑极大干扰对手
        if (this.hasSkill(card, 'double')) weight += (score.ai + 1) * 3; // 优势扩张
        if (this.hasSkill(card, 'dye')) weight += 10; // 领域重塑环境
        
        // 劣势追赶修正
        if (score.player > score.ai) weight += 10;

        return weight;
    },

    aiTurn: async function() {
        const hand = this.state.hands[1];
        if (hand.length === 0) { await this.checkTurnEnd(); return; }
        
        let best = null;
        let highestWeight = -Infinity;
        
        await new Promise(r => setTimeout(r, 700));

        // 尝试所有手牌和所有位置
        for (let i = 0; i < hand.length; i++) {
            for (let f = 0; f < 3; f++) {
                const weight = this.evaluateAiMove(hand[i], f);
                if (weight > highestWeight) {
                    highestWeight = weight;
                    best = { i, f };
                }
            }
        }
        
        if (best && highestWeight > -Infinity) {
            const selectedCard = hand[best.i];
            if (this.hasSkill(selectedCard, 'train')) {
                // AI 特训策略：智能选择
                const val = (selectedCard.number <= 4) ? 1 : -1;
                this.applyTraining(1, best.i, val);
            }
            await this.playCard(1, best.i, best.f);
        } else {
            // 无法出牌，弃置一张最没用的牌（通常是点数最高且无重要技能的，以便腾出空间）
            let worstIdx = 0;
            let lowestValueInHand = Infinity;
            for(let i=0; i<hand.length; i++) {
                let val = this.getCardValue(hand[i]);
                // 保留带技能的牌
                if (hand[i].skills.length > 0) val -= 5;
                // 此时反而倾向于扔掉大牌，因为大牌难以打出且占用位置
                if (val < lowestValueInHand) { lowestValueInHand = val; worstIdx = i; }
            }
            
            const cardToDiscard = hand[worstIdx];
            this.log("对方 正在整顿资源...");
            await this.animateElementExit(`ai-card-${cardToDiscard.id}`, true);
            
            this.sendToDiscard(hand.splice(worstIdx, 1)[0], 1); 
            
            if (this.hasSkill(cardToDiscard, 'boom') || this.hasSkill(cardToDiscard, 'bounce')) {
                let targetF = 0;
                let maxPScore = -1;
                for(let f=0; f<3; f++) {
                    const s = this.calculateStackScore(f);
                    if (s.player > maxPScore) { maxPScore = s.player; targetF = f; }
                }
                this.state.effectQueue.push({ 
                    type: this.hasSkill(cardToDiscard, 'boom') ? 'boom' : 'bounce', 
                    card: cardToDiscard, 
                    source: 1 
                });
                const effect = this.state.effectQueue.shift();
                this.state.awaitingTarget = { type: effect.type, sourcePlayer: 1, cardData: effect.card };
                await this.resolveDiscardEffect(targetF);
            } else {
                this.renderGame();
                await new Promise(r => setTimeout(r, 400));
                await this.checkTurnEnd();
            }
        }
    },

    checkTurnEnd: async function() {
        if (this.state.effectQueue.length > 0 || this.state.awaitingTarget || this.state.isProcessing) return;

        if (this.state.hands[0].length === 0 && this.state.hands[1].length === 0) { 
            await this.resolveRound(); 
            return; 
        }
        
        const next = 1 - this.state.turn;
        if (this.state.hands[next].length > 0) {
            this.state.turn = next; 
            this.state.isProcessing = false; 
            this.renderGame();
            if (this.state.turn === 1) this.aiTurn();
        } else {
            this.log(`${next===0?'我方':'对方'} 已无手牌，轮转。`);
            this.state.turn = 1 - next;
            this.state.isProcessing = false; 
            this.renderGame();
            if (this.state.turn === 1) setTimeout(() => this.aiTurn(), 500);
        }
    },

    resolveRound: async function() {
        this.state.isProcessing = true; this.state.mode = 'scoring';
        this.state.scoringState = { totalP: 0, totalA: 0, activeField: -1, finished: false };
        this.renderGame();
        for(let i=0; i<3; i++) {
            this.state.scoringState.activeField = i; this.renderGame();
            const stack = this.state.fields[i]; await new Promise(r => setTimeout(r, 200));
            for(const c of stack) {
                const el = document.getElementById(`small-card-${c.id}`);
                if(el) el.classList.add('ring-4', 'ring-white', 'scale-110');
                await new Promise(r => setTimeout(r, 150));
                let val = 1;
                if (this.hasSkill(c, 'add1')) val += 1;
                if (this.hasSkill(c, 'add2')) val += 2;
                if (this.hasSkill(c, 'add3')) val += 3;
                if (this.showFloatingScore && el) this.showFloatingScore(el, `+${val}`, c.owner === 0 ? '#22c55e' : '#f43f5e');
                if (c.owner === 0) this.state.scoringState.totalP += val; else this.state.scoringState.totalA += val;
                this.renderGame(); if(el) el.classList.remove('ring-4', 'ring-white', 'scale-110');
            }
            const top = stack[stack.length-1];
            if(top && this.hasSkill(top, 'double')) {
                 let sP = 0, sA = 0;
                 stack.forEach(c => {
                    let v = 1; if (this.hasSkill(c, 'add1')) v += 1; if (this.hasSkill(c, 'add2')) v += 2; if (this.hasSkill(c, 'add3')) v += 3;
                    if(c.owner === 0) sP += v; else sA += v;
                 });
                 if(top.owner === 0) this.state.scoringState.totalP += sP; else this.state.scoringState.totalA += sA;
            }
        }
        this.state.scoringState.activeField = -1; this.state.scoringState.finished = true; this.renderGame();
    },
    
    confirmRoundEnd: function() {
        const { totalP, totalA } = this.state.scoringState;
        if (totalP > totalA) this.state.ippon[0]++; else if (totalA > totalP) this.state.ippon[1]++;
        if (this.state.ippon[0] >= this.CONST.WIN_IPPON) { this.log("胜利！"); this.handleBattleWin(); }
        else if (this.state.ippon[1] >= this.CONST.WIN_IPPON) this.handleBattleLoss();
        else {
             for(let p=0; p<2; p++) { this.state.hands[p].forEach(c => this.sendToDiscard(c, p)); this.state.hands[p] = []; }
             for(let f=0; f<3; f++) { this.state.fields[f].forEach(c => this.sendToDiscard(c, c.owner)); this.state.fields[f] = []; }
             this.drawCards(0, 6); this.drawCards(1, 6);
             this.state.turn = 0; this.state.isProcessing = false; this.state.mode = 'battle'; this.state.scoringState = null; this.state.hasPlayedInThisRound = false;
             this.renderGame();
        }
    },

    handleBattleWin: function() {
        // 重置战斗临时牌库，并即时同步以便奖励阶段查看
        this.state.decks[0] = [];
        this.state.hands[0] = [];
        this.state.discardPiles[0] = [];
        
        if (this.state.gameMode === 'classic') { this.state.mode = 'map'; this.renderGame(); return; }
        
        this.state.rewardGroups = [
            this.generateRewardGroup(3),
            this.generateRewardGroup(3),
            this.generateRewardGroup(3)
        ];
        
        this.state.gold += 60; 
        this.state.mode = 'reward'; 
        this.renderGame();
    },

    generateRewardGroup: function(count = 3) {
        const group = [];
        const skillKeys = Object.keys(this.CONST.SKILLS);
        for(let i=0; i<count; i++) {
            const c = Math.floor(Math.random() * 3);
            const n = Math.floor(Math.random() * 7) + 1;
            const skills = [];
            if (Math.random() > 0.4) skills.push(skillKeys[Math.floor(Math.random() * skillKeys.length)]);
            group.push(this.createCard(0, c, n, skills));
        }
        return group;
    },

    selectRewardGroup: function(idx) {
        const group = this.state.rewardGroups[idx];
        if (group) group.forEach(card => this.state.playerDeck.push(card));
        this.log(`获得资源。`);
        this.state.rewardGroups = [];
        this.state.mode = 'map';
        this.state.level++;
        this.renderGame();
    },

    skipReward: function() {
        this.log("跳过了奖励。");
        this.state.rewardGroups = [];
        this.state.mode = 'map';
        this.state.level++;
        this.renderGame();
    },

    handleBattleLoss: function() { alert("挑战失败。"); this.initGame(); },
    toggleLog: function() { this.state.showLog = !this.state.showLog; this.renderGame(); },
    previewCard: function(card) { 
        if (this.state.awaitingTarget || this.state.selectedCardIndices.length > 0) return;
        this.state.previewCard = card; 
        this.state.hintDismissed = true; 
        this.renderGame(); 
    },
    closePreview: function() { this.state.previewCard = null; this.renderGame(); },
    viewPile: function(type, owner = 0) { this.state.pileViewMode = { type: type, owner: owner }; this.renderGame(); },
    closeModal: function() { this.state.pileViewMode = null; this.state.discardConfirmOpen = false; this.state.trainingPending = null; this.state.previewCard = null; this.renderGame(); },
    log: function(msg, colorClass = "text-zinc-400") {
        this.state.log.push({ text: msg, color: colorClass });
        if (this.state.log.length > 50) this.state.log.shift();
        const topLog = document.getElementById('portrait-top-log');
        if(topLog) topLog.innerText = msg;
        
        // 自动滚动日志到最新
        setTimeout(() => {
            const logContainer = document.getElementById('game-log-content');
            if (logContainer) logContainer.scrollTop = logContainer.scrollHeight;
        }, 10);
    },
    mount: function() { if(window.lucide) window.lucide.createIcons(); },
    
    handleDiscardAction: function() {
        if (this.state.turn !== 0 || this.state.isProcessing) return;
        const indices = this.state.selectedCardIndices;
        if (indices.length === 0) return;
        const trainCards = indices.filter(idx => this.hasSkill(this.state.hands[0][idx], 'train'));
        if (trainCards.length > 0) { this.state.trainingPending = { type: 'discard', indices: indices }; this.renderGame(); return; }
        if (indices.length > 2) { this.state.discardConfirmOpen = true; this.renderGame(); return; }
        this.executeDiscard();
    },
    confirmDiscard: function() { this.state.discardConfirmOpen = false; this.executeDiscard(); },
    cancelDiscard: function() { this.state.discardConfirmOpen = false; this.renderGame(); },
    handleTrainChoice: function(val) {
        if (!this.state.trainingPending) return;
        const { type, indices, targetField } = this.state.trainingPending;
        indices.forEach(idx => this.applyTraining(0, idx, val));
        this.state.trainingPending = null;
        if (type === 'play') this.playCard(0, indices[0], targetField); else this.executeDiscard();
    },
    applyTraining: function(playerId, cardIdx, diff) {
        const hand = this.state.hands[playerId];
        const targets = [];
        if (cardIdx > 0) targets.push(hand[cardIdx - 1]);
        if (cardIdx < hand.length - 1) targets.push(hand[cardIdx + 1]);
        targets.forEach(c => {
            let newVal = c.number + diff;
            if (newVal < 0) newVal = 0; if (newVal > 8) newVal = 8;
            c.number = newVal;
        });
        this.log(`[特训] 结束。`);
    },
    selectCard: function(idx) {
        if (this.state.isProcessing) return;
        const pos = this.state.selectedCardIndices.indexOf(idx);
        if (pos >= 0) this.state.selectedCardIndices.splice(pos, 1); else this.state.selectedCardIndices.push(idx);
        this.renderGame();
    },
    // Debug method to show enemy hand in console
    showEnemyHand: function() {
        const hand = this.state.hands[1];
        if (!hand || hand.length === 0) {
            console.log("敌人当前没有手牌。");
            return;
        }
        const readableHand = hand.map(c => ({
            id: c.id,
            color: this.CONST.COLOR_NAMES[c.color],
            number: c.number,
            actualValue: this.getCardValue(c),
            skills: c.skills.map(s => this.CONST.SKILLS[s].name).join(', ')
        }));
        console.log("%c--- 敌人当前手牌 ---", "color: #f43f5e; font-weight: bold; font-size: 14px;");
        console.table(readableHand);
        console.log("提示: 调用 evaluateAiMove(card, fieldIdx) 可以手动模拟 AI 的评分逻辑。");
    }
});
