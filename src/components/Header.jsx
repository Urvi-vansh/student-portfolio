import { Link } from "react-router-dom";

function Header({ name }) {
  return (
    <header id="home" className="hero">
      <div className="hero-copy">
        <p className="eyebrow">B.Tech IT Student</p>
        <h1>{name}</h1>
        <p className="hero-text">
          I build clean, practical web projects with React, JavaScript, and a growing
          backend skill set. My focus is simple: useful ideas, neat execution, and
          steady improvement.
        </p>
        <div className="hero-actions">
          <Link className="primary-action" to="/projects">View Projects</Link>
          <Link className="secondary-action" to="/contact">Contact Me</Link>
        </div>
      </div>

      <div className="hero-visual profile-visual">
        <img src="/MY PHOTO.jpeg" alt="Urvi Vansh" />
      </div>
    </header>
  );
}

export default Header;
