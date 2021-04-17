// 引入express、fs、path、http
const express = require('express');
const fs = require('fs');
const path = require('path');
const http = require('http');
// 文件类型
const MINE_TYPES = {
    '.html':    'text/html',
    '.xml':     'text/xml',
    '.txt':     'text/plain',
    '.css':     'text/css',
    '.js':       'text/javascript',
    '.json':     'text/json',
    '.pdf':      'application/json',
    '.swf':      'application/x-shockwave-flash',
    '.svg':      'image/svg+xml',
    '.tiff':     'image/tiff',
    '.png':      'image/png',
    '.gif':      'image/gif',
    '.jpg':      'image/jpeg',
    '.jpeg':     'image/jpeg',
    '.wav':      'audio/x-wav',
    '.wma':      'audio/x-ms-wma',
    '.wmv':      'video/x-ms-wmv',
    '.woff2':    'application/font-woff2'
};

// 引入jwt
const jwt = require('jsonwebtoken');
// 引入socket
const socket = require('socket.io')
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
// 定义加密解密字符串
const TOKEN = 'zaozijintianbuchizao';

// 静态化
app.use(express.static('./web/'));
app.use('/upload/', express.static('./upload/'));
app.use('/room/', express.static('./room/'));

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
    let filePath = path.join(headDir, 'head_default.svg').replace(/\\/g, '/');
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
// 登录接口
app.post('/login', (req,res) => {
    // 查询数据库
    db.collection('user')
        .findOne(req.body)
        .then(
            ({username, url}) => {
                // 创建token
                jwt.sign({username, url}, TOKEN, {expiresIn: 3000} ,(err, data) => {
                    if (err) {
                        res.json({errno: 2, msg: '登陆失败'});
                    } else {
                        res.json({errno: 0, data })
                    }
                })
            },
            err => res.json({errno: 1, msg: '用户名或密码错误'})
        )
})
// 获取用户信息接口
app.get('/userinfo', (req, res) => {
    // 校验token
    jwt.verify(req.query.token, TOKEN, (err, data) => {
        if (err) {
            res.json({errno: 1, msg: '没有该用户信息'});
        } else {
            res.json({errno: 0, data});
        }
    })
})
// 创房接口
app.post('/create_room', async (req, res) => {
    let {username, roomName, roomDisc, memberNum} = req.body;
    // 房间目录
    let roomDir;
    // 页面路径
    let filePath;
    let result = await new Promise((resolve, reject) => {
        db.collection('room')
        .insertOne({username, roomName, roomDisc, memberNum})
        .then(
            data => {
                let roomId = data.insertedId.toString();
                // 房间目录
                roomDir = path.join('/room/', roomId);
                filePath = path.join(roomDir, 'room.html');
                res.json({errno: 0, msg: '创建成功', roomId})
                resolve({n: 0})
            },
            err => {
                res.json(err);
                reject({n: 1, data: err});
            } 
        )
    })
    
    if (result.n === 0) {
        result = await new Promise((resolve, reject) => {
            fs.mkdir(path.join(root, roomDir), err => {
                if (err) {
                    reject({n: 1, data: err});
                } else {
                    resolve({n: 0});
                }
            })
        })
        if (result.n === 0) {
            result = await new Promise((resolve, reject) => {
                fs.readFile(path.join(root, '/web/room.html'), (err, data) => {
                    if (err) {
                        reject({n: 1, data: err});
                    } else {
                        resolve({n: 0, data});
                    }
                })
            })
            if (result.n === 0) {
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
            }
        }
    }   
})
// 获取房间信息接口
app.get('/roominfo', async (req, res) => {
    let roomId = req.query.id;
    db.collection('room')
        .findOne({ _id: roomId })
        .then(
            // 找到了
            data => {
                res.json({errno: 0, data});
            },
            err => {
                // 数据库中没有
                if (err.errno === 9) {
                    res.json({errno: 1, msg: '未查找到该房间'});
                } else {
                    // 查询出错
                    res.json({errno: 2, msg: err.msg});
                }
            }
        )
    // let filePath = path.join(root, './web/room.html');
    // let extname = path.extname(filePath)
    // let result = await new Promise((resolve, reject) => {
    //     fs.readFile(filePath, (err, data) => {
    //         if (err) {
    //             reject({n: 1, data: err})
    //         } else {
    //             resolve({n: 0, data})
    //         }
    //     })
    // })
    // if (result.n === 0) {
    //     res.setHeader('Content-Type', MINE_TYPES[extname] + ';charset=utf-8')
    //     res.end(result.data)
    // } else {
    //     res.json({errno: 1, msg: result.data});
    // }
})
// 获取房间列表
app.get('/room_list', (req, res) => {
    db.collection('room')
        .findMany()
        .then(
            data => {
                res.json({errno: 0, data})
            },
            err => res.json({errno: 1, msg: err.msg})
        )
})
let server = http.createServer(app);

// 添加socket协议
let io = socket(server);

// 房间列表
let rooms = [];

// 监听客户端连接成功
io.on('connection', client => {
    let room;
    // 监听房间成员
    client.on('newMember', (username, roomId) => {
        if (room = rooms.find(item => item.id === roomId)) {
            room.users.push([username, client]);
        } else {
            rooms.push({id: roomId, users:[]});
            room = rooms.find(item => item.id === roomId);
            room.users.push([username, client]);
        }
        // 广播消息
        io.emit('userEnter', roomId, room.users.map(item => item[0]))
    })
    // 监听用户离开
    client.on('disconnect', () => {
        let href = client.handshake.headers.referer;
        let roomId = href.slice(href.search('id')+3);
        // 移出该用户
        let index = room.users.findIndex(item => item[1] === client);
        room.users.splice(index, 1);
        // 广播消息
        io.emit('userLeave', roomId, room.users.map(item => item[0])) 
    })

    // 监听用户发言
    client.on('message', (text, id) => {
        // 广播
        // 获取用户名
        let user = room.users.find(item => item[1] === client);
        io.emit('showMessage', user[0] + ' 说：' + text, id);
    })
})

// 启动应用
server.listen(3000, () => console.log('sever listen at 3000'))