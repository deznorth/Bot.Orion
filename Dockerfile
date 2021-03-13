FROM node:lts-alpine

WORKDIR /app

RUN apk add tzdata
RUN cp /usr/share/zoneinfo/America/New_York /etc/localtime
RUN echo "America/New_York" > /etc/timezone
RUN date
RUN apk del tzdata

COPY package*.json ./
COPY yarn.lock ./

RUN yarn

COPY . .

CMD ["yarn", "start:prod"]
