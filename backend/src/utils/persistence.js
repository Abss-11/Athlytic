const { isDatabaseConnected } = require("../config/db");
const mongoose = require("mongoose");

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

async function updateRecord({ model, fallback, id, payload }) {
  if (isDatabaseConnected()) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const updated = await model.findByIdAndUpdate(id, payload, { new: true });
    return normalizeDocument(updated);
  }

  const index = fallback.findIndex((entry) => String(entry.id) === String(id));
  if (index === -1) {
    return null;
  }

  fallback[index] = {
    ...fallback[index],
    ...payload,
  };

  return fallback[index];
}

async function deleteRecord({ model, fallback, id }) {
  if (isDatabaseConnected()) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const deleted = await model.findByIdAndDelete(id);
    return normalizeDocument(deleted);
  }

  const index = fallback.findIndex((entry) => String(entry.id) === String(id));
  if (index === -1) {
    return null;
  }

  const [deleted] = fallback.splice(index, 1);
  return deleted;
}

module.exports = {
  listRecords,
  createRecord,
  updateRecord,
  deleteRecord,
  normalizeDocument,
};
