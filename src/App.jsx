import { useState } from "react";
import { Link, Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import About from "./components/About";
import Skills from "./components/Skills";
import Projects from "./components/Projects";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import "./App.css";

function HomePage() {
  return (
    <>
      <Header name="Urvi Vansh" />
      <About />
    </>
  );
}

function SkillsPage({ skills }) {
  return <Skills skillList={skills} />;
}

function ProjectsPage() {
  return <Projects />;
}

function ContactPage() {
  return <Contact />;
}

function App() {
  const [theme, setTheme] = useState("dark");
  const skills = [
    { name: "HTML", icon: "H" },
    { name: "CSS", icon: "C" },
    { name: "JavaScript", icon: "JS" },
    { name: "React", icon: "R" },
    { name: "Python", icon: "Py" },
    { name: "C", icon: "C" },
  ];

  return (
    <div className={theme}>
      <div className="container">
        <div className="top-bar">
          <nav className="nav-links">
            <Link to="/">Home</Link>
            <Link to="/skills">Skills</Link>
            <Link to="/projects">Projects</Link>
            <Link to="/contact">Contact</Link>
          </nav>

          <button
            className="theme-btn"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
        </div>

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/skills" element={<SkillsPage skills={skills} />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Routes>

        <Footer />
      </div>
    </div>
  );
}

export default App;
