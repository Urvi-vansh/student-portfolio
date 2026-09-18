import { lazy, Suspense, useState } from "react";
import { Link, NavLink, Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import About from "./components/About";
import Footer from "./components/Footer";
import "./App.css";

const Skills = lazy(() => import("./components/Skills"));
const Projects = lazy(() => import("./components/Projects"));
const TaskManager = lazy(() => import("./components/TaskManager"));
const Contact = lazy(() => import("./components/Contact"));

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

function TasksPage() {
  return <TaskManager />;
}

function ContactPage() {
  return <Contact />;
}

function PageLoading() {
  return (
    <div className="page-loading" role="status" aria-live="polite">
      <span className="page-loading-spinner" aria-hidden="true" />
      <div>
        <p className="section-label">Loading view</p>
        <p>Preparing this page...</p>
      </div>
    </div>
  );
}

function App() {
  const [theme, setTheme] = useState("dark");
  const skills = [
    { name: "HTML", icon: "H", detail: "Semantic structure" },
    { name: "CSS", icon: "C", detail: "Responsive layouts" },
    { name: "JavaScript", icon: "JS", detail: "Interactive UI logic" },
    { name: "React", icon: "R", detail: "Component-based apps" },
    { name: "Python", icon: "Py", detail: "Problem solving" },
    { name: "C", icon: "C", detail: "Programming basics" },
  ];

  return (
    <div className={`app-shell ${theme}`}>
      <div className="container">
        <div className="top-bar">
          <Link className="brand" to="/">
            <span className="brand-mark">UV</span>
            <span>Portfolio</span>
          </Link>

          <nav className="nav-links">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/skills">Skills</NavLink>
            <NavLink to="/projects">Projects</NavLink>
            <NavLink to="/tasks">Tasks</NavLink>
            <NavLink to="/contact">Contact</NavLink>
          </nav>

          <button
            className="theme-btn"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            type="button"
          >
            {theme === "dark" ? "Light" : "Dark"}
          </button>
        </div>

        <Suspense fallback={<PageLoading />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/skills" element={<SkillsPage skills={skills} />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/contact" element={<ContactPage />} />
          </Routes>
        </Suspense>

        <Footer />
      </div>
    </div>
  );
}

export default App;
