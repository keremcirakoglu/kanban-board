const DB_NAME = "kanbanDB";
const DB_VERSION = 1;
let db;

export const initDB = () =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = (err) => {
      console.error("IndexedDB error:", err);
      reject(err);
    };
    req.onsuccess = () => {
      db = req.result;
      resolve(db);
    };
    req.onupgradeneeded = (event) => {
      db = event.target.result;
      if (!db.objectStoreNames.contains("tasks"))
        db.createObjectStore("tasks", { keyPath: "id", autoIncrement: true });
      if (!db.objectStoreNames.contains("projects"))
        db.createObjectStore("projects", { keyPath: "id" });
    };
  });

export const saveItem = (storeName, item) =>
  new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const req = store.put(item);
    req.onsuccess = () => resolve(req.result);
    req.onerror = (err) => {
      console.error("Save error:", err);
      reject(err);
    };
  });

export const getAllItems = (storeName) =>
  new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = (err) => reject(err);
  });
