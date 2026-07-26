import { useEffect, useState } from "react";
import LoadingSpinner from "./LoadingSpinner";
import ErrorMessage from "./ErrorMessage";

function Projects() {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const githubUsername = "urvi-vansh";

  useEffect(() => {
    async function fetchRepos() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `https://api.github.com/users/${githubUsername}/repos?sort=updated&per_page=10`
        );

        if (!response.ok) {
          throw new Error(`GitHub API responded with status ${response.status}`);
        }

        const data = await response.json();
        setRepos(data);
      } catch (fetchError) {
        setError(fetchError.message);
      } finally {
        setLoading(false);
      }
    }

    fetchRepos();
  }, []);

  return (
    <section id="projects">
      <h2>Projects</h2>
      <p className="section-intro">
        This section dynamically pulls the latest public GitHub repositories for the profile
        and displays them as project highlights. Each item includes the repository name,
        description, and a direct link to view the code on GitHub.
      </p>

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && (
        <div className="project-list">
          {repos.length > 0 ? (
            repos.map((repo) => {
              const repositoryDescription =
                repo.description ||
                `Explore the ${repo.name} repository and its source code on GitHub.`;

              return (
                <article className="card" key={repo.id}>
                  <h3>{repo.name}</h3>
                  <p>{repositoryDescription}</p>
                  <p className="repo-meta">
                    {repo.language ? `${repo.language} • ` : ""}
                    ⭐ {repo.stargazers_count} • Updated {new Date(repo.updated_at).toLocaleDateString()}
                  </p>
                  <a href={repo.html_url} target="_blank" rel="noreferrer">
                    View repository
                  </a>
                </article>
              );
            })
          ) : (
            <p>No repositories found for the GitHub user.</p>
          )}
        </div>
      )}

      <hr />
    </section>
  );
}

export default Projects;
