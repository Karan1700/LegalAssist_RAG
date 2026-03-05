import React, { useState } from "react";
import axios from "axios";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);

  // ---------------- LOGIN ----------------
  const handleLogin = async () => {
    if (!username || !password) {
      setMsg("⚠️ Please enter username and password");
      setIsError(true);
      return;
    }

    try {
      const res = await axios.post("http://127.0.0.1:8000/login", {
        username,
        password,
      });

      // ✅ FIXED
      if (!res.data.success) {
        setMsg("❌ " + res.data.message);
        setIsError(true);
        return;
      }

      setMsg("✅ " + res.data.message);
      setIsError(false);

      localStorage.setItem("username", username);
      onLogin();

    } catch (err) {
      setMsg("⚠️ Server error");
      setIsError(true);
    }
  };

  // ---------------- SIGNUP ----------------
  const handleSignup = async () => {
    if (!username || !password) {
      setMsg("⚠️ Please enter username and password");
      setIsError(true);
      return;
    }

    try {
      const res = await axios.post("http://127.0.0.1:8000/signup", {
        username,
        password,
      });

      // ✅ FIXED
      if (!res.data.success) {
        setMsg("❌ " + res.data.message);
        setIsError(true);
        return;
      }

      setMsg("✅ " + res.data.message);
      setIsError(false);

    } catch (err) {
      setMsg("⚠️ Server error");
      setIsError(true);
    }
  };

  // ---------------- GUEST ----------------
  const handleGuest = () => {
    localStorage.removeItem("username");
    onLogin();
  };

  return (
    <div style={styles.container}>
      {/* LEFT */}
      <div style={styles.left}>
        <h1 style={styles.logo}>⚖️ LegalMind AI</h1>
        <h2 style={styles.heading}>Your AI Legal Assistant</h2>

        <p style={styles.desc}>
          Ask questions from legal documents using RAG-powered AI.
          Get accurate answers instantly.
        </p>
      </div>

      {/* RIGHT */}
      <div style={styles.right}>
        <div style={styles.card}>
          <h2>Login / Signup</h2>

          {/* ✅ MESSAGE */}
          {msg && (
            <p
              style={{
                ...styles.message,
                color: isError ? "#f87171" : "#4ade80",
              }}
            >
              {msg}
            </p>
          )}

          <input
            style={styles.input}
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="password"
            style={styles.input}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button style={styles.loginBtn} onClick={handleLogin}>
            Login
          </button>

          <button style={styles.signupBtn} onClick={handleSignup}>
            Signup
          </button>

          <button style={styles.guestBtn} onClick={handleGuest}>
            Continue as Guest
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
    background: `
      radial-gradient(circle at top left, rgba(99,102,241,0.25), transparent 40%),
      radial-gradient(circle at bottom right, rgba(139,92,246,0.25), transparent 40%),
      linear-gradient(135deg, #020617, #0f172a)
    `,
    color: "white",
  },

  left: {
    flex: 1,
    padding: "60px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },

  logo: {
    fontSize: "36px",
  },

  heading: {
    fontSize: "24px",
    marginTop: "10px",
    color: "#a5b4fc",
  },

  desc: {
    marginTop: "15px",
    opacity: 0.8,
  },

  right: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  card: {
    width: "380px",
    padding: "30px",
    borderRadius: "16px",
    background: "rgba(30, 41, 59, 0.7)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.1)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  message: {
    fontSize: "13px",
    textAlign: "center",
    fontWeight: "500",
  },

  input: {
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    outline: "none",
    background: "#020617",
    color: "white",
  },

  loginBtn: {
    background: "#6366f1",
    padding: "10px",
    borderRadius: "10px",
    border: "none",
    color: "white",
    cursor: "pointer",
  },

  signupBtn: {
    background: "#22c55e",
    padding: "10px",
    borderRadius: "10px",
    border: "none",
    color: "white",
    cursor: "pointer",
  },

  guestBtn: {
    background: "#374151",
    padding: "10px",
    borderRadius: "10px",
    border: "none",
    color: "white",
    cursor: "pointer",
  },
};