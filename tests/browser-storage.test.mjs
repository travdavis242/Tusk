import test from "node:test";
import assert from "node:assert/strict";

let moduleId = 0;
function browser(records = new Map()) {
  const window = new EventTarget();
  let readError = false;
  let writeError = false;
  let writes = 0;
  const changes = [];
  const saveNotices = [];
  window.localStorage = {
    getItem(key) {
      if (readError) throw new Error("Storage access blocked");
      return records.get(key) ?? null;
    },
    setItem(key, value) {
      if (writeError) throw new Error("Storage quota exceeded");
      records.set(key, value);
      writes += 1;
    },
  };
  window.addEventListener("tusk-storage-changed", () => changes.push(true));
  window.addEventListener("tusk-save-error", event => saveNotices.push(event.detail));
  globalThis.window = window;
  return {
    window, records, changes, saveNotices,
    get writes() { return writes; },
    failReads(value) { readError = value; },
    failWrites(value) { writeError = value; },
  };
}

async function freshAdapter() {
  return import(`../app/storage.js?browser-test=${++moduleId}`);
}

test("loads existing records without deleting unrelated storage and ignores unchanged writes", async () => {
  const saved = JSON.stringify({ assignments: [{ id: "existing" }] });
  const env = browser(new Map([["tusk-data", saved], ["other-application", "untouched"]]));
  const { initializeStorage, storage } = await freshAdapter();
  await initializeStorage();
  assert.deepEqual(await storage.get("tusk-data"), { key: "tusk-data", value: saved });
  assert.equal(await storage.get("tusk-life-data"), null);
  const changeCount = env.changes.length;
  await initializeStorage();
  await storage.set("tusk-data", saved);
  assert.equal(env.changes.length, changeCount);
  assert.equal(env.writes, 0);
  assert.equal(env.records.get("other-application"), "untouched");
});

test("serializes concurrent asynchronous updates and lets reads observe earlier writes", async () => {
  const env = browser();
  const { initializeStorage, storage, flushSaves } = await freshAdapter();
  await initializeStorage();
  await storage.set("tusk-life-data", JSON.stringify({ plans: [], memories: [] }));
  let finishFirst;
  const gate = new Promise(resolve => { finishFirst = resolve; });
  const first = storage.update("tusk-life-data", async current => {
    await gate;
    return { ...current, plans: [{ id: "plan", done: true }] };
  });
  const second = storage.update("tusk-life-data", current => ({ ...current, memories: [{ text: "Improve passing" }] }));
  const read = storage.get("tusk-life-data");
  finishFirst();
  await Promise.all([first, second]);
  await flushSaves();
  const current = JSON.parse((await read).value);
  assert.equal(current.plans[0].done, true);
  assert.equal(current.memories[0].text, "Improve passing");
  assert.deepEqual(JSON.parse(env.records.get("tusk-life-data")), current);
});

test("failed writes keep edits in the tab, warn before leaving, and retry without duplicate change events", async () => {
  const original = JSON.stringify({ tasks: [] });
  const env = browser(new Map([["tusk-business-data", original]]));
  const { initializeStorage, storage, flushSaves, retrySaves, startDemo } = await freshAdapter();
  await initializeStorage();
  env.failWrites(true);
  const updated = JSON.stringify({ tasks: [{ title: "Call supplier" }] });
  await assert.rejects(storage.set("tusk-business-data", updated), /quota exceeded/);
  assert.equal((await storage.get("tusk-business-data")).value, updated);
  assert.equal(env.records.get("tusk-business-data"), original);
  assert.match(env.saveNotices.at(-1), /have not been saved/);
  await assert.rejects(flushSaves(), /have not saved/);
  await assert.rejects(initializeStorage(), /Retry saving/);
  assert.throws(() => startDemo({}), /Wait for your changes/);
  const leave = new Event("beforeunload", { cancelable: true });
  env.window.dispatchEvent(leave);
  assert.equal(leave.defaultPrevented, true);
  const changeCount = env.changes.length;
  await retrySaves();
  await assert.rejects(flushSaves(), /have not saved/);
  env.failWrites(false);
  await retrySaves();
  await flushSaves();
  assert.equal(env.records.get("tusk-business-data"), updated);
  assert.equal(env.changes.length, changeCount);
  assert.equal(env.saveNotices.at(-1), "");
  const savedLeave = new Event("beforeunload", { cancelable: true });
  env.window.dispatchEvent(savedLeave);
  assert.equal(savedLeave.defaultPrevented, false);
});

test("sample edits stay isolated and a fresh page loads saved records", async () => {
  const original = JSON.stringify({ assignments: [{ title: "Real essay" }] });
  const env = browser(new Map([["tusk-data", original]]));
  const adapter = await freshAdapter();
  await adapter.initializeStorage();
  adapter.startDemo({ "tusk-data": { assignments: [{ title: "Sample essay" }] } });
  assert.equal(adapter.isDemo(), true);
  await adapter.storage.update("tusk-data", current => ({ ...current, assignments: [{ title: "Edited sample" }] }));
  await adapter.flushSaves();
  assert.equal(JSON.parse((await adapter.storage.get("tusk-data")).value).assignments[0].title, "Edited sample");
  assert.equal(env.records.get("tusk-data"), original);
  assert.equal(env.writes, 0);
  browser(env.records);
  const reload = await freshAdapter();
  await reload.initializeStorage();
  assert.equal(reload.isDemo(), false);
  assert.equal((await reload.storage.get("tusk-data")).value, original);
});

test("retries the latest unsaved revision and a failed operation does not poison later updates", async () => {
  const env = browser();
  const { initializeStorage, storage, retrySaves, flushSaves } = await freshAdapter();
  await initializeStorage();
  env.failWrites(true);
  await assert.rejects(storage.update("tusk-life-data", () => ({ plans: [{ title: "First draft" }], memories: [] })), /quota exceeded/);
  await assert.rejects(storage.update("tusk-life-data", current => ({ ...current, plans: [{ title: "Latest draft" }] })), /quota exceeded/);
  await assert.rejects(storage.set("tusk-permissions", JSON.stringify({ schoolToGlobal: true })), /quota exceeded/);
  env.failWrites(false);
  await retrySaves();
  await flushSaves();
  assert.equal(JSON.parse(env.records.get("tusk-life-data")).plans[0].title, "Latest draft");
  assert.equal(JSON.parse(env.records.get("tusk-permissions")).schoolToGlobal, true);
  await assert.rejects(storage.update("tusk-life-data", () => { throw new Error("Invalid edit"); }), /Invalid edit/);
  await storage.update("tusk-life-data", current => ({ ...current, memories: [{ text: "Remember this" }] }));
  assert.equal(JSON.parse(env.records.get("tusk-life-data")).plans[0].title, "Latest draft");
  assert.equal(JSON.parse(env.records.get("tusk-life-data")).memories[0].text, "Remember this");
});

test("load failures preserve current records and malformed data cannot be silently overwritten", async () => {
  const original = JSON.stringify({ sports: ["Running"] });
  const env = browser(new Map([["tusk-sports-data", original]]));
  const { initializeStorage, storage } = await freshAdapter();
  await initializeStorage();
  env.failReads(true);
  await assert.rejects(initializeStorage(), /access blocked/);
  assert.equal((await storage.get("tusk-sports-data")).value, original);
  env.failReads(false);
  env.records.set("tusk-life-data", "{invalid");
  await assert.rejects(initializeStorage(), SyntaxError);
  assert.equal((await storage.get("tusk-sports-data")).value, original);
  assert.equal(env.records.get("tusk-life-data"), "{invalid");
});

test("entering samples is blocked while an asynchronous edit is queued", async () => {
  browser();
  const { initializeStorage, storage, startDemo } = await freshAdapter();
  await initializeStorage();
  let finish;
  const gate = new Promise(resolve => { finish = resolve; });
  const saving = storage.update("tusk-life-data", async () => { await gate; return { plans: [] }; });
  assert.throws(() => startDemo({}), /Wait for your changes/);
  finish();
  await saving;
  startDemo({ "tusk-life-data": { plans: [{ title: "Sample" }] } });
});
