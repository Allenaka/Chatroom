// 引入express、fs、path
const express = require('express');
const fs = require('fs');
const path = require('path');

// 引入数据库
const DataBase = require('./db');
// 创建数据库
const db = new DataBase('mongodb://localhost:27017', 'chatroom', 'user')
console.log(db)
// 处理post请求
const bodyParser = require('body-parser');

// 创建应用
const app = express();
// 根路径
const root = process.cwd();
// 静态化
app.use(express.static('./web/'))
// post请求体
app.use(bodyParser.urlencoded({ extended: false }));



// 启动应用
app.listen(3000, () => console.log('sever listen at 3000'))