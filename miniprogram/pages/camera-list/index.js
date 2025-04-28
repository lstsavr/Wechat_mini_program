const app = getApp()

Page({
  /**
   * 页面的初始数据
   */
  data: {
    cameraList: [],
    isLoading: false,
    hasMore: true,
    pageSize: 10,
    skip: 0, // 用于分页加载的skip值
    brandOptions: ["全部", "佳能", "大疆"], // 修改为只有佳能和大疆两个品牌
    brandIndex: 0, // 默认选中"全部"
    selectedBrand: "全部", // 当前选中的品牌
    searchKeyword: '', // 搜索关键词
    sortType: '', // 价格排序方式：'' - 默认不排序, 'asc' - 升序, 'desc' - 降序
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: wx.cloud.DYNAMIC_CURRENT_ENV, // 使用wx.cloud而不是cloud
        traceUser: true,
      });
    }
    
    this.loadCameraData();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    // 如果从详情页返回，可能需要刷新列表
    if (this.data.needRefresh) {
      this.setData({
        cameraList: [],
        skip: 0,
        hasMore: true
      });
      this.loadCameraData().then(() => {
        this.data.needRefresh = false;
      });
    }
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    this.setData({
      cameraList: [],
      skip: 0,
      hasMore: true
    });
    this.loadCameraData().then(() => {
      wx.stopPullDownRefresh();
    });
  },
  
  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    if (this.data.hasMore && !this.data.isLoading) {
      this.loadCameraData();
    }
  },

  /**
   * 搜索框输入事件处理
   */
  onSearchInput: function(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
  },
  
  /**
   * 清空搜索关键词
   */
  clearSearch: function() {
    this.setData({
      searchKeyword: '',
      cameraList: [],
      skip: 0,
      hasMore: true
    });
    this.loadCameraData();
  },
  
  /**
   * 执行搜索操作
   */
  onSearch: function() {
    this.setData({
      cameraList: [],
      skip: 0,
      hasMore: true
    });
    this.loadCameraData();
  },
  
  /**
   * 价格排序事件处理
   */
  onSortByPrice: function(e) {
    const sortType = e.currentTarget.dataset.sort; // 'asc' 或 'desc'
    
    // 如果点击当前已选中的排序类型，则取消排序
    if (sortType === this.data.sortType) {
      this.setData({
        sortType: '',
        cameraList: [],
        skip: 0,
        hasMore: true
      });
    } else {
      // 设置新的排序类型
      this.setData({
        sortType: sortType,
        cameraList: [],
        skip: 0,
        hasMore: true
      });
    }
    
    // 重新加载数据
    this.loadCameraData();
  },

  /**
   * 品牌选择事件处理（Picker）
   */
  onBrandChange: function(e) {
    const index = e.detail.value;
    const brand = this.data.brandOptions[index];
    
    // 如果选中的品牌与当前品牌相同，则不重新加载
    if (brand === this.data.selectedBrand) {
      return;
    }
    
    // 更新当前选中的品牌并重新加载数据
    this.setData({
      brandIndex: index,
      selectedBrand: brand,
      cameraList: [],
      skip: 0,
      hasMore: true
    });
    
    this.loadCameraData();
  },

  /**
   * 加载相机数据（调用云函数）
   */
  loadCameraData: function() {
    if (!this.data.hasMore || this.data.isLoading) {
      return Promise.resolve();
    }

    this.setData({ isLoading: true });

    // 调用云函数获取相机数据
    return wx.cloud.callFunction({
      name: 'getCameras',
      data: {
        skip: this.data.skip,
        limit: this.data.pageSize,
        brand: this.data.selectedBrand,
        keyword: this.data.searchKeyword,
        sort: this.data.sortType
      }
    }).then(res => {
      console.log('获取相机列表成功', res);
      
      if (res.result && res.result.data) {
        const newCameras = res.result.data.map(item => ({
          id: item._id,
          name: item.name,
          description: item.description || '',
          price: this.getPriceDisplay(item.priceRules),
          imageUrl: item.imageUrl
        }));
        
        // 判断是否还有更多数据
        const hasMore = newCameras.length === this.data.pageSize;
        
        this.setData({
          cameraList: [...this.data.cameraList, ...newCameras],
          isLoading: false,
          skip: this.data.skip + newCameras.length, // 更新skip值
          hasMore: hasMore
        });
        
        // 如果没有加载到任何数据，显示"已经到底了"
        if (newCameras.length === 0) {
          this.setData({
            hasMore: false
          });
        }
      } else {
        // 如果没有获取到数据，则显示空状态
        this.setData({
          isLoading: false,
          hasMore: false  // 确保设置为false
        });
        
        // 使用模拟数据（仅在开发测试时使用）
        if (this.data.cameraList.length === 0 && !this.data.searchKeyword) {
          this.useLocalData();
        }
      }
    }).catch(err => {
      console.error('调用云函数失败', err);
      this.setData({ 
        isLoading: false,
        hasMore: false  // 发生错误时也设置为false
      });
      
      // 使用模拟数据（仅在开发测试时使用）
      if (this.data.cameraList.length === 0 && !this.data.searchKeyword) {
        this.useLocalData();
      }
      
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
    });
  },

  /**
   * 获取价格显示
   */
  getPriceDisplay: function(priceRules) {
    if (!priceRules) return '待询价';
    
    // 以短期租赁价格显示
    return priceRules.shortTerm || priceRules.threeDays || priceRules.fiveDays || '待询价';
  },

  /**
   * 使用本地模拟数据（仅开发测试使用）
   */
  useLocalData: function() {
    const mockCameras = [
      {
        id: 'a420',
        name: '佳能a420',
        description: '性能稳定，适合初学者使用',
        price: 25,
        imageUrl: '/images/cameras/canon_a420.jpg',
        brand: '佳能'
      },
      {
        id: '50',
        name: '佳能IXUS 50',
        description: '轻便小巧，适合街拍',
        price: 25,
        imageUrl: '/images/cameras/canon_IXUS_50.png',
        brand: '佳能'
      },
      {
        id: '95',
        name: '佳能IXUS 95',
        description: '高端专业相机，成像清晰',
        price: 30,
        imageUrl: '/images/cameras/canon_IXUS_95.jpg',
        brand: '佳能'
      },
      {
        id: '85',
        name: '佳能ixu 85',
        description: '携带方便，操作简单',
        price: 25,
        imageUrl: '/images/cameras/canon_ixu_85.jpg',
        brand: '佳能'
      },
      {
        id: 'a3000',
        name: '佳能IXUS A3000',
        description: '专业摄影，高清成像',
        price: 35,
        imageUrl: '/images/cameras/canon_IXUS_A3000.jpg',
        brand: '佳能'
      },
      {
        id: '210',
        name: '佳能ixus210',
        description: '大广角，适合风景拍摄',
        price: 28,
        imageUrl: '/images/cameras/canon_ixus210.png',
        brand: '佳能'
      }
    ];

    // 根据当前选中的品牌和搜索关键词过滤数据
    let filteredCameras = mockCameras;
    
    // 品牌筛选
    if (this.data.selectedBrand !== '全部') {
      filteredCameras = filteredCameras.filter(camera => 
        camera.brand === this.data.selectedBrand
      );
    }
    
    // 关键词搜索
    if (this.data.searchKeyword && this.data.searchKeyword.trim() !== '') {
      const keyword = this.data.searchKeyword.trim().toLowerCase();
      filteredCameras = filteredCameras.filter(camera => 
        camera.name.toLowerCase().includes(keyword)
      );
    }
    
    // 价格排序
    if (this.data.sortType) {
      filteredCameras.sort((a, b) => {
        const priceA = typeof a.price === 'number' ? a.price : 0;
        const priceB = typeof b.price === 'number' ? b.price : 0;
        
        if (this.data.sortType === 'asc') {
          return priceA - priceB;
        } else {
          return priceB - priceA;
        }
      });
    }
    
    this.setData({
      cameraList: filteredCameras,
      isLoading: false,
      hasMore: false  // 确保设置为false，表示已加载全部数据
    });
    
    wx.showToast({
      title: '使用模拟数据',
      icon: 'none',
      duration: 1500
    });
  },

  /**
   * 返回首页
   */
  navigateBack: function() {
    wx.navigateBack({
      fail: function() {
        // 如果返回失败，说明没有上一级页面，直接跳转到首页
        wx.switchTab({
          url: '/pages/home/index'
        });
      }
    });
  },
  
  /**
   * 跳转到相机详情页
   */
  goToCameraDetail: function (e) {
    console.log('跳转触发，参数：', e);
    const id = e.currentTarget.dataset.id;
    
    if (!id) {
      console.error('缺少相机ID');
      wx.showToast({
        title: '跳转失败：缺少ID',
        icon: 'none'
      });
      return;
    }
    
    console.log('准备跳转到相机详情，ID:', id);
    
    // 为了确保能显示数据，先在本地存储当前点击的相机数据
    this.saveCurrentCameraData(id);
    
    // 添加随机参数避免页面缓存问题
    const timestamp = new Date().getTime();
    
    // 显示加载中
    wx.showLoading({
      title: '跳转中...',
      mask: true
    });
    
    // 直接跳转到详情页
    wx.navigateTo({
      url: `/pages/camera-detail/index?id=${id}&_t=${timestamp}`,
      success: function() {
        console.log('跳转成功');
      },
      fail: function(err) {
        console.error('跳转到相机详情页失败', err);
        wx.showToast({
          title: '无法打开详情页',
          icon: 'none'
        });
      },
      complete: function() {
        wx.hideLoading();
      }
    });
  },

  /**
   * 保存当前相机数据到本地，方便详情页使用
   */
  saveCurrentCameraData: function(id) {
    // 从当前列表中找到对应相机
    const currentCamera = this.data.cameraList.find(item => item.id === id);
    
    if (currentCamera) {
      console.log('找到当前相机数据，保存到本地存储:', currentCamera);
      
      // 转换为详情页所需的格式
      const cameraDetail = {
        _id: currentCamera.id,
        name: currentCamera.name,
        description: currentCamera.description,
        imageUrl: currentCamera.imageUrl,
        priceRules: {
          shortTerm: parseInt(currentCamera.price) || 0,
          threeDays: parseInt(currentCamera.price * 0.9) || 0,
          fiveDays: parseInt(currentCamera.price * 0.8) || 0
        }
      };
      
      // 保存到本地存储
      try {
        wx.setStorageSync('currentCameraDetail', cameraDetail);
        console.log('保存相机数据到本地存储成功:', cameraDetail);
      } catch (e) {
        console.error('保存相机数据到本地存储失败', e);
      }
    } else {
      console.warn('在当前列表中未找到ID为', id, '的相机数据，尝试使用硬编码数据');
      
      // 如果在列表中找不到，使用硬编码的数据
      const hardcodedCameras = {
        'a420': {
          _id: 'a420',
          name: '佳能a420',
          description: '性能稳定，适合初学者使用',
          imageUrl: '/images/cameras/canon_a420.jpg',
          priceRules: {
            shortTerm: 25,
            threeDays: 20,
            fiveDays: 18
          }
        },
        '50': {
          _id: '50',
          name: '佳能IXUS 50',
          description: '轻便小巧，适合街拍',
          imageUrl: '/images/cameras/canon_IXUS_50.png',
          priceRules: {
            shortTerm: 25,
            threeDays: 20,
            fiveDays: 18
          }
        },
        '95': {
          _id: '95',
          name: '佳能IXUS 95',
          description: '高端专业相机，成像清晰',
          imageUrl: '/images/cameras/canon_IXUS_95.jpg', 
          priceRules: {
            shortTerm: 30,
            threeDays: 25,
            fiveDays: 22
          }
        },
        '85': {
          _id: '85',
          name: '佳能ixu 85',
          description: '携带方便，操作简单',
          imageUrl: '/images/cameras/canon_ixu_85.jpg',
          priceRules: {
            shortTerm: 25,
            threeDays: 20,
            fiveDays: 18
          }
        },
        'a3000': {
          _id: 'a3000',
          name: '佳能IXUS A3000',
          description: '专业摄影，高清成像',
          imageUrl: '/images/cameras/canon_IXUS_A3000.jpg',
          priceRules: {
            shortTerm: 35,
            threeDays: 30,
            fiveDays: 25
          }
        },
        '210': {
          _id: '210',
          name: '佳能ixus210',
          description: '大广角，适合风景拍摄',
          imageUrl: '/images/cameras/canon_ixus210.png',
          priceRules: {
            shortTerm: 28,
            threeDays: 23,
            fiveDays: 20
          }
        }
      };
      
      if (hardcodedCameras[id]) {
        try {
          wx.setStorageSync('currentCameraDetail', hardcodedCameras[id]);
          console.log('使用硬编码数据保存成功:', hardcodedCameras[id]);
        } catch (e) {
          console.error('保存硬编码相机数据到本地存储失败', e);
        }
      } else {
        console.error('未找到ID为', id, '的硬编码数据');
      }
    }
  }
}); 