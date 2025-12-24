import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

// 1. 数据库配置
const APP_ID = 'xqMFNTLCFpv0XoLWN8Cu5kSw-MdYXbMMI';
const APP_KEY = '0Fr4MZwyJSBpC2UaYGTDbI3l';
const SERVER_URL = "https://xqmfntlc.api.lncldglobal.com";

let isDbConnected = false;
const statusBar = document.getElementById('statusBar');

try {
    if (window.AV) {
        AV.init({ appId: APP_ID, appKey: APP_KEY, serverURL: SERVER_URL });
        isDbConnected = true;
        statusBar.innerText = "已连接到全网许愿池 🟢";
        console.log("LeanCloud Connected");
    }
} catch (e) {
    console.error("DB Init Error:", e);
    statusBar.innerText = "网络连接异常，进入离线模式 🔴";
}

// 2. 场景初始化
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.03); 

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 4, 14);

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
controls.autoRotateSpeed = 0.8;
controls.maxDistance = 25;
controls.minDistance = 2;
controls.maxPolarAngle = Math.PI / 2 - 0.1;

// 3. 辉光特效
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 0.15; 
bloomPass.strength = 1.8;   
bloomPass.radius = 0.8;

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

// 4. 创建 3D 圣诞树
const treeGroup = new THREE.Group();
scene.add(treeGroup);

const grid = new THREE.GridHelper(50, 50, 0x333333, 0x111111);
grid.position.y = -5;
scene.add(grid);

// 螺旋主体
const spiralGeo = new THREE.BufferGeometry();
const spiralCount = 3500;
const posArray = [];
const colArray = [];
const colorTop = new THREE.Color('#00ffaa'); 
const colorBottom = new THREE.Color('#ff0055'); 

for(let i=0; i<spiralCount; i++) {
    const t = i / spiralCount; 
    const angle = t * 40; 
    const radius = (1-t) * 5; 
    const y = t * 11 - 5; 
    
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    
    posArray.push(x + (Math.random()-0.5)*0.3, y, z + (Math.random()-0.5)*0.3);
    
    const mixedColor = colorBottom.clone().lerp(colorTop, t);
    colArray.push(mixedColor.r, mixedColor.g, mixedColor.b);
}

spiralGeo.setAttribute('position', new THREE.Float32BufferAttribute(posArray, 3));
spiralGeo.setAttribute('color', new THREE.Float32BufferAttribute(colArray, 3));

const spiralMat = new THREE.PointsMaterial({
    size: 0.12,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false
});
treeGroup.add(new THREE.Points(spiralGeo, spiralMat));

// 装饰彩球
const ornGeo = new THREE.BufferGeometry();
const ornCount = 100;
const ornPos = [];
const ornCol = [];

for(let i=0; i<ornCount; i++) {
    const y = Math.random() * 11 - 5;
    const t = (y+5)/11;
    const radius = (1-t) * 5 + 0.5;
    const angle = Math.random() * Math.PI * 2;
    ornPos.push(Math.cos(angle)*radius, y, Math.sin(angle)*radius);
    const c = Math.random() > 0.5 ? new THREE.Color(0xffaa00) : new THREE.Color(0xffffff);
    ornCol.push(c.r, c.g, c.b);
}
ornGeo.setAttribute('position', new THREE.Float32BufferAttribute(ornPos, 3));
ornGeo.setAttribute('color', new THREE.Float32BufferAttribute(ornCol, 3));
treeGroup.add(new THREE.Points(ornGeo, new THREE.PointsMaterial({
    size: 0.35, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
})));

// 顶部星星 (不需要加载外部图片，直接用代码生成纹理)
// 【修改点 3】 动态生成光晕 Canvas，无需加载外部 png
function createGlowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32; canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 215, 0, 1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(canvas);
}

const starGeo = new THREE.SphereGeometry(0.25);
const starMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
const star = new THREE.Mesh(starGeo, starMat);
star.position.set(0, 6.2, 0);
treeGroup.add(star);

const spriteMat = new THREE.SpriteMaterial({ 
    map: createGlowTexture(), // 使用动态生成的纹理
    color: 0xffd700, 
    transparent: true, 
    blending: THREE.AdditiveBlending 
});
const sprite = new THREE.Sprite(spriteMat);
sprite.scale.set(4, 4, 1);
star.add(sprite);

// 5. 弹幕逻辑
const labels = [];

function createLabel(text) {
    const div = document.createElement('div');
    div.className = 'floating-label';
    div.textContent = text;
    const hue = Math.floor(Math.random() * 360);
    div.style.borderColor = `hsl(${hue}, 80%, 60%)`;
    div.style.boxShadow = `0 0 15px hsl(${hue}, 80%, 60%, 0.3)`;

    const label = new CSS2DObject(div);
    const angle = Math.random() * Math.PI * 2;
    const radius = 4 + Math.random() * 3;
    const yStart = -4 + Math.random() * 8;
    
    label.position.set(Math.cos(angle)*radius, yStart, Math.sin(angle)*radius);
    label.userData = { speed: 0.005 + Math.random() * 0.01, yLimit: 7 };
    
    treeGroup.add(label);
    labels.push(label);

    setTimeout(() => { div.style.opacity = '1'; div.style.transform = 'scale(1)'; }, 100);
}

async function fetchWishes() {
    if(!isDbConnected) {
        ["Merry Christmas", "暴富", "平安喜乐", "Happy 2025"].forEach(t => createLabel(t));
        return;
    }
    try {
        const query = new AV.Query('Wishes');
        query.descending('createdAt');
        query.limit(50);
        const results = await query.find();
        results.forEach(obj => { if(obj.get('text')) createLabel(obj.get('text')); });
    } catch (error) { console.error("Fetch Error:", error); }
}

async function sendWish() {
    const input = document.getElementById('wishInput');
    const text = input.value.trim();
    if(!text) return;
    
    input.value = '';
    const btn = document.getElementById('sendBtn');
    const originalText = btn.innerText;
    btn.innerText = "发送中...";
    createLabel(text); // 本地立即显示

    if(isDbConnected) {
        try {
            const WishObj = AV.Object.extend('Wishes');
            const wish = new WishObj();
            wish.set('text', text);
            await wish.save();
            btn.innerText = "成功! ✅";
        } catch (error) {
            console.error("Save Error:", error);
            btn.innerText = "失败 ❌";
        }
    }
    setTimeout(() => btn.innerText = originalText, 2000);
}

document.getElementById('sendBtn').addEventListener('click', sendWish);
document.getElementById('wishInput').addEventListener('keypress', (e) => {
    if(e.key === 'Enter') sendWish();
});

// 6. 动画循环
const clock = new THREE.Clock();
const loader = document.getElementById('loader');

fetchWishes();
setTimeout(() => { loader.style.opacity = '0'; setTimeout(()=>loader.style.display='none', 800); }, 1500);

function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();

    treeGroup.rotation.y = time * 0.1;
    sprite.material.opacity = 0.6 + Math.sin(time*3)*0.3;

    labels.forEach(label => {
        label.position.y += label.userData.speed;
        if(label.position.y > label.userData.yLimit) label.position.y = -5;
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
