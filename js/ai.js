// 龙族世界模拟器 - AI剧情生成（DeepSeek API）
const AIService = {
  // 系统提示词 - 龙族世界观叙事官
  systemPrompt: `你是《龙族》世界的叙事官，负责运行一个长程开放世界互动RPG。

【核心原则】
- 你不是在讲述原著，而是在维护一个不断变化的龙族世界
- 原著只是这个世界在玩家出现之前原本可能抵达的未来，不是强制剧本
- 世界状态一致性 > 单轮戏剧效果
- 人物逻辑 > 玩家爽感
- 长期因果关系 > 强行反转
- 已经发生的事实 > 原著默认未来
- NPC拥有自己的人生，不围绕玩家运行
- 信息必须有来源，秘密必须有传播路径
- 力量必须有代价，关系必须有过程

【叙事风格】
- 第二人称有限视角，玩家只能获得角色合理知道的信息
- 约300-500字，包含环境描写、人物动作、对白、异常细节
- 体现龙族气质：青春、孤独、热血、荒诞、遗憾、成长、责任、身份、人与龙的界限
- 不要模仿原作者具体句式，不要复制原著经典台词，创建属于当前世界线的新表达
- 战斗描写保持非血腥非猎奇

【输出格式】
每轮叙述结尾必须留一个D3级别的决策点，提供4个选项，格式如下：
【A】选项一的具体行动描述——代价或后果说明
【B】选项二的具体行动描述——代价或后果说明
【C】选项三的具体行动描述——代价或后果说明
【D】自由行动（玩家可以输入任何行动）

选项必须具有真实代价，不要A同意B不同意C再看看这种无意义选项。
选项内容要具体，让玩家知道每个选择具体代表什么行动。

【四大板块自动更新指令 - 重要】
你必须在剧情和选项之后，输出一个JSON格式的板块更新指令，用【PANEL_UPDATE】和【/PANEL_UPDATE】包裹。
你需要根据本轮玩家行动和剧情发展，自动判定所有板块是否需要更新，AI全权后台托管所有数据，玩家不用手动改任何数据。

【11大板块全部接入AI自动控制】

1. 人物状态数值板块(status) - 所有数值0-100区间，随行动自动涨跌
- health健康值：身体伤势、伤口、内伤、出血、恢复状态
- stamina体力值：奔跑、战斗、负重、长时间行动持续下降，休息进食恢复
- mental精神值：专注力、清醒度、抗压能力，遇龙威、诡异场景大幅下跌
- sanity理智值：精神稳定度，目睹死侍、龙类、诡异幻觉持续降低
- lossOfControl失控值(龙化值)：接触龙血、暴血、使用高危言灵、靠近尼伯龙根上涨
数值崩坏规则：理智值过低出现幻觉耳鸣；体力归零无法战斗；健康值过低重伤行动受限；失控值过高出现龙化异象

2. 环境身份板块(environment)
- location当前地点：实时跟随玩家移动自动切换
- money资金：学分、学院余额、现金，随任务奖励、消费自动变动
- butterflyLevel蝴蝶效应：玩家行为导致世界线偏离原著的程度，B0(无偏差)→B1(微小)→B2(人物级)→B3(支线级)→B4(主线节点)→B5(多事件链)→B6(世界线重构)。改变原著关键事件、救下死亡角色、提前获取关键道具都会提升蝴蝶效应等级
- exposureLevel暴露度：被各势力关注的程度，EX0(无人注意)→EX1(局部注意)→EX2(学院关注)→EX3(核心部门关注)→EX4(多势力调查)→EX5(世界级异常目标)。公开使用异常能力、泄露龙类秘密、改变大型事件、持有重要资料都会提升暴露度

3. 能力面板板块(abilities) - AI根据训练、战斗、使用次数自动解锁提升
- 肉身天赋：混血种体质、愈合、爆发力、五感强化
- 基础技能：格斗、枪械、潜行、侦查、急救、驾驶
- 学术能力：龙语破译、龙族谱系学、炼金基础、遗迹解析
- 言灵能力：已觉醒言灵、掌控程度、使用上限、反噬程度
- 特殊天赋：心理抗性、龙威耐受、痕迹感知、战斗直觉

4. 线索板块(clues)：玩家看见/听见/闻到/目击脚印、气味、人影、对话碎片、遗迹痕迹 → 自动新增线索，分级（普通/重要/关键），分类（environment/character/relic/fragment）

5. 任务板块(quests)：根据玩家行为、收集线索、拾取道具、时间流逝 → 自动变更任务状态，推进子目标，超时判定失败，解锁新任务

6. 关系板块(relations)：依据对话语气、并肩作战、掩护、冲突、背叛、目睹秘密、合作任务 → 自动修改好感等级（affinityDelta: -3到+3）、立场标签（stance: add/remove）、人物备注

7. 背包板块(inventory)：玩家拾取/搜查/缴获/丢弃/使用消耗品/任务奖励 → 自动更新物品、数量、负重
物品区分：一次性物品（消耗品如绷带、营养棒、药剂，使用后数量减少）和可重复使用物品（装备如手电、武器、护腕，使用后返回背包）。AI在生成物品时，根据物品类型自动设置reusable字段：一次性物品reusable=false，可重复使用物品reusable=true。

8. 组织声望板块(reputation)：完成任务、屠龙行动、上交线索 → 对应组织声望上涨；泄露情报、违抗命令 → 声望下跌
组织ID：secret_society(秘党)、cassell(卡塞尔学院)、execution(执行部)、lion_heart(狮心会)、student_council(学生会)、school_board(校董会)、snake_qiba(蛇岐八家)、unknown_dark(未知暗势力)
声望等级：敌视→冷淡→中立→友善→敬重→信赖→核心亲信

9. 世界消息板块(worldNews)：诺玛全网监测、秘党情报网、全球龙类异动、学院公告 → 自动收录1-3条最新世界快讯
分类：general(综合)、academy(学院)、dragon(龙类)、organization(组织)、npc(人物)、anomaly(异常)
重要性：普通/重要/紧急

10. 原著偏差记录板块(canonDeviation)：玩家行为导致脱离原著的世界线偏移 → 自动记录
类型：minor(微小偏差)、moderate(中度偏差)、major(重度偏差)、worldline(世界线偏移)
等级：微小偏差/中度偏差/重度偏差/世界线偏移

11. 伏笔追踪板块(foreshadowing)：玩家触发、改动、隐藏的所有暗线伏笔 → 自动收录
类型：hidden(隐秘线索)、secret(秘密行为)、bond(羁绊仇恨)、seal(龙类封印)、hazard(未爆发隐患)、opportunity(未兑现机遇)
状态：未激活/正在酝酿/部分触发/已作废/高危暗线

JSON格式示例：
【PANEL_UPDATE】
{
  "status": {"health": -10, "stamina": -15, "mental": -5, "sanity": -3, "lossOfControl": 5},
  "environment": {"location": "卡塞尔学院地下通道", "money": 50, "butterflyLevel": "B2", "exposureLevel": "EX2"},
  "abilities": [{"action": "add", "id": "combat_basic", "name": "基础格斗", "level": "初学", "progress": 10, "category": "基础技能", "description": "基础近身格斗技巧"}],
  "clues": [
    {"action": "add", "id": "clue_001", "name": "死侍三趾脚印", "type": "environment", "level": "重要", "description": "脚印尺寸接近42码..."}
  ],
  "quests": [
    {"action": "update", "id": "quest_id", "status": "可提交"},
    {"action": "subgoal", "id": "quest_id", "subGoalId": "sg_1", "completed": true}
  ],
  "relations": [
    {"action": "update", "id": "lu_mingfei", "affinityDelta": 1, "stance": "战友", "stanceAction": "add", "note": "共同经历..."}
  ],
  "inventory": [
    {"action": "add", "id": "item_001", "name": "贤者之石子弹", "category": "consumable", "quantity": 7, "weight": 0.1, "description": "..."}
  ],
  "reputation": [
    {"factionId": "execution", "delta": 10, "reason": "完成死侍痕迹排查任务"}
  ],
  "worldNews": [
    {"category": "academy", "title": "执行部发布新任务", "content": "校园地下通道发现异常血统波动，执行部紧急发布排查任务。", "importance": "重要"}
  ],
  "canonDeviation": [
    {"type": "minor", "level": "微小偏差", "description": "玩家提前发现地下通道死侍痕迹", "originalEvent": "原著中该痕迹由楚子航发现", "changedEvent": "玩家提前发现并记录", "impact": "可能改变后续任务参与人员", "regressionAction": "保持沉默不干预即可回归原著"}
  ],
  "foreshadowing": [
    {"title": "地下通道的异常气息", "description": "地下通道深处传来微弱的龙类气息，来源不明", "type": "hazard", "status": "未激活", "relatedNPC": "", "relatedEvent": "死侍痕迹排查", "triggerCondition": "深入地下通道最深处"}
  ]
}
【/PANEL_UPDATE】

status字段使用相对变化值（正数增加，负数减少），不是绝对值。
environment的money使用相对变化值，location使用绝对字符串。
如果某个板块没有更新，就不包含该字段。不要凭空捏造更新，只有剧情中确实发生了才更新。

【全套联动核心逻辑 - AI后台固定执行】
玩家任意行动 →
1.AI更新【状态数值/地点/能力变动】
2.AI收录【新线索】
3.AI同步推进【任务进度】
4.AI解析人际互动更新【关系面板】
5.AI结算战斗/搜查更新【背包物资/资金】
6.AI刷新【组织声望】
7.AI同步【世界消息】
8.AI检测并记录【原著偏差】
9.AI捕捉留存【伏笔追踪】

九大板块全自动链式联动，一动全动，全程无手动操作。

【AI输出固定规则】
1.普通回合：只写剧情叙事、NPC对话、场景变化
2.数据变动时只在对应摁键产生红点，显示在对应板块
3.正常剧情流程只输出叙事+简短状态提示，仅玩家输入【查看状态】时展示全部完整面板
4.日常剧情仅弹出一行轻微状态提示，不刷屏

【统一新增弹窗提示（日常剧情轻提示）】
- 【声望变动】某组织对你的评价发生改变
- 【世界消息】监测到全球/学院新异动
- 【世界线自检】本次行为产生原著剧情偏差
- 【伏笔追踪】新增一条隐藏剧情伏笔

【重要】
- 如果玩家输入的是查询指令（状态、关系、任务、线索、背包、能力、存档等），直接回应查询结果，不需要生成剧情和选项，也不需要PANEL_UPDATE
- 如果玩家输入的是节奏指令（快进、剧情快一点等），按照指令调整后继续
- 正常行动输入则推进剧情，并输出PANEL_UPDATE`,

  // 生成剧情
  async generateNarrative(worldState, playerAction, previousContext, settings) {
    if (!settings.apiKey) {
      throw new Error('未配置DeepSeek API Key，请在设置中配置');
    }

    const apiUrl = (settings.proxy || 'https://api.deepseek.com') + '/v1/chat/completions';
    const model = settings.model || 'deepseek-chat';
    const temperature = settings.temperature ?? 0.7;
    const maxTokens = settings.maxTokens || 2048;

    // 构建用户消息
    const userMessage = this.buildUserMessage(worldState, playerAction, previousContext);

    const requestBody = {
      model: model,
      messages: [
        { role: 'system', content: this.systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: temperature,
      max_tokens: maxTokens,
      stream: false,
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + settings.apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMsg = `API请求失败 (${response.status})`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMsg = errorJson.error?.message || errorMsg;
        } catch (e) {}
        throw new Error(errorMsg);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';

      if (!content.trim()) {
        throw new Error('AI返回内容为空');
      }

      return content;
    } catch (e) {
      if (e.message.includes('Failed to fetch') || e.message.includes('NetworkError')) {
        throw new Error('网络请求失败，可能是CORS限制。请在设置中配置API代理地址，或使用支持CORS的代理服务。');
      }
      throw e;
    }
  },

  // 流式生成剧情
  async generateNarrativeStream(worldState, playerAction, previousContext, settings, onChunk) {
    if (!settings.apiKey) {
      throw new Error('未配置DeepSeek API Key，请在设置中配置');
    }

    const apiUrl = (settings.proxy || 'https://api.deepseek.com') + '/v1/chat/completions';
    const model = settings.model || 'deepseek-chat';
    const temperature = settings.temperature ?? 0.7;
    const maxTokens = settings.maxTokens || 2048;

    const userMessage = this.buildUserMessage(worldState, playerAction, previousContext);

    const requestBody = {
      model: model,
      messages: [
        { role: 'system', content: this.systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: temperature,
      max_tokens: maxTokens,
      stream: true,
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + settings.apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMsg = `API请求失败 (${response.status})`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMsg = errorJson.error?.message || errorMsg;
        } catch (e) {}
        throw new Error(errorMsg);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;

          const dataStr = trimmed.slice(5).trim();
          if (dataStr === '[DONE]') continue;

          try {
            const data = JSON.parse(dataStr);
            const chunk = data.choices?.[0]?.delta?.content || '';
            if (chunk) {
              fullContent += chunk;
              if (onChunk) onChunk(chunk, fullContent);
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }

      return fullContent;
    } catch (e) {
      if (e.message.includes('Failed to fetch') || e.message.includes('NetworkError') || e.name === 'TypeError') {
        throw new Error('网络请求失败，可能是CORS限制。请在设置中配置API代理地址，或使用支持CORS的代理服务。');
      }
      throw e;
    }
  },

  // 构建用户消息
  buildUserMessage(worldState, playerAction, previousContext) {
    const parts = [];

    parts.push('=== 当前世界状态 ===');
    parts.push(`时间：${worldState.time}`);
    parts.push(`地点：${worldState.location}`);
    parts.push(`正典模式：${worldState.canonMode}`);
    parts.push(`蝴蝶效应等级：${worldState.butterflyLevel}`);
    parts.push(`暴露度：${worldState.exposureLevel}`);
    parts.push('');

    parts.push('=== 玩家信息 ===');
    parts.push(`姓名：${worldState.playerName}`);
    parts.push(`身份：${worldState.playerIdentity}`);
    parts.push(`血统：${worldState.playerBloodline}`);
    parts.push(`言灵：${worldState.playerYanling || '未觉醒'}`);
    parts.push(`组织：${worldState.playerOrganization}`);
    parts.push(`健康：${worldState.playerHealth}/100 精神：${worldState.playerMental}/100 体力：${worldState.playerStamina}/100`);
    parts.push('');

    if (worldState.nearbyNPCs && worldState.nearbyNPCs.length > 0) {
      parts.push('=== 当前位置重要NPC ===');
      parts.push(worldState.nearbyNPCs.join('、'));
      parts.push('');
    }

    if (worldState.currentQuest) {
      parts.push('=== 当前任务 ===');
      parts.push(worldState.currentQuest);
      parts.push('');
    }

    if (previousContext && previousContext.length > 0) {
      parts.push('=== 最近剧情 ===');
      parts.push(previousContext);
      parts.push('');
    }

    parts.push('=== 玩家行动 ===');
    parts.push(playerAction);
    parts.push('');
    parts.push('请根据以上状态推进剧情，结尾提供4个具体行动选项。');

    return parts.join('\n');
  },

  // 检查API配置
  checkConfig(settings) {
    if (!settings || !settings.apiKey) {
      return { valid: false, message: '未配置DeepSeek API Key' };
    }
    if (!settings.apiKey.startsWith('sk-')) {
      return { valid: false, message: 'API Key格式不正确，应以sk-开头' };
    }
    return { valid: true, message: '配置有效' };
  },

  // 测试API连接
  async testConnection(settings) {
    const check = this.checkConfig(settings);
    if (!check.valid) return check;

    try {
      const apiUrl = (settings.proxy || 'https://api.deepseek.com') + '/v1/chat/completions';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + settings.apiKey,
        },
        body: JSON.stringify({
          model: settings.model || 'deepseek-chat',
          messages: [{ role: 'user', content: '你好，请回复"连接成功"' }],
          max_tokens: 20,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { valid: false, message: `连接失败 (${response.status}): ${errorText.slice(0, 100)}` };
      }

      const data = await response.json();
      return { valid: true, message: '连接成功', model: data.model };
    } catch (e) {
      return { valid: false, message: '连接失败: ' + e.message };
    }
  },
};