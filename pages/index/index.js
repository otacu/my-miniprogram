//index.js
//获取应用实例
const app = getApp()

Page({
  data: {

  },
  onLoad: function () {

  },
  bindRouteButtonTap: function () {
    wx.navigateTo({
      url: '../route/route'
    })
  }
})
