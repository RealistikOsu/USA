FROM node:latest

WORKDIR /app
COPY ./src /app/src
COPY ./package.json /app/package.json
COPY ./package-lock.json /app/package-lock.json
COPY ./tsconfig.json /app/tsconfig.json

RUN npm install
RUN npm run build

CMD ["npm", "run", "start"]
