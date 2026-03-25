import * as THREE from "three";

/**
 * Create a box mesh with rounded vertical edges using ExtrudeGeometry.
 * The shape is a rounded rectangle extruded along the Z axis.
 */
export function createRoundedBox(
  width: number,
  height: number,
  depth: number,
  radius: number,
): THREE.Mesh {
  const shape = new THREE.Shape();
  const w = width / 2;
  const h = height / 2;
  const r = Math.min(radius, w, h);

  shape.moveTo(-w + r, -h);
  shape.lineTo(w - r, -h);
  shape.quadraticCurveTo(w, -h, w, -h + r);
  shape.lineTo(w, h - r);
  shape.quadraticCurveTo(w, h, w - r, h);
  shape.lineTo(-w + r, h);
  shape.quadraticCurveTo(-w, h, -w, h - r);
  shape.lineTo(-w, -h + r);
  shape.quadraticCurveTo(-w, -h, -w + r, -h);

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: depth,
    bevelEnabled: true,
    bevelThickness: r * 0.5,
    bevelSize: r * 0.3,
    bevelSegments: 4,
    curveSegments: 8,
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  // Center the geometry (extrude goes from 0 to depth, we want -depth/2 to depth/2)
  geometry.translate(0, 0, -depth / 2);

  return new THREE.Mesh(geometry);
}
