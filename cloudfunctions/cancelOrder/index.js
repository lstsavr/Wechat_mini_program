// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: "cloud1-1gxxqcpl824b3617"
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  // 获取微信上下文
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
    // 1. 先查询订单是否存在且属于当前用户
    const orderResult = await db.collection('orders').doc(orderId).get()
    
    if (!orderResult || !orderResult.data) {
      return {
        success: false,
        errMsg: '订单不存在'
      }
    }
    
    const order = orderResult.data
    
    // 2. 检查订单状态，只有在reserved、待付款或预约成功状态的订单才能取消
    if (order.status !== 'reserved' && order.status !== 'pending_payment' && order.status !== 'pending') {
      return {
        success: false,
        errMsg: '只有已预约、待付款或预约成功的订单可以取消'
      }
    }
    
    // 3. 检查订单是否属于当前用户
    if (order._openid && order._openid !== wxContext.OPENID) {
      return {
        success: false,
        errMsg: '无权操作此订单'
      }
    }
    
    // 4. 更新订单状态为已取消
    const updateResult = await db.collection('orders').doc(orderId).update({
      data: {
        status: 'cancelled',
        cancelTime: db.serverDate() // 记录取消时间
      }
    })
    
    // 5. 返回结果
    if (updateResult.stats.updated > 0) {
      return {
        success: true,
        message: '订单已成功取消'
      }
    } else {
      return {
        success: false,
        errMsg: '取消预约失败'
      }
    }
    
  } catch (err) {
    console.error('取消预约失败', err)
    return {
      success: false,
      errMsg: err.message || '取消预约失败'
    }
  }
} 