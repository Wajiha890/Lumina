// Lumina – MSc Cloud Computing Project
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import { apiFetch } from "../api.js";
import AppLayout from "../components/AppLayout.jsx";

export default function Gallery() {
  const { role, headers } = useAuth();
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [head, setHead] = useState("Full collection");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [toast, setToast] = useState("");
  const [commentTick, setCommentTick] = useState(0);

  if (role === "creator") return <Navigate to="/admin" replace />;

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    const { ok, data } = await apiFetch("/images", { headers: headers() });
    if (ok) setItems(data);
    setLoading(false);
  }

  async function doSearch() {
    const t = q.trim();
    if (!t) {
      setHead("Full collection");
      return loadAll();
    }
    setLoading(true);
    setHead(`Matches for “${t}”`);
    const { ok, data } = await apiFetch("/images/search?q=" + encodeURIComponent(t), { headers: headers() });
    if (ok) setItems(data);
    setLoading(false);
  }

  async function openModal(id) {
    const { ok, data } = await apiFetch("/images/" + id, { headers: headers() });
    if (ok) {
      setModal(data);
      setCommentText("");
    }
  }

  async function postRating(v) {
    if (!modal) return;
    const { ok } = await apiFetch("/ratings", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ image_id: modal.id, value: v }),
    });
    if (ok) {
      setToast("Saved " + v + " ★");
      const r = await apiFetch("/images/" + modal.id, { headers: headers() });
      if (r.ok) setModal(r.data);
      loadAll();
    }
  }

  async function postReaction(type) {
    if (!modal) return;
    const { ok, data } = await apiFetch("/reactions", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ image_id: modal.id, reaction_type: type }),
    });
    if (ok) {
      setToast("Reaction saved");
      const r = await apiFetch("/images/" + modal.id, { headers: headers() });
      if (r.ok) setModal(r.data);
      loadAll();
    } else setToast(data.message || "Failed");
  }

  async function postComment() {
    if (!modal || !commentText.trim()) return;
    const { ok } = await apiFetch("/comments", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ image_id: modal.id, text: commentText.trim() }),
    });
    if (ok) {
      setCommentText("");
      setToast("Posted");
      setCommentTick((t) => t + 1);
      const r = await apiFetch("/images/" + modal.id, { headers: headers() });
      if (r.ok) setModal(r.data);
    }
  }

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <AppLayout variant="member" title={head} subtitle="Tap a card for detail, reactions, score, and comments.">
      <div className="gallery-toolbar">
        <input className="input" placeholder="Search titles or captions…" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doSearch()} />
        <button type="button" className="btn btn-primary btn-sm" onClick={doSearch}>
          Search
        </button>
        {head !== "Full collection" && (
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => {
              setQ("");
              setHead("Full collection");
              loadAll();
            }}
          >
            Reset
          </button>
        )}
      </div>
      {loading ? (
        <p className="muted">Loading…</p>
      ) : !items.length ? (
        <p className="muted">Nothing here yet.</p>
      ) : (
        <div className="gallery-grid">
          {items.map((img) => (
            <button key={img.id} type="button" onClick={() => openModal(img.id)} className="gallery-card">
              {img.media_type === "video" ? (
                <video src={img.media_url} muted className="gallery-card-media" />
              ) : (
                <img src={img.media_url} alt="" className="gallery-card-media" />
              )}
              <div className="gallery-card-body">
                <div className="gallery-card-title">{img.title}</div>
                <div className="gallery-card-meta">{img.avg_rating > 0 ? `★ ${img.avg_rating}` : "Not rated"}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {toast && (
        <div className="toast-wrap">
          <div className="toast">{toast}</div>
        </div>
      )}

      {modal && (
        <div className="sheet-back ig-backdrop" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="sheet sheet-split ig-post" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-media ig-post-media">
              {modal.media_type === "video" ? (
                <video className="ig-post-img" src={modal.media_url} controls playsInline />
              ) : (
                <img className="ig-post-img" src={modal.media_url} alt="" />
              )}
            </div>
            <div className="sheet-detail ig-post-side">
              <header className="ig-post-head">
                <div className="ig-post-userrow">
                  <span className="ig-avatar" aria-hidden>
                    {(modal.uploader || "?").charAt(0).toUpperCase()}
                  </span>
                  <div className="ig-post-names">
                    <span className="ig-username">{modal.uploader}</span>
                    {modal.location ? <span className="ig-location">{modal.location}</span> : null}
                  </div>
                </div>
                <button type="button" className="ig-close" onClick={() => setModal(null)} aria-label="Close">
                  ×
                </button>
              </header>

              <div className="ig-post-scroll">
                <p className="ig-post-title">{modal.title}</p>
                {modal.caption ? <p className="ig-post-caption">{modal.caption}</p> : null}

                <div className="ig-actions">
                  {[
                    { type: "like", emoji: "👍", label: "Like" },
                    { type: "happy", emoji: "😊", label: "Smile" },
                    { type: "love", emoji: "❤️", label: "Love" },
                  ].map(({ type, emoji, label }) => {
                    const n = modal.reaction_counts?.[type] || 0;
                    const active = modal.my_reaction === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        className={"ig-react" + (active ? " is-on" : "")}
                        onClick={() => postReaction(type)}
                        aria-label={label}
                        title={label}
                      >
                        <span className="ig-react-emoji">{emoji}</span>
                        <span className="ig-react-count">{n}</span>
                      </button>
                    );
                  })}
                </div>

                <p className="ig-reactions-summary">
                  {(modal.reaction_counts?.like || 0) + (modal.reaction_counts?.happy || 0) + (modal.reaction_counts?.love || 0) || 0}{" "}
                  reactions · tap to add yours
                </p>

                <div className="ig-rate-block">
                  <span className="ig-rate-label">Your rating</span>
                  <div className="ig-stars" role="group" aria-label="Rate 1 to 5 stars">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <button
                        key={v}
                        type="button"
                        className={"ig-star" + (v <= (modal.my_rating || 0) ? " is-on" : "")}
                        onClick={() => postRating(v)}
                        aria-label={`${v} stars`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  {modal.avg_rating > 0 ? (
                    <p className="ig-avg">Community avg ★ {modal.avg_rating}</p>
                  ) : null}
                </div>

                <div className="ig-comments-block">
                  <CommentList imageId={modal.id} tick={commentTick} />
                </div>
              </div>

              <div className="ig-composer">
                <input
                  className="ig-composer-input"
                  placeholder="Add a comment…"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && postComment()}
                />
                <button type="button" className="ig-composer-post" onClick={postComment} disabled={!commentText.trim()}>
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function CommentList({ imageId, tick }) {
  const [list, setList] = useState([]);
  useEffect(() => {
    (async () => {
      const { ok, data } = await apiFetch("/comments/" + imageId);
      if (ok) setList(data);
    })();
  }, [imageId, tick]);
  return (
    <div className="ig-comment-list">
      {!list.length ? (
        <p className="ig-comment-empty">No comments yet. Be the first below.</p>
      ) : (
        list.map((c) => (
          <div key={c.id} className="ig-comment">
            <span className="ig-avatar ig-avatar-sm" aria-hidden>
              {(c.username || "?").charAt(0).toUpperCase()}
            </span>
            <div className="ig-comment-body">
              <span className="ig-comment-user">{c.username}</span>
              <span className="ig-comment-text">{c.text}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
