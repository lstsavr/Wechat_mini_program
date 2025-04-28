// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: "cloud1-1gxxqcpl824b3617"
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  // 获取用户上下文
  const wxContext = cloud.getWXContext()
  const openId = wxContext.OPENID
  
  try {
    // 1. 获取参数 orderId
    const { orderId } = event
    
    if (!orderId) {
      return {
        success: false,
        errMsg: '订单ID不能为空',
        data: null
      }
    }
    
    // 2. 查询订单数据
    const orderResult = await db.collection('orders')
      .doc(orderId)
      .get()
    
    if (!orderResult || !orderResult.data) {
      return {
        success: false,
        errMsg: '未找到该订单',
        data: null
      }
    }
    
    // 3. 权限校验：检查用户是否为管理员或订单所有者
    // 3.1 查询用户角色
    const userResult = await db.collection('users')
      .where({
        _openid: openId
      })
      .get()
      
    const isAdmin = userResult.data.length > 0 && userResult.data[0].role === 'admin'
    const isOrderOwner = orderResult.data._openid === openId
    
    // 3.2 如果既不是管理员也不是订单所有者，则拒绝访问
    if (!isAdmin && !isOrderOwner) {
      return {
        success: false,
        errMsg: '无权查看此订单',
        data: null
      }
    }
    
    // 4. 返回订单详情
    return {
      success: true,
      data: orderResult.data
    }
    
  } catch (err) {
    console.error('获取订单详情失败', err)
    return {
      success: false,
      errMsg: err.message || '获取订单详情失败',
      data: null
    }
  }
} 