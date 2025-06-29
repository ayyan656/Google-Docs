import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import socket from '../socket/socket';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Editor = () => {
  const { id } = useParams();
  const [value, setValue] = useState('');
  const [shareEmail, setShareEmail] = useState('');
  const quillRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("userInfo"));

  // 🟡 Log the document ID to debug 404 errors
  useEffect(() => {
    console.log("🟡 Document ID from URL:", id);
  }, [id]);

  // Load document
  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/docs/${id}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setValue(res.data.content || '');
      } catch (err) {
        toast.error("Failed to load document");
      }
    };
    fetchDoc();
  }, [id]);

  // Save with debounce
  useEffect(() => {
    const timeout = setTimeout(() => {
      saveContent();
    }, 2000);
    return () => clearTimeout(timeout);
  }, [value]);

  const saveContent = async () => {
    try {
      await axios.put(
        `http://localhost:5000/api/docs/${id}`,
        { content: value },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
    } catch (err) {
      toast.error("Failed to save document");
    }
  };

  // Setup socket connection
  useEffect(() => {
    socket.emit("join-document", id);
    socket.on("receive-changes", (delta) => {
      quillRef.current?.getEditor().updateContents(delta);
    });
    return () => {
      socket.off("receive-changes");
    };
  }, [id]);

  const handleChange = (content, delta, source) => {
    setValue(content);
    if (source === "user") {
      socket.emit("send-changes", { documentId: id, delta });
    }
  };

  // 📤 Share by email (add collaborator + send email)
  const handleShare = async () => {
    if (!shareEmail) return toast.error("Please enter an email");

    try {
      // Step 1: Add as collaborator
      await axios.post(`http://localhost:5000/api/docs/${id}/share`, {
        email: shareEmail
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      // Step 2: Send email with link
      await axios.post(`http://localhost:5000/api/docs/${id}/share-email`, {
        email: shareEmail
      });

      toast.success("Document shared and email sent!");
      setShareEmail('');
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to share document");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>📝 Collaborative Editor</h2>

      <div style={{ marginTop: "20px", marginBottom: "20px" }}>
        <h3>🔗 Share Document</h3>
        <input
          type="email"
          placeholder="Enter user email"
          value={shareEmail}
          onChange={(e) => setShareEmail(e.target.value)}
          style={{ padding: "8px", width: "250px" }}
        />
        <button onClick={handleShare} style={{ marginLeft: "10px", padding: "8px 12px" }}>
          Share Access
        </button>
      </div>

      <ReactQuill
        theme="snow"
        value={value}
        onChange={handleChange}
        ref={quillRef}
      />
    </div>
  );
};

export default Editor;
