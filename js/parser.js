// 龙族世界模拟器 - 选项解析器
const OptionParser = {
  // 支持的选项前缀格式
  patterns: [
    // 【A】选项内容
    { regex: /^【([A-Da-d1-4])】\s*(.+)$/, labelIndex: 1, textIndex: 2 },
    // [A] 选项内容
    { regex: /^\[([A-Da-d1-4])\]\s*(.+)$/, labelIndex: 1, textIndex: 2 },
    // (A) 选项内容 / （A）选项内容
    { regex: /^[\(（]([A-Da-d1-4])[\)）]\s*(.+)$/, labelIndex: 1, textIndex: 2 },
    // A. 选项内容 / A、选项内容 / A．选项内容
    { regex: /^([A-Da-d])[.、．]\s*(.+)$/, labelIndex: 1, textIndex: 2 },
    // 1. 选项内容 / 1、选项内容
    { regex: /^([1-4])[.、．]\s*(.+)$/, labelIndex: 1, textIndex: 2 },
    // 选项A：选项内容 / 选项A:
    { regex: /^选项\s*([A-Da-d1-4])\s*[：:]\s*(.+)$/, labelIndex: 1, textIndex: 2 },
    // 第一，选项内容 / 第一：选项内容 / 第一个：
    { regex: /^第([一二三四1-4])(?:个)?[，,：:、]\s*(.+)$/, labelIndex: 1, textIndex: 2 },
    // 【选项A】选项内容
    { regex: /^【选项\s*([A-Da-d1-4])】\s*(.+)$/, labelIndex: 1, textIndex: 2 },
  ],

  // 中文数字映射
  cnNumMap: { '一': '1', '二': '2', '三': '3', '四': '4' },

  // 代价分隔符
  costSeparators: ['——', '——', '—', '……', '...', '｜', '|', '（', '('],

  // 主解析函数
  extractDecision(text) {
    if (!text || typeof text !== 'string') return null;

    try {
      const lines = text.split('\n');
      const options = [];
      const optionLineIndices = new Set();

      // 逐行扫描
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const match = this.matchOptionLine(line);
        if (match) {
          // 检查是否是续行（下一行是否属于当前选项）
          let fullText = match.text;
          let j = i + 1;
          while (j < lines.length) {
            const nextLine = lines[j].trim();
            if (!nextLine) break;
            // 如果下一行也是选项格式，停止
            if (this.matchOptionLine(nextLine)) break;
            // 如果下一行以标点开头或上一行较短，可能是续行
            if (/^[，。、；：！？""''（）【】]/.test(nextLine) || fullText.length < 15) {
              fullText += nextLine;
              optionLineIndices.add(j);
              j++;
            } else {
              break;
            }
          }

          const { label, cost } = this.splitLabelAndCost(fullText);
          options.push({
            label: match.label.toUpperCase(),
            text: label,
            cost: cost,
            original: fullText,
          });
          optionLineIndices.add(i);
        }
      }

      // 如果找到至少2个选项，返回决策点
      if (options.length >= 2) {
        // 按label排序，去重
        const sorted = this.sortAndDedupe(options);
        if (sorted.length >= 2) {
          return {
            options: sorted.slice(0, 4),
            optionLineIndices: optionLineIndices,
          };
        }
      }

      // 兜底：检测关键词后宽松搜索
      if (this.hasDecisionKeywords(text)) {
        const fallback = this.fallbackScan(text);
        if (fallback && fallback.length >= 2) {
          return { options: fallback.slice(0, 4), optionLineIndices: new Set() };
        }
      }

      return null;
    } catch (e) {
      console.error('选项解析失败:', e);
      return null;
    }
  },

  // 匹配单行选项
  matchOptionLine(line) {
    for (const pattern of this.patterns) {
      const match = line.match(pattern.regex);
      if (match) {
        let label = match[pattern.labelIndex];
        // 中文数字转换
        if (this.cnNumMap[label]) label = this.cnNumMap[label];
        // 字母转大写
        if (/[a-d]/.test(label)) label = label.toUpperCase();
        return {
          label: label,
          text: match[pattern.textIndex].trim(),
        };
      }
    }
    return null;
  },

  // 拆分主文本和代价
  splitLabelAndCost(text) {
    let label = text;
    let cost = '';

    // 尝试各种分隔符
    for (const sep of this.costSeparators) {
      const idx = text.indexOf(sep);
      if (idx > 2) { // 分隔符不能在太前面
        // 对于括号，检查是否包含代价关键词
        if (sep === '（' || sep === '(') {
          const bracketContent = text.substring(idx + 1, text.length - 1);
          if (bracketContent.length >= 6 || /获得|消耗|风险|代价|提升|下降|增加|减少/.test(bracketContent)) {
            label = text.substring(0, idx).trim();
            cost = bracketContent.trim();
          }
        } else {
          label = text.substring(0, idx).trim();
          cost = text.substring(idx + sep.length).trim();
        }
        break;
      }
    }

    return { label, cost };
  },

  // 排序和去重
  sortAndDedupe(options) {
    const order = { 'A': 1, 'B': 2, 'C': 3, 'D': 4, '1': 1, '2': 2, '3': 3, '4': 4 };
    const seen = new Set();
    return options
      .filter(opt => {
        if (seen.has(opt.label)) return false;
        seen.add(opt.label);
        return true;
      })
      .sort((a, b) => (order[a.label] || 99) - (order[b.label] || 99));
  },

  // 检测决策关键词
  hasDecisionKeywords(text) {
    const keywords = ['你需要决定', '可选行动', '你的选择', '以下选项', '请选择', '决策点', '选择行动', '怎么办', '如何行动'];
    return keywords.some(kw => text.includes(kw));
  },

  // 兜底宽松扫描
  fallbackScan(text) {
    const options = [];
    const lines = text.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      // 在行内任何位置搜索选项标记
      const inlinePatterns = [
        /【([A-Da-d1-4])】\s*(.+?)(?=【[A-Da-d1-4]】|$)/g,
        /([A-Da-d])\.\s*(.+?)(?=[A-Da-d]\.|$)/g,
        /([1-4])\.\s*(.+?)(?=[1-4]\.|$)/g,
      ];

      for (const pat of inlinePatterns) {
        let match;
        while ((match = pat.exec(trimmed)) !== null) {
          let label = match[1].toUpperCase();
          if (this.cnNumMap[label]) label = this.cnNumMap[label];
          const textContent = match[2].trim();
          if (textContent.length > 1) {
            const { label: lbl, cost } = this.splitLabelAndCost(textContent);
            options.push({ label, text: lbl, cost, original: textContent });
          }
        }
      }
    }

    return this.sortAndDedupe(options);
  },

  // 从正文中剥离选项
  stripOptionsFromText(text, decision) {
    if (!text || !decision) return text;

    try {
      const lines = text.split('\n');
      const resultLines = [];

      for (let i = 0; i < lines.length; i++) {
        // 如果这一行是选项行（基于索引），跳过
        if (decision.optionLineIndices && decision.optionLineIndices.has(i)) {
          continue;
        }
        // 额外检查：如果行内容匹配选项格式，也跳过
        const trimmed = lines[i].trim();
        if (trimmed && this.matchOptionLine(trimmed)) {
          continue;
        }
        resultLines.push(lines[i]);
      }

      let result = resultLines.join('\n');
      // 清理多余空行
      result = result.replace(/\n{3,}/g, '\n\n').trim();
      return result;
    } catch (e) {
      console.error('剥离选项失败:', e);
      return text;
    }
  },
};