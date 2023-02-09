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
  CylinderGeometry,
  MeshPhongMaterial,
  BoxGeometry,
  MeshLambertMaterial,
  AxesHelper,
  Clock,
  TextureLoader,
  RepeatWrapping,
  PlaneGeometry,
  sRGBEncoding,
  AmbientLight,
  DirectionalLight,
  MeshStandardMaterial,
} from "three";
import * as d3 from 'd3';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { Font, FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import font from 'font/build/nantong/HarmonyOS Sans SC_Regular.json';
import mapUrl from './map.png'
import groundUrl from './ground.png'
import jiangsu from 'geo/jiangsu.json'


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
  private texts: Mesh[];
  private pyramids: Object3D[] = [];
  private clock: Clock;

  private get pyramidTopZ() {
    return this.options.depth + 0.3
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

  constructor(canvas: HTMLCanvasElement, options: ThreeJSMapOptions) {
    this.canvas = canvas;
    this.rect = canvas.getBoundingClientRect();
    this.options = options;
    this.scene = new Scene();

    this.initCamera();
    this.initRenderer(canvas, options);
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
    this.texts = []
    this.pyramids = [];
    const map = this.map;

    const geojson = this.options.geojson;
    geojson.features.forEach((elem) => {
      const texture = new TextureLoader().load( mapUrl );
      texture.wrapS = RepeatWrapping;
      texture.wrapT = RepeatWrapping;
      texture.repeat.set( 0.3, 0.3 );

      const material = new MeshStandardMaterial({
        map: texture,
        // color: this.options.mapColor,
        transparent: true,
        opacity: 0.65,
      })

      const province = this.createArea(elem.geometry.coordinates, {
        z: this.options.depth,
        depth: 0.005,
        shapeMaterial: material,
        borderColor: '#85BFEF'
      })

      const [ x, y ] = this.projection(elem.properties.center) as any;

      const name = elem.properties.name;
      const text = this.createText(name);
      text.position.set(x, -y, this.options.depth + 0.1)
      this.texts.push(text);
      province.add(text)

      const [ pyramid, pyramid1, pyramid2 ] = this.createPyramid()
      pyramid1.position.set(x, -y, this.pyramidTopZ)
      pyramid2.position.set(x, -y, this.pyramidBottomZ)
      province.add(pyramid)
      // province.add(pyramid2)
      this.pyramids.push(pyramid1)
      this.pyramids.push(pyramid2)

      map.add(province);
      this.scene.add(map);
    })

    const city = this.city;

    const areaBottom = this.createArea(city.geometry.coordinates, {
      z: 0,
      depth: 0.005,
      shapeMaterial: new MeshBasicMaterial({
        transparent: true,
        opacity: 0,
      }),
      borderColor: '#96F0EF'
    })
    this.scene.add(areaBottom);

    const areaMiddle = this.createArea(city.geometry.coordinates, {
      z: this.options.depth / 2,
      depth: 0.005,
      shapeMaterial: new MeshBasicMaterial({
        transparent: true,
        opacity: 0,
      }),
      borderColor: '#70D7FC',
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
    borderColor: string,
  }) {
    const area = new Object3D();
    // 坐标数组
    coordinates.forEach(polygons => {
      polygons.forEach(polygon => {
        const shape = new Shape();

        const lineMaterial = new LineBasicMaterial({
          // color: this.options.borderColor || 'white',
          color: options.borderColor,
          // linewidth: Number(options.borderColor) || 1
          linewidth: 2
        })

        const points: Vector3[] = [];
        for (let i = 0; i < polygon.length; i++) {
          const [x, y] = this.projection(polygon[i] as any) as any
          if (i === 0) {
            shape.moveTo(x, -y)
          }
          shape.lineTo(x, -y);
          points.push(new Vector3(x, -y, this.options.depth));
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
        mesh.position.z = options.z;

        const lineGeometry = new BufferGeometry().setFromPoints( points );
        const line = new Line(lineGeometry, lineMaterial)
        area.add(line)
      })
    })

    return area;
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
    // const groundGeometry = new BoxGeometry( 10, 10, 10);
    // const groundMaterial = new MeshBasicMaterial( { color: 'white' } );
    // const groundMesh = new Mesh( groundGeometry, groundMaterial );
    // groundMesh.position.z = -1;
    // this.scene.add( groundMesh );
    const texture = new TextureLoader().load( groundUrl );
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set( 8, 8 );

    const material = new MeshBasicMaterial({
      map: texture,
      // color: this.options.mapColor,
      transparent: true,
      opacity: 0.5,
    })
    const geometry = new PlaneGeometry( 20, 20 );
    // const material = new MeshBasicMaterial( {color: 0xffff00, side: DoubleSide} );
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
    const pyramid = new Object3D();
    const pyramidMaterial = new MeshBasicMaterial( { color: '#1DBAA9', transparent: true, opacity: 0.8 } );
    const pyramid1 = new Mesh( new CylinderGeometry( 0, 0.1, 0.1, 4), pyramidMaterial );
    pyramid1.rotation.x = Math.PI / 2
    const pyramid2 = new Mesh( new CylinderGeometry( 0, 0.1, 0.2, 4), pyramidMaterial );
    pyramid2.rotation.x = -Math.PI / 2
    pyramid.add(pyramid1)
    pyramid.add(pyramid2)
    return [ pyramid, pyramid1, pyramid2 ];
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
      if (pyramid.position.z === this.pyramidTopZ) {
        pyramid.rotation.y += 1.0 * delta;
      } else {
        pyramid.rotation.y -= 1.0 * delta;
      }
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
      if (this.lastPick) {
        // this.lastPick.object.material[0].color.set(this.options.mapColor)
        // this.lastPick.object.material[1].color.set(this.options.sideColor)
      }
      this.lastPick = undefined
      this.lastPick = intersects.find(
        (item) => item && item.object && (item.object as Mesh).material && ((item.object as Mesh).material as Material[]).length === 2
      ) as Intersection<Mesh>;
      if (this.lastPick) {
        // this.lastPick.object.material[0].color.set(this.options.hoverColor)
        // this.lastPick.object.material[1].color.set(this.options.hoverColor)
      }
    }

    this.renderer.render(this.scene, this.camera);
  }
}
