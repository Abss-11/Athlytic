const mongoose = require("mongoose");

const communityPostSchema = new mongoose.Schema(
  {
    athleteId: { type: String, required: true },
    athlete: { type: String, required: true },
    content: { type: String, required: true },
    likes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.models.CommunityPost || mongoose.model("CommunityPost", communityPostSchema);
