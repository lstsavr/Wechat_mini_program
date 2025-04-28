// 关于我们页面
const app = getApp()

Page({
  /**
   * 页面的初始数据
   */
  data: {
    loading: false,
    loadError: false,
    merchantInfo: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 加载云端真实数据
    this.loadMerchantInfo();
  },

  /**
   * 加载商户信息
   */
  loadMerchantInfo: function () {
    this.setData({ 
      loading: true,
      loadError: false 
    });

    console.log('开始加载商户信息');
    
    // 确保云环境初始化
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      this.setData({ 
        loading: false,
        loadError: true,
        errorMsg: '当前微信版本过低，无法使用该功能，请升级到最新微信版本后重试。'
      });
      return;
    }
    
    // 初始化云环境（确保与控制台环境ID一致）
    wx.cloud.init({
      env: 'cloud1-1gxxqcpl824b3617',
      traceUser: true
    });
    
    // 直接查询数据库，不通过云函数
    const db = wx.cloud.database();
    
    // 注意：集合名称必须完全一致，包括大小写和横线
    db.collection('merchant-info')
      .limit(1)
      .get()
      .then(res => {
        console.log('商户信息查询结果:', res);
        
        if (res.data && res.data.length > 0) {
          console.log('商户信息数据有效，设置到UI');
          this.setData({
            merchantInfo: res.data[0]
          });
        } else {
          console.error('未找到商户信息数据');
          this.setData({ 
            loadError: true,
            errorMsg: '未找到商户信息'
          });
        }
      })
      .catch(err => {
        console.error('获取商户信息失败:', err);
        this.setData({ 
          loadError: true,
          errorMsg: '获取商户信息失败: ' + err.errMsg || '请稍后重试'
        });
      })
      .finally(() => {
        this.setData({ loading: false });
        console.log('商户信息加载完成，状态:', {
          loadError: this.data.loadError,
          merchantInfo: this.data.merchantInfo
        });
      });
  },

  /**
   * 拨打电话
   */
  makePhoneCall() {
    const phone = this.data.merchantInfo?.phone;
    if (!phone) {
      wx.showToast({
        title: '未设置联系电话',
        icon: 'none'
      });
      return;
    }
    
    wx.makePhoneCall({
      phoneNumber: phone,
      fail(err) {
        console.error('拨打电话失败', err);
      }
    });
  },

  /**
   * 复制微信号
   */
  copyWechat: function () {
    if (!this.data.merchantInfo || !this.data.merchantInfo.wechat) {
      wx.showToast({
        title: '未设置微信号',
        icon: 'none'
      });
      return;
    }

    wx.setClipboardData({
      data: this.data.merchantInfo.wechat,
      success: function () {
        wx.showToast({
          title: '微信号已复制',
          icon: 'success'
        });
      }
    });
  },

  /**
   * 重新加载
   */
  reloadPage: function () {
    this.loadMerchantInfo();
  }
}) 