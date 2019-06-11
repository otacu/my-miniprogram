// pages/route/route.js
var amapFile = require('../../libs/amap-wx.js');
var myAmapFun;
var markersData = new Map();
const PIN_BLUE_ICON_PATH = '../../icon/pin_blue.png';
const PIN_RED_ICON_PATH = '../../icon/pin_red.png';
const ADD_ICON_PATH = '../../icon/add_blue.png';
const DELETE_ICON_PATH = '../../icon/delete_blue.png';
const UP_ICON_PATH = '../../icon/up_blue.png';
const DOWN_ICON_PATH = '../../icon/down_blue.png';
const DOCUMENT_ICON_PATH = '../../icon/document_blue.png';
const AMAP_WXJS_KEY = '678c4b4389139c387aaa7e143d7ad57d';
const AMAP_WEB_KEY = '481e913c5c18b06c9ab256f22a1fe769';
var city;
var routePoiMap = new Map();
var selectedMarker;

Page({

  /**
   * 页面的初始数据
   */
  data: {
    markers: [],
    latitude: '',
    longitude: '',
    controls: [],
    polyline: [],
    textData:{
      name:'',
      address:'',
      ranking:'',
      rankingHidden:true
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    myAmapFun = new amapFile.AMapWX({ key: AMAP_WXJS_KEY });
    // 获取定位和城市
    myAmapFun.getRegeo({
      success: function (res) {
        that.setData({
          longitude: res[0].longitude,
          latitude: res[0].latitude
        });
        city = res[0].regeocodeData.addressComponent.city;
      }
    });
    // 添加浮动按钮
    wx.getSystemInfo({
      success: function (res) {
        that.setData({
          controls: [
            //新增
            {
              id: 1,
              iconPath: ADD_ICON_PATH,
              position: {
                left: res.windowWidth-50,
                top: 150 + 50,
                width: 50,
                height: 50
              },
              clickable: true
            },
            //删除
            {
              id: 2,
              iconPath: DELETE_ICON_PATH,
              position: {
                left: res.windowWidth - 50,
                top: 150 + 50 + (5 +50),
                width: 50,
                height: 50
              },
              clickable: true
            },
            //顺序前移
            {
              id: 3,
              iconPath: UP_ICON_PATH,
              position: {
                left: res.windowWidth - 50,
                top: 150 + 50 + (5 + 50)*2,
                width: 50,
                height: 50
              },
              clickable: true
            },
            //顺序后移
            {
              id: 4,
              iconPath: DOWN_ICON_PATH,
              position: {
                left: res.windowWidth - 50,
                top: 150 + 50 + (5 + 50) * 3,
                width: 50,
                height: 50
              },
              clickable: true
            },
            //保存
            {
              id: 5,
              iconPath: DOCUMENT_ICON_PATH,
              position: {
                left: res.windowWidth - 50,
                top: 150 + 50 + (5 + 50) * 4,
                width: 50,
                height: 50
              },
              clickable: true
            }
          ]
        });
      }
    });
    //查询用户保存过的路线
    wx.request({
      url: 'https://beloveyuno.com/miniprogram/route/get',
      data: {
        openId: wx.getStorageSync('openId') || ''
      },
      method: 'POST',
      success: function (respnse) {
        console.log(respnse.data);
        if (respnse.data.status == 200) {
          let routePointList=respnse.data.data;
          routePointList.forEach(function (item) {
            let routeMarker = {
              id: item.markerId, longitude: item.longitude, latitude: item.latitude, address: item.address, name: item.name, width: 22, height: 32, iconPath: PIN_RED_ICON_PATH, poiId: item.poiId, isSearchResult: false, callout: { content: item.name + '\n' + item.address, color: '#FFFFFF', bgColor: '#DE432A', fontSize: 15, borderRadius: 5, padding: 5, display: 'BYCLICK' }
            }
            markersData.set(item.markerId, routeMarker);
            routePoiMap.set(item.poiId, routeMarker);
          });
          // 重新标路线点
          let tempArray = [];
          markersData.forEach(function (item) {
            tempArray.push(item);
          });
          that.setData({
            markers: tempArray
          });
          // 重新绘制路线
          let points = [];
          routePoiMap.forEach(function (item) {
            points.push(item);
          });
          let polyline = [{
            points: points,
            color: "#DB3E2D",
            width: 5,
            dottedLine: false
          }];
          that.setData({
            polyline: polyline
          });
        }
      }
    });

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },
  /**
   * 覆盖物点击事件
   */
  makertap: function (e) {
    var id = e.markerId;
    var that = this;
    selectedMarker = markersData.get(id);
    that.showMarkerInfo();
  },
  /**
   * 搜索
   */
  bindConfirm: function (e) {
    var that = this;
    // 清除地图上的搜索结果
    markersData.forEach(function (item) {
      if (item.isSearchResult) {
        markersData.delete(item.id);
      }
    });
    let tempArray = [];
    markersData.forEach(function (item) {
      tempArray.push(item);
    });
    that.setData({
      markers: tempArray
    });
    // 关键字为空直接返回
    var keywords = e.detail.value;
    if (keywords.trim() =='') {
       return false;
    }
    // 发送搜索请求
    wx.request({
      url: "https://restapi.amap.com/v3/place/text?parameters",
      data: {
        key: AMAP_WEB_KEY,
        keywords: keywords,
        city: city,
        citylimit: true
      },
      method: "GET",
      success: function (b) {
        var pois = b.data.pois;
        var latSum = 0;
        var lngSum = 0;
        for (var j = 0; j < pois.length; j++) {
          var poi_location = pois[j].location.split(",");
          lngSum += Number(poi_location[0]);
          latSum += Number(poi_location[1]);
          // 路线中已经有这点
          if (routePoiMap.get(pois[j].id)) {
            continue;
          }
          let id = new Date().getTime();
          id = Number("" + id + j)
          var marker = {
            id: id, longitude: poi_location[0], latitude: poi_location[1], address: pois[j].address, name: pois[j].name, width: 22, height: 32, iconPath: PIN_BLUE_ICON_PATH, poiId: pois[j].id, isSearchResult:true, callout: { content: pois[j].name + '\n' + pois[j].address, color: '#FFFFFF', bgColor:'#3AA0EF',fontSize: 15,borderRadius: 5,padding: 5, display: 'BYCLICK'} }
          markersData.set(id, marker);
        }
        let tempArray = [];
        markersData.forEach(function (item) {
          tempArray.push(item);
        });
        that.setData({
          markers: tempArray
        });
        // 设置中心点
        that.setData({
          latitude: latSum / pois.length
        });
        that.setData({
          longitude: lngSum / pois.length
        });
      },
      fail: function (b) {
        a.fail({
          errCode: "0",
          errMsg: b.errMsg || ""
        })
      }
    });

  },
  /**
   * 地图悬浮按钮点击事件
   */
  bindcontroltap: function (e) {
    var that = this;
    if (!selectedMarker) {
       return false;
    }
    // 添加到路线
    if (e.controlId==1) {
      // 点击的是路线点的话不做处理
      if (!selectedMarker.isSearchResult) {
        return false;
      }
      // 路线中已经有这点
      if (routePoiMap.get(selectedMarker.poiId)) {
        return false;
      }
      // 删掉点击的那个搜索结果点
      markersData.delete(selectedMarker.id);
      let id = new Date().getTime();
      let routeMarker = {
        id: id, longitude: selectedMarker.longitude, latitude: selectedMarker.latitude, address: selectedMarker.address, name: selectedMarker.name, width: 22, height: 32, iconPath: PIN_RED_ICON_PATH, poiId: selectedMarker.poiId, isSearchResult: false, callout: { content: selectedMarker.name + '\n' + selectedMarker.address, color: '#FFFFFF', bgColor: '#DE432A', fontSize: 15, borderRadius: 5, padding: 5, display: 'BYCLICK' }
      }
      markersData.set(id,routeMarker);
      routePoiMap.set(selectedMarker.poiId, routeMarker);
      selectedMarker = routeMarker;
    }
    // 从路线里删除
    if (e.controlId == 2){
      routePoiMap.delete(selectedMarker.poiId);
      markersData.delete(selectedMarker.id);
      selectedMarker = undefined;
    }
    if (e.controlId == 1 || e.controlId == 2) {
      // 重新标路线点
      var tempArray = [];
      markersData.forEach(function (item) {
        tempArray.push(item);
      });
      that.setData({
        markers: tempArray
      });
    }
    // 移序
    let routePoiArray = Array.from(routePoiMap);
    if (e.controlId == 3 || e.controlId == 4) {
      // 点击的是搜索结果点的话不做处理
      if (selectedMarker.isSearchResult) {
        return false;
      }
      let offset = 0;
      if (e.controlId == 3){
        offset = -1;
      } else {
        offset = 1;
      }
      let sourceIndex = 0;
      for (var i = 0; i < routePoiArray.length;i++) {
        let poi = routePoiArray[i];
        if (poi[0] == selectedMarker.poiId) {
          sourceIndex=i;
          break;
        }
      }
      if (sourceIndex == 0 && offset==-1) {
        let sourcePoi = routePoiArray[sourceIndex];
        routePoiArray.splice(0,1);
        routePoiArray.push(sourcePoi);
      } else if ((sourceIndex == routePoiArray.length - 1) && offset == 1) {
        let sourcePoi = routePoiArray[sourceIndex];
        routePoiArray.pop();
        routePoiArray = [sourcePoi].concat(routePoiArray);
      } else {
        let targetIndex = sourceIndex + offset;
        let sourcePoi = routePoiArray[sourceIndex];
        let targetPoi = routePoiArray[targetIndex];
        routePoiArray[sourceIndex] = targetPoi;
        routePoiArray[targetIndex] = sourcePoi;
      }
      routePoiMap = new Map();
      routePoiArray.forEach(function (item) {
        routePoiMap.set(item[0],item[1]);
      });
    }
    if (e.controlId == 1 || e.controlId == 2 || e.controlId == 3 || e.controlId == 4) {
      // 更新文字信息
      that.showMarkerInfo();
      // 重新绘制路线
      var points = [];
      routePoiMap.forEach(function (item) {
        points.push(item);
      });
      var polyline = [{
        points: points,
        color: "#DB3E2D",
        width: 5,
        dottedLine: false
      }];
      that.setData({
        polyline: polyline
      });
    }
    //保存路线
    if (e.controlId == 5){
      let openId = wx.getStorageSync('openId');
      console.log(routePoiMap);
      let routePointList = [];
      let i=1;
      for (let [key, item] of routePoiMap) {
        let routePoint = {
          id: null, openId: openId, markerId: item.id, poiId: item.poiId, longitude: item.longitude, latitude: item.latitude, name: item.name, address: item.address, order: i
        }
        routePointList.push(routePoint);
        i++;
      }
      wx.request({
        url: 'https://beloveyuno.com/miniprogram/route/save',
        data: {
          route: routePointList
        },
        method: 'POST',
        success: function (respnse) {
          console.log(respnse.data);
          if (respnse.data.status == 200) {

          } else {
            //TODO 自动消失的错误提示
          }
        }
      });
    }
  },
  /**
   * 显示地点信息
   */
  showMarkerInfo: function () {
    var that = this;
    let name = '';
    let address = '';
    let ranking = '';
    let rankingHidden = true;
    if (selectedMarker) {
      name = selectedMarker.name;
      address = selectedMarker.address;
      rankingHidden = selectedMarker.isSearchResult;
      let routePoiArray = Array.from(routePoiMap);
      for (let i = 0; i < routePoiArray.length; i++) {
        if (routePoiArray[i][0] == selectedMarker.poiId) {
          ranking = '第' + (i + 1) + '站';
          break;
        }
      }
    }
    that.setData({
      textData: {
        name: name,
        address: address,
        ranking: ranking,
        rankingHidden: rankingHidden
      }
    });
  }

})