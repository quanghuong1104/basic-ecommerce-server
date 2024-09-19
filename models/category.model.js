'use strict';
'use strict';

const { Schema, model } = require('mongoose');

const COLLECTION_NAME = 'Categories';
const DOCUMENT_NAME = 'Category';

/* Declare the Schema */
const categorySchema = new Schema(
    {
        category: {
            type: String,
            required: true,
        },

        description: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
        collection: COLLECTION_NAME,
    }
);

/* Export the model */
module.exports = model(DOCUMENT_NAME, categorySchema);
