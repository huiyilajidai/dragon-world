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
        supplementaryInfo: '',
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
        sanity: 100,
        lossOfControl: 0,
        money: 0,
        abilities: [],
        abilitiesData: [],
        inventory: {
          items: [],
          maxWeight: 22,
        },
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
      // v4.0.2 新增四大板块
      reputation: {
        secret_society: { name: '秘党', level: '中立', value: 0 },
        cassell: { name: '卡塞尔学院', level: '中立', value: 0 },
        execution: { name: '执行部', level: '中立', value: 0 },
        lion_heart: { name: '狮心会', level: '中立', value: 0 },
        student_council: { name: '学生会', level: '中立', value: 0 },
        school_board: { name: '校董会', level: '中立', value: 0 },
        snake_qiba: { name: '蛇岐八家', level: '中立', value: 0 },
        unknown_dark: { name: '未知暗势力', level: '未知', value: 0 },
      },
      worldNews: [],
      canonDeviation: [],
      foreshadowing: [],
      unreadFlags: {
        quest: false,
        clue: false,
        relation: false,
        inventory: false,
        ability: false,
        reputation: false,
        worldNews: false,
        canonDeviation: false,
        foreshadowing: false,
      },
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

      // 如果旧存档没有abilitiesData，自动初始化能力数据
      if (!this.state.player.abilitiesData || this.state.player.abilitiesData.length === 0) {
        this.initAbilities(this.state.player.bloodline?.tier || 'C');
      }

      // 如果旧存档没有新的背包系统，自动初始化背包
      if (!this.state.player.inventory.items || !Array.isArray(this.state.player.inventory.items)) {
        this.initInventory();
      }

      // 如果旧存档没有新的关系系统，自动初始化关系
      if (!this.state.relations || this.state.relations.length === 0 || !this.state.relations[0].affinityLevel) {
        this.initRelations();
      } else {
        // 兼容旧存档：确保stance字段是数组
        for (const rel of this.state.relations) {
          if (typeof rel.stance === 'string') {
            rel.stance = rel.stance.split(/[,，、]/).map(s => s.trim()).filter(s => s);
          } else if (!Array.isArray(rel.stance)) {
            rel.stance = ['陌生人'];
          }
        }
      }

      // 如果旧存档没有新的任务系统，自动初始化任务
      if (!this.state.quests || this.state.quests.length === 0 || !this.state.quests[0].type) {
        this.initQuests();
      }

      // 如果旧存档没有新的线索系统，自动初始化线索
      if (!this.state.clues || !Array.isArray(this.state.clues) || (this.state.clues.length > 0 && !this.state.clues[0].type)) {
        this.initClues();
      }

      // v4.0.2 兼容旧存档：初始化新板块
      if (!this.state.reputation || typeof this.state.reputation !== 'object' || !this.state.reputation.cassell) {
        this.state.reputation = {
          secret_society: { name: '秘党', level: '中立', value: 0 },
          cassell: { name: '卡塞尔学院', level: '中立', value: 0 },
          execution: { name: '执行部', level: '中立', value: 0 },
          lion_heart: { name: '狮心会', level: '中立', value: 0 },
          student_council: { name: '学生会', level: '中立', value: 0 },
          school_board: { name: '校董会', level: '中立', value: 0 },
          snake_qiba: { name: '蛇岐八家', level: '中立', value: 0 },
          unknown_dark: { name: '未知暗势力', level: '未知', value: 0 },
        };
      }
      if (!this.state.worldNews || !Array.isArray(this.state.worldNews)) {
        this.state.worldNews = [];
      }
      if (!this.state.canonDeviation || !Array.isArray(this.state.canonDeviation)) {
        this.state.canonDeviation = [];
      }
      if (!this.state.foreshadowing || !Array.isArray(this.state.foreshadowing)) {
        this.state.foreshadowing = [];
      }

      // 确保unreadFlags包含新板块
      if (!this.state.unreadFlags) this.state.unreadFlags = {};
      const defaultFlags = { quest: false, clue: false, relation: false, inventory: false, ability: false, reputation: false, worldNews: false, canonDeviation: false, foreshadowing: false };
      this.state.unreadFlags = { ...defaultFlags, ...this.state.unreadFlags };
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
    // 实际推进时间
    this.state.meta.turnCount++;

    const current = this.state.world.currentTime;
    // 解析当前时间格式：YYYY/MM/DD 时段
    const match = current.match(/(\d{4})\/(\d{2})\/(\d{2})\s*(上午|下午|晚上|凌晨|中午)?/);
    if (!match) {
      // 如果格式不匹配，简单增加回合数不改变时间
      return;
    }

    let [, year, month, day, period] = match;
    year = parseInt(year);
    month = parseInt(month);
    day = parseInt(day);

    // 将时段转换为小时
    let hour = 12;
    if (period === '凌晨') hour = 3;
    else if (period === '上午') hour = 10;
    else if (period === '中午') hour = 12;
    else if (period === '下午') hour = 15;
    else if (period === '晚上') hour = 20;

    // 计算总分钟数
    let totalMinutes = hour * 60 + minutes;

    // 处理跨天
    while (totalMinutes >= 24 * 60) {
      totalMinutes -= 24 * 60;
      day++;
      // 处理跨月（简单处理，假设每月30天）
      if (day > 30) {
        day = 1;
        month++;
        if (month > 12) {
          month = 1;
          year++;
        }
      }
    }

    // 转换回小时和分钟
    const newHour = Math.floor(totalMinutes / 60);
    const newMinute = totalMinutes % 60;

    // 确定时段
    let newPeriod = '上午';
    if (newHour >= 0 && newHour < 6) newPeriod = '凌晨';
    else if (newHour >= 6 && newHour < 11) newPeriod = '上午';
    else if (newHour >= 11 && newHour < 13) newPeriod = '中午';
    else if (newHour >= 13 && newHour < 18) newPeriod = '下午';
    else newPeriod = '晚上';

    // 格式化时间
    const formattedMonth = String(month).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    this.state.world.currentTime = `${year}/${formattedMonth}/${formattedDay} ${newPeriod}`;
  },

  // 任务相关
  addQuest(quest) {
    const id = 'Q' + String(this.state.quests.length + 1).padStart(3, '0');
    this.state.quests.push({ id, status: 'active', ...quest });
    this.setUnread('quest', true);
  },

  updateQuest(id, updates) {
    const idx = this.state.quests.findIndex(q => q.id === id);
    if (idx !== -1) {
      this.state.quests[idx] = { ...this.state.quests[idx], ...updates };
      this.setUnread('quest', true);
    }
  },

  // 线索相关
  addClue(clue) {
    const id = 'CL' + String(this.state.clues.length + 1).padStart(3, '0');
    this.state.clues.push({ id, obtained: true, ...clue });
    this.setUnread('clue', true);
  },

  // 关系相关
  updateRelation(npcName, dimensions) {
    let rel = this.state.relations.find(r => r.name === npcName);
    if (!rel) {
      rel = { name: npcName, familiarity: 0, trust: 0, respect: 0, affinity: 0, suspicion: 0 };
      this.state.relations.push(rel);
    }
    Object.assign(rel, dimensions);
    this.setUnread('relation', true);
  },

  // 背包相关
  addItem(item, carried = true) {
    const newItem = { id: 'ITEM' + Date.now() + Math.random(), ...item };
    if (carried) {
      this.state.player.inventory.carried.push(newItem);
    } else {
      this.state.player.inventory.uncurried.push(newItem);
    }
    this.setUnread('inventory', true);
    return newItem;
  },

  removeItem(itemId) {
    this.state.player.inventory.carried = this.state.player.inventory.carried.filter(i => i.id !== itemId);
    this.state.player.inventory.uncurried = this.state.player.inventory.uncurried.filter(i => i.id !== itemId);
  },

  toggleItemCarry(itemId) {
    const carriedIdx = this.state.player.inventory.carried.findIndex(i => i.id === itemId);
    if (carriedIdx !== -1) {
      const item = this.state.player.inventory.carried.splice(carriedIdx, 1)[0];
      this.state.player.inventory.uncurried.push(item);
    } else {
      const uncurriedIdx = this.state.player.inventory.uncurried.findIndex(i => i.id === itemId);
      if (uncurriedIdx !== -1) {
        const item = this.state.player.inventory.uncurried.splice(uncurriedIdx, 1)[0];
        this.state.player.inventory.carried.push(item);
      }
    }
  },

  // 能力相关
  addAbility(ability) {
    const id = 'AB' + String(this.state.player.abilities.length + 1).padStart(3, '0');
    const newAbility = { id, level: '初学', ...ability };
    this.state.player.abilities.push(newAbility);
    this.setUnread('ability', true);
    return newAbility;
  },

  updateAbility(id, updates) {
    const idx = this.state.player.abilities.findIndex(a => a.id === id);
    if (idx !== -1) {
      this.state.player.abilities[idx] = { ...this.state.player.abilities[idx], ...updates };
    }
  },

  // 红点标记
  setUnread(type, value) {
    if (this.state.unreadFlags && type in this.state.unreadFlags) {
      this.state.unreadFlags[type] = value;
    }
  },

  clearUnread(type) {
    if (this.state.unreadFlags && type in this.state.unreadFlags) {
      this.state.unreadFlags[type] = false;
    }
  },

  hasUnread(type) {
    return this.state.unreadFlags ? !!this.state.unreadFlags[type] : false;
  },

  // 补充角色设定
  setSupplementaryInfo(info) {
    this.state.player.supplementaryInfo = info;
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

  // 初始化能力系统
  initAbilities(bloodlineTier = 'C') {
    const tierLevel = { 'E': 10, 'D': 25, 'C': 40, 'B': 55, 'A': 70, 'S': 85 };
    const baseLevel = tierLevel[bloodlineTier] || 40;

    this.state.player.abilitiesData = [
      // ========== 一、混血种先天自带 ==========
      {
        id: 'innate', category: '先天能力', subcategory: '混血种自带',
        abilities: [
          { id: 'body_strength', name: '肉身强化', description: '力量、爆发力、反应速度、感官、抗打击、愈合能力远超常人', level: baseLevel, progress: baseLevel, unlocked: true, innate: true },
          { id: 'golden_eyes', name: '黄金瞳', description: '情绪激动、战斗时自动亮起金色竖瞳，可感知龙类/死侍气息', level: baseLevel, progress: baseLevel, unlocked: true, innate: true },
          { id: 'yanling', name: '言灵', description: '念诵龙语释放领域能力，序列号越高威力越大，负担越重', level: baseLevel * 0.6, progress: baseLevel * 0.6, unlocked: true, innate: true },
          { id: 'violent_blood', name: '暴血（禁忌秘术）', description: '人为短时间拉高血统，成倍放大威力；代价不可逆龙化，最高四度暴血', level: 0, progress: 0, unlocked: false, innate: true, dangerous: true },
          { id: 'blood_sorrow', name: '血之哀', description: '混血种与生俱来的孤独感，很难融入普通人类（精神层面，非战斗能力）', level: 100, progress: 100, unlocked: true, innate: true, passive: true },
        ]
      },
      // ========== 二、后天可学 - 战斗类 ==========
      {
        id: 'combat', category: '后天能力', subcategory: '🔫 战斗类',
        abilities: [
          { id: 'firearms', name: '枪械专精', description: '狙击、手枪速射、霰弹枪；熟悉弗里嘉麻醉弹、贤者之石子弹', level: 20, progress: 20, unlocked: true, innate: false },
          { id: 'cold_weapons', name: '冷兵器格斗', description: '日本刀、双手太刀、短刀、军刺；巴西柔术、军用格斗术、太极拳', level: 20, progress: 20, unlocked: true, innate: false },
          { id: 'blade_tactics', name: '刀具战术', description: '反握刀、投掷刀具，配合炼金武器作战', level: 10, progress: 10, unlocked: false, innate: false },
        ]
      },
      // ========== 炼金&工程 ==========
      {
        id: 'alchemy', category: '后天能力', subcategory: '🛠️ 炼金&工程（屠龙核心技术）',
        abilities: [
          { id: 'alchemy_chem', name: '炼金化学', description: '炼制炼金武器、炼金药剂；制造贤者之石、炼金炸弹、腐蚀药剂', level: 10, progress: 10, unlocked: false, innate: false },
          { id: 'mech_design', name: '魔动机械设计', description: '改装车辆、炼金机械、改造武器，制造防御装置', level: 10, progress: 10, unlocked: false, innate: false },
          { id: 'dragon_language', name: '龙语破译', description: '学习古诺尔斯龙语，破译铭文、尼伯龙根遗迹碑文（学会读≠释放言灵）', level: 10, progress: 10, unlocked: false, innate: false },
        ]
      },
      // ========== 情报与黑客 ==========
      {
        id: 'intel', category: '后天能力', subcategory: '💻 情报与黑客',
        abilities: [
          { id: 'hacking', name: '高阶黑客技术', description: '入侵监控、数据库、破解加密，接管城市电子设备（芬格尔代表）', level: 10, progress: 10, unlocked: false, innate: false },
          { id: 'trace_investigation', name: '痕迹侦查', description: '现场勘察，分辨死侍、龙类遗留痕迹，追踪血统气息残留', level: 15, progress: 15, unlocked: true, innate: false },
          { id: 'dragon_genealogy', name: '龙族谱系学', description: '分辨四大君王血脉，识别龙族物种，判断死侍变异等级', level: 10, progress: 10, unlocked: false, innate: false },
        ]
      },
      // ========== 驾驶与野外生存 ==========
      {
        id: 'driving', category: '后天能力', subcategory: '🚁 驾驶与野外生存',
        abilities: [
          { id: 'driving_skill', name: '驾驶专精', description: '战斗机、直升机、快艇、高性能跑车驾驶；水下潜水、深海作业', level: 15, progress: 15, unlocked: true, innate: false },
          { id: 'wild_survival', name: '野外生存', description: '野外生存、洞穴探险、尼伯龙根环境求生，解毒、急救战地医疗', level: 15, progress: 15, unlocked: true, innate: false },
        ]
      },
      // ========== 心智技能 ==========
      {
        id: 'mental', category: '后天能力', subcategory: '🧠 心智技能',
        abilities: [
          { id: 'mental_resistance', name: '高压心理抗压', description: '面对龙威不崩溃（普通人直面龙威会直接精神崩溃休克）', level: baseLevel * 0.5, progress: baseLevel * 0.5, unlocked: true, innate: false },
          { id: 'interrogation', name: '审讯与伪装', description: '审讯、伪装潜入，多国语言，伪造身份', level: 10, progress: 10, unlocked: false, innate: false },
        ]
      },
    ];
  },

  // 更新能力进度
  updateAbilityProgress(abilityId, progressDelta) {
    for (const category of this.state.player.abilitiesData) {
      const ability = category.abilities.find(a => a.id === abilityId);
      if (ability) {
        ability.progress = Math.max(0, Math.min(100, ability.progress + progressDelta));
        ability.level = Math.round(ability.progress);
        if (ability.progress > 0 && !ability.unlocked) {
          ability.unlocked = true;
        }
        this.setUnread('ability', true);
        return true;
      }
    }
    return false;
  },

  // ========== 背包系统 ==========
  // 初始化背包（刚入学卡塞尔，基础携带）
  initInventory() {
    this.state.player.inventory.items = [
      // 任务道具（不可丢弃）
      { id: 'student_id', name: '卡塞尔学院学生证', description: '黑色磁卡，印有世界树纹章，姓名、血统等级、学院编号；可进出校园、图书馆、执行部基础区域，损坏需要去行政部补办', category: 'quest', quantity: 1, weight: 0.05, canDiscard: false, canUse: false },
      { id: 'admission_letter', name: '学院录取通知书', description: '纸质密封文件，卡塞尔学院正式录取通知', category: 'quest', quantity: 1, weight: 0.1, canDiscard: false, canUse: false },
      { id: 'cc1000_ticket', name: 'CC1000次列车通行磁卡', description: '通往卡塞尔学院的专用列车通行卡', category: 'quest', quantity: 1, weight: 0.05, canDiscard: false, canUse: false },
      // 装备
      { id: 'tactical_backpack', name: '卡塞尔学院制式战术背包', description: '学院配发的制式战术背包，本体（当前正在使用）', category: 'equipment', quantity: 1, weight: 1.5, canDiscard: false, canUse: false },
      { id: 'military_flashlight', name: '多功能军用手电', description: '带红外模式的强光手电，可用于照明和信号', category: 'equipment', quantity: 1, weight: 0.3, canDiscard: true, canUse: true, reusable: true },
      // 消耗品
      { id: 'bandage', name: '应急止血绷带', description: '军用止血绷带，可快速处理外伤', category: 'consumable', quantity: 3, weight: 0.1, canDiscard: true, canUse: true, effects: { health: 15 } },
      { id: 'nutrition_bar', name: '高能营养棒', description: '高热量压缩食品，快速恢复体力', category: 'consumable', quantity: 2, weight: 0.1, canDiscard: true, canUse: true, effects: { stamina: 20 } },
      { id: 'water_purification', name: '小型净水片', description: '可净化约500ml普通水源，野外生存必备', category: 'consumable', quantity: 5, weight: 0.02, canDiscard: true, canUse: true, effects: { stamina: 5 } },
      // 杂物
      { id: 'personal_id', name: '个人身份证件、银行卡', description: '普通人类社会的身份证件和银行卡', category: 'misc', quantity: 1, weight: 0.05, canDiscard: true, canUse: false },
      { id: 'notebook', name: '便携笔记本+龙语破译铅笔', description: '用于记录线索和破译龙语的笔记本和特殊铅笔', category: 'misc', quantity: 1, weight: 0.3, canDiscard: true, canUse: true, reusable: true },
      { id: 'lighter', name: '简易打火机', description: '普通打火机，可用于点火和照明', category: 'misc', quantity: 1, weight: 0.05, canDiscard: true, canUse: true, reusable: true },
    ];
  },

  // 获取背包当前负重
  getInventoryWeight() {
    const items = this.state.player.inventory.items;
    return items.reduce((total, item) => total + (item.weight * item.quantity), 0);
  },

  // 获取最大负重
  getMaxWeight() {
    return this.state.player.inventory.maxWeight || 22;
  },

  // 按分类获取物品
  getItemsByCategory(category) {
    return this.state.player.inventory.items.filter(item => item.category === category);
  },

  // 添加物品到背包
  addItem(itemData) {
    const items = this.state.player.inventory.items;
    const currentWeight = this.getInventoryWeight();
    const itemWeight = (itemData.weight || 0.1) * (itemData.quantity || 1);

    // 检查负重
    if (currentWeight + itemWeight > this.getMaxWeight()) {
      return { success: false, reason: 'weight_full', message: '背包负重已满，无法获取' + itemData.name };
    }

    // 检查是否已有相同物品（可堆叠）
    const existing = items.find(item => item.id === itemData.id);
    if (existing) {
      existing.quantity += (itemData.quantity || 1);
    } else {
      items.push({
        id: itemData.id || 'item_' + Date.now(),
        name: itemData.name || '未知物品',
        description: itemData.description || '',
        category: itemData.category || 'misc',
        quantity: itemData.quantity || 1,
        weight: itemData.weight || 0.1,
        canDiscard: itemData.canDiscard !== false,
        canUse: itemData.canUse || false,
        reusable: itemData.reusable || false,
        effects: itemData.effects || null,
      });
    }

    this.setUnread('inventory', true);
    return { success: true, item: itemData };
  },

  // 移除物品
  removeItem(itemId, quantity = 1) {
    const items = this.state.player.inventory.items;
    const index = items.findIndex(item => item.id === itemId);
    if (index === -1) return { success: false, reason: 'not_found' };

    const item = items[index];
    if (!item.canDiscard) return { success: false, reason: 'cannot_discard', message: item.name + '是任务道具，不可丢弃' };

    if (item.quantity > quantity) {
      item.quantity -= quantity;
    } else {
      items.splice(index, 1);
    }

    this.setUnread('inventory', true);
    return { success: true, item: item };
  },

  // 使用物品
  useItem(itemId) {
    const items = this.state.player.inventory.items;
    const item = items.find(i => i.id === itemId);
    if (!item) return { success: false, reason: 'not_found' };
    if (!item.canUse) return { success: false, reason: 'cannot_use', message: item.name + '无法使用' };

    // 应用效果
    if (item.effects) {
      const p = this.state.player;
      if (item.effects.health) p.health = Math.min(100, p.health + item.effects.health);
      if (item.effects.stamina) p.stamina = Math.min(100, p.stamina + item.effects.stamina);
      if (item.effects.mental) p.mental = Math.min(100, p.mental + item.effects.mental);
      if (item.effects.sanity) p.sanity = Math.min(100, p.sanity + item.effects.sanity);
    }

    // 消耗数量（可重复使用物品不消耗）
    if (!item.reusable) {
      if (item.quantity > 1) {
        item.quantity -= 1;
      } else {
        const index = items.findIndex(i => i.id === itemId);
        items.splice(index, 1);
      }
    }

    this.setUnread('inventory', true);
    return { success: true, item: item, effects: item.effects, reusable: item.reusable || false };
  },

  // ========== 关系系统 ==========
  // 好感等级定义
  AFFINITY_LEVELS: ['敌视', '冷淡', '普通', '熟悉', '友好', '信任', '挚友'],

  // 初始化关系（卡塞尔入学初期）
  initRelations() {
    this.state.relations = [
      {
        id: 'lu_mingfei', name: '路明非',
        affinity: '熟悉', affinityLevel: 3,
        stance: ['同学'],
        note: '同年级新生，偶尔会互相吐槽，对方藏着不为人知的秘密，目前还没有深度交心。',
        hiddenBond: false, isDead: false, lastUpdated: null
      },
      {
        id: 'caesar', name: '恺撒·加图索',
        affinity: '冷淡', affinityLevel: 1,
        stance: ['同学'],
        note: '学生会主席，行事张扬骄傲，理念存在分歧，尚未爆发激烈冲突。',
        hiddenBond: false, isDead: false, lastUpdated: null
      },
      {
        id: 'chu_zihang', name: '楚子航',
        affinity: '普通', affinityLevel: 2,
        stance: ['同学'],
        note: '狮心会会长，沉默寡言，很少流露情绪。',
        hiddenBond: false, isDead: false, lastUpdated: null
      },
      {
        id: 'finger', name: '芬格尔',
        affinity: '普通', affinityLevel: 2,
        stance: ['学长'],
        note: '留级学长，看起来吊儿郎当，掌握高超黑客技术。',
        hiddenBond: false, isDead: false, lastUpdated: null
      },
      {
        id: 'guderian', name: '古德里安教授',
        affinity: '友好', affinityLevel: 4,
        stance: ['导师'],
        note: '你的授课导师，对待混血种学生十分包容。',
        hiddenBond: false, isDead: false, lastUpdated: null
      },
      {
        id: 'manstein', name: '曼施坦因教授',
        affinity: '普通', affinityLevel: 2,
        stance: ['教师'],
        note: '纪律严格，看重学院规则。',
        hiddenBond: false, isDead: false, lastUpdated: null
      },
    ];
  },

  // 获取某个NPC的关系
  getRelation(npcId) {
    return this.state.relations.find(r => r.id === npcId);
  },

  // 更新关系
  updateRelation(npcId, updates) {
    let relation = this.getRelation(npcId);

    // 如果不存在，创建新关系
    if (!relation) {
      relation = {
        id: npcId,
        name: updates.name || npcId,
        affinity: '普通', affinityLevel: 2,
        stance: ['陌生人'],
        note: '',
        hiddenBond: false, isDead: false, lastUpdated: null
      };
      this.state.relations.push(relation);
    }

    // 如果已死亡，不允许更新
    if (relation.isDead) {
      return { success: false, reason: 'dead', message: relation.name + '已死亡，关系锁定' };
    }

    // 更新好感等级
    if (updates.affinity) {
      const levelIndex = this.AFFINITY_LEVELS.indexOf(updates.affinity);
      if (levelIndex !== -1) {
        relation.affinity = updates.affinity;
        relation.affinityLevel = levelIndex;
      }
    }

    // 更新好感数值（上升/下降）
    if (updates.affinityDelta !== undefined) {
      const newLevel = Math.max(0, Math.min(6, relation.affinityLevel + updates.affinityDelta));
      relation.affinityLevel = newLevel;
      relation.affinity = this.AFFINITY_LEVELS[newLevel];
    }

    // 更新立场标签
    if (updates.stance) {
      if (Array.isArray(updates.stance)) {
        relation.stance = updates.stance;
      } else if (typeof updates.stance === 'string') {
        // 字符串格式转换为数组
        if (updates.stanceAction === 'add') {
          if (!relation.stance.includes(updates.stance)) {
            relation.stance.push(updates.stance);
          }
        } else if (updates.stanceAction === 'remove') {
          relation.stance = relation.stance.filter(s => s !== updates.stance);
        } else {
          // 直接替换，按逗号分隔
          relation.stance = updates.stance.split(/[,，、]/).map(s => s.trim()).filter(s => s);
        }
      }
    }

    // 更新备注
    if (updates.note !== undefined) {
      relation.note = updates.note;
    }

    // 解锁隐藏羁绊
    if (updates.hiddenBond !== undefined) {
      relation.hiddenBond = updates.hiddenBond;
    }

    relation.lastUpdated = new Date().toISOString();
    this.setUnread('relation', true);

    return { success: true, relation: relation };
  },

  // 锁定关系（人物死亡）
  lockRelation(npcId, deathNote) {
    const relation = this.getRelation(npcId);
    if (!relation) return { success: false, reason: 'not_found' };

    relation.isDead = true;
    relation.note = (relation.note ? relation.note + '\n' : '') + '【已陨落】' + (deathNote || '该人物已经死亡，过往经历永久记录。');
    this.setUnread('relation', true);

    return { success: true, relation: relation };
  },

  // 添加新NPC关系
  addRelation(relationData) {
    const existing = this.getRelation(relationData.id);
    if (existing) return { success: false, reason: 'exists' };

    const newRelation = {
      id: relationData.id,
      name: relationData.name,
      affinity: relationData.affinity || '普通',
      affinityLevel: relationData.affinityLevel !== undefined ? relationData.affinityLevel : 2,
      stance: relationData.stance || ['陌生人'],
      note: relationData.note || '',
      hiddenBond: relationData.hiddenBond || false,
      isDead: false,
      lastUpdated: new Date().toISOString()
    };

    this.state.relations.push(newRelation);
    this.setUnread('relation', true);
    return { success: true, relation: newRelation };
  },

  // ========== 任务系统 ==========
  // 任务类型定义
  QUEST_TYPES: {
    daily: { name: '日常任务', icon: '📅', color: '#5E8FAE' },
    commission: { name: '学院委托', icon: '📋', color: '#A87E2E' },
    main: { name: '主线屠龙', icon: '⚔️', color: '#C05F55' },
    hidden: { name: '隐藏任务', icon: '✨', color: '#8F74B8' },
  },

  // 初始化任务（入学初期）
  initQuests() {
    const now = new Date();
    const today15 = new Date(now);
    today15.setHours(15, 0, 0, 0);
    const tomorrowEvening = new Date(now);
    tomorrowEvening.setDate(tomorrowEvening.getDate() + 1);
    tomorrowEvening.setHours(18, 0, 0, 0);

    this.state.quests = [
      // 日常任务
      {
        id: 'daily_class_attendance',
        name: '理论课出勤',
        type: 'daily',
        status: '进行中',
        description: '下午三点前往教学楼参与龙族谱系学课程，不得无故旷课。',
        deadline: today15.toISOString(),
        reward: { credit: 5 },
        penalty: { credit: -10, relation: { npcId: 'manstein', affinityDelta: -1 } },
        canAbandon: true,
        subGoals: [],
        note: '',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: 'daily_meet_lumingfei',
        name: '与路明非碰面',
        type: 'daily',
        status: '未接取',
        description: '明天找路明非碰面，和他聊聊关于CC1000次列车上的见闻。',
        deadline: tomorrowEvening.toISOString(),
        reward: { credit: 3, relation: { npcId: 'lu_mingfei', affinityDelta: 1 } },
        penalty: null,
        canAbandon: true,
        subGoals: [],
        note: '会获得的回报：解锁少量私人对话线索，与路明非好感小幅提升',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      // 学院委托
      {
        id: 'commission_dead侍_trace',
        name: '校园死侍痕迹排查',
        type: 'commission',
        status: '未接取',
        description: '配合外勤学员，排查校园地下通道异常血统波动。',
        deadline: null,
        reward: { executionPoints: 30, credit: 15 },
        penalty: null,
        canAbandon: true,
        subGoals: [],
        note: '失败惩罚：无，任务可重复接取',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      // 主线任务
      {
        id: 'main_bronze_city',
        name: '青铜城的回响',
        type: 'main',
        status: '未解锁',
        description: '跟随小队进入尼伯龙根，设法打开青铜门，探查青铜与火之王遗迹。',
        deadline: null,
        reward: { credit: 100, secretIntel: '秘党古老情报', randomAlchemyItem: true },
        penalty: { description: '剧情走向偏移，队友面临死亡风险' },
        canAbandon: false,
        subGoals: [
          { id: 'bronze_key_1', text: '寻找第一块青铜钥匙碎片', completed: false },
          { id: 'bronze_key_2', text: '寻找第二块青铜钥匙碎片', completed: false },
          { id: 'bronze_key_3', text: '寻找第三块青铜钥匙碎片', completed: false },
          { id: 'enter_bronze_city', text: '跟随小队潜入尼伯龙根·青铜城', completed: false },
          { id: 'open_bronze_door', text: '使用青铜钥匙，打开厚重青铜门', completed: false },
          { id: 'investigate_ruins', text: '探查遗迹内部龙类痕迹', completed: false },
        ],
        note: '提示：需要集齐青铜钥匙碎片才可推进。主线任务不可放弃。',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    ];
  },

  // 获取某个任务
  getQuest(questId) {
    return this.state.quests.find(q => q.id === questId);
  },

  // 更新任务状态
  updateQuest(questId, updates) {
    const quest = this.getQuest(questId);
    if (!quest) return { success: false, reason: 'not_found' };

    // 主线任务不可放弃
    if (updates.status === '已放弃' && !quest.canAbandon) {
      return { success: false, reason: 'cannot_abandon', message: quest.name + '是主线任务，不可放弃' };
    }

    Object.assign(quest, updates);
    quest.updatedAt = new Date().toISOString();
    this.setUnread('quest', true);

    return { success: true, quest: quest };
  },

  // 更新子目标
  updateSubGoal(questId, subGoalId, completed) {
    const quest = this.getQuest(questId);
    if (!quest || !quest.subGoals) return { success: false, reason: 'not_found' };

    const subGoal = quest.subGoals.find(s => s.id === subGoalId);
    if (!subGoal) return { success: false, reason: 'subgoal_not_found' };

    subGoal.completed = completed;
    quest.updatedAt = new Date().toISOString();
    this.setUnread('quest', true);

    // 检查所有子目标是否完成
    const allCompleted = quest.subGoals.every(s => s.completed);
    if (allCompleted && quest.status === '进行中') {
      quest.status = '可提交';
    }

    return { success: true, quest: quest, subGoal: subGoal };
  },

  // 添加新任务
  addQuest(questData) {
    const existing = this.getQuest(questData.id);
    if (existing) return { success: false, reason: 'exists' };

    const newQuest = {
      id: questData.id,
      name: questData.name,
      type: questData.type || 'daily',
      status: questData.status || '未接取',
      description: questData.description || '',
      deadline: questData.deadline || null,
      reward: questData.reward || null,
      penalty: questData.penalty || null,
      canAbandon: questData.canAbandon !== false,
      subGoals: questData.subGoals || [],
      note: questData.note || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.state.quests.push(newQuest);
    this.setUnread('quest', true);
    return { success: true, quest: newQuest };
  },

  // 检查超时任务
  checkExpiredQuests() {
    const now = new Date();
    const expired = [];
    for (const quest of this.state.quests) {
      if (quest.deadline && (quest.status === '进行中' || quest.status === '未接取')) {
        const deadline = new Date(quest.deadline);
        if (now > deadline) {
          quest.status = '失败';
          quest.updatedAt = now.toISOString();
          expired.push(quest);
          this.setUnread('quest', true);
        }
      }
    }
    return expired;
  },

  // 按类型获取任务
  getQuestsByType(type) {
    return this.state.quests.filter(q => q.type === type);
  },

  // ========== 线索系统 ==========
  // 线索类型定义
  CLUE_TYPES: {
    environment: { name: '环境线索', icon: '🌿', color: '#5FA98A' },
    character: { name: '人物线索', icon: '👤', color: '#5E8FAE' },
    relic: { name: '遗迹线索', icon: '🏛️', color: '#A87E2E' },
    fragment: { name: '残缺线索', icon: '🧩', color: '#8F74B8' },
  },

  // 线索等级定义
  CLUE_LEVELS: ['普通', '重要', '关键'],

  // 初始化线索（刚入学，无野外调查）
  initClues() {
    this.state.clues = [];
  },

  // 获取某个线索
  getClue(clueId) {
    return this.state.clues.find(c => c.id === clueId);
  },

  // 添加线索
  addClue(clueData) {
    const existing = this.getClue(clueData.id);
    if (existing) return { success: false, reason: 'exists', clue: existing };

    const newClue = {
      id: clueData.id,
      name: clueData.name,
      type: clueData.type || 'environment',
      level: clueData.level || '普通',
      status: clueData.status || '已记录',
      description: clueData.description || '',
      observedAt: new Date().toISOString(),
      canSubmit: clueData.canSubmit !== false,
      submitted: false,
      reward: clueData.reward || null,
      relatedClues: clueData.relatedClues || [],
      synthesized: false,
      note: clueData.note || '',
    };

    this.state.clues.push(newClue);
    this.setUnread('clue', true);
    return { success: true, clue: newClue };
  },

  // 更新线索
  updateClue(clueId, updates) {
    const clue = this.getClue(clueId);
    if (!clue) return { success: false, reason: 'not_found' };

    Object.assign(clue, updates);
    this.setUnread('clue', true);
    return { success: true, clue: clue };
  },

  // 标记线索失效（痕迹被破坏）
  invalidateClue(clueId, reason) {
    return this.updateClue(clueId, {
      status: '已失效',
      note: reason ? (clue.note ? clue.note + '\n' : '') + reason : '现场痕迹已销毁，仅留存观测记录'
    });
  },

  // 上交线索
  submitClue(clueId) {
    const clue = this.getClue(clueId);
    if (!clue) return { success: false, reason: 'not_found' };
    if (!clue.canSubmit) return { success: false, reason: 'cannot_submit', message: clue.name + '不可上交' };
    if (clue.submitted) return { success: false, reason: 'already_submitted' };

    clue.submitted = true;
    clue.status = '已上交';
    this.setUnread('clue', true);

    // 发放奖励
    if (clue.reward) {
      if (clue.reward.credit) this.state.player.money = (this.state.player.money || 0) + 0; // 学分单独处理
    }

    return { success: true, clue: clue, reward: clue.reward };
  },

  // 线索合成
  synthesizeClues(clueIds, resultClueData) {
    // 检查所有线索是否存在且未合成
    const clues = [];
    for (const id of clueIds) {
      const clue = this.getClue(id);
      if (!clue) return { success: false, reason: 'not_found', missingId: id };
      if (clue.synthesized) return { success: false, reason: 'already_synthesized', clueId: id };
      clues.push(clue);
    }

    // 标记原线索为已合成
    for (const clue of clues) {
      clue.synthesized = true;
    }

    // 创建合成后的完整线索
    const result = this.addClue({
      ...resultClueData,
      type: resultClueData.type || 'environment',
      level: resultClueData.level || '重要',
      note: '由线索合成：' + clues.map(c => c.name).join('、'),
    });

    this.setUnread('clue', true);
    return { success: true, result: result.clue, consumedClues: clues };
  },

  // 按类型获取线索
  getCluesByType(type) {
    return this.state.clues.filter(c => c.type === type);
  },

  // ========== v4.0.2 组织声望板块 ==========
  REPUTATION_LEVELS: [
    { level: '敌视', min: -100, max: -60 },
    { level: '冷淡', min: -59, max: -20 },
    { level: '中立', min: -19, max: 19 },
    { level: '友善', min: 20, max: 49 },
    { level: '敬重', min: 50, max: 74 },
    { level: '信赖', min: 75, max: 89 },
    { level: '核心亲信', min: 90, max: 100 },
  ],

  getReputationLevel(value) {
    for (const lvl of this.REPUTATION_LEVELS) {
      if (value >= lvl.min && value <= lvl.max) return lvl.level;
    }
    return value > 100 ? '核心亲信' : '敌视';
  },

  updateReputation(factionId, delta, reason = '') {
    const faction = this.state.reputation[factionId];
    if (!faction) return { success: false, error: '未知组织' };

    const oldValue = faction.value;
    const oldLevel = faction.level;
    faction.value = Math.max(-100, Math.min(100, faction.value + delta));
    faction.level = this.getReputationLevel(faction.value);

    const levelChanged = oldLevel !== faction.level;
    this.setUnread('reputation', true);

    return {
      success: true,
      faction: faction,
      oldValue,
      newValue: faction.value,
      oldLevel,
      newLevel: faction.level,
      levelChanged,
      reason
    };
  },

  // ========== v4.0.2 世界消息板块 ==========
  addWorldNews(newsData) {
    const news = {
      id: 'news_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      time: this.state.world.currentTime,
      category: newsData.category || 'general', // general/academy/dragon/organization/npc/anomaly
      title: newsData.title || '',
      content: newsData.content || '',
      importance: newsData.importance || '普通', // 普通/重要/紧急
      createdAt: new Date().toISOString(),
    };
    this.state.worldNews.unshift(news);
    // 最多保留50条
    if (this.state.worldNews.length > 50) {
      this.state.worldNews = this.state.worldNews.slice(0, 50);
    }
    this.setUnread('worldNews', true);
    return { success: true, news };
  },

  // ========== v4.0.2 原著偏差记录板块 ==========
  addCanonDeviation(deviationData) {
    const deviation = {
      id: 'dev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      time: this.state.world.currentTime,
      type: deviationData.type || 'minor', // minor/moderate/major/worldline
      level: deviationData.level || '微小偏差', // 微小偏差/中度偏差/重度偏差/世界线偏移
      description: deviationData.description || '',
      originalEvent: deviationData.originalEvent || '',
      changedEvent: deviationData.changedEvent || '',
      impact: deviationData.impact || '',
      regressionAction: deviationData.regressionAction || '',
      createdAt: new Date().toISOString(),
    };
    this.state.canonDeviation.push(deviation);
    this.setUnread('canonDeviation', true);
    return { success: true, deviation };
  },

  // ========== v4.0.2 伏笔追踪板块 ==========
  addForeshadowing(foreshadowData) {
    const foreshadow = {
      id: 'foreshadow_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      time: this.state.world.currentTime,
      title: foreshadowData.title || '',
      description: foreshadowData.description || '',
      type: foreshadowData.type || 'hidden', // hidden/secret/bond/seal/hazard/opportunity
      status: foreshadowData.status || '未激活', // 未激活/正在酝酿/部分触发/已作废/高危暗线
      relatedNPC: foreshadowData.relatedNPC || '',
      relatedEvent: foreshadowData.relatedEvent || '',
      triggerCondition: foreshadowData.triggerCondition || '',
      createdAt: new Date().toISOString(),
    };
    this.state.foreshadowing.push(foreshadow);
    this.setUnread('foreshadowing', true);
    return { success: true, foreshadow };
  },

  updateForeshadowingStatus(id, newStatus) {
    const item = this.state.foreshadowing.find(f => f.id === id);
    if (!item) return { success: false };
    item.status = newStatus;
    this.setUnread('foreshadowing', true);
    return { success: true, foreshadow: item };
  },

  // 获取序列化状态
  serialize() {
    return JSON.parse(JSON.stringify(this.state));
  },
};