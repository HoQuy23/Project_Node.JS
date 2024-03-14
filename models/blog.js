const mongoose = require('mongoose');
const BlogSchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    blogcategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'blogCategory',
        require: true
    },
    numberViews: { // số lượt xem sản phẩm
        type: Number,
        default: 0
    },
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'

        }
    ],
    dislikes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'

        }
    ],
    image: {
        type: String,
        default: ''
    },
    admin: {
        type: String,
        default: 'Admin'
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
BlogSchema.virtual('id').get(function () {
    return this._id.toHexString();
});
BlogSchema.set('toJSON', {
    virtuals: true
});
const Blog = mongoose.model('blog', BlogSchema)
module.exports = Blog;