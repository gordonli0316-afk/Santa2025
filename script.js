import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

// ===================================
// 1. 核心工具与数据库
// ===================================
const APP_ID = 'xqMFNTLCFpv0XoLWN8Cu5kSw-MdYXbMMI';
const APP_KEY = '0Fr4MZwyJSBpC2UaYGTDbI3l';
const SERVER_URL = "https://xqmfntlc.api.lncldglobal.com";

let isDbConnected = false;
const statusBar = document.getElementById('statusBar');

// *** 强制移除 Loading 界面 ***
// 无论数据库是否连接，2.5秒后必须进入场景
function forceHideLoader() {
    const loader = document.getElementById('loader');
    if (loader && loader.style.display !== 'none') {
        loader.style.opacity = '0';
        setTimeout(() => { loader.style.display = 'none'; }, 800);
    }
}
setTimeout(forceHideLoader, 2500);

// 初始化 LeanCloud
try {
    if (window.AV) {
        AV.init({ appId: APP_ID, appKey: APP_KEY, serverURL: SERVER_URL });
        isDbConnected = true;
        statusBar.innerText = "已连接到极光许愿池 🟢";
        console.log("LeanCloud Connected");
    }
} catch (e) {
    console.warn("LeanCloud Init Failed (Offline Mode):", e);
    statusBar.innerText = "离线模式 ⚪";
}

// ===================================
// 2. Three.js 场景构建
// ===================================
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x051020, 0.02); // 极光蓝雾

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 2, 16);

const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ReinhardToneMapping;
document.getElementById('canvas-container').appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
labelRenderer.domElement.style.pointerEvents = 'none';
document.getElementById('canvas-container').appendChild(labelRenderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.6;
controls.maxDistance = 20;
controls.minDistance = 5;
controls.maxPolarAngle = Math.PI / 1.7; // 限制角度防止穿模

// ===================================
// 3. 辉光后期处理 (Bloom)
// ===================================
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 0.2; // 亮度阈值
bloomPass.strength = 1.6;  // 强度
bloomPass.radius = 0.5;

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

// ===================================
// 4. 物体创建
// ===================================
const treeGroup = new THREE.Group();
scene.add(treeGroup);

// 地面网格
const grid = new THREE.GridHelper(60, 60, 0x004488, 0x001122);
grid.position.y = -6;
scene.add(grid);

// A. 冰晶树 (Crystal Cone)
const crystalGeo = new THREE.BufferGeometry();
const crystalCount = 5500;
const posArray = [];
const colArray = [];
const colorIce = new THREE.Color('#e0f7fa');
const colorAurora = new THREE.Color('#00ffff');
const colorPurple = new THREE.Color('#aa00ff');

for(let i=0; i<crystalCount; i++) {
    const y = (Math.random() * 12) - 6; // -6 到 6
    const h = (y + 6) / 12; // 0 到 1
    const maxRadius = (1 - h) * 5;
    
    // 圆内随机点
    const r = maxRadius * Math.sqrt(Math.random());
    const theta = Math.random() * Math.PI * 2;
    
    const x = r * Math.cos(theta);
    const z = r * Math.sin(theta);
    
    posArray.push(x, y, z);

    // 渐变色逻辑
    const mixedColor = colorAurora.clone().lerp(colorPurple, h).lerp(colorIce, Math.random() * 0.5);
    colArray.push(mixedColor.r, mixedColor.g, mixedColor.b);
}

crystalGeo.setAttribute('position', new THREE.Float32BufferAttribute(posArray, 3));
crystalGeo.setAttribute('color', new THREE.Float32BufferAttribute(colArray, 3));

const crystalMat = new THREE.PointsMaterial({
    size: 0.15,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false
});
treeGroup.add(new THREE.Points(crystalGeo, crystalMat));

// B. 魔法光环 (Magic Rings)
function createRing(radius, y, color) {
    const points = [];
    for (let i = 0; i <= 120; i++) {
        const angle = (i / 120) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(angle)*radius, y, Math.sin(angle)*radius));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: 0.6 });
    return new THREE.LineLoop(geometry, material);
}

const ring1 = createRing(3.8, -2, 0x00ffff);
const ring2 = createRing(2.2, 2, 0xff00ff);
ring1.rotation.x = 0.1; ring1.rotation.z = 0.1;
ring2.rotation.x = -0.1; ring2.rotation.z = -0.1;
treeGroup.add(ring1);
treeGroup.add(ring2);

// C. 漫天飞雪
const snowGeo = new THREE.BufferGeometry();
const snowCount = 1200;
const snowPos = [];
const snowVel = [];

for(let i=0; i<snowCount; i++) {
    snowPos.push((Math.random()-0.5)*50, Math.random()*20, (Math.random()-0.5)*50);
    snowVel.push((Math.random()*0.05) + 0.02);
}
snowGeo.setAttribute('position', new THREE.Float32BufferAttribute(snowPos, 3));
const snowMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.12, transparent: true, opacity: 0.6 });
const snowMesh = new THREE.Points(snowGeo, snowMat);
scene.add(snowMesh);

// D. 顶部光芒 (程序生成纹理)
function createGlowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
}
const starSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: createGlowTexture(), color: 0xffffff, blending: THREE.AdditiveBlending }));
starSprite.position.set(0, 6.5, 0);
starSprite.scale.set(4, 4, 1);
treeGroup.add(starSprite);

// ===================================
// 5. 弹幕与交互逻辑
// ===================================
function createLabel(text) {
    const div = document.createElement('div');
    div.className = 'floating-label';
    div.textContent = text;
    
    const label = new CSS2DObject(div);
    const angle = Math.random() * Math.PI * 2;
    const radius = 5 + Math.random() * 4;
    const yStart = -5 + Math.random() * 10;
    
    label.position.set(Math.cos(angle)*radius, yStart, Math.sin(angle)*radius);
    label.userData = { speed: 0.003 + Math.random() * 0.008, yLimit: 8 };
    
    treeGroup.add(label);
    
    // 延迟显示
    setTimeout(() => { div.style.opacity = '1'; div.style.transform = 'scale(1)'; }, 100);
}

const fakeWishes = ["Peace", "Winter Magic", "Joy 2025", "Health", "Dream"];

async function fetchWishes() {
    // 先加载假数据撑场面
    fakeWishes.forEach(t => createLabel(t));

    if(!isDbConnected) return;

    try {
        const query = new AV.Query('Wishes');
        query.descending('createdAt');
        query.limit(40);
        const results = await query.find();
        // 清除假数据(可选)或者追加
        results.forEach(obj => { 
            const txt = obj.get('text');
            if(txt) createLabel(txt); 
        });
    } catch (error) { 
        console.warn("Fetch Error:", error); 
    }
}

async function sendWish() {
    const input = document.getElementById('wishInput');
    const text = input.value.trim();
    if(!text) return;
    
    input.value = '';
    const btn = document.getElementById('sendBtn');
    btn.innerText = "❄️";
    createLabel(text); 
    
    if(isDbConnected) {
        try {
            const WishObj = AV.Object.extend('Wishes');
            const wish = new WishObj();
            wish.set('text', text);
            await wish.save();
        } catch (error) { console.error("Save Error:", error); }
    }
    setTimeout(() => btn.innerText = "祈愿 ❄️", 1000);
}

document.getElementById('sendBtn').addEventListener('click', sendWish);
document.getElementById('wishInput').addEventListener('keypress', (e) => {
    if(e.key === 'Enter') sendWish();
});

// ===================================
// 6. 动画循环
// ===================================
const clock = new THREE.Clock();

// 启动逻辑
fetchWishes();

function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();

    // 旋转动画
    treeGroup.rotation.y = -time * 0.1;
    ring1.rotation.z = time * 0.2;
    ring2.rotation.z = -time * 0.3;
    starSprite.scale.setScalar(4 + Math.sin(time*2.5)*0.5);

    // 雪花下落
    const positions = snowMesh.geometry.attributes.position.array;
    for(let i=0; i<snowCount; i++) {
        positions[i*3 + 1] -= snowVel[i]; // Y轴
        if(positions[i*3 + 1] < -10) positions[i*3 + 1] = 10;
    }
    snowMesh.geometry.attributes.position.needsUpdate = true;

    // 弹幕上升
    treeGroup.children.forEach(child => {
        if(child instanceof CSS2DObject && child.userData.speed) {
            child.position.y += child.userData.speed;
            if(child.position.y > child.userData.yLimit) child.position.y = -6;
        }
    });

    controls.update();
    composer.render();
    labelRenderer.render(scene, camera);
}

animate();

// 窗口自适应
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
});
