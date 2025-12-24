import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- 1. 场景初始化 ---
const scene = new THREE.Scene();
// 添加一些雾化效果，让远处看起来更深邃
scene.fog = new THREE.FogExp2(0x050505, 0.02); 

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 15); // 调整相机初始位置

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
// 设置色调映射，让发光效果更真实
renderer.toneMapping = THREE.ReinhardToneMapping;
document.getElementById('canvas-container').appendChild(renderer.domElement);

// 添加轨道控制器（鼠标拖拽）
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // 开启阻尼，有惯性感觉更高级
controls.dampingFactor = 0.05;
controls.autoRotate = true;     // 开启自动旋转
controls.autoRotateSpeed = 1.0; // 旋转速度

// --- 2. 创建 3D 圣诞树 ---

// 生成一个圆形的纹理，避免加载外部图片可能出现的跨域问题
function getTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)');
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.2)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 32, 32);
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
}

const particleTexture = getTexture();

// 创建螺旋树函数
function createSpiralTree() {
    const geometry = new THREE.BufferGeometry();
    const count = 3000; // 粒子数量，越多越密
    const positions = [];
    const colors = [];
    
    const colorInside = new THREE.Color('#0f5e0f'); // 内部深绿
    const colorOutside = new THREE.Color('#4eff4e'); // 外部亮绿
    const colorDecor = new THREE.Color('#ff0000');   // 装饰红

    for (let i = 0; i < count; i++) {
        // 螺旋算法
        const i3 = i * 3;
        const angle = i * 0.15; // 角度步进
        const radius = (i / count) * 4; // 半径随高度变大（倒锥体）
        
        // 我们需要把树倒过来，让尖端朝上
        // 原始 y 是从 0 到 count，我们需要翻转映射
        const y = 8 - (i / count) * 10; 

        // 加入随机性，让树看起来自然蓬松
        const randomX = (Math.random() - 0.5) * 0.5;
        const randomY = (Math.random() - 0.5) * 0.5;
        const randomZ = (Math.random() - 0.5) * 0.5;

        const x = Math.cos(angle) * radius + randomX;
        const z = Math.sin(angle) * radius + randomZ;

        positions.push(x, y + randomY, z);

        // 颜色混合逻辑：偶尔出现红色或金色的装饰点
        const mixedColor = colorInside.clone();
        if (Math.random() < 0.1) {
            mixedColor.setHex(Math.random() < 0.5 ? 0xff0000 : 0xffd700); // 红或金
        } else {
            mixedColor.lerp(colorOutside, (y + 2) / 10);
        }

        colors.push(mixedColor.r, mixedColor.g, mixedColor.b);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.15,
        map: particleTexture,
        transparent: true,
        alphaTest: 0.01,
        vertexColors: true,
        depthWrite: false, // 关键：让粒子互相叠加发光
        blending: THREE.AdditiveBlending // 关键：发光混合模式
    });

    const tree = new THREE.Points(geometry, material);
    scene.add(tree);
    return tree;
}

const tree = createSpiralTree();

// 添加树顶的星星
function createStar() {
    const geometry = new THREE.SphereGeometry(0.3, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const star = new THREE.Mesh(geometry, material);
    star.position.set(0, 8.2, 0);
    scene.add(star);

    // 星星的光晕
    const light = new THREE.PointLight(0xffaa00, 2, 20);
    light.position.set(0, 8.2, 0);
    scene.add(light);
}
createStar();

// --- 3. 创建下雪效果 ---
const snowGeometry = new THREE.BufferGeometry();
const snowCount = 1000;
const snowPos = [];
const snowVelocities = []; // 每个雪花的速度

for (let i = 0; i < snowCount; i++) {
    snowPos.push((Math.random() - 0.5) * 20); // x
    snowPos.push((Math.random() - 0.5) * 20 + 5); // y (偏上)
    snowPos.push((Math.random() - 0.5) * 20); // z
    
    // 随机下落速度
    snowVelocities.push({
        y: - (Math.random() * 0.05 + 0.01),
        x: (Math.random() - 0.5) * 0.01,
        z: (Math.random() - 0.5) * 0.01
    });
}
snowGeometry.setAttribute('position', new THREE.Float32BufferAttribute(snowPos, 3));
const snowMaterial = new THREE.PointsMaterial({
    size: 0.1,
    color: 0xffffff,
    transparent: true,
    opacity: 0.8,
    map: particleTexture
});
const snowSystem = new THREE.Points(snowGeometry, snowMaterial);
scene.add(snowSystem);

// --- 4. 动画循环 ---
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const time = clock.getElapsedTime();
    
    // 树的呼吸灯效果（轻微闪烁）
    tree.material.size = 0.15 + Math.sin(time * 2) * 0.02;

    // 更新雪花位置
    const positions = snowSystem.geometry.attributes.position.array;
    for (let i = 0; i < snowCount; i++) {
        // 更新 x, y, z
        positions[i * 3 + 1] += snowVelocities[i].y; // y 轴下落
        positions[i * 3] += Math.sin(time + i) * 0.005; // x 轴轻微摆动

        // 如果掉到底部，重置到顶部
        if (positions[i * 3 + 1] < -5) {
            positions[i * 3 + 1] = 10;
        }
    }
    snowSystem.geometry.attributes.position.needsUpdate = true;

    // 只有当用户没有交互时才自动旋转
    controls.update();

    renderer.render(scene, camera);
}

animate();

// --- 5. 窗口大小自适应 ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- 6. UI 交互逻辑 (与之前版本兼容) ---
document.addEventListener('DOMContentLoaded', () => {
    const nameInput = document.getElementById('nameInput');
    const msgInput = document.getElementById('msgInput');
    const generateBtn = document.getElementById('generateBtn');
    const shareTip = document.getElementById('shareTip');
    const greetingTitle = document.getElementById('greeting-title');
    const greetingMessage = document.getElementById('greeting-message');
    const inputSection = document.getElementById('inputSection');
    const createOwnSection = document.getElementById('createOwnSection');
    const resetBtn = document.getElementById('resetBtn');

    // 解析 URL 参数
    const urlParams = new URLSearchParams(window.location.search);
    const fromName = urlParams.get('name');
    const message = urlParams.get('msg');

    if (fromName || message) {
        // 查看模式
        if (fromName) greetingTitle.innerText = `${fromName} 祝你圣诞快乐`;
        if (message) greetingMessage.innerText = message;
        inputSection.style.display = 'none';
        createOwnSection.style.display = 'block';
        // 自动旋转稍微快一点，展示效果
        controls.autoRotateSpeed = 2.0;
    }

    generateBtn.addEventListener('click', () => {
        const name = nameInput.value.trim();
        const msg = msgInput.value.trim();
        if (!name && !msg) {
            alert("写点什么吧！");
            return;
        }

        // 修改当前页面显示
        greetingTitle.innerText = `${name} 祝你圣诞快乐`;
        greetingMessage.innerText = msg;

        // 生成链接
        const newUrl = new URL(window.location.href);
        if (name) newUrl.searchParams.set('name', name);
        if (msg) newUrl.searchParams.set('msg', msg);
        window.history.pushState({}, '', newUrl);

        // 复制
        navigator.clipboard.writeText(newUrl.href).then(() => {
            shareTip.style.display = 'block';
            generateBtn.innerText = "复制成功！✅";
            setTimeout(() => {
                shareTip.style.display = 'none';
                generateBtn.innerText = "生成专属祝福链接 🔗";
            }, 3000);
        });
    });

    resetBtn.addEventListener('click', () => {
        const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.pushState({}, '', cleanUrl);
        
        greetingTitle.innerText = "Merry Christmas";
        greetingMessage.innerText = "送给你一片璀璨星河";
        inputSection.style.display = 'flex';
        createOwnSection.style.display = 'none';
        nameInput.value = '';
        msgInput.value = '';
    });
});
