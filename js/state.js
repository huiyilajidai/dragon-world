// 龙族世界模拟器 - 状态管理
const GameState = {
  // 默认初始状态
  getDefaultState() {
    return {
      version: '1.0.0',
      world: {
        currentTime: '2010/09/01 上午',
        currentLocation: '未知',
        canonMode: 'CANON-R',
        butterflyLevel: 'B0',
        exposureLevel: 'EX0',
        gameStarted: false,
      },
      player: {
        name: '',
        age: 18,
        gender: 'male',
        identity: 'original',
        identityDescription: '',
        background: '',
        personality: '',
        bloodline: {
          tier: 'C',
          stability: 80,
          potential: 60,
        },
        yanling: '',
        organization: 'cassell_student',
        timeline: 'T1',
        health: 100,
        mental: 100,
        stamina: 100,
        money: 0,
        abilities: [],
        inventory: [],
      },
      narrative: [],
      decision: null,
      quests: [],
      clues: [],
      npcs: {},
      relations: [],
      factions: {},
      worldEvents: [],
      canonEvents: [],
      threads: [],
      secrets: [],
      settings: {
        apiKey: '',
        model: 'deepseek-chat',
        temperature: 0.7,
        maxTokens: 2048,
        proxy: '',
      },
      meta: {
        createdAt: null,
        lastSaved: null,
        playTime: 0,
        turnCount: 0,
      },
    };
  },

  state: null,

  init() {
    this.state = this.getDefaultState();
  },

  load(savedState) {
    if (savedState && typeof savedState === 'object') {
      this.state = Object.assign(this.getDefaultState(), savedState);
      // 确保嵌套对象也合并
      this.state.world = Object.assign(this.getDefaultState().world, savedState.world || {});
      this.state.player = Object.assign(this.getDefaultState().player, savedState.player || {});
      this.state.player.bloodline = Object.assign(this.getDefaultState().player.bloodline, savedState.player?.bloodline || {});
      this.state.settings = Object.assign(this.getDefaultState().settings, savedState.settings || {});
      this.state.meta = Object.assign(this.getDefaultState().meta, savedState.meta || {});
    }
  },

  // 叙述相关
  addNarrative(type, content, speaker = null) {
    const entry = {
      id: Date.now() + Math.random(),
      type,
      content,
      speaker,
      time: this.state.world.currentTime,
      timestamp: Date.now(),
    };
    this.state.narrative.push(entry);
    // 保留最近100条
    if (this.state.narrative.length > 100) {
      this.state.narrative = this.state.narrative.slice(-100);
    }
    return entry;
  },

  clearNarrative() {
    this.state.narrative = [];
  },

  getRecentNarrative(count = 10) {
    return this.state.narrative.slice(-count);
  },

  // 决策相关
  setDecision(decision) {
    this.state.decision = decision;
  },

  clearDecision() {
    this.state.decision = null;
  },

  // 时间推进
  advanceTime(minutes = 30) {
    // 简单时间推进，实际可更复杂
    const current = this.state.world.currentTime;
    // 解析当前时间并推进
    this.state.meta.turnCount++;
  },

  // 任务相关
  addQuest(quest) {
    const id = 'Q' + String(this.state.quests.length + 1).padStart(3, '0');
    this.state.quests.push({ id, status: 'active', ...quest });
  },

  updateQuest(id, updates) {
    const idx = this.state.quests.findIndex(q => q.id === id);
    if (idx !== -1) {
      this.state.quests[idx] = { ...this.state.quests[idx], ...updates };
    }
  },

  // 线索相关
  addClue(clue) {
    const id = 'CL' + String(this.state.clues.length + 1).padStart(3, '0');
    this.state.clues.push({ id, obtained: true, ...clue });
  },

  // 关系相关
  updateRelation(npcName, dimensions) {
    let rel = this.state.relations.find(r => r.name === npcName);
    if (!rel) {
      rel = { name: npcName, familiarity: 0, trust: 0, respect: 0, affinity: 0, suspicion: 0 };
      this.state.relations.push(rel);
    }
    Object.assign(rel, dimensions);
  },

  // 背包相关
  addItem(item) {
    this.state.player.inventory.push({ id: Date.now(), ...item });
  },

  removeItem(itemId) {
    this.state.player.inventory = this.state.player.inventory.filter(i => i.id !== itemId);
  },

  // 势力声望
  updateFaction(name, reputation) {
    if (!this.state.factions[name]) {
      this.state.factions[name] = { reputation: 0, suspicion: 0 };
    }
    Object.assign(this.state.factions[name], reputation);
  },

  // 世界事件
  addWorldEvent(event) {
    this.state.worldEvents.push({ id: Date.now(), time: this.state.world.currentTime, ...event });
  },

  // 伏笔
  addThread(thread) {
    const id = 'TH' + String(this.state.threads.length + 1).padStart(3, '0');
    this.state.threads.push({ id, status: 'active', ...thread });
  },

  // 更新玩家状态
  updatePlayer(updates) {
    Object.assign(this.state.player, updates);
  },

  // 更新世界状态
  updateWorld(updates) {
    Object.assign(this.state.world, updates);
  },

  // 获取序列化状态
  serialize() {
    return JSON.parse(JSON.stringify(this.state));
  },
};