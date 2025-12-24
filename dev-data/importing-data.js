const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Book = require('../models/bookModel');
const Author = require('../models/authorModel');
const Category = require('../models/categoryModel');

dotenv.config({ path: './config.env' });

const DB = process.env.DATA_BASE;

mongoose
  .connect(DB)
  .then(() => console.log('data conneted successfully'))
  .catch((err) => console.log(err));

const books = JSON.parse(
  fs.readFileSync(`${__dirname}/books-data.json`, 'utf-8'),
);
const authors = JSON.parse(
  fs.readFileSync(`${__dirname}/authors-data.json`, 'utf-8'),
);
const categories = JSON.parse(
  fs.readFileSync(`${__dirname}/categories-data.json`, 'utf-8'),
);

const importData = async () => {
  try {
    // await Book.create(books);
    // await Author.create(authors);
    await Category.create(categories);
    console.log('data loaded successfully!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

const deletData = async () => {
  try {
    // await Book.deleteMany();
    // await Author.deleteMany();
    await Category.deleteMany();
    console.log('data deleted successfully!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deletData();
}
