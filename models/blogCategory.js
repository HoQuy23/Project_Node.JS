const mongoose = require('mongoose');
const BlogCategorySchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true
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
BlogCategorySchema.virtual('id').get(function () {
    return this._id.toHexString();
});
BlogCategorySchema.set('toJSON', {
    virtuals: true
});
const BlogCategory = mongoose.model('blogCategory', BlogCategorySchema)
module.exports = BlogCategory;