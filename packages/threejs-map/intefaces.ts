export interface ThreeJSMapOptions {
  width: number;
  height: number;
  center: number[]; // 地图中心经纬度
  camera: number[]; // 相机位置
  depth: number; // 地图厚度
  geojson: {  // 地图数据
    features: Array<{
      geometry: {
        coordinates: Array<Array<[number, number]>>
      }
    }>
  };
  borderWidth?: number;
  borderColor?: string;
  textColor?: string;
  fillColor?: string;
  hoverColor?: string;
  backgroundColor?: string;
}
