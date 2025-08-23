import React, { useState } from "react";

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
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center">
        <div className="text-2xl font-bold text-slate-200">Sign in</div>
        <p className="text-slate-400 text-sm mt-1">Use your account to continue</p>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="block text-sm text-slate-300 mb-1">Email address</span>
          <input
            className="input"
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            id="email"
            placeholder="you@example.com"
            required
          />
        </label>

        <label className="block">
          <span className="block text-sm text-slate-300 mb-1">Password</span>
          <input
            className="input"
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            id="psw"
            placeholder="••••••••"
            required
          />
        </label>
      </div>

      {error && <div className="text-rose-300 text-sm">{error}</div>}

      <div className="flex items-center justify-between">
        <button className="btn-primary w-full">Login</button>
      </div>
    </form>
  );
}
