# Wechat_mini_program
# 一个相机租赁小程序

这是一个基于微信小程序开发的相机租赁平台，用户可以浏览相机列表、查看详细信息、预约租赁，并通过小程序与商户直接联系。  
支持租赁时间管理、库存数量控制和预约成功消息推送通知。商户可以通过后台管理订单和店铺信息。  
该小程序前端是由wxml，wxss，JavaScript语言实现，类似于html，css，JavaScript，而后端主要是由微信云开发平台(即不同的云函数)实现

---

## 核心功能
- 浏览相机信息（名称、描述、租赁价格规则）
- 在线预约租赁，并选择租赁日期
- 自动判断库存数量，超出不可预约
- 用户订单管理（查看订单、取消订单）
- 商户后台订单管理（查看全部订单、修改订单状态）
- 商户联系方式管理与展示
- 租赁须知管理（商户自定义内容）
- 微信订阅消息推送预约通知

---

## 技术实现
- 小程序前端：微信原生框架（WXML + WXSS + JS）
- 后端：微信云开发（Cloud Functions）
- 数据库：云数据库（collections：cameras、orders、users、merchant-info）
- 消息推送：微信订阅消息（Template ID: ChzTXY2_g-kHUCmR6_I21ZanceI1RnEhrwb4-EIRTmE）
- 版本控制：Git + GitHub

---

## 项目特点
- 实现了基于库存数量的动态预约限制，避免超额租赁
- 支持商户自主管理租赁须知和联系方式，无需硬编码
- 用户下单后自动推送预约成功消息，提高用户体验
- 前后端逻辑清晰，模块划分明确，便于后续扩展支付功能(此时暂无开发支付功能，支付功能会在后期考虑是否添加)

---

## 本地运行指南
1. 克隆本仓库：
   ```bash
   git clone https://github.com/lstsavr/Wechat_mini_program.git
