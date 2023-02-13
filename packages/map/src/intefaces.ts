export interface MapOptions {
  mapUrl: string;
  groundUrl: string;
  code: string; // 地区码
  debug?: boolean;
  width: number;
  height: number;
  camera: number[]; // 相机位置
  depth: number; // 地图厚度
  sideColor: string; // 侧边颜色
  textColor?: string;
  fillColor?: string;
  adcode: number;
}

export interface GeoJson {  // 地图数据
  properties: GeoJsonProperties;
  features: Array<{
    properties: {
      
    },
    geometry: {
      coordinates: Coordinate[]
    }
  }>
};

export interface GeoJsonProperties {
  name: string;
  adcode: number;
  center: [number, number];
  level: string;
}

export type Coordinate = Array<Array<[number, number]>>
