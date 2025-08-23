import React, { useState } from "react";
import './login.css';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const response = await fetch(
        window.runtimeConfig.VITE_API_LOGIN || "/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );
      if (!response.ok) throw new Error("Login failed");
      const data = await response.json();
      if (data.token) {
        window.runtimeConfig.VITE_JWT = data.token;
        if (onLogin) onLogin(data.token);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Sign In</h1>
        <p className="login-subtitle">Enter your credentials to continue</p>

        <form onSubmit={handleSubmit} className="login-form">
          <label>
            <span>Email</span>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error && <div className="error-msg">{error}</div>}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="signup-text">
          Don't have an account? <a href="#">Sign up</a>
        </p>
      </div>
    </div>
  );
}
