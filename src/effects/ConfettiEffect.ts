import gsap from "gsap";
import * as THREE from "three";

export function createConfetti(scene: THREE.Scene): void {
  const colors = [0xfd5901, 0xf78104, 0xfaab36, 0x249ea0, 0x008083, 0x005f60, 0xffffff, 0xfcd34d];
  const pieces: { mesh: THREE.Mesh; geo: THREE.BufferGeometry; mat: THREE.MeshBasicMaterial }[] =
    [];

  for (let i = 0; i < 100; i++) {
    let geo: THREE.BufferGeometry;
    const s = Math.floor(Math.random() * 3);
    if (s === 0) geo = new THREE.PlaneGeometry(0.14, 0.07);
    else if (s === 1) geo = new THREE.PlaneGeometry(0.1, 0.1);
    else geo = new THREE.CircleGeometry(0.05, 5);

    const mat = new THREE.MeshBasicMaterial({
      color: colors[Math.floor(Math.random() * colors.length)],
      side: THREE.DoubleSide,
    });
    const c = new THREE.Mesh(geo, mat);
    const sx = (Math.random() - 0.5) * 14;
    c.position.set(sx, 8 + Math.random() * 5, (Math.random() - 0.5) * 8);
    c.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    scene.add(c);
    pieces.push({ mesh: c, geo, mat });

    const d = 2.5 + Math.random() * 3;
    gsap.to(c.position, {
      x: sx + (Math.random() - 0.5) * 3,
      y: -4,
      duration: d,
      ease: "power1.in",
    });
    gsap.to(c.rotation, {
      x: `+=${Math.random() * 14}`,
      y: `+=${Math.random() * 14}`,
      z: `+=${Math.random() * 7}`,
      duration: d,
    });
  }

  setTimeout(() => {
    pieces.forEach((p) => {
      scene.remove(p.mesh);
      p.geo.dispose();
      p.mat.dispose();
    });
  }, 6000);
}
