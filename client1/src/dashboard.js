import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { FaUserCircle } from "react-icons/fa";

const BACKEND_URL="https://legalassist-rag.onrender.com";

export default function Dashboard({ onLogout }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [chatList, setChatList] = useState([]);

  const chatEndRef = useRef(null);
  const username = localStorage.getItem("username");

  // ✅ Load chats
  const loadChats = useCallback(async () => {
    if (!username) return;

    try {
      const res = await axios.get(`${BACKEND_URL}/chats/${username}`);
      setChatList(res.data);
    } catch (e) {
      console.log("Error loading chats");
    }
  }, [username]);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  // ✅ Auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ Send message
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", message: input };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await axios.post(`${BACKEND_URL}/ask`, {
        question: input,
        username: username,
        session_id: sessionId,
      });

      const botMsg = { role: "assistant", message: res.data.answer };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", message: "⚠️ Error fetching response" },
      ]);
    }

    setInput("");
  };

  // ✅ New chat
  const handleNewChat = async () => {
    if (!username) {
      setMessages([]);
      return;
    }

    try {
      const res = await axios.post(
        `${BACKEND_URL}/new_chat/${username}`
      );

      setSessionId(res.data.session_id);
      setMessages([]);

      await loadChats();
    } catch (e) {
      console.log("Error creating chat");
    }
  };

  // ✅ Load messages
  const loadChat = async (id) => {
    setSessionId(id);

    try {
      const res = await axios.get(`${BACKEND_URL}/messages/${id}`);
      setMessages(res.data);
    } catch (e) {
      console.log("Error loading messages");
    }
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      {username && (
        <div style={styles.sidebar}>
          <h3>💬 Chats</h3>

          <button style={styles.newChatBtn} onClick={handleNewChat}>
            + New Chat
          </button>

          <div style={styles.chatList}>
            {chatList.map((chat) => (
              <div
                key={chat.id}
                style={styles.chatItem}
                onClick={() => loadChat(chat.id)}
              >
                Chat {chat.id}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div style={styles.chatContainer}>
        <div style={styles.topBar}>
          <h2>⚖️ LegalMind AI</h2>
          <FaUserCircle style={styles.icon} onClick={onLogout} />
        </div>

        <div style={styles.chatArea}>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={
                msg.role === "user"
                  ? styles.userBubble
                  : styles.botBubble
              }
            >
              {msg.message}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div style={styles.inputArea}>
          <input
            style={styles.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="💡 Ask anything about law..."
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />

          <button style={styles.sendBtn} onClick={sendMessage}>
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    height: "100vh",
    background: "linear-gradient(135deg, #020617, #0f172a)",
    color: "white",
  },
  sidebar: {
    width: "250px",
    padding: "20px",
    borderRight: "1px solid rgba(255,255,255,0.1)",
  },
  newChatBtn: {
    width: "100%",
    padding: "10px",
    marginBottom: "15px",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    border: "none",
    borderRadius: "8px",
    color: "white",
    cursor: "pointer",
  },
  chatItem: {
    padding: "10px",
    marginBottom: "8px",
    borderRadius: "8px",
    cursor: "pointer",
    background: "rgba(255,255,255,0.05)",
  },
  chatContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  topBar: {
    padding: "15px",
    display: "flex",
    justifyContent: "space-between",
  },
  chatArea: {
    flex: 1,
    overflowY: "auto",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  userBubble: {
    alignSelf: "flex-end",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    padding: "10px",
    borderRadius: "15px",
    maxWidth: "60%",
  },
  botBubble: {
    alignSelf: "flex-start",
    background: "#1e293b",
    padding: "10px",
    borderRadius: "15px",
    maxWidth: "60%",
  },
  inputArea: {
    display: "flex",
    padding: "15px",
    borderTop: "1px solid rgba(255,255,255,0.1)",
  },
  input: {
    flex: 1,
    padding: "14px",
    borderRadius: "12px",
    border: "2px solid #6366f1",
    background: "#020617",
    color: "white",
    outline: "none",
    boxShadow: "0 0 10px rgba(99,102,241,0.5)",
  },
  sendBtn: {
    marginLeft: "10px",
    padding: "12px 16px",
    borderRadius: "10px",
    background: "#6366f1",
    border: "none",
    color: "white",
    cursor: "pointer",
  },
  icon: {
    fontSize: "22px",
    cursor: "pointer",
  },
};