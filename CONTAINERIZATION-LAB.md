# Practical 11: Docker and Docker Compose

This project runs as three Compose services on the `app-network` bridge:

- `frontend`: multi-stage React build, served by Nginx on port 5173.
- `backend`: Express task API on container port 5000, published on host port
  5001 to avoid conflicts with a locally running backend.
- `mongodb`: MongoDB on port 27017, with data persisted in the `mongodb_data`
  named volume.

## Run the full stack

Install and start Docker Desktop, then from the repository root run:

```powershell
docker compose up --build
```

Open the frontend at <http://localhost:5173>. The API is available at
<http://localhost:5001>. Stop the services with `Ctrl+C`; run
`docker compose down` to remove the containers and network. MongoDB data stays
in the named volume. To remove the database data too, run
`docker compose down --volumes`.

Check running containers in another terminal:

```powershell
docker compose ps
```

The backend connects to `mongodb://mongodb:27017/taskdb`, using the Compose
service name rather than `localhost`. Inside a container, `localhost` refers to
that same container. The frontend calls the backend through the host's mapped
port (`localhost:5001`) because browser JavaScript runs on the host, not inside
the frontend container.

`EXPOSE` documents the port used by an image; Compose `ports` publishes a
container port on the host. Dockerfiles use `.dockerignore` files to keep
dependencies, environment files, and build output out of their build contexts.
The frontend's multi-stage build keeps Node and development dependencies out of
the final Nginx image.
