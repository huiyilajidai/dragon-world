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

【重要】
- 如果玩家输入的是查询指令（状态、关系、任务、线索、背包、能力、存档等），直接回应查询结果，不需要生成剧情和选项
- 如果玩家输入的是节奏指令（快进、剧情快一点等），按照指令调整后继续
- 正常行动输入则推进剧情`,

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