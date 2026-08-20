// 龙族世界模拟器 - 主应用逻辑
const App = {
  currentPage: 'login',
  createStep: 1,
  createData: {
    canon: 'CANON-R',
    identity: 'original',
  },
  isGenerating: false,
  currentTab: 'quest',
  // 登录配置（可在设置中修改）
  loginConfig: {
    question: '马义航是不是你爸爸？',
    answer: '是',
  },
  isLoggedIn: false,

  // 初始化
  init() {
    // 加载登录配置
    const savedLoginConfig = localStorage.getItem('dragon_login_config');
    if (savedLoginConfig) {
      try {
        this.loginConfig = { ...this.loginConfig, ...JSON.parse(savedLoginConfig) };
      } catch (e) {}
    }

    // 检查登录状态
    this.isLoggedIn = sessionStorage.getItem('dragon_logged_in') === 'true';
    if (this.isLoggedIn) {
      this.showPage('home');
    } else {
      this.showPage('login');
    }

    // 加载设置
    const settings = Storage.loadSettings();
    if (settings) {
      GameState.state = GameState.state || GameState.getDefaultState();
      GameState.state.settings = { ...GameState.state.settings, ...settings };
      this.applySettingsToUI(settings);
    }

    // 检查是否有自动存档
    const continueBtn = document.getElementById('continue-btn');
    if (continueBtn) {
      if (Storage.hasAutosave()) {
        continueBtn.disabled = false;
      } else {
        continueBtn.disabled = true;
        continueBtn.style.opacity = '0.5';
      }
    }

    // 绑定temperature滑块
    const tempSlider = document.getElementById('settings-temperature');
    if (tempSlider) {
      tempSlider.addEventListener('input', (e) => {
        document.getElementById('temperature-value').textContent = e.target.value;
      });
    }

    // 窗口大小变化时关闭抽屉
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) {
        this.closeAllDrawers();
      }
    });
  },

  // 页面切换
  showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId + '-page').classList.add('active');
    this.currentPage = pageId;
  },

  goHome() {
    this.showPage('home');
    // 更新继续按钮状态
    const continueBtn = document.getElementById('continue-btn');
    if (continueBtn) {
      continueBtn.disabled = !Storage.hasAutosave();
      continueBtn.style.opacity = Storage.hasAutosave() ? '1' : '0.5';
    }
  },

  // ========== 登录 ==========
  doLogin() {
    const answer = document.getElementById('login-answer').value.trim();
    const errorEl = document.getElementById('login-error');

    if (!answer) {
      errorEl.textContent = '请输入答案';
      errorEl.style.display = 'block';
      return;
    }

    if (answer === this.loginConfig.answer) {
      this.isLoggedIn = true;
      sessionStorage.setItem('dragon_logged_in', 'true');
      errorEl.style.display = 'none';
      document.getElementById('login-answer').value = '';
      this.goHome();
      this.toast('回答正确，进入游戏', 'success');
    } else {
      errorEl.textContent = '答案错误，再想想';
      errorEl.style.display = 'block';
    }
  },

  logout() {
    this.isLoggedIn = false;
    sessionStorage.removeItem('dragon_logged_in');
    this.showPage('login');
    this.toast('已退出登录', 'info');
  },

  // 修改登录问题和答案
  changeLoginConfig(newQuestion, newAnswer) {
    this.loginConfig.question = newQuestion;
    this.loginConfig.answer = newAnswer;
    localStorage.setItem('dragon_login_config', JSON.stringify(this.loginConfig));
    this.toast('问题和答案已更新', 'success');
  },

  // 保存登录配置（从设置页面）
  saveLoginConfig() {
    const newQuestion = document.getElementById('settings-new-question').value.trim();
    const newAnswer = document.getElementById('settings-new-answer').value.trim();
    const confirmAnswer = document.getElementById('settings-confirm-answer').value.trim();

    if (!newQuestion || !newAnswer) {
      this.toast('请输入新问题和新答案', 'error');
      return;
    }
    if (newAnswer !== confirmAnswer) {
      this.toast('两次输入的答案不一致', 'error');
      return;
    }

    this.changeLoginConfig(newQuestion, newAnswer);
    document.getElementById('settings-new-question').value = '';
    document.getElementById('settings-new-answer').value = '';
    document.getElementById('settings-confirm-answer').value = '';
  },

  // ========== 首页 ==========
  startNewGame() {
    this.createStep = 1;
    this.createData = { canon: 'CANON-R', identity: 'original' };
    this.updateCreateProgress();
    this.showCreateStep(1);
    this.showPage('create');
  },

  continueGame() {
    const saved = Storage.loadAutosave();
    if (saved) {
      GameState.load(saved);
      this.enterGame();
      this.toast('已加载自动存档', 'success');
    } else {
      this.toast('没有找到存档', 'error');
    }
  },

  showSettings() {
    this.applySettingsToUI(GameState.state?.settings || {});
    this.showPage('settings');
  },

  showSaveManager() {
    this.renderSaveSlots();
    this.showPage('savemanager');
  },

  // ========== 角色创建 ==========
  selectCanon(canon, el) {
    this.createData.canon = canon;
    document.querySelectorAll('[data-canon]').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
  },

  selectIdentity(identity, el) {
    this.createData.identity = identity;
    document.querySelectorAll('[data-identity]').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
  },

  showCreateStep(step) {
    document.querySelectorAll('.create-step').forEach(s => s.classList.remove('active'));
    document.querySelector(`.create-step[data-step="${step}"]`).classList.add('active');
    this.createStep = step;
    this.updateCreateProgress();

    // 更新导航按钮
    document.getElementById('prev-btn').style.display = step === 1 ? 'none' : 'inline-block';
    const nextBtn = document.getElementById('next-btn');
    nextBtn.textContent = step === 5 ? '确认创建' : '下一步';

    // 如果是确认页，生成摘要
    if (step === 5) {
      this.renderCharacterSummary();
    }
  },

  updateCreateProgress() {
    document.querySelectorAll('.progress-step').forEach((s, i) => {
      s.classList.toggle('active', i + 1 <= this.createStep);
    });
  },

  nextCreateStep() {
    if (this.createStep < 5) {
      this.showCreateStep(this.createStep + 1);
    } else {
      this.confirmCharacter();
    }
  },

  prevCreateStep() {
    if (this.createStep > 1) {
      this.showCreateStep(this.createStep - 1);
    }
  },

  renderCharacterSummary() {
    const name = document.getElementById('player-name').value || '未命名';
    const age = document.getElementById('player-age').value;
    const gender = document.getElementById('player-gender').options[document.getElementById('player-gender').selectedIndex].text;
    const background = document.getElementById('player-background').value || '未填写';
    const personality = document.getElementById('player-personality').value || '未填写';
    const bloodline = document.getElementById('player-bloodline').options[document.getElementById('player-bloodline').selectedIndex].text;
    const yanling = document.getElementById('player-yanling').value || '未觉醒';
    const org = document.getElementById('player-organization').options[document.getElementById('player-organization').selectedIndex].text;
    const timeline = document.getElementById('player-timeline').options[document.getElementById('player-timeline').selectedIndex].text;

    const canonNames = {
      'CANON-R': '修订/重启主线',
      'CANON-O': '旧版连续线',
      'CANON-H': '混合世界',
      'CANON-C': '自定义',
    };
    const identityNames = {
      'original': '原创人物',
      'transmigrator': '穿越者',
      'replacement': '原著人物替代',
      'ordinary': '普通人',
      'family': '混血种家族',
    };

    document.getElementById('character-summary').innerHTML = `
      <h4>角色档案</h4>
      <p><strong>姓名：</strong>${name}</p>
      <p><strong>年龄：</strong>${age}岁 · ${gender}</p>
      <p><strong>正典模式：</strong>${canonNames[this.createData.canon]}</p>
      <p><strong>身份：</strong>${identityNames[this.createData.identity]}</p>
      <p><strong>血统：</strong>${bloodline}</p>
      <p><strong>言灵：</strong>${yanling}</p>
      <p><strong>初始组织：</strong>${org}</p>
      <p><strong>进入时间：</strong>${timeline}</p>
      <p><strong>背景：</strong>${background}</p>
      <p><strong>性格目标：</strong>${personality}</p>
    `;
  },

  confirmCharacter() {
    const name = document.getElementById('player-name').value || '未命名';
    const age = parseInt(document.getElementById('player-age').value) || 18;
    const gender = document.getElementById('player-gender').value;
    const background = document.getElementById('player-background').value;
    const personality = document.getElementById('player-personality').value;
    const bloodlineTier = document.getElementById('player-bloodline').value;
    const yanling = document.getElementById('player-yanling').value;
    const organization = document.getElementById('player-organization').value;
    const timeline = document.getElementById('player-timeline').value;

    const identityNames = {
      'original': '原创人物',
      'transmigrator': '穿越者（保留原著记忆）',
      'replacement': '原著人物替代',
      'ordinary': '普通人',
      'family': '混血种家族成员',
    };

    // 初始化游戏状态
    GameState.init();
    // 恢复之前保存的设置（API Key等），避免被init重置
    const savedSettings = Storage.loadSettings();
    if (savedSettings) {
      GameState.state.settings = { ...GameState.state.settings, ...savedSettings };
    }
    GameState.state.world.canonMode = this.createData.canon;
    GameState.state.world.gameStarted = true;
    GameState.state.player.name = name;
    GameState.state.player.age = age;
    GameState.state.player.gender = gender;
    GameState.state.player.identity = this.createData.identity;
    GameState.state.player.identityDescription = identityNames[this.createData.identity];
    GameState.state.player.background = background;
    GameState.state.player.personality = personality;
    GameState.state.player.bloodline.tier = bloodlineTier;
    GameState.state.player.yanling = yanling;
    GameState.state.player.organization = organization;
    GameState.state.player.timeline = timeline;
    GameState.state.meta.createdAt = new Date().toISOString();

    // 根据血统设置初始状态
    const bloodlineMod = { 'E': 0, 'D': 10, 'C': 20, 'B': 35, 'A': 50, 'S': 70 };
    GameState.state.player.bloodline.potential = 40 + (bloodlineMod[bloodlineTier] || 20);
    GameState.state.player.bloodline.stability = 100 - (bloodlineMod[bloodlineTier] || 20);

    // 进入游戏
    this.enterGame();

    // 生成开场剧情
    setTimeout(() => {
      this.generateOpening();
    }, 500);
  },

  // ========== 游戏主界面 ==========
  enterGame() {
    this.showPage('game');
    this.updateStatusPanel();
    this.renderNarrative();
    this.renderChoice();
    this.switchTab('quest');
  },

  updateStatusPanel() {
    const p = GameState.state.player;
    const w = GameState.state.world;

    document.getElementById('player-name-display').textContent = p.name;
    document.getElementById('status-identity').textContent = p.identityDescription;
    document.getElementById('status-bloodline').textContent = p.bloodline.tier + '级';
    document.getElementById('status-yanling').textContent = p.yanling || '未觉醒';
    document.getElementById('status-org').textContent = this.getOrgName(p.organization);
    document.getElementById('status-time').textContent = w.currentTime;
    document.getElementById('status-location').textContent = w.currentLocation;
    document.getElementById('status-butterfly').textContent = w.butterflyLevel;
    document.getElementById('status-exposure').textContent = w.exposureLevel;
    document.getElementById('status-money').textContent = '¥' + (p.money || 0);

    const currentQuest = GameState.state.quests.find(q => q.status === 'active');
    document.getElementById('status-quest').textContent = currentQuest ? currentQuest.title : '无';

    document.getElementById('bar-health').style.width = p.health + '%';
    document.getElementById('bar-mental').style.width = p.mental + '%';
    document.getElementById('bar-stamina').style.width = p.stamina + '%';
  },

  getOrgName(org) {
    const names = {
      'none': '无',
      'cassell_student': '卡塞尔学院学生',
      'cassell_prep': '卡塞尔预科',
      'execution': '执行部',
      'research': '研究人员',
      'japan_family': '日本混血种家族',
      'independent': '独立混血种',
    };
    return names[org] || org;
  },

  renderNarrative() {
    const area = document.getElementById('narrative-area');
    const narrative = GameState.state.narrative;

    if (narrative.length === 0) {
      area.innerHTML = '<div class="narrative-placeholder">龙族世界正在等待你的进入...</div>';
      return;
    }

    // 记录渲染前的内容高度（即新内容的起始位置）
    const prevScrollHeight = area.scrollHeight;
    const prevScrollTop = area.scrollTop;
    const isAtBottom = (area.scrollHeight - area.scrollTop - area.clientHeight) < 50;

    area.innerHTML = narrative.map(entry => {
      if (entry.type === 'system') {
        return `<div class="narrative-entry system">${this.escapeHtml(entry.content)}</div>`;
      }
      const timeTag = entry.time ? `<div class="time-tag">${this.escapeHtml(entry.time)}</div>` : '';
      const speaker = entry.speaker ? `<span class="speaker">${this.escapeHtml(entry.speaker)}：</span>` : '';
      return `<div class="narrative-entry ${entry.type === 'dialogue' ? 'dialogue' : ''}">${timeTag}<div class="content">${speaker}${this.formatText(entry.content)}</div></div>`;
    }).join('');

    // 滚动到新内容的开头（而不是直接跳到末尾）
    // 如果用户之前在底部，滚动到新内容开头
    // 如果用户在查看历史，保持当前位置
    if (isAtBottom || this._forceScrollToNew) {
      // 使用requestAnimationFrame确保DOM更新后再滚动
      requestAnimationFrame(() => {
        area.scrollTo({
          top: prevScrollHeight > 0 ? prevScrollHeight - 10 : 0,
          behavior: 'smooth'
        });
      });
      this._forceScrollToNew = false;
    } else {
      // 用户在查看历史，保持当前位置
      area.scrollTop = prevScrollTop;
    }
  },

  formatText(text) {
    // 简单的文本格式化，保留换行
    return this.escapeHtml(text).replace(/\n/g, '<br>');
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  renderChoice() {
    const choiceArea = document.getElementById('choice-area');
    const choiceBubbles = document.getElementById('choice-bubbles');
    const decision = GameState.state.decision;

    if (!decision || !decision.options || decision.options.length === 0) {
      choiceArea.style.display = 'none';
      return;
    }

    choiceArea.style.display = 'block';
    const types = ['type-a', 'type-b', 'type-c', 'type-d'];

    choiceBubbles.innerHTML = decision.options.map((opt, i) => {
      const typeClass = types[i] || 'type-d';
      const costHtml = opt.cost ? `<span class="choice-cost">${this.escapeHtml(opt.cost)}</span>` : '';
      return `
        <div class="choice-bubble ${typeClass}" onclick="App.selectChoice(${i})">
          <span class="choice-label">${this.escapeHtml(opt.label)}</span>
          <span class="choice-text">${this.escapeHtml(opt.text)}${costHtml}</span>
        </div>
      `;
    }).join('');
  },

  selectChoice(index) {
    const decision = GameState.state.decision;
    if (!decision || !decision.options[index]) return;

    const choice = decision.options[index];
    const actionText = choice.text + (choice.cost ? '（' + choice.cost + '）' : '');

    // 清除决策
    GameState.clearDecision();
    this.renderChoice();

    // 提交行动
    this.submitAction(actionText);
  },

  // ========== AI剧情生成 ==========
  async generateOpening() {
    const settings = GameState.state.settings;
    const check = AIService.checkConfig(settings);

    if (!check.valid) {
      GameState.addNarrative('system', `（${check.message}，请在设置中配置DeepSeek API Key后开始游戏）`);
      this.renderNarrative();
      this.toast(check.message, 'error');
      return;
    }

    this.setGenerating(true);

    try {
      const worldState = this.buildWorldState();
      const previousContext = '';
      const playerAction = `【游戏开场】玩家${GameState.state.player.name}刚刚进入龙族世界，身份是${GameState.state.player.identityDescription}，初始组织是${this.getOrgName(GameState.state.player.organization)}。请生成开场剧情，介绍玩家进入这个世界的第一个场景，体现龙族世界观的氛围。`;

      const content = await AIService.generateNarrative(worldState, playerAction, previousContext, settings);

      // 解析选项
      const decision = OptionParser.extractDecision(content);
      const narrativeText = decision ? OptionParser.stripOptionsFromText(content, decision) : content;

      if (narrativeText.trim()) {
        GameState.addNarrative('narration', narrativeText.trim());
      }
      if (decision) {
        GameState.setDecision(decision);
      }

      this.renderNarrative();
      this.renderChoice();
      this.updateStatusPanel();

      // 自动保存
      Storage.autosave(GameState.serialize());
    } catch (e) {
      console.error('生成开场失败:', e);
      GameState.addNarrative('system', '（剧情生成失败：' + e.message + '）');
      this.renderNarrative();
      this.toast('剧情生成失败: ' + e.message, 'error');
    } finally {
      this.setGenerating(false);
    }
  },

  async submitAction(customAction = null) {
    if (this.isGenerating) {
      this.toast('正在生成中，请稍候...', 'info');
      return;
    }

    const input = document.getElementById('player-input');
    const action = customAction || input.value.trim();

    if (!action) return;

    // 检查是否是查询/节奏指令
    if (this.handleCommand(action)) {
      input.value = '';
      return;
    }

    const settings = GameState.state.settings;
    const check = AIService.checkConfig(settings);

    if (!check.valid) {
      this.toast(check.message, 'error');
      return;
    }

    // 显示玩家行动
    GameState.addNarrative('player', action, '你');
    input.value = '';
    
    // 设置标志：行动后生成的新内容滚动到新文本开头
    this._forceScrollToNew = true;
    this.renderNarrative();

    this.setGenerating(true);

    try {
      const worldState = this.buildWorldState();
      const previousContext = GameState.getRecentNarrative(10)
        .map(e => e.speaker ? `${e.speaker}：${e.content}` : e.content)
        .join('\n');

      const content = await AIService.generateNarrative(worldState, action, previousContext, settings);

      // 解析选项
      const decision = OptionParser.extractDecision(content);
      const narrativeText = decision ? OptionParser.stripOptionsFromText(content, decision) : content;

      if (narrativeText.trim()) {
        GameState.addNarrative('narration', narrativeText.trim());
      }
      if (decision) {
        GameState.setDecision(decision);
      }

      // 推进时间
      GameState.advanceTime(30);

      this.renderNarrative();
      this.renderChoice();
      this.updateStatusPanel();
      this.updateAllPanels();

      // 自动保存
      Storage.autosave(GameState.serialize());
    } catch (e) {
      console.error('剧情生成失败:', e);
      GameState.addNarrative('system', '（剧情生成失败：' + e.message + '）');
      this.renderNarrative();
      this.toast('剧情生成失败: ' + e.message, 'error');
    } finally {
      this.setGenerating(false);
    }
  },

  buildWorldState() {
    const p = GameState.state.player;
    const w = GameState.state.world;
    const nearbyNPCs = Object.values(GameState.state.npcs).map(n => n.name);

    return {
      time: w.currentTime,
      location: w.currentLocation,
      canonMode: w.canonMode,
      butterflyLevel: w.butterflyLevel,
      exposureLevel: w.exposureLevel,
      playerName: p.name,
      playerIdentity: p.identityDescription,
      playerBloodline: p.bloodline.tier + '级',
      playerYanling: p.yanling,
      playerOrganization: this.getOrgName(p.organization),
      playerHealth: p.health,
      playerMental: p.mental,
      playerStamina: p.stamina,
      nearbyNPCs: nearbyNPCs,
      currentQuest: GameState.state.quests.find(q => q.status === 'active')?.title,
    };
  },

  setGenerating(isGenerating) {
    this.isGenerating = isGenerating;
    const sendBtn = document.getElementById('send-btn');
    const input = document.getElementById('player-input');
    if (sendBtn) {
      sendBtn.textContent = isGenerating ? '生成中...' : '发送';
      sendBtn.disabled = isGenerating;
    }
    if (input) input.disabled = isGenerating;
  },

  // ========== 指令处理 ==========
  handleCommand(action) {
    const lower = action.toLowerCase().trim();

    // 查询指令
    const queryCommands = ['状态', '关系', '人物', '任务', '线索', '秘密', '地图', '组织', '世界消息', '原著偏差', '伏笔', '背包', '能力', '存档', '调试信息'];
    for (const cmd of queryCommands) {
      if (lower === cmd || lower.startsWith(cmd)) {
        this.quickQuery(cmd);
        return true;
      }
    }

    // 节奏指令
    if (lower.includes('快进') || lower.includes('剧情快') || lower.includes('少让我选') || lower.includes('多让我选') || lower.includes('连续剧情') || lower.includes('暂停剧情')) {
      GameState.addNarrative('system', `（节奏指令已接收：${action}）`);
      this.renderNarrative();
      return true;
    }

    return false;
  },

  quickQuery(cmd) {
    const tabMap = {
      '任务': 'quest',
      '线索': 'clue',
      '关系': 'relation',
      '人物': 'relation',
      '背包': 'inventory',
      '能力': 'ability',
      '组织': 'faction',
      '世界消息': 'world',
      '原著偏差': 'world',
      '伏笔': 'world',
      '秘密': 'world',
      '存档': 'save',
    };

    const tab = tabMap[cmd];
    const isMobile = window.innerWidth <= 768;
    
    // 状态 - 手机端展开左侧抽屉，电脑端在剧情区显示
    if (cmd === '状态') {
      if (isMobile) {
        this.openLeftDrawer();
      } else {
        const p = GameState.state.player;
        const w = GameState.state.world;
        const info = `【当前状态】\n姓名：${p.name}\n身份：${p.identityDescription}\n血统：${p.bloodline.tier}级\n言灵：${p.yanling || '未觉醒'}\n健康：${p.health}/100 精神：${p.mental}/100 体力：${p.stamina}/100\n时间：${w.currentTime}\n地点：${w.currentLocation}\n蝴蝶效应：${w.butterflyLevel}\n暴露度：${w.exposureLevel}`;
        GameState.addNarrative('system', info);
        this.renderNarrative();
      }
      return;
    }
    
    // 其他 - 手机端展开右侧抽屉，电脑端只切换标签
    if (tab) {
      this.switchTab(tab);
      if (isMobile) {
        this.openRightDrawer();
      }
      return;
    }

    // 调试信息直接显示
    if (cmd === '调试信息') {
      const info = `【调试信息】\n回合数：${GameState.state.meta.turnCount}\n叙述记录：${GameState.state.narrative.length}条\n任务：${GameState.state.quests.length}个\n线索：${GameState.state.clues.length}条\nNPC：${Object.keys(GameState.state.npcs).length}个\n关系：${GameState.state.relations.length}条\n伏笔：${GameState.state.threads.length}个\nAPI模型：${GameState.state.settings.model}`;
      GameState.addNarrative('system', info);
      this.renderNarrative();
    }
  },

  // ========== 浮动抽屉 ==========
  openLeftDrawer() {
    const leftPanel = document.getElementById('left-panel');
    const overlay = document.getElementById('drawer-overlay');
    const rightPanel = document.getElementById('right-panel');
    if (rightPanel) rightPanel.classList.remove('open');
    if (leftPanel) leftPanel.classList.add('open');
    if (overlay) overlay.classList.add('show');
    this.updateQuickBtnActive('状态');
  },

  openRightDrawer() {
    const rightPanel = document.getElementById('right-panel');
    const overlay = document.getElementById('drawer-overlay');
    const leftPanel = document.getElementById('left-panel');
    if (leftPanel) leftPanel.classList.remove('open');
    if (rightPanel) rightPanel.classList.add('open');
    if (overlay) overlay.classList.add('show');
  },

  closeAllDrawers() {
    const leftPanel = document.getElementById('left-panel');
    const rightPanel = document.getElementById('right-panel');
    const overlay = document.getElementById('drawer-overlay');
    if (leftPanel) leftPanel.classList.remove('open');
    if (rightPanel) rightPanel.classList.remove('open');
    if (overlay) overlay.classList.remove('show');
    this.updateQuickBtnActive(null);
  },

  updateQuickBtnActive(activeCmd) {
    document.querySelectorAll('.quick-btn').forEach(btn => {
      if (activeCmd && btn.textContent.trim() === activeCmd) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  },

  // ========== 右侧面板 ==========
  switchTab(tab) {
    this.currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.toggle('active', p.dataset.tab === tab));
    this.updatePanelContent(tab);
  },

  updateAllPanels() {
    ['quest', 'clue', 'relation', 'inventory', 'ability', 'faction', 'world'].forEach(tab => {
      this.updatePanelContent(tab);
    });
  },

  updatePanelContent(tab) {
    switch (tab) {
      case 'quest':
        this.renderQuestList();
        break;
      case 'clue':
        this.renderClueList();
        break;
      case 'relation':
        this.renderRelationList();
        break;
      case 'inventory':
        this.renderInventoryList();
        break;
      case 'ability':
        this.renderAbilityList();
        break;
      case 'faction':
        this.renderFactionList();
        break;
      case 'world':
        this.renderWorldPanel();
        break;
    }
  },

  renderQuestList() {
    const list = document.getElementById('quest-list');
    const quests = GameState.state.quests;
    if (quests.length === 0) {
      list.innerHTML = '<div class="list-empty">暂无任务</div>';
      return;
    }
    list.innerHTML = quests.map(q => `
      <div class="list-item">
        <div class="item-title">${this.escapeHtml(q.title)} <span style="font-size:11px;color:var(--text-secondary)">[${q.status}]</span></div>
        ${q.description ? `<div class="item-desc">${this.escapeHtml(q.description)}</div>` : ''}
      </div>
    `).join('');
  },

  renderClueList() {
    const list = document.getElementById('clue-list');
    const clues = GameState.state.clues;
    if (clues.length === 0) {
      list.innerHTML = '<div class="list-empty">暂无线索</div>';
      return;
    }
    list.innerHTML = clues.map(c => `
      <div class="list-item">
        <div class="item-title">${this.escapeHtml(c.title || c.content?.slice(0, 20) || '线索')}</div>
        <div class="item-desc">${this.escapeHtml(c.content || c.description || '')}</div>
        <div class="item-desc" style="margin-top:4px;color:var(--title-blue)">可信度：${c可信度 || c.confidence || '未知'}</div>
      </div>
    `).join('');
  },

  renderRelationList() {
    const list = document.getElementById('relation-list');
    const relations = GameState.state.relations;
    if (relations.length === 0) {
      list.innerHTML = '<div class="list-empty">暂无关系记录</div>';
      return;
    }
    list.innerHTML = relations.map(r => `
      <div class="list-item">
        <div class="item-title">${this.escapeHtml(r.name)}</div>
        <div class="item-desc">熟悉：${r.familiarity || 0} · 信任：${r.trust || 0} · 好感：${r.affinity || 0} · 戒备：${r.suspicion || 0}</div>
      </div>
    `).join('');
  },

  renderInventoryList() {
    const list = document.getElementById('inventory-list');
    const items = GameState.state.player.inventory;
    if (!items || items.length === 0) {
      list.innerHTML = '<div class="list-empty">背包为空</div>';
      return;
    }
    list.innerHTML = items.map(item => `
      <div class="list-item">
        <div class="item-title">${this.escapeHtml(item.name || '物品')}</div>
        ${item.description ? `<div class="item-desc">${this.escapeHtml(item.description)}</div>` : ''}
      </div>
    `).join('');
  },

  renderAbilityList() {
    const list = document.getElementById('ability-list');
    const p = GameState.state.player;
    let html = '';
    if (p.yanling) {
      html += `<div class="list-item"><div class="item-title">言灵：${this.escapeHtml(p.yanling)}</div></div>`;
    }
    if (p.abilities && p.abilities.length > 0) {
      html += p.abilities.map(a => `
        <div class="list-item">
          <div class="item-title">${this.escapeHtml(a.name)}</div>
          ${a.description ? `<div class="item-desc">${this.escapeHtml(a.description)}</div>` : ''}
        </div>
      `).join('');
    }
    if (!html) {
      html = '<div class="list-empty">暂无能力记录</div>';
    }
    list.innerHTML = html;
  },

  renderFactionList() {
    const list = document.getElementById('faction-list');
    const factions = GameState.state.factions;
    const keys = Object.keys(factions);
    if (keys.length === 0) {
      list.innerHTML = '<div class="list-empty">暂无声望记录</div>';
      return;
    }
    list.innerHTML = keys.map(k => `
      <div class="list-item">
        <div class="item-title">${this.escapeHtml(k)}</div>
        <div class="item-desc">声望：${factions[k].reputation || 0} · 怀疑：${factions[k].suspicion || 0}</div>
      </div>
    `).join('');
  },

  renderWorldPanel() {
    // 世界消息
    const worldList = document.getElementById('world-list');
    const events = GameState.state.worldEvents;
    if (events.length === 0) {
      worldList.innerHTML = '<div class="list-empty">暂无世界消息</div>';
    } else {
      worldList.innerHTML = events.slice(-5).reverse().map(e => `
        <div class="list-item">
          <div class="item-title">${this.escapeHtml(e.title || '事件')}</div>
          <div class="item-desc">${this.escapeHtml(e.description || e.content || '')}</div>
        </div>
      `).join('');
    }

    // 原著偏差
    document.getElementById('canon-deviation').textContent =
      `${GameState.state.world.butterflyLevel} ${this.getButterflyDesc(GameState.state.world.butterflyLevel)}`;

    // 伏笔
    const threadList = document.getElementById('thread-list');
    const threads = GameState.state.threads.filter(t => t.status === 'active');
    if (threads.length === 0) {
      threadList.innerHTML = '<div class="list-empty">暂无活跃伏笔</div>';
    } else {
      threadList.innerHTML = threads.map(t => `
        <div class="list-item">
          <div class="item-title">${this.escapeHtml(t.title || t.content?.slice(0, 20) || '伏笔')}</div>
          <div class="item-desc">${this.escapeHtml(t.description || t.content || '')}</div>
        </div>
      `).join('');
    }
  },

  getButterflyDesc(level) {
    const descs = {
      'B0': '无重要偏差',
      'B1': '微小偏差',
      'B2': '人物级偏差',
      'B3': '支线级偏差',
      'B4': '主线节点偏差',
      'B5': '多事件链偏转',
      'B6': '世界线重构',
    };
    return descs[level] || '';
  },

  // ========== 存档操作 ==========
  saveToSlot(slot) {
    const success = Storage.saveToSlot(slot, GameState.serialize());
    if (success) {
      this.toast(`已保存到存档槽 ${slot}`, 'success');
    } else {
      this.toast('保存失败', 'error');
    }
  },

  loadFromSlot(slot) {
    const saved = Storage.loadFromSlot(slot);
    if (saved) {
      GameState.load(saved);
      this.enterGame();
      this.toast(`已读取存档槽 ${slot}`, 'success');
    } else {
      this.toast(`存档槽 ${slot} 为空`, 'error');
    }
  },

  generateSaveCode() {
    const code = Storage.generateSaveCode(GameState.serialize());
    if (code) {
      document.getElementById('save-code-display').style.display = 'block';
      document.getElementById('save-code-text').value = code;
      this.toast('续玩码已生成', 'success');
    } else {
      this.toast('生成续玩码失败', 'error');
    }
  },

  copySaveCode() {
    const text = document.getElementById('save-code-text').value;
    if (!text) {
      this.toast('请先生成续玩码', 'error');
      return;
    }

    // 方案1：navigator.clipboard API（需要HTTPS）
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        this.toast('续玩码已复制到剪贴板', 'success');
      }).catch(() => {
        this.fallbackCopy(text);
      });
      return;
    }

    // 方案2：兜底复制
    this.fallbackCopy(text);
  },

  fallbackCopy(text) {
    try {
      // 创建临时textarea，确保可见且在视口内
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.top = '0';
      textarea.style.left = '0';
      textarea.style.width = '100%';
      textarea.style.height = 'auto';
      textarea.style.padding = '10px';
      textarea.style.border = 'none';
      textarea.style.background = 'transparent';
      textarea.style.color = 'transparent';
      textarea.style.zIndex = '9999';
      textarea.setAttribute('readonly', '');
      document.body.appendChild(textarea);

      // 选中内容
      textarea.focus();
      textarea.select();
      textarea.setSelectionRange(0, text.length);

      // 执行复制
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);

      if (successful) {
        this.toast('续玩码已复制', 'success');
      } else {
        this.manualCopyHint(text);
      }
    } catch (e) {
      this.manualCopyHint(text);
    }
  },

  manualCopyHint(text) {
    // 所有自动复制方法都失败，提示用户手动复制
    const textarea = document.getElementById('save-code-text');
    if (textarea) {
      textarea.focus();
      textarea.select();
      textarea.setSelectionRange(0, text.length);
    }
    this.toast('自动复制失败，请长按文本框手动复制', 'error');
  },

  showLoadCodeInput() {
    document.getElementById('load-code-input').style.display = 'block';
  },

  loadFromCode() {
    const code = document.getElementById('load-code-text').value.trim();
    if (!code) {
      this.toast('请输入续玩码', 'error');
      return;
    }

    const state = Storage.parseSaveCode(code);
    if (state) {
      GameState.load(state);
      this.enterGame();
      this.toast('续玩码读取成功', 'success');
    } else {
      this.toast('续玩码解析失败，请检查格式', 'error');
    }
  },

  renderSaveSlots() {
    const slots = Storage.getAllSlots();
    const container = document.getElementById('save-slots-display');
    container.innerHTML = slots.map(s => {
      if (!s.exists) {
        return `<div class="save-slot-card"><div class="slot-title">存档槽 ${s.slot}</div><div class="slot-info">空</div></div>`;
      }
      return `
        <div class="save-slot-card">
          <div class="slot-title">存档槽 ${s.slot} - ${this.escapeHtml(s.playerName)}</div>
          <div class="slot-info">时间：${this.escapeHtml(s.time)} · 地点：${this.escapeHtml(s.location)} · 回合：${s.turnCount}</div>
          <div class="slot-info">保存于：${new Date(s.lastSaved).toLocaleString()}</div>
          <div class="slot-actions">
            <button class="btn btn-secondary" onclick="App.loadFromSlot(${s.slot});App.showPage('game');">读取</button>
            <button class="btn btn-outline" onclick="if(confirm('确定删除此存档？')){Storage.deleteSlot(${s.slot});App.renderSaveSlots();}">删除</button>
          </div>
        </div>
      `;
    }).join('');
  },

  // ========== 设置 ==========
  applySettingsToUI(settings) {
    if (settings.apiKey) document.getElementById('settings-api-key').value = settings.apiKey;
    if (settings.model) document.getElementById('settings-model').value = settings.model;
    if (settings.temperature !== undefined) {
      document.getElementById('settings-temperature').value = settings.temperature;
      document.getElementById('temperature-value').textContent = settings.temperature;
    }
    if (settings.maxTokens) document.getElementById('settings-maxtokens').value = settings.maxTokens;
    if (settings.proxy) document.getElementById('settings-proxy').value = settings.proxy;
  },

  saveSettings() {
    const settings = {
      apiKey: document.getElementById('settings-api-key').value.trim(),
      model: document.getElementById('settings-model').value,
      temperature: parseFloat(document.getElementById('settings-temperature').value),
      maxTokens: parseInt(document.getElementById('settings-maxtokens').value),
      proxy: document.getElementById('settings-proxy').value.trim(),
    };

    Storage.saveSettings(settings);
    if (GameState.state) {
      GameState.state.settings = { ...GameState.state.settings, ...settings };
    }

    this.toast('设置已保存', 'success');
    this.goHome();
  },

  // ========== Toast ==========
  toast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast ' + type + ' show';
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  },
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  GameState.init();
  App.init();
});