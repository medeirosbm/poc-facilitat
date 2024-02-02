FROM node:16.13.1 as build

USER root

WORKDIR /app

COPY . .

# Resolvendo o Problema de Formato de Fim de Linha entre Windows e Unix
RUN apt-get update && apt-get install -y dos2unix
RUN dos2unix start.sh && chmod +x start.sh
RUN apt-get remove -y dos2unix && apt-get autoremove -y && apt-get clean

RUN npm install
RUN npm install -g prisma
RUN npm run build

EXPOSE 3333

ENTRYPOINT ["sh","start.sh"]
