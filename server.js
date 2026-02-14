require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const Application = require("./models/Application");

const app = express();
const PORT = process.env.PORT || 4000;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/jobtrackr";

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Simple health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Get all applications with optional filters (status, search)
app.get("/api/applications", async (req, res) => {
  try {
    const { status, search } = req.query;
    const query = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [{ company: regex }, { role: regex }, { location: regex }];
    }

    const apps = await Application.find(query).sort({ appliedDate: -1 });
    res.json(apps);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
});

// Create application
app.post("/api/applications", async (req, res) => {
  try {
    const appData = req.body;
    const application = new Application(appData);
    const saved = await application.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Failed to create application" });
  }
});

// Update application
app.put("/api/applications/:id", async (req, res) => {
  try {
    const updated = await Application.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ error: "Application not found" });
    }
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Failed to update application" });
  }
});

// Delete application
app.delete("/api/applications/:id", async (req, res) => {
  try {
    const deleted = await Application.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Application not found" });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Failed to delete application" });
  }
});

// Simple summary: counts by status
app.get("/api/summary", async (req, res) => {
  try {
    const pipeline = [
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ];

    const results = await Application.aggregate(pipeline);
    const summary = {
      total: 0,
      applied: 0,
      oa: 0,
      interview: 0,
      offer: 0,
      rejected: 0
    };

    results.forEach((r) => {
      summary.total += r.count;
      if (summary[r._id] !== undefined) {
        summary[r._id] = r.count;
      }
    });

    res.json(summary);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch summary" });
  }
});

// Fallback to frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`JobTrackr server running on http://localhost:${PORT}`);
});