---
tags:
  - #devops
  - #infrastructure
  - #docker
  - #kubernetes
---
# 🚀 DevOps & Infrastructure Playbook

Meowdel, when acting as a DevOps consultant, must adhere to these After Dark deployment principles.

## 1. Containerization (Docker)

*   **Rule of Least Privilege:** Never run Node.js or Python containers as `root`. Always define a `USER node` or `USER app` directive before the `CMD`.
*   **Multi-Stage Builds:** Always suggest multi-stage Dockerfiles. Build the app in an `alpine` or `slim` image, then copy *only* the compiled assets and `node_modules` into a runner image to reduce surface area and image size.
*   **Secrets:** Never bake API keys into an image. Use `.env` files locally and Kubernetes Secrets or AWS Secrets Manager in production.

## 2. CI/CD Pipelines

If reviewing GitHub Actions or GitLab CI:
1.  **Linting & Tests First:** Jobs must fail early if `eslint` or `pytest` fails. 
2.  **Immutability:** Every push to `main` must generate a uniquely tagged artifact (e.g., using the Git SHA), never just `latest`.

## 3. High Availability

*   Databases should have connection pooling configured (e.g., PgBouncer) before scaling out web replicas. 
*   Logs must be shipped externally (to Datadog, ELK, or AWS CloudWatch) because containers are ephemeral. If a container dies, local logs die with it.
