// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const camerasCollection = db.collection('cameras')

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  try {
    // 清空原有数据
    const deleteResult = await camerasCollection.where({
      _id: db.command.exists(true)
    }).remove()
    
    console.log('删除现有数据', deleteResult)
    
    // 添加相机数据
    const addResult = await camerasCollection.add({
      data: [
        {
          _id: 'a420',
          name: '佳能a420',
          description: '性能稳定，适合初学者使用',
          price: 25,
          imageUrl: '/images/cameras/canon_a420.jpg',
          brand: '佳能',
          priceRules: {
            shortTerm: 25,
            threeDays: 20,
            fiveDays: 18
          }
        },
        {
          _id: '50',
          name: '佳能IXUS 50',
          description: '轻便小巧，适合街拍',
          price: 25,
          imageUrl: '/images/cameras/canon_IXUS_50.png',
          brand: '佳能',
          priceRules: {
            shortTerm: 25,
            threeDays: 20,
            fiveDays: 18
          }
        },
        {
          _id: '95',
          name: '佳能IXUS 95',
          description: '高端专业相机，成像清晰',
          price: 30,
          imageUrl: '/images/cameras/canon_IXUS_95.jpg',
          brand: '佳能',
          priceRules: {
            shortTerm: 30,
            threeDays: 25,
            fiveDays: 22
          }
        },
        {
          _id: '85',
          name: '佳能ixu 85',
          description: '携带方便，操作简单',
          price: 25,
          imageUrl: '/images/cameras/canon_ixu_85.jpg',
          brand: '佳能',
          priceRules: {
            shortTerm: 25,
            threeDays: 20,
            fiveDays: 18
          }
        },
        {
          _id: 'a3000',
          name: '佳能IXUS A3000',
          description: '专业摄影，高清成像',
          price: 35,
          imageUrl: '/images/cameras/canon_IXUS_A3000.jpg',
          brand: '佳能',
          priceRules: {
            shortTerm: 35,
            threeDays: 30,
            fiveDays: 25
          }
        },
        {
          _id: '210',
          name: '佳能ixus210',
          description: '大广角，适合风景拍摄',
          price: 28,
          imageUrl: '/images/cameras/canon_ixus210.png',
          brand: '佳能',
          priceRules: {
            shortTerm: 28,
            threeDays: 23,
            fiveDays: 20
          }
        }
      ]
    })
    
    return {
      code: 0,
      message: '初始化相机数据成功',
      total: addResult.data.length
    }
  } catch (err) {
    console.error('初始化相机数据失败', err)
    return {
      code: 1,
      message: '初始化相机数据失败: ' + err.message
    }
  }
} 