
const { expressjwt: jwt } = require("express-jwt");
const User = require('../models/user');
require('dotenv/config');


function authJwt() {
    const secret = process.env.secret;
    return jwt({
        secret: secret,
        algorithms: ["HS256"],
        isRevoked: isRevoked// isRevoked  có nghĩa là nó xẽ thu hồi quyền dựa theo điều kiện
        //Hàm isRevoked chỉ thu hồi quyền truy cập nếu isAdmin là false
    }).unless({
        path: [
            { url: /\/public\/upload(.*)/, methods: ['GET', 'OPTIONS'] },
            { url: /\/api\/v1\/products(.*)/, methods: ['GET', 'OPTIONS'] },
            { url: /\/api\/v1\/categorys(.*)/, methods: ['GET', 'OPTIONS'] },
            { url: /\/api\/v1\/user(.*)/, methods: ['GET', 'OPTIONS'] },
            { url: /\/api\/v1\/blog(.*)/, methods: ['GET', 'OPTIONS'] },
            // // { url: '/api/v1/products', methods: ['GET', 'OPTIONS'] },
            '/api/v1/user/login',
            '/api/v1/user/register',
            '/api/v1/user/protectedRoute',
            '/api/v1/user/logout',
            '/api/v1/order/addto/card',
            '/api/v1/order/user/cart-items',
            '/api/v1/order/pay'
        ]
    });
    //unless({ path: ['/api/v1/user/login'] }) được sử dụng để xác định các tuyến đường (routes) mà middleware không áp dụng.
}

async function isRevoked(req, jwt, done) {
    try {
        const payload = jwt.payload;
        console.log(payload.isAdmin);
        console.log(payload);
        const userId = payload.userId;
        const user = await User.findById(userId);
        console.log(user.isAdmin);
        const isAdmin = JSON.parse(user.isAdmin);
        console.log(isAdmin);
        if (!isAdmin) {
            console.log('ko phải admin');
            return true;
        } else {
            console.log('đây là admin');
            return false;
        }
    } catch (error) {
        return done(error);
    }

}

module.exports = authJwt;
