'use strict';

const { Schema, model, Types } = require('mongoose');

const COLLECTION_NAME = 'Variants';
const DOCUMENT_NAME = 'Variant';

/* Declare the Schema */
const variantSchema = new Schema(
  {
    product: {
      type: String,
      required: true,
      ref: 'Product',
    },

    price: {
      type: Number,
      required: true,
      min: [0, 'The price must be above 0'],
    },

    thumb_url: {
      type: String,
      required: true,
    },

    options: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  },
);

/* Export the model */
module.exports = model(DOCUMENT_NAME, variantSchema);
