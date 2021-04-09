let Tool = {
    strage: {
        // 校验用户名
        username(str) {
            if (!/^[\u4E00-\u9FA5\w]{2,8}$/.test(str)) {
                return '用户名是2-8位的中文字母数字下划线'
            }
        },
        // 校验密码
        password(str) {
            if (!/^[a-zA-Z]\w{5,12}$/.test(str)) {
                return '密码是6-13位以字母开头'
            }
        },
        // 确认密码
        repeat(newstr, oldstr) {
            if(newstr !== oldstr) {
                return '两次输入的密码不一致'
            }
        }
    }
}