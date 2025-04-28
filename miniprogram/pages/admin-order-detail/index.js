// 管理员订单详情页面
Page({
  /**
   * 页面的初始数据
   */
  data: {
    orderId: '',
    order: null,
    isLoading: true,
    hasError: false,
    errorMsg: '',
    isUpdating: false,
    
    // 状态选择器数据
    statusOptions: [
      { value: 'reserved', label: '已预约' },
      { value: 'pending_payment', label: '待付款' },
      { value: 'paid', label: '已付款' },
      { value: 'completed', label: '已完成' },
      { value: 'cancelled', label: '已取消' }
    ],
    
    // 当前选中的状态
    newStatus: '',
    
    // 订单状态映射
    statusMap: {
      'reserved': '已预约',
      'pending_payment': '待付款',
      'paid': '已付款',
      'completed': '已完成',
      'cancelled': '已取消'
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 1. 从options中获取orderId参数
    if (options && options.id) {
      this.setData({
        orderId: options.id
      });
      
      // 加载订单详情
      this.loadOrderDetail(options.id);
    } else {
      this.setData({
        isLoading: false,
        hasError: true,
        errorMsg: '订单ID不能为空'
      });
      
      wx.showToast({
        title: '订单ID不能为空',
        icon: 'none'
      });
      
      // 2秒后返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 2000);
    }
  },
  
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    if (this.data.orderId) {
      this.loadOrderDetail(this.data.orderId);
    } else {
      wx.stopPullDownRefresh();
    }
  },
  
  /**
   * 加载订单详情
   */
  loadOrderDetail: function (orderId) {
    this.setData({
      isLoading: true,
      hasError: false,
      errorMsg: ''
    });
    
    // 调用云函数获取订单详情
    wx.cloud.callFunction({
      name: 'getOrderDetail',
      data: {
        orderId: orderId
      },
      success: res => {
        if (res.result && res.result.success && res.result.data) {
          const orderData = res.result.data;
          
          // 处理 createTime 格式
          if (orderData.createTime) {
            if (typeof orderData.createTime === 'string') {
              try {
                const date = new Date(orderData.createTime);
                orderData.createTimeFormatted = this.formatDate(date);
              } catch (e) {
                orderData.createTimeFormatted = orderData.createTime;
              }
            } else if (orderData.createTime.constructor === Object && orderData.createTime.$date) {
              // 处理云数据库日期格式
              orderData.createTimeFormatted = this.formatDate(new Date(orderData.createTime.$date));
            }
          }
          
          // 找到当前状态在选项中的索引
          const statusIndex = this.data.statusOptions.findIndex(
            option => option.value === orderData.status
          );
          
          this.setData({
            order: orderData,
            isLoading: false,
            statusIndex: statusIndex >= 0 ? statusIndex : 0,
            newStatus: orderData.status
          });
        } else {
          this.setData({
            isLoading: false,
            hasError: true,
            errorMsg: res.result?.errMsg || '获取订单详情失败'
          });
        }
      },
      fail: err => {
        console.error('获取订单详情失败', err);
        this.setData({
          isLoading: false,
          hasError: true,
          errorMsg: '获取订单详情失败，请重试'
        });
        
        wx.showToast({
          title: '获取订单详情失败，请重试',
          icon: 'none'
        });
      },
      complete: () => {
        wx.stopPullDownRefresh();
      }
    });
  },
  
  /**
   * 状态选择器改变
   */
  onStatusChange: function(e) {
    const index = e.detail.value;
    const newStatus = this.data.statusOptions[index].value;
    
    this.setData({
      statusIndex: index,
      newStatus: newStatus
    });
  },
  
  /**
   * 更新订单状态
   */
  updateOrderStatus: function() {
    const { orderId, newStatus, order } = this.data;
    
    // 校验
    if (!orderId) {
      wx.showToast({
        title: '订单ID不能为空',
        icon: 'none'
      });
      return;
    }
    
    // 如果新状态与当前状态相同，不做操作
    if (newStatus === order.status) {
      return;
    }
    
    // 显示加载状态
    this.setData({
      isUpdating: true
    });
    
    // 调用云函数
    wx.cloud.callFunction({
      name: 'updateOrderStatus',
      data: {
        orderId: orderId,
        newStatus: newStatus
      },
      success: res => {
        if (res.result && res.result.success) {
          wx.showToast({
            title: '状态已更新',
            icon: 'success'
          });
          
          // 更新本地数据
          const newOrder = { ...this.data.order, status: newStatus };
          this.setData({
            order: newOrder
          });
          
          // 延迟返回上一页
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        } else {
          wx.showToast({
            title: res.result?.errMsg || '更新状态失败',
            icon: 'none'
          });
        }
      },
      fail: err => {
        console.error('更新状态失败', err);
        wx.showToast({
          title: '更新状态失败，请重试',
          icon: 'none'
        });
      },
      complete: () => {
        this.setData({
          isUpdating: false
        });
      }
    });
  },
  
  /**
   * 显示取消订单确认框
   */
  showCancelConfirm: function() {
    const { orderId, order } = this.data;
    
    // 如果订单已经是取消状态，不做操作
    if (order.status === 'cancelled') {
      return;
    }
    
    wx.showModal({
      title: '取消订单',
      content: '确定要取消该订单吗？此操作不可恢复。',
      confirmColor: '#f5222d',
      success: (res) => {
        if (res.confirm) {
          this.cancelOrder();
        }
      }
    });
  },
  
  /**
   * 取消订单
   */
  cancelOrder: function() {
    const { orderId } = this.data;
    
    // 校验
    if (!orderId) {
      wx.showToast({
        title: '订单ID不能为空',
        icon: 'none'
      });
      return;
    }
    
    // 显示加载状态
    this.setData({
      isUpdating: true
    });
    
    // 调用云函数
    wx.cloud.callFunction({
      name: 'cancelOrderByAdmin',
      data: {
        orderId: orderId
      },
      success: res => {
        if (res.result && res.result.success) {
          wx.showToast({
            title: '订单已成功取消',
            icon: 'success'
          });
          
          // 更新本地数据
          const newOrder = { ...this.data.order, status: 'cancelled' };
          this.setData({
            order: newOrder,
            statusIndex: 3, // 取消状态的索引
            newStatus: 'cancelled'
          });
          
          // 延迟返回上一页
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        } else {
          wx.showToast({
            title: res.result?.errMsg || '取消订单失败',
            icon: 'none'
          });
        }
      },
      fail: err => {
        console.error('取消订单失败', err);
        wx.showToast({
          title: '取消订单失败，请重试',
          icon: 'none'
        });
      },
      complete: () => {
        this.setData({
          isUpdating: false
        });
      }
    });
  },
  
  /**
   * 格式化日期
   */
  formatDate: function(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    
    return `${year}-${month}-${day} ${hour}:${minute}`;
  },
  
  /**
   * 返回上一页
   */
  navigateBack: function() {
    wx.navigateBack();
  }
}); 