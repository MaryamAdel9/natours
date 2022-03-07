const mongoose = require('mongoose');
const dotenv = require('dotenv');

// we put this code in the beginning to be able to catch all uncaught exceptions even those in app.js
process.on('uncaughtException', err => {
  console.log('UNCAUGHT EXCEPTION! 💥 shuting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' }); // we shouldn't require the app before our enviroment variables are read
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => console.log('DB connection successful!'));

// console.log(process.env);
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION! 💥 shuting down...');
  console.log(err);
  // we used server.close instead of using process.exit alone to give the server time to finish all the request that are still bending or
  //  being handled at the time and only after that the sever is then killed
  server.close(() => {
    process.exit(1); // in real apps we will usually have tools to restarts the application right after it crashes
  });
});
