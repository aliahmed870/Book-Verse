const dotenv = require('dotenv');
const mongoose = require('mongoose');

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

dotenv.config({ path: './config.env' });

const app = require('./app');

const PORT = process.env.PORT || 3000;
const DB = process.env.DATA_BASE;

const startServer = async () => {
  try {
    await mongoose.connect(DB);
    console.log('Database connection successful');

    const server = app.listen(PORT, () => {
      console.log(`Listening on port ${PORT}...`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error('UNHANDLED REJECTION! 💥 Shutting down...');
      console.error(err.name, err.message);
      server.close(() => {
        process.exit(1);
      });
    });
  } catch (err) {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  }
};

startServer();
