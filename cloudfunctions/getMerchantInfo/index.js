// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: "cloud1-1gxxqcpl824b3617"
})

const db = cloud.database()
const merchantInfoCollection = db.collection('merchant-info')

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  // 商户获取自己的信息
  if (event.self) {
    const openid = wxContext.OPENID
    
    if (!openid) {
      return {
        success: false,
        errMsg: '无法获取用户身份标识'
      }
    }
    
    try {
      const queryResult = await merchantInfoCollection.where({
        _openid: openid
      }).get()
      
      if (queryResult.data && queryResult.data.length > 0) {
        return {
          success: true,
          data: queryResult.data[0]
        }
      } else {
        return {
          success: true,
          data: null,
          message: '未找到商户信息'
        }
      }
    } catch (error) {
      console.error('获取商户信息失败:', error)
      return {
        success: false,
        errMsg: '获取商户信息失败，请重试'
      }
    }
  } 
  // 用户获取商户信息
  else {
    try {
      // 获取第一条商户信息（假设系统只有一个商户）
      const queryResult = await merchantInfoCollection.limit(1).get()
      
      if (queryResult.data && queryResult.data.length > 0) {
        // 返回商户信息，但不返回openid
        const { _openid, ...merchantInfo } = queryResult.data[0]
        return {
          success: true,
          data: merchantInfo
        }
      } else {
        return {
          success: true,
          data: null,
          message: '未找到商户信息'
        }
      }
    } catch (error) {
      console.error('获取商户信息失败:', error)
      return {
        success: false,
        errMsg: '获取商户信息失败，请重试'
      }
    }
  }
} 