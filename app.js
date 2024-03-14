const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const mongoose = require('./connect');
const cors = require('cors');
const authJwt = require('./helpers/jwt');
const errorHandler = require('./helpers/error-handler');

const categoryRouter = require('./routers/category');
const productRouter = require('./routers/product');
const orderRouter = require('./routers/order');
const userRouter = require('./routers/user');
const blogCategoryRouter = require('./routers/blogCategory');
const blogRouter = require('./routers/blog');

const cookieParser = require('cookie-parser');

const port = 3000;
const app = express();
app.use(cors({
    origin: 'http://localhost:3000' // Replace with your allowed origin
}));

//middleware
app.use(bodyParser.json());
app.use(morgan('tiny'));
app.use('/public/upload', express.static(__dirname + '/public/upload'));// hỏi chat
app.use(cookieParser());

require('dotenv/config');
const api = process.env.API_URL;

app.use(authJwt());
//middleware để xử lý lỗi toàn cục 
app.use(errorHandler);
//router
app.use(`${api}/user`, userRouter);
app.use(`${api}/categorys`, categoryRouter);
app.use(`${api}/products`, productRouter);
app.use(`${api}/order`, orderRouter);
app.use(`${api}/blogcategory`, blogCategoryRouter);
app.use(`${api}/blog`, blogRouter);

app.listen(port, () => {
    console.log('server is running http://localhost:' + port);
});

