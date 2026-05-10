// Lumina – MSc Cloud Computing Project
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import { luminaFile } from "../mediaPaths.js";

const photos = {
  mosaic: [1, 2, 3, 4, 5, 6].map((n) => luminaFile(`mosaic-${n}.jpg`)),
  marquee: [1, 2, 3, 4, 5, 6].map((n) => luminaFile(`marquee-${n}.jpg`)),
};

const features = [
  {
    title: "Publish",
    text: "Upload images or video from a file or URL. Add title, caption, place, and people so every piece has context.",
    icon: "◆",
    image: photos.mosaic[1],
  },
  {
    title: "Collect",
    text: "Members get one calm wall to scroll, search, and open detail views without clutter.",
    icon: "◇",
    image: photos.mosaic[3],
  },
  {
    title: "Respond",
    text: "Stars, quick reactions, and a comment thread keep feedback close to the work.",
    icon: "✦",
    image: photos.mosaic[5],
  },
];

const steps = [
  { n: "01", title: "Join", text: "Create a member account or sign in if you already have one." },
  { n: "02", title: "Browse", text: "Search the collection, open a piece, rate it, react, or leave a note." },
  { n: "03", title: "Studio", text: "Creators use the studio to publish new drops and manage member accounts." },
];

export default function Home() {
  const { loggedIn, role } = useAuth();
  if (loggedIn) return <Navigate to={role === "creator" ? "/admin" : "/gallery"} replace />;

  return (
    <div className="landing-page">
      <div className="landing-nav">
        <Link to="/" className="landing-logo">
          <span className="brand-mark" aria-hidden />
          Lumina
        </Link>
        <div className="landing-nav-actions">
          <Link to="/login" className="btn btn-ghost btn-sm">
            Sign in
          </Link>
          <Link to="/login?mode=signup" className="btn btn-accent btn-sm">
            Create account
          </Link>
        </div>
      </div>

      <header className="landing-hero">
        <div className="landing-hero-base" aria-hidden="true" />
        <div className="landing-hero-mosaic" aria-hidden="true">
          {photos.mosaic.map((src, i) => (
            <img
              key={src}
              src={src}
              alt=""
              className={`landing-mosaic-tile landing-mosaic-tile--${i + 1}`}
              width={400}
              height={300}
              loading={i < 3 ? "eager" : "lazy"}
              decoding="async"
            />
          ))}
        </div>
        <div className="landing-hero-scrim" aria-hidden="true" />
        <div className="landing-hero-inner">
          <div className="landing-hero-copy landing">
            <p className="landing-kicker">Curated media</p>
            <h1>Your gallery, softly lit.</h1>
            <p className="landing-lede landing-lede-hero">
              Lumina is a calm wall for stills and motion: publish once, let members explore, rate, react, and
              comment—without clutter.
            </p>
            <div className="landing-actions">
              <Link to="/login" className="btn btn-accent">
                Get started
              </Link>
              <Link to="/login?mode=signup" className="btn btn-ghost">
                Create account
              </Link>
            </div>
            <ul className="landing-bullets" aria-label="Highlights">
              <li>React + Vite · Node + Express API</li>
              <li>JWT sign-in · members &amp; creators</li>
              <li>PostgreSQL with Docker</li>
            </ul>
          </div>
          <div className="landing-hero-showcase" aria-hidden="true">
            <div className="landing-showcase-stack">
              <img src={photos.mosaic[0]} alt="" width={320} height={220} loading="eager" decoding="async" />
              <img src={photos.mosaic[2]} alt="" width={320} height={220} loading="eager" decoding="async" />
              <img src={photos.mosaic[4]} alt="" width={320} height={220} loading="lazy" decoding="async" />
            </div>
            <p className="landing-showcase-caption">One wall · every frame</p>
          </div>
        </div>
      </header>

      <div className="landing-marquee" aria-label="Sample gallery moods">
        <div className="landing-marquee-track">
          {[...photos.marquee, ...photos.marquee].map((src, i) => (
            <figure key={`${src}-${i}`} className="landing-marquee-item">
              <img src={src} alt="" width={280} height={200} loading="lazy" decoding="async" />
            </figure>
          ))}
        </div>
      </div>

      <section className="landing-section" aria-labelledby="features-heading">
        <div className="landing-section-inner">
          <h2 id="features-heading" className="landing-section-title">
            What you can do
          </h2>
          <p className="landing-section-lede">Publish, collect, and respond—three clear moves.</p>
          <div className="feature-grid">
            {features.map((f) => (
              <article key={f.title} className="feature-card">
                <div className="feature-card-visual">
                  <img src={f.image} alt="" width={400} height={220} loading="lazy" decoding="async" />
                </div>
                <span className="feature-icon" aria-hidden>
                  {f.icon}
                </span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section landing-section-alt landing-section-flow" aria-labelledby="steps-heading">
        <div className="landing-section-inner landing-flow-grid">
          <div className="landing-flow-copy">
            <h2 id="steps-heading" className="landing-section-title">
              How it flows
            </h2>
            <ol className="step-list landing-step-list-vertical">
              {steps.map((s) => (
                <li key={s.n} className="step-item">
                  <span className="step-num">{s.n}</span>
                  <div>
                    <strong className="step-title">{s.title}</strong>
                    <p className="step-text">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="landing-flow-visual" aria-hidden="true">
            <img src={photos.marquee[1]} alt="" width={560} height={720} loading="lazy" decoding="async" />
            <img src={photos.marquee[3]} alt="" className="landing-flow-visual-float" width={240} height={240} loading="lazy" decoding="async" />
          </div>
        </div>
      </section>

      <section className="landing-section" aria-labelledby="roles-heading">
        <div className="landing-section-inner landing-two-col landing-roles-band">
          <div className="landing-roles-text">
            <h2 id="roles-heading" className="landing-section-title">
              Members vs creators
            </h2>
            <p className="landing-section-lede" style={{ marginBottom: 0 }}>
              <strong>Members</strong> sign up from this site, open the collection, and interact with what is
              published. <strong>Creators</strong> run the studio: upload media, see basic stats, and remove consumer
              accounts if needed.
            </p>
          </div>
          <aside className="landing-aside">
            <p className="landing-aside-title">First-time setup</p>
            <p>
              When the API starts with an empty database, it can seed a first creator account from your server
              environment—check your host or <code className="landing-code">README</code> for variable names, not
              passwords, on a public page.
            </p>
          </aside>
        </div>
      </section>

      <section className="landing-cta-band" aria-label="Call to action">
        <div className="landing-section-inner landing-cta-inner">
          <div>
            <h2 className="landing-cta-title">Ready when you are</h2>
            <p className="landing-cta-sub">Sign in to open the gallery or the studio.</p>
          </div>
          <div className="landing-actions">
            <Link to="/login" className="btn btn-accent">
              Sign in
            </Link>
            <Link to="/login?mode=signup" className="btn btn-ghost">
              Create account
            </Link>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-section-inner landing-footer-inner">
          <span className="landing-footer-brand">Lumina</span>
          <span className="muted">Media gallery · {new Date().getFullYear()}</span>
          <Link to="/login" className="landing-footer-link">
            Login
          </Link>
        </div>
      </footer>
    </div>
  );
}
