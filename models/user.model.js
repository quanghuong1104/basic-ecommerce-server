'use strict';
const { Schema, model } = require('mongoose');
const COLLECTION_NAME = 'Users';
const DOCUMENT_NAME = 'User';

/* Declare the Schema */
const userSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },

    email: {
      type: String,
      trim: true,
      required: true,
      validate: {
        validator: (value) => {
          const emailRegex =
            /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
          return emailRegex.test(value);
        },

        message: 'Email validation failed',
      },
    },

    password: {
      type: String,
      trim: true,
    },

    avatar: {
      type: String,
      trim: true,
      default: 'assets/avatar/placeholder.jpg',
    },

    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  },
);

/* Export the model */
module.exports = model(DOCUMENT_NAME, userSchema);
