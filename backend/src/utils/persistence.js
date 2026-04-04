const { isDatabaseConnected } = require("../config/db");

function normalizeDocument(document) {
  if (!document) {
    return document;
  }

  const value = typeof document.toObject === "function" ? document.toObject() : document;
  return {
    id: value._id ? String(value._id) : value.id,
    ...value,
  };
}

async function listRecords({ model, fallback }) {
  if (isDatabaseConnected()) {
    const records = await model.find().sort({ createdAt: -1 });
    return records.map(normalizeDocument);
  }

  return fallback;
}

async function createRecord({ model, fallback, payload, transform }) {
  if (isDatabaseConnected()) {
    const created = await model.create(payload);
    return normalizeDocument(created);
  }

  const entry = transform(payload, fallback.length);
  fallback.push(entry);
  return entry;
}

module.exports = {
  listRecords,
  createRecord,
  normalizeDocument,
};
