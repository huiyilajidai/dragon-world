// 龙族世界模拟器 - 存档系统
const Storage = {
  STORAGE_KEY: 'dragon_world_simulator',
  AUTOSAVE_KEY: 'dragon_world_autosave',
  SLOT_KEY: 'dragon_world_slot_',
  SETTINGS_KEY: 'dragon_world_settings',

  // 保存设置
  saveSettings(settings) {
    try {
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
      return true;
    } catch (e) {
      console.error('保存设置失败:', e);
      return false;
    }
  },

  // 加载设置
  loadSettings() {
    try {
      const data = localStorage.getItem(this.SETTINGS_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('加载设置失败:', e);
      return null;
    }
  },

  // 自动保存
  autosave(state) {
    try {
      const saveData = {
        ...state,
        meta: {
          ...state.meta,
          lastSaved: new Date().toISOString(),
        },
      };
      localStorage.setItem(this.AUTOSAVE_KEY, JSON.stringify(saveData));
      return true;
    } catch (e) {
      console.error('自动保存失败:', e);
      return false;
    }
  },

  // 加载自动存档
  loadAutosave() {
    try {
      const data = localStorage.getItem(this.AUTOSAVE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('加载自动存档失败:', e);
      return null;
    }
  },

  // 检查是否有自动存档
  hasAutosave() {
    return localStorage.getItem(this.AUTOSAVE_KEY) !== null;
  },

  // 保存到指定槽位
  saveToSlot(slot, state) {
    try {
      const saveData = {
        ...state,
        meta: {
          ...state.meta,
          lastSaved: new Date().toISOString(),
          slotName: `存档槽 ${slot}`,
        },
      };
      localStorage.setItem(this.SLOT_KEY + slot, JSON.stringify(saveData));
      return true;
    } catch (e) {
      console.error(`保存到槽位${slot}失败:`, e);
      return false;
    }
  },

  // 从指定槽位加载
  loadFromSlot(slot) {
    try {
      const data = localStorage.getItem(this.SLOT_KEY + slot);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error(`从槽位${slot}加载失败:`, e);
      return null;
    }
  },

  // 获取所有存档槽位信息
  getAllSlots() {
    const slots = [];
    for (let i = 1; i <= 3; i++) {
      const data = localStorage.getItem(this.SLOT_KEY + i);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          slots.push({
            slot: i,
            exists: true,
            playerName: parsed.player?.name || '未知',
            time: parsed.world?.currentTime || '未知',
            location: parsed.world?.currentLocation || '未知',
            lastSaved: parsed.meta?.lastSaved || '未知',
            turnCount: parsed.meta?.turnCount || 0,
          });
        } catch (e) {
          slots.push({ slot: i, exists: false });
        }
      } else {
        slots.push({ slot: i, exists: false });
      }
    }
    return slots;
  },

  // 删除指定槽位存档
  deleteSlot(slot) {
    try {
      localStorage.removeItem(this.SLOT_KEY + slot);
      return true;
    } catch (e) {
      console.error(`删除槽位${slot}失败:`, e);
      return false;
    }
  },

  // 生成续玩码（Base64编码 + 简单校验）
  generateSaveCode(state) {
    try {
      const saveData = {
        v: '1.0',
        t: Date.now(),
        d: state,
      };
      const json = JSON.stringify(saveData);
      // Base64编码
      const base64 = btoa(unescape(encodeURIComponent(json)));
      // 简单校验和
      const checksum = this.simpleChecksum(base64);
      return `DRAGON-${checksum}-${base64}`;
    } catch (e) {
      console.error('生成续玩码失败:', e);
      return null;
    }
  },

  // 解析续玩码
  parseSaveCode(code) {
    try {
      if (!code || typeof code !== 'string') return null;
      const trimmed = code.trim();

      // 检查格式
      if (!trimmed.startsWith('DRAGON-')) {
        // 尝试直接解析Base64
        try {
          const json = decodeURIComponent(escape(atob(trimmed)));
          const parsed = JSON.parse(json);
          return parsed.d || parsed;
        } catch (e2) {
          return null;
        }
      }

      const parts = trimmed.split('-');
      if (parts.length < 3) return null;

      const checksum = parts[1];
      const base64 = parts.slice(2).join('-');

      // 校验
      if (this.simpleChecksum(base64) !== checksum) {
        console.warn('续玩码校验失败，尝试继续解析');
      }

      const json = decodeURIComponent(escape(atob(base64)));
      const parsed = JSON.parse(json);
      return parsed.d || parsed;
    } catch (e) {
      console.error('解析续玩码失败:', e);
      return null;
    }
  },

  // 简单校验和
  simpleChecksum(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36).toUpperCase().slice(0, 6);
  },

  // 清除所有存档
  clearAll() {
    try {
      localStorage.removeItem(this.AUTOSAVE_KEY);
      for (let i = 1; i <= 3; i++) {
        localStorage.removeItem(this.SLOT_KEY + i);
      }
      return true;
    } catch (e) {
      console.error('清除存档失败:', e);
      return false;
    }
  },

  // 导出所有存档为JSON
  exportAll() {
    const data = {
      settings: this.loadSettings(),
      autosave: this.loadAutosave(),
      slots: {},
    };
    for (let i = 1; i <= 3; i++) {
      data.slots[i] = this.loadFromSlot(i);
    }
    return JSON.stringify(data, null, 2);
  },
};