// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const camerasCollection = db.collection('cameras')
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  // 获取分页和搜索参数
  const limit = event.limit || 10
  const skip = event.skip || 0
  const brand = event.brand || null
  const keyword = event.keyword || null
  const sort = event.sort || null  // 排序方式: "asc" 或 "desc"
  
  try {
    // 构建查询条件
    const query = {
      status: "available"
    }
    
    // 如果指定了品牌且不是"全部"，则添加品牌筛选条件
    if (brand && brand !== '全部') {
      query.brand = brand
    }
    
    // 如果指定了关键词，则添加名称模糊搜索条件
    if (keyword && keyword.trim() !== '') {
      // 使用正则表达式实现模糊查询
      query.name = db.RegExp({
        regexp: keyword.trim(), // 需要匹配的正则表达式
        options: 'i', // 不区分大小写
      })
    }
    
    // 创建查询对象
    let dbQuery = camerasCollection.where(query)
    
    // 如果指定了排序方式，添加排序条件
    if (sort === 'asc' || sort === 'desc') {
      dbQuery = dbQuery.orderBy('priceRules.shortTerm', sort)
    }
    
    // 查询 cameras 集合中符合条件的相机，应用分页和排序
    const result = await dbQuery
      .skip(skip)
      .limit(limit)
      .field({
        _id: true,        // 包含 _id 字段
        name: true,       // 包含相机名称
        brand: true,      // 包含品牌
        imageUrl: true,   // 包含图片路径
        priceRules: true, // 包含价格规则
        description: true // 包含描述
      })
      .get()
    
    // 返回成功结果
    return {
      data: result.data,
      total: result.data.length
    }
  } catch (error) {
    // 发生错误时返回错误信息
    console.error('获取相机列表失败：', error)
    return {
      error: error.message || '获取相机列表失败',
      data: []
    }
  }
} 