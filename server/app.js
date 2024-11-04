// eslint-disable-next-line import/no-extraneous-dependencies
require('dotenv').config();

const path = require('path');
const express = require('express');
const compression = require('compression');
const favicon = require('serve-favicon');
// const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const expressHandlebars = require('express-handlebars');
const helmet = require('helmet');
const session = require('express-session'); // B
const RedisStore = require('connect-redis').default; // C
const redis = require('redis'); // C

const router = require('./router.js');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

// const dbURI = process.env.MONGODB_URI || 'mongodb+srv://tony:uYxNkEthmiKwb0fR@cluster0.780sy.mongodb.net/DomoMaker';
const dbURI = process.env.MONGODB_URI || require('../.mongo-connection.js');

// C
const redisClient = redis.createClient({
  url: process.env.REDISCLOUD_URL,
});
redisClient.on('error', (err) => console.log('Redis Client Error', err));

redisClient.connect().then(() => {
  const app = express();

  app.use(helmet());
  app.use('/assets', express.static(path.resolve(`${__dirname}/../hosted/`)));
  app.use(favicon(`${__dirname}/../hosted/img/favicon.png`));
  app.use(compression());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  // B
  app.use(session({
    key: 'sessionid',
    store: new RedisStore({
      client: redisClient,
    }),
    secret: 'Domo Atigato',
    resave: false,
    saveUninitialized: false,
  }));
  //
  app.engine('handlebars', expressHandlebars.engine({ defaultLayout: '' }));
  app.set('view engine', 'handlebars');
  app.set('views', `${__dirname}/../views`);

  router(app);
  app.listen(port, (err) => {
    if (err) { throw err; }
    console.log(`Listening on port ${port}`);
  });
});

mongoose.connect(dbURI)
  .then((instance) => {
    console.log(`Success - mongoose version = ${instance.version}`);
  })
  .catch((err) => {
    if (err) {
      console.log('Could not connect to database');
      throw err;
    }
  });
