// 引入express、fs、path
const express = require('express');
const fs = require('fs');
const path = require('path');

// 引入数据库
const DataBase = require('./db');
// 创建数据库
const db = new DataBase('mongodb://localhost:27017', 'chatroom', 'user')

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

// 注册接口
app.post('/regist', async (req, res) => {
    let { username, password } = req.body;
    // 用户目录
    let userDir = path.join('/upload', username);
    // 存储用户头像的目录
    let headDir = path.join('/upload', username, '_head');
    // 头像文件路径
    let filePath = path.join(headDir, 'head_default.svg');
    // 创建头像目录
    let result = await new Promise((resolve, reject) => {
        fs.mkdir(path.join(root, userDir), err => {
            if (err) {
                reject({n: 1, data: err});
            } else {
                resolve({n: 0})
            }
        })
    })
    if (result.n === 0) {
        // 创建头像目录
        let result = await new Promise((resolve, reject) => {
            fs.mkdir(path.join(root, headDir), err => {
                if (err) {
                    reject({n: 1, data: err});
                } else {
                    resolve({n: 0});
                }
            })
        })
        // 监听结果
        if (result.n === 0) {
            // 读取头像文件
            result = await new Promise(async (resolve, reject) => {
                fs.readFile(path.join(root, 'web/images/head_default.svg'), (err, data) => {
                    if (err) {
                        reject({n: 1, data: err});
                    } else {
                        resolve({n:0, data})
                    }
                })         
            }) 
            // 监听结果
            if (result.n === 0) {
                // 写入头像文件
                result = await new Promise((resolve, reject) => {
                    // 写入文件
                    fs.appendFile(path.join(root, filePath), result.data, err => {
                        if(err) {
                            reject({n: 1, data: err});
                        } else {
                            resolve({n: 0})
                        }
                    })
                })
                if (result.n === 0) {
                    // 写入数据库
                    db.collection('user')
                    .insertOne({username, password, url: filePath})
                    .then(
                        () => res.json({ errno: 0}),
                        err => res.json(err)
                    )
                } else {
                    return res.json({errno: 4, msg: '写入文件失败'})
                }
            } else {
                return res.json({errno: 3, msg: '文件读取失败'})
            }
        } else {
            return res.json({errno: 2, msg: '创建头像目录失败'})
        }
    } else {
        return res.json({errno: 1, msg: '创建用户目录失败'})
    }
})
// 检测用户名接口
app.get('/check/user', (req, res) => {
    let { username } = req.query;
    // 在数据库中查询
    db.collection('user')
        .findOne({ username })
        .then(
            // 找到了，不能注册
            () => res.json({errno: 1, msg: '该用户名已被注册'}),
            // 没找到
            err => {
                // 数据库中没有
                if (err.errno === 9) {
                    res.json({errno: 0, msg: '可以注册'});
                } else {
                    // 查询出错
                    res.json({errno: 2, msg: err.msg})
                }
            }
        )
})
// 启动应用
app.listen(3000, () => console.log('sever listen at 3000'))