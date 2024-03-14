const mongoose = require('mongoose');
const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        maxlength: 150
    },
    passwordHash: {
        type: String,
        required: true,
        maxlength: 200,
        minlength: 3
    },
    refreshToken: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        required: true,
        maxlength: 20
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    street: {// đường phố
        type: String,
        default: ''
    },
    zip: {// mã số tỉnh
        type: String,
        default: ''
    },
    city: {// thành phố
        type: String,
        default: ''
    },
    country: {// quốc gia
        type: String,
        default: true
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
userSchema.virtual('id').get(function () {
    return this._id.toHexString();
});
userSchema.set('toJSON', {
    virtuals: true
});
const user = mongoose.model('user', userSchema)
module.exports = user;