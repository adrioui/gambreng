import gsap from "gsap";
import * as THREE from "three";

export function createSparkles(scene: THREE.Scene, origin: THREE.Vector3): void {
  const colors = [0xfaab36, 0xffffff, 0xf78104, 0xfd5901, 0x249ea0];
  for (let i = 0; i < 35; i++) {
    const geo = new THREE.OctahedronGeometry(0.04 + Math.random() * 0.06, 0);
    const mat = new THREE.MeshBasicMaterial({
      color: colors[Math.floor(Math.random() * colors.length)],
    });
    const s = new THREE.Mesh(geo, mat);
    s.position.copy(origin);
    scene.add(s);

    const a = ((Math.PI * 2) / 35) * i;
    const r = 1.5 + Math.random() * 2.5;
    gsap.to(s.position, {
      x: origin.x + Math.cos(a) * r,
      y: origin.y + Math.sin(a * 0.7) * r,
      z: origin.z + Math.sin(a) * r,
      duration: 0.7 + Math.random() * 0.6,
      ease: "power2.out",
    });
    gsap.to(s.scale, { x: 0, y: 0, z: 0, duration: 1.2, ease: "power2.in", delay: 0.2 });
    gsap.to(s.rotation, {
      x: Math.random() * Math.PI * 4,
      y: Math.random() * Math.PI * 4,
      duration: 1.5,
    });
    setTimeout(() => {
      scene.remove(s);
      geo.dispose();
      mat.dispose();
    }, 2200);
  }
}
