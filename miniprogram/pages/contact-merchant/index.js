// 商户联系信息页面
Page({
  /**
   * 页面的初始数据
   */
  data: {
    merchantInfo: null,
    isLoading: true,
    hasError: false,
    hasData: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    this.loadMerchantInfo();
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh: function () {
    this.loadMerchantInfo();
  },

  /**
   * 加载商户信息
   */
  loadMerchantInfo: function () {
    this.setData({
      isLoading: true,
      hasError: false
    });

    wx.cloud.callFunction({
      name: 'getMerchantInfo',
      success: res => {
        if (res.result && res.result.success) {
          const merchantInfo = res.result.data || {};
          const hasData = !!(merchantInfo.phone || merchantInfo.wechatId || merchantInfo.email);
          
          let lastUpdateTime = null;
          if (merchantInfo.updateTime) {
            lastUpdateTime = this.formatDate(merchantInfo.updateTime);
          }

          this.setData({
            merchantInfo,
            lastUpdateTime,
            isLoading: false,
            hasData
          });
        } else {
          this.setData({
            isLoading: false,
            hasError: true
          });
          wx.showToast({
            title: '获取商户信息失败',
            icon: 'none'
          });
        }
      },
      fail: err => {
        console.error('获取商户信息失败:', err);
        this.setData({
          isLoading: false,
          hasError: true
        });
        wx.showToast({
          title: '获取商户信息失败',
          icon: 'none'
        });
      },
      complete: () => {
        wx.stopPullDownRefresh();
      }
    });
  },

  /**
   * 重试加载
   */
  retry: function () {
    this.loadMerchantInfo();
  },

  /**
   * 复制内容到剪贴板
   */
  copyToClipboard: function (e) {
    const { type } = e.currentTarget.dataset;
    const content = this.data.merchantInfo[type];
    
    if (content) {
      wx.setClipboardData({
        data: content,
        success: () => {
          wx.showToast({
            title: '已复制到剪贴板',
            icon: 'success'
          });
        }
      });
    }
  },

  /**
   * 拨打电话
   */
  callPhone: function () {
    const { phone } = this.data.merchantInfo;
    if (phone) {
      wx.makePhoneCall({
        phoneNumber: phone,
        fail: (err) => {
          console.error('拨打电话失败:', err);
        }
      });
    }
  },

  /**
   * 格式化日期
   */
  formatDate: function (date) {
    if (!date) return null;
    
    if (typeof date === 'string') {
      date = new Date(date);
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  },

  /**
   * 返回上一页
   */
  goBack: function () {
    wx.navigateBack();
  }
});