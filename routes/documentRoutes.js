const express = require("express");
const router = express.Router();
const Document = require("../models/Document");
const User = require("../models/User");
const protect = require("../middleware/authMiddleware");
const sendShareEmail = require('../utils/mailer'); // ✅ Correct function

// 👉 Create a new document (authenticated)
router.post("/", protect, async (req, res) => {
  const { title } = req.body;

  try {
    const doc = await Document.create({
      title: title || "Untitled Document",
      content: "",
      owner: req.user._id,
    });

    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ message: "Error creating document", error: err.message });
  }
});

// 👉 Get all documents (owned or shared)
router.get("/", protect, async (req, res) => {
  try {
    const docs = await Document.find({
      $or: [
        { owner: req.user._id },
        { collaborators: req.user._id }
      ]
    }).sort({ updatedAt: -1 });

    res.status(200).json(docs);
  } catch (err) {
    res.status(500).json({ message: "Error fetching documents", error: err.message });
  }
});

// 👉 Get a single document (by ID) with access check
router.get("/:id", protect, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);

    if (!doc) return res.status(404).json({ message: "Document not found" });

    const isOwner = doc.owner.toString() === req.user._id.toString();
    const isCollaborator = doc.collaborators.includes(req.user._id);

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({ message: "You don't have access to this document" });
    }

    res.status(200).json(doc);
  } catch (err) {
    res.status(500).json({ message: "Failed to load document", error: err.message });
  }
});

// 👉 Update a document (only if owner or collaborator)
router.put("/:id", protect, async (req, res) => {
  try {
    const { content } = req.body;
    const doc = await Document.findById(req.params.id);

    if (!doc) return res.status(404).json({ message: "Document not found" });

    const isOwner = doc.owner.toString() === req.user._id.toString();
    const isCollaborator = doc.collaborators.includes(req.user._id);

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({ message: "You don't have permission to edit this document" });
    }

    doc.content = content;
    doc.updatedAt = new Date();
    await doc.save();

    res.status(200).json(doc);
  } catch (err) {
    res.status(500).json({ message: "Failed to update document", error: err.message });
  }
});

// 👉 Share document with another user by email (adds as collaborator)
router.post("/:id/share", protect, async (req, res) => {
  const { email } = req.body;
  const documentId = req.params.id;

  console.log("📨 Share request for document ID:", documentId);

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const doc = await Document.findById(documentId);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    if (!doc.owner.equals(req.user._id)) {
      return res.status(403).json({ message: "Only the owner can share this document" });
    }

    if (!doc.collaborators.includes(user._id)) {
      doc.collaborators.push(user._id);
      await doc.save();
    }

    res.json({ message: "User added as collaborator" });
  } catch (err) {
    res.status(500).json({ message: "Share failed", error: err.message });
  }
});

// 👉 Send document access link via email (uses nodemailer)
router.post("/:id/share-email", async (req, res) => {
  const { email } = req.body;
  const documentId = req.params.id;

  try {
    const doc = await Document.findById(documentId);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    await sendShareEmail(email, documentId); // ✅ Dynamic sending
    res.json({ message: "Email sent successfully" });
  } catch (err) {
    console.error("❌ Failed to send email:", err.message);
    res.status(500).json({ message: "Failed to send email", error: err.message });
  }
});

module.exports = router;
