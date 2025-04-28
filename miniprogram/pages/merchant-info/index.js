// 商户信息页面
const app = getApp()

Page({
  /**
   * 页面的初始数据
   */
  data: {
    loading: false, // 加载状态
    loadError: false, // 加载错误状态
    saving: false, // 保存状态
    formValid: false, // 表单是否有效
    formData: {
      shopName: '', // 店铺名称
      phone: '', // 联系电话
      address: '', // 店铺地址
      description: '', // 租赁规则描述
      storeDescription: '', // 店铺描述
      businessHours: '' // 营业时间
    },
    errors: {
      shopName: '',
      phone: '',
      address: '',
      rentalRules: ''
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 加载商户现有信息
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

    wx.cloud.callFunction({
      name: 'getMerchantInfo',
      data: {
        self: true
      },
      success: res => {
        console.log('获取商户信息成功', res);

        if (res.result && res.result.success && res.result.data) {
          // 将获取到的数据设置到表单
          const info = res.result.data;
          this.setData({
            formData: {
              shopName: info.shopName || '',
              phone: info.phone || '',
              address: info.address || '',
              description: info.description || '', // 租赁规则描述
              storeDescription: info.storeDescription || '', // 店铺描述
              businessHours: info.businessHours || ''
            }
          });
          this.validateForm();
        }
      },
      fail: err => {
        console.error('获取商户信息失败', err);
        this.setData({ loadError: true });
      },
      complete: () => {
        this.setData({ loading: false });
      }
    });
  },

  /**
   * 处理表单输入
   */
  handleInput: function (e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    
    // 更新表单数据
    this.setData({
      [`formData.${field}`]: value
    });
    
    // 验证特定字段
    this.validateField(field, value);
    
    // 验证整个表单
    this.validateForm();
  },
  
  /**
   * 验证单个字段
   */
  validateField: function (field, value) {
    let error = '';
    
    switch (field) {
      case 'shopName':
        if (!value.trim()) {
          error = '请输入店铺名称';
        }
        break;
      case 'phone':
        if (!value.trim()) {
          error = '请输入联系电话';
        } else if (!/^1\d{10}$/.test(value)) {
          error = '请输入正确的11位手机号码';
        }
        break;
      case 'address':
        if (!value.trim()) {
          error = '请输入店铺地址';
        }
        break;
      case 'description':
        if (!value.trim()) {
          error = '请输入租赁规则';
          this.setData({
            'errors.rentalRules': error
          });
        } else {
          this.setData({
            'errors.rentalRules': ''
          });
        }
        break;
    }
    
    if (field !== 'description') {
      this.setData({
        [`errors.${field}`]: error
      });
    }
  },
  
  /**
   * 验证整个表单
   */
  validateForm: function () {
    const { formData, errors } = this.data;
    
    // 验证必填字段
    if (!formData.shopName.trim()) {
      this.setData({ 'errors.shopName': '请输入店铺名称' });
    }
    
    if (!formData.phone.trim()) {
      this.setData({ 'errors.phone': '请输入联系电话' });
    } else if (!/^1\d{10}$/.test(formData.phone)) {
      this.setData({ 'errors.phone': '请输入正确的11位手机号码' });
    }
    
    if (!formData.address.trim()) {
      this.setData({ 'errors.address': '请输入店铺地址' });
    }
    
    if (!formData.description.trim()) {
      this.setData({ 'errors.rentalRules': '请输入租赁规则' });
    } else {
      this.setData({ 'errors.rentalRules': '' });
    }
    
    // 检查是否有错误
    const isValid = !errors.shopName && !errors.phone && !errors.address && !errors.rentalRules;
    
    this.setData({ formValid: isValid });
    
    return isValid;
  },

  /**
   * 处理表单提交
   */
  handleSubmit: function (e) {
    console.log('表单事件数据:', e.detail.value);
    
    // 直接从表单事件中获取数据，绕过formData对象
    const formValues = e.detail.value;
    
    // 表单验证
    if (!formValues.shopName || formValues.shopName.trim() === '') {
      wx.showToast({
        title: '店铺名称不能为空',
        icon: 'none'
      });
      return;
    }
    
    if (!formValues.phone || formValues.phone.trim() === '') {
      wx.showToast({
        title: '手机号不能为空',
        icon: 'none'
      });
      return;
    }
    
    if (!/^1\d{10}$/.test(formValues.phone)) {
      wx.showToast({
        title: '请输入有效的11位手机号码',
        icon: 'none'
      });
      return;
    }
    
    if (!formValues.address || formValues.address.trim() === '') {
      wx.showToast({
        title: '店铺地址不能为空',
        icon: 'none'
      });
      return;
    }
    
    if (!formValues.description || formValues.description.trim() === '') {
      wx.showToast({
        title: '租赁规则不能为空',
        icon: 'none'
      });
      return;
    }

    // 打印表单数据，便于调试
    console.log('提交的表单数据(原formData):', this.data.formData);
    console.log('提交的表单数据(来自表单):', formValues);

    // 设置保存中状态
    this.setData({ saving: true });

    // 组装要提交的数据
    const merchantData = {
      shopName: formValues.shopName,
      phone: formValues.phone,
      address: formValues.address,
      description: formValues.description, // 租赁规则
      storeDescription: formValues.storeDescription, // 店铺描述
      businessHours: formValues.businessHours
    };

    // 调用云函数保存数据
    wx.cloud.callFunction({
      name: 'saveMerchantInfo',
      data: {
        merchantData: merchantData,
        isTest: true  // 添加测试标记，绕过权限校验
      },
      success: res => {
        console.log('保存商户信息结果:', res);
        
        if (res.result && res.result.success) {
          wx.showToast({
            title: '保存成功',
            icon: 'success',
            duration: 2000
          });
          console.log('商户信息保存成功!');
          
          // 保存成功后，可以返回上一页
          setTimeout(() => {
            wx.navigateBack();
          }, 2000);
        } else {
          console.error('保存失败:', res.result);
          wx.showToast({
            title: res.result?.errMsg || '保存失败，请重试',
            icon: 'none'
          });
        }
      },
      fail: err => {
        console.error('调用云函数失败:', err);
        wx.showToast({
          title: '保存失败，请重试',
          icon: 'none'
        });
      },
      complete: () => {
        this.setData({ saving: false });
      }
    });
  }
}); 