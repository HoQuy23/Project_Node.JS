const mongoose = require('mongoose');
const CategorySchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    icon: {
        type: String,

    },
    color: {
        type: String,

    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
});
const Category = mongoose.model('category', CategorySchema)
module.exports = Category;