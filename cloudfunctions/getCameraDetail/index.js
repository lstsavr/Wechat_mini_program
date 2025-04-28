// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  // 参数检查
  if (!event.id) {
    return {
      success: false,
      errMsg: '相机ID不能为空'
    }
  }

  try {
    // 从cameras集合中查询指定ID的相机数据
    const cameraRes = await db.collection('cameras').doc(event.id).get()
    
    // 检查是否成功获取数据
    if (!cameraRes || !cameraRes.data) {
      return {
        success: false,
        errMsg: '未找到相机数据'
      }
    }
    
    // 处理相机数据，确保基本字段存在
    const cameraData = cameraRes.data
    
    // 确保价格规则字段存在
    if (!cameraData.priceRules) {
      cameraData.priceRules = {
        shortTerm: cameraData.price || 0,
        threeDays: 0,
        fiveDays: 0
      }
    }
    
    // 确保desc字段存在（兼容description字段）
    if (!cameraData.desc && cameraData.description) {
      cameraData.desc = cameraData.description
    }
    
    // 返回相机数据
    return {
      success: true,
      data: cameraData
    }
  } catch (err) {
    console.error('查询相机详情失败', err)
    
    // 根据错误类型返回不同提示
    if (err.errCode === -1) {
      return {
        success: false,
        errMsg: '该相机不存在或已下架'
      }
    }
    
    return {
      success: false,
      errMsg: '查询失败，请稍后重试',
      error: err
    }
  }
} 