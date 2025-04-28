// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: "cloud1-1gxxqcpl824b3617"
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  try {
    // 尝试创建集合（如果已存在会报错，但可以忽略）
    try {
      await db.createCollection('merchant-info')
      console.log('集合创建成功')
    } catch (err) {
      console.log('集合已存在:', err.message)
    }
    
    // 查询是否已有数据
    const countResult = await db.collection('merchant-info').count()
    
    // 如果没有数据，添加初始数据
    if (countResult.total === 0) {
      const result = await db.collection('merchant-info').add({
        data: {
          shopName: '相机租赁商店',
          phone: '13800138000',
          address: '北京市朝阳区XX路XX号',
          description: '我们提供专业的相机租赁服务，包括各种高端相机设备和镜头。无论您是专业摄影师还是摄影爱好者，都能在这里找到适合的设备。',
          businessHours: '周一至周日 9:00-21:00',
          wechat: 'camera_rental',
          _openid: wxContext.OPENID,
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      })
      
      return {
        success: true,
        message: '初始数据创建成功',
        data: result
      }
    } else {
      return {
        success: true,
        message: '集合中已有数据，无需创建初始数据',
        count: countResult.total
      }
    }
  } catch (error) {
    console.error('初始化商户信息失败:', error)
    return {
      success: false,
      errMsg: '初始化失败: ' + error.message
    }
  }
} 