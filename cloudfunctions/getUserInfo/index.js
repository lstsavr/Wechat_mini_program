// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: "cloud1-1gxxqcpl824b3617"
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  if (!openid) {
    return {
      success: false,
      errMsg: '无法获取用户标识',
      code: 401
    }
  }
  
  try {
    // 1. 在users集合中查询用户是否已存在
    const userResult = await db.collection('users').where({
      _openid: openid
    }).get()
    
    // 2. 用户不存在则创建新用户
    if (userResult.data.length === 0) {
      // 提取前端传递的用户信息（如有）
      const { nickname, avatarUrl } = event
      
      // 构建用户数据
      const userData = {
        _openid: openid,
        nickname: nickname || '',
        avatarUrl: avatarUrl || '',
        role: 'user', // 默认为普通用户
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      }
      
      // 创建新用户
      const newUserResult = await db.collection('users').add({
        data: userData
      })
      
      // 返回创建的用户信息
      return {
        success: true,
        code: 200,
        message: '用户注册成功',
        data: {
          ...userData,
          _id: newUserResult._id
        },
        isNewUser: true
      }
    }
    
    // 3. 用户已存在，返回用户信息
    return {
      success: true,
      code: 200,
      message: '获取用户信息成功',
      data: userResult.data[0],
      isNewUser: false
    }
    
  } catch (err) {
    console.error('获取用户信息失败', err)
    return {
      success: false,
      code: 500,
      errMsg: err.message || '获取用户信息失败'
    }
  }
} 