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
  DoubleSide,
  ShapeGeometry,
} from "three";
import * as d3 from 'd3';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { Font, FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import font from 'font/build/nantong/HarmonyOS Sans SC_Regular.json';

export default class ThreeJSMap {
  private canvas: HTMLCanvasElement;
  private scene: Scene;
  private camera: PerspectiveCamera;
  private renderer: WebGLRenderer;
  private map: Object3D;
  private control: OrbitControls;
  private raycaster: Raycaster;
  private mouse?: Vector2;
  private options: ThreeJSMapOptions;
  private onMouseMove: (event: MouseEvent) => void;
  private rect: DOMRect;
  private lastPick?: Intersection<Mesh>;
  private font?: Font;

  constructor(canvas: HTMLCanvasElement, options: ThreeJSMapOptions) {
    this.canvas = canvas;
    this.rect = canvas.getBoundingClientRect();
    this.options = options;
    this.scene = new Scene();
    this.initCamera(options);
    this.initRenderer(canvas, options);
    this.initControl(canvas);
    this.initRaycaster();
    this.font = new Font(font);
    this.render();
  }

  // 相机
  private initCamera(options: ThreeJSMapOptions) {
    this.camera = new PerspectiveCamera(75, options.width / options.height, 0.1, 1000);
    const [ x, y, z ] = this.options.camera
    this.camera.position.set(x, y, z);
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
      .center(this.options.center as [number, number])
      .translate([0, 0])
    const map = this.map;

    const geojson = this.options.geojson;
    geojson.features.forEach((elem) => {
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
            const [x, y] = projection(polygon[i] as any) as any
            if (i === 0) {
              shape.moveTo(x, -y)
            }
            shape.lineTo(x, -y);
            points.push(new Vector3(x, -y, this.options.depth));
          }

          const extrudeSettings = {
            depth: this.options.depth,
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
            color: this.options.mapColor,
            // transparent: true,
            // opacity: 0.6,
          })
          const material1 = new MeshBasicMaterial({
            color: this.options.sideColor,
            // transparent: true,
            // opacity: 0.5,
          })

          const mesh = new Mesh(geometry, [material, material1])
          const lineGeometry = new BufferGeometry().setFromPoints( points );
          const line = new Line(lineGeometry, lineMaterial)
          province.add(mesh)
          province.add(line)
        })
      })


      const [ x, y ] = projection(elem.properties.center) as any;
      const name = elem.properties.name;
      const text = this.createText(name);
      text.position.x = x;
      text.position.y = y;
      text.position.z = this.options.depth + 0.1;
      province.add(text)

      map.add(province);
      this.scene.add(map);
    })
  }

  // 射线追踪
  private initRaycaster() {
    this.raycaster = new Raycaster();
    this.onMouseMove = (event) => {
      this.mouse = new Vector2();
      // 将鼠标位置归一化为设备坐标。x 和 y 方向的取值范围是 (-1 to +1)
      this.mouse.x = ((event.clientX - this.rect.left )/ this.options.width) * 2 - 1
      this.mouse.y = -((event.clientY - this.rect.top) / this.options.height) * 2 + 1
    }

    this.canvas.addEventListener('mousemove', this.onMouseMove, false)
  }

  private createText(text) {
    console.log('createText', text)
    if (!this.font) {
      throw new Error('no font init')
    }

    const color = 0x006699;
    const matMark = new LineBasicMaterial({
      color,
      side: DoubleSide
    })
    const matLite = new LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.4,
      side: DoubleSide,
    })
    const shapes = this.font.generateShapes(text, 0.1)
    const geo = new ShapeGeometry(shapes)
    geo.computeBoundingBox()
    const boundingBox = geo.boundingBox;

    if (!boundingBox) {
      throw new Error('no boundingBox')
    }

    const xMid = - 0.5 * ( boundingBox.max.x - boundingBox.min.x );
    geo.translate( xMid, 0, 0 );
    const mesh = new Mesh(geo, matLite);
    return mesh
  }

  // private createText(text: string, options: {
  //   font: Font;
  //   size: number;
  //   height: number;
  //   curveSegments: number;
  //   bevelEnabled: boolean;
  //   bevelThickness: number;
  //   bevelSize: number;
  //   bevelOffset: number;
  //   bevelSegments: number;
  // }) {
  //   const textGeo = new TextGeometry(text, options);
  //   textGeo.computeBoundingBox();
  //   const boundingBox = textGeo.boundingBox;

  //   const materials = [
  //     new MeshPhongMaterial( { color: 0xffffff, flatShading: true } ), // front
  //     new MeshPhongMaterial( { color: 0xffffff } ) // side
  //   ];

  //   if (!boundingBox) {
  //     return;
  //   }

  //   const centerOffset = - 0.5 * ( boundingBox.max.x - boundingBox.min.x );
  //   textMesh = new Mesh( textGeo, materials );
  // }

  public destroy() {
    this.canvas.removeEventListener('mousemove', this.onMouseMove)
  }

  public render() {
    this.initMap();
    this.animate();
  }

  private animate() {
    requestAnimationFrame(() => {
      this.animate();
    });

    if (this.mouse) {
      // 通过摄像机和鼠标位置更新射线
      this.raycaster.setFromCamera(this.mouse, this.camera)
      // 算出射线 与当场景相交的对象有那些
      const intersects = this.raycaster.intersectObjects(
        this.scene.children,
        true
      )

      // 恢复上一次清空的
      if (this.lastPick) {
        this.lastPick.object.material[0].color.set(this.options.mapColor)
        this.lastPick.object.material[1].color.set(this.options.sideColor)
      }
      this.lastPick = undefined
      this.lastPick = intersects.find(
        (item) => item && item.object && (item.object as Mesh).material && ((item.object as Mesh).material as Material[]).length === 2
      ) as Intersection<Mesh>;
      if (this.lastPick) {
        this.lastPick.object.material[0].color.set(this.options.hoverColor)
        this.lastPick.object.material[1].color.set(this.options.hoverColor)
      }
    }

    this.renderer.render(this.scene, this.camera);
  }
}
