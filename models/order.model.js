'use strict';

const { Schema, model } = require('mongoose');

const COLLECTION_NAME = 'Orders';
const DOCUMENT_NAME = 'Order';

/* Declare the Schema */
const orderSchema = new Schema(
  {
    user_id: {
      type: String,
      required: true,
    },

    address: {
      type: String,
      required: true,
      default: 'H2205',
    },

    products: {
      type: Array,
      required: true,
      default: [],
    },

    total_price: {
      type: Number,
      required: true,
    },

    state: {
      type: String,
      enum: ['pending', 'deliver', 'completed', 'cancelled', 'returned'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  },
);

/* Export the model */
module.exports = model(DOCUMENT_NAME, orderSchema);
