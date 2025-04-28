// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const { cameraId } = event
  
  if (!cameraId) {
    return {
      code: -1,
      message: '相机ID不能为空',
      data: null
    }
  }
  
  try {
    // 获取当前日期（不含时分秒）
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0] // 格式如: '2025-05-10'
    
    // 查询该相机所有状态为 pending_payment 或 paid 的订单，且结束日期大于等于今天
    const orders = await db.collection('orders')
      .where({
        cameraId: cameraId,
        status: _.in(['pending_payment', 'paid']),
        endDate: _.gte(todayStr) // 只显示未来预约（结束日期大于等于今天）
      })
      .orderBy('startDate', 'asc')
      .field({
        _id: true,
        startDate: true,
        endDate: true,
        status: true,
        userName: true
      })
      .get()
    
    return {
      code: 0,
      message: '获取预约时间成功',
      data: orders.data
    }
  } catch (error) {
    console.error('获取预约时间失败：', error)
    return {
      code: -1,
      message: '获取预约时间失败',
      data: null,
      error
    }
  }
} 