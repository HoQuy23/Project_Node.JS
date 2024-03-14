const mongoose = require('mongoose');
const productSchema = mongoose.Schema({
    // Schema này mô tả cấu trúc dữ liệu của một sản phẩm trong cơ sở dữ liệu MongoDB.
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    rickDescription: {
        type: String,
        default: ''
    },
    image: {// ảnh
        type: String,
        default: ''
    },
    images: [{
        type: String
    }],
    brand: {
        type: String,
        default: ''
    },
    price: {
        type: Number,
        default: 0
    },
    category: {// Điều này cho phép mỗi sản phẩm thuộc về một danh mục nhất định
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category',
        require: true
    },
    countInStock: {//Số lượng tồn kho của sản phẩm
        type: Number,
        required: true,
        min: 0,
        max: 255
    },
    color: {
        type: [String], // Mảng các chuỗi
        default: ['White', 'Black', 'Red', 'Green', 'Pink', 'Grey', 'Brown', 'Yellow', 'Orange']
    },
    size: {
        type: [String],
        default: ['S', 'M', 'L', 'XL', 'XXL', '2XL']
    },
    ratings: [//Điểm đánh giá của sản phẩm
        {
            star: { type: Number },
            postedBy: { type: mongoose.Types.ObjectId, ref: 'user' },
            comment: { type: String }
        }
    ],
    totalratings: {
        type: Number,
        default: 0
    },
    numReviews: {
        type: Number,
        default: 0
    },
    isFeatured: {// Trạng thái nổi bật của sản phẩm
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
});
productSchema.virtual('id').get(function () {
    return this._id.toHexString();
});
productSchema.set('toJSON', {
    virtuals: true
});
//mongoose.model() để tạo một model từ schema đó. Mongoose sử dụng model để tương tác với các bản ghi trong cơ sở dữ liệu MongoDB
const Product = mongoose.model('product', productSchema)
module.exports = Product;