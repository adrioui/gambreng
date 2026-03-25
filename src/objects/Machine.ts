import * as THREE from "three";
import { createBase } from "@/objects/machine/Base";
import { createBody } from "@/objects/machine/Body";
import { createDome } from "@/objects/machine/Dome";
import { createTopCap } from "@/objects/machine/TopCap";
import { createNestTray } from "@/objects/machine/NestTray";
import { createHandle } from "@/objects/machine/Handle";
import { createLabel } from "@/objects/machine/Label";
import { createDecorations } from "@/objects/machine/Decorations";

export class Machine {
  group: THREE.Group;
  handle: THREE.Group;
  dome: THREE.Mesh;
  domeLight: THREE.PointLight;
  nestTray: THREE.Mesh;

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    createBase(this.group);
    createBody(this.group);
    const domeResult = createDome(this.group);
    this.dome = domeResult.mesh;
    this.domeLight = domeResult.light;
    createTopCap(this.group);
    this.nestTray = createNestTray(this.group);
    this.handle = createHandle(this.group);
    createLabel(this.group);
    createDecorations(this.group);
    scene.add(this.group);
  }
}
