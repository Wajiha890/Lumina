// Creator page – Lumina Media Sharing Platform
import { useEffect, useRef, useState } from "react";
import { Navigate, NavLink } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import { apiFetch } from "../api.js";
import AppLayout from "../components/AppLayout.jsx";

export default function Creator() {
  const { role, username, headers, token } = useAuth();
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [toast, setToast] = useState("");
  const [mediaType, setMediaType] = useState("image");
  const [uploadMethod, setUploadMethod] = useState("local");
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [people, setPeople] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [file, setFile] = useState(null);
  const [panel, setPanel] = useState("pipeline");
  const panelRef = useRef(null);

  function switchPanel(name) {
    setPanel(name);
    setTimeout(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  useEffect(() => {
    if (role === "creator") load();
  }, [role]);

  async function load() {
    const { ok, data } = await apiFetch("/images");
    if (ok) setItems(data.filter((i) => i.uploader === username));
  }

  async function upload(e) {
    e.preventDefault();
    if (!title.trim()) return setToast("Title required");
    const fd = new FormData();
    fd.append("title", title.trim());
    fd.append("caption", caption);
    fd.append("location", location);
    fd.append("people", people);
    fd.append("media_type", mediaType);
    fd.append("upload_method", uploadMethod);
    if (uploadMethod === "local") {
      if (!file) return setToast("Choose a file");
      fd.append("media_file", file);
    } else {
      fd.append("media_url", mediaUrl.trim());
    }
    const { ok, data } = await apiFetch("/images", {
      method: "POST",
      headers: { Authorization: "Bearer " + token },
      body: fd,
    });
    if (ok) {
      setToast("Published");
      setTitle("");
      setCaption("");
      setLocation("");
      setPeople("");
      setMediaUrl("");
      setFile(null);
      load();
      setPanel("archive");
    } else setToast(data.message || "Upload failed");
  }

  async function viewStats(id) {
    const { ok, data } = await apiFetch("/images/" + id + "/stats", { headers: headers() });
    if (ok) setStats(data);
    else setToast(data.message || "Failed");
  }

  async function del(id) {
    if (!confirm("Remove this from the library?")) return;
    const { ok } = await apiFetch("/images/" + id, { method: "DELETE", headers: headers() });
    if (ok) {
      setToast("Removed");
      setStats(null);
      load();
    }
  }

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  function onDropFile(e) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    if (mediaType === "image" && !f.type.startsWith("image/")) return setToast("Drop an image file");
    if (mediaType === "video" && !f.type.startsWith("video/")) return setToast("Drop a video file");
    setFile(f);
    setUploadMethod("local");
  }

  if (role !== "creator") return <Navigate to="/gallery" replace />;

  const mineCount = items.length;
  const commentsCount = items.reduce((s, i) => s + (i.comment_count || 0), 0);
  const ratingsCount = items.reduce((s, i) => s + (i.rating_count || 0), 0);

  return (
    <AppLayout variant="admin" title="Admin center" subtitle="Publish media, watch engagement, and control member access.">
      <div className="admin-dash">
        <section className="admin-hero">
          <div>
            <p className="admin-hello">Signed in as admin</p>
            <p className="admin-name">{username}</p>
            <p className="admin-hero-lead">
              Counts below update when you have live posts and when members comment or rate. Zeros simply mean nothing
              is published yet—or no one has reacted.
            </p>
          </div>
          <div className="admin-hero-actions">
            <button type="button" className="btn btn-primary btn-sm" onClick={() => switchPanel("pipeline")}>
              New upload
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => switchPanel("archive")}>
              My library
            </button>
            <NavLink to="/admin/users" className="btn btn-ghost btn-sm">
              Team
            </NavLink>
          </div>
        </section>

        <div className="admin-stat-row">
          <article className="admin-stat-card">
            <div className="admin-stat-icon" aria-hidden>
              🖼
            </div>
            <div className="admin-stat-label">Live uploads</div>
            <div className="admin-stat-val">{mineCount}</div>
            <p className="admin-stat-hint">{mineCount === 0 ? "Publish your first image or video to populate the public library." : "Items visible to all signed-in members."}</p>
          </article>
          <article className="admin-stat-card">
            <div className="admin-stat-icon" aria-hidden>
              💬
            </div>
            <div className="admin-stat-label">Comments</div>
            <div className="admin-stat-val">{commentsCount}</div>
            <p className="admin-stat-hint">{commentsCount === 0 ? "Comments appear here once members leave notes on your posts." : "Total comments across your uploads."}</p>
          </article>
          <article className="admin-stat-card">
            <div className="admin-stat-icon" aria-hidden>
              ★
            </div>
            <div className="admin-stat-label">Ratings</div>
            <div className="admin-stat-val">{ratingsCount}</div>
            <p className="admin-stat-hint">{ratingsCount === 0 ? "Star ratings show up after viewers score your work." : "Individual star votes across your posts."}</p>
          </article>
        </div>

        <div className="admin-shell">
          <aside className="admin-side">
            <p className="admin-side-title">Publishing checklist</p>
            <ul className="admin-check">
              <li>Pick image or video and file or URL</li>
              <li>Add a clear title (required)</li>
              <li>Optional caption, place, people</li>
              <li>Publish, then review under My library</li>
            </ul>
            <NavLink to="/admin/users" className="btn btn-ghost btn-sm" style={{ marginTop: "1rem", width: "100%", justifyContent: "center" }}>
              Manage members →
            </NavLink>
          </aside>

          <div className="admin-maincol" ref={panelRef}>
            <div className="admin-tabs" role="tablist" aria-label="Admin sections">
              <button type="button" role="tab" aria-selected={panel === "pipeline"} className={"admin-tab" + (panel === "pipeline" ? " is-on" : "")} onClick={() => switchPanel("pipeline")}>
                Upload
              </button>
              <button type="button" role="tab" aria-selected={panel === "archive"} className={"admin-tab" + (panel === "archive" ? " is-on" : "")} onClick={() => switchPanel("archive")}>
                Library
              </button>
            </div>

            {panel === "pipeline" ? (
              <div className="admin-panel">
                <h2 className="admin-panel-h">Create a post</h2>
                <p className="admin-panel-sub">Everything here becomes one card in the member library.</p>
                <form className="desk-form" onSubmit={upload}>
                  <div className="desk-grid2">
                    <div className="desk-field">
                      <label className="desk-label">Format</label>
                      <select className="desk-input" value={mediaType} onChange={(e) => setMediaType(e.target.value)}>
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                      </select>
                    </div>
                    <div className="desk-field">
                      <label className="desk-label">Source</label>
                      <select className="desk-input" value={uploadMethod} onChange={(e) => setUploadMethod(e.target.value)}>
                        <option value="local">File from device</option>
                        <option value="url">Hosted URL</option>
                      </select>
                    </div>
                  </div>

                  {uploadMethod === "local" ? (
                    <div className={"desk-drop" + (file ? " has-file" : "")} onDragOver={(e) => e.preventDefault()} onDrop={onDropFile}>
                      <input id="desk-file" className="desk-file" type="file" accept={mediaType === "image" ? "image/*" : "video/*"} onChange={(e) => setFile(e.target.files?.[0] || null)} />
                      <label htmlFor="desk-file" className="desk-drop-label">
                        {file ? <span className="desk-drop-name">{file.name}</span> : <span>Drag a file here, or click to choose</span>}
                      </label>
                    </div>
                  ) : (
                    <div className="desk-field">
                      <label className="desk-label">Media URL</label>
                      <input className="desk-input" value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="https://…" />
                    </div>
                  )}

                  <div className="desk-field">
                    <label className="desk-label">Title *</label>
                    <input className="desk-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
                  </div>
                  <div className="desk-field">
                    <label className="desk-label">Caption</label>
                    <input className="desk-input" value={caption} onChange={(e) => setCaption(e.target.value)} />
                  </div>
                  <div className="desk-grid2">
                    <div className="desk-field">
                      <label className="desk-label">Location</label>
                      <input className="desk-input" value={location} onChange={(e) => setLocation(e.target.value)} />
                    </div>
                    <div className="desk-field">
                      <label className="desk-label">People / tags</label>
                      <input className="desk-input" value={people} onChange={(e) => setPeople(e.target.value)} />
                    </div>
                  </div>
                  <button type="submit" className="desk-submit">
                    Publish to library
                  </button>
                </form>
              </div>
            ) : (
              <div className="admin-panel">
                <h2 className="admin-panel-h">Your library</h2>
                <p className="admin-panel-sub">These entries are what members see in the gallery. Use Stats for detail or Delete to remove.</p>
                {!items.length ? (
                  <div className="admin-empty">
                    <div className="admin-empty-icon" aria-hidden>
                      📂
                    </div>
                    <p className="admin-empty-title">No uploads yet</p>
                    <p className="admin-empty-text">That is why the numbers above are zero. Add your first image or video to fill the library.</p>
                    <button type="button" className="btn btn-primary" onClick={() => switchPanel("pipeline")}>
                      Go to upload
                    </button>
                  </div>
                ) : (
                  <ul className="desk-feed">
                    {items.map((img) => (
                      <li key={img.id} className="desk-row">
                        <div className="desk-thumb">
                          {img.media_type === "video" ? (
                            <video src={img.media_url} muted playsInline className="desk-thumb-media" />
                          ) : (
                            <img src={img.media_url} alt="" className="desk-thumb-media" />
                          )}
                        </div>
                        <div className="desk-row-main">
                          <span className="desk-row-title">{img.title}</span>
                          <span className="desk-row-meta">
                            {img.media_type === "video" ? "Video" : "Image"} · {img.avg_rating > 0 ? `★ ${img.avg_rating}` : "No score yet"}
                          </span>
                        </div>
                        <div className="desk-row-actions">
                          <button type="button" className="desk-mini" onClick={() => viewStats(img.id)}>
                            Stats
                          </button>
                          <button type="button" className="desk-mini desk-mini-danger" onClick={() => del(img.id)}>
                            Delete
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div className="toast-wrap">
          <div className="toast">{toast}</div>
        </div>
      )}

      {stats && (
        <div className="desk-scrim" onClick={() => setStats(null)}>
          <div className="desk-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="desk-sheet-head">
              <h2 className="desk-sheet-title">{stats.title}</h2>
              <button type="button" className="desk-mini" onClick={() => setStats(null)}>
                Close
              </button>
            </div>
            <p className="desk-sheet-sub">
              Average {stats.avg_rating} / 5 · {stats.rating_count} ratings
            </p>
            <div className="desk-sheet-block">
              <span className="desk-label">Ratings</span>
              {(stats.ratings || []).map((r, i) => (
                <div key={i} className="desk-sheet-line">
                  {r.username}: {r.value}★
                </div>
              ))}
            </div>
            <div className="desk-sheet-block">
              <span className="desk-label">Comments</span>
              {(stats.comments || []).map((c, i) => (
                <div key={i} className="desk-sheet-line">
                  <strong>{c.username}</strong> — {c.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
