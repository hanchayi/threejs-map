import { ThreeJSMapOptions } from './intefaces';
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  BufferGeometry,
  ShapeGeometry,
  BoxGeometry,
  Mesh,
  Object3D,
  Shape,
  ExtrudeGeometry,
  MeshBasicMaterial,
  LineBasicMaterial,
  Vector3,
  Line,
} from "three";
import * as d3 from 'd3';
import chinaJSON from '../china-map/china.json'

export default class ThreeJSMap {
  private scene: Scene;
  private camera: PerspectiveCamera;
  private renderer: WebGLRenderer;
  private cube: Mesh;
  private map: Object3D;

  constructor(canvas: HTMLCanvasElement, options: ThreeJSMapOptions) {
    this.scene = new Scene();
    this.camera = new PerspectiveCamera(75, options.width / options.height, 0.1, 1000);
    const renderer = new WebGLRenderer({
      canvas
    });
    renderer.setSize(options.width, options.height);
    this.renderer = renderer;
    this.camera.position.z = 5;
    this.map = new Object3D();
    this.initMap();
    this.render();
  }

  private initMap() {
    // 魔卡托投影变换
    const projection = d3
      .geoMercator()
      .center([104.0, 37.5])
      .scale(80)
      .translate([0, 0])
    const map = this.map;

    chinaJSON.features.forEach((elem) => {
      const province = new Object3D();

      // 坐标数组
      const coordinates = elem.geometry.coordinates;
      coordinates.forEach(polygons => {
        polygons.forEach(polygon => {
          const shape = new Shape();
          const lineMaterial = new LineBasicMaterial({
            color: 'white'
          })

          const points: Vector3[] = [];
          for (let i = 0; i < polygon.length; i++) {
            const [x, y] = projection(polygon[i]) as any
            if (i === 0) {
              shape.moveTo(x, -y)
            }
            shape.lineTo(x, -y);
            points.push(new Vector3(x, -y, 4.01));
          }

          const extrudeSettings = {
            depth: 10,
            bevelEnabled: false,
            steps: 2,
            bevelThickness: 1,
            bevelSize: 1,
            bevelOffset: 0,
            bevelSegments: 1
          }

          // const geometry = new ExtrudeGeometry(
          //   shape,
          //   extrudeSettings
          // )
          // const material = new MeshBasicMaterial({
          //   color: '#2defff',
          //   transparent: true,
          //   opacity: 0.6,
          // })
          // const material1 = new MeshBasicMaterial({
          //   color: '#3480C4',
          //   transparent: true,
          //   opacity: 0.5,
          // })

          // const mesh = new Mesh(geometry, [material, material1])
          const lineGeometry = new BufferGeometry().setFromPoints( points );
          const line = new Line(lineGeometry, lineMaterial)
          // province.add(mesh)
          province.add(line)
        })
      })



      map.add(province);
      this.scene.add(map);
    })
  }

  private render() {
    this.animate();
  }

  private animate() {
    // requestAnimationFrame(() => {
    //   this.animate();
    // });
    this.renderer.render(this.scene, this.camera);
  }
}
