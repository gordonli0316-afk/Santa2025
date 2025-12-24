document.addEventListener('DOMContentLoaded', () => {
    const lightsContainer = document.getElementById('lights-container');
    const treeWrapper = document.getElementById('treeWrapper');
    const toggleBtn = document.getElementById('toggleLightsBtn');
    const colorBtns = document.querySelectorAll('.color-btn');

    let isLightsOn = true;

    // 1. 生成灯光的函数
    function createLights(count) {
        for (let i = 0; i < count; i++) {
            const light = document.createElement('div');
            light.classList.add('light');
            
            // 随机位置算法 (让灯光大致分布在三角形区域内)
            // 这是一个简化的近似做法，让灯光集中在中间和下方
            const top = Math.random() * 230 + 30; // 30px 到 260px 之间
            // 越往下，宽度越宽。简单的线性插值。
            // 顶部(top=30) 宽度范围约 60px，底部(top=260) 宽度范围约 180px
            const widthSpread = (top / 260) * 160 + 20; 
            const left = 150 - (widthSpread / 2) + Math.random() * widthSpread;

            light.style.top = `${top}px`;
            light.style.left = `${left}px`;

            // 随机动画延迟，让闪烁看起来自然不同步
            light.style.animationDelay = `${Math.random() * 2}s`;

            lightsContainer.appendChild(light);
        }
    }

    // 2. 开关灯光交互
    toggleBtn.addEventListener('click', () => {
        isLightsOn = !isLightsOn;
        if (isLightsOn) {
            treeWrapper.classList.remove('lights-off');
            toggleBtn.innerText = "开关灯光 💡 (已开)";
        } else {
            treeWrapper.classList.add('lights-off');
            toggleBtn.innerText = "开关灯光 💡 (已关)";
        }
    });

    // 3. 切换颜色交互
    colorBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const color = e.target.dataset.color;
            const root = document.documentElement;

            if (color === 'multi') {
                treeWrapper.classList.add('multi-color-mode');
            } else {
                treeWrapper.classList.remove('multi-color-mode');
                // 更新 CSS 变量
                root.style.setProperty('--light-color', color);
                root.style.setProperty('--light-shadow', `rgba(${hexToRgb(color)}, 0.7)`);
            }
        });
    });

    // 辅助函数：将颜色名称/Hex 转换为 RGB，用于阴影透明度
    function hexToRgb(colorName) {
        const tempDiv = document.createElement('div');
        tempDiv.style.color = colorName;
        document.body.appendChild(tempDiv);
        const rgbs = getComputedStyle(tempDiv).color.match(/\d+/g);
        document.body.removeChild(tempDiv);
        return rgbs ? `${rgbs[0]}, ${rgbs[1]}, ${rgbs[2]}` : '255, 215, 0';
    }

    // 初始化：生成 40 个灯泡
    createLights(40);
});