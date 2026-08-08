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
    <section id="projects" className="page-section">
      <p className="section-label">Projects</p>
      <h2>Recent GitHub work.</h2>
      <p className="section-intro">
        Live repositories from my GitHub profile, shown with descriptions, language,
        stars, and update dates.
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
                  <div className="card-top">
                    <h3>{repo.name}</h3>
                    <span>{repo.language || "Code"}</span>
                  </div>
                  <p>{repositoryDescription}</p>
                  <p className="repo-meta">
                    Stars {repo.stargazers_count} | Updated{" "}
                    {new Date(repo.updated_at).toLocaleDateString()}
                  </p>
                  <a className="repo-link" href={repo.html_url} target="_blank" rel="noreferrer">
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
    </section>
  );
}

export default Projects;
