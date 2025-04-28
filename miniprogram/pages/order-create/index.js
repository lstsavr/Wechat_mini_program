Page({
  /**
   * 页面的初始数据
   */
  data: {
    cameraId: '',
    camera: null,
    loading: true,
    
    // 日期选择相关
    startDate: '',
    endDate: '',
    today: '',  // 最早可选日期（今天）
    maxDate: '', // 最晚可选日期（3个月后）
    unavailableDates: [], // 不可用日期
    allDatesUnavailable: false, // 是否所有日期都不可用（库存为0的情况）
    hasDateConflict: false, // 是否有日期冲突
    formattedUnavailableDates: '', // 格式化后的不可用日期
    
    // 租金计算相关
    rentalDays: 0,        // 租赁天数
    dailyRate: 0,         // 每日租金
    totalAmount: 0,       // 总租金
    priceType: '',        // 价格类型：短租/中租/长租
    
    // 上门取件信息
    name: '',             // 客户姓名
    phone: '',            // 联系电话
    remark: '',           // 备注信息
    remarkLength: 0,      // 备注长度
    
    // 提交状态
    submitting: false     // 是否正在提交
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 设置今天和最大可选日期（3个月后）
    const today = this.formatDate(new Date());
    const maxDate = this.formatDate(new Date(new Date().setMonth(new Date().getMonth() + 3)));
    
    this.setData({
      today: today,
      maxDate: maxDate,
      loading: true
    });
    
    if (options && options.id) {
      this.setData({
        cameraId: options.id
      });
      
      // 尝试从本地存储获取相机信息
      const cameraDetail = wx.getStorageSync('currentCameraDetail');
      if (cameraDetail && cameraDetail._id === options.id) {
        this.setData({
          camera: cameraDetail,
          loading: false
        });
        
        // 获取不可用日期
        this.getUnavailableDates(options.id);
      } else {
        // 如果本地存储没有，则调用云函数
        this.loadCameraInfo(options.id);
      }
    } else {
      wx.showToast({
        title: '缺少相机ID',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },
  
  /**
   * 加载相机信息
   */
  loadCameraInfo: function(cameraId) {
    wx.cloud.callFunction({
      name: 'getCameraDetail',
      data: { id: cameraId }
    }).then(res => {
      if (res.result && res.result.success && res.result.data) {
        this.setData({
          camera: res.result.data,
          loading: false
        });
      } else {
        wx.showToast({
          title: '获取相机信息失败',
          icon: 'none'
        });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }
    }).catch(err => {
      console.error('获取相机信息失败', err);
      wx.showToast({
        title: '获取相机信息失败',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    });
  },
  
  /**
   * 获取不可用日期
   */
  getUnavailableDates: function(cameraId) {
    wx.showLoading({
      title: '加载日期信息...',
      mask: true
    });
    
    wx.cloud.callFunction({
      name: 'getUnavailableDates',
      data: { cameraId: cameraId }
    }).then(res => {
      wx.hideLoading();
      
      if (res.result && res.result.success) {
        console.log('获取到不可用日期:', res.result.unavailableDates);
        
        // 检查是否所有日期都不可用（库存为0的情况）
        if (res.result.unavailableDates && res.result.unavailableDates.includes('all')) {
          this.setData({
            allDatesUnavailable: true,
            unavailableDates: []
          });
          
          // 显示提示
          wx.showModal({
            title: '无法预约',
            content: '该相机暂无库存，无法进行预约',
            showCancel: false,
            success: (res) => {
              // 返回上一页
              wx.navigateBack();
            }
          });
        } else {
          // 格式化不可用日期显示
          let formattedDates = '';
          if (res.result.unavailableDates && res.result.unavailableDates.length > 0) {
            if (res.result.unavailableDates.length > 5) {
              formattedDates = res.result.unavailableDates.slice(0, 5).join('、') + ' 等';
            } else {
              formattedDates = res.result.unavailableDates.join('、');
            }
          }
          
          this.setData({
            allDatesUnavailable: false,
            unavailableDates: res.result.unavailableDates || [],
            formattedUnavailableDates: formattedDates
          });
        }
      } else {
        console.error('获取不可用日期失败:', res.result);
        wx.showToast({
          title: '日期加载失败',
          icon: 'none'
        });
        
        // 设置默认值
        this.setData({
          allDatesUnavailable: false,
          unavailableDates: [],
          formattedUnavailableDates: ''
        });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('调用云函数失败', err);
      wx.showToast({
        title: '日期加载失败',
        icon: 'none'
      });
      
      // 即使失败，也设置一个空数组，让用户可以选择日期
      this.setData({
        allDatesUnavailable: false,
        unavailableDates: [],
        formattedUnavailableDates: ''
      });
    });
  },
  
  /**
   * 格式化日期为 YYYY-MM-DD 格式
   */
  formatDate: function(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  },
  
  /**
   * 显示日历选择器
   */
  showCalendar: function() {
    this.setData({
      showCalendar: true
    });
  },
  
  /**
   * 关闭日历选择器
   */
  hideCalendar: function() {
    this.setData({
      showCalendar: false
    });
  },
  
  /**
   * 处理日期选择
   */
  onDateSelect: function(e) {
    const dates = e.detail;
    if (dates && dates.length > 0) {
      // 排序日期
      dates.sort();
      
      this.setData({
        startDate: dates[0],
        endDate: dates[dates.length - 1],
        selectedDates: dates
      });
      
      // 计算租金
      this.calculateRental();
    }
  },
  
  /**
   * 日期是否可选（日历组件回调）
   */
  dateIsDisabled: function(date) {
    // 检查日期是否在不可用列表中
    return this.data.unavailableDates.includes(date);
  },
  
  /**
   * 手动选择开始日期
   */
  bindStartDateChange: function(e) {
    const startDate = e.detail.value;
    this.setData({
      startDate: startDate
    });
    
    // 如果开始日期晚于结束日期，则同步更新结束日期
    if (this.data.endDate && startDate > this.data.endDate) {
      this.setData({
        endDate: startDate
      });
    }
    
    // 计算租金
    if (this.data.startDate && this.data.endDate) {
      this.calculateRental();
      // 检查日期冲突
      this.checkDateConflict();
    }
  },
  
  /**
   * 手动选择结束日期
   */
  bindEndDateChange: function(e) {
    const endDate = e.detail.value;
    this.setData({
      endDate: endDate
    });
    
    // 如果结束日期早于开始日期，则同步更新开始日期
    if (this.data.startDate && endDate < this.data.startDate) {
      this.setData({
        startDate: endDate
      });
    }
    
    // 计算租金
    if (this.data.startDate && this.data.endDate) {
      this.calculateRental();
      // 检查日期冲突
      this.checkDateConflict();
    }
  },
  
  /**
   * 检查所选日期是否有冲突
   */
  checkDateConflict: function() {
    if (!this.data.startDate || !this.data.endDate) {
      return false;
    }
    
    // 生成所选日期区间内的所有日期
    const dates = this.generateDateRange(this.data.startDate, this.data.endDate);
    
    // 检查是否有日期在不可用列表中
    let hasConflict = false;
    for (const date of dates) {
      if (this.data.unavailableDates.includes(date)) {
        hasConflict = true;
        break;
      }
    }
    
    this.setData({
      hasDateConflict: hasConflict
    });
    
    return hasConflict;
  },
  
  /**
   * 生成日期范围内的所有日期
   */
  generateDateRange: function(startDate, endDate) {
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    let currentDate = new Date(start);
    while (currentDate <= end) {
      dates.push(this.formatDate(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  },
  
  /**
   * 计算租期和租金
   */
  calculateRental: function() {
    if (!this.data.startDate || !this.data.endDate || !this.data.camera) {
      return;
    }
    
    // 计算租期天数（包含起止两天）
    const dateRange = this.generateDateRange(this.data.startDate, this.data.endDate);
    const rentalDays = dateRange.length;
    
    // 获取价格信息
    let dailyRate = 0;
    let priceType = '';
    
    // 检查相机是否有价格规则
    if (this.data.camera.priceRules) {
      // 根据租期判断使用哪个价格
      if (rentalDays >= 5 && this.data.camera.priceRules.fiveDays) {
        dailyRate = this.data.camera.priceRules.fiveDays;
        priceType = '长租';
      } else if (rentalDays >= 3 && this.data.camera.priceRules.threeDays) {
        dailyRate = this.data.camera.priceRules.threeDays;
        priceType = '中租';
      } else if (this.data.camera.priceRules.shortTerm) {
        dailyRate = this.data.camera.priceRules.shortTerm;
        priceType = '短租';
      }
    }
    
    // 如果没有找到合适的价格规则，使用基础价格
    if (dailyRate === 0) {
      dailyRate = this.data.camera.price || 0;
      priceType = '基础价';
    }
    
    // 计算总价
    const totalAmount = dailyRate * rentalDays;
    
    // 更新数据
    this.setData({
      rentalDays: rentalDays,
      dailyRate: dailyRate,
      totalAmount: totalAmount,
      priceType: priceType
    });
  },
  
  /**
   * 处理姓名输入
   */
  bindNameInput: function(e) {
    this.setData({
      name: e.detail.value
    });
  },

  /**
   * 处理手机号输入
   */
  bindPhoneInput: function(e) {
    this.setData({
      phone: e.detail.value
    });
  },
  
  /**
   * 处理备注输入
   */
  bindRemarkInput: function(e) {
    this.setData({
      remark: e.detail.value,
      remarkLength: e.detail.value.length
    });
  },
  
  /**
   * 提交订单
   */
  submitOrder: function() {
    // 设置提交中状态
    this.setData({
      submitting: true
    });
    
    // 0. 检查相机是否有库存
    if (this.data.allDatesUnavailable) {
      wx.showModal({
        title: '无法预约',
        content: '该相机暂无库存，无法进行预约',
        showCancel: false
      });
      this.setData({ submitting: false });
      return;
    }
    
    // 1. 校验必填字段
    if (!this.data.startDate || !this.data.endDate) {
      wx.showToast({
        title: '请选择租赁日期',
        icon: 'none'
      });
      this.setData({ submitting: false });
      return;
    }
    
    if (!this.data.name) {
      wx.showToast({
        title: '请输入姓名',
        icon: 'none'
      });
      this.setData({ submitting: false });
      return;
    }
    
    if (!this.data.phone) {
      wx.showToast({
        title: '请输入手机号',
        icon: 'none'
      });
      this.setData({ submitting: false });
      return;
    }
    
    // 简单校验手机号格式
    if (!/^1\d{10}$/.test(this.data.phone)) {
      wx.showToast({
        title: '请输入正确的手机号',
        icon: 'none'
      });
      this.setData({ submitting: false });
      return;
    }
    
    // 2. 检查日期冲突
    if (this.data.hasDateConflict) {
      wx.showToast({
        title: '所选日期与已有预约冲突',
        icon: 'none'
      });
      this.setData({ submitting: false });
      return;
    }

    // 3. 请求订阅消息授权
    const tmplId = 'ChzTXY2_g-kHUCmR6_I21ZanceI1RnEhrwb4-EIRTmE';
    
    wx.requestSubscribeMessage({
      tmplIds: [tmplId],
      complete: (res) => {
        console.log('订阅消息授权结果:', res);
        // 无论用户是否授权，都继续下单流程
        this.createOrderInCloud(tmplId);
      }
    });
  },

  /**
   * 调用云函数创建订单
   */
  createOrderInCloud: function(tmplId) {
    // 显示加载状态
    wx.showLoading({
      title: '提交预约中...',
      mask: true
    });
    
    // 构建订单数据
    const orderData = {
      cameraId: this.data.cameraId,
      cameraName: this.data.camera ? this.data.camera.name : '',
      imageUrl: this.data.camera ? this.data.camera.imageUrl : '', // 添加相机图片URL
      startDate: this.data.startDate,
      endDate: this.data.endDate,
      rentalDays: this.data.rentalDays,
      dailyPrice: this.data.dailyRate,
      totalPrice: this.data.totalAmount,
      userName: this.data.name,
      contactName: this.data.name, // 兼容字段名
      phone: this.data.phone,
      note: this.data.remark || '',
      status: 'reserved', // 设置为已预约状态，不需要支付
      createTime: new Date()
    };
    
    // 调用云函数创建订单
    wx.cloud.callFunction({
      name: 'createOrder',
      data: {
        orderData: orderData,
        templateId: tmplId
      }
    }).then(res => {
      wx.hideLoading();
      this.setData({ submitting: false });
      
      if (res.result && res.result.success) {
        // 保存订单ID到本地存储
        try {
          wx.setStorageSync('currentOrderId', res.result.orderId);
        } catch (e) {
          console.error('保存订单ID失败', e);
        }
        
        // 提示成功
        wx.showToast({
          title: '预约成功',
          icon: 'success',
          duration: 2000
        });
        
        // 延迟跳转到我的订单页面
        setTimeout(() => {
          wx.redirectTo({
            url: '/pages/my-orders/index',  // 跳转到我的订单页
            fail: function() {
              // 如果跳转失败，返回首页
              wx.switchTab({
                url: '/pages/index/index'
              });
            }
          });
        }, 1500);
      } else {
        console.error('创建订单失败:', res);
        
        // 检查是否是库存不足错误
        if (res.result && res.result.errMsg && res.result.errMsg.includes('已被约满')) {
          wx.showModal({
            title: '预约失败',
            content: '该相机在所选时间段内已被约满，请选择其他时间或其他设备',
            showCancel: false,
            confirmText: '我知道了'
          });
        } else {
          // 其他错误
          wx.showToast({
            title: res.result?.errMsg || '预约失败',
            icon: 'none'
          });
        }
      }
    }).catch(err => {
      wx.hideLoading();
      this.setData({ submitting: false });
      console.error('调用云函数失败', err);
      
      wx.showToast({
        title: '预约失败，请重试',
        icon: 'none'
      });
    });
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {
    console.log('订单创建页面下拉刷新');
    
    if (this.data.cameraId) {
      // 重新加载相机信息
      const cameraDetail = wx.getStorageSync('currentCameraDetail');
      if (cameraDetail && cameraDetail._id === this.data.cameraId) {
        this.setData({
          camera: cameraDetail
        });
      } else {
        this.loadCameraInfo(this.data.cameraId);
      }
      
      // 重新获取不可用日期
      this.getUnavailableDates(this.data.cameraId);
    }
    
    // 停止下拉刷新动画
    wx.stopPullDownRefresh();
  }
}); 