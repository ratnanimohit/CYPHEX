import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { CyphexBackground } from "../components/CyphexBackground";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@intrusionx.io");
  const [password, setPassword] = useState("Admin@123");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      if (!err.response) {
        setError("Backend is not reachable. Start the server on http://127.0.0.1:5055 and try again.");
        return;
      }

      if (err.response.status === 404) {
        setError("Login API is not available on the current backend. Restart the backend and try again.");
        return;
      }

      setError(err.response?.data?.message || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <CyphexBackground />
      <div className="relative z-10 w-full max-w-md rounded-[2rem] border border-cyber-line bg-cyber-panel/80 p-8 shadow-neon">
        <p className="text-xs uppercase tracking-[0.35em] text-cyber-neon">Secure Access</p>
        <h1 className="mt-4 text-4xl font-semibold text-white">Cyphex</h1>
        <p className="mt-3 text-sm text-slate-400">Login to the privacy operations console.</p>
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-2xl border border-cyber-line bg-slate-950/60 px-4 py-3 outline-none focus:border-cyber-blue"
            placeholder="Email"
          />
          <input
            value={password}
            type="password"
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-2xl border border-cyber-line bg-slate-950/60 px-4 py-3 outline-none focus:border-cyber-blue"
            placeholder="Password"
          />
          {error ? <p className="text-sm text-cyber-red">{error}</p> : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-cyber-neon px-4 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Signing in..." : "Enter Console"}
          </button>
        </form>
      </div>
    </div>
  );
}
