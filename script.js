import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

const APP_ID = 'xqMFNTLCFpv0XoLWN8Cu5kSw-MdYXbMMI';
const APP_KEY = '0Fr4MZwyJSBpC2UaYGTDbI3l';
const SERVER_URL = "https://xqmfntlc.api.lncldglobal.com";

let isDbConnected = false;
const statusBar = document.getElementById('statusBar');

function forceHideLoader() {
    const loader = document.getElementById('loader');
    if (loader && loader.style.display !== 'none') {
        loader.style.opacity = '0';
        setTimeout(() => { loader.style.display = 'none'; }, 800);
    }
}
setTimeout(forceHideLoader, 2500);

try {
    if (window.AV) {
        AV.init({ appId: APP_ID, appKey: APP_KEY, serverURL: SERVER_URL });
        isDbConnected = true;
        statusBar.innerText = "已连接到极光许愿池 🟢";
        console.log("LeanCloud Connected");
    }
} catch (e) {
    console.warn("Offline Mode:", e);
    statusBar.innerText = "离线模式 ⚪";
}

// 场景
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x051020, 0.02); 

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
controls.maxPolarAngle = Math.PI / 1.7;

// 后期
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 0.2; bloomPass.strength = 1.6; bloomPass.radius = 0.5;
const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

// 树
const treeGroup = new THREE.Group();
scene.add(treeGroup);

const grid = new THREE.GridHelper(60, 60, 0x004488, 0x001122);
grid.position.y = -6;
scene.add(grid);

const crystalGeo = new THREE.BufferGeometry();
const crystalCount = 5500;
const posArray = [];
const colArray = [];
const colorIce = new THREE.Color('#e0f7fa');
const colorAurora = new THREE.Color('#00ffff');
const colorPurple = new THREE.Color('#aa00ff');

for(let i=0; i<crystalCount; i++) {
    const y = (Math.random() * 12) - 6; 
    const h = (y + 6) / 12; 
    const maxRadius = (1 - h) * 5;
    const r = maxRadius * Math.sqrt(Math.random());
    const theta = Math.random() * Math.PI * 2;
    const x = r * Math.cos(theta);
    const z = r * Math.sin(theta);
    posArray.push(x, y, z);
    const mixedColor = colorAurora.clone().lerp(colorPurple, h).lerp(colorIce, Math.random() * 0.5);
    colArray.push(mixedColor.r, mixedColor.g, mixedColor.b);
}
crystalGeo.setAttribute('position', new THREE.Float32BufferAttribute(posArray, 3));
crystalGeo.setAttribute('color', new THREE.Float32BufferAttribute(colArray, 3));
const crystalMat = new THREE.PointsMaterial({ size: 0.15, vertexColors: true, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
treeGroup.add(new THREE.Points(crystalGeo, crystalMat));

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

const snowGeo = new THREE.BufferGeometry();
const snowCount = 1200;
const snowPos = [];
const snowVel = [];
for(let i=0; i<snowCount; i++) {
    snowPos.push((Math.random()-0.5)*50, Math.random()*20, (Math.random()-0.5)*50);
    snowVel.push((Math.random()*0.05) + 0.02);
}
snowGeo.setAttribute('position', new THREE.Float32BufferAttribute(snowPos, 3));
const snowMesh = new THREE.Points(snowGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.12, transparent: true, opacity: 0.6 }));
scene.add(snowMesh);

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

// ================= 弹幕逻辑 (带署名) =================

// 创建弹幕标签
function createLabel(text, name = "") {
    const div = document.createElement('div');
    div.className = 'floating-label';
    
    // 如果有名字，显示名字，否则只显示愿望
    if (name && name.trim() !== "") {
        div.innerHTML = `<span>${text}</span><span class="label-name">@${name}</span>`;
    } else {
        div.textContent = text;
    }
    
    const label = new CSS2DObject(div);
    const angle = Math.random() * Math.PI * 2;
    const radius = 5 + Math.random() * 4;
    const yStart = -5 + Math.random() * 10;
    
    label.position.set(Math.cos(angle)*radius, yStart, Math.sin(angle)*radius);
    label.userData = { speed: 0.003 + Math.random() * 0.008, yLimit: 8 };
    
    treeGroup.add(label);
    
    setTimeout(() => { div.style.opacity = '1'; div.style.transform = 'scale(1)'; }, 100);
}

// 假数据
const fakeWishes = [
    {text: "Happy 2025", name: "Gordon"},
    {text: "Peace & Love", name: "Santa"},
    {text: "Winter Magic", name: "Elsa"}
];

// 获取愿望
async function fetchWishes() {
    fakeWishes.forEach(item => createLabel(item.text, item.name));

    if(!isDbConnected) return;

    try {
        const query = new AV.Query('Wishes');
        query.descending('createdAt');
        query.limit(50);
        const results = await query.find();
        results.forEach(obj => { 
            const txt = obj.get('text');
            const nm = obj.get('name'); // 获取名字
            if(txt) createLabel(txt, nm); 
        });
    } catch (error) { 
        console.warn("Fetch Error:", error); 
    }
}

// 发送愿望
async function sendWish() {
    const wishInput = document.getElementById('wishInput');
    const nameInput = document.getElementById('nameInput');
    
    const text = wishInput.value.trim();
    // 如果名字没填，就为空字符串
    const name = nameInput.value.trim(); 

    if(!text) return;
    
    wishInput.value = '';
    // nameInput.value = ''; // 名字保留，方便用户发下一条
    
    const btn = document.getElementById('sendBtn');
    btn.innerText = "❄️";
    
    // 立即显示
    createLabel(text, name); 
    
    if(isDbConnected) {
        try {
            const WishObj = AV.Object.extend('Wishes');
            const wish = new WishObj();
            wish.set('text', text);
            wish.set('name', name); // 存入名字
            await wish.save();
        } catch (error) { console.error("Save Error:", error); }
    }
    setTimeout(() => btn.innerText = "发送 ❄️", 1000);
}

document.getElementById('sendBtn').addEventListener('click', sendWish);
document.getElementById('wishInput').addEventListener('keypress', (e) => {
    if(e.key === 'Enter') sendWish();
});

const clock = new THREE.Clock();
fetchWishes();

function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();

    treeGroup.rotation.y = -time * 0.1;
    ring1.rotation.z = time * 0.2;
    ring2.rotation.z = -time * 0.3;
    starSprite.scale.setScalar(4 + Math.sin(time*2.5)*0.5);

    const positions = snowMesh.geometry.attributes.position.array;
    for(let i=0; i<snowCount; i++) {
        positions[i*3 + 1] -= snowVel[i];
        if(positions[i*3 + 1] < -10) positions[i*3 + 1] = 10;
    }
    snowMesh.geometry.attributes.position.needsUpdate = true;

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
