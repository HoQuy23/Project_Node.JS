const mongoose = require('mongoose');
require('dotenv/config');

const dbUrl = process.env.CONNECTION_STRING; // Thay đổi thông tin kết nối tại đây

mongoose.connect(dbUrl)
    .then(() => {
        console.log('Thành công');
    })
    .catch((err) => {
        console.log(err);
    })

module.exports = mongoose;