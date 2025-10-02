let scene, camera, renderer, planet, clouds, markers = [];
let rotationVelocity = { x: 0.001, y: 0.003 };
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

function init() {
  const container = document.getElementById('planet-container');
  const containerWidth = container.offsetWidth;
  const containerHeight = container.offsetHeight;
  
  scene = new THREE.Scene();
  
  camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
  camera.position.z = 3.5;

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(containerWidth, containerHeight);
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  // Create planet
  const geometry = new THREE.SphereGeometry(1.5, 64, 64);
  
  // Create custom texture
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  
  // Ocean
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#1a4d7a');
  gradient.addColorStop(0.5, '#2a5d8a');
  gradient.addColorStop(1, '#1a4d7a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw continents
  ctx.fillStyle = '#3a5f3a';
  drawLandmass(ctx, 300, 300, 400, 350);
  drawLandmass(ctx, 1200, 400, 500, 380);
  drawLandmass(ctx, 800, 200, 300, 250);
  drawLandmass(ctx, 1600, 600, 350, 280);
  drawLandmass(ctx, 100, 700, 280, 200);
  
  // Add forests
  ctx.fillStyle = '#2d4f2d';
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    drawForest(ctx, x, y, 30 + Math.random() * 50);
  }
  
  // Add rivers
  ctx.strokeStyle = '#4a90e2';
  ctx.lineWidth = 3;
  for (let i = 0; i < 25; i++) {
    drawRiver(ctx);
  }
  
  // Add mountains
  ctx.fillStyle = '#8b6f47';
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    drawMountain(ctx, x, y, 20 + Math.random() * 30);
  }

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.MeshPhongMaterial({ 
    map: texture,
    shininess: 15,
    specular: new THREE.Color(0x333333)
  });
  
  planet = new THREE.Mesh(geometry, material);
  planet.rotation.x = 0.3;
  scene.add(planet);

  // Add clouds
  const cloudGeometry = new THREE.SphereGeometry(1.52, 32, 32);
  const cloudCanvas = document.createElement('canvas');
  cloudCanvas.width = 1024;
  cloudCanvas.height = 512;
  const cloudCtx = cloudCanvas.getContext('2d');
  
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * cloudCanvas.width;
    const y = Math.random() * cloudCanvas.height;
    const radius = 20 + Math.random() * 60;
    const cloudGradient = cloudCtx.createRadialGradient(x, y, 0, x, y, radius);
    cloudGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    cloudGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    cloudCtx.fillStyle = cloudGradient;
    cloudCtx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  
  const cloudTexture = new THREE.CanvasTexture(cloudCanvas);
  const cloudMaterial = new THREE.MeshPhongMaterial({
    map: cloudTexture,
    transparent: true,
    opacity: 0.6,
    depthWrite: false
  });
  clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
  scene.add(clouds);

  // Add castles
  addCastles();

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xfff8dc, 1);
  sunLight.position.set(5, 3, 5);
  scene.add(sunLight);

  const backLight = new THREE.DirectionalLight(0x6b8cff, 0.3);
  backLight.position.set(-5, -3, -5);
  scene.add(backLight);

  // Stars
  addStars();

  // Mouse controls
  renderer.domElement.addEventListener('mousedown', onMouseDown);
  renderer.domElement.addEventListener('mousemove', onMouseMove);
  renderer.domElement.addEventListener('mouseup', onMouseUp);
  renderer.domElement.addEventListener('wheel', onWheel);

  // Handle window resize
  window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
  const container = document.getElementById('planet-container');
  const containerWidth = container.offsetWidth;
  const containerHeight = container.offsetHeight;
  
  camera.aspect = containerWidth / containerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(containerWidth, containerHeight);
}

function drawLandmass(ctx, x, y, w, h) {
  ctx.beginPath();
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2;
    const radius = (i % 2 === 0 ? 1 : 0.8) * Math.min(w, h) / 2;
    const px = x + Math.cos(angle) * radius * (w / Math.min(w, h));
    const py = y + Math.sin(angle) * radius * (h / Math.min(w, h));
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function drawRiver(ctx) {
  const startX = Math.random() * ctx.canvas.width;
  const startY = Math.random() * ctx.canvas.height;
  const segments = 10 + Math.floor(Math.random() * 15);
  
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  
  let x = startX, y = startY;
  for (let i = 0; i < segments; i++) {
    x += (Math.random() - 0.5) * 60;
    y += (Math.random() - 0.5) * 60;
    ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function drawForest(ctx, x, y, size) {
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fill();
}

function drawMountain(ctx, x, y, size) {
  ctx.beginPath();
  ctx.moveTo(x, y + size);
  ctx.lineTo(x - size, y - size);
  ctx.lineTo(x + size, y - size);
  ctx.closePath();
  ctx.fill();
}

function addCastles() {
  const castlePositions = [
    { lat: 45, lon: 30 },
    { lat: -30, lon: 80 },
    { lat: 20, lon: -50 },
    { lat: 60, lon: 120 },
    { lat: -45, lon: -100 },
    { lat: 10, lon: 160 },
    { lat: -15, lon: -30 },
    { lat: 35, lon: -120 }
  ];

  castlePositions.forEach(pos => {
    const phi = (90 - pos.lat) * (Math.PI / 180);
    const theta = (pos.lon + 180) * (Math.PI / 180);
    const radius = 1.52;

    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);

    const castle = new THREE.Group();
    
    const stoneMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x9b8b7a,
      emissive: 0x2a2520,
      emissiveIntensity: 0.1
    });
    
    const baseGeo = new THREE.BoxGeometry(0.04, 0.06, 0.04);
    const base = new THREE.Mesh(baseGeo, stoneMaterial);
    base.position.y = 0.03;
    castle.add(base);
    
    const roofMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x654321,
      emissive: 0x1a0f0a,
      emissiveIntensity: 0.1
    });
    const roofGeo = new THREE.ConeGeometry(0.03, 0.04, 4);
    const roof = new THREE.Mesh(roofGeo, roofMaterial);
    roof.position.y = 0.08;
    roof.rotation.y = Math.PI / 4;
    castle.add(roof);
    
    const sideTowerGeo = new THREE.BoxGeometry(0.02, 0.04, 0.02);
    
    const tower1 = new THREE.Mesh(sideTowerGeo, stoneMaterial);
    tower1.position.set(-0.025, 0.02, 0);
    castle.add(tower1);
    
    const tower2 = new THREE.Mesh(sideTowerGeo, stoneMaterial);
    tower2.position.set(0.025, 0.02, 0);
    castle.add(tower2);
    
    const smallRoofGeo = new THREE.ConeGeometry(0.015, 0.02, 4);
    
    const roof1 = new THREE.Mesh(smallRoofGeo, roofMaterial);
    roof1.position.set(-0.025, 0.05, 0);
    roof1.rotation.y = Math.PI / 4;
    castle.add(roof1);
    
    const roof2 = new THREE.Mesh(smallRoofGeo, roofMaterial);
    roof2.position.set(0.025, 0.05, 0);
    roof2.rotation.y = Math.PI / 4;
    castle.add(roof2);
    
    const flagMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xd4af37,
      side: THREE.DoubleSide,
      emissive: 0x3a2f1a,
      emissiveIntensity: 0.2
    });
    const flagGeo = new THREE.PlaneGeometry(0.012, 0.008);
    const flag = new THREE.Mesh(flagGeo, flagMaterial);
    flag.position.set(0.006, 0.1, 0);
    castle.add(flag);
    
    castle.position.set(x, y, z);
    castle.lookAt(0, 0, 0);
    castle.rotateX(Math.PI / 2);
    
    const liftDirection = new THREE.Vector3(x, y, z).normalize();
    castle.position.add(liftDirection.multiplyScalar(0.002));
    
    planet.add(castle);
    markers.push(castle);
  });
}

function addStars() {
  const starGeometry = new THREE.BufferGeometry();
  const starVertices = [];
  
  for (let i = 0; i < 1000; i++) {
    const x = (Math.random() - 0.5) * 2000;
    const y = (Math.random() - 0.5) * 2000;
    const z = (Math.random() - 0.5) * 2000;
    starVertices.push(x, y, z);
  }
  
  starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
  const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 2 });
  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);
}

function onMouseDown(e) {
  isDragging = true;
  previousMousePosition = { x: e.clientX, y: e.clientY };
}

function onMouseMove(e) {
  if (isDragging) {
    const deltaX = e.clientX - previousMousePosition.x;
    const deltaY = e.clientY - previousMousePosition.y;
    
    rotationVelocity.y = deltaX * 0.005;
    rotationVelocity.x = deltaY * 0.005;
    
    previousMousePosition = { x: e.clientX, y: e.clientY };
  }
}

function onMouseUp() {
  isDragging = false;
}

function onWheel(e) {
  e.preventDefault();
  camera.position.z += e.deltaY * 0.002;
  camera.position.z = Math.max(2, Math.min(6, camera.position.z));
}

function animate() {
  requestAnimationFrame(animate);
  
  if (!isDragging) {
    planet.rotation.y += rotationVelocity.y;
    planet.rotation.x += rotationVelocity.x * 0.1;
    rotationVelocity.y *= 0.95;
    rotationVelocity.x *= 0.95;
  } else {
    planet.rotation.y += rotationVelocity.y;
    planet.rotation.x += rotationVelocity.x;
  }
  
  clouds.rotation.y += 0.0003;
  
  renderer.render(scene, camera);
}

// Wait for DOM to be fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    init();
    animate();
  });
} else {
  init();
  animate();
}
