// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  // 获取参数
  const { orderId } = event
  
  // 校验参数
  if (!orderId) {
    return {
      success: false,
      errMsg: '订单ID不能为空'
    }
  }
  
  try {
    // 查询订单是否存在
    const orderResult = await db.collection('orders').doc(orderId).get()
    
    if (!orderResult || !orderResult.data) {
      return {
        success: false,
        errMsg: '订单不存在'
      }
    }
    
    // 更新订单状态为已取消
    const updateResult = await db.collection('orders').doc(orderId).update({
      data: {
        status: 'cancelled',
        cancelTime: db.serverDate(), // 记录取消时间
        cancelBy: 'admin', // 记录是管理员取消的
        adminId: wxContext.OPENID // 记录管理员ID
      }
    })
    
    // 判断更新结果
    if (updateResult.stats.updated > 0) {
      return {
        success: true,
        message: '订单已成功取消'
      }
    } else {
      return {
        success: false,
        errMsg: '取消订单失败'
      }
    }
  } catch (err) {
    console.error('取消订单失败', err)
    return {
      success: false,
      errMsg: err.message || '取消订单失败'
    }
  }
} 