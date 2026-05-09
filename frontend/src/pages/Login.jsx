import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import { apiFetch } from "../api.js";
import { luminaFile } from "../mediaPaths.js";

const AUTH_BG = [1, 2, 3, 4, 5].map((n) => luminaFile(`auth-${n}.jpg`));

export default function Login() {
  const { loggedIn, save, role } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [mode, setMode] = useState(params.get("mode") === "signup" ? "signup" : "login");
  const [lUser, setLUser] = useState("");
  const [lPass, setLPass] = useState("");
  const [sUser, setSUser] = useState("");
  const [sPass, setSPass] = useState("");
  const [sConf, setSConf] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (loggedIn) nav(role === "creator" ? "/admin" : "/gallery", { replace: true });
  }, [loggedIn, role, nav]);

  async function doLogin(e) {
    e.preventDefault();
    setErr("");
    if (!lUser.trim() || !lPass) return setErr("Enter username and password.");
    const { ok, data } = await apiFetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: lUser.trim(), password: lPass }),
    });
    if (ok) {
      save(data.token, data.role, data.username);
      nav(data.role === "creator" ? "/admin" : "/gallery", { replace: true });
    } else setErr(data.message || "Login failed.");
  }

  async function doSignup(e) {
    e.preventDefault();
    setErr("");
    if (!sUser.trim() || !sPass) return setErr("Username and password required.");
    if (sUser.length < 3) return setErr("Username at least 3 characters.");
    if (sPass.length < 6) return setErr("Password at least 6 characters.");
    if (sPass !== sConf) return setErr("Passwords do not match.");
    const { ok, data } = await apiFetch("/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: sUser.trim(), password: sPass }),
    });
    if (ok) {
      save(data.token, data.role, data.username);
      nav("/gallery", { replace: true });
    } else setErr(data.message || "Signup failed.");
  }

  return (
    <div className="auth-page">
      <div className="auth-bg-cover" aria-hidden="true">
        <img src={AUTH_BG[0]} alt="" width={1600} height={1000} className="auth-bg-cover-img" fetchPriority="high" decoding="async" />
      </div>
      <div className="auth-mosaic" aria-hidden="true">
        {AUTH_BG.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            width={720}
            height={520}
            className={`auth-mosaic-img auth-mosaic-img--${i + 1}`}
            loading={i < 2 ? "eager" : "lazy"}
            decoding="async"
          />
        ))}
      </div>
      <div className="auth-page-atmos" aria-hidden="true" />
      <div className="auth-page-blobs" aria-hidden="true">
        <span className="auth-blob auth-blob--a" />
        <span className="auth-blob auth-blob--b" />
        <span className="auth-blob auth-blob--c" />
      </div>
      <div className="auth-shell">
        <Link to="/" className="auth-brand-mark">
          <span className="brand-mark" aria-hidden />
          <span className="auth-brand-text">Lumina</span>
        </Link>
        <p className="auth-tagline">Sign in or create a member account</p>
        <div className="auth-card">
          <div className="auth-tabs">
            <button type="button" className={mode === "login" ? "is-on" : ""} onClick={() => setMode("login")}>
              Sign in
            </button>
            <button type="button" className={mode === "signup" ? "is-on" : ""} onClick={() => setMode("signup")}>
              Create account
            </button>
          </div>
          {err && (
            <p className="auth-error" role="alert">
              {err}
            </p>
          )}
          {mode === "login" ? (
            <form onSubmit={doLogin}>
              <label className="field-label">Username</label>
              <input className="input" value={lUser} onChange={(e) => setLUser(e.target.value)} autoComplete="username" />
              <label className="field-label">Password</label>
              <input className="input" type="password" value={lPass} onChange={(e) => setLPass(e.target.value)} autoComplete="current-password" />
              <button type="submit" className="btn btn-accent btn-block">
                Continue
              </button>
            </form>
          ) : (
            <form onSubmit={doSignup}>
              <p className="auth-signup-hint">Members browse the collection. Admin access is assigned separately.</p>
              <label className="field-label">Username</label>
              <input className="input" value={sUser} onChange={(e) => setSUser(e.target.value)} autoComplete="username" />
              <label className="field-label">Password</label>
              <input className="input" type="password" value={sPass} onChange={(e) => setSPass(e.target.value)} autoComplete="new-password" />
              <label className="field-label">Confirm password</label>
              <input className="input" type="password" value={sConf} onChange={(e) => setSConf(e.target.value)} autoComplete="new-password" />
              <button type="submit" className="btn btn-accent btn-block">
                Create member
              </button>
            </form>
          )}
        </div>
        <Link to="/" className="auth-landing-link">
          Discover Lumina
        </Link>
      </div>
    </div>
  );
}
