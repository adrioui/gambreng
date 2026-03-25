import * as THREE from "three";

export function createLabel(group: THREE.Group): void {
  const stickerLoader = new THREE.TextureLoader();
  const stickerMat = new THREE.MeshBasicMaterial({
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const stickerMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.55), stickerMat);
  stickerMesh.position.set(0, 2.9, 1.32);
  stickerMesh.renderOrder = 1;
  group.add(stickerMesh);

  stickerLoader.load(
    "assets/gambreng-logo.png",
    (tex) => {
      stickerMat.map = tex;
      stickerMat.needsUpdate = true;
    },
    undefined,
    () => {
      // Fallback: canvas text if image not found
      const labelCanvas = document.createElement("canvas");
      labelCanvas.width = 512;
      labelCanvas.height = 128;
      const lctx = labelCanvas.getContext("2d")!;
      lctx.fillStyle = "#FAAB36";
      lctx.font = 'bold 80px "Comic Sans MS", cursive';
      lctx.textAlign = "center";
      lctx.textBaseline = "middle";
      lctx.fillText("GAMBRENG", 256, 68);
      stickerMat.map = new THREE.CanvasTexture(labelCanvas);
      stickerMat.needsUpdate = true;
    },
  );
}
