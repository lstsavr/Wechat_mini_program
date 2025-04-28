// pages/home/index.js
const app = getApp()

Page({
  data: {
    isLoading: true,
    banners: [
      {
        id: 1,
        imageUrl: '/images/banner1.jpg',
        linkUrl: '/pages/camera-list/index'
      },
      {
        id: 2,
        imageUrl: '/images/banner2.jpg',
        linkUrl: '/pages/activity/index'
      },
      {
        id: 3,
        imageUrl: '/images/banner3.jpg',
        linkUrl: '/pages/user-center/index'
      },
      {
        id: 4,
        imageUrl: '/images/banner4.jpg',
        linkUrl: '/pages/about/index'
      }
    ],
    recommendCameras: []
  },

  onLoad: function() {
    // 检查登录状态
    this.checkLoginStatus();
    
    // 获取推荐相机数据
    this.fetchRecommendCameras();
  },
  
  onShow: function() {
    // 页面显示时检查登录状态
    this.checkLoginStatus();
  },
  
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {
    console.log('首页下拉刷新');
    
    // 重新获取推荐相机数据
    this.fetchRecommendCameras();
    
    // 停止下拉刷新动画
    wx.stopPullDownRefresh();
  },
  
  // 检查登录状态
  checkLoginStatus: function() {
    const isLogin = app.checkLoginStatus();
    if (!isLogin) {
      wx.redirectTo({
        url: '/pages/login/index'
      });
    }
  },

  // 获取推荐相机数据
  fetchRecommendCameras: function() {
    // 先展示加载中状态
    this.setData({
      isLoading: true
    });
    
    // 调用云函数获取相机数据
    wx.cloud.callFunction({
      name: 'getCameras',
      data: {
        limit: 4  // 只获取4个推荐相机
      },
      success: res => {
        console.log('获取相机列表成功', res);
        
        // 判断是否成功获取数据
        if (res.result && res.result.data) {
          // 处理相机数据并绑定到页面
          this.setData({
            recommendCameras: res.result.data,
            isLoading: false
          });
        } else {
          // 获取失败，显示错误提示
          this.handleError('获取相机数据失败');
        }
      },
      fail: err => {
        console.error('调用云函数失败', err);
        // 使用模拟数据（当云函数不可用时）
        this.useLocalData();
      }
    });
  },

  // 使用本地模拟数据（在云函数调用失败时使用）
  useLocalData: function() {
    // 模拟相机数据
    const mockCameras = [
      {
        _id: 'a420',
        name: '佳能a420',
        imageUrl: '/images/cameras/canon_a420.jpg',
        priceRules: {
          shortTerm: 25,
          threeDays: 23,
          fiveDays: 20
        }
      },
      {
        _id: '50',
        name: '佳能IXUS 50',
        imageUrl: '/images/cameras/canon_IXUS_50.png',
        priceRules: {
          shortTerm: 25,
          threeDays: 23,
          fiveDays: 20
        }
      },
      {
        _id: 'a3000',
        name: '佳能IXUS A3000',
        imageUrl: '/images/cameras/canon_IXUS_A3000.jpg',
        priceRules: {
          shortTerm: 35,
          threeDays: 32,
          fiveDays: 30
        }
      },
      {
        _id: '210',
        name: '佳能ixus210',
        imageUrl: '/images/cameras/canon_ixus210.png',
        priceRules: {
          shortTerm: 28,
          threeDays: 25,
          fiveDays: 23
        }
      }
    ];
    
    this.setData({
      recommendCameras: mockCameras,
      isLoading: false
    });
    
    // 提示用户使用了模拟数据
    wx.showToast({
      title: '使用本地数据展示',
      icon: 'none'
    });
  },

  // 跳转到相机详情页
  goToCameraDetail: function(e) {
    // 从dataset中获取相机ID
    const cameraId = e.currentTarget.dataset.id;
    
    // 参数检查
    if (!cameraId) {
      wx.showToast({
        title: '相机ID不能为空',
        icon: 'none'
      });
      return;
    }
    
    // 使用navigateTo跳转到详情页，并传递相机ID
    wx.navigateTo({
      url: `/pages/camera-detail/index?id=${cameraId}`
    });
    
    console.log('跳转到相机详情页，ID:', cameraId);
  },

  // 处理错误情况
  handleError: function(errMsg) {
    this.setData({
      isLoading: false
    });
    
    wx.showToast({
      title: errMsg || '操作失败',
      icon: 'none'
    });
    
    // 使用模拟数据代替
    this.useLocalData();
  },
  
  // 绑定手机号
  bindPhone: function() {
    wx.showToast({
      title: '暂未开放此功能',
      icon: 'none'
    });
  },
  
  // 页面导航
  navigateTo: function(e) {
    const url = e.currentTarget.dataset.url;
    wx.navigateTo({
      url: url
    });
  },

  // 跳转到相机列表页面
  goToCameraList: function() {
    console.log('准备跳转到相机列表页面');
    wx.navigateTo({
      url: '/pages/camera-list/index',
      success: function(res) {
        console.log('跳转成功', res);
      },
      fail: function(err) {
        console.error('navigateTo跳转失败', err);
        console.log('尝试使用redirectTo方式跳转');
        
        // 尝试使用redirectTo跳转
        wx.redirectTo({
          url: '/pages/camera-list/index',
          success: function(res) {
            console.log('redirectTo跳转成功', res);
          },
          fail: function(redirectErr) {
            console.error('redirectTo跳转也失败了', redirectErr);
            console.log('尝试使用switchTab方式跳转');
            
            // 尝试使用switchTab跳转（如果camera-list是tabBar页面）
            wx.switchTab({
              url: '/pages/camera-list/index',
              success: function(res) {
                console.log('switchTab跳转成功', res);
              },
              fail: function(switchTabErr) {
                console.error('所有跳转方式都失败了', switchTabErr);
                wx.showToast({
                  title: '页面跳转失败',
                  icon: 'none'
                });
              }
            });
          }
        });
      }
    });
  }
}); 