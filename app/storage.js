const RECORD_KEYS = [
  "tusk-data",
  "tusk-business-data",
  "tusk-sports-data",
  "tusk-health-data",
  "tusk-permissions",
  "tusk-life-data",
  "tusk-sync-inbox",
];
const SAVE_ERROR = "Changes are still in this tab and have not been saved. Keep this tab open and retry.";
const cache = new Map();
const pending = new Map();
let queue = Promise.resolve();
let queuedWrites = 0;
let demo = false;

function notifyChange() {
  window.dispatchEvent(new Event("tusk-storage-changed"));
}

function report(message) {
  window.dispatchEvent(new CustomEvent("tusk-save-error", { detail: message }));
}

function enqueue(operation) {
  const result = queue.then(operation);
  queue = result.catch(() => {});
  return result;
}

function enqueueWrite(operation) {
  queuedWrites += 1;
  return enqueue(operation).finally(() => { queuedWrites -= 1; });
}

function replaceCache(records) {
  const changed = records.size !== cache.size || [...records].some(([key, value]) => cache.get(key) !== value);
  cache.clear();
  for (const [key, value] of records) cache.set(key, value);
  if (changed) notifyChange();
}

function persist(key, value) {
  try {
    window.localStorage.setItem(key, value);
    if (pending.get(key) === value) pending.delete(key);
    if (!pending.size) report("");
  } catch (error) {
    report(SAVE_ERROR);
    throw error;
  }
}

function setValue(key, value) {
  if (typeof value !== "string") throw new TypeError("Saved records must be JSON strings.");
  JSON.parse(value);
  const changed = cache.get(key) !== value;
  if (!changed && !pending.has(key)) return { key, value };
  cache.set(key, value);
  if (!demo) pending.set(key, value);
  if (changed) notifyChange();
  if (!demo) persist(key, value);
  return { key, value };
}

export const isDemo = () => demo;

export async function initializeStorage() {
  return enqueue(() => {
    if (demo) return;
    if (pending.size) throw new Error("Retry saving your changes before reloading records.");
    const records = new Map();
    for (const key of RECORD_KEYS) {
      const value = window.localStorage.getItem(key);
      if (value !== null) {
        JSON.parse(value);
        records.set(key, value);
      }
    }
    replaceCache(records);
  });
}

export const storage = {
  async get(key) {
    return enqueue(() => cache.has(key) ? { key, value: cache.get(key) } : null);
  },
  async set(key, value) {
    return enqueueWrite(() => setValue(key, value));
  },
  async update(key, transform) {
    return enqueueWrite(async () => {
      const current = cache.has(key) ? JSON.parse(cache.get(key)) : null;
      const next = await transform(current);
      return setValue(key, JSON.stringify(next));
    });
  },
};

export async function retrySaves() {
  return enqueueWrite(() => {
    for (const [key, value] of [...pending]) {
      try { persist(key, value); } catch { /* Keep the pending record and save notice available for another retry. */ }
    }
  });
}

export async function flushSaves() {
  await queue;
  if (pending.size) throw new Error("Some changes have not saved. Use Retry saving before continuing.");
}

export function startDemo(records) {
  if (pending.size || queuedWrites) throw new Error("Wait for your changes to save before opening samples.");
  const samples = new Map(Object.entries(records).map(([key, value]) => [key, JSON.stringify(value)]));
  demo = true;
  replaceCache(samples);
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", event => {
    if (pending.size || queuedWrites) {
      event.preventDefault();
      event.returnValue = "";
    }
  });
}
