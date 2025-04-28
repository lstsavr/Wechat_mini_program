// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command
const $ = db.command.aggregate

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  // 获取参数
  const { cameraId } = event
  
  if (!cameraId) {
    return {
      success: false,
      errMsg: '缺少相机ID参数'
    }
  }
  
  try {
    // 1. 获取相机的库存信息
    const cameraResult = await db.collection('cameras').doc(cameraId).get();
    if (!cameraResult || !cameraResult.data) {
      return {
        success: false,
        errMsg: '未找到相机信息'
      };
    }
    
    const cameraStock = cameraResult.data.stock || 0;
    console.log(`相机 ${cameraId} 的库存为 ${cameraStock}`);
    
    // 如果库存为0，则所有日期都不可用
    if (cameraStock <= 0) {
      return {
        success: true,
        unavailableDates: ['all'] // 特殊标记，表示所有日期都不可用
      };
    }
    
    // 2. 查询该相机的所有有效订单
    const orders = await db.collection('orders')
      .where({
        cameraId: cameraId,
        status: 'reserved', // 只查询有效的预约
      })
      .get();
    
    console.log(`找到 ${orders.data.length} 个有效预约`);
    
    // 3. 统计每个日期的预约数量
    const dateBookings = {}; // 存储每个日期的预约数量
    
    // 遍历所有订单，生成日期范围并计数
    orders.data.forEach(order => {
      const startDate = new Date(order.startDate);
      const endDate = new Date(order.endDate);
      
      // 生成从开始到结束的所有日期
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dateStr = formatDate(currentDate);
        
        // 初始化或增加该日期的预约计数
        dateBookings[dateStr] = (dateBookings[dateStr] || 0) + 1;
        
        // 移动到下一天
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });
    
    // 4. 找出预约数量大于等于库存的日期，这些日期不可用
    const unavailableDates = [];
    for (const date in dateBookings) {
      if (dateBookings[date] >= cameraStock) {
        unavailableDates.push(date);
      }
    }
    
    console.log(`找到 ${unavailableDates.length} 个不可用日期`);
    
    // 5. 返回不可用日期列表
    return {
      success: true,
      unavailableDates: unavailableDates
    };
    
  } catch (err) {
    console.error('获取不可用日期失败', err);
    return {
      success: false,
      errMsg: '获取不可用日期失败: ' + err.message
    };
  }
}

/**
 * 格式化日期为 YYYY-MM-DD 格式
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
} 