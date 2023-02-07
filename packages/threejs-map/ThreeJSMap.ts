import { ThreeJSMapOptions } from './intefaces';
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Raycaster,
  BufferGeometry,
  Mesh,
  Object3D,
  Shape,
  ExtrudeGeometry,
  MeshBasicMaterial,
  LineBasicMaterial,
  Vector3,
  Line,
  Vector2,
  Intersection,
  Material,
} from "three";
import * as d3 from 'd3';
import chinaJSON from '../china-map/china.json'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export default class ThreeJSMap {
  private canvas: HTMLCanvasElement;
  private scene: Scene;
  private camera: PerspectiveCamera;
  private renderer: WebGLRenderer;
  private map: Object3D;
  private control: OrbitControls;
  private raycaster: Raycaster;
  private mouse: Vector2;
  private options: ThreeJSMapOptions;
  private onMouseMove: (event: MouseEvent) => void;
  private rect: DOMRect;
  private lastPick?: Intersection<Mesh>;

  constructor(canvas: HTMLCanvasElement, options: ThreeJSMapOptions) {
    this.canvas = canvas;
    this.rect = canvas.getBoundingClientRect();
    this.options = options;
    this.scene = new Scene();
    this.initCamera(options);
    this.initRenderer(canvas, options);
    this.initControl(canvas);
    this.initMap();
    this.initRaycaster();
    this.render();
  }

  // 相机
  private initCamera(options: ThreeJSMapOptions) {
    this.camera = new PerspectiveCamera(75, options.width / options.height, 0.1, 1000);
    this.camera.position.set(0, 0, 120);
    this.camera.lookAt(this.scene.position);
  }

  // 渲染器
  private initRenderer(canvas: HTMLCanvasElement, options: ThreeJSMapOptions) {
    const renderer = new WebGLRenderer({
      canvas
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(options.width, options.height);
    this.renderer = renderer;
  }

  // 控制器，用于调整相机位置
  private initControl(canvas: HTMLCanvasElement) {
    if (!this.camera || !this.renderer) {
      throw new Error('camera and renderer must init first')
    }
    this.control = new OrbitControls(this.camera, canvas);
  }

  // 刷新配置
  public changeOptions(options: ThreeJSMapOptions) {
    this.options = options;
    this.scene.clear();
    this.initMap();
  }

  // 初始化地图
  private initMap() {
    this.map = new Object3D();
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
            color: this.options.borderColor || 'white',
            linewidth: Number(this.options.borderWidth) || 1
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

          const geometry = new ExtrudeGeometry(
            shape,
            extrudeSettings
          )
          const material = new MeshBasicMaterial({
            color: '#2defff',
            transparent: true,
            opacity: 0.6,
          })
          const material1 = new MeshBasicMaterial({
            color: '#3480C4',
            transparent: true,
            opacity: 0.5,
          })

          const mesh = new Mesh(geometry, [material, material1])
          const lineGeometry = new BufferGeometry().setFromPoints( points );
          const line = new Line(lineGeometry, lineMaterial)
          province.add(mesh)
          province.add(line)
        })
      })

      map.add(province);
      this.scene.add(map);
    })
  }

  // 射线追踪
  private initRaycaster() {
    this.raycaster = new Raycaster();
    this.mouse = new Vector2();
    this.onMouseMove = (event) => {
      // 将鼠标位置归一化为设备坐标。x 和 y 方向的取值范围是 (-1 to +1)
      this.mouse.x = ((event.clientX - this.rect.left )/ this.options.width) * 2 - 1
      this.mouse.y = -((event.clientY - this.rect.top) / this.options.height) * 2 + 1
    }

    this.canvas.addEventListener('mousemove', this.onMouseMove, false)
  }

  public destroy() {
    this.canvas.removeEventListener('mousemove', this.onMouseMove)
  }

  private render() {
    this.animate();
  }

  private animate() {
    requestAnimationFrame(() => {
      this.animate();
    });
    // 通过摄像机和鼠标位置更新射线
    this.raycaster.setFromCamera(this.mouse, this.camera)
    // 算出射线 与当场景相交的对象有那些
    const intersects = this.raycaster.intersectObjects(
      this.scene.children,
      true
    )

    // 恢复上一次清空的
    if (this.lastPick) {
      this.lastPick.object.material[0].color.set('#2defff')
      this.lastPick.object.material[1].color.set('#3480C4')
    }
    this.lastPick = undefined
    this.lastPick = intersects.find(
      (item) => item && item.object && (item.object as Mesh).material && ((item.object as Mesh).material as Material[]).length === 2
    ) as Intersection<Mesh>;
    if (this.lastPick) {
      this.lastPick.object.material[0].color.set(0xff0000)
      this.lastPick.object.material[1].color.set(0xff0000)
    }

    this.renderer.render(this.scene, this.camera);
  }
}
