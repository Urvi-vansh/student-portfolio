function About() {
  return (
    <section id="about" className="about-section">
      <div>
        <p className="section-label">About</p>
        <h2>Learning by building real projects.</h2>
      </div>

      <div className="about-content">
        <p>
          I enjoy creating practical projects that solve real problems and make everyday
          tasks easier. I am building a strong foundation in frontend development while
          also learning backend concepts through Express, MongoDB, and APIs.
        </p>
        <p>
          I am curious, hardworking, and comfortable learning new tools step by step.
          Every project helps me improve my design sense, coding discipline, and
          confidence as a future software developer.
        </p>
      </div>

      <div className="stats-grid">
        <div>
          <strong>React</strong>
          <span>Frontend projects</span>
        </div>
        <div>
          <strong>MongoDB</strong>
          <span>Backend practice</span>
        </div>
        <div>
          <strong>GitHub</strong>
          <span>Project portfolio</span>
        </div>
      </div>
    </section>
  );
}

export default About;
