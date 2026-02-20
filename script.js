document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('js-enabled');

    // --- Lenis Smooth Scroll Setup ---
    const lenis = new Lenis({
        duration: 1.8,        // Duration of the scroll animation (higher = slower/smoother)
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Exponential ease-out
        smoothWheel: true,    // Enable smooth scroll for mouse wheel
        wheelMultiplier: 0.8, // Slower scroll speed (< 1 = slower)
        touchMultiplier: 1.5, // Touch scroll sensitivity
        infinite: false,
    });

    // Connect Lenis to GSAP ScrollTrigger so pin animations stay in sync
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    // --- GSAP Setup ---
    if (typeof gsap !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
    }

    let mouseX = 0, mouseY = 0;
    let targetX = 0, targetY = 0;
    let followerX = 0, followerY = 0;
    let normMX = 0, normMY = 0;
    let targetNormMX = 0, targetNormMY = 0;

    const viewHeight = window.innerHeight;
    const viewWidth = window.innerWidth;

    const cursor = document.getElementById('custom-cursor');
    const follower = document.getElementById('cursor-follower');
    const parallaxElements = document.querySelectorAll('[data-speed]');
    const parallaxImages = document.querySelectorAll('.parallax-img');
    const maskInner = document.querySelector('.reveal-mask-inner');
    const hero = document.querySelector('.hero');
    const aboutSection = document.getElementById('about');

    window.addEventListener('mousemove', (e) => {
        targetX = e.clientX;
        targetY = e.clientY;
        targetNormMX = (e.clientX - viewWidth / 2) / (viewWidth / 2);
        targetNormMY = (e.clientY - viewHeight / 2) / (viewHeight / 2);
    });

    // --- Remove legacy Reveal Mask Logic (Replaced by Image Sequence) ---
    // Section now transitions directly from Home to About (Sequence)

    // Call immediately to fix state on refresh
    // Removed initial reveal call

    function animate() {
        const scrollY = window.pageYOffset;

        // 1. Cursor
        mouseX += (targetX - mouseX) * 0.15;
        mouseY += (targetY - mouseY) * 0.15;
        followerX += (targetX - followerX) * 0.1;
        followerY += (targetY - followerY) * 0.1;
        if (cursor) cursor.style.transform = `translate(${mouseX - 6}px, ${mouseY - 6}px)`;
        if (follower) follower.style.transform = `translate(${followerX - 20}px, ${followerY - 20}px)`;

        // 2. Parallax
        normMX += (targetNormMX - normMX) * 0.05;
        normMY += (targetNormMY - normMY) * 0.05;
        parallaxElements.forEach(el => {
            const speed = parseFloat(el.getAttribute('data-speed')) || 0;
            const scrollShift = scrollY * speed;
            const isHeroOrBg = el.closest('.hero') || el.id === 'beams-container';
            const mShiftX = isHeroOrBg ? normMX * (speed * 100) : 0;
            const mShiftY = isHeroOrBg ? normMY * (speed * 50) : 0;
            if (isHeroOrBg || el.classList.contains('section-title-large')) {
                el.style.transform = `translate(calc(${mShiftX}px), calc(${scrollShift + mShiftY}px))`;
            }
        });

        // 3. Image Parallax
        parallaxImages.forEach(img => {
            const parent = img.parentElement;
            if (!parent) return;
            const rect = parent.getBoundingClientRect();
            if (rect.top < viewHeight && rect.bottom > 0) {
                const relativePos = (rect.top + rect.height / 2) / viewHeight;
                const verticalShift = (relativePos - 0.5) * 60;
                img.style.transform = `scale(1.3) translateY(${verticalShift}px)`;
            }
        });

        // reveal mask removed
        requestAnimationFrame(animate);
    }

    // --- Staggered Menu ---
    const menuToggle = document.getElementById('menu-toggle');
    const menuClose = document.getElementById('menu-close');
    const menuOverlay = document.getElementById('menu-overlay');
    const staggeredLinks = document.querySelectorAll('.stagger-link');

    if (menuToggle && menuOverlay) {
        const closeMenu = () => {
            menuOverlay.classList.remove('active');
            document.body.style.overflow = '';
            lenis.start(); // Resume smooth scroll when menu closes
        };
        menuToggle.addEventListener('click', () => {
            menuOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            lenis.stop(); // Pause smooth scroll when menu opens
        });
        if (menuClose) menuClose.addEventListener('click', closeMenu);

        staggeredLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                const targetEl = document.querySelector(targetId);
                if (targetEl) {
                    closeMenu();
                    setTimeout(() => {
                        // Use Lenis for smooth scrollTo navigation
                        lenis.scrollTo(targetEl, { offset: 0, duration: 2 });
                    }, 400);
                }
            });
        });
    }

    // --- GSAP Entrances (Only if loaded) ---
    if (typeof gsap !== 'undefined') {
        // Hero
        gsap.from('.parallax-text > *', {
            y: 80, opacity: 0, duration: 1.2, stagger: 0.15, ease: 'power4.out', delay: 0.4
        });

        /* bento items removed */

        // Project Showcase
        document.querySelectorAll('.showcase-item').forEach((item) => {
            const info = item.querySelector('.showcase-info');
            const visual = item.querySelector('.showcase-visual');

            // Re-introducing speed parallax via GSAP for better sync
            const speed = parseFloat(item.getAttribute('data-speed')) || 0;

            gsap.from(info, {
                scrollTrigger: {
                    trigger: item,
                    start: 'top 95%',
                    toggleActions: "play none none none"
                },
                x: item.classList.contains('reverse') ? 100 : -100,
                opacity: 0,
                duration: 1.5,
                ease: 'power3.out'
            });

            gsap.from(visual, {
                scrollTrigger: {
                    trigger: item,
                    start: 'top 95%',
                    toggleActions: "play none none none"
                },
                scale: 0.8,
                opacity: 0,
                duration: 1.5,
                ease: 'power3.out'
            });

            // Parallax movement synced with ScrollTrigger
            gsap.to(item, {
                y: () => -window.innerHeight * speed,
                ease: "none",
                scrollTrigger: {
                    trigger: item,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: true
                }
            });
        });

        // Contact
        gsap.from('.contact-info, .contact-form-area', {
            scrollTrigger: {
                trigger: '.contact-container',
                start: 'top 90%',
                toggleActions: "play none none none"
            },
            y: 30,
            opacity: 0,
            duration: 1,
            stagger: 0.15,
            ease: 'power3.out'
        });
    }


    // --- Image Sequence logic ---
    const canvas = document.getElementById('computer-canvas');
    if (canvas && typeof gsap !== 'undefined') {
        const context = canvas.getContext('2d');
        const frameCount = 40;
        const currentFrame = (index) => `ProjectAssets/ImageSequence-Computer/${index}.webp`;

        const images = [];
        const airpods = { frame: 1 };

        // Preload images
        for (let i = 1; i <= frameCount; i++) {
            const img = new Image();
            img.src = currentFrame(i);
            images.push(img);
        }

        gsap.to(airpods, {
            frame: frameCount,
            snap: "frame",
            ease: "none",
            scrollTrigger: {
                trigger: "#about",
                start: "top top",
                end: "+=200%", // Slightly increased back for slower progression
                pin: true,
                scrub: 1.5, // Higher scrub value makes it feel "slower" and smoother as it follows the scroll
                anticipatePin: 1, // Reduces flickering on fast scrolls
                fastScrollEnd: true, // Prevents ending in weird states
                preventOverlaps: true
            },
            onUpdate: render // use animation onUpdate instead of scrollTrigger's onUpdate
        });

        // Text animations synced with sequence
        gsap.to(".sequence-title, .section-label", {
            opacity: 1,
            y: 0,
            duration: 1,
            scrollTrigger: {
                trigger: "#about",
                start: "top 5%",
                end: "bottom 10%", // Keep visible until nearly the end
                toggleActions: "play none none reverse"
            }
        });

        gsap.to(".sequence-desc", {
            opacity: 1,
            y: 0,
            duration: 1,
            delay: 0.2, // Subtle stagger
            scrollTrigger: {
                trigger: "#about",
                start: "top 5%",
                end: "bottom 10%",
                toggleActions: "play none none reverse"
            }
        });

        images[0].onload = () => {
            render();
            ScrollTrigger.refresh(); // Ensure pin positions are correct
        };

        function render() {
            const img = images[airpods.frame - 1];
            if (!img) return;

            if (canvas.width !== window.innerWidth * window.devicePixelRatio) {
                canvas.width = window.innerWidth * window.devicePixelRatio;
                canvas.height = window.innerHeight * window.devicePixelRatio;
                canvas.style.width = window.innerWidth + 'px';
                canvas.style.height = window.innerHeight + 'px';
            }

            context.clearRect(0, 0, canvas.width, canvas.height);

            // Calculate "cover" scale
            const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
            const w = img.width * scale;
            const h = img.height * scale;
            const x = (canvas.width - w) / 2;
            const y = (canvas.height - h) / 2;

            context.drawImage(img, x, y, w, h);
        }

        window.addEventListener('resize', render);
    }

    animate();

    // --- Hover Effects ---
    const interactives = document.querySelectorAll('a, button, .bento-item, .showcase-item, .menu-toggle, .stagger-link');
    interactives.forEach(el => {
        el.addEventListener('mouseenter', () => {
            if (cursor) cursor.style.transform += ' scale(2.5)';
            if (follower) {
                follower.style.borderColor = 'var(--off-white)';
                follower.style.background = 'rgba(243, 232, 223, 0.1)';
            }
        });
        el.addEventListener('mouseleave', () => {
            if (cursor) cursor.style.transform = cursor.style.transform.replace(' scale(2.5)', '');
            if (follower) {
                follower.style.borderColor = 'var(--peach)';
                follower.style.background = 'transparent';
            }
        });
        el.addEventListener('mousemove', (e) => {
            if (el.closest('.project-showcase')) return;
            const rect = el.getBoundingClientRect();
            const x = (e.clientX - (rect.left + rect.width / 2)) * 0.1;
            const y = (e.clientY - (rect.top + rect.height / 2)) * 0.1;
            if (!el.hasAttribute('data-speed')) el.style.transform = `translate(${x}px, ${y}px)`;
        });
    });

    // Asset Initializers
    const beamsContainer = document.getElementById('beams-container');
    if (beamsContainer) {
        for (let i = 0; i < 8; i++) {
            const beam = document.createElement('div');
            beam.className = 'beam';
            beam.style.cssText = `left: ${Math.random() * 100}%; top: ${Math.random() * 100}%; width: 1px; height: 100vh; background: linear-gradient(to bottom, transparent, var(--peach), transparent); position: absolute; opacity: 0.03; transform: rotate(35deg); animation: beam-anim ${Math.random() * 8 + 6}s infinite linear;`;
            beamsContainer.appendChild(beam);
        }
    }
});
