const express = require('express');
const BlogCategory = require('../models/blogCategory');
const Blog = require('../models/blog');
const router = express.Router();
const mongoose = require('../connect')


//Lấy tất cả danh mục
router.get('/getAll', async (req, res) => {
    try {
        const blogCategoryList = await BlogCategory.find();
        if (!blogCategoryList || blogCategoryList.length === 0) {
            return res.status(404).json({ success: false, message: 'Không có danh mục nào trong cơ sở dữ liệu' });
        }
        res.status(200).json({ success: true, data: blogCategoryList });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách danh mục blog:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách danh mục blog' });
    }
});

// FindById-BlogCategory
router.get('/getId/:id', async (req, res) => {
    try {
        // Kiểm tra tính hợp lệ của ID
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
        }
        const blogCategory = await BlogCategory.findById(req.params.id);
        if (blogCategory) {
            return res.status(200).json({ success: true, data: blogCategory });
        } else {
            return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
        }
    } catch (error) {
        console.error('Lỗi khi tìm danh mục:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});


//-Add-BlogCategory
router.post('/new', async (req, res) => {
    try {
        const existingCategory = await BlogCategory.findOne({ title: req.body.title });
        if (existingCategory) {
            return res.status(400).json({ success: false, message: 'Danh mục blog đã tồn tại' });
        }
        const newBlogCategory = new BlogCategory({
            title: req.body.title
        });
        const savedCategory = await newBlogCategory.save();
        if (!savedCategory) {
            return res.status(500).json({ success: false, message: 'Không thể tạo mới danh mục blog' });
        }
        return res.status(201).json({ success: true, data: savedCategory });
    } catch (error) {
        console.error('Lỗi khi thêm mới danh mục blog:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi khi thêm mới danh mục blog' });
    }

});

// Sửa 
router.put('/edit/:id', async (req, res) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({ success: false, message: 'Tiêu đề của danh mục không được bỏ trống' });
        }
        // Kiểm tra xem tiêu đề mới có trùng với tiêu đề của bất kỳ danh mục nào khác không
        const existingCategory = await BlogCategory.findOne({ title: req.body.title });
        if (existingCategory && existingCategory._id.toString() !== req.params.id) {
            return res.status(400).json({ success: false, message: 'Tiêu đề của danh mục đã tồn tại' });
        }
        const updatedCategory = await BlogCategory.findByIdAndUpdate(
            req.params.id,
            { title: req.body.title },
            { new: true }
        );
        if (!updatedCategory) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
        }
        res.status(200).json({ success: true, data: updatedCategory });

    } catch (error) {
        console.error('Lỗi khi sửa:', error.message);
        res.status(500).send('Lỗi khi sửa danh mục');
    }
});

//Delete
router.delete('/delete/:id', async (req, res) => {
    try {
        const existingCategory = await Blog.findOne({ blogcategory: req.params.id });
        if (existingCategory) {
            return res.status(400).json({ success: false, message: 'Không thể xóa danh mục có bài viết Blog liên kết' });
        }
        const deletedBlogCategory = await BlogCategory.findByIdAndDelete(req.params.id);
        if (!deletedBlogCategory) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
        }
        res.status(200).json({ success: true, message: 'Xóa danh mục thành công' });
    } catch (error) {
        console.error('Lỗi khi xóa danh mục:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi khi xóa danh mục' });
    }
});
module.exports = router;