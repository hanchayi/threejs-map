import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
} from "three"

export default class ThreeJSMap {
  private scene: Scene;
  private camera: PerspectiveCamera;
  private renderer: WebGLRenderer;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new Scene();
    this.camera = new PerspectiveCamera();
    this.renderer = new WebGLRenderer({
      canvas,
      alpha: true
    });
  }

  public render() {
    requestAnimationFrame(this._render);
  }

  private _render() {
    this.renderer.render(this.scene, this.camera);
  }
}
