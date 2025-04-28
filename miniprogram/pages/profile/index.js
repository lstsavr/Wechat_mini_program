// 个人资料页面
const app = getApp()

Page({
  /**
   * 页面的初始数据
   */
  data: {
    userInfo: null,
    hasUserInfo: false,
    isAdmin: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 检查登录状态
    this.checkLoginStatus();
    
    // 检查管理员状态
    this.checkAdminStatus();
    
    // 如果app中有userInfoReadyCallback，监听用户信息更新
    if (app.userInfoReadyCallback === undefined) {
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res,
          hasUserInfo: true
        });
      };
    }
  },
  
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 每次页面显示时检查登录状态，确保数据最新
    this.checkLoginStatus();
    
    // 检查管理员状态
    this.checkAdminStatus();
  },

  /**
   * 检查是否为管理员
   */
  checkAdminStatus: function() {
    // 调用云函数获取用户信息
    wx.cloud.callFunction({
      name: 'getUserInfo',
      success: res => {
        console.log('获取用户信息成功', res.result);
        // 修复管理员判断逻辑
        if (res.result.success && res.result.data.role === 'admin') {
          this.setData({ isAdmin: true });
          console.log('当前用户是管理员');
        } else {
          this.setData({ isAdmin: false });
          console.log('当前用户不是管理员', res.result);
        }
      },
      fail: err => {
        console.error('获取用户信息失败', err);
        this.setData({ isAdmin: false });
      }
    });
  },

  /**
   * 检查用户是否已登录
   */
  checkLoginStatus: function () {
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      });
    } else {
      // 尝试从缓存或云端获取用户信息
      const userInfo = wx.getStorageSync('userInfo');
      if (userInfo) {
        app.globalData.userInfo = userInfo;
        this.setData({
          userInfo: userInfo,
          hasUserInfo: true
        });
      } else {
        // 缓存中没有用户信息，尝试从云端获取
        app.getUserInfoFromCloud();
        
        this.setData({
          userInfo: null,
          hasUserInfo: false
        });
      }
    }
  },
  
  /**
   * 跳转到我的订单页面
   */
  goToMyOrders: function () {
    if (!this.data.hasUserInfo) {
      // 如果未登录，先提示登录
      this.showLoginTip();
      return;
    }
    
    wx.navigateTo({
      url: '/pages/my-orders/index',
      fail: (err) => {
        console.error('跳转到我的订单页面失败', err);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        });
      }
    });
  },
  
  /**
   * 跳转到联系商户页面
   */
  goToContactMerchant: function () {
    wx.navigateTo({
      url: '/pages/contact-merchant/index',
      fail: (err) => {
        console.error('跳转到联系商户页面失败', err);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        });
      }
    });
  },
  
  /**
   * 跳转到管理员订单页面
   */
  goToAdminOrders: function () {
    if (!this.data.isAdmin) {
      wx.showToast({
        title: '您没有管理员权限',
        icon: 'none'
      });
      return;
    }
    
    wx.navigateTo({
      url: '/pages/admin-orders/index',
      fail: (err) => {
        console.error('跳转到管理员订单页面失败', err);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        });
      }
    });
  },
  
  /**
   * 跳转到商户信息设置页面
   */
  goToMerchantInfo: function () {
    if (!this.data.isAdmin) {
      wx.showToast({
        title: '您没有商户权限',
        icon: 'none'
      });
      return;
    }
    
    wx.navigateTo({
      url: '/pages/merchant-info/index',
      fail: (err) => {
        console.error('跳转到商户信息设置页面失败', err);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        });
      }
    });
  },
  
  /**
   * 跳转到关于我们页面
   */
  goToAboutUs: function () {
    wx.navigateTo({
      url: '/pages/about-us/index',
      fail: (err) => {
        console.error('跳转到关于我们页面失败', err);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        });
      }
    });
  },
  
  /**
   * 跳转到登录页面
   */
  goToLogin: function () {
    wx.navigateTo({
      url: '/pages/login/index'
    });
  },
  
  /**
   * 显示登录提示
   */
  showLoginTip: function () {
    wx.showModal({
      title: '提示',
      content: '请先登录',
      showCancel: false,
      confirmText: '去登录',
      success: (res) => {
        if (res.confirm) {
          this.goToLogin();
        }
      }
    });
  }
}); 