import * as THREE from "three";

export class Environment {
  constructor(scene: THREE.Scene) {
    this.createSky(scene);
    this.createGround(scene);
    this.createGroundRing(scene);
    this.setupLights(scene);
    scene.fog = new THREE.FogExp2(0x003333, 0.03);
  }

  private createSky(scene: THREE.Scene): void {
    const skyGeo = new THREE.SphereGeometry(40, 32, 32);
    const skyCanvas = document.createElement("canvas");
    skyCanvas.width = 512;
    skyCanvas.height = 512;
    const ctx = skyCanvas.getContext("2d")!;
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, "#001a1a");
    grad.addColorStop(0.4, "#004040");
    grad.addColorStop(1, "#002a2a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);
    const skyTex = new THREE.CanvasTexture(skyCanvas);
    const skyMat = new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide });
    scene.add(new THREE.Mesh(skyGeo, skyMat));
  }

  private createGround(scene: THREE.Scene): void {
    const groundGeo = new THREE.CircleGeometry(15, 64);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x002626,
      metalness: 0.3,
      roughness: 0.6,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    scene.add(ground);
  }

  private createGroundRing(scene: THREE.Scene): void {
    const ringGeo = new THREE.RingGeometry(2.8, 3.2, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xfaab36,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.01;
    scene.add(ring);
  }

  private setupLights(scene: THREE.Scene): void {
    // Ambient — teal tint
    scene.add(new THREE.AmbientLight(0x1a5c5c, 0.5));

    // Main key light — warm
    const key = new THREE.DirectionalLight(0xffeedd, 0.9);
    key.position.set(4, 8, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 25;
    key.shadow.camera.left = -6;
    key.shadow.camera.right = 6;
    key.shadow.camera.top = 8;
    key.shadow.camera.bottom = -2;
    key.shadow.bias = -0.001;
    scene.add(key);

    // Fill — teal
    const fill = new THREE.DirectionalLight(0x249ea0, 0.35);
    fill.position.set(-4, 4, -3);
    scene.add(fill);

    // Rim — orange backlight
    const rim = new THREE.PointLight(0xf78104, 0.6, 15);
    rim.position.set(0, 6, -5);
    scene.add(rim);

    // Under glow — teal accent
    const under = new THREE.PointLight(0x249ea0, 0.3, 8);
    under.position.set(0, -0.5, 3);
    scene.add(under);

    // Spot on dome
    const spot = new THREE.SpotLight(0xffffff, 0.5, 12, Math.PI * 0.15, 0.6);
    spot.position.set(0, 10, 4);
    spot.target.position.set(0, 3, 0);
    scene.add(spot);
    scene.add(spot.target);
  }
}
