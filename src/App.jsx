import { useState } from "react";
import Header from "./components/Header";
import About from "./components/About";
import Skills from "./components/Skills";
import Projects from "./components/Projects";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import "./App.css";

function App() {
  const [theme, setTheme] = useState("dark");

  const skills = ["HTML", "CSS", "JavaScript", "React", "C++"];

  return (
    <div className={theme}>
      <div className="container">
        <button
          className="theme-btn"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>

        <Header name="Urvi Vansh" />
        <About />
        <Skills skillList={skills} />
        <Projects />
        <Contact />
        <Footer />
      </div>
    </div>
  );
}

export default App;