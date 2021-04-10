const {MongoClient, ObjectId} = require('mongodb');

// 定义错误对象
const MESSAGE = {
    databaseError: { errno: 1, msg: '数据库连接错误'},
    collectionInsertError: { errno: 2, msg: '数据库插入错误'},
    collectionInsertNoData: { errno: 3, msg: '数据库没有插入数据' },
    collectionDeleteError: { errno: 4, msg: '数据库删除错误' },
    collectionDeleteNoData: { errno: 5, msg: '数据库没有删除数据'},
    collectionUpdateError: { errno: 6, msg: '数据库更新错误'},
    collectionUpdateNoData: { errno: 7, msg: '数据库没有更新数据'},
    collectionFindError: { errno: 8, msg: '数据库查找错误'},
    collectionFindNoData: { errno: 9, msg: '数据库没有查找到数据'}
}

// 面向对象
class DataBase {
    // 构造函数
    constructor(address, databasaeName, collectionName) {
        this.address = address;
        this.databasaeName = databasaeName;
        this.collectionName = collectionName;
    }
    // 切换集合
    collection(collectionName) {
        this.collectionName = collectionName;
        return this;
    }
    // 连接数据库
    connect() {
        return new Promise((resolve, reject) => {
            MongoClient.connect(this.address, {useNewUrlParser: true, useUnifiedTopology: true}, (err, client) => {
                if (err) {
                    reject(MESSAGE.databaseError);
                } else {
                    resolve(client.db(this.databasaeName));
                }
            });
        })
    }
    // 插入数据
    insertOne(obj) {
        return new Promise((resolve, reject) => {
            // 连接数据库之后，才能操作
            this.connect()
                .then(
                    db => {
                        db.collection(this.collectionName)
                            .insertOne(obj, (err, data) => {
                                if (err) {
                                    reject(MESSAGE.collectionInsertError);
                                } else if(data.result.n > 0) {
                                    resolve(data);
                                } else {
                                    reject(MESSAGE.collectionInsertNoData);
                                }
                            })
                    },
                    err => reject(err)
                )
        })
    }
    // 插入多条数据
    insertMany(arr) {
        return new Promise((resolve, reject) => {
            this.connect()
                .then(
                    db => {
                        db.collection(this.collectionName)
                            .insertMany(arr, (err, data) => {
                                if (err) {
                                    reject(MESSAGE.collectionInsertError);
                                } else if (data.result.n > 0) {
                                    resolve(data);
                                } else {
                                    reject(MESSAGE.collectionInsertNoData);
                                }
                            })
                    },
                    err => reject(err)
                )
        })
    }
    // 删除数据
    deleteOne(obj) {
        return new Promise((resolve, reject) => {
            if (obj === undefined) reject(MESSAGE.collectionDeleteNoData);
            else {
                this.connect()
                .then(
                    db => {
                        // 处理id
                        if (obj._id) {
                            obj._id = ObjectId(obj._id);
                        }
                        db.collection(this.collectionName)
                            .deleteOne(obj, (err, data) => {
                                if (err) {
                                    reject(MESSAGE.collectionDeleteError);
                                } else if (data.result.n > 0) {
                                    resolve(data.result);
                                } else {
                                    reject(MESSAGE.collectionDeleteNoData);
                                }
                            })
                    },
                    err => reject(err)
                )
            }      
        })
    }
    deleteMany(arr) {
        return Promise.all(arr.map(item => this.deleteOne(item)))
    }
    // 更新数据
    updateOne(oldObj, newObj) {
        return new Promise((resolve, reject) => {
            if (oldObj._id) {
                oldObj._id = ObjectId(oldObj._id);
            }
            this.connect()
                .then(
                    db => {
                        db.collection(this.collectionName)
                            .updateOne(oldObj, {$set: newObj}, (err, data) => {
                                if (err) {
                                    reject(MESSAGE.collectionUpdateError);
                                } else if (data.result.n > 0) {
                                    resolve(data.result);
                                } else {
                                    reject(MESSAGE.collectionUpdateNoData);
                                }
                            })
                    }
                )
        })
    }
    updateMany(arr) {
        return Promise.all(arr.map(item => this.updateOne(...item)));
    }
    // 查找数据
    findOne(obj) {
        return new Promise((resolve, reject) => {
            if (obj._id) {
                obj._id = ObjectId(obj._id);
            }
            this.connect()
                .then(
                    db => {
                        db.collection(this.collectionName)
                            .findOne(obj, (err, data) => {
                                if (err) {
                                    reject(MESSAGE.collectionFindError);
                                } else if (data) {
                                    resolve(data);
                                } else {
                                    reject(MESSAGE.collectionFindNoData);
                                }
                            });
                    },
                    err => reject(err)
                )
        })
    }
    findMany(obj, fn = data => data) {
        return new Promise((resolve, reject) => {
            this.connect()
                .then(
                    db => {
                        let result = db.collection(this.collectionName).find(obj);
                        fn(result).toArray((err, data) => {
                            if (err) {
                                reject(MESSAGE.collectionFindError);
                            } else if (data.length) {
                                resolve(data);
                            } else {
                                reject(MESSAGE.collectionFindNoData);
                            }
                        });
                    },
                    err => reject(err)
                )
        })
    }
}

module.exports = DataBase;