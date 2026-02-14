const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    company: { type: String, required: true },
    role: { type: String, required: true },
    location: { type: String, default: "" },
    status: {
      type: String,
      enum: ["applied", "oa", "interview", "offer", "rejected"],
      default: "applied"
    },
    appliedDate: { type: Date },
    salaryMin: { type: Number },
    salaryMax: { type: Number },
    jobLink: { type: String },
    notes: { type: String },
    tags: [{ type: String }]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Application", applicationSchema);