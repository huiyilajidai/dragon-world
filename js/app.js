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

  // 版本号常量
  APP_VERSION: 'v4.1.9',

  // 更新日志数据
  CHANGELOG: [
    {
      version: 'v4.1.9',
      date: '2026-08-21',
      changes: [
        '蝴蝶效应与暴露度修改为点击等级按钮查看详情',
        '统一蝴蝶效应与暴露度等级按钮大小，设置固定宽度52px，确保视觉完全一致',
        '优化等级按钮提示文字，明确说明点击等级按钮查看详情'
      ]
    },
    {
      version: 'v4.1.8',
      date: '2026-08-21',
      changes: [
        '正典模式（步骤1）的上一步按钮禁用并隐藏',
        '优化角色创建页面导航按钮布局，下一步按钮始终保持在右侧',
        '系统稳定性优化'
      ]
    },
    {
      version: 'v4.1.7',
      date: '2026-08-21',
      changes: [
        '修复蝴蝶效应与暴露度点击查看详情无反应的问题（弹窗移至页面根级别）',
        '统一蝴蝶效应与暴露度等级按钮的字体大小，确保视觉一致',
        '修复角色创建正典选择页面下一步按钮位置，与后续页面保持一致（上一步按钮禁用而非隐藏）'
      ]
    },
    {
      version: 'v4.1.6',
      date: '2026-08-21',
      changes: [
        '蝴蝶效应等级显示改为可点击按钮，点击后弹出等级介绍弹窗',
        '暴露度等级显示改为可点击按钮，点击后弹出等级介绍弹窗',
        '新增蝴蝶效应7个等级（B0-B6）的详细介绍',
        '新增暴露度6个等级（EX0-EX5）的详细介绍',
        '等级介绍弹窗高亮显示当前等级，方便玩家了解当前状态'
      ]
    },
    {
      version: 'v4.1.5',
      date: '2026-08-21',
      changes: [
        '蝴蝶效应接入AI，由AI检索每轮对话实时变动世界线偏离程度',
        '暴露度接入AI，由AI检索每轮对话实时变动被各势力关注程度',
        '资金接入AI，由AI检索每轮对话实时变动学分、学院余额、现金',
        '状态板块三大核心指标全部AI自动托管，玩家无需手动修改'
      ]
    },
    {
      version: 'v4.1.4',
      date: '2026-08-21',
      changes: [
        '修复设置页面当前版本号与最新版本号不更新的问题',
        '新增更新日志功能，更新后可查看各版本更新内容',
        '优化版本检查逻辑，页面加载时自动更新版本号显示'
      ]
    },
    {
      version: 'v4.1.2',
      date: '2026-08-21',
      changes: [
        '修复新增人物关系显示为英文ID的问题，正确显示人物名字',
        '版本号同步更新至v4.1.2',
        '补充按钮位置调整至人物名字旁边，统一入口'
      ]
    },
    {
      version: 'v4.0.3',
      date: '2026-08-21',
      changes: [
        '使用背包物品自动生成对应文字行动并提交AI生成剧情',
        '新增可重复使用物品机制，非一次性物品使用后返回背包',
        '修复检查更新功能bug，正确清除缓存并刷新页面'
      ]
    },
    {
      version: 'v4.0.2',
      date: '2026-08-21',
      changes: [
        '新增组织声望板块，8大龙族组织声望AI自动浮动更新',
        '新增世界消息板块，诺玛全网监测、全球龙类异动自动收录',
        '新增原著偏差记录板块，AI世界线自检系统记录所有偏离原著的行为',
        '新增伏笔追踪板块，AI暗线收录系统记录所有隐藏剧情伏笔',
        '九大板块全自动链式联动，AI全权托管，零手动操作'
      ]
    },
    {
      version: 'v3.2.4',
      date: '2026-08-20',
      changes: [
        '状态栏版本号显示，当前任务迁移至任务板块',
        '设置页添加检查并更新到最新版本按钮',
        '12项功能增强：状态实时更新、红点提示、补充角色设定对话框等'
      ]
    }
  ],

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

    // 检查是否刚更新过，如果是则显示更新日志
    this.checkJustUpdated();
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
    // 更新版本号显示
    this.updateVersionDisplay();
  },

  // 更新版本号显示
  updateVersionDisplay() {
    const currentEl = document.getElementById('current-version-display');
    const latestEl = document.getElementById('latest-version');
    if (currentEl) {
      currentEl.textContent = this.APP_VERSION;
    }
    if (latestEl) {
      latestEl.textContent = this.APP_VERSION + '（已是最新）';
      latestEl.style.color = 'var(--title-mint)';
    }
  },

  // 显示更新日志
  showChangelog() {
    const modal = document.getElementById('changelog-modal');
    const content = document.getElementById('changelog-content');
    if (!modal || !content) return;

    // 生成更新日志HTML
    content.innerHTML = this.CHANGELOG.map(version => `
      <div class="changelog-version">
        <div class="changelog-version-header">
          <span class="changelog-version-number">${version.version}</span>
          <span class="changelog-version-date">${version.date}</span>
        </div>
        <ul class="changelog-list">
          ${version.changes.map(change => `<li>${this.escapeHtml(change)}</li>`).join('')}
        </ul>
      </div>
    `).join('');

    modal.style.display = 'flex';
  },

  // 关闭更新日志
  closeChangelog() {
    const modal = document.getElementById('changelog-modal');
    if (modal) modal.style.display = 'none';
  },

  // 检查并更新到最新版本
  checkAndUpdate() {
    const currentVersion = this.APP_VERSION;
    const latestEl = document.getElementById('latest-version');

    this.toast('正在检查最新版本...', 'info');

    // 纯前端应用，更新就是清除缓存并刷新页面加载最新代码
    setTimeout(() => {
      if (latestEl) {
        latestEl.textContent = currentVersion + '（当前版本）';
        latestEl.style.color = 'var(--title-mint)';
      }
      this.toast('当前版本 ' + currentVersion + '，点击确认更新以清除缓存并刷新', 'success');

      // 询问用户是否更新（清除缓存并刷新）
      if (confirm('检测到当前版本为 ' + currentVersion + '。\n\n点击"确定"将清除缓存并刷新页面，确保加载最新代码。\n（刷新前请先存档，避免进度丢失）')) {
        // 清除所有缓存
        const clearCache = async () => {
          if ('caches' in window) {
            try {
              const names = await caches.keys();
              await Promise.all(names.map(name => caches.delete(name)));
            } catch (e) {
              console.log('清除缓存失败:', e);
            }
          }
          // 清除Service Worker
          if ('serviceWorker' in navigator) {
            try {
              const registrations = await navigator.serviceWorker.getRegistrations();
              await Promise.all(registrations.map(reg => reg.unregister()));
            } catch (e) {
              console.log('注销Service Worker失败:', e);
            }
          }
          // 设置更新标记，页面加载后显示更新日志
          localStorage.setItem('dragon_just_updated', 'true');
          localStorage.setItem('dragon_updated_version', this.APP_VERSION);
          // 强制刷新页面（绕过缓存）
          window.location.href = window.location.pathname + '?t=' + Date.now();
        };
        clearCache();
      }
    }, 800);
  },

  // 检查是否刚更新过，如果是则显示更新日志
  checkJustUpdated() {
    const justUpdated = localStorage.getItem('dragon_just_updated');
    const updatedVersion = localStorage.getItem('dragon_updated_version');
    if (justUpdated === 'true' && updatedVersion === this.APP_VERSION) {
      // 清除标记
      localStorage.removeItem('dragon_just_updated');
      localStorage.removeItem('dragon_updated_version');
      // 延迟显示更新日志，让页面先加载完成
      setTimeout(() => {
        this.showChangelog();
        this.toast('已更新到 ' + this.APP_VERSION + '，查看更新日志了解新功能', 'success');
      }, 1000);
    }
  },

  // ========== v4.1.6 等级介绍系统 ==========
  // 蝴蝶效应等级数据
  BUTTERFLY_LEVELS: [
    { level: 'B0', name: '无重要偏差', desc: '完全遵循原著剧情走向，世界线未发生任何偏离。玩家的行为尚未对原著关键事件产生影响。' },
    { level: 'B1', name: '微小偏差', desc: '轻微改变非关键事件或细节，不影响原著主线走向。可能改变某些NPC的日常行为或对话内容。' },
    { level: 'B2', name: '人物级偏差', desc: '改变某个NPC的行为、关系或命运，但未影响整体剧情结构。可能导致某个原著人物走上不同的人生道路。' },
    { level: 'B3', name: '支线级偏差', desc: '改变某个支线任务的走向或结果，可能影响相关NPC的后续发展，但主线剧情仍按原著推进。' },
    { level: 'B4', name: '主线节点偏差', desc: '改变原著主线关键节点，如提前或延后某个重要事件、改变关键人物的生死、影响龙王苏醒时间等。' },
    { level: 'B5', name: '多事件链偏转', desc: '多个事件链同时发生偏转，原著剧情结构开始瓦解。未来原著事件必须重新验证全部前置条件，大量剧情走向未知。' },
    { level: 'B6', name: '世界线重构', desc: '原著只作为历史数据库，不得继续默认未来剧情会发生。世界线已完全重构，所有事件走向未知原创结局。' },
  ],

  // 暴露度等级数据
  EXPOSURE_LEVELS: [
    { level: 'EX0', name: '无人注意', desc: '完全透明，没有任何势力或个人注意到你的异常。你就像一个普通的学生，融入在人群之中。' },
    { level: 'EX1', name: '局部注意', desc: '局部人员开始注意到你的一些不寻常行为或能力，但尚未上报或引起重视。可能有个别同学或教授私下议论。' },
    { level: 'EX2', name: '学院/地方组织关注', desc: '卡塞尔学院或地方混血种组织开始正式关注你，可能会有档案记录或初步调查。执行部可能会派人观察你的行为。' },
    { level: 'EX3', name: '核心部门关注', desc: '执行部等核心部门将你列为重点关注对象，可能会有专门的调查档案和监控措施。校董会可能也会收到关于你的报告。' },
    { level: 'EX4', name: '多个重要势力调查', desc: '多个重要势力同时对你展开调查，包括秘党、加图索家族、蛇岐八家等。你的行踪和能力可能被多方追踪和分析。' },
    { level: 'EX5', name: '世界级异常目标', desc: '你被认定为世界级异常目标，全球混血种社会都知道你的存在。可能会有世界级的追杀、拉拢或研究行动，你将无处遁形。' },
  ],

  // 显示等级介绍弹窗
  showLevelInfo(type) {
    const modal = document.getElementById('level-info-modal');
    const titleEl = document.getElementById('level-info-title');
    const contentEl = document.getElementById('level-info-content');
    if (!modal || !titleEl || !contentEl) return;

    let levels, currentLevel, title, typeClass;
    if (type === 'butterfly') {
      levels = this.BUTTERFLY_LEVELS;
      currentLevel = GameState.state.world.butterflyLevel || 'B0';
      title = '蝴蝶效应等级介绍';
      typeClass = 'butterfly';
    } else if (type === 'exposure') {
      levels = this.EXPOSURE_LEVELS;
      currentLevel = GameState.state.world.exposureLevel || 'EX0';
      title = '暴露度等级介绍';
      typeClass = 'exposure';
    } else {
      return;
    }

    titleEl.textContent = title;

    // 找到当前等级的信息
    const currentInfo = levels.find(l => l.level === currentLevel) || levels[0];

    // 生成弹窗内容
    contentEl.innerHTML = `
      <div class="level-info-current">
        <div class="level-info-current-label">当前等级</div>
        <div class="level-info-current-value">${currentInfo.level}</div>
        <div class="level-info-current-desc">${this.escapeHtml(currentInfo.name)} - ${this.escapeHtml(currentInfo.desc)}</div>
      </div>
      <div class="level-list">
        ${levels.map(l => `
          <div class="level-item ${l.level === currentLevel ? 'current' : ''}">
            <div class="level-badge ${typeClass}">${l.level}</div>
            <div class="level-info">
              <div class="level-name">
                ${this.escapeHtml(l.name)}
                ${l.level === currentLevel ? '<span class="level-current-tag">当前</span>' : ''}
              </div>
              <div class="level-desc">${this.escapeHtml(l.desc)}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    modal.style.display = 'flex';
  },

  // 关闭等级介绍弹窗
  closeLevelInfo() {
    const modal = document.getElementById('level-info-modal');
    if (modal) modal.style.display = 'none';
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
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    if (step === 1) {
      prevBtn.style.display = 'none';
      prevBtn.disabled = true;
      nextBtn.style.marginLeft = 'auto';
    } else {
      prevBtn.style.display = 'inline-block';
      prevBtn.disabled = false;
      prevBtn.style.opacity = '1';
      prevBtn.style.cursor = 'pointer';
      nextBtn.style.marginLeft = '0';
    }
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
    let yanling = document.getElementById('player-yanling').value || '未觉醒';
    const yanlingAwakened = document.getElementById('player-yanling-awakened').checked;
    if (!yanlingAwakened) {
      yanling = '未觉醒（后续剧情中觉醒）';
    }
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
    let yanling = document.getElementById('player-yanling').value;
    const yanlingAwakened = document.getElementById('player-yanling-awakened').checked;
    // 如果未勾选觉醒，言灵设置为未觉醒
    if (!yanlingAwakened) {
      yanling = '未觉醒';
    } else if (!yanling) {
      yanling = '未觉醒（待觉醒）';
    }
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

    // 初始化能力系统
    GameState.initAbilities(bloodlineTier);

    // 初始化背包
    GameState.initInventory();

    // 初始化关系
    GameState.initRelations();

    // 初始化任务
    GameState.initQuests();

    // 初始化线索
    GameState.initClues();

    // 进入游戏
    this.enterGame();

    // 生成开场剧情
    setTimeout(() => {
      this.generateOpening();
    }, 500);
  },

  // ========== 四大板块自动更新解析 ==========
  // 解析AI返回的PANEL_UPDATE指令
  parsePanelUpdate(content) {
    const match = content.match(/【PANEL_UPDATE】([\s\S]*?)【\/PANEL_UPDATE】/);
    if (!match) return null;

    try {
      const jsonStr = match[1].trim();
      return JSON.parse(jsonStr);
    } catch (e) {
      console.error('PANEL_UPDATE解析失败:', e);
      return null;
    }
  },

  // 从内容中移除PANEL_UPDATE部分
  stripPanelUpdate(content) {
    return content.replace(/【PANEL_UPDATE】[\s\S]*?【\/PANEL_UPDATE】/g, '').trim();
  },

  // 执行PANEL_UPDATE指令
  executePanelUpdate(panelData) {
    if (!panelData) return { status: false, environment: false, abilities: false, clue: false, quest: false, relation: false, inventory: false, reputation: false, worldNews: false, canonDeviation: false, foreshadowing: false };

    const updates = { status: false, environment: false, abilities: false, clue: false, quest: false, relation: false, inventory: false, reputation: false, worldNews: false, canonDeviation: false, foreshadowing: false };
    const updateMessages = [];
    const p = GameState.state.player;
    const w = GameState.state.world;

    // 1. 处理人物状态数值更新
    if (panelData.status) {
      const s = panelData.status;
      let statusChanged = false;

      if (s.health !== undefined) {
        p.health = Math.max(0, Math.min(100, p.health + s.health));
        statusChanged = true;
      }
      if (s.stamina !== undefined) {
        p.stamina = Math.max(0, Math.min(100, p.stamina + s.stamina));
        statusChanged = true;
      }
      if (s.mental !== undefined) {
        p.mental = Math.max(0, Math.min(100, p.mental + s.mental));
        statusChanged = true;
      }
      if (s.sanity !== undefined) {
        p.sanity = Math.max(0, Math.min(100, p.sanity + s.sanity));
        statusChanged = true;
      }
      if (s.lossOfControl !== undefined) {
        p.lossOfControl = Math.max(0, Math.min(100, p.lossOfControl + s.lossOfControl));
        statusChanged = true;
      }

      if (statusChanged) {
        updates.status = true;
        updateMessages.push('状态数值变动');

        // 数值崩坏自动触发
        this.checkStatusCollapse();
      }
    }

    // 2. 处理环境身份更新
    if (panelData.environment) {
      const e = panelData.environment;
      let envChanged = false;

      if (e.location !== undefined) {
        w.currentLocation = e.location;
        envChanged = true;
      }
      if (e.money !== undefined) {
        p.money = Math.max(0, (p.money || 0) + e.money);
        envChanged = true;
      }
      if (e.butterflyLevel !== undefined) {
        w.butterflyLevel = e.butterflyLevel;
        envChanged = true;
      }
      if (e.exposureLevel !== undefined) {
        w.exposureLevel = e.exposureLevel;
        envChanged = true;
      }

      if (envChanged) {
        updates.environment = true;
        if (e.location) updateMessages.push(`地点变更：${e.location}`);
        if (e.money) updateMessages.push(`资金变动：${e.money > 0 ? '+' : ''}${e.money}`);
        if (e.butterflyLevel) updateMessages.push(`蝴蝶效应变更：${e.butterflyLevel}`);
        if (e.exposureLevel) updateMessages.push(`暴露度变更：${e.exposureLevel}`);
      }
    }

    // 3. 处理能力面板更新
    if (panelData.abilities && Array.isArray(panelData.abilities)) {
      for (const ability of panelData.abilities) {
        if (ability.action === 'add') {
          // 检查是否已存在
          const existing = p.abilities.find(a => a.id === ability.id);
          if (!existing) {
            p.abilities.push({
              id: ability.id,
              name: ability.name,
              level: ability.level || '初学',
              progress: ability.progress || 0,
              category: ability.category || '基础技能',
              description: ability.description || ''
            });
            updates.abilities = true;
          }
        } else if (ability.action === 'update') {
          const existing = p.abilities.find(a => a.id === ability.id);
          if (existing) {
            if (ability.progress !== undefined) {
              existing.progress = Math.max(0, Math.min(100, existing.progress + ability.progress));
              // 自动升级
              if (existing.progress >= 80) existing.level = '大师';
              else if (existing.progress >= 50) existing.level = '高级';
              else if (existing.progress >= 25) existing.level = '中级';
              else existing.level = '初学';
            }
            if (ability.level) existing.level = ability.level;
            updates.abilities = true;
          }
        }
      }
      if (updates.abilities) {
        GameState.setUnread('ability', true);
        updateMessages.push('能力面板更新');
      }
    }

    // 4. 处理线索更新
    if (panelData.clues && Array.isArray(panelData.clues)) {
      for (const clue of panelData.clues) {
        if (clue.action === 'add') {
          const result = GameState.addClue({
            id: clue.id,
            name: clue.name,
            type: clue.type || 'environment',
            level: clue.level || '普通',
            description: clue.description || '',
            canSubmit: clue.canSubmit !== false,
            reward: clue.reward || null
          });
          if (result.success) {
            updates.clue = true;
            // 触发联动
            this.triggerLinkage('clue', result.clue, false);
          }
        } else if (clue.action === 'invalidate') {
          GameState.invalidateClue(clue.id, clue.reason);
          updates.clue = true;
        }
      }
      if (updates.clue) updateMessages.push('更新线索板块');
    }

    // 2. 处理任务更新
    if (panelData.quests && Array.isArray(panelData.quests)) {
      for (const quest of panelData.quests) {
        if (quest.action === 'update') {
          const result = GameState.updateQuest(quest.id, { status: quest.status });
          if (result.success) {
            updates.quest = true;
            this.triggerLinkage('quest', result.quest, false);
          }
        } else if (quest.action === 'subgoal') {
          GameState.updateSubGoal(quest.id, quest.subGoalId, quest.completed);
          updates.quest = true;
        } else if (quest.action === 'add') {
          GameState.addQuest({
            id: quest.id,
            name: quest.name,
            type: quest.type || 'daily',
            description: quest.description || '',
            deadline: quest.deadline || null,
            reward: quest.reward || null,
            canAbandon: quest.canAbandon !== false,
            subGoals: quest.subGoals || []
          });
          updates.quest = true;
        }
      }
      if (updates.quest) updateMessages.push('更新任务板块');
    }

    // 3. 处理关系更新
    if (panelData.relations && Array.isArray(panelData.relations)) {
      for (const rel of panelData.relations) {
        // 确保name字段存在，如果缺失则使用id
        const relationName = rel.name || rel.id || '未知人物';
        const existingRelation = GameState.getRelation(rel.id);

        if (rel.action === 'update') {
          // 如果关系不存在，自动转为add操作
          if (!existingRelation) {
            GameState.addRelation({
              id: rel.id,
              name: relationName,
              affinity: rel.affinity || '普通',
              stance: rel.stance || ['陌生人'],
              note: rel.note || ''
            });
            updates.relation = true;
          } else {
            const result = GameState.updateRelation(rel.id, {
              affinityDelta: rel.affinityDelta || 0,
              stance: rel.stance,
              stanceAction: rel.stanceAction,
              note: rel.note,
              hiddenBond: rel.hiddenBond
            });
            if (result.success) {
              updates.relation = true;
              this.triggerLinkage('relation', result.relation, false);
            }
          }
        } else if (rel.action === 'lock') {
          GameState.lockRelation(rel.id, rel.deathNote);
          updates.relation = true;
        } else if (rel.action === 'add') {
          if (!existingRelation) {
            GameState.addRelation({
              id: rel.id,
              name: relationName,
              affinity: rel.affinity || '普通',
              stance: rel.stance || ['陌生人'],
              note: rel.note || ''
            });
            updates.relation = true;
          }
        }
      }
      if (updates.relation) {
        const relNames = panelData.relations.map(r => {
          const rel = GameState.getRelation(r.id);
          return rel ? (rel.name || r.id) : (r.name || r.id);
        }).join('、');
        updateMessages.push(`与${relNames}的关系发生变化更新关系板块`);
      }
    }

    // 4. 处理背包更新
    if (panelData.inventory && Array.isArray(panelData.inventory)) {
      for (const item of panelData.inventory) {
        if (item.action === 'add') {
          const result = GameState.addItem({
            id: item.id,
            name: item.name,
            category: item.category || 'misc',
            quantity: item.quantity || 1,
            weight: item.weight || 0.1,
            description: item.description || '',
            canDiscard: item.canDiscard !== false,
            canUse: item.canUse || false,
            reusable: item.reusable || false,
            effects: item.effects || null
          });
          if (result.success) {
            updates.inventory = true;
            this.triggerLinkage('inventory', result.item, false);
          }
        } else if (item.action === 'remove') {
          GameState.removeItem(item.id, item.quantity || 1);
          updates.inventory = true;
        } else if (item.action === 'use') {
          GameState.useItem(item.id);
          updates.inventory = true;
        }
      }
      if (updates.inventory) updateMessages.push('背包物品变动更新背包板块');
    }

    // 5. 处理组织声望更新
    if (panelData.reputation && Array.isArray(panelData.reputation)) {
      for (const rep of panelData.reputation) {
        const result = GameState.updateReputation(rep.factionId, rep.delta || 0, rep.reason || '');
        if (result.success && result.levelChanged) {
          updates.reputation = true;
        }
      }
      if (updates.reputation) updateMessages.push('【声望变动】组织对你的评价发生改变');
    }

    // 6. 处理世界消息更新
    if (panelData.worldNews && Array.isArray(panelData.worldNews)) {
      for (const news of panelData.worldNews) {
        GameState.addWorldNews(news);
      }
      updates.worldNews = true;
      updateMessages.push('【世界消息】监测到全球/学院新异动');
    }

    // 7. 处理原著偏差更新
    if (panelData.canonDeviation && Array.isArray(panelData.canonDeviation)) {
      for (const dev of panelData.canonDeviation) {
        GameState.addCanonDeviation(dev);
      }
      updates.canonDeviation = true;
      updateMessages.push('【世界线自检】本次行为产生原著剧情偏差');
    }

    // 8. 处理伏笔追踪更新
    if (panelData.foreshadowing && Array.isArray(panelData.foreshadowing)) {
      for (const fs of panelData.foreshadowing) {
        GameState.addForeshadowing(fs);
      }
      updates.foreshadowing = true;
      updateMessages.push('【伏笔追踪】新增一条隐藏剧情伏笔');
    }

    // 显示更新提示
    if (updateMessages.length > 0) {
      // 逐条显示简短提示
      updateMessages.forEach((msg, index) => {
        setTimeout(() => {
          this.toast(msg, 'info');
        }, index * 300);
      });
    }

    // 刷新所有有变动的板块
    if (updates.status || updates.environment) this.updateStatusPanel();
    if (updates.abilities) this.updatePanelContent('ability');
    if (updates.clue) this.updatePanelContent('clue');
    if (updates.quest) { this.updatePanelContent('quest'); this.updateCurrentQuest(); }
    if (updates.relation) this.updatePanelContent('relation');
    if (updates.inventory) this.updatePanelContent('inventory');
    if (updates.reputation) this.updatePanelContent('faction');
    if (updates.worldNews || updates.canonDeviation || updates.foreshadowing) this.updatePanelContent('world');

    // 更新红点
    this.updateRedDots();

    return updates;
  },

  // 数值崩坏自动检查
  checkStatusCollapse() {
    const p = GameState.state.player;
    const collapseEffects = [];

    // 理智值过低
    if (p.sanity <= 20 && p.sanity > 0) {
      collapseEffects.push('理智值过低：出现幻觉、耳鸣、情绪低落');
    }
    // 体力归零
    if (p.stamina <= 0) {
      collapseEffects.push('体力耗尽：无法战斗、脱力、倒地喘息');
    }
    // 健康值过低
    if (p.health <= 20 && p.health > 0) {
      collapseEffects.push('重伤状态：行动受限、流血debuff');
    }
    // 失控值过高
    if (p.lossOfControl >= 80) {
      collapseEffects.push('失控值过高：出现龙化异象、言灵反噬、情绪暴戾');
    }

    // 如果有崩坏效果，添加到叙述中
    if (collapseEffects.length > 0) {
      // 可以在这里添加特殊叙述或提示
      console.log('数值崩坏效果:', collapseEffects);
    }

    return collapseEffects;
  },

  // ========== 游戏主界面 ==========
  enterGame() {
    this.showPage('game');
    this.updateStatusPanel();
    this.renderNarrative();
    this.renderChoice();
    this.switchTab('quest');
    this.updateRedDots();
    this.updateCurrentQuest();
    this.checkExpiredQuests();
    // 初始化状态计数，避免第一次误报红点
    const p = GameState.state.player;
    const s = GameState.state;
    let totalAbilityProgress = 0;
    if (p.abilitiesData) {
      for (const cat of p.abilitiesData) {
        for (const ab of cat.abilities) {
          totalAbilityProgress += ab.progress || 0;
        }
      }
    }
    this._lastStateCounts = {
      quests: s.quests.length,
      clues: s.clues.length,
      relations: s.relations.length,
      carried: p.inventory?.items?.length || 0,
      uncurried: 0,
      abilities: p.abilities?.length || 0,
      abilityProgress: totalAbilityProgress
    };
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
    document.getElementById('bar-sanity').style.width = (p.sanity || 100) + '%';
    document.getElementById('bar-loss-control').style.width = (p.lossOfControl || 0) + '%';
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
    let decision = GameState.state.decision;

    // 强力兜底：如果没有决策点，自动生成通用选项
    if (!decision || !decision.options || decision.options.length === 0) {
      // 检查是否在游戏中（有叙述内容）
      if (GameState.state.narrative.length > 0 && !this.isGenerating) {
        decision = {
          options: [
            { label: 'A', text: '继续观察当前情况', cost: '' },
            { label: 'B', text: '主动采取行动', cost: '' },
            { label: 'C', text: '调查周围环境', cost: '' },
            { label: 'D', text: '离开当前地点', cost: '' },
          ]
        };
        GameState.setDecision(decision);
      } else {
        choiceArea.style.display = 'none';
        return;
      }
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

      // 解析并执行四大板块自动更新
      const panelData = this.parsePanelUpdate(content);
      const cleanContent = this.stripPanelUpdate(content);
      if (panelData) {
        this.executePanelUpdate(panelData);
      }

      // 解析选项
      const decision = OptionParser.extractDecision(cleanContent);
      const narrativeText = decision ? OptionParser.stripOptionsFromText(cleanContent, decision) : cleanContent;

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

      // 解析并执行四大板块自动更新
      const panelData = this.parsePanelUpdate(content);
      const cleanContent = this.stripPanelUpdate(content);
      if (panelData) {
        this.executePanelUpdate(panelData);
      }

      // 解析选项
      const decision = OptionParser.extractDecision(cleanContent);
      const narrativeText = decision ? OptionParser.stripOptionsFromText(cleanContent, decision) : cleanContent;

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
      this.updateStatusPerTurn();
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
      playerSanity: p.sanity,
      playerLossOfControl: p.lossOfControl,
      playerMoney: p.money,
      playerAbilities: p.abilities.map(a => ({ name: a.name, level: a.level, progress: a.progress })),
      nearbyNPCs: nearbyNPCs,
      currentQuest: GameState.state.quests.find(q => q.status === 'active')?.title,
      activeQuests: GameState.state.quests.filter(q => q.status === '进行中').map(q => ({ id: q.id, name: q.name })),
      inventoryCount: p.inventory?.items?.length || 0,
      cluesCount: GameState.state.clues.length,
      relationsCount: GameState.state.relations.length,
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
    // 清除当前激活标签的红点
    const activeTab = this.currentTab;
    if (['quest', 'clue', 'relation', 'inventory', 'ability'].includes(activeTab)) {
      GameState.clearUnread(activeTab);
      this.updateRedDots();
    }
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
    // 清除对应面板的红点
    if (['quest', 'clue', 'relation', 'inventory', 'ability'].includes(tab)) {
      GameState.clearUnread(tab);
      this.updateRedDots();
    } else if (tab === 'faction') {
      GameState.clearUnread('reputation');
      this.updateRedDots();
    } else if (tab === 'world') {
      // 清除世界标签下所有子标签的红点
      GameState.clearUnread('worldNews');
      GameState.clearUnread('canonDeviation');
      GameState.clearUnread('foreshadowing');
      this.updateRedDots();
    }
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
    if (!quests || quests.length === 0) {
      list.innerHTML = '<div class="list-empty">暂无任务</div>';
      return;
    }

    const typeOrder = ['daily', 'commission', 'main', 'hidden'];
    const typeNames = {
      daily: { name: '日常任务', icon: '📅' },
      commission: { name: '学院委托', icon: '📋' },
      main: { name: '主线屠龙', icon: '⚔️' },
      hidden: { name: '隐藏任务', icon: '✨' },
    };

    let html = '';
    for (const type of typeOrder) {
      const typeQuests = quests.filter(q => q.type === type);
      if (typeQuests.length === 0) continue;

      const typeInfo = typeNames[type];
      html += `<div class="quest-category">
        <div class="quest-category-title ${type}">${typeInfo.icon} ${typeInfo.name}</div>`;

      for (const q of typeQuests) {
        const statusClass = q.status.replace(/\s/g, '');
        const isUrgent = q.deadline && new Date(q.deadline) - new Date() < 30 * 60 * 1000 && (q.status === '进行中' || q.status === '未接取');
        const deadlineText = q.deadline ? this.formatDeadline(q.deadline) : '';

        // 子目标
        let subgoalsHtml = '';
        if (q.subGoals && q.subGoals.length > 0) {
          subgoalsHtml = '<div class="quest-subgoals">';
          for (const sg of q.subGoals) {
            subgoalsHtml += `<div class="subgoal-item ${sg.completed ? 'completed' : ''}">
              <span class="subgoal-checkbox">${sg.completed ? '✓' : ''}</span>
              <span>${this.escapeHtml(sg.text)}</span>
            </div>`;
          }
          subgoalsHtml += '</div>';
        }

        // 奖励
        let rewardHtml = '';
        if (q.reward) {
          const rewards = [];
          if (q.reward.credit) rewards.push('学分+' + q.reward.credit);
          if (q.reward.executionPoints) rewards.push('执行部积分+' + q.reward.executionPoints);
          if (q.reward.secretIntel) rewards.push(q.reward.secretIntel);
          if (q.reward.randomAlchemyItem) rewards.push('随机炼金道具');
          if (rewards.length > 0) rewardHtml = `<div class="quest-reward">奖励：${rewards.join('、')}</div>`;
        }

        // 惩罚
        let penaltyHtml = '';
        if (q.penalty) {
          const penalties = [];
          if (q.penalty.credit) penalties.push('学分' + q.penalty.credit);
          if (q.penalty.description) penalties.push(q.penalty.description);
          if (penalties.length > 0) penaltyHtml = `<div class="quest-penalty">惩罚：${penalties.join('、')}</div>`;
        }

        // 操作按钮
        let actionsHtml = '';
        if (q.status === '未接取') {
          actionsHtml = `<div class="quest-actions">
            <button class="quest-action-btn primary" onclick="App.acceptQuest('${q.id}')">接取任务</button>
          </div>`;
        } else if (q.status === '可提交') {
          actionsHtml = `<div class="quest-actions">
            <button class="quest-action-btn primary" onclick="App.submitQuest('${q.id}')">提交任务</button>
          </div>`;
        } else if (q.status === '进行中' && q.canAbandon) {
          actionsHtml = `<div class="quest-actions">
            <button class="quest-action-btn danger" onclick="App.abandonQuest('${q.id}')">放弃任务</button>
          </div>`;
        }

        html += `<div class="quest-card status-${statusClass}">
          <div class="quest-name">
            ${this.escapeHtml(q.name)}
            <span class="quest-status ${q.status}">${q.status}</span>
          </div>
          ${deadlineText ? `<div class="quest-deadline ${isUrgent ? 'urgent' : ''}">⏰ ${deadlineText}</div>` : ''}
          <div class="quest-description">${this.escapeHtml(q.description)}</div>
          ${rewardHtml}
          ${penaltyHtml}
          ${subgoalsHtml}
          ${q.note ? `<div class="quest-note">${this.escapeHtml(q.note)}</div>` : ''}
          ${actionsHtml}
        </div>`;
      }
      html += '</div>';
    }

    list.innerHTML = html;
  },

  // 格式化截止时间
  formatDeadline(deadline) {
    const now = new Date();
    const dl = new Date(deadline);
    const diff = dl - now;
    if (diff < 0) return '已超时';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) {
      return dl.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    return `剩余${hours}小时${minutes}分钟`;
  },

  renderClueList() {
    const list = document.getElementById('clue-list');
    const clues = GameState.state.clues;
    if (!clues || clues.length === 0) {
      list.innerHTML = '<div class="list-empty">暂无线索记录</div>';
      return;
    }

    const typeOrder = ['environment', 'character', 'relic', 'fragment'];
    const typeNames = {
      environment: { name: '环境线索', icon: '🌿' },
      character: { name: '人物线索', icon: '👤' },
      relic: { name: '遗迹线索', icon: '🏛️' },
      fragment: { name: '残缺线索', icon: '🧩' },
    };

    let html = '';
    for (const type of typeOrder) {
      const typeClues = clues.filter(c => c.type === type);
      if (typeClues.length === 0) continue;

      const typeInfo = typeNames[type];
      html += `<div class="clue-category">
        <div class="clue-category-title ${type}">${typeInfo.icon} ${typeInfo.name}（${typeClues.length}）</div>`;

      for (const c of typeClues) {
        const statusClass = c.status === '已失效' ? 'status-invalidated' : c.status === '已上交' ? 'status-submitted' : '';
        const synthesizedClass = c.synthesized ? 'synthesized' : '';

        // 操作按钮
        let actionsHtml = '';
        if (c.canSubmit && !c.submitted && c.status !== '已失效') {
          actionsHtml = `<div class="clue-actions">
            <button class="clue-action-btn primary" onclick="App.submitClue('${c.id}')">上交学院</button>
          </div>`;
        }

        html += `<div class="clue-card ${statusClass} ${synthesizedClass}">
          <div class="clue-name">
            ${this.escapeHtml(c.name)}
            <span class="clue-level ${c.level}">${c.level}</span>
            <span class="clue-status">${c.status}</span>
          </div>
          <div class="clue-description">${this.escapeHtml(c.description)}</div>
          ${c.note ? `<div class="clue-note">${this.escapeHtml(c.note)}</div>` : ''}
          ${actionsHtml}
        </div>`;
      }
      html += '</div>';
    }

    if (!html) {
      html = '<div class="list-empty">暂无线索记录</div>';
    }

    list.innerHTML = html;
  },

  renderRelationList() {
    const list = document.getElementById('relation-list');
    const relations = GameState.state.relations;
    if (!relations || relations.length === 0) {
      list.innerHTML = '<div class="list-empty">暂无关系记录</div>';
      return;
    }

    const affinityClassMap = {
      '敌视': 'hostile', '冷淡': 'cold', '普通': 'normal',
      '熟悉': 'familiar', '友好': 'friendly', '信任': 'trust', '挚友': 'best'
    };

    list.innerHTML = relations.map(r => {
      const affinityClass = affinityClassMap[r.affinity] || 'normal';
      // 确保stance是数组（兼容旧存档的字符串格式）
      let stanceArray = r.stance;
      if (typeof stanceArray === 'string') {
        stanceArray = stanceArray.split(/[,，、]/).map(s => s.trim()).filter(s => s);
      } else if (!Array.isArray(stanceArray)) {
        stanceArray = [];
      }
      const stanceTags = stanceArray.map(s => `<span class="stance-tag">${this.escapeHtml(s)}</span>`).join('');
      const hiddenHint = r.hiddenBond ? '<div class="relation-hidden">✨ 已解锁隐藏羁绊</div>' : '';
      // 确保name字段存在，如果缺失则使用id或"未知人物"
      const displayName = r.name || r.id || '未知人物';

      return `
        <div class="relation-card ${r.isDead ? 'dead' : ''}">
          <div class="relation-name">
            ${this.escapeHtml(displayName)}
            <span class="relation-affinity ${affinityClass}">${this.escapeHtml(r.affinity)}</span>
          </div>
          <div class="relation-stance">${stanceTags}</div>
          <div class="relation-note">${this.escapeHtml(r.note || '暂无备注')}</div>
          ${hiddenHint}
        </div>
      `;
    }).join('');
  },

  renderInventoryList() {
    const inventory = GameState.state.player.inventory;
    const items = inventory.items || [];

    // 更新负重显示
    const currentWeight = GameState.getInventoryWeight();
    const maxWeight = GameState.getMaxWeight();
    const weightPercent = (currentWeight / maxWeight) * 100;
    document.getElementById('inventory-weight-text').textContent = currentWeight.toFixed(1) + ' / ' + maxWeight + ' kg';
    const weightBar = document.getElementById('weight-bar-fill');
    weightBar.style.width = Math.min(100, weightPercent) + '%';
    weightBar.className = 'weight-bar-fill';
    if (weightPercent >= 90) weightBar.classList.add('danger');
    else if (weightPercent >= 70) weightBar.classList.add('warning');

    // 按分类渲染
    const categories = ['quest', 'equipment', 'consumable', 'misc'];
    const categoryNames = { quest: '任务道具', equipment: '装备', consumable: '消耗品', misc: '杂物' };

    for (const cat of categories) {
      const listEl = document.getElementById('inventory-' + cat + '-list');
      const catItems = items.filter(item => item.category === cat);

      if (catItems.length === 0) {
        listEl.innerHTML = '<div class="list-empty" style="padding:8px;font-size:12px;">暂无' + categoryNames[cat] + '</div>';
        continue;
      }

      listEl.innerHTML = catItems.map(item => {
        const isQuest = item.category === 'quest';
        const quantityBadge = item.quantity > 1 ? `<span class="item-quantity">×${item.quantity}</span>` : '';
        const useBtn = item.canUse ? `<button class="item-action-btn use" onclick="event.stopPropagation();App.useItem('${item.id}')">使用</button>` : '';
        const discardBtn = item.canDiscard ? `<button class="item-action-btn discard" onclick="event.stopPropagation();App.discardItem('${item.id}')">丢弃</button>` : '';

        return `
          <div class="inventory-item ${isQuest ? 'quest-item' : ''}" onclick="App.showItemDetail('${item.id}')">
            <div class="item-info">
              <div class="item-name">${this.escapeHtml(item.name)}${quantityBadge}</div>
            </div>
            <div class="item-actions">
              ${useBtn}
              ${discardBtn}
            </div>
          </div>
        `;
      }).join('');
    }
  },

  renderAbilityList() {
    const list = document.getElementById('ability-list');
    const p = GameState.state.player;
    let html = '';

    // 显示言灵
    if (p.yanling && p.yanling !== '未觉醒') {
      html += `<div class="ability-item"><div class="ability-name">言灵：${this.escapeHtml(p.yanling)}<span class="ability-level">已觉醒</span></div></div>`;
    }

    // 显示所有能力分类
    const abilitiesData = p.abilitiesData;
    if (abilitiesData && abilitiesData.length > 0) {
      for (const category of abilitiesData) {
        html += `<div class="ability-category">
          <div class="ability-category-title">${this.escapeHtml(category.subcategory)}</div>`;

        for (const ability of category.abilities) {
          if (!ability.unlocked && ability.progress === 0) {
            // 未解锁的能力显示为灰色
            html += `<div class="ability-item locked">
              <div class="ability-name">🔒 ${this.escapeHtml(ability.name)}</div>
              <div class="ability-desc">${this.escapeHtml(ability.description)}</div>
              <div class="ability-progress-bar">
                <div class="ability-progress-fill" style="width:0%"></div>
              </div>
              <div class="ability-level-text">未解锁</div>
            </div>`;
          } else {
            const levelText = ability.passive ? '被动' : (ability.progress >= 80 ? '大师' : ability.progress >= 50 ? '高级' : ability.progress >= 25 ? '中级' : '初学');
            const dangerClass = ability.dangerous ? 'dangerous' : '';
            html += `<div class="ability-item ${dangerClass}">
              <div class="ability-name">${this.escapeHtml(ability.name)}<span class="ability-level">${levelText}</span></div>
              <div class="ability-desc">${this.escapeHtml(ability.description)}</div>
              <div class="ability-progress-bar">
                <div class="ability-progress-fill" style="width:${ability.progress}%"></div>
              </div>
              <div class="ability-level-text">熟练度：${Math.round(ability.progress)}%</div>
            </div>`;
          }
        }
        html += `</div>`;
      }
    }

    if (!html) {
      html = '<div class="list-empty">暂无能力记录</div>';
    }
    list.innerHTML = html;
  },

  renderFactionList() {
    const list = document.getElementById('faction-list');
    const reputation = GameState.state.reputation;
    const keys = Object.keys(reputation);
    if (keys.length === 0) {
      list.innerHTML = '<div class="list-empty">暂无声望记录</div>';
      return;
    }
    list.innerHTML = keys.map(k => {
      const f = reputation[k];
      const valuePercent = ((f.value + 100) / 200 * 100).toFixed(0);
      const levelClass = this.getReputationLevelClass(f.level);
      return `
        <div class="faction-item">
          <div class="faction-header">
            <span class="faction-name">${this.escapeHtml(f.name)}</span>
            <span class="faction-level ${levelClass}">${this.escapeHtml(f.level)}</span>
          </div>
          <div class="faction-bar">
            <div class="faction-bar-fill ${levelClass}" style="width:${valuePercent}%"></div>
          </div>
          <div class="faction-value">声望值：${f.value > 0 ? '+' : ''}${f.value}</div>
        </div>
      `;
    }).join('');
  },

  getReputationLevelClass(level) {
    const map = {
      '敌视': 'hostile',
      '冷淡': 'cold',
      '中立': 'neutral',
      '友善': 'friendly',
      '敬重': 'respect',
      '信赖': 'trust',
      '核心亲信': 'core',
      '未知': 'unknown'
    };
    return map[level] || 'neutral';
  },

  // 世界子标签切换
  switchWorldSubTab(subtab) {
    document.querySelectorAll('.sub-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.subtab === subtab);
    });
    document.querySelectorAll('.sub-tab-pane').forEach(pane => {
      pane.classList.toggle('active', pane.dataset.subtab === subtab);
    });
    // 清除对应红点
    if (subtab === 'worldNews') GameState.setUnread('worldNews', false);
    if (subtab === 'canonDeviation') GameState.setUnread('canonDeviation', false);
    if (subtab === 'foreshadowing') GameState.setUnread('foreshadowing', false);
    this.updateRedDots();
  },

  renderWorldPanel() {
    this.renderWorldNewsList();
    this.renderCanonDeviationList();
    this.renderForeshadowingList();
  },

  renderWorldNewsList() {
    const list = document.getElementById('world-news-list');
    const news = GameState.state.worldNews;
    if (!news || news.length === 0) {
      list.innerHTML = '<div class="list-empty">暂无世界消息</div>';
      return;
    }
    const categoryMap = {
      general: '综合',
      academy: '学院',
      dragon: '龙类',
      organization: '组织',
      npc: '人物',
      anomaly: '异常'
    };
    list.innerHTML = news.map(n => `
      <div class="world-news-item importance-${n.importance}">
        <div class="news-header">
          <span class="news-category">${categoryMap[n.category] || '综合'}</span>
          <span class="news-time">${this.escapeHtml(n.time)}</span>
        </div>
        <div class="news-title">${this.escapeHtml(n.title)}</div>
        <div class="news-content">${this.escapeHtml(n.content)}</div>
      </div>
    `).join('');
  },

  renderCanonDeviationList() {
    const list = document.getElementById('canon-deviation-list');
    const summary = document.getElementById('deviation-summary');
    const deviations = GameState.state.canonDeviation;

    // 更新摘要
    const butterflyLevel = GameState.state.world.butterflyLevel;
    summary.textContent = `${butterflyLevel} ${this.getButterflyDesc(butterflyLevel)} · 共${deviations.length}条偏差记录`;

    if (!deviations || deviations.length === 0) {
      list.innerHTML = '<div class="list-empty">暂无原著偏差记录</div>';
      return;
    }
    list.innerHTML = deviations.slice().reverse().map(d => `
      <div class="deviation-item level-${d.type}">
        <div class="deviation-header">
          <span class="deviation-level">${this.escapeHtml(d.level)}</span>
          <span class="deviation-time">${this.escapeHtml(d.time)}</span>
        </div>
        <div class="deviation-desc">${this.escapeHtml(d.description)}</div>
        ${d.originalEvent ? `<div class="deviation-detail">原著：${this.escapeHtml(d.originalEvent)}</div>` : ''}
        ${d.changedEvent ? `<div class="deviation-detail">当前：${this.escapeHtml(d.changedEvent)}</div>` : ''}
        ${d.impact ? `<div class="deviation-impact">影响：${this.escapeHtml(d.impact)}</div>` : ''}
        ${d.regressionAction ? `<div class="deviation-regression">回归建议：${this.escapeHtml(d.regressionAction)}</div>` : ''}
      </div>
    `).join('');
  },

  renderForeshadowingList() {
    const list = document.getElementById('foreshadowing-list');
    const foreshadowing = GameState.state.foreshadowing;
    if (!foreshadowing || foreshadowing.length === 0) {
      list.innerHTML = '<div class="list-empty">暂无伏笔追踪记录</div>';
      return;
    }
    const statusClassMap = {
      '未激活': 'inactive',
      '正在酝酿': 'brewing',
      '部分触发': 'partial',
      '已作废': 'invalid',
      '高危暗线': 'danger'
    };
    list.innerHTML = foreshadowing.slice().reverse().map(f => `
      <div class="foreshadow-item status-${statusClassMap[f.status] || 'inactive'}">
        <div class="foreshadow-header">
          <span class="foreshadow-title">${this.escapeHtml(f.title)}</span>
          <span class="foreshadow-status">${this.escapeHtml(f.status)}</span>
        </div>
        <div class="foreshadow-desc">${this.escapeHtml(f.description)}</div>
        <div class="foreshadow-meta">
          ${f.relatedNPC ? `<span>关联：${this.escapeHtml(f.relatedNPC)}</span>` : ''}
          <span>时间：${this.escapeHtml(f.time)}</span>
        </div>
        ${f.triggerCondition ? `<div class="foreshadow-trigger">触发条件：${this.escapeHtml(f.triggerCondition)}</div>` : ''}
      </div>
    `).join('');
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

  // ========== 红点提示 ==========
  updateRedDots() {
    // 快捷按钮红点
    const dotMap = {
      '任务': 'quest',
      '线索': 'clue',
      '关系': 'relation',
      '背包': 'inventory',
      '能力': 'ability',
    };
    document.querySelectorAll('.quick-btn').forEach(btn => {
      const text = btn.textContent.trim();
      const type = dotMap[text];
      if (type && GameState.hasUnread(type)) {
        if (!btn.querySelector('.red-dot')) {
          const dot = document.createElement('span');
          dot.className = 'red-dot';
          btn.appendChild(dot);
        }
      } else {
        const dot = btn.querySelector('.red-dot');
        if (dot) dot.remove();
      }
    });

    // 右侧面板标签红点
    const tabDotMap = {
      'faction': 'reputation',
      'world': ['worldNews', 'canonDeviation', 'foreshadowing'],
    };
    document.querySelectorAll('.tab-btn').forEach(btn => {
      const tab = btn.dataset.tab;
      const unreadType = tabDotMap[tab];
      let hasUnread = false;
      if (Array.isArray(unreadType)) {
        hasUnread = unreadType.some(t => GameState.hasUnread(t));
      } else if (unreadType) {
        hasUnread = GameState.hasUnread(unreadType);
      }
      if (hasUnread) {
        if (!btn.querySelector('.red-dot')) {
          const dot = document.createElement('span');
          dot.className = 'red-dot';
          btn.appendChild(dot);
        }
      } else {
        const dot = btn.querySelector('.red-dot');
        if (dot) dot.remove();
      }
    });
  },

  // ========== 补充角色设定 ==========
  openSupplementDialog() {
    const dialog = document.getElementById('supplement-dialog');
    const textarea = document.getElementById('supplement-text');
    textarea.value = GameState.state.player.supplementaryInfo || '';
    dialog.style.display = 'flex';
  },

  closeSupplementDialog(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById('supplement-dialog').style.display = 'none';
  },

  async submitSupplement() {
    const text = document.getElementById('supplement-text').value.trim();
    if (!text) {
      this.toast('请输入补充设定内容', 'error');
      return;
    }

    const settings = GameState.state.settings;
    const check = AIService.checkConfig(settings);
    if (!check.valid) {
      this.toast(check.message, 'error');
      return;
    }

    this.closeSupplementDialog();
    this.setGenerating(true);

    try {
      // 调用AI判断补充设定是否合理
      const worldState = this.buildWorldState();
      const playerAction = `【补充角色设定】玩家补充了以下角色设定：${text}。请判断这个设定是否符合当前龙族世界的世界观和玩家已有设定，如果合理请回复"设定已接受"，如果不合理请说明原因。`;
      const previousContext = '';

      const content = await AIService.generateNarrative(worldState, playerAction, previousContext, settings);

      // 判断AI反馈
      const isAccepted = content.includes('接受') || content.includes('合理') || content.includes('可以') || !content.includes('不合理') && !content.includes('拒绝');

      if (isAccepted) {
        GameState.setSupplementaryInfo(text);
        GameState.addNarrative('system', `【补充设定已接受】${text}`);
        this.showAIFeedback('success', '设定补充成功');
      } else {
        this.showAIFeedback('error', '设定不符合世界观');
        GameState.addNarrative('system', `【补充设定被拒绝】${content.slice(0, 100)}`);
      }

      this.renderNarrative();
      Storage.autosave(GameState.serialize());
    } catch (e) {
      console.error('补充设定失败:', e);
      this.showAIFeedback('error', '设定验证失败');
    } finally {
      this.setGenerating(false);
    }
  },

  // ========== AI反馈动画 ==========
  showAIFeedback(type, text) {
    const feedback = document.getElementById('ai-feedback');
    const icon = document.getElementById('feedback-icon');
    const textEl = document.getElementById('feedback-text');

    icon.className = 'feedback-icon ' + type;
    icon.textContent = type === 'success' ? '✓' : '✗';
    textEl.className = 'feedback-text ' + type;
    textEl.textContent = text;

    feedback.style.display = 'block';
    feedback.style.animation = 'none';
    feedback.offsetHeight; // 触发重绘
    feedback.style.animation = 'feedbackIn 0.4s ease, feedbackOut 0.5s ease 2.5s forwards';

    setTimeout(() => {
      feedback.style.display = 'none';
    }, 3200);
  },

  // ========== 背包操作 ==========
  _selectedItemId: null,

  // 使用物品
  useItem(itemId) {
    const item = GameState.state.player.inventory.items.find(i => i.id === itemId);
    if (!item) return;

    // 根据物品类型生成对应的行动文字
    const actionText = this.generateUseItemAction(item);

    // 先在本地应用物品效果（即时反馈）
    const result = GameState.useItem(itemId);
    if (result.success) {
      this.toast('使用了 ' + result.item.name, 'success');
      this.updateStatusPanel();
      this.updatePanelContent('inventory');
      if (result.reusable) {
        this.showPickupToast('success', '使用成功（可重复使用）', result.item.name + ' 已放回背包');
      } else {
        this.showPickupToast('success', '使用成功', result.item.name + ' ×1');
      }
    } else {
      this.toast(result.message || '无法使用该物品', 'error');
      return;
    }

    // 生成行动文字并提交给AI，让AI生成对应的剧情叙述
    const input = document.getElementById('player-input');
    if (input) {
      input.value = actionText;
    }
    // 延迟提交，让用户看到使用提示
    setTimeout(() => {
      this.submitAction();
    }, 500);
  },

  // 根据物品生成使用行动文字
  generateUseItemAction(item) {
    const name = item.name;
    const category = item.category;

    // 根据物品类别生成不同的行动描述
    if (category === 'consumable') {
      if (name.includes('绷带') || name.includes('急救')) {
        return `我使用${name}处理伤口`;
      }
      if (name.includes('营养棒') || name.includes('食物') || name.includes('水')) {
        return `我吃下${name}`;
      }
      if (name.includes('药剂') || name.includes('镇静')) {
        return `我服用${name}`;
      }
      if (name.includes('子弹') || name.includes('弹药')) {
        return `我装填${name}`;
      }
      return `我使用${name}`;
    }
    if (category === 'equipment') {
      if (name.includes('手电') || name.includes('灯')) {
        return `我打开${name}照亮周围`;
      }
      if (name.includes('武器') || name.includes('刀') || name.includes('枪')) {
        return `我拔出${name}准备战斗`;
      }
      if (name.includes('护腕') || name.includes('护甲')) {
        return `我戴上${name}`;
      }
      return `我装备${name}`;
    }
    if (category === 'misc') {
      if (name.includes('笔记本') || name.includes('书')) {
        return `我翻开${name}查看内容`;
      }
      if (name.includes('打火机')) {
        return `我用${name}点燃火源`;
      }
      if (name.includes('证件') || name.includes('卡')) {
        return `我出示${name}`;
      }
      return `我使用${name}`;
    }
    return `我使用${name}`;
  },

  // 丢弃物品
  discardItem(itemId) {
    const item = GameState.state.player.inventory.items.find(i => i.id === itemId);
    if (!item) return;
    if (!confirm('确定丢弃 ' + item.name + ' 吗？')) return;

    const result = GameState.removeItem(itemId);
    if (result.success) {
      this.toast('丢弃了 ' + result.item.name, 'info');
      this.updatePanelContent('inventory');
      this.showPickupToast('info', '丢弃物品', result.item.name);
    } else {
      this.toast(result.message || '无法丢弃该物品', 'error');
    }
  },

  // 显示物品详情
  showItemDetail(itemId) {
    const item = GameState.state.player.inventory.items.find(i => i.id === itemId);
    if (!item) return;

    this._selectedItemId = itemId;
    const categoryNames = { quest: '任务道具（不可丢弃）', equipment: '装备', consumable: '消耗品', misc: '杂物' };

    document.getElementById('detail-item-name').textContent = item.name;
    document.getElementById('detail-item-category').textContent = categoryNames[item.category] || '物品';
    document.getElementById('detail-item-desc').textContent = item.description || '无描述';
    document.getElementById('detail-item-quantity').textContent = item.quantity;
    document.getElementById('detail-item-weight').textContent = (item.weight * item.quantity).toFixed(2) + ' kg';

    // 显示/隐藏操作按钮
    const actionsEl = document.getElementById('detail-item-actions');
    let actionsHtml = '';
    if (item.canUse) actionsHtml += '<button class="btn btn-primary" onclick="App.useSelectedItem()">使用</button>';
    if (item.canDiscard) actionsHtml += '<button class="btn btn-outline" onclick="App.discardSelectedItem()">丢弃</button>';
    if (!actionsHtml) actionsHtml = '<div style="color:var(--text-secondary);font-size:13px;text-align:center;width:100%;">该物品无法操作</div>';
    actionsEl.innerHTML = actionsHtml;

    document.getElementById('item-detail-dialog').classList.add('show');
  },

  // 关闭物品详情
  closeItemDetail(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById('item-detail-dialog').classList.remove('show');
    this._selectedItemId = null;
  },

  // 使用选中的物品
  useSelectedItem() {
    if (this._selectedItemId) {
      this.useItem(this._selectedItemId);
      this.closeItemDetail();
    }
  },

  // 丢弃选中的物品
  discardSelectedItem() {
    if (this._selectedItemId) {
      this.discardItem(this._selectedItemId);
      this.closeItemDetail();
    }
  },

  // 显示拾取提示弹窗
  showPickupToast(type, title, itemsText) {
    const toast = document.getElementById('pickup-toast');
    const icon = document.getElementById('pickup-icon');
    const titleEl = document.getElementById('pickup-title');
    const itemsEl = document.getElementById('pickup-items');

    const icons = { success: '✅', warning: '⚠️', error: '❌', info: '📦' };
    icon.textContent = icons[type] || '✅';
    titleEl.textContent = title;
    itemsEl.textContent = itemsText;

    toast.className = 'pickup-toast ' + type;
    toast.offsetHeight; // 触发重绘
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  },

  // 拾取物品（供剧情调用）
  pickupItem(itemData) {
    const result = GameState.addItem(itemData);
    if (result.success) {
      const isQuest = itemData.category === 'quest';
      const type = isQuest ? 'warning' : 'success';
      const title = isQuest ? '获得任务道具' : '拾取成功';
      this.showPickupToast(type, title, itemData.name + (itemData.quantity > 1 ? ' ×' + itemData.quantity : ''));
      this.updatePanelContent('inventory');

      // 触发联动：背包更新 → 线索/任务/关系
      this.triggerLinkage('inventory', { ...itemData, ...result.item }, true);
    } else {
      this.showPickupToast('error', '拾取失败', result.message);
    }
    return result;
  },

  // ========== 关系系统操作 ==========
  // 显示关系更新提示弹窗
  showRelationToast(type, title, name, detail) {
    const toast = document.getElementById('relation-toast');
    const icon = document.getElementById('relation-toast-icon');
    const titleEl = document.getElementById('relation-toast-title');
    const nameEl = document.getElementById('relation-toast-name');
    const detailEl = document.getElementById('relation-toast-detail');

    const icons = {
      update: '🔄', up: '⬆️', down: '⬇️',
      warning: '⚠️', success: '✨', special: '🔒', hidden: '❓'
    };
    icon.textContent = icons[type] || '🔄';
    titleEl.textContent = title;
    nameEl.textContent = name;
    detailEl.textContent = detail;

    toast.className = 'relation-toast ' + type;
    toast.offsetHeight;
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  },

  // 更新关系（供剧情调用）
  updateRelation(npcId, updates, showToast = true) {
    const result = GameState.updateRelation(npcId, updates);
    if (result.success && showToast) {
      const r = result.relation;
      let type = 'update';
      let title = '关系更新';
      const stanceText = this.getStanceText(r.stance);
      let detail = `好感：${r.affinity}｜立场：${stanceText}`;

      if (updates.affinityDelta > 0) {
        type = 'up'; title = '好感上升';
      } else if (updates.affinityDelta < 0) {
        type = 'down'; title = '好感下降';
      } else if (updates.hiddenBond) {
        type = 'hidden'; title = '隐藏线索';
        detail = '你对' + r.name + '产生特殊直觉，更多信息需要后续剧情解锁';
      }

      this.showRelationToast(type, title, r.name, detail);
      this.updatePanelContent('relation');

      // 触发联动：关系更新 → 任务/线索/背包
      this.triggerLinkage('relation', r, true);
    }
    return result;
  },

  // 锁定关系（人物死亡）
  lockRelation(npcId, deathNote, showToast = true) {
    const result = GameState.lockRelation(npcId, deathNote);
    if (result.success && showToast) {
      const r = result.relation;
      this.showRelationToast('special', '关系锁定', r.name, '该人物已死亡，关系不再发生变化');
      this.updatePanelContent('relation');
    }
    return result;
  },

  // 添加新NPC关系
  addRelation(relationData, showToast = true) {
    const result = GameState.addRelation(relationData);
    if (result.success && showToast) {
      const r = result.relation;
      const stanceText = this.getStanceText(r.stance);
      this.showRelationToast('success', '新关系建立', r.name, `好感：${r.affinity}｜立场：${stanceText}`);
      this.updatePanelContent('relation');
    }
    return result;
  },

  // 安全获取立场文本（兼容字符串和数组格式）
  getStanceText(stance) {
    if (Array.isArray(stance)) {
      return stance.join('、');
    } else if (typeof stance === 'string') {
      return stance;
    }
    return '未知';
  },

  // ========== 任务系统操作 ==========
  // 显示任务更新提示弹窗
  showQuestToast(type, title, name, detail) {
    const toast = document.getElementById('quest-toast');
    const icon = document.getElementById('quest-toast-icon');
    const titleEl = document.getElementById('quest-toast-title');
    const nameEl = document.getElementById('quest-toast-name');
    const detailEl = document.getElementById('quest-toast-detail');

    const icons = {
      update: '🔄', accept: '📋', complete: '✅', fail: '❌',
      warning: '⚠️', main: '🔴', hidden: '✨', submit: '🎁', abandon: '🚪'
    };
    icon.textContent = icons[type] || '🔄';
    titleEl.textContent = title;
    nameEl.textContent = name;
    detailEl.textContent = detail;

    toast.className = 'quest-toast ' + type;
    toast.offsetHeight;
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  },

  // 接取任务
  acceptQuest(questId) {
    const result = GameState.updateQuest(questId, { status: '进行中' });
    if (result.success) {
      const q = result.quest;
      this.showQuestToast('accept', '已接取任务', q.name, q.deadline ? '截止：' + this.formatDeadline(q.deadline) : '无时间限制');
      this.updatePanelContent('quest');
      this.updateCurrentQuest();
    }
    return result;
  },

  // 提交任务
  submitQuest(questId) {
    const quest = GameState.getQuest(questId);
    if (!quest) return;

    const result = GameState.updateQuest(questId, { status: '已完成' });
    if (result.success) {
      const q = result.quest;
      let rewardText = '任务完成';
      if (q.reward) {
        const rewards = [];
        if (q.reward.credit) rewards.push('学分+' + q.reward.credit);
        if (q.reward.executionPoints) rewards.push('执行部积分+' + q.reward.executionPoints);
        if (rewards.length > 0) rewardText = '获得：' + rewards.join('、');
      }
      this.showQuestToast('submit', '任务完成', q.name, rewardText);
      this.updatePanelContent('quest');
      this.updateCurrentQuest();
    }
    return result;
  },

  // 放弃任务
  abandonQuest(questId) {
    const quest = GameState.getQuest(questId);
    if (!quest) return;
    if (!confirm('确定放弃任务「' + quest.name + '」吗？')) return;

    const result = GameState.updateQuest(questId, { status: '已放弃' });
    if (result.success) {
      this.showQuestToast('abandon', '已放弃任务', quest.name, '可随时重新接取');
      this.updatePanelContent('quest');
      this.updateCurrentQuest();
    }
    return result;
  },

  // 更新任务（供剧情调用）
  updateQuest(questId, updates, showToast = true) {
    const result = GameState.updateQuest(questId, updates);
    if (result.success && showToast) {
      const q = result.quest;
      let type = 'update';
      let title = '任务更新';
      if (updates.status === '可提交') { type = 'complete'; title = '任务条件达成'; }
      else if (updates.status === '失败') { type = 'fail'; title = '任务失败'; }
      else if (q.type === 'main') { type = 'main'; title = '主线任务更新'; }
      else if (q.type === 'hidden') { type = 'hidden'; title = '隐藏任务'; }

      this.showQuestToast(type, title, q.name, '状态：' + q.status);
      this.updatePanelContent('quest');
      this.updateCurrentQuest();

      // 触发联动：任务更新 → 线索/关系/背包
      this.triggerLinkage('quest', q, true);
    }
    return result;
  },

  // 更新子目标（供剧情调用）
  updateSubGoal(questId, subGoalId, completed, showToast = true) {
    const result = GameState.updateSubGoal(questId, subGoalId, completed);
    if (result.success && showToast) {
      const q = result.quest;
      const sg = result.subGoal;
      if (completed) {
        this.showQuestToast('complete', '子目标完成', q.name, sg.text);
      }
      this.updatePanelContent('quest');
    }
    return result;
  },

  // 添加新任务（供剧情调用）
  addQuest(questData, showToast = true) {
    const result = GameState.addQuest(questData);
    if (result.success && showToast) {
      const q = result.quest;
      const type = q.type === 'hidden' ? 'hidden' : q.type === 'main' ? 'main' : 'accept';
      const title = q.type === 'hidden' ? '隐藏任务解锁' : q.type === 'main' ? '主线任务开启' : '新任务';
      this.showQuestToast(type, title, q.name, q.description.slice(0, 30) + '...');
      this.updatePanelContent('quest');
    }
    return result;
  },

  // 检查超时任务
  checkExpiredQuests() {
    const expired = GameState.checkExpiredQuests();
    for (const q of expired) {
      this.showQuestToast('fail', '任务超时失败', q.name, '惩罚已生效');
    }
    if (expired.length > 0) {
      this.updatePanelContent('quest');
      this.updateCurrentQuest();
    }
    return expired;
  },

  // 更新当前任务显示
  updateCurrentQuest() {
    const activeQuest = GameState.state.quests.find(q => q.status === '进行中' || q.status === '可提交');
    const el = document.getElementById('status-quest');
    if (el) {
      el.textContent = activeQuest ? activeQuest.name : '无进行中任务';
    }
  },

  // ========== 线索系统操作 ==========
  // 显示线索更新提示弹窗
  showClueToast(type, title, name, detail) {
    const toast = document.getElementById('clue-toast');
    const icon = document.getElementById('clue-toast-icon');
    const titleEl = document.getElementById('clue-toast-title');
    const nameEl = document.getElementById('clue-toast-name');
    const detailEl = document.getElementById('clue-toast-detail');

    const icons = {
      update: '🔍', new: '✨', important: '⚠️', key: '🔴',
      fragment: '🧩', synthesize: '🔮', invalidated: '💨', submit: '📤'
    };
    icon.textContent = icons[type] || '🔍';
    titleEl.textContent = title;
    nameEl.textContent = name;
    detailEl.textContent = detail;

    toast.className = 'clue-toast ' + type;
    toast.offsetHeight;
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  },

  // 添加线索（供剧情调用）
  addClue(clueData, showToast = true) {
    const result = GameState.addClue(clueData);
    if (result.success && showToast) {
      const c = result.clue;
      let type = 'new';
      let title = '线索记录';
      if (c.level === '关键') { type = 'key'; title = '关键线索获取'; }
      else if (c.level === '重要') { type = 'important'; title = '重要线索'; }
      else if (c.type === 'fragment') { type = 'fragment'; title = '残缺线索'; }

      this.showClueToast(type, title, c.name, c.description.slice(0, 40) + '...');
      this.updatePanelContent('clue');

      // 触发联动：线索更新 → 任务/关系/背包
      this.triggerLinkage('clue', c, true);
    } else if (!result.success && result.reason === 'exists' && showToast) {
      this.showClueToast('update', '线索已存在', result.clue.name, '该线索已记录在案');
    }
    return result;
  },

  // 更新线索（供剧情调用）
  updateClue(clueId, updates, showToast = true) {
    const result = GameState.updateClue(clueId, updates);
    if (result.success && showToast) {
      const c = result.clue;
      if (updates.status === '已失效') {
        this.showClueToast('invalidated', '线索状态变更', c.name, '现场痕迹已销毁，仅留存观测记录');
      } else {
        this.showClueToast('update', '线索更新', c.name, '线索信息已更新');
      }
      this.updatePanelContent('clue');
    }
    return result;
  },

  // 标记线索失效
  invalidateClue(clueId, reason, showToast = true) {
    const result = GameState.invalidateClue(clueId, reason);
    if (result.success && showToast) {
      this.showClueToast('invalidated', '线索失效', result.clue.name, reason || '现场痕迹已销毁');
      this.updatePanelContent('clue');
    }
    return result;
  },

  // 上交线索
  submitClue(clueId) {
    const clue = GameState.getClue(clueId);
    if (!clue) return;

    const result = GameState.submitClue(clueId);
    if (result.success) {
      let rewardText = '线索已提交';
      if (result.reward) {
        const rewards = [];
        if (result.reward.credit) rewards.push('学分+' + result.reward.credit);
        if (result.reward.executionPoints) rewards.push('执行部积分+' + result.reward.executionPoints);
        if (rewards.length > 0) rewardText = '获得：' + rewards.join('、');
      }
      this.showClueToast('submit', '提交线索', clue.name, rewardText);
      this.updatePanelContent('clue');
      this.toast(rewardText, 'success');
    } else {
      this.toast(result.message || '无法提交该线索', 'error');
    }
    return result;
  },

  // 线索合成（供剧情调用）
  synthesizeClues(clueIds, resultClueData, showToast = true) {
    const result = GameState.synthesizeClues(clueIds, resultClueData);
    if (result.success && showToast) {
      this.showClueToast('synthesize', '线索合成成功', result.result.name, '多条碎片合并，解锁完整情报');
      this.updatePanelContent('clue');
    } else if (!result.success && showToast) {
      this.toast('线索合成失败：' + (result.reason || '未知错误'), 'error');
    }
    return result;
  },

  // ========== 四大板块联动系统 ==========
  // 联动记录，避免重复弹窗
  _linkageLog: [],

  // 触发联动更新（核心入口）
  // source: clue/quest/relation/inventory
  // data: 触发联动的数据
  triggerLinkage(source, data, showToast = true) {
    const linkageKey = source + '_' + (data.id || data.name || Date.now());
    // 避免短时间内重复联动
    if (this._linkageLog.includes(linkageKey)) return;
    this._linkageLog.push(linkageKey);
    if (this._linkageLog.length > 50) this._linkageLog.shift();

    const updates = { clue: false, quest: false, relation: false, inventory: false };

    // 根据触发源执行联动
    switch (source) {
      case 'clue':
        Object.assign(updates, this.linkageFromClue(data));
        break;
      case 'quest':
        Object.assign(updates, this.linkageFromQuest(data));
        break;
      case 'relation':
        Object.assign(updates, this.linkageFromRelation(data));
        break;
      case 'inventory':
        Object.assign(updates, this.linkageFromInventory(data));
        break;
    }

    // 刷新所有有变动的板块
    if (updates.clue) this.updatePanelContent('clue');
    if (updates.quest) { this.updatePanelContent('quest'); this.updateCurrentQuest(); }
    if (updates.relation) this.updatePanelContent('relation');
    if (updates.inventory) this.updatePanelContent('inventory');

    // 联动弹窗提示
    if (showToast && (updates.quest || updates.relation || updates.inventory)) {
      this.showLinkageToast(source, updates);
    }

    return updates;
  },

  // 线索更新触发的联动
  linkageFromClue(clueData) {
    const updates = { quest: false, relation: false, inventory: false };

    if (!clueData) return updates;

    // 1. 新线索 = 任务进度自动涨
    // 查找进行中的调查类任务，自动推进进度
    const investigationQuests = GameState.state.quests.filter(q =>
      q.status === '进行中' &&
      (q.name.includes('排查') || q.name.includes('调查') || q.name.includes('痕迹'))
    );
    for (const quest of investigationQuests) {
      if (quest.subGoals && quest.subGoals.length > 0) {
        const firstIncomplete = quest.subGoals.find(s => !s.completed);
        if (firstIncomplete) {
          GameState.updateSubGoal(quest.id, firstIncomplete.id, true);
          updates.quest = true;
        }
      }
    }

    // 2. 关键线索 = 解锁新任务/隐藏任务
    if (clueData.level === '关键') {
      // 检查是否有对应未解锁的主线任务
      const lockedMainQuest = GameState.state.quests.find(q =>
        q.type === 'main' && q.status === '未解锁'
      );
      if (lockedMainQuest && clueData.type === 'relic') {
        GameState.updateQuest(lockedMainQuest.id, { status: '进行中' });
        updates.quest = true;
      }
    }

    // 3. 目击人物秘密 = 同步更新人物关系备注
    if (clueData.type === 'character') {
      // 检查线索名称中是否包含已知人物名
      const knownNames = ['路明非', '楚子航', '恺撒', '芬格尔', '诺诺', '夏弥', '零'];
      for (const name of knownNames) {
        if (clueData.name.includes(name) || clueData.description.includes(name)) {
          const npcIdMap = { '路明非': 'lu_mingfei', '楚子航': 'chu_zihang', '恺撒': 'caesar', '芬格尔': 'finger' };
          const npcId = npcIdMap[name];
          if (npcId) {
            const relation = GameState.getRelation(npcId);
            if (relation) {
              const newNote = relation.note + '\n【观测记录】' + clueData.name + '：' + clueData.description.slice(0, 30);
              GameState.updateRelation(npcId, { note: newNote });
              updates.relation = true;
            }
          }
          break;
        }
      }
    }

    return updates;
  },

  // 任务更新触发的联动
  linkageFromQuest(questData) {
    const updates = { clue: false, relation: false, inventory: false };

    if (!questData) return updates;

    // 1. 任务推进 → 解锁新探索线索
    if (questData.status === '进行中' && questData.subGoals) {
      // 子目标完成时可能解锁新线索（由剧情手动调用addClue）
    }

    // 2. 任务合作/对立 → 改变人物好感立场
    if (questData.status === '已完成' && questData.reward) {
      // 任务完成时检查是否有关系奖励
      if (questData.reward.relation) {
        const relReward = questData.reward.relation;
        GameState.updateRelation(relReward.npcId, {
          affinityDelta: relReward.affinityDelta || 1,
          stance: relReward.stance ? (Array.isArray(relReward.stance) ? relReward.stance : [relReward.stance]) : undefined,
          stanceAction: relReward.stance ? 'add' : undefined
        });
        updates.relation = true;
      }
    }

    // 3. 任务完成 → 发放背包奖励、学分物资
    if (questData.status === '已完成' && questData.reward) {
      if (questData.reward.items && Array.isArray(questData.reward.items)) {
        for (const item of questData.reward.items) {
          GameState.addItem(item);
          updates.inventory = true;
        }
      }
    }

    return updates;
  },

  // 关系更新触发的联动
  linkageFromRelation(relationData) {
    const updates = { quest: false, clue: false, inventory: false };

    if (!relationData) return updates;

    // 1. 关系变化 → 改变后续任务互动剧情（由剧情生成时读取关系状态）
    // 2. 挚友/战友 → 触发隐藏协作加成（记录在关系备注中）
    if (relationData.affinityLevel >= 5 || (relationData.stance && relationData.stance.includes('战友'))) {
      // 协作加成记录在关系中，战斗时可读取
    }

    // 3. 敌视/仇人 → 部分学院任务无法组队
    if (relationData.affinityLevel <= 1 || (relationData.stance && relationData.stance.includes('仇人'))) {
      // 标记相关任务不可组队（由任务系统检查）
    }

    return updates;
  },

  // 背包更新触发的联动
  linkageFromInventory(itemData) {
    const updates = { clue: false, quest: false, relation: false };

    if (!itemData) return updates;

    // 1. 获得关键道具 → 直接解锁主线新线索、新任务
    if (itemData.category === 'quest' || itemData.isKeyItem) {
      // 检查是否有对应未解锁的主线任务
      const lockedMainQuest = GameState.state.quests.find(q =>
        q.type === 'main' && q.status === '未解锁'
      );
      if (lockedMainQuest && (itemData.name.includes('钥匙') || itemData.name.includes('青铜'))) {
        GameState.updateQuest(lockedMainQuest.id, { status: '进行中' });
        updates.quest = true;

        // 同时添加关键线索
        GameState.addClue({
          id: 'clue_' + itemData.id,
          name: itemData.name + '相关线索',
          type: 'relic',
          level: '关键',
          description: '通过获得' + itemData.name + '，解锁了新的遗迹探索线索。'
        });
        updates.clue = true;
      }
    }

    // 2. 消耗物资 → 影响后续任务生存能力（由状态系统处理）

    return updates;
  },

  // 联动弹窗提示
  showLinkageToast(source, updates) {
    const messages = [];
    if (updates.clue && source !== 'clue') messages.push('线索已更新');
    if (updates.quest && source !== 'quest') messages.push('任务进度同步更新');
    if (updates.relation && source !== 'relation') messages.push('人物关系数据变更');
    if (updates.inventory && source !== 'inventory') messages.push('背包物资更新');

    if (messages.length === 0) return;

    // 使用通用toast显示联动信息
    const isKey = updates.quest && source === 'inventory';
    const prefix = isKey ? '【关键联动】' : '【联动刷新】';
    this.toast(prefix + messages.join('，'), isKey ? 'success' : 'info');
  },

  // ========== 每轮状态更新 ==========
  updateStatusPerTurn() {
    // 每轮对话后检索并更新状态
    const p = GameState.state.player;
    const s = GameState.state;

    // 确保状态值在合理范围
    p.health = Math.max(0, Math.min(100, p.health || 100));
    p.mental = Math.max(0, Math.min(100, p.mental || 100));
    p.stamina = Math.max(0, Math.min(100, p.stamina || 100));
    p.sanity = Math.max(0, Math.min(100, p.sanity || 100));
    p.lossOfControl = Math.max(0, Math.min(100, p.lossOfControl || 0));

    // 检查各板块是否有更新（数量增加）
    if (!this._lastStateCounts) {
      this._lastStateCounts = {
        quests: 0, clues: 0, relations: 0,
        carried: 0, uncurried: 0, abilities: 0, abilityProgress: 0
      };
    }

    const carriedCount = p.inventory?.items?.length || 0;
    const uncurriedCount = 0;

    // 计算能力总进度（用于检测变化）
    let totalAbilityProgress = 0;
    if (p.abilitiesData) {
      for (const cat of p.abilitiesData) {
        for (const ab of cat.abilities) {
          totalAbilityProgress += ab.progress || 0;
        }
      }
    }

    // 任务有更新
    if (s.quests.length > this._lastStateCounts.quests) {
      GameState.setUnread('quest', true);
    }
    // 线索有更新
    if (s.clues.length > this._lastStateCounts.clues) {
      GameState.setUnread('clue', true);
    }
    // 关系有更新
    if (s.relations.length > this._lastStateCounts.relations) {
      GameState.setUnread('relation', true);
    }
    // 背包有更新
    if (carriedCount > this._lastStateCounts.carried || uncurriedCount > this._lastStateCounts.uncurried) {
      GameState.setUnread('inventory', true);
    }
    // 能力有更新（数量或进度变化）
    if (totalAbilityProgress > this._lastStateCounts.abilityProgress) {
      GameState.setUnread('ability', true);
    }

    // 更新记录的数量
    this._lastStateCounts = {
      quests: s.quests.length,
      clues: s.clues.length,
      relations: s.relations.length,
      carried: carriedCount,
      uncurried: uncurriedCount,
      abilities: p.abilities?.length || 0,
      abilityProgress: totalAbilityProgress
    };

    // 更新状态栏
    this.updateStatusPanel();

    // 检查超时任务
    this.checkExpiredQuests();

    // 更新所有板块内容，确保展示最新数据
    this.updateAllPanels();

    // 更新红点
    this.updateRedDots();
  },
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  GameState.init();
  App.init();
});