// 云函数入口文件
const cloud = require('wx-server-sdk')

// 确保明确指定环境ID
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV  // 使用动态环境ID，自动适配当前环境
})

const db = cloud.database()
// 确保集合名称正确
const merchantInfoCollection = db.collection('merchant-info')
const usersCollection = db.collection('users')

// 云函数入口函数
exports.main = async (event, context) => {
  // 打印请求参数，便于调试
  console.log('接收到的请求参数:', event)
  
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  if (!openid) {
    return {
      success: false,
      errMsg: '无法获取用户身份标识'
    }
  }
  
  // 1. 管理员身份校验 - 查询用户角色
  try {
    // 添加临时调试标记，如果传入isTest=true则跳过权限校验
    if (event.isTest === true) {
      console.log('测试模式：跳过权限校验')
    } else {
      console.log('开始检查用户权限, openid:', openid)
      const userResult = await usersCollection.where({
        _openid: openid
      }).get()
      
      console.log('用户查询结果:', userResult)
      
      // 检查用户是否存在且角色是否为管理员
      if (!userResult.data || userResult.data.length === 0) {
        console.log('未找到用户信息')
        return {
          success: false,
          errMsg: '权限校验失败：未找到用户信息'
        }
      }
      
      const userInfo = userResult.data[0]
      console.log('用户信息:', userInfo)
      
      // 检查用户角色是否为admin
      if (userInfo.role !== 'admin') {
        console.log('用户非管理员，拒绝操作')
        return {
          success: false,
          errMsg: '权限校验失败：仅管理员可修改商户信息'
        }
      }
      
      console.log('权限校验通过，用户为管理员')
    }
  } catch (authError) {
    console.error('权限校验失败:', authError)
    return {
      success: false,
      errMsg: `权限校验失败: ${authError.message || authError.errMsg || '未知错误'}`
    }
  }
  
  // 管理员权限校验通过，继续执行保存/更新逻辑
  
  // 获取参数，支持多种参数传递方式
  let formData = {}
  
  // 打印事件对象的完整结构，便于调试
  console.log('完整事件对象:', JSON.stringify(event))
  
  // 优先检查merchantData格式
  if (event.merchantData) {
    formData = event.merchantData;
    console.log('从event.merchantData获取数据');
  }
  // 尝试从多种可能的位置获取表单数据
  else if (event.formData) {
    formData = event.formData
    console.log('从event.formData获取数据')
  } else if (event.data && event.data.formData) {
    formData = event.data.formData
    console.log('从event.data.formData获取数据')
  } else {
    formData = event // 直接使用event作为表单数据
    console.log('直接使用event作为表单数据')
  }
  
  console.log('解析后的表单数据:', JSON.stringify(formData))
  
  // 如果formData不是对象或为null，返回错误
  if (!formData || typeof formData !== 'object') {
    console.error('表单数据无效:', formData)
    return {
      success: false,
      errMsg: '表单数据无效'
    }
  }
  
  // 直接输出phone字段，看是否存在
  console.log('手机号字段(formData中):', formData.phone)
  
  // 解构表单数据，支持新的字段结构
  const shopName = (formData.shopName !== undefined) ? String(formData.shopName) : ''
  const phone = (formData.phone !== undefined) ? String(formData.phone) : ''
  const address = (formData.address !== undefined) ? String(formData.address) : ''
  const description = (formData.description !== undefined) ? String(formData.description) : ''
  const storeDescription = (formData.storeDescription !== undefined) ? String(formData.storeDescription) : ''
  const businessHours = (formData.businessHours !== undefined) ? String(formData.businessHours) : ''
  
  console.log('最终使用的手机号:', phone)
  
  console.log('解析的表单字段:', { 
    shopName, 
    phone, 
    address, 
    description,
    storeDescription,
    businessHours 
  })
  
  // 参数校验
  if (!shopName || shopName.trim() === '') {
    console.error('店铺名称验证失败:', shopName)
    return {
      success: false,
      errMsg: '店铺名称不能为空'
    }
  }

  // 输出手机号的类型和值，用于调试
  console.log('手机号类型:', typeof phone, '手机号值:', phone, '手机号长度:', String(phone).length)
  
  // 先转换为字符串，再进行验证 - 严格判断
  const phoneStr = String(phone).trim()
  
  // 专门处理可能的数值类型
  if (typeof phone === 'number') {
    console.log('手机号是数值类型，转换为字符串:', phoneStr)
  }
  
  if (!phoneStr) {
    console.error('手机号为空字符串')
    return {
      success: false,
      errMsg: '手机号不能为空'
    }
  }
  
  // 增加额外检查，如果长度不对也报错
  if (phoneStr.length !== 11) {
    console.error('手机号长度不是11位:', phoneStr, '长度:', phoneStr.length)
    return {
      success: false,
      errMsg: '手机号必须是11位'
    }
  }
  
  // 手机号格式校验
  if (!/^1\d{10}$/.test(phoneStr)) {
    console.error('手机号格式验证失败:', phoneStr)
    return {
      success: false,
      errMsg: '请输入有效的11位手机号码'
    }
  }

  if (!address || typeof address !== 'string' || address.trim() === '') {
    console.error('地址验证失败:', address)
    return {
      success: false,
      errMsg: '店铺地址不能为空'
    }
  }
  
  // 检查租赁规则是否为空
  if (!description || typeof description !== 'string' || description.trim() === '') {
    console.error('租赁规则验证失败:', description)
    return {
      success: false,
      errMsg: '租赁规则不能为空'
    }
  }
  
  try {
    // 先检查集合是否存在
    try {
      await db.createCollection('merchant-info')
      console.log('集合创建成功')
    } catch (err) {
      // 如果集合已存在，会抛出错误，可以忽略
      console.log('集合已存在或创建失败:', err.message)
    }
    
    // 查询是否已有记录 - 注意这里修改查询方式，不限定openid
    // 因为管理员在修改商户信息时，openid可能与记录中的不同
    const queryResult = await merchantInfoCollection.limit(1).get()
    
    console.log('查询结果:', queryResult)
    
    const now = db.serverDate()
    let result
    
    if (queryResult.data && queryResult.data.length > 0) {
      // 更新已有记录
      const recordId = queryResult.data[0]._id
      console.log('更新记录:', recordId)
      
      try {
        result = await merchantInfoCollection.doc(recordId).update({
          data: {
            shopName,
            phone: phoneStr,
            address,
            description,
            storeDescription,
            businessHours,
            updateTime: now
          }
        })
        console.log('更新结果:', result)
      } catch (updateErr) {
        console.error('更新记录失败:', updateErr)
        return {
          success: false,
          errMsg: `更新记录失败: ${updateErr.message || updateErr.errMsg || '未知错误'}`
        }
      }
    } else {
      // 创建新记录
      console.log('创建新记录')
      try {
        result = await merchantInfoCollection.add({
          data: {
            shopName,
            phone: phoneStr,
            address,
            description,
            storeDescription,
            businessHours,
            _openid: openid,
            createTime: now,
            updateTime: now
          }
        })
        console.log('创建结果:', result)
      } catch (addErr) {
        console.error('创建记录失败:', addErr)
        return {
          success: false,
          errMsg: `创建记录失败: ${addErr.message || addErr.errMsg || '未知错误'}`
        }
      }
    }
    
    // 处理结果
    return {
      success: true,
      data: result
    }
    
  } catch (err) {
    console.error('保存商户信息失败:', err)
    return {
      success: false,
      errMsg: `保存商户信息失败: ${err.message || err.errMsg || '未知错误'}`
    }
  }
} 