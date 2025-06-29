import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Home = () => {
  const [documents, setDocuments] = useState([]);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("userInfo"));

  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else {
      fetchDocuments();
    }
  }, [user, navigate]);

  const fetchDocuments = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/docs", {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      setDocuments(res.data);
    } catch (err) {
      toast.error("Failed to fetch documents");
    }
  };

  const createNewDocument = async () => {
    try {
      const res = await axios.post(
        "http://localhost:5000/api/docs",
        { title: "Untitled Document" },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      navigate(`/editor/${res.data._id}`);
    } catch (err) {
      toast.error("Failed to create document");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/docs/${id}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      toast.success("Document deleted");
      setDocuments(documents.filter((doc) => doc._id !== id));
    } catch (err) {
      toast.error("Failed to delete document");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userInfo");
    toast.success("Logged out");
    navigate("/login");
  };

  return (
    <div style={{ padding: "40px", position: "relative" }}>
      <button
        onClick={handleLogout}
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          padding: "8px 16px",
          backgroundColor: "#ff4d4f",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer"
        }}
      >
        🚪 Logout
      </button>

      <h1>📄 My Documents</h1>
      <button
        onClick={createNewDocument}
        style={{
          padding: "10px 16px",
          backgroundColor: "#1677ff",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          marginTop: "10px"
        }}
      >
        ➕ Create New Document
      </button>

      <ul style={{ marginTop: "20px", listStyle: "none", paddingLeft: 0 }}>
        {documents.map((doc) => (
          <li
            key={doc._id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "10px",
              padding: "8px 12px",
              border: "1px solid #ccc",
              borderRadius: "5px",
              backgroundColor: "#f9f9f9"
            }}
          >
            <a
              href={`/editor/${doc._id}`}
              style={{ textDecoration: "none", color: "#333", fontWeight: "bold" }}
            >
              📝 {doc.title || "Untitled Document"}
            </a>
            <button
              onClick={() => handleDelete(doc._id)}
              style={{
                backgroundColor: "transparent",
                color: "#ff4d4f",
                border: "none",
                fontSize: "16px",
                cursor: "pointer"
              }}
              title="Delete Document"
            >
              ❌
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Home;
