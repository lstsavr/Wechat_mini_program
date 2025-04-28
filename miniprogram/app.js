// app.js
App({
  onLaunch: function () {
    try {
      if (!wx.cloud) {
        console.error("请使用 2.2.3 或以上的基础库以使用云能力");
      } else {
        wx.cloud.init({
          // env 参数说明：
          //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
          //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
          //   如不填则使用默认环境（第一个创建的环境）
          env: "cloud1-1gxxqcpl824b3617",
          traceUser: true,
        });
        console.log('云环境初始化成功');
        
        // 确保必要的集合存在
        this.ensureCollectionsExist();
        
        // 自动登录/注册用户
        this.autoLoginUser();
        
        // 自动获取用户信息
        this.getUserInfoFromCloud();
      }

      // 检查基础库版本
      const version = wx.getSystemInfoSync().SDKVersion;
      console.log('基础库版本：', version);
      if (this.compareVersion(version, '2.20.1') < 0) {
        wx.showModal({
          title: '提示',
          content: '当前微信版本过低，无法正常使用该功能，请升级到最新微信版本后重试。',
          showCancel: false
        });
      }
    } catch (e) {
      console.error('初始化过程出错', e);
    }

    this.globalData = {
      userInfo: null,
      isLogin: false
    };
  },
  
  // 自动登录/注册用户
  autoLoginUser: function() {
    wx.cloud.callFunction({
      name: 'loginUser',
      data: {},
      success: res => {
        console.log('用户自动登录/注册成功', res);
        if (res.result && res.result.success) {
          // 如果是新用户，打印欢迎信息
          if (res.result.isNewUser) {
            console.log('欢迎新用户，已自动创建账号');
          }
        }
      },
      fail: err => {
        console.error('用户自动登录/注册失败', err);
      }
    });
  },
  
  // 确保必要的集合存在
  ensureCollectionsExist: function() {
    const db = wx.cloud.database();
    
    // 检查orders集合
    db.collection('orders').count()
      .then(res => {
        console.log('orders集合存在，当前记录数:', res.total);
      })
      .catch(err => {
        console.log('orders集合可能不存在，尝试创建...');
        // 尝试创建测试记录以确保集合存在
        db.collection('orders').add({
          data: {
            _createTime: new Date(),
            _test: true,
            status: 'test'
          }
        }).then(res => {
          console.log('创建orders集合成功');
          // 删除测试记录
          db.collection('orders').doc(res._id).remove();
        }).catch(error => {
          console.error('创建orders集合失败', error);
        });
      });
    
    // 检查users集合
    db.collection('users').count()
      .then(res => {
        console.log('users集合存在，当前记录数:', res.total);
      })
      .catch(err => {
        console.log('users集合可能不存在，尝试创建...');
      });
  },
  
  // 从云函数获取用户信息并自动注册
  getUserInfoFromCloud: function() {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    
    wx.cloud.callFunction({
      name: 'getUserInfo',
      data: {},
      success: res => {
        console.log('获取用户信息成功', res);
        if (res.result && res.result.success) {
          // 更新全局变量
          this.globalData.userInfo = res.result.data;
          this.globalData.isLogin = true;
          
          // 保存到本地存储
          wx.setStorageSync('userInfo', res.result.data);
          
          // 如果是新用户，打印日志
          if (res.result.isNewUser) {
            console.log('欢迎新用户', res.result.data);
          }
          
          // 触发用户信息更新回调
          if (this.userInfoReadyCallback) {
            this.userInfoReadyCallback(res.result.data);
          }
        } else {
          console.error('获取用户信息失败:', res.result.errMsg);
        }
      },
      fail: err => {
        console.error('调用getUserInfo云函数失败', err);
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },
  
  // 检查并更新登录状态
  checkLoginStatus: function() {
    // 从本地缓存获取用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.globalData.userInfo = userInfo;
      this.globalData.isLogin = true;
      return true;
    }
    
    // 如果本地没有，尝试从云端获取
    this.getUserInfoFromCloud();
    return this.globalData.isLogin;
  },

  // 比较版本号
  compareVersion: function(v1, v2) {
    v1 = v1.split('.');
    v2 = v2.split('.');
    const len = Math.max(v1.length, v2.length);

    while (v1.length < len) {
      v1.push('0');
    }
    while (v2.length < len) {
      v2.push('0');
    }

    for (let i = 0; i < len; i++) {
      const num1 = parseInt(v1[i]);
      const num2 = parseInt(v2[i]);

      if (num1 > num2) {
        return 1;
      } else if (num1 < num2) {
        return -1;
      }
    }
    return 0;
  }
});
