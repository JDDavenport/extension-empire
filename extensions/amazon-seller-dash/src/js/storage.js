/* Amazon Seller Dashboard — Storage Layer */
const ASD = window.ASD || {};
window.ASD = ASD;

ASD.storage = {
  async get(keys) {
    return new Promise(r => chrome.storage.local.get(keys, r));
  },
  async set(data) {
    return new Promise(r => chrome.storage.local.set(data, r));
  },
  async getSync(keys) {
    return new Promise(r => chrome.storage.sync.get(keys, r));
  },
  async setSync(data) {
    return new Promise(r => chrome.storage.sync.set(data, r));
  },
  async appendToArray(key, item, maxLen = 500) {
    const data = await this.get([key]);
    const arr = data[key] || [];
    arr.push(item);
    if (arr.length > maxLen) arr.splice(0, arr.length - maxLen);
    await this.set({ [key]: arr });
    return arr;
  },
  async getSettings() {
    const defaults = {
      cogsDefaults: {},
      shippingCost: 0,
      lowStockThreshold: 10,
      trackedCompetitors: [],
      trackedKeywords: [],
      proEnabled: false
    };
    const s = await this.getSync(['asd_settings']);
    return { ...defaults, ...(s.asd_settings || {}) };
  },
  async saveSettings(settings) {
    await this.setSync({ asd_settings: settings });
  }
};
