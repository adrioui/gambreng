import * as THREE from "three";
import type { CaptureBall } from "@/objects/CaptureBall";

const TRAIL_COUNT = 8;
const ORBIT_CENTER_Y = 3.98;
const OUTSIDE_RADIUS_X = 1.9;
const OUTSIDE_RADIUS_Z = 1.34;
const INSIDE_RADIUS = 0.76;

type TrailState = {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
};

export class OrbitSystem {
  private scene: THREE.Scene;
  private balls: CaptureBall[];
  private angles: number[] = [];
  private phases: number[] = [];
  private active: boolean[] = [];
  private trails: THREE.Object3D[][] = [];
  private history: TrailState[][] = [];

  /** Angular speed in radians per second */
  speed = 0.45;
  /** 0 = orbiting outside the dome, 1 = pulled inside the dome */
  insideBlend = 0;
  /** 0 = elegant orbit, 1 = chaotic scramble inside the dome */
  chaos = 0;

  constructor(balls: CaptureBall[], scene: THREE.Scene) {
    this.scene = scene;
    this.balls = balls;

    balls.forEach((ball, index) => {
      this.angles.push((index / balls.length) * Math.PI * 2);
      this.phases.push(index * 1.7);
      this.active.push(true);

      const trailClones: THREE.Object3D[] = [];
      const trailHistory: TrailState[] = [];
      for (let trailIndex = 0; trailIndex < TRAIL_COUNT; trailIndex++) {
        const clone = ball.createTrailClone();
        clone.visible = false;
        clone.traverse((child) => {
          if (!(child instanceof THREE.Mesh)) return;

          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((material) => {
            material.transparent = true;
            material.opacity = 0.45 * (1 - trailIndex / TRAIL_COUNT);
            material.depthWrite = false;

            material.userData.outlineParameters = {
              ...material.userData.outlineParameters,
              visible: false,
              keepAlive: false,
            };
          });
        });
        this.scene.add(clone);
        trailClones.push(clone);
        trailHistory.push({
          position: new THREE.Vector3(),
          quaternion: new THREE.Quaternion(),
        });
      }
      this.trails.push(trailClones);
      this.history.push(trailHistory);

      ball.group.position.copy(this.computePosition(index, 0));
    });
  }

  update(delta: number, elapsed: number): void {
    this.balls.forEach((ball, index) => {
      if (!this.active[index]) return;

      this.angles[index] += this.speed * delta * (1 + index * 0.05);
      const nextPosition = this.computePosition(index, elapsed);
      ball.group.position.copy(nextPosition);

      ball.group.rotation.y += delta * (1.15 + this.speed * 0.32);
      ball.group.rotation.x =
        Math.sin(elapsed * 1.2 + this.phases[index]) * (0.06 + this.chaos * 0.05) +
        Math.sin(elapsed * 4.2 + this.phases[index]) * this.chaos * 0.03;
      ball.group.rotation.z =
        Math.cos(elapsed * 1.05 + this.phases[index]) * (0.055 + this.insideBlend * 0.035) +
        Math.sin(elapsed * 2.9 + this.phases[index]) * this.chaos * 0.04;
    });
  }

  updateTrail(): void {
    this.balls.forEach((ball, index) => {
      if (!this.active[index]) return;

      const worldPosition = new THREE.Vector3();
      const worldQuaternion = new THREE.Quaternion();
      ball.intact.getWorldPosition(worldPosition);
      ball.intact.getWorldQuaternion(worldQuaternion);

      const trailHistory = this.history[index];
      for (let trailIndex = trailHistory.length - 1; trailIndex > 0; trailIndex--) {
        trailHistory[trailIndex].position.copy(trailHistory[trailIndex - 1].position);
        trailHistory[trailIndex].quaternion.copy(trailHistory[trailIndex - 1].quaternion);
      }
      trailHistory[0].position.copy(worldPosition);
      trailHistory[0].quaternion.copy(worldQuaternion);

      this.trails[index].forEach((clone, trailIndex) => {
        clone.position.copy(trailHistory[trailIndex].position);
        clone.quaternion.copy(trailHistory[trailIndex].quaternion);
        clone.visible = true;
      });
    });
  }

  hideTrails(): void {
    this.trails.forEach((trailGroup) => {
      trailGroup.forEach((clone) => {
        clone.visible = false;
      });
    });
  }

  detachBall(index: number): void {
    this.active[index] = false;
    this.trails[index].forEach((clone) => {
      clone.visible = false;
    });
  }

  detachAll(): void {
    this.active.fill(false);
    this.hideTrails();
  }

  reattach(): void {
    this.speed = 0.45;
    this.insideBlend = 0;
    this.chaos = 0;

    this.balls.forEach((ball, index) => {
      this.active[index] = true;
      this.angles[index] = (index / this.balls.length) * Math.PI * 2;
      ball.group.position.copy(this.computePosition(index, 0));
    });

    this.hideTrails();
  }

  dispose(): void {
    this.trails.forEach((trailGroup) => {
      trailGroup.forEach((clone) => {
        this.scene.remove(clone);
        clone.traverse((child) => {
          if (!(child instanceof THREE.Mesh)) return;
          if (Array.isArray(child.material)) {
            child.material.forEach((material) => material.dispose());
          } else {
            child.material.dispose();
          }
        });
      });
    });
  }

  private computePosition(index: number, elapsed: number): THREE.Vector3 {
    const outsidePosition = this.computeOutsidePosition(
      this.angles[index],
      this.phases[index],
      elapsed,
    );
    const insidePosition = this.computeInsidePosition(
      this.angles[index],
      this.phases[index],
      elapsed,
    );
    return outsidePosition.lerp(insidePosition, this.insideBlend);
  }

  private computeOutsidePosition(angle: number, phase: number, elapsed: number): THREE.Vector3 {
    const radialBreath = 0.035 + Math.sin(elapsed * 0.75 + phase) * 0.025;
    const radiusX = OUTSIDE_RADIUS_X + radialBreath;
    const radiusZ = OUTSIDE_RADIUS_Z + radialBreath * 0.6;
    const lift = Math.sin(angle + phase * 0.18) * 0.13;
    const drift = Math.sin(elapsed * 0.9 + phase) * 0.04;

    return new THREE.Vector3(
      Math.cos(angle) * radiusX,
      ORBIT_CENTER_Y + lift + drift,
      Math.sin(angle) * radiusZ,
    );
  }

  private computeInsidePosition(angle: number, phase: number, elapsed: number): THREE.Vector3 {
    const swirlAngle = angle * 1.25 + elapsed * (0.18 + this.chaos * 0.22) + phase * 0.55;
    const radialPulse =
      Math.sin(elapsed * 2.2 + phase) * 0.08 + Math.sin(elapsed * 4.8 + phase) * 0.04 * this.chaos;
    const swirlRadius = INSIDE_RADIUS + radialPulse * (0.45 + this.chaos * 0.55);

    return new THREE.Vector3(
      Math.cos(swirlAngle) * swirlRadius + Math.sin(elapsed * 2.6 + phase) * 0.16 * this.chaos,
      ORBIT_CENTER_Y -
        0.02 +
        Math.sin(swirlAngle * 1.4 + phase) * 0.15 +
        Math.cos(elapsed * 2.3 + phase) * 0.1 * this.chaos,
      Math.sin(swirlAngle * 1.1 + phase * 0.25) * swirlRadius * 0.82 +
        Math.cos(elapsed * 2.8 + phase) * 0.14 * this.chaos,
    );
  }
}
