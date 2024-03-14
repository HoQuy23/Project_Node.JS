const mongoose = require('mongoose');
const orderIteSchema = mongoose.Schema({
    quantity: {// Số lượng
        type: Number,
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'product'
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    color: {
        type: String,
        default: ''
    },
    size: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});
const OrderItem = mongoose.model('OrderItem', orderIteSchema);
module.exports = OrderItem;