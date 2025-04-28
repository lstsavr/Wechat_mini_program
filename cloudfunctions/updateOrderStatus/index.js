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
  const { orderId, newStatus } = event
  
  // 校验参数
  if (!orderId) {
    return {
      success: false,
      errMsg: '订单ID不能为空'
    }
  }
  
  if (!newStatus) {
    return {
      success: false,
      errMsg: '新状态不能为空'
    }
  }
  
  // 检查状态是否有效
  const validStatuses = ['reserved', 'pending_payment', 'paid', 'completed', 'cancelled']
  if (!validStatuses.includes(newStatus)) {
    return {
      success: false,
      errMsg: '无效的订单状态'
    }
  }
  
  try {
    // 更新订单状态
    const updateResult = await db.collection('orders').doc(orderId).update({
      data: {
        status: newStatus,
        updateTime: db.serverDate() // 记录更新时间
      }
    })
    
    // 判断更新结果
    if (updateResult.stats.updated > 0) {
      return {
        success: true,
        message: '订单状态已更新'
      }
    } else {
      return {
        success: false,
        errMsg: '订单状态更新失败，可能订单不存在'
      }
    }
  } catch (err) {
    console.error('更新订单状态失败', err)
    return {
      success: false,
      errMsg: err.message || '更新订单状态失败'
    }
  }
} 