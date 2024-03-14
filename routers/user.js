const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Lấy số lượng người dùng và danh sách người dùng
router.get('/getAllWithCount', async (req, res) => {
    try {
        const userList = await User.find().select('-passwordHash');
        const userCount = await User.countDocuments({});
        res.send({ users: userList, count: userCount });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách người dùng:', error.message);
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách người dùng' });
    }
});

// Lấy thông tin người dùng bằng ID
router.get('/getId/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-passwordHash');
        if (!user) {
            res.status(404).json({ message: 'Không tìm thấy người dùng' });
        } else {
            res.status(200).json(user);
        }
    } catch (error) {
        console.error('Lỗi khi lấy thông tin người dùng:', error.message);
        res.status(500).json({ message: 'Lỗi server khi lấy thông tin người dùng' });
    }
});
// Login
router.post('/login', async (req, res) => {
    try {
        const { email, passwordHash } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(passwordHash, user.passwordHash))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        const accessToken = jwt.sign({ userId: user.id, isAdmin: user.isAdmin }, process.env.secret, { expiresIn: '1d' });
        const refreshToken = jwt.sign({ userId: user.id }, process.env.secret, { expiresIn: '3d' });
        await User.findByIdAndUpdate(user.id, { refreshToken });
        res.cookie('refreshToken', refreshToken, { httpOnly: true, maxAge: 3 * 24 * 60 * 60 * 1000 });
        res.json({ message: 'Login successful', accessToken });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// Middleware để kiểm tra và cập nhật refreshToken
const updateRefreshToken = async (req, res, next) => {
    try {
        const secret = process.env.secret;
        // lấy refreshtoken từ cookie
        const cookie = req.cookies['refreshToken'];
        console.log('có', cookie);
        // check xem có refreshtoken hay không
        if (!cookie) {
            throw new Error('Không có refreshToken trong cookies');
        }
        //check refreshtoken có hợp lệ hay không
        await jwt.verify(cookie, secret, async (err, decoded) => {
            if (err) {
                throw new Error('RefreshToken không hợp lệ 01');
            }
            console.log('hihi', decoded);
            // check refreshtoken xem có giống với đã lưu ở database hay không
            const user = await User.findOne({ _id: decoded.userId, refreshToken: cookie });// điều kiện xem có 
            if (!user) {
                throw new Error('RefreshToken user không hợp lệ 02');
            }
            // Tạo accessToken mới
            const accessToken = jwt.sign({ userId: user.id, isAdmin: user.isAdmin }, secret, { expiresIn: '1d' });
            // Gán accessToken vào yêu cầu
            req.accessToken = accessToken;
            next();
        });

    } catch (error) {
        console.log('Lỗi:', error.message);
        res.status(403).json({ success: false, message: 'Không thể xác thực refreshToken' });
    }
};

router.post('/refreshAccessToken', updateRefreshToken, async (req, res) => {
    // console.log('vào đây chưa');
    // console.log(req.accessToken);
    // Lấy accessToken từ yêu cầu
    const accessToken = req.accessToken;
    // Gửi accessToken cho client
    res.status(200).json({ accessToken });
});


// đăng ký
router.post('/register', async (req, res) => {
    try {
        let user = new User({
            name: req.body.name,
            email: req.body.email,
            passwordHash: bcrypt.hashSync(req.body.passwordHash, 10),
            phone: req.body.phone,
            isAdmin: req.body.isAdmin,
            street: req.body.street,
            zip: req.body.zip,
            city: req.body.city,
            country: req.body.country,
        });
        user = await user.save();
        if (!user)
            return res.status(404).send('the user cannot be create');
        res.send(user);
    } catch (error) {
        console.error('Lỗi đăng ký :', error.message);
        res.status(500).send('Lỗi đăng ký ');
    }

});

// xóa
router.delete('/delete/:id', async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (deletedUser) {
            res.status(200).json({ success: true, message: 'Xóa thành công' });
        } else {
            res.status(404).json({ success: false, message: 'Không tìm thấy' });
        }
    } catch (error) {
        console.error('Lỗi khi xóa :', error.message);
        res.status(500).send('Lỗi khi xóa ');
    }
});


// đăng xuất
router.post('/logout', async (req, res) => {
    try {
        const cookie = req.cookies
        if (!cookie || !cookie.refreshToken) { throw new Error('Chưa có refreshToken hoặc cookie'); }
        // Update refreshToken in database
        await User.findOneAndUpdate(
            { refreshToken: cookie.refreshToken },
            { refreshToken: null },
            { new: true }
        );
        // xóa refreshToken ở cookie trình duyệt
        res.clearCookie('refreshToken', { httpOnly: true, secure: true });
        res.clearCookie('token');
        res.status(200).json({ message: 'Đăng xuất thành công' });
    } catch (error) {
        console.error('Lỗi khi đăng xuất:', error.message);
        res.status(500).json({ message: 'Đã xảy ra lỗi' });
    }
});

// đổi password
router.put('/editPassWord/:id', async (req, res) => {
    try {
        const editUser = await User.findByIdAndUpdate(
            req.params.id,
            {
                passwordHash: bcrypt.hashSync(req.body.passwordHash, 10)
            },
            { new: true }
        )
        res.status(200).json({ success: true, message: 'thành công', data: editUser })
    } catch (error) {
        console.log('Lỗi:', error);
        res.status(500).json({ success: false, message: 'Đã xảy ra lỗi' });
    }

});
// đổi password và đổi thông tin người dùng tích hợp
router.put('/users/:id', async (req, res) => {
    try {
        let updatedUser;
        // Cập nhật mật khẩu (nếu được cung cấp)
        if (req.body.passwordHash) {
            updatedUser = await User.findByIdAndUpdate(
                req.params.id,
                { passwordHash: bcrypt.hashSync(req.body.passwordHash, 10) },
                { new: true }
            );
        } else {
            // Cập nhật hồ sơ hoặc địa chỉ (nếu có)
            const updateObject = {};
            if (req.body.name) updateObject.name = req.body.name;
            if (req.body.email) updateObject.email = req.body.email;
            if (req.body.phone) updateObject.phone = req.body.phone;
            if (req.body.isAdmin !== undefined) updateObject.isAdmin = req.body.isAdmin;
            if (req.body.street) updateObject.address = {
                street: req.body.street,
                zip: req.body.zip,
                city: req.body.city,
                country: req.body.country,
            };

            updatedUser = await User.findByIdAndUpdate(req.params.id, updateObject, { new: true });
        }

        if (!updatedUser) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        res.status(200).json({ success: true, message: 'Cập nhật thành công', data: updatedUser });
    } catch (error) {
        console.error('Lỗi khi cập nhật người dùng:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
    }
});
module.exports = router;



