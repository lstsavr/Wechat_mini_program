// 管理员订单列表页面
const app = getApp()
const cloudFuncWrapper = require('../../utils/cloudFuncWrapper')

Page({
  /**
   * 页面的初始数据
   */
  data: {
    orderList: [], // 订单列表数据
    isLoading: true, // 加载状态
    hasError: false, // 错误状态
    errorMsg: '', // 错误信息
    
    // 分页参数
    pageSize: 10, // 每页显示数量
    currentPage: 1, // 当前页码
    hasMoreOrders: false, // 是否有更多订单
    isLoadingMore: false, // 加载更多状态
    
    // 订单状态相关
    currentStatus: 'all', // 当前选中的状态
    statusList: [
      { id: 'all', name: '全部订单' },
      { id: 'reserved', name: '已预约' },
      { id: 'pending_payment', name: '待付款' },
      { id: 'paid', name: '已付款' },
      { id: 'completed', name: '已完成' },
      { id: 'cancelled', name: '已取消' }
    ],
    // 状态样式映射
    statusMap: {
      'reserved': {
        text: '已预约',
        color: '#1890FF'
      },
      'pending_payment': {
        text: '待付款',
        color: '#FAAD14'
      },
      'paid': {
        text: '已付款',
        color: '#1890FF'
      },
      'completed': {
        text: '已完成',
        color: '#52C41A'
      },
      'cancelled': {
        text: '已取消',
        color: '#F5222D'
      }
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 加载订单列表
    this.loadOrders();
  },
  
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    // 重置分页参数并重新加载
    this.setData({
      currentPage: 1,
      orderList: []
    });
    this.loadOrders(() => {
      wx.stopPullDownRefresh();
    });
  },
  
  /**
   * 加载订单列表
   */
  loadOrders: function (callback) {
    this.setData({
      isLoading: true,
      hasError: false
    });
    
    // 计算skip值
    const skip = (this.data.currentPage - 1) * this.data.pageSize;
    
    // 调用云函数获取订单列表
    wx.cloud.callFunction({
      name: 'getAllOrders',
      data: {
        selectedStatus: this.data.currentStatus === 'all' ? '' : this.data.currentStatus,
        limit: this.data.pageSize,
        skip: skip
      },
      success: res => {
        console.log('订单列表获取成功', res);
        
        // 处理返回结果
        if (res.result && res.result.code === 0) {
          const orders = res.result.data || [];
          const total = res.result.total || 0;
          
          // 格式化订单数据
          const formattedOrders = this.formatOrdersData(orders);
          
          // 判断是否有更多数据
          const hasMore = skip + orders.length < total;
          
          this.setData({
            orderList: this.data.currentPage === 1 ? formattedOrders : [...this.data.orderList, ...formattedOrders],
            isLoading: false,
            hasMoreOrders: hasMore,
            isLoadingMore: false
          });
        } else {
          this.setData({
            isLoading: false,
            hasError: true,
            errorMsg: res.result?.message || '获取订单失败'
          });
        }
        
        if (callback) {
          callback();
        }
      },
      fail: err => {
        console.error('获取订单列表失败', err);
        this.setData({
          isLoading: false,
          hasError: true,
          errorMsg: err.message || '获取订单失败，请重试',
          isLoadingMore: false
        });
        
        if (callback) {
          callback();
        }
      }
    });
  },
  
  /**
   * 格式化订单数据
   */
  formatOrdersData: function(orders) {
    return orders.map(order => {
      // 格式化创建时间
      if (order.createTime) {
        if (typeof order.createTime === 'string') {
          order.createTimeFormatted = order.createTime;
        } else if (order.createTime.constructor === Object && order.createTime.$date) {
          order.createTimeFormatted = this.formatDate(new Date(order.createTime.$date));
        } else {
          try {
            const date = new Date(order.createTime);
            order.createTimeFormatted = this.formatDate(date);
          } catch (e) {
            console.error('日期格式化出错', e);
            order.createTimeFormatted = '日期格式错误';
          }
        }
      }
      
      return order;
    });
  },
  
  /**
   * 格式化日期
   */
  formatDate: function(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    
    return `${year}-${month}-${day} ${hour}:${minute}`;
  },
  
  /**
   * 切换订单状态
   */
  switchStatus: function(e) {
    const status = e.currentTarget.dataset.status;
    
    // 如果已经是当前选中状态，不做操作
    if (status === this.data.currentStatus) {
      return;
    }
    
    // 更新状态并重置分页
    this.setData({
      currentStatus: status,
      currentPage: 1,
      orderList: [],
      isLoading: true
    });
    
    // 重新加载订单
    this.loadOrders();
  },
  
  /**
   * 加载更多订单
   */
  loadMoreOrders: function() {
    // 如果正在加载或没有更多数据，不执行操作
    if (this.data.isLoadingMore || !this.data.hasMoreOrders) {
      return;
    }
    
    this.setData({
      isLoadingMore: true,
      currentPage: this.data.currentPage + 1
    });
    
    this.loadOrders();
  },
  
  /**
   * 重试加载
   */
  retryLoad: function() {
    this.setData({
      currentPage: 1,
      orderList: []
    });
    this.loadOrders();
  },
  
  /**
   * 跳转到订单详情页
   */
  goToOrderDetail: function(e) {
    const orderId = e.currentTarget.dataset.id;
    if (orderId) {
      wx.navigateTo({
        url: `/pages/admin-order-detail/index?id=${orderId}`,
        fail: (err) => {
          console.error('跳转订单详情页失败', err);
          wx.showToast({
            title: '页面跳转失败',
            icon: 'none'
          });
        }
      });
    }
  }
}); 