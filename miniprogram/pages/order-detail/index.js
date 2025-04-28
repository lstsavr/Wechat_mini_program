// 订单详情页面
const util = require('../../utils/util.js');

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
    
    // 商户信息
    merchantInfo: null,
    loadingMerchantInfo: false,
    
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
    // 1. 从options中获取orderId参数
    if (options && options.id) {
      this.setData({
        orderId: options.id
      });
      
      // 加载订单详情
      this.loadOrderDetail(options.id);
      
      // 加载商户信息
      this.loadMerchantInfo();
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
      this.loadMerchantInfo();
    } else {
      wx.stopPullDownRefresh();
    }
  },
  
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 如果已有订单ID，刷新数据确保最新状态
    if (this.data.orderId) {
      this.loadOrderDetail(this.data.orderId);
    }
  },
  
  /**
   * 加载商户信息
   */
  loadMerchantInfo: function() {
    this.setData({ loadingMerchantInfo: true });
    
    wx.cloud.callFunction({
      name: 'getMerchantInfo',
      data: {
        self: false // 表示用户获取商户信息，而非商户获取自己的信息
      },
      success: res => {
        console.log('获取商户信息成功', res);
        
        if (res.result && res.result.success) {
          this.setData({
            merchantInfo: res.result.data
          });
        }
      },
      fail: err => {
        console.error('获取商户信息失败', err);
      },
      complete: () => {
        this.setData({ loadingMerchantInfo: false });
      }
    });
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
          
          // 使用订单中的imageUrl字段
          if (orderData.imageUrl) {
            orderData.cameraImage = orderData.imageUrl;
          } else {
            orderData.cameraImage = '/images/default-goods-image.png';
          }
          
          // 使用工具函数格式化时间
          if (orderData.createTime) {
            orderData.createTimeFormatted = util.formatDate(orderData.createTime);
          }
          
          this.setData({
            order: orderData,
            isLoading: false
          });
        } else {
          this.setData({
            isLoading: false,
            hasError: true,
            errorMsg: res.result.errMsg || '获取订单详情失败'
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
   * 返回上一页
   */
  navigateBack: function() {
    wx.navigateBack();
  },
  
  /**
   * 取消订单
   */
  cancelOrder: function() {
    // 二次确认
    wx.showModal({
      title: '取消预约',
      content: '确定要取消该预约吗？',
      success: (res) => {
        if (res.confirm) {
          // 用户点击了确定
          this.doCancelOrder();
        }
      }
    });
  },
  
  /**
   * 执行取消订单操作
   */
  doCancelOrder: function() {
    if (!this.data.orderId) {
      wx.showToast({
        title: '订单ID不能为空',
        icon: 'none'
      });
      return;
    }
    
    // 显示加载状态
    wx.showLoading({
      title: '取消中...',
      mask: true
    });
    
    // 调用云函数
    wx.cloud.callFunction({
      name: 'cancelOrder',
      data: {
        orderId: this.data.orderId
      },
      success: (res) => {
        wx.hideLoading();
        
        if (res.result && res.result.success) {
          wx.showToast({
            title: '订单已成功取消',
            icon: 'success'
          });
          
          // 更新本地状态
          const order = this.data.order;
          order.status = 'cancelled';
          this.setData({
            order: order
          });
          
          // 延迟返回上一页
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        } else {
          wx.showToast({
            title: res.result.errMsg || '取消预约失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('取消预约失败', err);
        
        wx.showToast({
          title: '取消预约失败',
          icon: 'none'
        });
      }
    });
  }
}); 