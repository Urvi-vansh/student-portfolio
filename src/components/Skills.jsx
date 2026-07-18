function Skills({ skillList }) {
  return (
    <section id="skills">
      <h2>Skills</h2>
      <p className="section-intro">
        Tools and languages I use to build clean, useful web projects.
      </p>

      <div className="card">
        <ul className="skills-list">
          {skillList.map((skill) => (
            <li key={skill.name}>
              <span className={`skill-icon ${skill.name.toLowerCase()}`}>
                {skill.icon}
              </span>
              <span>{skill.name}</span>
            </li>
          ))}
        </ul>
      </div>

      <hr />
    </section>
  );
}

export default Skills;
