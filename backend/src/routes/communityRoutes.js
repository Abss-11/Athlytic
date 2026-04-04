const express = require("express");
const { communityPosts } = require("../data/sampleData");
const CommunityPost = require("../models/CommunityPost");
const { createRecord, listRecords } = require("../utils/persistence");

const router = express.Router();

router.get("/", async (_req, res) => {
  const records = await listRecords({ model: CommunityPost, fallback: communityPosts });
  res.json(records);
});

router.post("/", async (req, res) => {
  const entry = await createRecord({
    model: CommunityPost,
    fallback: communityPosts,
    payload: {
      likes: 0,
      ...req.body,
    },
    transform: (payload, length) => ({
      id: `post-${length + 1}`,
      ...payload,
    }),
  });

  res.status(201).json(entry);
});

module.exports = router;
