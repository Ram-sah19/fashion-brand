import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FormEvent, useEffect, useState } from "react";

export const Route = createFileRoute("/superadmin/login")({
  component: SuperadminLoginPage,
});

function SuperadminLoginPage() {
  const navigate = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      return;
    }

    try {
      const user = JSON.parse(storedUser);

      if (user.role === "superadmin") {
        navigate({ to: "/superadmin" });
        return;
      }

      if (user.role === "admin") {
        navigate({ to: "/admin" });
      }
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  }, [navigate]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/superadmin-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Superadmin login failed");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate({ to: "/superadmin" });
    } catch (error) {
      console.error("Superadmin login error:", error);
      setError("Unable to connect to the server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">
            Superadmin Login
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to the Velora Circle admin monitoring panel
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="rounded-2xl border bg-card p-6 shadow-sm space-y-5"
        >
          <div>
            <label className="mb-2 block text-sm font-medium">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="superadmin@example.com"
              required
              className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
              className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in as Superadmin"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          className="mt-5 w-full text-center text-sm text-muted-foreground hover:text-foreground"
        >
          Back to user login
        </button>
      </div>
    </div>
  );
}