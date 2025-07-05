// src/utils/indexedDBUtils.js

import { openDB } from 'idb';

export const initDB = async () => {
  return openDB('document-store', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files');
      }
    }
  });
};

export const saveFileBlob = async (id, blob) => {
  const db = await initDB();
  await db.put('files', blob, id);
};

export const getFileBlob = async (id) => {
  const db = await initDB();
  return await db.get('files', id);
};

export const deleteFileBlob = async (id) => {
  const db = await initDB();
  await db.delete('files', id);
};