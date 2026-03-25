import gsap from "gsap";
import * as THREE from "three";

type CameraFrame = {
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
};

export function playTriggerAnimation(
  handle: THREE.Group,
  camera: THREE.PerspectiveCamera,
  cameraFrame: CameraFrame,
  onComplete: () => void,
): gsap.core.Timeline {
  const tl = gsap.timeline();

  // Handle crank — quick wind-up, fast turn, soft settle
  tl.to(
    handle.rotation,
    {
      x: -0.22,
      duration: 0.16,
      ease: "sine.out",
    },
    0,
  );
  tl.to(
    handle.rotation,
    {
      x: Math.PI * 4.35,
      duration: 1.05,
      ease: "power2.inOut",
    },
    0.12,
  );
  tl.to(
    handle.rotation,
    {
      x: Math.PI * 4.5,
      duration: 0.2,
      ease: "sine.out",
    },
    ">-0.04",
  );

  // Camera slight push-in
  tl.to(
    camera.position,
    {
      x: cameraFrame.position.x,
      y: cameraFrame.position.y,
      z: cameraFrame.position.z,
      duration: 1.15,
      ease: "power2.inOut",
      onUpdate: () => camera.lookAt(cameraFrame.lookAt),
    },
    0,
  );

  tl.call(onComplete, undefined, ">0.1");
  return tl;
}
