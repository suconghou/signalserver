FROM suconghou/node:yarn
RUN yarn add ws --ignore-optional --non-interactive --registry https://registry.npm.taobao.org
COPY src/index.mjs .
CMD [ "node" ,"index.mjs" ]