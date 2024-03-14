const express = require('express');
const Product = require('../models/product');
const Category = require('../models/category');
const router = express.Router();
const multer = require('multer');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/user');


const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg'
}
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype];
        let uploadError = new Error('invalid image type');
        if (isValid) {
            uploadError = null
        }
        cb(uploadError, 'public/upload')
    },
    filename: function (req, file, cb) {
        const fileName = file.originalname.split(' ').join('-');
        const extension = FILE_TYPE_MAP[file.mimetype];
        cb(null, `${fileName}-${Date.now()}.${extension}`)
    }
})
const uploadOptions = multer({ storage: storage });


// Lọc tất cả sản phẩm hoặc sản phẩm theo danh mục
router.get('/products/filter-all/filter-by-category', async (req, res) => {
    try {
        let filter = {};
        if (req.query.category) {
            filter = { category: req.query.category.split(',') };
        }
        const productList = await Product.find(filter).populate('category');
        if (!productList) {
            return res.status(500).json({ success: false });
        }
        res.send(productList);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// Get All Products
router.get('/getAll', async (req, res) => {
    try {
        const productList = await Product.find().populate('category');
        if (productList && productList.length > 0) {
            res.status(200).json({ success: true, data: productList });
        } else {
            res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// Tìm sản phẩm theo ID
router.get('/getId/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('category');
        if (product) {
            res.status(200).json({ success: true, data: product });
        } else {
            res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// lọc sản phẩm theo nhiều điều kiện
router.get('/products/filter', async (req, res) => {
    try {
        // XÂY DỰNG TRUY VẤN
        // 1A) Lọc
        const queries = { ...req.query };
        const excludeFields = ['limit', 'sort', 'page', 'fields'];
        excludeFields.forEach(el => delete queries[el]);

        // 1B) Lọc nâng cao
        let queryString = JSON.stringify(queries);
        queryString = queryString.replace(/\b(gte|gt|lt|lte)\b/g, match => `$${match}`);
        const formatedQueries = JSON.parse(queryString);
        if (queries?.name) {
            formatedQueries.name = { $regex: queries.name, $options: 'i' };
        }
        let queryCommand = Product.find(formatedQueries);

        // 2) Sắp xếp
        if (req.query.sort) {
            const sortBy = req.query.sort.split(',').join(' ');
            queryCommand = queryCommand.sort(sortBy);
        } else {
            queryCommand = queryCommand.sort('-dateCreated');
        }
        // 3) Giới hạn trường
        if (req.query.fields) {
            const fields = req.query.fields.split(',').join(' ');
            queryCommand = queryCommand.select(fields);
        } else {
            queryCommand = queryCommand.select('-__v');
        }
        // 4) Phân trang
        const page = +req.query.page * 1 || 1;
        const limit = +req.query.limit * 1 || 5;
        const skip = (page - 1) * limit;
        queryCommand = queryCommand.skip(skip).limit(limit);

        const [response, counts] = await Promise.all([
            queryCommand.exec(),
            Product.find(formatedQueries).countDocuments()
        ]);
        res.status(200).json({
            success: true,
            counts,
            product: response,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// phần đánh giá sản phẩm và comment
router.put('/product/reviews', async (req, res) => {
    try {
        const refreshToken = req.cookies['refreshToken'];
        const secret = process.env.secret;

        if (!refreshToken) {
            return res.status(401).json({ success: false, message: 'Unauthorized: Missing refreshToken' });
        }

        await jwt.verify(refreshToken, secret, async (err, decoded) => {

            if (err) {
                return res.status(401).json({ success: false, message: 'Unauthorized: Invalid refreshToken' });
            }
            const user = await User.findById(decoded.userId);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            const productId = await Product.findById(req.body.id);
            if (!productId) {
                return res.status(404).json({ success: false, message: 'Product not found' });
            }

            if (!req.body.star || !req.body.comment) {
                return res.status(400).json({ success: false, message: 'thiếu đánh giá và bình luận' });
            }
            const alreadyRating = productId?.ratings?.some(item => item.postedBy.toString() === user.id);
            if (alreadyRating) {
                const updatedRating = productId.ratings.find(
                    rating => rating.postedBy.toString() === user.id.toString()
                );
                updatedRating.star = req.body.star;
                updatedRating.comment = req.body.comment;
                const data = await productId.save();
                res.status(200).json({ success: true, message: 'Rating updated successfully', data: data });
            } else {
                const product = await Product.findByIdAndUpdate(req.body.id,
                    { $push: { ratings: { star: req.body.star, comment: req.body.comment, postedBy: user.id } } }, { new: true }
                )
                res.status(200).json({ success: true, message: 'New rating added', data: product });
            }
            const ratingsCount = productId.ratings.length;
            let tong = 0;
            productId.ratings.forEach((item) => {
                return tong += item.star;
            });
            const totalRatings = Math.round(tong * 10 / ratingsCount) / 10;
            productId.totalratings = totalRatings;
            await productId.save();
            return res.status(200).json({ success: true, message: 'New rating added', data: productId });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Tìm kiếm comment theo số sao được đánh giá từ params
router.get('/filter/star/:id/:star', async (req, res) => {
    try {
        const productId = req.params.id;
        const star = parseInt(req.params.star);

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
        }

        const itemsWithStar = product.ratings.filter(item => item.star === star);
        const count = itemsWithStar.length;

        res.status(200).json({ count, items: itemsWithStar });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});
// thêm mới sản phẩm
router.post('/new', uploadOptions.single('image'), async (req, res) => {
    try {
        const categoryId = await Category.findById(req.body.category);
        if (!categoryId) return res.status(400).send('Invalid product');

        const file = req.file;
        if (!file) return res.status(400).send('Không có hình ảnh trong yêu cầu');

        const fileName = file.filename;
        const basePath = `${req.protocol}://${req.get('host')}/public/upload/`;

        let product = new Product({
            ...req.body,
            image: `${basePath}${fileName}`
        });
        product = await product.save();
        if (!product) return res.status(404).send('Không thể tạo sản phẩm');
        res.send(product);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }

});

// Sửa sản phẩm
router.put('/edit/:id', uploadOptions.single('image'), async (req, res) => {
    try {
        const categoryId = await Category.findById(req.body.category);
        if (!categoryId) return res.status(400).send('Sản phẩm không hợp lệ');

        let image = req.body.image; // Sử dụng ảnh hiện tại nếu không có ảnh mới
        const file = req.file;
        if (file) {
            const fileName = file.filename;
            const basePath = `${req.protocol}://${req.get('host')}/public/upload/`;
            image = `${basePath}${fileName}`;
        }

        const productById = await Product.findByIdAndUpdate(
            req.params.id,
            {
                ...req.body,
                image: image
            },
            { new: true }
        );

        if (productById) {
            res.status(200).send({ success: true, data: productById });
        } else {
            res.status(404).json({ success: false, message: 'Thử lại' });
        }
    } catch (error) {
        console.error('Lỗi khi sửa:', error.message);
        res.status(500).send('Lỗi khi sửa sản phẩm');
    }
});

// Xóa sản phẩm
// một bước chưa làm, khi xóa hãy kiểm tra trước xem có khách nào đang thực hiện mua bán với sản phẩm này ko
router.delete('/delete/:id', async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
        if (deletedProduct) {
            return res.status(200).json({ success: true, message: 'Xóa sản phẩm thành công' });
        } else {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
        }
    } catch (error) {
        console.error('Lỗi khi xóa sản phẩm:', error.message);
        return res.status(500).json({ success: false, message: 'Lỗi khi xóa sản phẩm' });
    }
});

// Đếm số lượng sản phẩm
router.get('/get/count', async (req, res) => {
    try {
        const productCount = await Product.countDocuments({});
        if (!productCount) {
            return res.status(500).json({ success: false, message: 'Không thể đếm số lượng sản phẩm' });
        }
        return res.status(200).json({ success: true, count: productCount });
    } catch (error) {
        console.error('Lỗi khi đếm số lượng sản phẩm:', error.message);
        return res.status(500).json({ success: false, message: 'Lỗi server khi đếm số lượng sản phẩm' });
    }
});


//Sản Phẩm nổi bật
router.get('/featured/:count', async (req, res) => {
    try {
        let count = '';
        console.log('một', count);
        if (req.params.count) {
            console.log('hai', req.params.count);
            const parsedCount = parseInt(req.params.count);
            console.log('ba', parsedCount);
            if (!isNaN(parsedCount)) {// nếu nó là chuỗi nó xẽ trả về true
                console.log('false');
                count = parsedCount;
            } else {
                console.log('không phải số hợp lệ');
                count = 0; // Nếu không phải số hợp lệ, gán giá trị mặc định là 0
            }
        } else {
            console.log('ko có tham số được chuyền');
            count = 0; // Nếu không có tham số được truyền, gán giá trị mặc định là 0
        }
        const productFeatured = await Product.find({ isFeatured: true }).limit(+count);
        console.log(productFeatured);
        if (!productFeatured) {
            return res.status(500).json({ success: false, message: 'Không tìm thấy sản phẩm nổi bật' });
        }
        res.status(200).json({ success: true, featured: productFeatured });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// Đếm số lượng sản phẩm nổi bật
router.get('/countfeatured', async (req, res) => {
    try {
        const countFeatured = await Product.countDocuments({ isFeatured: true });
        if (countFeatured === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm nổi bật' });
        }
        res.status(200).json({ success: true, count: countFeatured });
    } catch (error) {
        console.error('Lỗi khi đếm số lượng sản phẩm nổi bật:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi server khi đếm số lượng sản phẩm nổi bật' });
    }
});


// update nhiều file ảnh
router.put('/gallery-images/:id', uploadOptions.array('images', 10), async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).send('Invalid Product Id')
    }
    const files = req.files
    if (!files || !files.length) {
        return res.status(400).send('Không có ảnh nào được tải lên');
    }
    let imagesPaths = [];
    const basePath = `${req.protocol}://${req.get('host')}/public/upload/`;

    if (files) {
        files.map(file => {
            imagesPaths.push(`${basePath}${file.filename}`);
        })
    }
    const productById = await Product.findByIdAndUpdate(
        req.params.id,
        {
            images: imagesPaths
        },
        { new: true }
    );
    if (!productById)
        return res.status(404).send('the product cannot be create');
    res.send(productById);
});
module.exports = router;