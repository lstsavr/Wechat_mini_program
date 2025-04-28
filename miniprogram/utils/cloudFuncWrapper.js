/**
 * 云函数调用封装
 * 用于简化云函数调用并处理通用错误
 */

/**
 * 调用云函数的封装
 * @param {string} name - 云函数名称
 * @param {object} data - 传递给云函数的参数
 * @param {object} options - 配置选项
 * @param {boolean} options.showLoading - 是否显示加载中提示，默认为true
 * @param {string} options.loadingText - 加载提示文本，默认为"加载中..."
 * @returns {Promise} - 返回Promise对象
 */
function callCloudFunction(name, data = {}, options = {}) {
  // 默认配置
  const defaultOptions = {
    showLoading: true,
    loadingText: '加载中...'
  };
  
  // 合并配置
  const mergedOptions = { ...defaultOptions, ...options };
  
  // 显示加载提示
  if (mergedOptions.showLoading) {
    wx.showLoading({
      title: mergedOptions.loadingText,
      mask: true
    });
  }
  
  // 调用云函数
  return wx.cloud.callFunction({
    name: name,
    data: data
  }).then(res => {
    // 隐藏加载提示
    if (mergedOptions.showLoading) {
      wx.hideLoading();
    }
    
    // 处理常见错误
    if (res.result && res.result.code && res.result.code !== 0) {
      // 如果服务端返回了错误码，则抛出错误
      const errMsg = res.result.message || '操作失败';
      wx.showToast({
        title: errMsg,
        icon: 'none',
        duration: 2000
      });
      return Promise.reject(new Error(errMsg));
    }
    
    return res.result;
  }).catch(err => {
    // 隐藏加载提示
    if (mergedOptions.showLoading) {
      wx.hideLoading();
    }
    
    // 显示错误提示
    wx.showToast({
      title: err.message || '操作失败，请重试',
      icon: 'none',
      duration: 2000
    });
    
    // 重新抛出错误，让调用方可以继续处理
    return Promise.reject(err);
  });
}

/**
 * 获取管理员订单列表
 * @param {object} data - 查询参数
 * @returns {Promise} - 返回Promise对象
 */
function getAdminOrders(data = {}) {
  return callCloudFunction('getAllOrders', {
    selectedStatus: data.status
  });
}

/**
 * 获取订单详情
 * @param {string} orderId - 订单ID
 * @returns {Promise} - 返回Promise对象
 */
function getOrderDetail(orderId) {
  return callCloudFunction('getOrderDetail', { orderId });
}

/**
 * 管理员取消订单
 * @param {string} orderId - 订单ID
 * @returns {Promise} - 返回Promise对象
 */
function cancelOrderByAdmin(orderId) {
  return callCloudFunction('cancelOrderByAdmin', { orderId });
}

/**
 * 更新订单状态
 * @param {string} orderId - 订单ID
 * @param {string} status - 新状态
 * @returns {Promise} - 返回Promise对象
 */
function updateOrderStatus(orderId, status) {
  return callCloudFunction('updateOrderStatus', {
    orderId: orderId,
    newStatus: status
  }, '更新订单状态失败');
}

// 导出函数
module.exports = {
  callCloudFunction,
  getAdminOrders,
  getOrderDetail,
  cancelOrderByAdmin,
  updateOrderStatus
}; 