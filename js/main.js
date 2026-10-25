/* ============================================================
   个人主页交互脚本（原创实现，无第三方库）
   功能：移动端导航 / 深色模式 / 头像彩蛋 / 数字滚动 /
        全站搜索 / 博客标签筛选 / 打字机 / 滚动进度 /
        页面淡入淡出 / 控制台彩蛋 / Konami 码 / 留言区
   ============================================================ */

/* giscus 留言区配置：去 giscus.app 生成后把 4 个值填进来即自动启用 */
var GISCUS = {
    repo: "",
    repoId: "",
    category: "Announcements",
    categoryId: ""
};

/* 联系方式：用 Base64 存放，页面源码里不出现明文，点击时才还原 */
var CONTACTS = {
    phone: "MTU4MjU5NzQ4NDQ=",
    email: "MjQ0NDY5MTI2OEBxcS5jb20="
};

/* 全站数字：以后改这一个地方，所有页面同步更新 */
var STATS = {
    projects: 3,
    practices: 4,
    rank: 8,
    scholarship: "8000",
    awards: 10
};

/* 全站文章索引：搜索框基于这份数据，文章都指向 CSDN 原文 */
var POSTS = [
    {
        title: "【HTML+CSS+JS】前端入门第一周：从标签到九宫格，我把踩过的坑全记下来了",
        desc: "标签语义、选择器、盒模型、Flex/Grid 布局与 DOM 操作，以及路径、视口、嵌套那些坑。",
        date: "2026-10-25",
        tags: "前端 HTML CSS JavaScript",
        url: "https://blog.csdn.net/print_zlc/article/details/169063188"
    },
    {
        title: "【Python】类与对象、大模型 API 调用与 FastAPI 后端开发",
        desc: "封装继承、多轮对话、GET/POST 接口与 Pydantic 校验，落到一个网页版 AI 对话小助手。",
        date: "2026-10-17",
        tags: "Python 面向对象 FastAPI 大模型 API",
        url: "https://blog.csdn.net/print_zlc/article/details/168247085"
    },
    {
        title: "大模型与 AI 智能体学习笔记：从 API 调用到 Ollama 本地部署",
        desc: "参数、Token、上下文窗口，通义千问 API 调用，以及用 Ollama 把模型跑在本地。",
        date: "2026-10-11",
        tags: "大模型 AI 智能体 Ollama API",
        url: "https://blog.csdn.net/print_zlc/article/details/167587743"
    },
    {
        title: "【Python】数据类型转换、函数与文件操作",
        desc: "类型转换、split/join、函数参数与作用域、值传递与引用传递，以及 with 语句读写文件。",
        date: "2026-09-27",
        tags: "Python 函数 文件操作",
        url: "https://blog.csdn.net/print_zlc/article/details/166740018"
    },
    {
        title: "Python AI 应用之路：第三周学习笔记——字符串列表字典大闯关",
        desc: "字符串索引切片、列表增删改查、字典键值操作与遍历，用签到系统把三类数据结构串起来。",
        date: "2026-09-17",
        tags: "Python 字符串 列表 字典",
        url: "https://blog.csdn.net/print_zlc/article/details/165758511"
    },
    {
        title: "Python AI 应用之路：第二周学习笔记——初识 python 打怪升级",
        desc: "语言特性、PyCharm 环境与编码规范、变量与四大数据类型，以及 if-else、while 与 break/continue。",
        date: "2026-09-13",
        tags: "Python 基础语法 循环",
        url: "https://blog.csdn.net/print_zlc/article/details/165227529"
    }
];

/* 站内页面索引：让搜索不只搜文章，也能搜到项目和页面内容 */
var SITES = [
    {
        title: "会员管理系统（Python 命令行工具）",
        desc: "增删改查、JSON 落盘、输入校验，主程序 / 功能模块 / 数据存储三层结构。",
        date: "项目",
        tags: "Python 会员 文件读写 命令行 项目",
        url: "projects.html#p-member",
        internal: true
    },
    {
        title: "51 单片机智能密码门禁",
        desc: "STC89C52 主控、4×4 矩阵键盘扫描、LCD1602 显示、错误锁定与开锁控制。",
        date: "项目",
        tags: "51 单片机 STC89C52 LCD1602 矩阵键盘 门禁 项目",
        url: "projects.html#p-door",
        internal: true
    },
    {
        title: "智能循迹避障小车",
        desc: "红外循迹 + 超声波避障，L298N 电机驱动与 PWM 调速。",
        date: "项目",
        tags: "循迹 避障 L298N 超声波 红外 小车 项目",
        url: "projects.html#p-car",
        internal: true
    },
    {
        title: "关于我：教育背景 / 技能 / 实践经历",
        desc: "重庆邮电大学移通学院电子信息工程，奖学金与获奖、兼职经历、联系方式。",
        date: "页面",
        tags: "关于 简历 技能 奖学金 联系方式 重庆",
        url: "about.html",
        internal: true
    },
    {
        title: "技术博客：按时间倒序的文章归档",
        desc: "Python、前端、大模型与 AI 智能体学习笔记，支持标签筛选。",
        date: "页面",
        tags: "博客 文章 CSDN 时间轴",
        url: "blog.html",
        internal: true
    }
];

document.addEventListener("DOMContentLoaded", function () {

    /* ---------- 1. 移动端导航展开 / 收起 ---------- */
    var navToggle = document.getElementById("navToggle");
    var navLinks = document.getElementById("navLinks");
    if (navToggle && navLinks) {
        navToggle.addEventListener("click", function () {
            navLinks.classList.toggle("open");
        });
    }

    /* ---------- 2. 深色模式（浏览器记住用户选择） ---------- */
    var themeBtn = document.getElementById("themeBtn");
    function setTheme(mode) {
        if (mode === "dark") {
            document.documentElement.setAttribute("data-theme", "dark");
        } else {
            document.documentElement.removeAttribute("data-theme");
        }
        localStorage.setItem("theme", mode);
        if (themeBtn) {
            themeBtn.innerHTML = mode === "dark"
                ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" stroke-linecap="round"/></svg>'
                : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5Z" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        }
    }
    var savedTheme = localStorage.getItem("theme");
    if (!savedTheme) {
        // 第一次访问：跟随操作系统的深色 / 浅色设置
        savedTheme = (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches)
            ? "dark" : "light";
    }
    setTheme(savedTheme);
    if (themeBtn) {
        themeBtn.addEventListener("click", function () {
            setTheme(localStorage.getItem("theme") === "dark" ? "light" : "dark");
        });
    }

    /* ---------- 3. 首屏头像：点一下转 360°（彩蛋） ---------- */
    var heroAvatar = document.getElementById("heroAvatar");
    if (heroAvatar) {
        var avatarImg = heroAvatar.querySelector("img");
        var spinTimer = null;

        // 转完之后去掉 spin 类，但不让它“倒着转回去”
        function resetSpin() {
            window.clearTimeout(spinTimer);
            if (!avatarImg) { heroAvatar.classList.remove("spin"); return; }
            avatarImg.style.transition = "none";
            heroAvatar.classList.remove("spin");
            void avatarImg.offsetWidth;
            avatarImg.style.transition = "";
        }

        heroAvatar.addEventListener("click", function () {
            heroAvatar.classList.remove("spin");
            void heroAvatar.offsetWidth;   // 强制重排，连续点击也能重新播放
            heroAvatar.classList.add("spin");
            spinTimer = window.setTimeout(resetSpin, 700);  // 兜底：系统开了“减少动效”时也能复位
        });

        if (avatarImg) {
            avatarImg.addEventListener("transitionend", function (e) {
                if (e.propertyName === "transform" && heroAvatar.classList.contains("spin")) {
                    resetSpin();
                }
            });
        }
    }

    /* ---------- 4. 联系方式：点击时才还原明文，避免被爬虫直接抓取 ---------- */
    function decodeContact(key) {
        try {
            return window.atob(CONTACTS[key]);
        } catch (e) {
            return "";
        }
    }

    var contactEls = document.querySelectorAll("[data-contact]");
    for (var c = 0; c < contactEls.length; c++) {
        contactEls[c].addEventListener("click", function (e) {
            var kind = this.getAttribute("data-contact");
            var value = decodeContact(kind);
            if (!value) return;

            if (this.classList.contains("contact-card")) {
                // 卡片：第一次点击只显示号码，同时把卡片变成可拨打 / 可发信的链接
                e.preventDefault();
                var span = this.querySelector("span");
                if (span) {
                    span.textContent = value;
                    span.classList.remove("hint");
                }
                this.setAttribute("href", kind === "email" ? "mailto:" + value : "tel:" + value);
            } else {
                // 页脚小图标：直接唤起邮件 / 拨号
                e.preventDefault();
                window.location.href = kind === "email" ? "mailto:" + value : "tel:" + value;
            }
        });
    }

    /* ---------- 5. 数字统计：填数字 + 滚动到视口时从 0 计数 ---------- */
    var statEls = document.querySelectorAll("[data-stat]");
    var statJobs = [];
    for (var s = 0; s < statEls.length; s++) {
        var key = statEls[s].getAttribute("data-stat");
        var target = (key === "posts") ? POSTS.length : STATS[key];
        if (target === undefined) continue;
        statEls[s].textContent = target;      // 先填好目标值，JS 失效也不会缺数字
        statJobs.push({ el: statEls[s], target: parseFloat(target) });
    }

    function countUp(job) {
        var startTime = null;
        var duration = 900;
        function step(now) {
            if (startTime === null) startTime = now;
            var t = Math.min(1, (now - startTime) / duration);
            var eased = 1 - Math.pow(1 - t, 3);   // 先快后慢
            job.el.textContent = Math.round(job.target * eased);
            if (t < 1) {
                requestAnimationFrame(step);
            } else {
                job.el.textContent = job.target;  // 收尾一定是精确值
            }
        }
        requestAnimationFrame(step);
    }

    var calmMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!calmMotion && window.IntersectionObserver) {
        var statObserver = new IntersectionObserver(function (entries) {
            for (var i = 0; i < entries.length; i++) {
                if (!entries[i].isIntersecting) continue;
                // 按元素找到对应的计数任务
                for (var k = 0; k < statJobs.length; k++) {
                    if (statJobs[k].el === entries[i].target && !statJobs[k].done) {
                        statJobs[k].done = true;
                        countUp(statJobs[k]);
                    }
                }
                statObserver.unobserve(entries[i].target);
            }
        }, { threshold: 0.4 });
        // 先归零，避免出现「先显示最终值、再跳回 0 重数」的闪烁
        for (var z = 0; z < statJobs.length; z++) {
            statJobs[z].el.textContent = 0;
        }
        for (var o = 0; o < statJobs.length; o++) {
            statObserver.observe(statJobs[o].el);
        }
    }

    /* ---------- 6. 全站搜索（标题 / 摘要 / 标签都能搜） ---------- */
    var searchBtn = document.getElementById("searchBtn");
    var searchMask = document.getElementById("searchMask");
    var searchInput = document.getElementById("searchInput");
    var searchResults = document.getElementById("searchResults");

    function renderResults(keyword) {
        if (!searchResults) return;
        var key = keyword.trim().toLowerCase();
        var all = POSTS.concat(SITES);   // 文章 + 站内项目 / 页面
        var list = all.filter(function (p) {
            return key === "" ||
                p.title.toLowerCase().indexOf(key) > -1 ||
                p.desc.toLowerCase().indexOf(key) > -1 ||
                p.tags.toLowerCase().indexOf(key) > -1;
        });
        if (list.length === 0) {
            searchResults.innerHTML = '<div class="search-empty">没有找到相关内容，换个词试试</div>';
            return;
        }
        var html = "";
        for (var i = 0; i < list.length; i++) {
            var item = list[i];
            var targetAttr = item.internal ? "" : ' target="_blank" rel="noopener"';
            html += '<a class="search-item" href="' + item.url + '"' + targetAttr + '>' +
                        '<b>' + item.title + '</b>' +
                        '<span>' + item.date + ' · ' + item.tags.split(" ")[0] + '</span>' +
                    '</a>';
        }
        searchResults.innerHTML = html;
    }

    function openSearch() {
        if (!searchMask) return;
        searchMask.classList.add("open");
        renderResults("");
        if (searchInput) {
            searchInput.value = "";
            setTimeout(function () { searchInput.focus(); }, 30);
        }
    }
    function closeSearch() {
        if (searchMask) searchMask.classList.remove("open");
    }

    if (searchBtn) searchBtn.addEventListener("click", openSearch);
    if (searchMask) searchMask.addEventListener("click", function (e) {
        if (e.target === searchMask) closeSearch();
    });
    if (searchInput) searchInput.addEventListener("input", function () {
        renderResults(this.value);
    });
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") closeSearch();
    });

    /* ---------- 7. 博客标签筛选 ---------- */
    var filterBtns = document.querySelectorAll(".filter-btn");
    var filterItems = document.querySelectorAll("[data-category]");
    for (var f = 0; f < filterBtns.length; f++) {
        filterBtns[f].addEventListener("click", function () {
            var target = this.getAttribute("data-filter");
            for (var b = 0; b < filterBtns.length; b++) {
                filterBtns[b].classList.toggle("active", filterBtns[b] === this);
            }
            for (var i = 0; i < filterItems.length; i++) {
                var cat = filterItems[i].getAttribute("data-category");
                var show = target === "全部" || cat === target;
                filterItems[i].style.display = show ? "" : "none";
            }
        });
    }

    /* ---------- 8. 回到顶部 ---------- */
    var backTop = document.getElementById("backTop");
    if (backTop) {
        window.addEventListener("scroll", function () {
            backTop.classList.toggle("show", window.scrollY > 400);
        });
        backTop.addEventListener("click", function () {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    /* ---------- 9. 页脚年份 ---------- */
    var yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    /* ---------- 10. 顶部滚动进度条 ---------- */
    var progressEl = document.getElementById("scrollProgress");
    if (progressEl) {
        var updateProgress = function () {
            var scrollable = document.documentElement.scrollHeight - window.innerHeight;
            var ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
            progressEl.style.width = (Math.min(1, Math.max(0, ratio)) * 100) + "%";
        };
        window.addEventListener("scroll", updateProgress, { passive: true });
        window.addEventListener("resize", updateProgress);
        updateProgress();
    }

    /* ---------- 11. 页面切换：离场淡出再跳转 ---------- */
    var jumpLinks = document.querySelectorAll('a[href$=".html"], a[href*=".html#"]');
    for (var j = 0; j < jumpLinks.length; j++) {
        jumpLinks[j].addEventListener("click", function (e) {
            if (e.defaultPrevented || e.button !== 0 ||
                e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            if (this.target === "_blank" || this.hasAttribute("download")) return;
            var href = this.getAttribute("href");
            if (!href || href.charAt(0) === "#") return;
            e.preventDefault();
            document.body.classList.add("page-leaving");
            window.setTimeout(function () {
                window.location.href = href;
            }, 150);
        });
    }

    /* ---------- 12. 首屏副标题打字机（逐字显示，不改变版面高度） ---------- */
    var twEl = document.querySelector("[data-typewriter]");
    if (twEl && !calmMotion) {
        var twText = twEl.textContent.replace(/\s+/g, " ").trim();
        twEl.textContent = "";
        var twChars = [];
        var twFrag = document.createDocumentFragment();
        for (var c2 = 0; c2 < twText.length; c2++) {
            var chSpan = document.createElement("span");
            chSpan.className = "tw-char";
            chSpan.textContent = twText.charAt(c2);
            twFrag.appendChild(chSpan);
            twChars.push(chSpan);
        }
        twEl.appendChild(twFrag);
        twEl.classList.add("tw");
        var twIndex = 0;
        var twTimer = window.setInterval(function () {
            if (twIndex >= twChars.length) {
                window.clearInterval(twTimer);
                twEl.classList.remove("tw");   // 打完收掉光标
                return;
            }
            twChars[twIndex].classList.add("on");
            twIndex++;
        }, 26);
    }

    /* ---------- 13. 状态条：显示本机当前时间 ---------- */
    var nowEl = document.getElementById("nowTime");
    if (nowEl) {
        var two = function (n) { return n < 10 ? "0" + n : "" + n; };
        var tickClock = function () {
            var d = new Date();
            nowEl.textContent = two(d.getHours()) + ":" + two(d.getMinutes());
        };
        tickClock();
        window.setInterval(tickClock, 15000);
    }

    /* ---------- 14. 控制台彩蛋（只留公开链接，不放手机号） ---------- */
    try {
        console.log("%c你好，技术同行！👋 看到这里说明你也是爱捣鼓的人。",
            "color:#0d9488;font-size:14px;font-weight:bold;");
        console.log("%c代码：github.com/print_zlc　笔记：blog.csdn.net/print_zlc\n%c↑↑↓↓←→←→ B A 有惊喜",
            "color:#4b5563;font-size:12px;",
            "color:#9ca3af;font-size:11px;");
    } catch (err) { /* 个别浏览器禁用 console 时忽略 */ }

    /* ---------- 15. Konami 码：触发粒子彩虹模式 ---------- */
    var konamiSeq = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
                     "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
    var konamiPos = 0;

    function showToast(msg) {
        var toast = document.querySelector(".easter-toast");
        if (!toast) {
            toast = document.createElement("div");
            toast.className = "easter-toast";
            document.body.appendChild(toast);
        }
        toast.textContent = msg;
        toast.classList.add("show");
        window.clearTimeout(showToast.timer);
        showToast.timer = window.setTimeout(function () {
            toast.classList.remove("show");
        }, 2600);
    }

    document.addEventListener("keydown", function (e) {
        // 在搜索框里打字时不触发彩蛋
        var tag = e.target && e.target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        var key = e.key && e.key.length === 1 ? e.key.toLowerCase() : e.key;
        if (key === konamiSeq[konamiPos]) {
            konamiPos++;
            if (konamiPos === konamiSeq.length) {
                konamiPos = 0;
                document.dispatchEvent(new CustomEvent("konami"));
                showToast("🎉 Konami 彩蛋：粒子彩虹模式 8 秒");
            }
        } else {
            konamiPos = (key === konamiSeq[0]) ? 1 : 0;
        }
    });

    /* ---------- 16. 留言区：配置好 GISCUS 后自动加载 ---------- */
    var giscusBox = document.getElementById("giscusBox");
    if (giscusBox) {
        if (GISCUS.repo && GISCUS.repoId && GISCUS.categoryId) {
            var giscusNote = document.getElementById("giscusNote");
            if (giscusNote) giscusNote.style.display = "none";
            var gs = document.createElement("script");
            gs.src = "https://giscus.app/client.js";
            gs.setAttribute("data-repo", GISCUS.repo);
            gs.setAttribute("data-repo-id", GISCUS.repoId);
            gs.setAttribute("data-category", GISCUS.category);
            gs.setAttribute("data-category-id", GISCUS.categoryId);
            gs.setAttribute("data-mapping", "pathname");
            gs.setAttribute("data-strict", "0");
            gs.setAttribute("data-reactions-enabled", "1");
            gs.setAttribute("data-emit-metadata", "0");
            gs.setAttribute("data-input-position", "bottom");
            gs.setAttribute("data-theme", "preferred_color_scheme");
            gs.setAttribute("data-lang", "zh-CN");
            gs.setAttribute("crossorigin", "anonymous");
            gs.async = true;
            giscusBox.appendChild(gs);
        }
    }
});
