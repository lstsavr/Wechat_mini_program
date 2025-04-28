// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const usersCollection = db.collection('users')

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  // 从event中获取传入的参数
  const { nickname = "", avatarUrl = "" } = event
  
  if (!openid) {
    return {
      success: false,
      code: 401,
      message: '获取用户openid失败',
      data: null
    }
  }
  
  try {
    // 查询用户是否已存在
    const userResult = await usersCollection.where({
      openid: openid
    }).get()
    
    // 用户已存在，返回用户信息
    if (userResult.data && userResult.data.length > 0) {
      const userData = userResult.data[0]
      console.log('用户已存在，返回用户信息')
      return {
        success: true,
        code: 200,
        message: '用户已存在',
        data: {
          isNewUser: false,
          userInfo: userData
        }
      }
    }
    
    // 用户不存在，创建新用户
    const newUser = {
      openid: openid,
      nickname: nickname,
      avatarUrl: avatarUrl,
      role: "user",
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    }
    
    const addResult = await usersCollection.add({
      data: newUser
    })
    
    // 查询新创建的用户完整信息
    const newUserData = await usersCollection.doc(addResult._id).get()
    
    console.log('创建新用户成功', addResult)
    
    return {
      success: true,
      code: 200,
      message: '新用户创建成功',
      data: {
        isNewUser: true,
        userInfo: newUserData.data
      }
    }
  } catch (error) {
    console.error('用户注册/登录失败', error)
    return {
      success: false,
      code: 500,
      message: '用户注册/登录失败: ' + error.message,
      data: null,
      error: error
    }
  }
} 