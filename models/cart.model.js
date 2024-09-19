'use strict';
const { Schema, model } = require('mongoose');

const COLLECTION_NAME = 'Carts';
const DOCUMENT_NAME = 'Cart';

/* Declare the Schema */

const cartSchema = new Schema(
  {
    user_id: {
      type: String,
      required: true,
      ref: 'User',
    },

    products: [
      {
        product_id: {
          type: String,
          required: true,
        },

        variant_id: {
          type: String,
          default: '',
        },

        quantity: {
          type: Number,
          required: true,
        },

        checkout: {
          type: Boolean,
          default: false,
        },

        _id: {
          type: String,
        },
      },
    ],

    product_count: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  },
);

/* Export the model */
module.exports = model(DOCUMENT_NAME, cartSchema);
