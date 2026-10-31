FROM mcr.microsoft.com/playwright:v1.58.2-noble
USER root
RUN npm install --global --prefix /opt/node22 node@22.22.2 npm@10.9.4 \
    && rm -rf /root/.npm
ENV PATH="/opt/node22/bin:${PATH}"
RUN test "$(node --version)" = "v22.22.2" && test "$(npm --version)" = "10.9.4"
USER pwuser
