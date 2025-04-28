// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: "cloud1-1gxxqcpl824b3617"
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openId = wxContext.OPENID
  
  // 获取传入的商户信息
  const { merchantInfo } = event
  
  if (!merchantInfo) {
    return {
      success: false,
      errMsg: '商户信息不能为空'
    }
  }
  
  try {
    // 检查用户是否为管理员
    const userResult = await db.collection('users')
      .where({
        _openid: openId,
        role: 'admin'
      })
      .get()
    
    // 非管理员不能更新商户信息
    if (userResult.data.length === 0) {
      return {
        success: false,
        errMsg: '无权操作，仅管理员可更新商户信息'
      }
    }
    
    // 查询是否已存在商户信息
    const merchantInfoResult = await db.collection('merchant_info')
      .limit(1)
      .get()
    
    let updateResult
    
    // 如果已存在，则更新
    if (merchantInfoResult.data && merchantInfoResult.data.length > 0) {
      updateResult = await db.collection('merchant_info')
        .doc(merchantInfoResult.data[0]._id)
        .update({
          data: {
            phone: merchantInfo.phone,
            wechatId: merchantInfo.wechatId || '',
            email: merchantInfo.email || '',
            updateTime: db.serverDate()
          }
        })
      
      return {
        success: updateResult.stats.updated > 0,
        message: '商户信息已更新'
      }
    } 
    // 如果不存在，则添加
    else {
      updateResult = await db.collection('merchant_info').add({
        data: {
          phone: merchantInfo.phone,
          wechatId: merchantInfo.wechatId || '',
          email: merchantInfo.email || '',
          createdBy: openId,
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      })
      
      return {
        success: !!updateResult._id,
        message: '商户信息已创建'
      }
    }
  } catch (err) {
    console.error('更新商户信息失败', err)
    return {
      success: false,
      errMsg: err.message || '更新商户信息失败'
    }
  }
} 