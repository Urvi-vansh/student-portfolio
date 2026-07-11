function Skills({ skillList }) {
  return (
    <section id="skills">
      <h2>Skills</h2>

      <ul>
        {skillList.map((skill) => (
          <li key={skill}>{skill}</li>
        ))}
      </ul>

      <hr />
    </section>
  );
}

export default Skills;