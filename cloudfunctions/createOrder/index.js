// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: "cloud1-1gxxqcpl824b3617" // 使用确切的环境ID，避免动态环境问题
});

const db = cloud.database();
const _ = db.command;

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  
  if (!openid) {
    return {
      success: false,
      errMsg: '无法获取用户身份'
    };
  }
  
  // 1. 获取订单数据
  const orderData = event.orderData || {};
  
  try {
    // 新增：检查库存是否充足
    const cameraId = orderData.cameraId;
    const startDate = orderData.startDate;
    const endDate = orderData.endDate;
    
    if (!cameraId || !startDate || !endDate) {
      return {
        success: false,
        errMsg: '缺少必要的订单信息（相机ID或日期）'
      };
    }
    
    // 1.1 查询指定相机在选定时间段内已有的预约数量
    const reservedOrdersCountResult = await db.collection('orders')
      .where({
        cameraId: cameraId,
        status: 'reserved',
        startDate: _.lte(endDate),
        endDate: _.gte(startDate)
      })
      .count();
    
    const existingReserved = reservedOrdersCountResult.total || 0;
    console.log(`已有预约数量: ${existingReserved}`);
    
    // 1.2 获取相机的库存信息
    const cameraResult = await db.collection('cameras').doc(cameraId).get();
    
    if (!cameraResult || !cameraResult.data) {
      return {
        success: false,
        errMsg: '未找到相机信息'
      };
    }
    
    const cameraStock = cameraResult.data.stock || 0;
    console.log(`相机库存: ${cameraStock}`);
    
    // 1.3 判断库存是否充足
    if (existingReserved >= cameraStock) {
      return {
        success: false,
        errMsg: '该相机在所选时间段内已被约满，请选择其他时间或其他设备'
      };
    }
    
    // 库存充足，可以继续创建订单
    
    // 添加必要的字段
    orderData._openid = openid;
    orderData.createTime = db.serverDate();
    orderData.status = orderData.status || 'reserved'; // 默认为已预约状态，无需支付
    
    // 2. 创建订单
    console.log('创建订单数据:', orderData);
    const orderResult = await db.collection('orders').add({
      data: orderData
    });
    
    console.log('订单创建成功, 订单ID:', orderResult._id);
    
    // 3. 获取相机名称和图片URL用于订阅消息
    let cameraName = '';
    let imageUrl = orderData.imageUrl || ''; // 优先使用传入的imageUrl
    
    if (orderData.cameraId && (!cameraName || !imageUrl)) {
      try {
        // 已经在上面获取过相机信息，这里可以直接使用
        if (cameraResult.data) {
          cameraName = cameraName || cameraResult.data.name || '未知型号';
          
          // 如果订单中没有imageUrl，则从相机数据中获取
          if (!imageUrl && cameraResult.data.imageUrl) {
            imageUrl = cameraResult.data.imageUrl;
            
            // 更新订单的imageUrl字段
            await db.collection('orders').doc(orderResult._id).update({
              data: {
                imageUrl: imageUrl
              }
            });
          }
        }
      } catch (err) {
        console.error('获取相机信息失败:', err);
        cameraName = cameraName || '未知型号';
      }
    }
    
    // 4. 发送订阅消息给所有管理员
    if (event.templateId) {
      try {
        await sendOrderNotifications(
          orderResult._id, 
          orderData, 
          cameraName, 
          event.templateId
        );
      } catch (error) {
        console.error('发送订阅消息失败，但不影响订单创建:', error);
      }
    }
    
    // 5. 返回成功结果
    return {
      success: true,
      orderId: orderResult._id,
      message: '预约成功'
    };
  } catch (error) {
    console.error('创建订单失败:', error);
    return {
      success: false,
      errMsg: '创建预约失败: ' + error.message
    };
  }
};

/**
 * 发送订阅消息给所有管理员
 */
async function sendOrderNotifications(orderId, orderData, cameraName, templateId) {
  // 1. 查找所有管理员
  try {
    const adminUsers = await db.collection('users')
      .where({
        role: 'admin'
      })
      .get();
    
    if (!adminUsers.data || adminUsers.data.length === 0) {
      console.log('未找到管理员用户，无需发送订阅消息');
      return;
    }
    
    console.log(`找到 ${adminUsers.data.length} 个管理员用户，准备发送订阅消息`);
    
    // 2. 准备订阅消息数据
    const timeRange = `${orderData.startDate} 至 ${orderData.endDate}`;
    const note = orderData.note || '无备注';
    
    // 3. 逐个发送订阅消息
    const sendPromises = adminUsers.data.map(async (admin) => {
      const adminOpenid = admin._openid;
      if (!adminOpenid) {
        console.error('管理员缺少openid，无法发送订阅消息:', admin);
        return;
      }
      
      try {
        const result = await cloud.openapi.subscribeMessage.send({
          touser: adminOpenid,
          templateId: templateId,
          page: '/pages/admin-orders/index',
          miniprogramState: 'developer',
          data: {
            name7: {
              value: orderData.userName || '未提供姓名'
            },
            time5: {
              value: timeRange
            },
            thing4: {
              value: note.substring(0, 20) // 长度限制，截取前20个字符
            },
            thing11: {
              value: cameraName.substring(0, 20) // 长度限制，截取前20个字符
            },
            amount3: {
              value: orderData.totalPrice || 0
            }
          }
        });
        
        console.log(`成功发送订阅消息给管理员 ${adminOpenid}:`, result);
        return result;
      } catch (error) {
        console.error(`向管理员 ${adminOpenid} 发送订阅消息失败:`, error);
        return null;
      }
    });
    
    // 等待所有发送任务完成
    const results = await Promise.all(sendPromises);
    console.log('订阅消息发送完成:', results);
  } catch (error) {
    console.error('查询管理员或发送订阅消息失败:', error);
    throw error;
  }
} 