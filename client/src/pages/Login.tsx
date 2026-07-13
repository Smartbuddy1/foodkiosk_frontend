import { FormEvent, useState } from "react";
import { LogIn } from "lucide-react";
import { api, storeAuth, type AuthUser } from "../lib/api";

type LoginProps = {
  onLogin?: (token: string, user: AuthUser) => void;
  title?: string;
};

export default function Login({ onLogin, title = "Staff Login" }: LoginProps) {
  const [email, setEmail] = useState("admin@food.local");
  const [password, setPassword] = useState("Admin@12345");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await api.login(email, password);
      storeAuth(response.token, response.user);
      onLogin?.(response.token, response.user);
      if (!onLogin) window.location.href = "/admin";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-cream text-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5">
        <div className="mb-7 flex items-center gap-3">
          <img
            className="h-16 w-16 rounded-full object-contain"
            src="/images/brand/dairy-don-logo.png"
            alt="Dairy Don"
          />
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-steel">
              Dairy Don The Real Ice Cream
            </p>
            <h1 className="text-4xl font-bold">{title}</h1>
          </div>
        </div>

        <form
          className="rounded-lg border border-amber-200 bg-white p-5 shadow-kiosk"
          onSubmit={handleSubmit}
        >
          <label className="mb-2 block text-sm font-bold" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className="mb-4 h-14 w-full rounded-md border border-amber-200 px-4 outline-none focus:border-ember"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            autoComplete="email"
          />

          <label className="mb-2 block text-sm font-bold" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className="mb-4 h-14 w-full rounded-md border border-amber-200 px-4 outline-none focus:border-ember"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            autoComplete="current-password"
          />

          {error && (
            <p className="mb-4 rounded-md bg-red-50 p-3 text-red-700">
              {error}
            </p>
          )}

          <button
            className="flex w-full items-center justify-center gap-2 rounded-md bg-ink px-5 py-3 text-lg font-bold text-white disabled:opacity-60"
            disabled={loading}
            type="submit"
          >
            <LogIn size={22} />
            {loading ? "Signing in" : "Sign In"}
          </button>
        </form>
      </div>
    </main>
  );
}
