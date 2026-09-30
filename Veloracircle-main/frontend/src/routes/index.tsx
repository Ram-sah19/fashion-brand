import {
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Lock,
  ShieldCheck,
  EyeOff,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VeloraLogo } from "@/components/velora/logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in — Velora Circle" },
      {
        name: "description",
        content:
          "Sign in to Velora Circle. Private conversations, hidden member directories, and secure meetings for focused teams.",
      },
      {
        property: "og:title",
        content: "Sign in — Velora Circle",
      },
      {
        property: "og:description",
        content:
          "Connect, meet, and collaborate without unnecessary visibility.",
      },
    ],
  }),
  component: WelcomePage,
});

function NodeArt() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 400 400"
      className="text-primary pointer-events-none absolute -right-16 -bottom-20 h-[420px] w-[420px] opacity-25"
    >
      <g
        stroke="currentColor"
        strokeWidth="0.8"
        fill="none"
        opacity="0.7"
      >
        <path d="M60 320 L150 240 L240 280 L330 190" />
        <path d="M150 240 L120 130 L240 90" />
        <path d="M240 280 L300 340" />
        <path d="M120 130 L60 320" />
        <path d="M240 90 L330 190" />
      </g>

      {[
        [60, 320],
        [150, 240],
        [240, 280],
        [330, 190],
        [120, 130],
        [240, 90],
        [300, 340],
      ].map(([cx, cy]) => (
        <circle
          key={`${cx}-${cy}`}
          cx={cx}
          cy={cy}
          r="4"
          fill="currentColor"
        />
      ))}
    </svg>
  );
}

// =========================
// PASSWORD VALIDATION
// =========================

const isStrongPassword = (
  password: string,
): boolean => {
  return (
    password.length >= 6 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
};

function WelcomePage() {
  const navigate = useNavigate();

  // =========================
  // LOGIN
  // =========================

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // =========================
  // REGISTRATION
  // =========================

  const [name, setName] = useState("");
  const [registerEmail, setRegisterEmail] =
    useState("");
  const [registerPassword, setRegisterPassword] =
    useState("");

  // =========================
  // OTP
  // =========================

  const [otp, setOtp] = useState("");
  const [otpUserId, setOtpUserId] = useState("");

  const [otpPurpose, setOtpPurpose] = useState<
    "login" | "register" | "reset"
  >("login");

  // =========================
  // RESET PASSWORD
  // =========================

  const [resetEmail, setResetEmail] = useState("");
  const [resetToken, setResetToken] =
    useState("");
  const [newPassword, setNewPassword] =
    useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  // =========================
  // SCREEN STATE
  // =========================

  const [showOtp, setShowOtp] = useState(false);
  const [showRegister, setShowRegister] =
    useState(false);
  const [showForgotPassword, setShowForgotPassword] =
    useState(false);
  const [showResetPassword, setShowResetPassword] =
    useState(false);

  // =========================
  // GENERAL STATES
  // =========================

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [otpLoading, setOtpLoading] =
    useState(false);

  // =========================
  // RESEND OTP
  // =========================

  const [resendLoading, setResendLoading] =
    useState(false);

  const [resendCooldown, setResendCooldown] =
    useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setResendCooldown(
        (current) => current - 1,
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  // =========================
  // LOGIN
  // =========================

  const handleLogin = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message || "Login failed",
        );
        return;
      }

      if (data.requiresOtp && data.userId) {
        setOtpUserId(data.userId);
        setOtpPurpose("login");
        setShowOtp(true);
        setOtp("");
        setError("");
        setResendCooldown(60);

        return;
      }

      if (data.token && data.user) {
        localStorage.setItem(
          "token",
          data.token,
        );

        localStorage.setItem(
          "user",
          JSON.stringify(data.user),
        );

        void navigate({ to: "/home" });
        return;
      }

      setError(
        "Unexpected login response",
      );
    } catch (error) {
      console.error("Login error:", error);

      setError(
        "Unable to connect to the server",
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // REGISTRATION
  // =========================

  const handleRegister = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    setError("");

    if (!isStrongPassword(registerPassword)) {
      setError(
        "Password must contain at least 6 characters, one uppercase letter, one lowercase letter, one number, and one special character.",
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email: registerEmail,
            password: registerPassword,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Registration failed",
        );
        return;
      }

      if (data.requiresOtp && data.userId) {
        setOtpUserId(data.userId);
        setOtpPurpose("register");
        setShowOtp(true);
        setOtp("");
        setError("");
        setResendCooldown(60);

        return;
      }

      setError(
        "Unexpected registration response",
      );
    } catch (error) {
      console.error(
        "Registration error:",
        error,
      );

      setError(
        "Unable to connect to the server",
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // FORGOT PASSWORD
  // =========================

  const handleForgotPassword = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    setError("");

    if (!resetEmail.trim()) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/auth/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: resetEmail,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Unable to send reset OTP",
        );
        return;
      }

      if (data.requiresOtp && data.userId) {
        setOtpUserId(data.userId);
        setOtpPurpose("reset");
        setOtp("");
        setShowForgotPassword(false);
        setShowOtp(true);
        setShowRegister(false);
        setShowResetPassword(false);
        setResendCooldown(60);
        setError("");

        return;
      }

      setError(
        "Unable to start password reset",
      );
    } catch (error) {
      console.error(
        "Forgot password error:",
        error,
      );

      setError(
        "Unable to connect to the server",
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // VERIFY OTP
  // =========================

  const handleVerifyOtp = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    setError("");

    if (!/^\d{6}$/.test(otp)) {
      setError(
        "Please enter the 6-digit OTP",
      );
      return;
    }

    if (!otpUserId) {
      setError(
        "Verification session is missing. Please try again.",
      );
      return;
    }

    setOtpLoading(true);

    try {
      const response = await fetch(
        "/api/otp/verify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: otpUserId,
            otp,
            purpose: otpPurpose,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "OTP verification failed",
        );
        return;
      }

      // =========================
      // REGISTRATION OTP SUCCESS
      // =========================

      if (otpPurpose === "register") {
        setShowOtp(false);
        setShowRegister(false);

        setOtp("");
        setOtpUserId("");
        setOtpPurpose("login");

        setName("");
        setRegisterEmail("");
        setRegisterPassword("");

        setEmail(registerEmail);
        setPassword("");

        setResendCooldown(0);
        setError("");

        return;
      }

      // =========================
      // RESET OTP SUCCESS
      // =========================

      if (otpPurpose === "reset") {
        if (!data.resetToken) {
          setError(
            "Invalid password reset response from server",
          );
          return;
        }

        setResetToken(data.resetToken);

        setShowOtp(false);
        setShowResetPassword(true);

        setOtp("");
        setOtpUserId("");
        setResendCooldown(0);
        setError("");

        return;
      }

      // =========================
      // LOGIN OTP SUCCESS
      // =========================

      if (!data.token || !data.user) {
        setError(
          "Invalid login response from server",
        );
        return;
      }

      localStorage.setItem(
        "token",
        data.token,
      );

      localStorage.setItem(
        "user",
        JSON.stringify(data.user),
      );

      void navigate({ to: "/home" });
    } catch (error) {
      console.error(
        "OTP verification error:",
        error,
      );

      setError(
        "Unable to connect to the server",
      );
    } finally {
      setOtpLoading(false);
    }
  };

  // =========================
  // RESEND OTP
  // =========================

  const handleResendOtp = async () => {
    if (
      !otpUserId ||
      resendCooldown > 0 ||
      resendLoading
    ) {
      return;
    }

    setResendLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/otp/resend",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: otpUserId,
            purpose: otpPurpose,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Unable to resend OTP",
        );
        return;
      }

      setOtp("");
      setResendCooldown(60);
      setError("");
    } catch (error) {
      console.error(
        "Resend OTP error:",
        error,
      );

      setError(
        "Unable to connect to the server",
      );
    } finally {
      setResendLoading(false);
    }
  };

  // =========================
  // RESET PASSWORD
  // =========================

  const handleResetPassword = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    setError("");

    if (!isStrongPassword(newPassword)) {
      setError(
        "Password must contain at least 6 characters, one uppercase letter, one lowercase letter, one number, and one special character.",
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!resetToken) {
      setError(
        "Password reset session has expired. Please try again.",
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/auth/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            resetToken,
            password: newPassword,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Unable to reset password",
        );
        return;
      }

      // Reset everything and return to login
      setShowResetPassword(false);
      setShowForgotPassword(false);
      setShowRegister(false);
      setShowOtp(false);

      setResetToken("");
      setResetEmail("");
      setNewPassword("");
      setConfirmPassword("");

      setEmail("");
      setPassword("");

      setOtp("");
      setOtpUserId("");
      setOtpPurpose("login");

      setResendCooldown(0);
      setError("");

      alert(
        "Password reset successful. You can now sign in with your new password.",
      );
    } catch (error) {
      console.error(
        "Reset password error:",
        error,
      );

      setError(
        "Unable to connect to the server",
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // BACK TO LOGIN
  // =========================

  const handleBackToLogin = () => {
    setShowOtp(false);
    setShowRegister(false);
    setShowForgotPassword(false);
    setShowResetPassword(false);

    setOtp("");
    setOtpUserId("");
    setOtpPurpose("login");

    setResetToken("");
    setResetEmail("");
    setNewPassword("");
    setConfirmPassword("");

    setError("");
    setResendCooldown(0);
  };

  // =========================
  // SHOW REGISTER
  // =========================

  const handleShowRegister = () => {
    setShowRegister(true);
    setShowOtp(false);
    setShowForgotPassword(false);
    setShowResetPassword(false);

    setError("");
    setEmail("");
    setPassword("");
    setOtp("");
    setOtpUserId("");
    setResendCooldown(0);
  };

  // =========================
  // SHOW FORGOT PASSWORD
  // =========================

  const handleShowForgotPassword = () => {
    setShowForgotPassword(true);
    setShowRegister(false);
    setShowOtp(false);
    setShowResetPassword(false);

    setResetEmail(email);
    setError("");
    setOtp("");
    setOtpUserId("");
    setResendCooldown(0);
  };

  return (
    <div className="mesh-bg bg-background relative min-h-[100dvh] overflow-hidden">
      <div className="mx-auto grid min-h-[100dvh] max-w-7xl grid-cols-1 gap-10 px-5 py-8 lg:grid-cols-[1.1fr_minmax(0,440px)] lg:items-center lg:gap-16 lg:px-10">
        <section className="relative flex min-w-0 flex-col justify-center">
          <VeloraLogo />

          <h1 className="mt-12 text-[clamp(2.1rem,5vw,3.6rem)] leading-[1.05] font-extrabold">
            Private conversations.
            <br />

            <span className="text-gradient-brand">
              Focused collaboration.
            </span>
          </h1>

          <p className="text-muted-foreground mt-5 max-w-md text-sm leading-relaxed sm:text-base">
            Connect, meet, and collaborate without
            unnecessary visibility.
          </p>

          <ul className="mt-10 grid max-w-lg gap-3 sm:grid-cols-3">
            {[
              {
                icon: EyeOff,
                label:
                  "Hidden member directory",
              },
              {
                icon: Lock,
                label:
                  "Private Circles bydefault",
              },
              {
                icon: ShieldCheck,
                label:
                  "Encrypted meetings",
              },
            ].map(
              ({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="surface-panel flex items-start gap-2.5 rounded-xl px-3.5 py-3 text-xs"
                >
                  <Icon
                    className="text-primary mt-0.5 h-4 w-4 shrink-0"
                    aria-hidden
                  />

                  <span className="min-w-0">
                    {label}
                  </span>
                </li>
              ),
            )}
          </ul>

          <NodeArt />
        </section>

        <section className="glass relative z-10 rounded-3xl p-6 shadow-[var(--shadow-float)] sm:p-8">

          {/* =========================
              OTP SCREEN
             ========================= */}

          {showOtp ? (
            <>
              <h2 className="text-lg font-semibold">
                {otpPurpose === "reset"
                  ? "Reset your password"
                  : "Verify your email"}
              </h2>

              <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
                We sent a 6-digit verification
                code to your email address. Enter
                it below to continue.
              </p>

              <form
                className="mt-7 space-y-4"
                onSubmit={handleVerifyOtp}
              >
                <div className="space-y-2">
                  <Label htmlFor="otp">
                    Verification code
                  </Label>

                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => {
                      const value =
                        e.target.value.replace(
                          /\D/g,
                          "",
                        );

                      setOtp(value);
                    }}
                    required
                    autoFocus
                  />
                </div>

                {error && (
                  <p className="text-destructive text-sm">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  className="h-11 w-full"
                  disabled={
                    otpLoading ||
                    otp.length !== 6
                  }
                >
                  {otpLoading
                    ? "Verifying..."
                    : otpPurpose === "register"
                      ? "Verify & Create Account"
                      : otpPurpose === "reset"
                        ? "Verify OTP"
                        : "Verify & Sign in"}

                  {!otpLoading && (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                </Button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={
                    resendLoading ||
                    resendCooldown > 0
                  }
                  className="text-primary hover:text-primary/80 w-full text-center text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {resendLoading
                    ? "Sending..."
                    : resendCooldown > 0
                      ? `Resend OTP in ${resendCooldown}s`
                      : "Resend OTP"}
                </button>

                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="text-muted-foreground hover:text-foreground w-full text-center text-xs transition-colors"
                >
                  Back to sign in
                </button>
              </form>
            </>
          ) : showResetPassword ? (
            /* =========================
               NEW PASSWORD SCREEN
               ========================= */

            <>
              <h2 className="text-lg font-semibold">
                Create a new password
              </h2>

              <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                Enter your new password below.
              </p>

              <form
                className="mt-7 space-y-4"
                onSubmit={handleResetPassword}
              >
                <div className="space-y-2">
                  <Label htmlFor="new-password">
                    New password
                  </Label>

                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) =>
                      setNewPassword(
                        e.target.value,
                      )
                    }
                    required
                  />

                  <p className="text-muted-foreground text-[10px] leading-relaxed">
                    Password must contain at least
                    6 characters, 1 uppercase letter,
                    1 lowercase letter, 1 number,
                    and 1 special character.
                    <br />
                    Your new password must be
                    different from your previous
                    password.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">
                    Confirm password
                  </Label>

                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(
                        e.target.value,
                      )
                    }
                    required
                  />
                </div>

                {error && (
                  <p className="text-destructive text-sm">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  className="h-11 w-full"
                  disabled={loading}
                >
                  {loading
                    ? "Updating password..."
                    : "Reset password"}

                  {!loading && (
                    <Lock className="h-4 w-4" />
                  )}
                </Button>
              </form>

              <button
                type="button"
                onClick={handleBackToLogin}
                className="text-muted-foreground hover:text-foreground mt-6 w-full text-center text-xs transition-colors"
              >
                Back to sign in
              </button>
            </>
          ) : showForgotPassword ? (
            /* =========================
               FORGOT PASSWORD SCREEN
               ========================= */

            <>
              <h2 className="text-lg font-semibold">
                Forgot your password?
              </h2>

              <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                Enter your email address and we'll
                send you a verification code to reset
                your password.
              </p>

              <form
                className="mt-7 space-y-4"
                onSubmit={handleForgotPassword}
              >
                <div className="space-y-2">
                  <Label htmlFor="reset-email">
                    Email
                  </Label>

                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="you@company.com"
                    autoComplete="email"
                    value={resetEmail}
                    onChange={(e) =>
                      setResetEmail(
                        e.target.value,
                      )
                    }
                    required
                    autoFocus
                  />
                </div>

                {error && (
                  <p className="text-destructive text-sm">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  className="h-11 w-full"
                  disabled={loading}
                >
                  {loading
                    ? "Sending OTP..."
                    : "Send reset OTP"}

                  {!loading && (
                    <ArrowRight className="h-4 w-4" />
                  )}
                </Button>
              </form>

              <button
                type="button"
                onClick={handleBackToLogin}
                className="text-muted-foreground hover:text-foreground mt-6 w-full text-center text-xs transition-colors"
              >
                Back to sign in
              </button>
            </>
          ) : showRegister ? (
            /* =========================
               REGISTRATION SCREEN
               ========================= */

            <>
              <h2 className="text-lg font-semibold">
                Create your account
              </h2>

              <p className="text-muted-foreground mt-1 text-xs">
                Create your private Velora workspace
                account.
              </p>

              <form
                className="mt-7 space-y-4"
                onSubmit={handleRegister}
              >
                <div className="space-y-2">
                  <Label htmlFor="register-name">
                    Name
                  </Label>

                  <Input
                    id="register-name"
                    type="text"
                    placeholder="Your name"
                    autoComplete="name"
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-email">
                    Email
                  </Label>

                  <Input
                    id="register-email"
                    type="email"
                    placeholder="you@company.com"
                    autoComplete="email"
                    value={registerEmail}
                    onChange={(e) =>
                      setRegisterEmail(
                        e.target.value,
                      )
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password">
                    Password
                  </Label>

                  <Input
                    id="register-password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    value={registerPassword}
                    onChange={(e) =>
                      setRegisterPassword(
                        e.target.value,
                      )
                    }
                    required
                  />

                  <p className="text-muted-foreground text-[10px] leading-relaxed">
                    Password must contain at least
                    6 characters, 1 uppercase letter,
                    1 lowercase letter, 1 number,
                    and 1 special character.
                  </p>
                </div>

                {error && (
                  <p className="text-destructive text-sm">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  className="h-11 w-full"
                  disabled={loading}
                >
                  {loading
                    ? "Creating account..."
                    : "Create account"}

                  {!loading && (
                    <ArrowRight className="h-4 w-4" />
                  )}
                </Button>
              </form>

              <p className="text-muted-foreground mt-6 text-center text-xs">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="text-primary font-medium hover:underline"
                >
                  Sign in
                </button>
              </p>
            </>
          ) : (
            /* =========================
               LOGIN SCREEN
               ========================= */

            <>
              <h2 className="text-lg font-semibold">
                Welcome back
              </h2>

              <p className="text-muted-foreground mt-1 text-xs">
                Sign in to your private workspace.
              </p>

              <form
                className="mt-7 space-y-4"
                onSubmit={handleLogin}
              >
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email
                  </Label>

                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">
                      Password
                    </Label>

                    <button
                      type="button"
                      onClick={
                        handleShowForgotPassword
                      }
                      className="text-muted-foreground hover:text-foreground text-[11px] transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    required
                  />
                </div>

                {error && (
                  <p className="text-destructive text-sm">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  className="h-11 w-full"
                  disabled={loading}
                >
                  {loading
                    ? "Checking..."
                    : "Continue"}

                  {!loading && (
                    <ArrowRight className="h-4 w-4" />
                  )}
                </Button>
              </form>

              <p className="text-muted-foreground mt-6 text-center text-xs">
                New to Velora?{" "}
                <button
                  type="button"
                  onClick={handleShowRegister}
                  className="text-primary font-medium hover:underline"
                >
                  Create account
                </button>
              </p>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

