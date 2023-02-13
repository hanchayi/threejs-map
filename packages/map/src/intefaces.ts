export interface MapOptions {
  debug?: boolean;
  width: number;
  height: number;
  center: number[]; // 地图中心经纬度
  camera: number[]; // 相机位置
  depth: number; // 地图厚度
  mapColor: string; // 地图颜色
  sideColor: string; // 侧边颜色
  hoverColor?: string; // 鼠标经过的颜色
  geojson: {  // 地图数据
    features: Array<{
      properties: {
        name: string;
        adcode: number;
        center: [number, number];
      },
      geometry: {
        coordinates: Coordinate[]
      }
    }>
  };
  borderWidth?: number;
  borderColor?: string;
  textColor?: string;
  fillColor?: string;
  backgroundColor?: string;
}

export type Coordinate = Array<Array<[number, number]>>
