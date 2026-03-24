// ============================================
// GAMBRENG — Gachapon Gacha Theme Selector
// Full Three.js scene, inspired by handpainted
// lowpoly gashapon machine aesthetic
// ============================================

const participants = [
    { name: 'Peserta 1', theme: 'Cyberpunk City', color: 0xFD5901 },
    { name: 'Peserta 2', theme: 'Hutan Ajaib', color: 0xF78104 },
    { name: 'Peserta 3', theme: 'Underwater World', color: 0x249EA0 },
    { name: 'Peserta 4', theme: 'Steampunk', color: 0x005F60 }
];

let scene, camera, renderer;
let machine, handle, dome, domeBorder;
let capsuleMeshes = [];
let sparkles = [];
let floatingStars = [];
let gameState = 'idle';
let winnerIndex = -1;
let spinTimeout = null;

const startBtn = document.getElementById('start-btn');
const handleBtn = document.getElementById('handle-btn');
const resetBtn = document.getElementById('reset-btn');
const resultOverlay = document.getElementById('result-overlay');
const resultContent = document.getElementById('result-content');
const winnerThemeEl = document.getElementById('winner-theme');
const winnerParticipantEl = document.getElementById('winner-participant');
const participantThemesEl = document.getElementById('participant-themes');
const titleEl = document.getElementById('title');

init();
animate();

function init() {
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x003333, 0.03);

    camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 3.5, 9);
    camera.lookAt(0, 2, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.outputEncoding = THREE.sRGBEncoding;
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    setupLights();
    createEnvironment();
    createMachine();
    createCapsules();
    createFloatingStars();

    startBtn.addEventListener('click', startEntry);
    handleBtn.addEventListener('click', spinGacha);
    resetBtn.addEventListener('click', resetGame);
    window.addEventListener('resize', onWindowResize);

    gsap.from(camera.position, { y: 6, z: 14, duration: 2.5, ease: "power3.out" });
}

// ============ LIGHTS ============

function setupLights() {
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
    const fill = new THREE.DirectionalLight(0x249EA0, 0.35);
    fill.position.set(-4, 4, -3);
    scene.add(fill);

    // Rim — orange backlight
    const rim = new THREE.PointLight(0xF78104, 0.6, 15);
    rim.position.set(0, 6, -5);
    scene.add(rim);

    // Under glow — teal accent
    const under = new THREE.PointLight(0x249EA0, 0.3, 8);
    under.position.set(0, -0.5, 3);
    scene.add(under);

    // Spot on dome
    const spot = new THREE.SpotLight(0xffffff, 0.5, 12, Math.PI * 0.15, 0.6);
    spot.position.set(0, 10, 4);
    spot.target.position.set(0, 3, 0);
    scene.add(spot);
    scene.add(spot.target);
}

// ============ ENVIRONMENT ============

function createEnvironment() {
    // Gradient sky sphere
    const skyGeo = new THREE.SphereGeometry(40, 32, 32);
    const skyCanvas = document.createElement('canvas');
    skyCanvas.width = 512;
    skyCanvas.height = 512;
    const ctx = skyCanvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#001a1a');
    grad.addColorStop(0.4, '#004040');
    grad.addColorStop(1, '#002a2a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);
    const skyTex = new THREE.CanvasTexture(skyCanvas);
    const skyMat = new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide });
    scene.add(new THREE.Mesh(skyGeo, skyMat));

    // Ground — dark reflective disc
    const groundGeo = new THREE.CircleGeometry(15, 64);
    const groundMat = new THREE.MeshStandardMaterial({
        color: 0x002626, metalness: 0.3, roughness: 0.6
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    scene.add(ground);

    // Ground ring glow
    const ringGeo = new THREE.RingGeometry(2.8, 3.2, 64);
    const ringMat = new THREE.MeshBasicMaterial({
        color: 0xF78104, transparent: true, opacity: 0.12, side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.01;
    scene.add(ring);
}

// ============ MACHINE ============

function createMachine() {
    machine = new THREE.Group();

    // --- FEET (4 stubby legs) ---
    const footMat = new THREE.MeshStandardMaterial({ color: 0x003d3d, metalness: 0.4, roughness: 0.6 });
    for (let i = 0; i < 4; i++) {
        const angle = (Math.PI * 2 / 4) * i + Math.PI / 4;
        const foot = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.25, 0.3, 8),
            footMat
        );
        foot.position.set(Math.cos(angle) * 1.5, 0.15, Math.sin(angle) * 1.5);
        foot.castShadow = true;
        machine.add(foot);
    }

    // --- BASE PLATFORM ---
    const baseMat = new THREE.MeshStandardMaterial({ color: 0xFD5901, metalness: 0.15, roughness: 0.7 });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2, 0.5, 32), baseMat);
    base.position.y = 0.55;
    base.castShadow = true;
    base.receiveShadow = true;
    machine.add(base);

    // Base trim ring
    const baseTrim = new THREE.Mesh(
        new THREE.TorusGeometry(1.9, 0.06, 8, 48),
        new THREE.MeshStandardMaterial({ color: 0xFAAB36, metalness: 0.6, roughness: 0.3 })
    );
    baseTrim.rotation.x = Math.PI / 2;
    baseTrim.position.y = 0.8;
    machine.add(baseTrim);

    // --- BODY (main column) ---
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x008083, metalness: 0.1, roughness: 0.75 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.7, 2.8, 32), bodyMat);
    body.position.y = 2.2;
    body.castShadow = true;
    body.receiveShadow = true;
    machine.add(body);

    // Body panel — front face plate
    const panelMat = new THREE.MeshStandardMaterial({ color: 0x005F60, metalness: 0.2, roughness: 0.6 });
    const panel = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.6, 0.1), panelMat);
    panel.position.set(0, 2, 1.55);
    machine.add(panel);

    // Gold trim rings on body
    const trimMat = new THREE.MeshStandardMaterial({ color: 0xFAAB36, metalness: 0.7, roughness: 0.25 });
    [1.2, 2.0, 2.8, 3.5].forEach(y => {
        const trim = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.04, 8, 48), trimMat);
        trim.rotation.x = Math.PI / 2;
        trim.position.y = y;
        machine.add(trim);
    });

    // --- DOME (glass sphere) ---
    const domeGeo = new THREE.SphereGeometry(1.6, 48, 32, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const domeMat = new THREE.MeshPhysicalMaterial({
        color: 0xaaddff,
        transparent: true,
        opacity: 0.18,
        metalness: 0,
        roughness: 0.05,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        envMapIntensity: 0.5
    });
    dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.y = 3.6;
    dome.scale.y = 1.2;
    machine.add(dome);

    // Dome border ring
    domeBorder = new THREE.Mesh(
        new THREE.TorusGeometry(1.58, 0.07, 12, 48),
        trimMat
    );
    domeBorder.rotation.x = Math.PI / 2;
    domeBorder.position.y = 3.6;
    machine.add(domeBorder);

    // --- TOP CAP ---
    const capMat = new THREE.MeshStandardMaterial({ color: 0xFD5901, metalness: 0.15, roughness: 0.6 });
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 1.0, 0.7, 32), capMat);
    cap.position.y = 5.5;
    cap.castShadow = true;
    machine.add(cap);

    // Cap top knob
    const knob = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xFAAB36, metalness: 0.7, roughness: 0.2 })
    );
    knob.position.y = 5.95;
    machine.add(knob);

    // Cap trim
    const capTrim = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.05, 8, 32), trimMat);
    capTrim.rotation.x = Math.PI / 2;
    capTrim.position.y = 5.15;
    machine.add(capTrim);

    // --- COIN SLOT AREA ---
    const slotPlate = new THREE.Mesh(
        new THREE.BoxGeometry(1.0, 0.6, 0.12),
        new THREE.MeshStandardMaterial({ color: 0x003d3d, metalness: 0.5, roughness: 0.4 })
    );
    slotPlate.position.set(0, 2.2, 1.62);
    machine.add(slotPlate);

    // Coin slot opening
    const slot = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.08, 0.15),
        new THREE.MeshStandardMaterial({ color: 0x000000 })
    );
    slot.position.set(0, 2.2, 1.68);
    machine.add(slot);

    // --- EXIT CHUTE ---
    const chuteMat = new THREE.MeshStandardMaterial({ color: 0x003d3d, metalness: 0.3, roughness: 0.5 });
    const chute = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.9, 1.0), chuteMat);
    chute.position.set(0, 0.75, 2.0);
    chute.castShadow = true;
    machine.add(chute);

    // Chute opening
    const opening = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.6, 0.12),
        new THREE.MeshStandardMaterial({ color: 0x000000 })
    );
    opening.position.set(0, 0.8, 2.52);
    machine.add(opening);

    // Chute trim
    const chuteTrim = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 0.75, 0.08),
        trimMat
    );
    chuteTrim.position.set(0, 0.8, 2.54);
    machine.add(chuteTrim);

    // --- HANDLE ---
    handle = new THREE.Group();

    const handleStem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 0.5, 12),
        new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.6, roughness: 0.3 })
    );
    handleStem.rotation.x = Math.PI / 2;
    handleStem.position.set(0, 1.7, 1.85);
    handle.add(handleStem);

    const handleArm = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.9, 0.06),
        new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.6, roughness: 0.3 })
    );
    handleArm.position.set(0, 1.25, 2.1);
    handle.add(handleArm);

    const handleBall = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xFAAB36, metalness: 0.7, roughness: 0.2 })
    );
    handleBall.position.set(0, 0.78, 2.1);
    handle.add(handleBall);

    machine.add(handle);

    // --- LABEL / STICKER on front ---
    const stickerLoader = new THREE.TextureLoader();
    const stickerMat = new THREE.MeshBasicMaterial({ transparent: true });
    const stickerMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.55), stickerMat);
    stickerMesh.position.set(0, 2.9, 1.57);
    machine.add(stickerMesh);

    stickerLoader.load('assets/gambreng-logo.png',
        (tex) => {
            stickerMat.map = tex;
            stickerMat.needsUpdate = true;
        },
        undefined,
        () => {
            // Fallback: canvas text if image not found
            const labelCanvas = document.createElement('canvas');
            labelCanvas.width = 512;
            labelCanvas.height = 128;
            const lctx = labelCanvas.getContext('2d');
            lctx.fillStyle = '#FAAB36';
            lctx.font = 'bold 80px "Comic Sans MS", cursive';
            lctx.textAlign = 'center';
            lctx.textBaseline = 'middle';
            lctx.fillText('GAMBRENG', 256, 68);
            stickerMat.map = new THREE.CanvasTexture(labelCanvas);
            stickerMat.needsUpdate = true;
        }
    );

    // --- DECORATIVE STAR STUDS ---
    const starMat = new THREE.MeshStandardMaterial({ color: 0xFAAB36, metalness: 0.6, roughness: 0.3 });
    const starPositions = [
        [-1.1, 1.5, 1.3], [1.1, 1.5, 1.3],
        [-0.8, 2.7, 1.45], [0.8, 2.7, 1.45],
        [0, 3.2, 1.5]
    ];
    starPositions.forEach(p => {
        const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.1, 0), starMat);
        star.position.set(...p);
        machine.add(star);
    });

    // --- SIDE PANELS (colored accents) ---
    const sideMat = new THREE.MeshStandardMaterial({ color: 0x006566, metalness: 0.1, roughness: 0.8 });
    [-1, 1].forEach(side => {
        const sidePanel = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2, 1.5), sideMat);
        sidePanel.position.set(side * 1.55, 2.1, 0.3);
        machine.add(sidePanel);
    });

    scene.add(machine);
}

// ============ CAPSULES ============

function createCapsules() {
    participants.forEach((p, i) => {
        const capsule = new THREE.Group();

        // Top half (colored — visible from camera)
        const topGeo = new THREE.SphereGeometry(0.38, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const topMat = new THREE.MeshStandardMaterial({
            color: p.color, metalness: 0.35, roughness: 0.3
        });
        capsule.add(new THREE.Mesh(topGeo, topMat));

        // Bottom half (white)
        const bottomGeo = new THREE.SphereGeometry(0.38, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
        const bottomMat = new THREE.MeshStandardMaterial({
            color: 0xf0f0f0, metalness: 0.2, roughness: 0.25
        });
        capsule.add(new THREE.Mesh(bottomGeo, bottomMat));

        // Band
        const band = new THREE.Mesh(
            new THREE.TorusGeometry(0.37, 0.035, 8, 32),
            new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.5, roughness: 0.2 })
        );
        band.rotation.x = Math.PI / 2;
        capsule.add(band);

        // Label
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        // Background circle
        ctx.fillStyle = '#' + p.color.toString(16).padStart(6, '0');
        ctx.beginPath();
        ctx.arc(64, 64, 56, 0, Math.PI * 2);
        ctx.fill();
        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 5;
        ctx.stroke();
        // Text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`P${i + 1}`, 64, 66);

        const labelTex = new THREE.CanvasTexture(canvas);
        const labelMat = new THREE.MeshBasicMaterial({ map: labelTex, transparent: true });

        const labelFront = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.32), labelMat);
        labelFront.position.set(0, 0.1, 0.33);
        capsule.add(labelFront);

        const labelBack = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.32), labelMat.clone());
        labelBack.position.set(0, 0.1, -0.33);
        labelBack.rotation.y = Math.PI;
        capsule.add(labelBack);

        // Glow ring under capsule
        const glow = new THREE.Mesh(
            new THREE.RingGeometry(0.2, 0.4, 24),
            new THREE.MeshBasicMaterial({ color: p.color, transparent: true, opacity: 0.2, side: THREE.DoubleSide })
        );
        glow.rotation.x = -Math.PI / 2;
        glow.position.y = -0.35;
        capsule.add(glow);

        capsule.position.set(-2 + i * 1.3, 6, 0);
        capsule.userData = { index: i, color: p.color };
        capsule.castShadow = true;
        scene.add(capsule);
        capsuleMeshes.push(capsule);
    });
}

// ============ FLOATING STARS ============

function createFloatingStars() {
    const mat = new THREE.MeshBasicMaterial({ color: 0xFAAB36, transparent: true, opacity: 0.3 });
    for (let i = 0; i < 20; i++) {
        const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.04 + Math.random() * 0.06, 0), mat.clone());
        star.position.set(
            (Math.random() - 0.5) * 16,
            Math.random() * 8 + 1,
            (Math.random() - 0.5) * 12
        );
        star.userData.speed = 0.002 + Math.random() * 0.005;
        star.userData.offset = Math.random() * Math.PI * 2;
        scene.add(star);
        floatingStars.push(star);
    }
}

// ============ HELPERS ============

function killAllAnimations() {
    capsuleMeshes.forEach(c => {
        gsap.killTweensOf(c.position);
        gsap.killTweensOf(c.rotation);
        gsap.killTweensOf(c.scale);
    });
    gsap.killTweensOf(machine.position);
    gsap.killTweensOf(machine.rotation);
    gsap.killTweensOf(handle.rotation);
    gsap.killTweensOf(camera.position);
    if (spinTimeout) { clearTimeout(spinTimeout); spinTimeout = null; }
}

// ============ GAME FLOW ============

function startEntry() {
    if (gameState !== 'idle') return;
    gameState = 'entering';

    gsap.to(titleEl, {
        opacity: 0, y: -40, duration: 0.5,
        onComplete: () => { titleEl.classList.add('hidden'); titleEl.style.opacity = 1; titleEl.style.transform = ''; }
    });
    startBtn.classList.add('hidden');

    participantThemesEl.innerHTML = participants.map((p, i) =>
        `<div class="theme-item p${i + 1}">P${i + 1}: ${p.name} — "${p.theme}"</div>`
    ).join('');
    participantThemesEl.classList.remove('hidden');
    gsap.from(participantThemesEl, { opacity: 0, x: 50, duration: 0.5 });

    const tl = gsap.timeline();

    // Camera move closer
    tl.to(camera.position, { z: 8, y: 3.2, duration: 1, ease: "power2.inOut" }, 0);

    capsuleMeshes.forEach((capsule, i) => {
        capsule.rotation.set(0, 0, 0);
        capsule.scale.set(1, 1, 1);

        // Fly to lineup
        tl.to(capsule.position, {
            x: -1.8 + i * 1.2, y: 2.5, z: 3.5,
            duration: 0.9, ease: "back.out(1.5)"
        }, 0.4 + i * 0.12);

        tl.to(capsule.rotation, {
            y: Math.PI * 2, duration: 0.9, ease: "power2.out"
        }, 0.4 + i * 0.12);

        // Fly into dome
        tl.to(capsule.position, {
            x: (Math.random() - 0.5) * 1.2,
            y: 4 + Math.random() * 0.8,
            z: (Math.random() - 0.5) * 0.8,
            duration: 0.7, ease: "power3.in"
        }, `>${i * 0.06 + 0.3}`);

        // Bounce settle inside
        tl.to(capsule.position, {
            y: 3.8 + Math.random() * 0.6,
            duration: 0.5, ease: "bounce.out"
        }, '>0');
    });

    tl.call(() => {
        participantThemesEl.classList.add('hidden');
        handleBtn.classList.remove('hidden');
        gsap.from(handleBtn, { scale: 0, duration: 0.5, ease: "back.out(2)" });
        gameState = 'ready';
    }, null, '>0.2');
}

function spinGacha() {
    if (gameState !== 'ready') return;
    gameState = 'spinning';
    handleBtn.disabled = true;
    handleBtn.classList.add('spinning');

    gsap.to(participantThemesEl, {
        opacity: 0, duration: 0.3,
        onComplete: () => participantThemesEl.classList.add('hidden')
    });

    // Handle spin
    gsap.to(handle.rotation, { x: Math.PI * 10, duration: 2.5, ease: "power2.inOut" });

    // Machine shake
    const shakeTL = gsap.timeline();
    for (let i = 0; i < 25; i++) {
        shakeTL.to(machine.position, {
            x: (Math.random() - 0.5) * 0.15,
            z: (Math.random() - 0.5) * 0.08,
            duration: 0.06 + Math.random() * 0.05
        });
        shakeTL.to(machine.rotation, {
            z: (Math.random() - 0.5) * 0.02,
            duration: 0.06 + Math.random() * 0.05
        }, '<');
    }
    shakeTL.to(machine.position, { x: 0, z: 0, duration: 0.3, ease: "power2.out" });
    shakeTL.to(machine.rotation, { z: 0, duration: 0.3, ease: "power2.out" }, '<');

    // Capsule shuffle
    capsuleMeshes.forEach(capsule => {
        const sTL = gsap.timeline();
        for (let j = 0; j < 25; j++) {
            sTL.to(capsule.position, {
                x: (Math.random() - 0.5) * 1.8,
                y: 3.5 + Math.random() * 1.5,
                z: (Math.random() - 0.5) * 1.2,
                duration: 0.06 + Math.random() * 0.08
            });
            sTL.to(capsule.rotation, {
                x: `+=${Math.random() * Math.PI * 2}`,
                y: `+=${Math.random() * Math.PI * 2}`,
                z: `+=${Math.random() * Math.PI}`,
                duration: 0.06 + Math.random() * 0.08
            }, '<');
        }
    });

    spinTimeout = setTimeout(() => {
        spinTimeout = null;
        killAllAnimations();
        gsap.to(machine.position, { x: 0, y: 0, z: 0, duration: 0.4, ease: "power2.out" });
        gsap.to(machine.rotation, { x: 0, y: 0, z: 0, duration: 0.4, ease: "power2.out" });
        handle.rotation.x = 0;
        winnerIndex = Math.floor(Math.random() * 4);
        revealWinner();
    }, 2800);
}

function revealWinner() {
    gameState = 'revealing';
    handleBtn.classList.remove('spinning');

    const tl = gsap.timeline();

    // Losers drop
    capsuleMeshes.forEach((c, i) => {
        if (i !== winnerIndex) {
            tl.to(c.position, { y: -4, x: (Math.random() - 0.5) * 5, duration: 0.6, ease: "power2.in" }, 0.06 * i);
            tl.to(c.scale, { x: 0.15, y: 0.15, z: 0.15, duration: 0.6, ease: "power2.in" }, 0.06 * i);
        }
    });

    const w = capsuleMeshes[winnerIndex];

    // Winner to chute
    tl.to(w.position, { x: 0, y: 1.5, z: 2.2, duration: 0.8, ease: "power2.out" }, 0.4);
    tl.to(w.rotation, { x: 0, y: Math.PI * 2, z: 0, duration: 0.8, ease: "power2.out" }, 0.4);

    // Pop forward
    tl.to(w.position, { x: 0, y: 2.5, z: 4, duration: 0.5, ease: "back.out(1.5)" }, '>0.1');

    // Camera — slight zoom, not too close
    tl.to(camera.position, { z: 7.5, y: 3, duration: 0.8, ease: "power2.out" }, '<');

    // Scale up — controlled, not fullscreen
    tl.to(w.scale, { x: 1.6, y: 1.6, z: 1.6, duration: 0.5, ease: "elastic.out(1, 0.5)" }, '>0');

    // Sparkles
    tl.call(() => createSparkles(w.position), null, '>0.1');

    // Dramatic spin
    tl.to(w.rotation, { y: `+=${Math.PI * 4}`, duration: 1.2, ease: "power2.out" }, '<');

    tl.call(() => {
        gameState = 'done';
        handleBtn.classList.add('hidden');
        resetBtn.classList.remove('hidden');
        showResult();
    }, null, '>0.3');
}

function createSparkles(origin) {
    const colors = [0xFAAB36, 0xffffff, 0xF78104, 0xFD5901, 0x249EA0];
    for (let i = 0; i < 35; i++) {
        const geo = new THREE.OctahedronGeometry(0.04 + Math.random() * 0.06, 0);
        const mat = new THREE.MeshBasicMaterial({ color: colors[Math.floor(Math.random() * colors.length)] });
        const s = new THREE.Mesh(geo, mat);
        s.position.copy(origin);
        scene.add(s);
        sparkles.push(s);

        const a = (Math.PI * 2 / 35) * i;
        const r = 1.5 + Math.random() * 2.5;
        gsap.to(s.position, {
            x: origin.x + Math.cos(a) * r,
            y: origin.y + Math.sin(a * 0.7) * r,
            z: origin.z + Math.sin(a) * r,
            duration: 0.7 + Math.random() * 0.6, ease: "power2.out"
        });
        gsap.to(s.scale, { x: 0, y: 0, z: 0, duration: 1.2, ease: "power2.in", delay: 0.2 });
        gsap.to(s.rotation, {
            x: Math.random() * Math.PI * 4, y: Math.random() * Math.PI * 4, duration: 1.5
        });
        setTimeout(() => {
            scene.remove(s); geo.dispose(); mat.dispose();
            sparkles = sparkles.filter(sp => sp !== s);
        }, 2200);
    }
}

function showResult() {
    const winner = participants[winnerIndex];
    const col = '#' + winner.color.toString(16).padStart(6, '0');
    winnerThemeEl.textContent = `"${winner.theme}"`;
    winnerThemeEl.style.color = col;
    winnerParticipantEl.textContent = `Diusulkan oleh: ${winner.name}`;
    resultContent.style.borderColor = col;
    resultOverlay.classList.remove('hidden');
    gsap.from(resultContent, { scale: 0, rotation: -0.08, duration: 0.7, ease: "elastic.out(1, 0.5)" });
    createConfetti();
}

function createConfetti() {
    const colors = [0xFD5901, 0xF78104, 0xFAAB36, 0x249EA0, 0x008083, 0x005F60, 0xffffff, 0xfcd34d];
    const pieces = [];
    for (let i = 0; i < 100; i++) {
        let geo;
        const s = Math.floor(Math.random() * 3);
        if (s === 0) geo = new THREE.PlaneGeometry(0.14, 0.07);
        else if (s === 1) geo = new THREE.PlaneGeometry(0.1, 0.1);
        else geo = new THREE.CircleGeometry(0.05, 5);

        const mat = new THREE.MeshBasicMaterial({
            color: colors[Math.floor(Math.random() * colors.length)], side: THREE.DoubleSide
        });
        const c = new THREE.Mesh(geo, mat);
        const sx = (Math.random() - 0.5) * 14;
        c.position.set(sx, 8 + Math.random() * 5, (Math.random() - 0.5) * 8);
        c.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        scene.add(c);
        pieces.push({ mesh: c, geo, mat });

        const d = 2.5 + Math.random() * 3;
        gsap.to(c.position, { x: sx + (Math.random() - 0.5) * 3, y: -4, duration: d, ease: "power1.in" });
        gsap.to(c.rotation, {
            x: `+=${Math.random() * 14}`, y: `+=${Math.random() * 14}`,
            z: `+=${Math.random() * 7}`, duration: d
        });
    }
    setTimeout(() => { pieces.forEach(p => { scene.remove(p.mesh); p.geo.dispose(); p.mat.dispose(); }); }, 6000);
}

function resetGame() {
    killAllAnimations();

    gsap.to(resultContent, {
        scale: 0, duration: 0.3, ease: "back.in(1.7)",
        onComplete: () => { resultOverlay.classList.add('hidden'); resultContent.style.transform = ''; }
    });

    resetBtn.classList.add('hidden');
    startBtn.classList.remove('hidden');
    handleBtn.classList.add('hidden');
    handleBtn.disabled = false;
    handleBtn.classList.remove('spinning');
    titleEl.classList.remove('hidden');

    gsap.to(camera.position, { x: 0, y: 3.5, z: 9, duration: 1, ease: "power2.out" });
    gsap.to(machine.position, { x: 0, y: 0, z: 0, duration: 0.5 });
    gsap.to(machine.rotation, { x: 0, y: 0, z: 0, duration: 0.5 });
    handle.rotation.x = 0;

    capsuleMeshes.forEach((c, i) => {
        gsap.to(c.position, { x: -2 + i * 1.3, y: 6, z: 0, duration: 0.8, ease: "power2.out" });
        gsap.to(c.rotation, { x: 0, y: 0, z: 0, duration: 0.8 });
        gsap.to(c.scale, { x: 1, y: 1, z: 1, duration: 0.5 });
    });

    sparkles.forEach(s => { scene.remove(s); if (s.geometry) s.geometry.dispose(); if (s.material) s.material.dispose(); });
    sparkles = [];
    participantThemesEl.classList.add('hidden');
    participantThemesEl.style.opacity = '';
    winnerIndex = -1;
    gameState = 'idle';
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ============ RENDER LOOP ============

function animate() {
    requestAnimationFrame(animate);
    const t = Date.now() * 0.001;

    // Floating stars
    floatingStars.forEach(s => {
        s.position.y += Math.sin(t * 0.5 + s.userData.offset) * 0.003;
        s.rotation.x += s.userData.speed;
        s.rotation.y += s.userData.speed * 0.7;
    });

    if (gameState === 'idle') {
        // Machine gentle breathing
        machine.position.y = Math.sin(t * 0.7) * 0.04;
        machine.rotation.y = Math.sin(t * 0.3) * 0.03;

        // Capsules orbit above dome
        capsuleMeshes.forEach((c, i) => {
            const a = t * 0.4 + (i * Math.PI * 0.5);
            c.position.x = Math.cos(a) * 2.2;
            c.position.z = Math.sin(a) * 2.2;
            c.position.y = 6 + Math.sin(t * 1.2 + i) * 0.3;
            c.rotation.y += 0.015;
            c.rotation.x = Math.sin(t * 0.8 + i) * 0.2;
        });
    } else if (gameState === 'ready') {
        machine.position.y = Math.sin(t * 0.7) * 0.02;
        capsuleMeshes.forEach((c, i) => {
            c.position.y = 3.8 + Math.sin(t * 1.8 + i * 1.3) * 0.1;
            c.rotation.x += 0.003;
            c.rotation.y += 0.005;
        });
    } else if (gameState === 'done') {
        const w = capsuleMeshes[winnerIndex];
        if (w) {
            w.position.y = 2.5 + Math.sin(t * 1.2) * 0.08;
            w.rotation.y += 0.008;
        }
    }

    renderer.render(scene, camera);
}
