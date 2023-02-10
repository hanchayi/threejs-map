# threejs-map


## 对标
http://36.156.159.239:10000/9uBtlhzIssyIdEvy/

## geojson数据源
http://datav.aliyun.com/portal/school/atlas/area_selector


## 物体相对于摄像机静止
https://blog.csdn.net/mu399/article/details/94723921

## 中文字体

这是官方的[文本](https://github.com/mrdoob/three.js/blob/master/examples/webgl_geometry_text_shapes.html)示例

通过FileLoader加载typeface.json

但这个官方实例不支持中文，所以我们需要到[facetype](http://gero3.github.io/facetype.js/)进行一次转换

> 注意必须ttf文件，ttc不支持

Mac的字体目录 `/System/Library/Fonts`
Windows的字体目录 `C:\Windows\Fonts`

## 字体

https://font.qqe2.com/ 在线预览字体
字体下载 https://www.100font.com/
字体编辑 Glyphs for Mac
字体子集化 https://www.npmjs.com/package/fontmin


## 线形问题
https://blog.csdn.net/wclwksn2019/article/details/125496544

## threejs根据Geometry画LineSigments
参考这个源码
https://threejs.org/docs/scenes/geometry-browser.html#CylinderGeometry

## threejs 一个组统一设置坐标
组合对象统一旋转，自对象的坐标相对于父的
https://blog.csdn.net/qq_30100043/article/details/79547532

## reference

[3d可视化地图](https://juejin.cn/post/6980983551399788580)
