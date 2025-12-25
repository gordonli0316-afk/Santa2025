import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

// 1. 数据库配置 (沿用你之前的ID，或者去LeanCloud新建一个)
const APP_ID = 'xqMFNTLCFpv0XoLWN8Cu5kSw-MdYXbMMI';
const APP_KEY = '0Fr4MZwyJSBpC2UaYGTDbI3l';
const SERVER_URL = "https://xqmfntlc.api.lncldglobal.com";

let isDbConnected = false;
const statusBar = document.getElementById('statusBar');

try {
    if (window.AV) {
        AV.init({ appId: APP_ID, appKey: APP_KEY, serverURL: SERVER_URL });
        isDbConnected = true;
        statusBar.innerText = "已连接到极光许愿池 🟢";
        console.log("LeanCloud Connected");
    }
} catch (e) {
    console.error(e);
    statusBar.innerText = "离线模式 ⚪";
}

// 2. 场景初始化
const scene = new THREE.Scene();
// 冰蓝色的雾，模拟极光环境
scene.fog = new THREE.FogExp2(0x051020, 0.02); 

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 2, 16); // 视角稍微放低，仰视

const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.CineonToneMapping; // 电影感色调
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
controls.autoRotateSpeed = 0.5;
controls.maxDistance = 20;
controls.minDistance = 5;
controls.maxPolarAngle = Math.PI / 1.8; // 禁止看到底部

// 3. 辉光特效 (冷色调)
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 0.2;
bloomPass.strength = 1.5; // 强度适中
bloomPass.radius = 0.5;

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

// 4. 创建 "冰晶树" (Crystal Tree)
const treeGroup = new THREE.Group();
scene.add(treeGroup);

// 地面反射网格 (淡蓝色)
const grid = new THREE.GridHelper(60, 60, 0x004488, 0x001122);
grid.position.y = -6;
scene.add(grid);

// A. 树体：圆锥体内部的随机粒子云
const crystalGeo = new THREE.BufferGeometry();
const crystalCount = 5000;
const posArray = [];
const colArray = [];
const colorIce = new THREE.Color('#e0f7fa');   // 冰白
const colorAurora = new THREE.Color('#00ffff'); // 青光
const colorPurple = new THREE.Color('#aa00ff'); // 紫光

for(let i=0; i<crystalCount; i++) {
    // 圆锥体随机分布算法
    // 高度 y 从 -6 到 6 (总高12)
    const y = (Math.random() * 12) - 6; 
    // 半径随高度变化: 底部宽(5), 顶部尖(0)
    // 归一化高度 h: 0(底) -> 1(顶)
    const h = (y + 6) / 12; 
    const maxRadius = (1 - h) * 5;
    
    // 在圆内随机分布
    const r = maxRadius * Math.sqrt(Math.random()); 
    const theta = Math.random() * Math.PI * 2;
    
    const x = r * Math.cos(theta);
    const z = r * Math.sin(theta);
    
    posArray.push(x, y, z);

    // 颜色混合：底部青色，顶部紫色/白色
    const mixedColor = colorAurora.clone().lerp(colorPurple, h).lerp(colorIce, Math.random()*0.5);
    colArray.push(mixedColor.r, mixedColor.g, mixedColor.b);
}

crystalGeo.setAttribute('position', new THREE.Float32BufferAttribute(posArray, 3));
crystalGeo.setAttribute('color', new THREE.Float32BufferAttribute(colArray, 3));

const crystalMat = new THREE.PointsMaterial({
    size: 0.15,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false
});
const treeMesh = new THREE.Points(crystalGeo, crystalMat);
treeGroup.add(treeMesh);

// B. 魔法光环 (Magic Rings)
function createRing(radius, y, color) {
    const points = [];
    for (let i = 0; i < 120; i++) {
        const angle = (i / 120) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(angle)*radius, y, Math.sin(angle)*radius));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: 0.5 });
    const ring = new THREE.LineLoop(geometry, material);
    return ring;
}

const ring1 = createRing(3.5, -2, 0x00ffff);
const ring2 = createRing(2.0, 2, 0xff00ff);
// 让光环稍微倾斜
ring1.rotation.x = 0.1;
ring1.rotation.z = 0.1;
ring2.rotation.x = -0.1;
ring2.rotation.z = -0.1;

treeGroup.add(ring1);
treeGroup.add(ring2);

// C. 漫天飞雪 (Falling Snow)
const snowGeo = new THREE.BufferGeometry();
const snowCount = 1000;
const snowPos = [];
const snowVel = []; // 速度

for(let i=0; i<snowCount; i++) {
    snowPos.push(
        (Math.random() - 0.5) * 40, // 宽范围
        (Math.random() * 20),       // 高度
        (Math.random() - 0.5) * 40
    );
    snowVel.push((Math.random() * 0.05) + 0.02); // 下落速度
}
snowGeo.setAttribute('position', new THREE.Float32BufferAttribute(snowPos, 3));
const snowMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.1,
    transparent: true,
    opacity: 0.6
});
const snowMesh = new THREE.Points(snowGeo, snowMat);
scene.add(snowMesh);

// D. 顶部光芒
function createGlowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32; canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(canvas);
}
const starSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: createGlowTexture(),
    color: 0xffffff,
    blending: THREE.AdditiveBlending
}));
starSprite.position.set(0, 6.5, 0);
starSprite.scale.set(3, 3, 1);
treeGroup.add(starSprite);

// 5. 弹幕逻辑 (保持不变，只是样式变了)
function createLabel(text) {
    const div = document.createElement('div');
    div.className = 'floating-label';
    div.textContent = text;
    
    const label = new CSS2DObject(div);
    const angle = Math.random() * Math.PI * 2;
    // 弹幕分布在树的外围
    const radius = 5 + Math.random() * 3; 
    const yStart = -5 + Math.random() * 10;
    
    label.position.set(Math.cos(angle)*radius, yStart, Math.sin(angle)*radius);
    label.userData = { speed: 0.003 + Math.random() * 0.005, yLimit: 8 };
    
    treeGroup.add(label);
    
    setTimeout(() => { div.style.opacity = '1'; div.style.transform = 'scale(1)'; }, 100);
}

// 模拟假数据
const fakeWishes = ["Peace", "Love", "Winter Magic", "Joy", "2025"];

async function fetchWishes() {
    if(!isDbConnected) {
        fakeWishes.forEach(t => createLabel(t));
        return;
    }
    try {
        const query = new AV.Query('Wishes');
        query.descending('createdAt');
        query.limit(40);
        const results = await query.find();
        results.forEach(obj => { if(obj.get('text')) createLabel(obj.get('text')); });
    } catch (error) { console.error(error); }
}

async function sendWish() {
    const input = document.getElementById('wishInput');
    const text = input.value.trim();
    if(!text) return;
    
    input.value = '';
    const btn = document.getElementById('sendBtn');
    const originalText = btn.innerText;
    btn.innerText = "❄️";
    createLabel(text); 

    if(isDbConnected) {
        try {
            const WishObj = AV.Object.extend('Wishes');
            const wish = new WishObj();
            wish.set('text', text);
            await wish.save();
        } catch (error) { console.error(error); }
    }
    setTimeout(() => btn.innerText = originalText, 1000);
}

document.getElementById('sendBtn').addEventListener('click', sendWish);
document.getElementById('wishInput').addEventListener('keypress', (e) => {
    if(e.key === 'Enter') sendWish();
});

// 6. 动画循环
const clock = new THREE.Clock();
const loader = document.getElementById('loader');

fetchWishes();
setTimeout(() => { loader.style.opacity = '0'; setTimeout(()=>loader.style.display='none', 1000); }, 1500);

function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();

    // 树整体缓慢旋转
    treeMesh.rotation.y = -time * 0.1; // 反方向
    
    // 光环旋转
    ring1.rotation.z = time * 0.2;
    ring2.rotation.z = -time * 0.3;

    // 顶部星光呼吸
    starSprite.scale.setScalar(3 + Math.sin(time*2)*0.5);

    // 雪花下落
    const positions = snowMesh.geometry.attributes.position.array;
    for(let i=0; i<snowCount; i++) {
        // Y轴下移
        positions[i*3 + 1] -= snowVel[i];
        // 如果掉到底部，重置回顶部
        if(positions[i*3 + 1] < -10) {
            positions[i*3 + 1] = 10;
        }
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

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
});
