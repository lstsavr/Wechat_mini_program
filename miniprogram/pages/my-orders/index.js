// 我的订单页面
const util = require('../../utils/util.js');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    orders: [],
    isLoading: true,
    hasError: false,
    errorMsg: '',
    isEmpty: false,
    
    // 订单状态映射
    statusMap: {
      'pending': '预约成功',
      'reserved': '已预约',
      'pending_payment': '待付款',
      'paid': '已付款',
      'completed': '已完成',
      'cancelled': '已取消'
    },
    
    // 相机名称到图片路径的映射
    cameraImageMap: {
      '佳能a420': '/images/cameras/canon_a420.jpg',
      '佳能IXUS 50': '/images/cameras/canon_IXUS 50.png',
      '佳能ixus210': '/images/cameras/canon_ixus210.png',
      '佳能ixu 85': '/images/cameras/canon_ixu 85.jpg',
      '佳能IXUS A3000': '/images/cameras/canon_IXUS A3000.jpg',
      '佳能IXUS 95': '/images/cameras/canon_IXUS 95.jpg'
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.loadOrders();
  },
  
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    this.loadOrders();
  },
  
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 每次页面显示时重新加载订单，保证数据最新
    this.loadOrders();
  },
  
  /**
   * 加载订单列表
   */
  loadOrders: function () {
    this.setData({
      isLoading: true,
      hasError: false,
      errorMsg: ''
    });
    
    // 调用云函数获取订单列表
    wx.cloud.callFunction({
      name: 'getMyOrders',
      data: {
        status: 'all' // 默认获取所有状态的订单
      },
      success: res => {
        console.log('订单列表获取成功', res);
        let orders = res.result.data || [];
        
        // 处理订单数据，设置正确的相机图片路径和格式化时间
        orders = orders.map(order => {
          // 格式化创建时间
          if (order.createTime) {
            order.createTimeFormatted = util.formatDate(order.createTime);
          }
          
          // 使用订单中的imageUrl字段作为图片地址
          if (order.imageUrl) {
            order.cameraImage = order.imageUrl;
          } else {
            order.cameraImage = '/images/default-goods-image.png';
          }
          
          return order;
        });
        
        this.setData({
          orders: orders,
          isLoading: false,
          isEmpty: orders.length === 0
        });
      },
      fail: err => {
        console.error('获取订单列表失败', err);
        this.setData({
          isLoading: false,
          hasError: true,
          errorMsg: '获取订单失败，请重试'
        });
        
        wx.showToast({
          title: '获取订单失败，请重试',
          icon: 'none'
        });
      },
      complete: () => {
        wx.stopPullDownRefresh();
      }
    });
  },
  
  /**
   * 格式化日期范围显示
   */
  formatDateRange: function (startDate, endDate) {
    if (!startDate || !endDate) {
      return '';
    }
    return `${startDate} 至 ${endDate}`;
  },
  
  /**
   * 跳转到订单详情页
   */
  goToOrderDetail: function (e) {
    const orderId = e.currentTarget.dataset.id;
    if (orderId) {
      wx.navigateTo({
        url: `/pages/order-detail/index?id=${orderId}`,
        fail: (err) => {
          console.error('跳转订单详情页失败', err);
          wx.showToast({
            title: '页面跳转失败',
            icon: 'none'
          });
        }
      });
    }
  },

  /**
   * 返回上一页
   */
  navigateBack: function() {
    wx.navigateBack();
  }
}); 