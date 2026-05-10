// Lumina – MSc Cloud Computing Project
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import { apiFetch } from "../api.js";
import AppLayout from "../components/AppLayout.jsx";

export default function ManageUsers() {
  const { role, headers } = useAuth();
  const [users, setUsers] = useState([]);
  const [err, setErr] = useState("");

  if (role !== "creator") return <Navigate to="/gallery" replace />;

  async function load() {
    const { ok, data } = await apiFetch("/users", { headers: headers() });
    if (ok) setUsers(data);
    else setErr(data.message || "Failed to load");
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id, name) {
    if (!confirm(`Remove member “${name}”?`)) return;
    const { ok, data } = await apiFetch("/users/" + id, { method: "DELETE", headers: headers() });
    if (ok) load();
    else alert(data.message || "Failed");
  }

  return (
    <AppLayout variant="admin" title="Team" subtitle="Member accounts that can browse the library.">
      {err ? <div className="desk-alert">{err}</div> : null}
      {!users.length && !err ? (
        <div className="desk-empty">No member accounts yet.</div>
      ) : (
        <div className="desk-table">
          <div className="desk-table-head">
            <span>Username</span>
            <span>ID</span>
            <span>Joined</span>
            <span />
          </div>
          {users.map((u) => (
            <div key={u.id} className="desk-table-row">
              <span className="desk-mono">{u.username}</span>
              <span className="desk-mono desk-dim">#{u.id}</span>
              <span className="desk-dim">{u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</span>
              <button type="button" className="desk-mini desk-mini-danger" onClick={() => remove(u.id, u.username)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
