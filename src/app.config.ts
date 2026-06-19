export default defineAppConfig({
  pages: [
    'pages/assessment/index',
    'pages/package/index',
    'pages/confirm/index',
    'pages/history/index',
    'pages/detail/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#00A896',
    navigationBarTitleText: '洁牙套餐助手',
    navigationBarTextStyle: 'white',
    backgroundColor: '#F8FAF9'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#00A896',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/assessment/index',
        text: '口腔评估'
      },
      {
        pagePath: 'pages/package/index',
        text: '套餐建议'
      },
      {
        pagePath: 'pages/confirm/index',
        text: '方案确认'
      },
      {
        pagePath: 'pages/history/index',
        text: '历史记录'
      }
    ]
  }
})
