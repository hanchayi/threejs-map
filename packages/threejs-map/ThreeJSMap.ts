import { ThreeJSMapOptions } from './intefaces';
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  BoxGeometry,
  MeshBasicMaterial,
  Mesh,
} from "three"

export default class ThreeJSMap {
  private scene: Scene;
  private camera: PerspectiveCamera;
  private renderer: WebGLRenderer;
  private cube: Mesh;

  constructor(canvas: HTMLCanvasElement, options: ThreeJSMapOptions) {
    this.scene = new Scene();
    this.camera = new PerspectiveCamera(75, options.width / options.height, 0.1, 1000);
    const renderer = new WebGLRenderer({
      canvas
    });
    renderer.setSize(options.width, options.height);
    this.renderer = renderer;
    const geometry = new BoxGeometry( 1, 1, 1 );
    const material = new MeshBasicMaterial( { color: 0x00ff00 } );
    const cube = new Mesh( geometry, material );
    this.scene.add( cube );
    this.cube = cube;
    this.camera.position.z = 5;
    this.render();
  }

  private render() {
    this.animate();
  }

  private animate() {
    requestAnimationFrame(() => {
      this.animate();
    });
    this.cube.rotation.x += 0.01;
    this.cube.rotation.y += 0.01;
    this.renderer.render(this.scene, this.camera);
  }
}
