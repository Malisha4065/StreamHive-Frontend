import React, { useState } from "react";
import "./login.css";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await fetch(
        window.runtimeConfig.VITE_API_LOGIN || "/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
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
    }
  };

  return (
    <div className="login">
      <div className="container bg-white text-center justify-center flex">
        <div className="content">
          <div className="title m-5 font-bold text-2xl text-gray-700">
            <span>SIGN IN</span>
            <hr />
          </div>
          <form onSubmit={handleSubmit}>
            <div className="m-5 text-slate-500">
              <label htmlFor="email">
                <b>Email Address*</b>
              </label>
              <input
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                id="email"
                placeholder="E-Mail"
                required
              />
            </div>
            <div className="m-5 text-slate-500">
              <label htmlFor="psw">
                <b>Password</b>
              </label>
              <input
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                id="psw"
                placeholder="Password"
                required
              />
            </div>
            <button className="loginbtn">Login</button>
            {error && <div style={{ color: 'red' }}>{error}</div>}
          </form>
        </div>
      </div>
    </div>
  );
}
