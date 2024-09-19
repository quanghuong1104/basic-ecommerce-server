'use strict';
const mongoose = require('mongoose');

const DB_URI = `mongodb+srv://quanghuong:quanghuong@cluster0.xb2v5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

class DatabaseConnector {
  instance = null;

  events() {
    mongoose.connection.on('connected', () => {
      console.log('Connected to the uri::', DB_URI);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('Disconnected the uri::', DB_URI);
    });

    mongoose.connection.on('close', () => {
      console.log('Close the uri::', DB_URI);
    });
  }

  connect() {
    mongoose.connect(DB_URI, {
      maxPoolSize: 50,
    });
  }

  async disconnect() {
    return mongoose.disconnect();
  }

  static getInstance() {
    if (!DatabaseConnector.instance) {
      DatabaseConnector.instance = new DatabaseConnector();
      DatabaseConnector.instance.events();
      return DatabaseConnector.instance;
    }

    throw new Error('Only one instance is accepted');
  }
}

const instance = DatabaseConnector.getInstance();
module.exports = instance;
