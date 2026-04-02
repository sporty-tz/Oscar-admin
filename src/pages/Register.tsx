import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff } from "react-icons/fi";

const HERO_IMAGE =
  "https://pznwwbrwgpxyveqbqhiq.supabase.co/storage/v1/object/public/Web_images/slider/Christ-the-king.png";

const LOGO =
  "https://pznwwbrwgpxyveqbqhiq.supabase.co/storage/v1/object/public/Web_images/oscar-mkatoliki-logo.png";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPw) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (err) {
      setLoading(false);
      setError(err.message);
      return;
    }

    // The DB trigger auto-creates the admin_users row.
    // If signup requires email confirmation, user will be redirected to login.
    if (data.session) {
      // Auto-confirmed — verify admin row exists via SECURITY DEFINER function
      const { data: isAdmin, error: rpcErr } = await supabase.rpc("is_admin");
      if (rpcErr || !isAdmin) {
        await supabase.auth.signOut();
        setLoading(false);
        setError("Account created but admin access is pending approval.");
        return;
      }
      setLoading(false);
      navigate("/");
    } else {
      setLoading(false);
      setError("Check your email to confirm your account, then sign in.");
    }
  }

  const inputClass =
    "w-full rounded-lg border border-gray-200 bg-white px-4 py-3 pl-11 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition";

  return (
    <div className="flex min-h-screen">
      {/* Left — Form */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-20">
        <div className="mx-auto w-full max-w-md">
          {/* Logo */}
          <div className="mb-8 flex items-center gap-3">
            <img
              src={LOGO}
              alt="Oscar Mkatoliki"
              className="h-12 w-12 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <span className="text-lg font-bold text-sidebar">
              Oscar Mkatoliki
            </span>
          </div>

          <div className="mb-6 text-center text-2xl text-primary/40">✦</div>

          <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
          <p className="mt-2 text-sm text-gray-500">
            Set up your admin account
          </p>

          {error && (
            <div className="mt-6 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {/* Full Name */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <div className="relative">
                <FiUser
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={inputClass}
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="relative">
                <FiMail
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="youremail@mail.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <FiLock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <input
                  type={showPw ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-10`}
                  placeholder="Min. 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="relative">
                <FiLock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <input
                  type={showPw ? "text" : "password"}
                  required
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  className={inputClass}
                  placeholder="Re-enter password"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-sidebar py-3 text-sm font-semibold text-white hover:bg-sidebar/90 disabled:opacity-50 transition"
            >
              {loading ? "Creating account…" : "Sign Up"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-primary hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>

      {/* Right — Hero Image */}
      <div className="hidden lg:block lg:flex-1 relative overflow-hidden bg-sky-100">
        <img
          src={HERO_IMAGE}
          alt="Christ the King"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-sidebar/40 to-transparent" />
      </div>
    </div>
  );
}
