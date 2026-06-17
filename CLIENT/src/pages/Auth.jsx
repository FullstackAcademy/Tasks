import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Auth() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password);
      }
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error ?? "Something went wrong");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-gray-900 p-8 shadow-xl ring-1 ring-gray-800">
        <h1 className="mb-6 text-2xl font-semibold text-white">
          {mode === "login" ? "Sign in" : "Create account"}
        </h1>
        <div className="space-y-4">
          <input
            type="email"
            name="email"
            id="email"
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
          <input
            type="password"
            name="password"
            id="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            onClick={submit}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-500"
          >
            {mode === "login" ? "Sign in" : "Sign up"}
          </button>
        </div>
        <button
          onClick={() => setMode(mode === "login" ? "register" : "login")}
          className="mt-4 w-full text-sm text-gray-400 hover:text-gray-200"
        >
          {mode === "login" ? "Wanna Use? Sign up" : "Already got one? Sign in"}
        </button>
      </div>
    </div>
  );
}