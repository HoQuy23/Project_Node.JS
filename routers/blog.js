const express = require('express');
const Blog = require('../models/blog');
const User = require('../models/user');
const router = express.Router();
const jwt = require('jsonwebtoken');

// 1:List - Blog
router.get('/getAll', async (req, res) => {
    try {
        const blogList = await Blog.find();
        if (!blogList || blogList.length === 0) {
            return res.status(404).json({ success: false, message: 'Không có bài đăng nào trong cơ sở dữ liệu' });
        }
        res.status(200).json({ success: true, data: blogList });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách bài đăng:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách bài đăng' });
    }
});
// 2:FindById - BlogCategory
// mỗi lần click là xẽ tăng numberViews
const excludedFields = 'name'
router.get('/getId/:id', async (req, res) => {
    try {
        const blog = await Blog.findByIdAndUpdate(req.params.id, { $inc: { numberViews: 1 } }, { new: true })
            .populate('likes', excludedFields)
            .populate('dislikes', excludedFields);
        if (blog) {
            res.status(200).send({ success: true, data: blog });
        } else {
            res.status(404).json({ success: false, message: 'Không tìm thấy bài đăng' });
        }
    } catch (error) {
        console.error('Lỗi khi lấy bài đăng theo ID:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy bài đăng' });
    }
});

// 3:Add-Blog
router.post('/new', async (req, res) => {
    try {
        const { title, description, blogcategory } = req.body;
        const blog = await Blog.create({ title, description, blogcategory });
        res.status(201).json(blog);
    } catch (error) {
        console.error('Lỗi khi tạo mới bài đăng:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi server khi tạo mới bài đăng' });
    }
});

// 4:Put - Blog
router.put('/edit/:id', async (req, res) => {
    try {
        const { title, description, blogcategory } = req.body;
        const updatedBlog = await Blog.findByIdAndUpdate(
            req.params.id,
            { title, description, blogcategory },
            { new: true }
        );
        if (updatedBlog) {
            res.status(200).json({ success: true, data: updatedBlog });
        } else {
            res.status(404).json({ success: false, message: 'Không tìm thấy bài đăng' });
        }
    } catch (error) {
        console.error('Lỗi khi sửa bài đăng:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi server khi sửa bài đăng' });
    }
});

// 5:Delete-Blog
router.delete('/delete/:id', async (req, res) => {
    try {
        const deletedBlog = await Blog.findByIdAndDelete(req.params.id);
        if (deletedBlog) {
            res.status(200).json({ success: true, message: 'Xóa bài đăng thành công' });
        } else {
            res.status(404).json({ success: false, message: 'Không tìm thấy bài đăng' });
        }
    } catch (error) {
        console.error('Lỗi khi xóa bài đăng:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi server khi xóa bài đăng' });
    }
});
// --
// 6:Likes
router.put('/likes/:id', async (req, res) => {
    try {
        const refreshToken = req.cookies['refreshToken'];
        const secret = process.env.secret;
        console.log('nnoo', refreshToken);
        await jwt.verify(refreshToken, secret, async (err, decoded) => {
            if (err) throw new Error('RefreshToken không hợp lệ ');
            const user = await User.findOne({ _id: decoded.userId, refreshToken: refreshToken });
            if (!user) throw new Error('RefreshToken user không hợp lệ 02');
            console.log(user);
            const findIdBlog = await Blog.findById(req.params.id);
            console.log('đến đây chưa', findIdBlog.dislikes);
            // Kiểm tra nếu user đã dislike bài viết trước đó
            const isDisliked = findIdBlog.dislikes.some(dislikedUser => dislikedUser.toString() === user.id.toString());
            console.log(isDisliked);
            if (isDisliked) {
                // Nếu user đã dislike, ta sẽ xóa dislike và thêm like
                findIdBlog.dislikes.pull(user.id);
                findIdBlog.likes.push(user.id);
                await findIdBlog.save();
                const likeCount = findIdBlog.likes.length;
                res.status(200).json({ success: true, message: 'Đã thích bài viết', likeCount: likeCount });
            } else {
                // Nếu user đã like trước đó
                const isLiked = findIdBlog.likes.some(likedUser => likedUser.toString() === user.id.toString());

                if (isLiked) {
                    // Nếu user đã like trước đó, ta sẽ xóa like
                    findIdBlog.likes.pull(user.id);
                    await findIdBlog.save();

                    const likeCount = findIdBlog.likes.length;
                    res.status(200).json({ success: true, message: 'Đã hủy thích bài viết', likeCount: likeCount });
                } else {
                    // Nếu user chưa like hoặc dislike trước đó, ta sẽ thêm like
                    findIdBlog.likes.push(user.id);
                    await findIdBlog.save();
                    const likeCount = findIdBlog.likes.length;
                    res.status(200).json({ success: true, message: 'Đã thích bài viết', likeCount: likeCount });
                }
            }

        });
    } catch (error) {
        console.error('Lỗi khi xử lý likes/dislikes:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi khi xử lý likes/dislikes' });
    }
});
// 7:Likes
router.put('/dislikes/:id', async (req, res) => {
    try {
        const refreshToken = req.cookies['refreshToken'];
        const secret = process.env.secret;
        await jwt.verify(refreshToken, secret, async (err, decoded) => {
            if (err) throw new Error('RefreshToken không hợp lệ ');

            const user = await User.findOne({ _id: decoded.userId, refreshToken: refreshToken });
            if (!user) throw new Error('RefreshToken user không hợp lệ');

            const findIdBlog = await Blog.findById(req.params.id);

            // Kiểm tra nếu user đã like bài viết trước đó
            const isLike = findIdBlog.likes.some(likedUser => likedUser.toString() === user.id.toString());
            console.log(isLike);
            if (isLike) {
                // Nếu user đã like, ta sẽ xóa like và thêm dislike
                findIdBlog.likes.pull(user.id);
                findIdBlog.dislikes.push(user.id);
                await findIdBlog.save();

                const dislikeCount = findIdBlog.dislikes.length;
                res.status(200).json({ success: true, message: 'Đã dislike bài viết', dislikeCount: dislikeCount, findIdBlog: findIdBlog });
            } else {
                // Nếu user đã dislike trước đó
                const isDisliked = findIdBlog.dislikes.some(dislikedUser => dislikedUser.toString() === user.id.toString());
                if (isDisliked) {
                    // Nếu user đã dislike trước đó, ta sẽ xóa dislike
                    findIdBlog.dislikes.pull(user.id);
                    await findIdBlog.save();

                    const dislikeCount = findIdBlog.dislikes.length;
                    res.status(200).json({ success: true, message: 'Đã hủy dislike bài viết', dislikeCount: dislikeCount, findIdBlog: findIdBlog });
                } else {
                    findIdBlog.dislikes.push(user.id);
                    await findIdBlog.save();

                    const dislikeCount = findIdBlog.dislikes.length;
                    res.status(200).json({ success: true, message: 'Đã dislike bài viết', dislikeCount: dislikeCount, findIdBlog: findIdBlog });
                }
            }

        });
    } catch (error) {
        console.error('Lỗi khi xử lý likes/dislikes:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi khi xử lý likes/dislikes' });
    }
});
module.exports = router;

// token --quy:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NWQ4NmFiNTdmMjYwNWNjYmU5ZWNhYjAiLCJpc0FkbWluIjp0cnVlLCJpYXQiOjE3MDg4NDYzMTIsImV4cCI6MTcwODkzMjcxMn0.Hhf_vsb4YU6A0jV1PXK0rvU_TrbL0Xt8_dGz0Db9pBs

//token--trang:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NWQ4NmFkMzdmMjYwNWNjYmU5ZWNhYjIiLCJpc0FkbWluIjpmYWxzZSwiaWF0IjoxNzA4ODQ2MzQxLCJleHAiOjE3MDg5MzI3NDF9.dX1Q4VhyeCfhGPjladm4wctqzNc7yfzPuUdUgW4GZic