export const storage = {
  async get(key) {
    if (window.storage) return window.storage.get(key);

    const value = window.localStorage.getItem(key);
    return value === null ? null : { key, value };
  },

  async set(key, value) {
    if (window.storage) return window.storage.set(key, value);

    window.localStorage.setItem(key, value);
    return { key, value };
  },
};
