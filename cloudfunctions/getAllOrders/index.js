// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: "cloud1-1gxxqcpl824b3617"
})

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  // 获取参数：状态筛选、分页
  const { selectedStatus, limit = 10, skip = 0 } = event
  
  try {
    let query = {}
    
    // 如果传入了状态参数且不为"全部"，添加状态筛选条件
    if (selectedStatus && selectedStatus !== 'all') {
      query.status = selectedStatus
    }
    
    // 查询总数（用于分页）
    const countResult = await db.collection('orders')
      .where(query)
      .count()
    
    const total = countResult.total
    
    // 查询订单列表
    const orders = await db.collection('orders')
      .where(query)
      .orderBy('createTime', 'desc')
      .skip(skip)
      .limit(limit)
      .get()
    
    return {
      code: 0,
      message: '获取订单列表成功',
      data: orders.data,
      total: total
    }
  } catch (error) {
    console.error('获取订单列表失败：', error)
    return {
      code: -1,
      message: '获取订单列表失败',
      data: null,
      error
    }
  }
} 