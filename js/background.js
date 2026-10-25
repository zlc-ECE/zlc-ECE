/* ============================================================
   动态背景（原创实现，无第三方库）
   三层结构：
     1. 缓慢游走的大光斑：负责“一眼能看见”的空间流动感
     2. 流场粒子 + 近距连线：粒子沿正弦流场漂移，形成持续变化的网
     3. 鼠标交互：靠近的粒子被推开，并和光标连线、出现光晕
   兼容：随窗口自适应、跟随明暗主题换色、页面隐藏暂停、
        系统开启“减少动态效果”时只画一帧静态背景。
   ============================================================ */

(function () {
    var canvas = document.getElementById("bgCanvas");
    if (!canvas) return;

    var ctx = canvas.getContext("2d");
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    var width = 0;
    var height = 0;
    var dpr = 1;
    var particles = [];
    var orbs = [];
    var rgb = "13,148,136";        // 主题主色的 RGB 字符串，跟随 CSS 变量 --accent
    var time = 0;                  // 全局时间，让流场缓慢转动
    var rafId = null;
    var resizeTimer = null;

    /* 彩蛋用：Konami 码触发后循环这组颜色 */
    var RAINBOW = ["244,63,94", "249,115,22", "234,179,8", "34,197,94", "59,130,246", "168,85,247"];
    var rainbowEnd = 0;            // 彩虹模式结束时间戳
    var rainbowOn = false;

    /* 鼠标状态：只有桌面端才启用 */
    var pointer = { x: 0, y: 0, active: false };
    var parallax = { x: 0, y: 0 };      // 视差偏移，光斑会跟着鼠标轻微移动
    var mouseIsFine = window.matchMedia("(pointer: fine)").matches;

    var REPEL_RADIUS = 170;        // 鼠标排斥半径
    var LINK_DISTANCE = 150;       // 粒子连线距离
    var PARTICLE_SPEED = 1.25;     // 粒子基础速度（越大越明显）

    /* ---------- 颜色工具：把 #0d9488 转成 "13,148,136" ---------- */
    function hexToRgb(hex) {
        hex = hex.replace("#", "").trim();
        if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        var num = parseInt(hex, 16);
        if (isNaN(num)) return "13,148,136";
        return [(num >> 16) & 255, (num >> 8) & 255, num & 255].join(",");
    }

    function readColor() {
        var value = getComputedStyle(document.documentElement)
            .getPropertyValue("--accent").trim();
        rgb = hexToRgb(value || "#0d9488");
    }

    /* ---------- 初始化粒子与光斑 ---------- */
    function createScene() {
        particles = [];
        var count = Math.min(150, Math.max(50, Math.round((width * height) / 11000)));

        for (var i = 0; i < count; i++) {
            var angle = Math.random() * Math.PI * 2;
            var speed = PARTICLE_SPEED * (0.6 + Math.random() * 0.8);
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                angle: angle,                       // 当前前进方向
                speed: speed,                       // 速度大小（基本不变）
                phase: Math.random() * Math.PI * 2, // 摆动相位，让每颗粒子拐弯节奏不同
                turn: (Math.random() - 0.5) * 0.004,// 固定微转角，路径更像弧线
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                r: 1.1 + Math.random() * 1.9
            });
        }

        orbs = [
            { x: width * 0.18, y: height * 0.22, r: Math.max(width, height) * 0.32,
              a1: 86, a2: 64, s1: 0.00023, s2: 0.00031, p: 0, depth: 1 },
            { x: width * 0.82, y: height * 0.30, r: Math.max(width, height) * 0.28,
              a1: 76, a2: 94, s1: 0.00019, s2: 0.00027, p: 2.1, depth: 0.7 },
            { x: width * 0.55, y: height * 0.88, r: Math.max(width, height) * 0.36,
              a1: 104, a2: 52, s1: 0.00016, s2: 0.00022, p: 4.2, depth: 1.3 }
        ];
    }

    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = canvas.clientWidth || window.innerWidth;
        height = canvas.clientHeight || window.innerHeight;

        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        createScene();
    }

    /* ---------- 更新：粒子方向 + 鼠标排斥 ---------- */
    function updateParticles() {
        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];

            // 每个粒子有自己的前进方向，方向随时间缓慢摆动 → 会自动拐弯
            // 速度大小保持不变，所以粒子始终均匀铺满屏幕，不会聚成一团
            p.angle += Math.sin(time * 0.0004 + p.phase) * 0.010 + p.turn;
            p.vx = Math.cos(p.angle) * p.speed;
            p.vy = Math.sin(p.angle) * p.speed;

            // 鼠标靠近时把粒子推开，力度随距离衰减
            if (pointer.active) {
                var dx = p.x - pointer.x;
                var dy = p.y - pointer.y;
                var dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < REPEL_RADIUS && dist > 0.1) {
                    var force = (1 - dist / REPEL_RADIUS) * 3.4;
                    p.x += (dx / dist) * force;
                    p.y += (dy / dist) * force;
                }
            }

            p.x += p.vx;
            p.y += p.vy;

            // 出界后从另一侧回来，保证画面一直是满的
            if (p.x < -20) p.x = width + 20;
            if (p.x > width + 20) p.x = -20;
            if (p.y < -20) p.y = height + 20;
            if (p.y > height + 20) p.y = -20;
        }

        // 视差缓动：光斑跟随鼠标偏移，形成层次感
        var targetX = pointer.active ? (pointer.x / width - 0.5) * 56 : 0;
        var targetY = pointer.active ? (pointer.y / height - 0.5) * 44 : 0;
        parallax.x += (targetX - parallax.x) * 0.04;
        parallax.y += (targetY - parallax.y) * 0.04;

        time += 16;
    }

    /* ---------- 绘制 ---------- */
    function draw() {
        // 彩蛋：彩虹模式期间主色快速轮换，结束后恢复主题色
        if (rainbowEnd > 0) {
            if (performance.now() < rainbowEnd) {
                rgb = RAINBOW[Math.floor(performance.now() / 130) % RAINBOW.length];
                rainbowOn = true;
            } else {
                rainbowEnd = 0;
                if (rainbowOn) {
                    readColor();
                    rainbowOn = false;
                }
            }
        }

        ctx.clearRect(0, 0, width, height);

        // 1. 大光斑：radialGradient 从中心向外淡出
        for (var o = 0; o < orbs.length; o++) {
            var orb = orbs[o];
            var ox = orb.x + Math.sin(time * orb.s1 + orb.p) * orb.a1 + parallax.x * orb.depth;
            var oy = orb.y + Math.cos(time * orb.s2 + orb.p) * orb.a2 + parallax.y * orb.depth;

            var gradient = ctx.createRadialGradient(ox, oy, 0, ox, oy, orb.r);
            gradient.addColorStop(0, "rgba(" + rgb + ",0.17)");
            gradient.addColorStop(0.55, "rgba(" + rgb + ",0.065)");
            gradient.addColorStop(1, "rgba(" + rgb + ",0)");
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(ox, oy, orb.r, 0, Math.PI * 2);
            ctx.fill();
        }

        // 2. 粒子之间的连线
        ctx.strokeStyle = "rgba(" + rgb + ",1)";
        ctx.lineWidth = 1;
        for (var i = 0; i < particles.length; i++) {
            var a = particles[i];
            for (var j = i + 1; j < particles.length; j++) {
                var b = particles[j];
                var dx = a.x - b.x;
                var dy = a.y - b.y;
                var distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < LINK_DISTANCE) {
                    ctx.globalAlpha = (1 - distance / LINK_DISTANCE) * 0.34;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                }
            }
        }

        // 3. 鼠标与附近粒子连线，并在光标处加一圈柔光
        if (pointer.active) {
            ctx.strokeStyle = "rgba(" + rgb + ",1)";
            ctx.lineWidth = 1;
            for (var k = 0; k < particles.length; k++) {
                var q = particles[k];
                var mdx = q.x - pointer.x;
                var mdy = q.y - pointer.y;
                var md = Math.sqrt(mdx * mdx + mdy * mdy);
                if (md < REPEL_RADIUS) {
                    ctx.globalAlpha = (1 - md / REPEL_RADIUS) * 0.45;
                    ctx.beginPath();
                    ctx.moveTo(pointer.x, pointer.y);
                    ctx.lineTo(q.x, q.y);
                    ctx.stroke();
                }
            }

            var halo = ctx.createRadialGradient(
                pointer.x, pointer.y, 0, pointer.x, pointer.y, 110
            );
            halo.addColorStop(0, "rgba(" + rgb + ",0.20)");
            halo.addColorStop(0.5, "rgba(" + rgb + ",0.07)");
            halo.addColorStop(1, "rgba(" + rgb + ",0)");
            ctx.globalAlpha = 1;
            ctx.fillStyle = halo;
            ctx.beginPath();
            ctx.arc(pointer.x, pointer.y, 110, 0, Math.PI * 2);
            ctx.fill();
        }

        // 4. 粒子本体
        ctx.fillStyle = "rgba(" + rgb + ",1)";
        ctx.globalAlpha = 0.60;
        for (var n = 0; n < particles.length; n++) {
            var pt = particles[n];
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalAlpha = 1;
    }

    function loop() {
        updateParticles();
        draw();
        rafId = requestAnimationFrame(loop);
    }

    function start() {
        if (rafId !== null || reduceMotion.matches) return;
        rafId = requestAnimationFrame(loop);
    }

    function stop() {
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    }

    /* ---------- 初始化 ---------- */
    readColor();
    resize();
    draw();
    start();

    /* 窗口缩放 */
    window.addEventListener("resize", function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            resize();
            draw();
        }, 150);
    });

    /* 彩蛋：main.js 监听 Konami 码后派发 konami 事件，这里让粒子变彩虹色 8 秒 */
    document.addEventListener("konami", function () {
        rainbowEnd = performance.now() + 8000;
        start();
    });

    /* 鼠标移动：只有桌面端（有精确指针）才启用 */
    if (mouseIsFine) {
        window.addEventListener("pointermove", function (e) {
            if (e.pointerType && e.pointerType !== "mouse") return;
            pointer.x = e.clientX;
            pointer.y = e.clientY;
            pointer.active = true;
        }, { passive: true });

        document.addEventListener("pointerleave", function () {
            pointer.active = false;
        });

        window.addEventListener("blur", function () {
            pointer.active = false;
        });
    }

    /* 切换深浅色时重新读取主色 */
    var themeObserver = new MutationObserver(function () {
        readColor();
        draw();
    });
    themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme"]
    });

    /* 页面隐藏时暂停，省电 */
    document.addEventListener("visibilitychange", function () {
        if (document.hidden) stop();
        else start();
    });

    /* 系统“减少动态效果” */
    if (reduceMotion.addEventListener) {
        reduceMotion.addEventListener("change", function () {
            if (reduceMotion.matches) {
                stop();
                draw();
            } else {
                start();
            }
        });
    }
})();
