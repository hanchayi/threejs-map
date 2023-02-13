import { MapOptions } from './intefaces';
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Raycaster,
  Mesh,
  Object3D,
  Shape,
  ExtrudeGeometry,
  MeshBasicMaterial,
  LineBasicMaterial,
  Vector3,
  Vector2,
  Intersection,
  Material,
  DoubleSide,
  ShapeGeometry,
  CylinderGeometry,
  AxesHelper,
  Clock,
  TextureLoader,
  RepeatWrapping,
  PlaneGeometry,
  AmbientLight,
  MeshStandardMaterial,
  WireframeGeometry,
  LineSegments,
  Group,
} from "three";
import * as d3 from 'd3';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2';
import { Font, FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import font from 'font/build/nantong/HarmonyOS Sans SC_Regular.json';
import mapUrl from './map.png'
import groundUrl from './ground.png'
import jiangsu from 'geo/jiangsu.json'


export default class Map {
  private canvas: HTMLCanvasElement;
  private scene: Scene;
  private camera: PerspectiveCamera;
  private renderer: WebGLRenderer;
  private map: Object3D;
  private control: OrbitControls;
  private raycaster: Raycaster;
  private mouse?: Vector2;
  private options: MapOptions;
  private onMouseMove: (event: MouseEvent) => void;
  private rect: DOMRect;
  private lastPick?: Intersection<Mesh>;
  private font?: Font;
  private texts: Mesh[];
  private pyramids: Object3D[] = [];
  private clock: Clock;
  private lines: LineSegments2[] = []
  private line?: LineSegments2

  private get pyramidTopZ() {
    return this.options.depth + 0.12
  }

  private get pyramidBottomZ() {
    return this.options.depth + 0.15
  }

  private get city() {
    const city = jiangsu.features.find(f => f.properties.adcode === 320600)

    if (!city) {
      throw new Error('city not found')
    }
    return city
  }

  private get center() {
    return this.city.properties.center;
  }

  private get projection() {
    const projection = d3
      .geoMercator()
      .center(this.center as [number, number])
      .translate([0, 0])
    return projection;
  }

  constructor(canvas: HTMLCanvasElement, options: MapOptions) {
    this.canvas = canvas;
    this.rect = canvas.getBoundingClientRect();
    this.options = options;
    this.scene = new Scene();

    this.initCamera();
    this.initRenderer(canvas);
    this.initControl(canvas);
    this.initRaycaster();
    this.initAxis();
    this.font = new Font(font);
    this.clock = new Clock()
    this.render();
  }

  // 相机
  private initCamera() {
    const { options } = this;
    this.camera = new PerspectiveCamera(75, options.width / options.height, 0.1, 1000);
    const [ x, y, z ] = this.options.camera
    this.camera.position.set(x, y, z);
    this.camera.lookAt(this.scene.position);
  }

  // 渲染器
  private initRenderer(canvas: HTMLCanvasElement) {
    const renderer = new WebGLRenderer({
      canvas
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(this.options.width, this.options.height);
    this.renderer = renderer;
  }

  // 控制器，用于调整相机位置
  private initControl(canvas: HTMLCanvasElement) {
    if (!this.camera || !this.renderer) {
      throw new Error('camera and renderer must init first')
    }
    this.control = new OrbitControls(this.camera, canvas);
    // 镜头远近
    this.control.maxDistance = 5.5
    this.control.minDistance = 3
    // 前后角度
    this.control.minPolarAngle = Math.PI * 0.6
    this.control.maxPolarAngle = Math.PI * 0.9
    // 左右角度 设为固定值则不可调整
    this.control.maxAzimuthAngle = Math.PI * 2
    this.control.minAzimuthAngle = Math.PI * 2
  }

  // 刷新配置
  public changeOptions(options: MapOptions) {
    this.options = options;
    this.scene.clear();
    this.initMap();
  }

  // 初始化地图
  private initMap() {
    this.map = new Object3D();
    this.texts = []
    this.pyramids = [];
    const map = this.map;

    const geojson = this.options.geojson;
    geojson.features.forEach((elem) => {
      const texture = new TextureLoader().load( mapUrl );
      texture.wrapS = RepeatWrapping;
      texture.wrapT = RepeatWrapping;
      texture.repeat.set( 0.2, 0.3 );
      texture.center.set( 0.5, 0.5 );

      const material = new MeshStandardMaterial({
        map: texture,
        // color: this.options.mapColor,
        transparent: true,
        opacity: 0.65,
      })

      const province = this.createArea(elem.geometry.coordinates, {
        z: this.options.depth,
        adcode: elem.properties.adcode,
        depth: 0.005,
        shapeMaterial: material,
        borderColor: 0x85BFEF,
        borderWidth: 2
      })

      const [ x, y ] = this.projection(elem.properties.center) as any;

      const name = elem.properties.name;
      const text = this.createText(name);
      text.position.set(x, -y, this.options.depth + 0.1)
      this.texts.push(text);
      province.add(text)

      const pyramid = this.createPyramid()
      pyramid.position.set(x, -y, this.pyramidTopZ)
      this.pyramids.push(pyramid)
      province.add(pyramid)

      map.add(province);
      this.scene.add(map);
    })

    const city = this.city;

    const areaBottom = this.createLine(city.geometry.coordinates, {
      z: -this.options.depth / 2,
      width: 1.2,
      color: 0x96F0EF,
    })
    this.scene.add(areaBottom);

    const areaMiddle = this.createLine(city.geometry.coordinates, {
      z: -this.options.depth / 4,
      width: 1.2,
      color: 0x70D7FC,
    })
    this.scene.add(areaMiddle);
  }

  /**
   * 根据坐标创建一块区域
   *
   * @private
   * @param {*} coordinates
   * @memberof ThreeJSMap
   */
  private createArea(coordinates, options: {
    z: number,
    depth: number,
    shapeMaterial: Material,
    borderColor: number,
    borderWidth: number,
    adcode: number,
  }) {
    const area = new Object3D();
    // 坐标数组
    coordinates.forEach(polygons => {
      polygons.forEach(polygon => {
        const shape = new Shape();
        const points: Vector3[] = [];
        const pointArr: number[] = [];
        for (let i = 0; i < polygon.length; i++) {
          const [x, y] = this.projection(polygon[i] as any) as any
          if (i === 0) {
            shape.moveTo(x, -y)
          }
          shape.lineTo(x, -y);
          points.push(new Vector3(x, -y, this.options.depth));
          pointArr.push(x, -y, this.options.depth)
        }

        const mesh = new Mesh(new ExtrudeGeometry(
          shape,
          {
            depth: options.depth,
            bevelEnabled: false,
            steps: 9,
            bevelThickness: 1,
            bevelSize: 1,
            bevelOffset: 0,
            bevelSegments: 3
          }
        ), [options.shapeMaterial, new MeshBasicMaterial({
          color: options.borderColor
        })])
        area.add(mesh);
        mesh.name = 'area_' + options.adcode;
        mesh.position.z = options.z;

        const lineGeometry = new LineGeometry();
        lineGeometry.setPositions(pointArr);
        const lineMaterial = new LineMaterial({
          color: options.borderColor,
          linewidth: options.borderWidth,
          vertexColors: false,
        })
        lineMaterial.resolution.set(this.options.width, this.options.height);
        let buildoutline = new LineSegments2(lineGeometry, lineMaterial);
        buildoutline.position.z = 0.01
        buildoutline.name = 'line_' + options.adcode;
        this.lines.push(buildoutline)
        area.add(buildoutline)
      })
    })

    return area;
  }

  private createLine(coordinates, options: {
    z: number,
    color: number,
    width: number,
    name?: string
  }) {
    const line = new Object3D();
    // 坐标数组
    coordinates.forEach(polygons => {
      polygons.forEach(polygon => {
        const pointArr: number[] = [];
        for (let i = 0; i < polygon.length; i++) {
          const [x, y] = this.projection(polygon[i] as any) as any
          pointArr.push(x, -y, this.options.depth)
        }

        const lineGeometry = new LineGeometry();
        lineGeometry.setPositions(pointArr);
        const lineMaterial = new LineMaterial({
          color: options.color,
          linewidth: options.width,
          vertexColors: false,
        })
        lineMaterial.resolution.set(this.options.width, this.options.height);
        let buildoutline = new LineSegments2(lineGeometry, lineMaterial);
        buildoutline.position.z = options.z
        line.add(buildoutline)
      })
    })

    line.position.z = options.z
    if (options.name) {
      line.name = options.name;
    }
    return line;
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

  // 地面
  private initGround() {
    const texture = new TextureLoader().load( groundUrl );
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set( 16, 8 );

    const material = new MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.5,
    })
    const geometry = new PlaneGeometry( 40, 20 );
    const plane = new Mesh( geometry, material );
    this.scene.add( plane );
  }

  // axis tool
  private initAxis() {
    return
    if (!this.options.debug) {
      return
    }
    const axesHelper = new AxesHelper( 5 );
    this.scene.add( axesHelper );
  }

  /**
   * 创建一个金字塔形状
   *
   * @private
   * @memberof ThreeJSMap
   */
  private createPyramid() {
    const lineMaterial = new LineBasicMaterial( { color: 0xffffff, transparent: true, opacity: 0.5 } );

    const pyramid = new Group();
    const pyramidMaterial = new MeshBasicMaterial( { color: '#1DBAA9', transparent: true, opacity: 0.8 } );
    const pyramid1Geo = new CylinderGeometry( 0, 0.1, 0.1, 4, undefined, true)
    const pyramid1 = new Mesh( pyramid1Geo, pyramidMaterial );
    pyramid1.rotation.x = Math.PI / 2
    pyramid1.position.set(0, 0, 0.15)
    const lines1 = new LineSegments( new WireframeGeometry(pyramid1Geo), lineMaterial )
    lines1.position.set(0, 0, 0.15)
    lines1.rotation.x = Math.PI / 2
    pyramid.add(lines1);
    pyramid.add(pyramid1)

    const pyramid2Geo = new CylinderGeometry( 0, 0.1, 0.2, 4, undefined, true);
    const pyramid2 = new Mesh( pyramid2Geo, pyramidMaterial );
    pyramid2.rotation.x = -Math.PI / 2
    pyramid2.position.set(0, 0, 0)
    const lines2 = new LineSegments( new WireframeGeometry(pyramid2Geo), lineMaterial )
    lines2.position.set(0, 0, 0.0)
    lines2.rotation.x = -Math.PI / 2
    pyramid.add(pyramid2)
    pyramid.add(lines2)
    
    return pyramid;
  }

  /**
   * 创建一个中文文本
   *
   * @private
   * @param {*} text
   * @returns
   * @memberof ThreeJSMap
   */
  private createText(text) {
    if (!this.font) {
      throw new Error('no font init')
    }

    const color = 0xffffff;
    const matMark = new LineBasicMaterial({
      color,
      side: DoubleSide
    })
    const matLite = new LineBasicMaterial({
      color,
      transparent: true,
      // opacity: 0.4,
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
    const yMid = - 0.5 * ( boundingBox.max.y - boundingBox.min.y );
    geo.translate( xMid, yMid, 0 );
    const mesh = new Mesh(geo, matLite);
    return mesh
  }

  public destroy() {
    this.canvas.removeEventListener('mousemove', this.onMouseMove)
  }

  public render() {
    const light = new AmbientLight( 0xffffff, 1.8 ); // soft white light
    this.scene.add( light );
    // const directionalLight = new DirectionalLight( 0xffffff, 0.5 );
    // this.scene.add( directionalLight );
    this.initGround();
    this.initMap();

    this.animate();
  }

  private animate() {
    requestAnimationFrame(() => {
      this.animate();
    });

    const delta = this.clock.getDelta();

    this.pyramids.forEach((pyramid) => {
      pyramid.rotation.z += 1.0 * delta;
    })

    // 让字体应用相机旋转角度
    this.texts.forEach(text => {
      text.rotation.copy( this.camera.rotation );
      text.updateMatrix();
    })

    if (this.mouse) {
      // 通过摄像机和鼠标位置更新射线
      this.raycaster.setFromCamera(this.mouse, this.camera)
      // 算出射线 与当场景相交的对象有那些
      const intersects = this.raycaster.intersectObjects(
        this.scene.children,
        true
      )

      // 恢复上一次清空的
      const up = 0.02;
      if (this.lastPick) {
        this.lastPick.object.position.z -= up;
      }

      if (this.line) {
        this.line.position.z -= up;
      }

      this.lastPick = undefined;
      this.line = undefined;

      this.lastPick = intersects.find(
        (item) => item && item.object && item.object.name.includes('area')
      ) as Intersection<Mesh>;
      const area = this.lastPick && this.lastPick.object
      if (area) {
        const adcode = area.name.split('_')[1]
        area.position.z += up
        const line = this.lines.find(line => {
          return line.name === 'line_' + adcode
        })
        if (line) {
          line.position.z += up
          this.line = line;
        }
      }
    }

    this.renderer.render(this.scene, this.camera);
  }
}
