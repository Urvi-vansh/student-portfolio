function Skills({ skillList }) {
  return (
    <section id="skills" className="page-section">
      <p className="section-label">Skills</p>
      <h2>Tools I use to turn ideas into working screens.</h2>
      <p className="section-intro">
        A focused set of technologies for college projects, portfolio work, and
        full-stack practice.
      </p>

      <ul className="skills-list">
        {skillList.map((skill) => (
          <li key={skill.name}>
            <span className={`skill-icon ${skill.name.toLowerCase()}`}>
              {skill.icon}
            </span>
            <span>
              <span>{skill.name}</span>
              <small>{skill.detail}</small>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default Skills;
