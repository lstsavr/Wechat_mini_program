const app = getApp()
const db = wx.cloud.database()
const cameras = db.collection('cameras')
const merchantInfo = db.collection('merchant-info')

Page({
  /**
   * 页面的初始数据
   */
  data: {
    cameraId: '',
    camera: null,
    loading: true,
    error: null,
    errorMsg: '',
    merchantInfo: null,
    rentalNotices: [],
    noticesLoading: true,
    imageError: false,
    imageLoaded: false,
    descriptionLines: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 从options中获取相机ID
    if (options && options.id) {
      this.setData({
        cameraId: options.id
      });
      
      // 获取相机详情
      this.loadCamera(options.id);
      this.loadMerchantInfo();
    } else {
      this.setData({
        loading: false,
        error: '未指定相机ID'
      });
      
      wx.showToast({
        title: '未指定相机ID',
        icon: 'none',
        duration: 2000
      });
    }
  },

  /**
   * 获取相机详情数据
   */
  loadCamera: function (id) {
    this.setData({
      loading: true,
      error: null
    });

    cameras.doc(id || this.data.cameraId).get().then(res => {
      console.log('相机数据:', res.data);
      this.setData({
        camera: res.data,
        loading: false
      });
    }).catch(err => {
      console.error('加载相机数据失败', err);
      this.setData({
        error: '加载相机信息失败',
        loading: false
      });
    });
  },

  /**
   * 获取商家信息和租赁须知
   */
  loadMerchantInfo: function() {
    this.setData({ noticesLoading: true });
    
    merchantInfo.limit(1).get().then(res => {
      console.log('商家信息:', res.data[0]);
      if (res.data && res.data.length > 0) {
        const merchantData = res.data[0];
        
        // 处理租赁须知数据
        let notices = [];
        if (merchantData.rentalNotice) {
          // 处理可能的字符串格式
          if (typeof merchantData.rentalNotice === 'string') {
            // 1. 先按中文分号分割
            let splitByChineseSemicolon = merchantData.rentalNotice.split('；');
            
            // 2. 对每个分割后的项再按换行符分割
            splitByChineseSemicolon.forEach(item => {
              const lines = item.split('\n');
              lines.forEach(line => {
                if (line.trim() !== '') {
                  notices.push(line.trim());
                }
              });
            });
          } 
          // 处理数组格式
          else if (Array.isArray(merchantData.rentalNotice)) {
            // 对数组中的每个元素进行处理
            merchantData.rentalNotice.forEach(item => {
              if (typeof item === 'string') {
                // 先按中文分号分割
                let splitByChineseSemicolon = item.split('；');
                
                splitByChineseSemicolon.forEach(subItem => {
                  const lines = subItem.split('\n');
                  lines.forEach(line => {
                    if (line.trim() !== '') {
                      notices.push(line.trim());
                    }
                  });
                });
              } else if (item) {
                notices.push(item);
              }
            });
          }
        }
        
        // 处理description字段，分割成行数组
        let descriptionLines = [];
        if (merchantData.description) {
          if (typeof merchantData.description === 'string') {
            // 按换行符分割
            descriptionLines = merchantData.description.split('\n').filter(line => line.trim() !== '');
          }
        }
        
        console.log('处理后的租赁须知:', notices);
        console.log('处理后的描述行:', descriptionLines);
        
        this.setData({
          merchantInfo: merchantData,
          rentalNotices: notices,
          descriptionLines: descriptionLines,
          noticesLoading: false
        });
      } else {
        console.log('未获取到商家信息或信息为空');
        this.setData({ 
          noticesLoading: false,
          rentalNotices: []
        });
      }
    }).catch(err => {
      console.error('加载商家信息失败', err);
      this.setData({ 
        noticesLoading: false,
        rentalNotices: []
      });
    });
  },

  /**
   * 图片加载失败处理
   */
  onImageError: function() {
    console.log('图片加载失败');
    this.setData({
      imageError: true,
      imageLoaded: false
    });
  },
  
  /**
   * 图片加载完成处理
   */
  onImageLoad: function() {
    console.log('图片加载完成');
    this.setData({
      imageLoaded: true
    });
  },

  /**
   * 导航到首页
   */
  navToHome: function() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  },

  /**
   * 返回上一页
   */
  goBack: function() {
    wx.navigateBack({
      delta: 1
    });
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {
    console.log('相机详情页面下拉刷新');
    
    // 重新加载相机详情
    if (this.data.cameraId) {
      this.loadCamera(this.data.cameraId);
      this.loadMerchantInfo();
    }
    
    // 停止下拉刷新动画
    wx.stopPullDownRefresh();
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    const camera = this.data.camera;
    
    if (camera) {
      return {
        title: `${camera.name} - 相机租赁`,
        path: `/pages/camera-detail/index?id=${this.data.cameraId}`,
        imageUrl: camera.imageUrl
      }
    }
    
    return {
      title: '相机租赁',
      path: '/pages/index/index'
    }
  },

  /**
   * 点击立即租赁按钮 - 新增方法
   */
  goToRent: function () {
    if (!this.data.camera) {
      return;
    }
    
    console.log('跳转到创建订单页面，相机ID:', this.data.camera._id);
    
    // 获取价格信息，优先使用shortTerm价格
    let price = 0;
    if (this.data.camera.priceRules && this.data.camera.priceRules.shortTerm) {
      price = this.data.camera.priceRules.shortTerm;
    } else if (this.data.camera.price) {
      price = this.data.camera.price;
    }
    
    // 将相机对象存储到本地缓存
    try {
      wx.setStorageSync('currentCameraDetail', this.data.camera);
    } catch (e) {
      console.error('保存相机信息到缓存失败', e);
    }
    
    wx.navigateTo({
      url: `/pages/order-create/index?id=${this.data.camera._id}`,
      success: res => {
        console.log('成功跳转到创建订单页面');
      },
      fail: err => {
        console.error('跳转到创建订单页面失败', err);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        });
      }
    });
  }
}) 