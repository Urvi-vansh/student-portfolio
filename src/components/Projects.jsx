function Projects() {
  const projects = [
    {
      title: "Smart Parking System",
      description: "An IoT-based project that helps monitor parking availability and improves parking management using smart technology.",
    },
    {
      title: "Li-Fi Technology",
      description: "An IoT-based project focused on wireless data transmission using light, exploring modern communication methods.",
    },
    {
      title: "ResumeFit",
      description: "A resume analysis project that checks how well a resume matches industry expectations and estimates its fit percentage.",
    },
  ];

  return (
    <section id="projects">
      <h2>Projects</h2>
      <div className="project-list">
        {projects.map((project) => (
          <article className="card" key={project.title}>
            <h3>{project.title}</h3>
            <p>{project.description}</p>
          </article>
        ))}
      </div>
      <hr />
    </section>
  );
}

export default Projects;
