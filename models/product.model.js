'use strict';

const { Schema, model, Types } = require('mongoose');

const COLLECTION_NAME = 'Products';
const DOCUMENT_NAME = 'Product';

// Declare the Schema of the Mongo model
const productSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    desc: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      required: true,
      ref: 'Category',
    },

    min_price: {
      type: Number,
      required: true,
      min: [0, 'Minimum price must be above 0'],
    },

    max_price: {
      type: Number,
      required: true,
      min: [0, 'Maximum price must be above 0'],
    },

    quantity: {
      type: Number,
      required: true,
      min: [0, 'Quantity must be above 0'],
    },

    stock: {
      type: Number,
      required: true,
      min: [0, 'Stock must be above 0'],
    },

    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating must be above 0'],
      max: [5, 'Rating must be less than or equal to 5'],
    },

    thumb_url: {
      type: String,
      required: true,
    },

    attributes: {
      type: Schema.Types.Mixed,
    },

    likers: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  },
);

/* Create slug for product */
productSchema.pre('save', function (next) {
  this.slug = this.name.split(' ').join('-');
  next();
});

/* Index */
productSchema.index({
  name: 'text',
  category: 'text',
  description: 'text',
});

//Export the model
module.exports = model(DOCUMENT_NAME, productSchema);
