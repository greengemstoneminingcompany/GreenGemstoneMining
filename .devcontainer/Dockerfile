FROM mcr.microsoft.com/playwright:v1.58.2-noble
USER root
RUN apt-get update \
    && apt-get install --yes --no-install-recommends docker.io docker-compose-v2 \
    && rm -rf /var/lib/apt/lists/* \
    && npm install --global --prefix /opt/node22 \
      node@22.22.2 \
      npm@10.9.4 \
      @devcontainers/cli \
    && rm -rf /root/.npm
ENV PATH="/opt/node22/bin:${PATH}"
RUN test "$(node --version)" = "v22.22.2" \
    && test "$(npm --version)" = "10.9.4" \
    && docker --version \
    && docker compose version \
    && devcontainer --version
USER pwuser
