import gsap from "gsap";
import * as THREE from "three";
import { FX_COLORS } from "@/config";
import { applyOutlineParameters } from "@/materials/toon";

export function createConfetti(scene: THREE.Scene): void {
  const colors = FX_COLORS.confetti;
  const pieces: { mesh: THREE.Mesh; geo: THREE.BufferGeometry; mat: THREE.MeshBasicMaterial }[] =
    [];

  for (let i = 0; i < 100; i++) {
    let geo: THREE.BufferGeometry;
    const shape = Math.floor(Math.random() * 3);
    if (shape === 0) geo = new THREE.PlaneGeometry(0.14, 0.07);
    else if (shape === 1) geo = new THREE.PlaneGeometry(0.1, 0.1);
    else geo = new THREE.CircleGeometry(0.05, 5);

    const mat = new THREE.MeshBasicMaterial({
      color: colors[Math.floor(Math.random() * colors.length)],
      side: THREE.DoubleSide,
    });
    applyOutlineParameters(mat, { visible: false, keepAlive: false });

    const confetti = new THREE.Mesh(geo, mat);
    const startX = (Math.random() - 0.5) * 14;
    confetti.position.set(startX, 8 + Math.random() * 5, (Math.random() - 0.5) * 8);
    confetti.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI,
    );
    scene.add(confetti);
    pieces.push({ mesh: confetti, geo, mat });

    const duration = 2.5 + Math.random() * 3;
    gsap.to(confetti.position, {
      x: startX + (Math.random() - 0.5) * 3,
      y: -4,
      duration,
      ease: "power1.in",
    });
    gsap.to(confetti.rotation, {
      x: `+=${Math.random() * 14}`,
      y: `+=${Math.random() * 14}`,
      z: `+=${Math.random() * 7}`,
      duration,
    });
  }

  setTimeout(() => {
    pieces.forEach((piece) => {
      scene.remove(piece.mesh);
      piece.geo.dispose();
      piece.mat.dispose();
    });
  }, 6000);
}
