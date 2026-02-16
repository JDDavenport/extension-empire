// db.js — IndexedDB wrapper for AI Chat Manager
const ACM_DB_NAME = 'AIChatManager';
const ACM_DB_VERSION = 2;

class ACMDatabase {
  constructor() {
    this.db = null;
  }

  async open() {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(ACM_DB_NAME, ACM_DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('conversations')) {
          const convStore = db.createObjectStore('conversations', { keyPath: 'id' });
          convStore.createIndex('platform', 'platform', { unique: false });
          convStore.createIndex('timestamp', 'timestamp', { unique: false });
          convStore.createIndex('pinned', 'pinned', { unique: false });
          convStore.createIndex('folder', 'folder', { unique: false });
        }
        if (!db.objectStoreNames.contains('prompts')) {
          const promptStore = db.createObjectStore('prompts', { keyPath: 'id' });
          promptStore.createIndex('category', 'category', { unique: false });
        }
        if (!db.objectStoreNames.contains('tags')) {
          db.createObjectStore('tags', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('folders')) {
          db.createObjectStore('folders', { keyPath: 'id' });
        }
      };
      req.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(this.db);
      };
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async _tx(storeName, mode, fn) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      const result = fn(store);
      tx.oncomplete = () => resolve(result._result || result);
      tx.onerror = (e) => reject(e.target.error);
      if (result instanceof IDBRequest) {
        result.onsuccess = () => { result._result = result.result; };
      }
    });
  }

  async saveConversation(conv) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('conversations', 'readwrite');
      tx.objectStore('conversations').put(conv);
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject(e.target.error);
    });
  }

  async getConversation(id) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('conversations', 'readonly');
      const req = tx.objectStore('conversations').get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async getAllConversations() {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('conversations', 'readonly');
      const req = tx.objectStore('conversations').getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async deleteConversation(id) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('conversations', 'readwrite');
      tx.objectStore('conversations').delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject(e.target.error);
    });
  }

  async deleteConversations(ids) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('conversations', 'readwrite');
      const store = tx.objectStore('conversations');
      ids.forEach(id => store.delete(id));
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject(e.target.error);
    });
  }

  async searchConversations(query) {
    const all = await this.getAllConversations();
    const q = query.toLowerCase();
    return all.filter(c =>
      (c.title && c.title.toLowerCase().includes(q)) ||
      (c.messages && c.messages.some(m => m.text && m.text.toLowerCase().includes(q)))
    );
  }

  async getConversationsByFolder(folder) {
    const all = await this.getAllConversations();
    return all.filter(c => c.folder === folder);
  }

  async getPinnedConversations() {
    const all = await this.getAllConversations();
    return all.filter(c => c.pinned);
  }

  // Prompts
  async savePrompt(prompt) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('prompts', 'readwrite');
      tx.objectStore('prompts').put(prompt);
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject(e.target.error);
    });
  }

  async getAllPrompts() {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('prompts', 'readonly');
      const req = tx.objectStore('prompts').getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async deletePrompt(id) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('prompts', 'readwrite');
      tx.objectStore('prompts').delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject(e.target.error);
    });
  }

  // Folders
  async saveFolders(folders) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('folders', 'readwrite');
      const store = tx.objectStore('folders');
      store.clear();
      folders.forEach(f => store.put(f));
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject(e.target.error);
    });
  }

  async getAllFolders() {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('folders', 'readonly');
      const req = tx.objectStore('folders').getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = (e) => reject(e.target.error);
    });
  }
}

// Global instance
if (typeof window !== 'undefined') {
  window.acmDB = new ACMDatabase();
}
