'use strict';

const { Schema, model } = require('mongoose');

const COLLECTION_NAME = 'Inventories';
const DOCUMENT_NAME = 'Inventory';

/* Declare the Schema */
const inventorySchema = new Schema(
  {
    product_id: {
      type: String,
      required: true,
    },

    location: {
      type: Object,
      required: true,
      default: {
        City: 'TP.Hưng Yên',
      },
    },

    stock: {
      type: Number,
      default: 0,
    },

    /**
     * {id: H2205, stock}
     */
    variants: [
      {
        variant_id: {
          type: String,
          required: true,
        },

        stock: {
          type: Number,
          default: 0,
        },
      },
    ],

    reservation: [
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
          default: 0,
        },

        order_id: {
          type: String,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  },
);

/* Export the model */
module.exports = model(DOCUMENT_NAME, inventorySchema);
