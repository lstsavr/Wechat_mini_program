const app = getApp()

Page({
  data: {
    userInfo: null,
    isLogin: false
  },

  onLoad: function() {
    // 页面加载时检查是否已有登录状态
    this.checkLoginStatus();
  },

  // 检查登录状态
  checkLoginStatus: function() {
    // 从缓存获取用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      // 设置全局数据
      app.globalData.userInfo = userInfo;
      this.setData({
        userInfo: userInfo,
        isLogin: true
      });
      // 已登录直接跳转到首页
      this.navigateToHome();
    }
  },

  // 获取用户信息（使用新接口）
  getUserProfile: function() {
    // 推荐使用wx.getUserProfile获取用户信息，开发者每次通过该接口获取用户个人信息均需用户确认
    wx.getUserProfile({
      desc: '用于完善用户资料', // 声明获取用户个人信息后的用途
      success: (res) => {
        const userInfo = res.userInfo;
        
        // 显示加载中
        wx.showLoading({
          title: '登录中...',
          mask: true
        });
        
        // 调用云函数登录
        wx.cloud.callFunction({
          name: 'getUserInfo',
          data: {
            nickname: userInfo.nickName,
            avatarUrl: userInfo.avatarUrl
          },
          success: res => {
            wx.hideLoading();
            
            // 登录成功
            if (res.result && res.result.success) {
              const userData = res.result.data;
              
              // 合并从微信获取的用户信息和数据库返回的用户信息
              if (!userData.nickname && userInfo.nickName) {
                userData.nickname = userInfo.nickName;
              }
              if (!userData.avatarUrl && userInfo.avatarUrl) {
                userData.avatarUrl = userInfo.avatarUrl;
              }
              
              this.loginSuccess(userData);
              
              // 如果是新用户且有新的信息，则更新用户信息
              if (res.result.isNewUser || (!userData.nickname && userInfo.nickName) || (!userData.avatarUrl && userInfo.avatarUrl)) {
                this.updateUserInfo(userData._id, {
                  nickname: userInfo.nickName,
                  avatarUrl: userInfo.avatarUrl
                });
              }
            } else {
              wx.showToast({
                title: res.result.errMsg || '登录失败',
                icon: 'none'
              });
            }
          },
          fail: err => {
            wx.hideLoading();
            console.error('调用getUserInfo云函数失败', err);
            wx.showToast({
              title: '登录失败，请重试',
              icon: 'none'
            });
          }
        });
      },
      fail: (err) => {
        console.error('获取用户信息失败', err);
        wx.showModal({
          title: '提示',
          content: '您拒绝了授权，将无法使用完整功能，请重新授权',
          showCancel: false
        });
      }
    });
  },
  
  // 更新用户信息
  updateUserInfo: function(userId, userInfo) {
    // 此处可以添加更新用户信息的逻辑，可选
    console.log('更新用户信息:', userId, userInfo);
    // 这里可以调用云函数更新用户信息，本示例省略实现
  },
  
  // 登录成功后的处理
  loginSuccess: function(userData) {
    // 更新页面状态
    this.setData({
      userInfo: userData,
      isLogin: true
    });
    
    // 保存全局数据
    app.globalData.userInfo = userData;
    app.globalData.isLogin = true;
    
    // 保存到本地缓存
    wx.setStorageSync('userInfo', userData);
    
    // 显示成功提示
    wx.showToast({
      title: '登录成功',
      icon: 'success',
      duration: 1500
    });
    
    // 延迟后跳转到首页
    setTimeout(() => {
      this.navigateToHome();
    }, 1500);
  },
  
  // 跳转到首页
  navigateToHome: function() {
    wx.switchTab({
      url: '/pages/home/index',
      fail: (err) => {
        console.error('跳转到首页失败', err);
        // 如果switchTab失败，尝试redirectTo
        wx.redirectTo({
          url: '/pages/home/index'
        });
      }
    });
  }
})