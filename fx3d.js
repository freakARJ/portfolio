(function () {
  const root = document.documentElement;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = window.matchMedia("(hover: hover)").matches;

  /* 1. Ensure 3D & FX canvases exist */
  let bgCanvas = document.getElementById("bg-3d");
  if (!bgCanvas) {
    bgCanvas = document.createElement("canvas");
    bgCanvas.id = "bg-3d";
    bgCanvas.setAttribute("aria-hidden", "true");
    document.body.prepend(bgCanvas);
  }

  /* 2. 3D Tilt & Cursor Spotlight for Cards + Hero Stage */
  function attachTilt(el, maxX, maxY, lift) {
    if (!el || el.dataset.tiltBound === "1") return;
    el.dataset.tiltBound = "1";
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      const px = e.clientX - r.left;
      const py = e.clientY - r.top;
      const rx = ((py / r.height) - 0.5) * -maxX;
      const ry = ((px / r.width) - 0.5) * maxY;
      el.style.setProperty("--mx", px + "px");
      el.style.setProperty("--my", py + "px");
      el.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)${lift ? ` translateY(-${lift}px)` : ""}`;
    });
    el.addEventListener("mouseleave", () => {
      el.style.transform = "";
    });
  }

  function bindAllTilt() {
    if (reducedMotion || !canHover) return;
    const stage = document.querySelector(".stage");
    if (stage) attachTilt(stage, 12, 14, 0);
    document.querySelectorAll(".grid .card, .list .card:not(.prose)").forEach((card) => {
      attachTilt(card, 11, 11, 4);
    });
  }

  bindAllTilt();
  const mainEl = document.getElementById("main");
  if (mainEl) {
    new MutationObserver(bindAllTilt).observe(mainEl, { childList: true, subtree: true });
  }

  /* 3. "DO NOT CLICK" Security-Test Particle Burst */
  const dnc = document.querySelector(".dnc");
  if (dnc && !reducedMotion) {
    let fxCanvas = document.getElementById("fx-canvas");
    if (!fxCanvas) {
      fxCanvas = document.createElement("canvas");
      fxCanvas.id = "fx-canvas";
      fxCanvas.setAttribute("aria-hidden", "true");
      document.body.appendChild(fxCanvas);
    }
    const ctx = fxCanvas.getContext("2d");
    let particles = [];
    let raf = null;

    function sizeFx() {
      fxCanvas.width = window.innerWidth;
      fxCanvas.height = window.innerHeight;
    }
    sizeFx();
    window.addEventListener("resize", sizeFx);

    function tickFx() {
      ctx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
      particles = particles.filter((p) => p.life > 0.03);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25;
        p.life *= 0.96;
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.c;
        ctx.fillRect(p.x, p.y, p.s, p.s);
      }
      ctx.globalAlpha = 1;
      raf = particles.length ? requestAnimationFrame(tickFx) : null;
    }

    dnc.addEventListener("click", (e) => {
      const r = dnc.getBoundingClientRect();
      const cx = e.clientX || r.left + r.width / 2;
      const cy = e.clientY || r.top + r.height / 2;
      const palette = ["#e5242f", "#fbbf24", "#00ff88", "#ffffff"];
      for (let i = 0; i < 46; i++) {
        const a = (Math.PI * 2 * i) / 46 + (Math.random() - 0.5) * 0.25;
        const spd = 3 + Math.random() * 8;
        particles.push({
          x: cx, y: cy,
          vx: Math.cos(a) * spd,
          vy: Math.sin(a) * spd - 3,
          s: 3 + Math.random() * 5,
          c: palette[i % palette.length],
          life: 1
        });
      }
      if (!raf) tickFx();
    });
  }

  /* 4. Three.js Interactive 3D QA Verification Core */
  if (typeof THREE === "undefined") return;
  try {
    const renderer = new THREE.WebGLRenderer({ canvas: bgCanvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 12);

    const cluster = new THREE.Group();
    const isHome = !!document.querySelector(".hero");
    cluster.position.set(isHome && window.innerWidth >= 820 ? 2.5 : 3.2, 0.25, -1.2);
    scene.add(cluster);

    const outerMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, wireframe: true, transparent: true, opacity: 0.18 });
    const outerMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(2.7, 1), outerMat);
    cluster.add(outerMesh);

    const innerMat = new THREE.MeshBasicMaterial({ color: 0x00c46a, wireframe: true, transparent: true, opacity: 0.36 });
    const innerMesh = new THREE.Mesh(new THREE.OctahedronGeometry(1.3, 0), innerMat);
    cluster.add(innerMesh);

    const ringGeo = new THREE.TorusGeometry(3.6, 0.018, 12, 96);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.22 });
    const ring1 = new THREE.Mesh(ringGeo, ringMat);
    ring1.rotation.set(Math.PI / 2.6, 0.4, 0);
    cluster.add(ring1);

    const ring2 = new THREE.Mesh(ringGeo, ringMat);
    ring2.scale.setScalar(0.84);
    ring2.rotation.set(-Math.PI / 3, -0.6, 0);
    cluster.add(ring2);

    const count = 210;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 26;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 18;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 14 - 3;
    }
    const ptsGeo = new THREE.BufferGeometry();
    ptsGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const ptsMat = new THREE.PointsMaterial({ color: 0x00ff88, size: 0.075, transparent: true, opacity: 0.48 });
    const points = new THREE.Points(ptsGeo, ptsMat);
    scene.add(points);

    function applyThemeTo3D() {
      const light = root.dataset.theme === "light";
      const hex = light ? 0x009e55 : 0x00ff88;
      outerMat.color.setHex(hex);
      innerMat.color.setHex(light ? 0x00703c : 0x00c46a);
      ringMat.color.setHex(hex);
      ptsMat.color.setHex(hex);
      outerMat.opacity = light ? 0.14 : 0.18;
      ptsMat.opacity = light ? 0.34 : 0.48;
    }
    applyThemeTo3D();
    new MutationObserver(applyThemeTo3D).observe(root, { attributes: true, attributeFilter: ["data-theme"] });

    let mx = 0, my = 0;
    window.addEventListener("pointermove", (e) => {
      mx = (e.clientX / window.innerWidth - 0.5) * 2;
      my = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    window.addEventListener("resize", () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      cluster.position.x = window.innerWidth < 820 ? 0 : (isHome ? 2.5 : 3.2);
    });
    if (window.innerWidth < 820) cluster.position.x = 0;

    const clock = new THREE.Clock();
    function loop() {
      const t = clock.getElapsedTime();
      const maxScroll = Math.max(1, document.body.scrollHeight - window.innerHeight);
      const scrollRatio = window.scrollY / maxScroll;

      if (!reducedMotion) {
        outerMesh.rotation.y = t * 0.14;
        outerMesh.rotation.x = t * 0.08;
        innerMesh.rotation.y = -t * 0.28;
        innerMesh.rotation.z = t * 0.18;
        ring1.rotation.z = t * 0.2;
        ring2.rotation.z = -t * 0.24;
        points.rotation.y = t * 0.025;
      }

      cluster.position.y = 0.25 - scrollRatio * 2.1;
      camera.position.x += (mx * 0.8 - camera.position.x) * 0.05;
      camera.position.y += (-my * 0.5 - camera.position.y) * 0.05;
      camera.lookAt(0, -scrollRatio * 1.0, 0);

      renderer.render(scene, camera);
      if (!reducedMotion) requestAnimationFrame(loop);
    }
    loop();
  } catch (e) {
    /* WebGL fallback */
  }
})();
