const lenis = new Lenis({ duration: 1.2 });
function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
requestAnimationFrame(raf);

// --- 1. 生成散落布局 ---
async function initScatterCanvas() {
    const canvas = document.getElementById('canvas-container');
    const TOTAL_IMAGES = 100;
    
    // 我们把 300vw x 300vh 的画布切分成一个 10x10 的松散网格
    const cols = 10;
    const rows = 10;
    const cellWidth = 300 / cols; // 每格占 30vw
    const cellHeight = 300 / rows; // 每格占 30vh

    for (let i = 1; i <= TOTAL_IMAGES; i++) {
        // 计算当前图片属于第几行第几列
        const row = Math.floor((i - 1) / cols);
        const col = (i - 1) % cols;

        // 核心：在网格基础上加入极大的“随机扰动”，打破整齐感
        const randomX = (Math.random() * 15 - 7.5); // -7.5vw 到 7.5vw 偏移
        const randomY = (Math.random() * 15 - 7.5); // -7.5vh 到 7.5vh 偏移
        const randomRot = (Math.random() * 60 - 30); // 随机旋转 -30度 到 30度

        const xPos = (col * cellWidth) + randomX;
        const yPos = (row * cellHeight) + randomY;

        const item = document.createElement('div');
        item.className = 'scatter-item';
        
        // 赋予随机位置和初始旋转角度
        item.style.left = `${xPos}vw`;
        item.style.top = `${yPos}vh`;
        // 用 CSS 变量存储初始角度，方便 hover 时复原
        item.style.setProperty('--base-rot', `${randomRot}deg`);
        item.style.transform = `rotate(${randomRot}deg)`;
        item.style.zIndex = Math.floor(Math.random() * 100);

        // 懒加载图片结构
        item.innerHTML = `
            <img data-src="images/${i}.png" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" class="lazy-img" alt="Scatter ${i}">
        `;
        
        // 悬停交互：使用 JS 辅助去除旋转
        item.addEventListener('mouseenter', () => {
            item.style.transform = `rotate(0deg) scale(1.1)`;
        });
        item.addEventListener('mouseleave', () => {
            item.style.transform = `rotate(${item.style.getPropertyValue('--base-rot')})`;
        });

        canvas.appendChild(item);
    }

    initLazyLoading();
    startCameraFlight();
}

// --- 2. 懒加载 (与之前类似，复用即可) ---
function initLazyLoading() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target.querySelector('img');
                if (img && img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
            }
        });
    }, { rootMargin: '200% 200%' }); // 加大预加载范围，防止相机移动过快
    document.querySelectorAll('.scatter-item').forEach(item => observer.observe(item));
}

// --- 3. GSAP 摄像机飞行轨迹 (Camera Roaming) ---
function startCameraFlight() {
    gsap.registerPlugin(ScrollTrigger);
    const canvas = document.getElementById('canvas-container');

    // 固定视口，滚动 10000px 的长度来完成整个漫游之旅
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: ".scatter-viewport",
            pin: true,
            start: "top top",
            end: "+=10000", 
            scrub: 1.5, // 稍微增加平滑度，让镜头移动更稳
        }
    });

    // 初始状态：镜头停在左上角，局部放大
    gsap.set(canvas, { scale: 1.8, xPercent: 35, yPercent: 35 });

    // 绘制无人机巡航轨迹 (通过反向移动画布实现)
    tl.to(canvas, { xPercent: -35, yPercent: 20, scale: 1.5, ease: "power1.inOut" }) // 向右滑
      .to(canvas, { xPercent: -20, yPercent: -35, scale: 2, ease: "power1.inOut" })   // 冲向右下角某一张特写
      .to(canvas, { xPercent: 30, yPercent: -20, scale: 1.2, ease: "power1.inOut" })  // 拉远并向左滑
      .to(canvas, { xPercent: 0, yPercent: 0, scale: 0.4, ease: "power3.inOut" });    // 最终史诗级拉远：看清所有 100 张照片的全貌
}

initScatterCanvas();