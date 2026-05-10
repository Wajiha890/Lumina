// Lumina – MSc Cloud Computing Project
import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";

export default function AppLayout({ variant, title, subtitle, children }) {
  const { username, logout } = useAuth();
  const admin = variant === "admin";

  return (
    <div className="layout" data-variant={variant}>
      <header className="topbar">
        <div className="topbar-inner">
          <Link to={admin ? "/admin" : "/gallery"} className="topbar-brand">
            <span className="brand-mark" aria-hidden />
            <span className="topbar-title">Lumina</span>
          </Link>

          <nav className="topbar-nav" aria-label="Main">
            {admin ? (
              <>
                <NavLink end to="/admin" className={({ isActive }) => "topbar-link" + (isActive ? " is-active" : "")}>
                  Admin
                </NavLink>
                <NavLink to="/admin/users" className={({ isActive }) => "topbar-link" + (isActive ? " is-active" : "")}>
                  Team
                </NavLink>
              </>
            ) : (
              <NavLink to="/gallery" className={({ isActive }) => "topbar-link" + (isActive ? " is-active" : "")}>
                Library
              </NavLink>
            )}
          </nav>

          <div className="topbar-aside">
            <span className="topbar-user">{username}</span>
            <span className={"role-tag" + (admin ? " is-admin" : "")}>{admin ? "Admin" : "Member"}</span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      {!admin && (
        <div className="location-bar">
          <span className="location-bar-icon">📍</span>
          <span>You are in the <strong>Library</strong></span>
        </div>
      )}

      <main className="layout-main">
        {(title || subtitle) && (
          <header className="page-intro">
            {title && <h1 className="page-h1">{title}</h1>}
            {subtitle && <p className="page-lead">{subtitle}</p>}
          </header>
        )}
        {children}
      </main>
    </div>
  );
}
