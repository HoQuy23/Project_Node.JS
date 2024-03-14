const express = require('express');
const router = express.Router();
const Category = require('../models/category');
const Product = require('../models/product');

// Create a new category-Đã hoàn thiện
router.post('/new', async (req, res) => {
    try {
        const { name, icon, color } = req.body;
        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            return res.status(400).json({ message: 'Category name đã tồn tại' });
        }
        const newCategory = new Category({ name, icon, color });
        const savedCategory = await newCategory.save();
        res.json(savedCategory);
    } catch (error) {
        res.status(500).json({ message: 'Failed to create category', error: error.message });
    }
});
// Put-Category
router.put('/edit/:id', async (req, res) => {
    try {
        const listProduct = await Product.find();
        const listCategory = await Category.find();
        const isProductExist = listProduct.some((item) => { return item.category.toString() === req.params.id.toString(); });
        const isNameDuplicate = listCategory.some((item) => { return item.name.toString() === req.body.name.toString(); });
        if (isProductExist) {
            res.status(200).send({ success: false, message: 'Danh mục tồn tại sản phẩm' });
        } else if (isNameDuplicate) {
            res.status(200).send({ success: false, message: 'Trùng tên' });
        } else {
            console.log('Không tồn tại');
            const categoryById = await Category.findByIdAndUpdate(
                req.params.id,
                {
                    name: req.body.name,
                    icon: req.body.icon,
                    color: req.body.color,
                },
                { new: true }
            );
            if (categoryById) {
                res.status(200).send({ success: true, data: categoryById });
            } else {
                res.status(404).json({ success: false, message: 'Danh mục tồn tại sản phẩm' });
            }
        }
    } catch (error) {
        console.error('Lỗi khi sửa:', error.message);
        res.status(500).send('Lỗi khi sửa danh mục');
    }
});


// Delete-Category
router.delete('/delete/:id', async (req, res) => {
    try {
        const listProduct = await Product.find();

        const isProductExist = listProduct.some((item) => {
            return item.category.toString() === req.params.id.toString();
        });
        if (isProductExist) {
            res.status(200).json({ success: false, message: 'Danh mục đang có sản phẩm' });
        } else {
            const deletedCategory = await Category.findByIdAndDelete(req.params.id);
            if (deletedCategory) {
                res.status(200).json({ success: true, message: 'Xóa thành công' });
            } else {
                res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
            }
        }

    } catch (error) {
        console.error('Lỗi khi xóa danh mục:', error.message);
        res.status(500).send('Lỗi khi xóa danh mục');
    }
});

// Get all categories--Đã xong
router.get('/getAll', async (req, res) => {
    try {
        const categoryList = await Category.find();
        res.json(categoryList);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch categories', error: error.message });
    }

});

// Get category by ID-- Đã xong
router.get('/getId/:id', async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.json({ success: true, data: category });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch category', error: error.message });
    }
});



module.exports = router;