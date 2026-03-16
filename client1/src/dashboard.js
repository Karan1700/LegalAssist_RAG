import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { FaUserCircle } from "react-icons/fa";

const BACKEND_URL = "http://127.0.0.1:8000";

export default function Dashboard({ onLogout }) {

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [chatList, setChatList] = useState([]);

  const chatEndRef = useRef(null);

  const username = localStorage.getItem("username");
  const isGuest = localStorage.getItem("guest") === "true";

  // ---------------- LOAD CHAT LIST ----------------
  const loadChats = useCallback(async () => {

    if (isGuest) return;
    if (!username) return;

    try {

      const res = await axios.get(`${BACKEND_URL}/chats/${username}`);
      setChatList(res.data);

      if (res.data.length > 0 && !sessionId) {

        const latest = res.data[res.data.length - 1].id;
        setSessionId(latest);

        const msgRes = await axios.get(`${BACKEND_URL}/messages/${latest}`);
        setMessages(msgRes.data);
      }

    } catch {
      console.log("Error loading chats");
    }

  }, [username, sessionId, isGuest]);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  // ---------------- AUTO SCROLL ----------------
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ---------------- SEND MESSAGE ----------------
  const sendMessage = async () => {

    if (!input.trim()) return;

    // guest → no session required
    if (!sessionId && !isGuest && username) {
      alert("Please create a new chat first");
      return;
    }

    const userMsg = { role: "user", message: input };
    setMessages(prev => [...prev, userMsg]);

    try {

      const res = await axios.post(`${BACKEND_URL}/ask`, {
        question: input,
        session_id: isGuest ? null : sessionId
      });

      const botMsg = {
        role: "assistant",
        message: res.data.answer
      };

      setMessages(prev => [...prev, botMsg]);

    } catch {

      setMessages(prev => [
        ...prev,
        { role: "assistant", message: "⚠️ Error fetching response" }
      ]);

    }

    setInput("");
  };

  // ---------------- NEW CHAT ----------------
  const handleNewChat = async () => {

    if (isGuest) {
      setMessages([]);
      return;
    }

    try {

      const res = await axios.post(`${BACKEND_URL}/new_chat/${username}`);

      const id = res.data.session_id;

      setSessionId(id);
      setMessages([]);
      setChatList(prev => [...prev, { id }]);

    } catch {
      console.log("Error creating chat");
    }
  };

  // ---------------- LOAD EXISTING CHAT ----------------
  const loadChat = async (id) => {

    setSessionId(id);

    try {
      const res = await axios.get(`${BACKEND_URL}/messages/${id}`);
      setMessages(res.data);
    } catch {
      console.log("Error loading messages");
    }
  };

  // ---------------- DELETE CHAT ----------------
  const deleteChat = async (id) => {

    const confirmDelete = window.confirm("Delete this chat?");
    if (!confirmDelete) return;

    try {

      await axios.delete(`${BACKEND_URL}/chat/${id}`);

      setChatList(prev => prev.filter(c => c.id !== id));

      if (sessionId === id) {
        setSessionId(null);
        setMessages([]);
      }

    } catch {
      alert("Error deleting chat");
    }
  };

  return (
    <div style={styles.container}>

      {/* Sidebar */}
      {!isGuest && username && (
        <div style={styles.sidebar}>

          <h3>💬 Chats</h3>

          <button
            style={styles.newChatBtn}
            onClick={handleNewChat}
          >
            + New Chat
          </button>

          <div style={styles.chatList}>

            {chatList.map(chat => (
              <div
                key={chat.id}
                style={{
                  ...styles.chatItem,
                  background:
                    sessionId === chat.id
                      ? "rgba(99,102,241,0.3)"
                      : "rgba(255,255,255,0.05)"
                }}
              >
                <span
                  style={{ flex: 1 }}
                  onClick={() => loadChat(chat.id)}
                >
                  Chat #{chat.id}
                </span>

                <span
                  style={styles.deleteBtn}
                  onClick={() => deleteChat(chat.id)}
                >
                  🗑
                </span>

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
            onKeyDown={(e) =>
              e.key === "Enter" && sendMessage()
            }
          />

          <button
            style={styles.sendBtn}
            onClick={sendMessage}
          >
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
  chatList: { marginTop: "10px" },
  chatItem: {
    padding: "10px",
    marginBottom: "8px",
    borderRadius: "8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
  },
  deleteBtn: {
    marginLeft: "10px",
    cursor: "pointer",
    opacity: 0.6,
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
  }
};