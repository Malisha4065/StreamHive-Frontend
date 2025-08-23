import React, { useState } from "react";
import "./login.css";

export default function Login({ onLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSignup, setIsSignup] = useState(false);

  const handleLogin = async (e) => {
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

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await fetch(
        window.runtimeConfig.VITE_API_SIGNUP || "/api/auth/signup",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, role: "USER", mfaEnabled: false })
        }
      );
      if (!response.ok) throw new Error("Signup failed");
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
            <span>{isSignup ? "SIGN UP" : "SIGN IN"}</span>
            <hr />
          </div>
          <form onSubmit={isSignup ? handleSignup : handleLogin}>
            {isSignup && (
              <div className="m-5 text-slate-500">
                <label htmlFor="name">
                  <b>Name*</b>
                </label>
                <input
                  onChange={(e) => setName(e.target.value)}
                  type="text"
                  id="name"
                  placeholder="Name"
                  required
                />
              </div>
            )}
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
            <button className="loginbtn">{isSignup ? "Sign Up" : "Login"}</button>
            {error && <div style={{ color: 'red' }}>{error}</div>}
          </form>
          <button onClick={() => setIsSignup(!isSignup)} className="mt-4 text-blue-500">
            {isSignup ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}
