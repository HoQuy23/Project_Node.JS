const express = require('express');
const Order = require('../models/order');
const OrderItem = require('../models/order-item');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/user');

// tất cả đơn hàng
router.get('/getAll', async (req, res) => {
    try {
        const orderList = await Order.find()
            .populate('user', 'name')
            .sort({ 'dateOrdered': -1 })// giảm dần
            .populate({ path: 'orderItems', populate: { path: 'product', populate: 'category' } });

        if (!orderList) {
            return res.status(500).json({ success: false, message: 'Không tìm thấy đơn hàng' });
        } else {
            return res.status(200).json(orderList);
        }
    } catch (error) {
        console.error('Lỗi khi lấy tất cả đơn hàng:', error.message);
        return res.status(500).json({ success: false, message: 'Lỗi server khi lấy đơn hàng' });
    }
});

// Lấy chi tiết đơn hàng bằng ID
router.get('/detail/:id', async (req, res) => {
    try {
        const orderById = await Order.findById(req.params.id)
            .populate('user', 'name')
            .populate({ path: 'orderItems', populate: { path: 'product', populate: 'category' } });

        if (!orderById) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
        } else {
            return res.status(200).json(orderById);
        }
    } catch (error) {
        console.error('Lỗi khi lấy chi tiết đơn hàng:', error.message);
        return res.status(500).json({ success: false, message: 'Lỗi server khi lấy chi tiết đơn hàng' });
    }
});

// Thêm vào giỏ hàng
router.post('/addto/card', async (req, res) => {

    try {
        const cookie = req.cookies['refreshToken'];
        const secret = process.env.secret;
        await jwt.verify(cookie, secret, async (err, decoded) => {
            if (err) {
                throw new Error('RefreshToken không hợp lệ 01');
            }
            const user = await User.findOne({ _id: decoded.userId, refreshToken: cookie });
            if (!user) {
                throw new Error('RefreshToken user không hợp lệ 02');
            }
            const cart = new OrderItem({
                quantity: req.body.quantity,
                product: req.body.product,
                color: req.body.color,
                size: req.body.size,
                user: user.id
            });
            const carts = await cart.save();
            if (!savedCart) {
                throw new Error('Không thể lưu vào giỏ hàng');
            }
            res.status(200).json(savedCart);

        })
    } catch (error) {
        console.error('Lỗi khi thêm vào giỏ hàng:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }

});

// Xóa sản phẩm trong giỏ hàng
router.delete('/delete/:id', async (req, res) => {
    try {
        const deletedOrderItem = await OrderItem.findByIdAndDelete(req.params.id);

        if (deletedOrderItem) {
            res.status(200).json({ success: true, message: 'Xóa sản phẩm thành công' });
        } else {
            res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm trong giỏ hàng' });
        }
    } catch (error) {
        console.error('Lỗi khi xóa sản phẩm trong giỏ hàng:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi server khi xóa sản phẩm trong giỏ hàng' });
    }
});

// Cập nhật trạng thái giao hàng
router.put('/shipping-status/:id', async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        );

        if (order) {
            return res.status(200).json({ success: true, data: order });
        } else {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
        }
    } catch (error) {
        console.error('Lỗi khi cập nhật trạng thái giao hàng:', error.message);
        return res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật trạng thái giao hàng' });
    }
});


// -- đến đây rồi
// Delete-đơn hàng
// router.delete('/delete/:id', async (req, res) => {
//     try {
//         const order = await Order.findById(req.params.id);
//         if (!order) {
//             return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
//         }
//         await Promise.all(order.orderItems.map(async (item) => {
//             const deletedOderItem = await OrderItem.findByIdAndDelete(item);
//             if (deletedOderItem) {
//                 console.log('xoa thanh cong');
//             }
//         }));
//         const deletedOder = await Order.findByIdAndDelete(req.params.id);
//         if (deletedOder) {
//             res.status(200).json({ success: true, message: 'xóa thành công' });
//         } else {
//             res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
//         }
//     } catch (error) {
//         console.error('Lỗi khi xóa đơn hàng:', error.message);
//         res.status(500).send('Lỗi khi xóa đơn hàng');
//     }
// });


// Xóa sản phẩm trong giỏ hàng
router.delete('/delete-product-cart/:id', async (req, res) => {
    try {
        const orderItemId = req.params.id;
        if (!orderItemId) {
            return res.status(400).json({ success: false, message: 'ID không được cung cấp' });
        }
        const orderItem = await OrderItem.findById(orderId);
        if (!orderItem) {
            return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại trong giỏ hàng' });
        }
        await OrderItem.findByIdAndDelete(orderId);
        res.status(200).json({ success: true, message: 'Xóa sản phẩm thành công' });
    } catch (error) {
        console.error('Lỗi khi xóa sản phẩm:', error.message);
        res.status(500).send('Lỗi khi xóa sản phẩm');
    }
});

// tổng doanh thu của tất cả đơn hàng
//API là lấy tổng doanh thu của tất cả các đơn hàng.
router.get('/total-revenue', async (req, res) => {
    const totalSales = await Order.aggregate(
        [
            { $group: { _id: null, totalsales: { $sum: '$totalPrice' } } }
            //$sum: Tính tổng giá trị của trường totalPrice trong các tài liệu đã nhóm.
            //Kết quả của truy vấn này sẽ là một mảng các đối tượng, mỗi đối tượng chứa tổng số tiền bán được (totalsales).
        ]
    );
    if (totalSales.length === 0) {
        return res.status(404).send('Không có đơn hàng nào trong cơ sở dữ liệu');
    }
    if (!totalSales) {
        return res.status(400).send('the order sales connot be generated')
    }
    res.send(totalSales);
});

// đếm số lượng đơn hàng
router.get('/count', async (req, res) => {
    try {
        const orderCount = await Order.countDocuments({});
        if (orderCount === 0) {
            return res.status(404).json({ success: false, message: 'Không có đơn hàng nào trong cơ sở dữ liệu' });
        }
        res.json({ success: true, count: orderCount });
    } catch (error) {
        console.error('Lỗi khi đếm số lượng đơn hàng:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi khi đếm số lượng đơn hàng' });
    }
});

//hiển thị lịch sử đơn hàng của một người dùng cụ thể,
// logic đoạn này nó tìm id người dùng trong đơn hàng, cứ có id đó là nó xẽ in ra, 
router.get('/userorders/:userid', async (req, res) => {
    try {
        console.log({ user: req.params.userid });
        const userOrderList = await Order.find({ user: req.params.userid })
            .populate({
                path: 'orderItems',
                populate: { path: 'product', populate: 'category' }
            }).sort({ 'dateOrdered': -1 });

        if (userOrderList.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy lịch sử đơn hàng cho người dùng này' });
        }

        res.json({ success: true, orders: userOrderList });
    } catch (error) {
        console.error('Lỗi khi lấy lịch sử đơn hàng của người dùng:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi khi lấy lịch sử đơn hàng của người dùng' });
    }
});


// thanh toán đơn hàng.
router.post('/pay', async (req, res) => {
    try {
        const cookie = req.cookies['refreshToken'];
        const secret = process.env.secret;
        jwt.verify(cookie, secret, async (err, decoded) => {
            if (err) {
                return res.status(401).json({ message: 'Chưa đăng nhập' });
            };
            const cartUserList = await OrderItem.find({ user: decoded.userId });
            const listIdProduct = cartUserList.map((item) => {
                return item._id;
            });
            const totalPrices = await Promise.all(cartUserList.map(async (orderItemId, key) => {
                const orderItem = await OrderItem.findById(orderItemId).populate('product', 'price');
                const totalPrice = orderItem.product.price * orderItem.quantity;
                return totalPrice
            }));
            let totalPrice = totalPrices.reduce((a, b) => a + b, 0);
            let order = new Order({
                orderItems: listIdProduct,
                shippingAddress1: req.body.shippingAddress1,
                shippingAddress2: req.body.shippingAddress2,
                city: req.body.city,
                zip: req.body.zip,
                country: req.body.country,
                phone: req.body.phone,
                status: req.body.status,
                totalPrice: totalPrice,
                user: decoded.userId
            });
            order = await order.save();
            await order.populate({
                path: 'orderItems',
                populate: {
                    path: 'product'
                }
            });
            if (!order) {
                return res.status(500).json({ success: false, message: 'Không thể lưu đơn hàng' });
            }
            res.send(order);
        });
    } catch (error) {
        console.error('Lỗi khi thanh toán đơn hàng:', error.message);
        res.status(500).send('Lỗi khi thanh toán đơn hàng');
    }
});

// lấy tất cả sản phẩn đã thêm vào giỏ hàng theo người dùng
router.get('/user/cart-items', (async (req, res) => {
    try {
        const cookie = req.cookies['refreshToken'];
        const secret = process.env.secret;
        jwt.verify(cookie, secret, async (err, decoded) => {
            if (err) {
                return res.status(401).send('người dùng chưa đăng nhập');
            }
            const findCartItemByIdUser = await OrderItem.find({ user: decoded.userId }).populate('user');
            res.status(200).json({ success: true, message: 'đã tìm thấy', data: findCartItemByIdUser });
        });
    } catch (error) {
        console.error('Lỗi khi tìm đơn hàng:', error.message);
        res.status(500).send('Lỗi khi tìm đơn hàng');
    }

}));
module.exports = router;