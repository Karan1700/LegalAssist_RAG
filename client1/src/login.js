import React, { useState } from "react";
import axios from "axios";

const BACKEND_URL = "http://127.0.0.1:8000";

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

      const res = await axios.post(`${BACKEND_URL}/login`, {
        username: username,
        password: password
      });

      if (!res.data.success) {
        setMsg("❌ " + res.data.message);
        setIsError(true);
        return;
      }

      setMsg("✅ Login successful");
      setIsError(false);

      // ✅ Save username
      localStorage.setItem("username", username);

      // ✅ Remove guest flag
      localStorage.removeItem("guest");

      // ✅ Auto create first chat session
      try {
        await axios.post(`${BACKEND_URL}/new_chat/${username}`);
      } catch {
        console.log("Session creation failed");
      }

      onLogin(username);

    } catch {

      setMsg("⚠️ Server error. Backend may not be running.");
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

      const res = await axios.post(`${BACKEND_URL}/signup`, {
        username: username,
        password: password
      });

      if (!res.data.success) {
        setMsg("❌ " + res.data.message);
        setIsError(true);
        return;
      }

      setMsg("✅ Signup successful! Please login.");
      setIsError(false);

    } catch {

      setMsg("⚠️ Server error");
      setIsError(true);

    }
  };

  // ---------------- GUEST ----------------
  const handleGuest = () => {

    // ✅ Remove username
    localStorage.removeItem("username");

    // ✅ Set guest flag
    localStorage.setItem("guest", "true");

    // Go dashboard
    onLogin(null);

  };

  return (
    <div style={styles.container}>

      {/* LEFT SIDE */}
      <div style={styles.left}>

        <h1 style={styles.logo}>⚖️ LegalMind AI</h1>

        <h2 style={styles.heading}>
          Your AI Legal Assistant
        </h2>

        <p style={styles.desc}>
          Ask questions from legal documents using
          Retrieval Augmented Generation (RAG).
          Get accurate answers instantly.
        </p>

      </div>

      {/* RIGHT SIDE */}
      <div style={styles.right}>

        <div style={styles.card}>

          <h2>Login / Signup</h2>

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

          <button
            style={styles.loginBtn}
            onClick={handleLogin}
          >
            Login
          </button>

          <button
            style={styles.signupBtn}
            onClick={handleSignup}
          >
            Signup
          </button>

          <button
            style={styles.guestBtn}
            onClick={handleGuest}
          >
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
    maxWidth: "400px",
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