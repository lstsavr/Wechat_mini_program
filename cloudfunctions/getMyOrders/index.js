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
  const openId = wxContext.OPENID
  
  if (!openId) {
    return {
      code: -1,
      message: '用户未登录',
      data: null
    }
  }

  // 状态筛选条件，如果不传则查询所有状态
  const { status } = event
  
  try {
    let query = {
      _openid: openId
    }
    
    // 如果传入了状态参数且不为空，添加状态筛选条件
    if (status && status !== 'all') {
      query.status = status
    }
    
    const orders = await db.collection('orders')
      .where(query)
      .orderBy('createTime', 'desc')
      .get()
    
    return {
      code: 0,
      message: '获取订单列表成功',
      data: orders.data
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