// ═══════════════════════════════════════════════════════════════════════════
// TAN'S HOME — Where Dreams Take Flight
// A Universe Woven from Stardust and Love 💫
// ═══════════════════════════════════════════════════════════════════════════

class TansHome {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();
        this.loader = new THREE.GLTFLoader();
        this.mixers = [];
        
        this.state = {
            loaded: false,
            started: false,
            letterRead: false,
            fireworksShown: false,
            musicPlaying: false,
            currentSongIndex: 0
        };
        
        this.player = {
            position: new THREE.Vector3(0, 2, 12),
            yaw: 0,
            pitch: 0,
            speed: 5
        };
        
        this.keys = {};
        this.mouseLocked = false;
        this.models = {};
        this.interactables = [];
        this.currentTarget = null;
        this.floatingObjects = [];
        
        this.audioElement = null;
        this.playlist = [];
        
        // NEW: For enhanced effects
        this.petals = [];
        this.heartStars = [];
        this.shootingStars = [];
        
        this.init();
    }
    
    async init() {
        this.setupRenderer();
        this.setupCamera();
        this.setupLights();
        this.createEnvironment();
        await this.loadModels();
        this.setupControls();
        this.setupUI();
        this.setupAudio();
        
        // ═══════════════════════════════════════════════════════════════
        // NEW MAGICAL EFFECTS!
        // ═══════════════════════════════════════════════════════════════
        this.createFloatingPetals();
        this.createHeartConstellation();
        this.startShootingStars();
        this.createAuroraLights();
        
        this.animate();
    }
    
    setupRenderer() {
        const canvas = document.getElementById('game-canvas');
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.3;
        
        this.scene = new THREE.Scene();
        
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
    
    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 2000);
        this.camera.position.copy(this.player.position);
    }
    
    setupLights() {
        this.scene.add(new THREE.AmbientLight(0x8090b0, 0.8));
        
        const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
        mainLight.position.set(30, 50, 20);
        mainLight.castShadow = true;
        this.scene.add(mainLight);
        
        const warmLight = new THREE.PointLight(0xffaa66, 2, 30);
        warmLight.position.set(0, 5, -3);
        this.scene.add(warmLight);
        
        const roseLight = new THREE.PointLight(0xff6b8b, 1.5, 40);
        roseLight.position.set(-8, 8, 5);
        this.scene.add(roseLight);
        
        const blueLight = new THREE.PointLight(0x6688ff, 1, 50);
        blueLight.position.set(10, 10, 10);
        this.scene.add(blueLight);
    }
    
    createEnvironment() {
        this.createSpaceSkybox();
        this.createStars();
        this.createGround();
        this.createParticles();
    }
    
    createSpaceSkybox() {
        const geo = new THREE.SphereGeometry(800, 64, 64);
        const mat = new THREE.ShaderMaterial({
            vertexShader: `
                varying vec3 vPos;
                void main() {
                    vPos = (modelMatrix * vec4(position, 1.0)).xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                varying vec3 vPos;
                void main() {
                    float y = normalize(vPos).y;
                    vec3 c = mix(vec3(0.02, 0.01, 0.06), vec3(0.08, 0.03, 0.15), y + 1.0);
                    gl_FragColor = vec4(c, 1.0);
                }
            `,
            side: THREE.BackSide
        });
        this.scene.add(new THREE.Mesh(geo, mat));
    }
    
    createStars() {
        const count = 5000;
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const r = 300 + Math.random() * 400;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.stars = new THREE.Points(geo, new THREE.PointsMaterial({ size: 2, color: 0xffffff }));
        this.scene.add(this.stars);
    }
    
    createGround() {
        const ground = new THREE.Mesh(
            new THREE.CylinderGeometry(30, 35, 2, 64),
            new THREE.MeshStandardMaterial({ color: 0x15102a })
        );
        ground.position.y = -1;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(32.5, 0.4, 16, 100),
            new THREE.MeshBasicMaterial({ color: 0xff6b8b, transparent: true, opacity: 0.5 })
        );
        ring.rotation.x = Math.PI / 2;
        this.scene.add(ring);
        this.glowRing = ring;
    }
    
    createParticles() {
        const count = 500;
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 100;
            positions[i * 3 + 1] = Math.random() * 50;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.particles = new THREE.Points(geo, new THREE.PointsMaterial({ 
            size: 0.2, color: 0xff6b8b, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending 
        }));
        this.scene.add(this.particles);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // NEW: FLOATING ROSE PETALS! 🌹
    // ═══════════════════════════════════════════════════════════════════════════
    createFloatingPetals() {
        const petalCount = 80;
        
        for (let i = 0; i < petalCount; i++) {
            const petal = new THREE.Mesh(
                new THREE.CircleGeometry(0.15, 8),
                new THREE.MeshBasicMaterial({
                    color: Math.random() > 0.5 ? 0xff6b8b : 0xffaacc,
                    transparent: true,
                    opacity: 0.7,
                    side: THREE.DoubleSide
                })
            );
            
            petal.position.set(
                (Math.random() - 0.5) * 60,
                Math.random() * 40 + 5,
                (Math.random() - 0.5) * 60
            );
            
            this.scene.add(petal);
            this.petals.push({
                mesh: petal,
                speed: 0.2 + Math.random() * 0.4,
                swaySpeed: 0.8 + Math.random() * 1.5,
                swayAmount: 1 + Math.random() * 3,
                rotSpeed: 1 + Math.random() * 2
            });
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // NEW: HEART CONSTELLATION! 💖
    // ═══════════════════════════════════════════════════════════════════════════
    createHeartConstellation() {
        const heartPoints = [];
        const segments = 60;
        
        for (let i = 0; i < segments; i++) {
            const t = (i / segments) * Math.PI * 2;
            const x = 16 * Math.pow(Math.sin(t), 3);
            const y = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
            heartPoints.push(new THREE.Vector3(x * 2.5, y * 2.5 + 55, -180));
        }
        
        heartPoints.forEach((pos, index) => {
            const star = new THREE.Mesh(
                new THREE.SphereGeometry(0.6, 8, 8),
                new THREE.MeshBasicMaterial({
                    color: 0xff6b8b,
                    transparent: true,
                    opacity: 0.9
                })
            );
            star.position.copy(pos);
            this.scene.add(star);
            
            const light = new THREE.PointLight(0xff6b8b, 2, 12);
            star.add(light);
            
            this.heartStars.push({ mesh: star, offset: index * 0.1 });
        });
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // NEW: SHOOTING STARS! 🌠
    // ═══════════════════════════════════════════════════════════════════════════
    startShootingStars() {
        setInterval(() => {
            if (!this.state.started) return;
            
            const start = new THREE.Vector3(
                (Math.random() - 0.5) * 200,
                40 + Math.random() * 60,
                (Math.random() - 0.5) * 200
            );
            
            const end = start.clone().add(new THREE.Vector3(
                (Math.random() - 0.5) * 120,
                -90,
                (Math.random() - 0.5) * 120
            ));
            
            const points = [start, end];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({
                color: Math.random() > 0.5 ? 0xffffff : 0xff6b8b,
                transparent: true,
                opacity: 1,
                linewidth: 2
            });
            
            const star = new THREE.Line(geometry, material);
            this.scene.add(star);
            
            // Add a glowing point at the head
            const glow = new THREE.Mesh(
                new THREE.SphereGeometry(0.3, 8, 8),
                new THREE.MeshBasicMaterial({ color: 0xffffff })
            );
            glow.position.copy(start);
            this.scene.add(glow);
            
            let opacity = 1;
            let progress = 0;
            const fadeOut = setInterval(() => {
                opacity -= 0.04;
                progress += 0.04;
                material.opacity = opacity;
                glow.position.lerpVectors(start, end, progress);
                
                if (opacity <= 0) {
                    this.scene.remove(star);
                    this.scene.remove(glow);
                    clearInterval(fadeOut);
                }
            }, 40);
        }, 2500 + Math.random() * 4000);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // NEW: AURORA LIGHTS! ✨
    // ═══════════════════════════════════════════════════════════════════════════
    createAuroraLights() {
        const aurora1 = new THREE.PointLight(0x66ff88, 1.5, 80);
        aurora1.position.set(40, 35, -30);
        this.scene.add(aurora1);
        this.aurora1 = aurora1;
        
        const aurora2 = new THREE.PointLight(0xff66aa, 1.5, 80);
        aurora2.position.set(-40, 30, 25);
        this.scene.add(aurora2);
        this.aurora2 = aurora2;
    }
    
    async loadModels() {
        const loadBar = document.getElementById('load-bar');
        const loadStatus = document.getElementById('load-status');
        
        // ═══════════════════════════════════════════════════════════════
        // POETIC CREATURE MESSAGES! 📜
        // ═══════════════════════════════════════════════════════════════
        const models = [
            // HOUSE
            {
                file: 'mushroom_water_house.glb',
                name: 'house',
                scale: 3.8,
                position: [0, 0, -5],
                noAnimation: true,
                interactive: true,
                info: { 
                    name: '🏠 Where My Heart Lives', 
                    description: 'Not just walls and roof above,\nBut a sanctuary built from love.',
                    fact: 'Every corner whispers your name' 
                }
            },
            // POSTBOX
            {
                file: 'red_post_box.glb',
                name: 'postbox',
                scale: 2.0,
                position: [8, 0, 3],
                rotation: [0, -0.5, 0],
                noAnimation: true,
                interactive: true,
                isLetter: true,
                info: { name: '💌 A Letter Written in Starlight', description: 'Words that traveled through time...', fact: '' }
            },
            // ═══════════════════════════════════════════════════════════════
            // PHOENIX - FLIES TRULY FREE!
            // ═══════════════════════════════════════════════════════════════
            {
                file: 'phoenix_on_fire_update.glb',
                name: 'phoenix',
                scale: 0.08,
                position: [20, 90, 10],
                animate: true,
                phoenixFly: true,
                addGlow: true,
                interactive: true,
                info: { 
                    name: '🔥 Phoenix of Eternal Flame', 
                    description: 'You rise like fire, burning bright and free,\nA guardian angel watching over me.',
                    fact: 'From ashes of loneliness, you brought me life' 
                }
            },
            // ═══════════════════════════════════════════════════════════════
            // MYTHIC WHALE - Swims like poetry
            // ═══════════════════════════════════════════════════════════════
            {
                file: 'mythic_whale_-_stylized_animated_model.glb',
                name: 'whale',
                scale: 100.0,
                position: [-100, 88, 15],
                animate: true,
                whaleSwim: true,
                interactive: true,
                info: { 
                    name: '🐋 Cosmic Whale', 
                    description: 'Like oceans deep, like mysteries profound,\nYou are the depth where true love is found.',
                    fact: 'In your eyes, I see galaxies unfold' 
                }
            },
            // ═══════════════════════════════════════════════════════════════
            // JELLYRAY 1
            // ═══════════════════════════════════════════════════════════════
            {
                file: 'jellyray.glb',
                name: 'jellyray1',
                scale: 3.5,
                position: [25, 12, 20],
                animate: true,
                jellyFloat: true,
                interactive: true,
                info: { 
                    name: '🎐 Cosmic Jellyray', 
                    description: 'You drift through my mind like stardust in wind,\nMythical and rare, where does your magic begin?',
                    fact: 'Tell me your stories, I\'ll listen forever' 
                }
            },
            // JELLYRAY 2
            {
                file: 'jellyray (1).glb',
                name: 'jellyray2',
                scale: 3.3,
                position: [-28, 15, -20],
                animate: true,
                jellyFloat: true,
                interactive: true,
                info: { 
                    name: '✨ Starlight Jellyray', 
                    description: 'You love the stars? So do I, my dear,\nEach one whispers your name when you\'re near.',
                    fact: 'We are made of the same cosmic light' 
                }
            },
            // BLADDERFISH
            {
                file: 'bladderfish.glb',
                name: 'bladderfish',
                scale: 1.0,
                position: [12, 8, 18],
                animate: true,
                fishSwim: true,
                interactive: true,
                info: { 
                    name: '🐡 Wandering Spirit', 
                    description: 'I want to know every chapter of you,\nEvery dream, every wish, every morning dew.',
                    fact: 'Your soul is a book I\'ll never finish reading' 
                }
            },
            // SALSA DANCER
            {
                file: 'salsa_dance_basic_steps_-_lowpoly_style.glb',
                name: 'dancer',
                scale: 0.03,
                position: [-8, 0, 5],
                rotation: [0, 0.8, 0],
                animate: true,
                noMovement: true,
                interactive: true,
                info: { 
                    name: '💃 Eternal Dance', 
                    description: 'Like this dancer, my heart moves only for you,\nTireless, endless, forever true.',
                    fact: 'In your rhythm, I find my meaning' 
                }
            },
            // STYLIZED PLANET
            {
                file: 'stylized_planet.glb',
                name: 'stylizedPlanet',
                scale: 60,
                position: [120, 60, -140],
                spin: true,
                interactive: true,
                info: { 
                    name: '🌍 Dream World', 
                    description: 'A world painted in the colors of hope,\nWhere love and wonder endlessly elope.',
                    fact: 'Every hue holds a piece of my heart' 
                }
            },
            // PAPYRUS
            {
                file: 'furled_papyrus.glb',
                name: 'papyrus',
                scale: 0.3,
                position: [8, 2.2, 3],
                float: true,
                noAnimation: true
            },
            // DEEP SPACE SKYBOX
            {
                file: 'deep_space_skybox_16k_with_planets.glb',
                name: 'spaceSkybox',
                scale: 150,
                position: [0, 0, 0],
                noAnimation: true,
                noMovement: true
            }
        ];
        
        let loaded = 0;
        for (const config of models) {
            loadStatus.textContent = `Loading ${config.name}...`;
            try {
                await this.loadModel(config);
                console.log(`✓ ${config.name}`);
            } catch (e) {
                console.log(`✗ ${config.name}: ${e.message}`);
            }
            loaded++;
            loadBar.style.width = (loaded / models.length * 100) + '%';
            await new Promise(r => setTimeout(r, 80));
        }
        
        this.addMoreCreatures();
        this.createHomeText();
        this.createSkyPlanets();
        
        this.state.loaded = true;
        this.finishLoading();
    }
    
    loadModel(config) {
        return new Promise((resolve, reject) => {
            this.loader.load(config.file, (gltf) => {
                const model = gltf.scene;
                model.scale.setScalar(config.scale);
                model.position.set(...config.position);
                if (config.rotation) model.rotation.set(...config.rotation);
                
                // Phoenix glow effect
                if (config.addGlow) {
                    model.traverse(child => {
                        if (child.isMesh && child.material) {
                            child.castShadow = true;
                            child.material.emissive = new THREE.Color(0xff4400);
                            child.material.emissiveIntensity = 0.8;
                        }
                    });
                    const light = new THREE.PointLight(0xff6600, 5, 50);
                    model.add(light);
                } else {
                    model.traverse(child => {
                        if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; }
                    });
                }
                
                this.scene.add(model);
                this.models[config.name] = model;
                
                // Play animations
                if (gltf.animations?.length && !config.noAnimation) {
                    const mixer = new THREE.AnimationMixer(model);
                    gltf.animations.forEach(clip => mixer.clipAction(clip).play());
                    this.mixers.push(mixer);
                }
                
                // Movement - MORE FREEDOM!
                if (!config.noMovement && (config.phoenixFly || config.whaleSwim || config.jellyFloat || config.fishSwim || config.float || config.spin)) {
                    this.floatingObjects.push({
                        mesh: model,
                        config,
                        base: new THREE.Vector3(...config.position),
                        time: Math.random() * 100,
                        angle: Math.random() * Math.PI * 2,
                        targetAngle: Math.random() * Math.PI * 2,
                        height: config.position[1],
                        targetHeight: config.position[1] + Math.random() * 20,
                        // NEW: Individual personalities!
                        personality: {
                            speed: 0.5 + Math.random() * 1.5,
                            wildness: Math.random(),
                            verticalRange: 10 + Math.random() * 30
                        }
                    });
                }
                
                // Interactive
                if (config.interactive) {
                    this.interactables.push({
                        object: model,
                        isLetter: config.isLetter,
                        info: config.info,
                        action: () => config.isLetter ? this.openLetter() : this.showInfoCard(config.info)
                    });
                }
                
                resolve(model);
            }, undefined, reject);
        });
    }
    
    addMoreCreatures() {
        // More jellyfish with varied behaviors
        if (this.models.jellyray1) {
            [
                [20, 20, -15],
                [-25, 16, 20],
                [5, 25, 25],
                [-15, 18, -25],
                [30, 22, 8]
            ].forEach(pos => {
                const clone = this.models.jellyray1.clone();
                clone.position.set(...pos);
                clone.scale.setScalar(0.8 + Math.random() * 1.2);
                this.scene.add(clone);
                this.floatingObjects.push({
                    mesh: clone,
                    config: { jellyFloat: true },
                    base: clone.position.clone(),
                    time: Math.random() * 100,
                    angle: Math.random() * Math.PI * 2,
                    personality: {
                        speed: 0.3 + Math.random(),
                        wildness: Math.random(),
                        verticalRange: 8 + Math.random() * 15
                    }
                });
            });
        }
        
        // More bladderfish - they swim in schools!
        if (this.models.bladderfish) {
            [
                [-15, 10, 15],
                [20, 7, 10],
                [-10, 12, -12],
                [18, 9, -8],
                [-22, 11, 8]
            ].forEach(pos => {
                const clone = this.models.bladderfish.clone();
                clone.position.set(...pos);
                clone.scale.setScalar(0.6 + Math.random() * 0.6);
                this.scene.add(clone);
                this.floatingObjects.push({
                    mesh: clone,
                    config: { fishSwim: true },
                    base: clone.position.clone(),
                    time: Math.random() * 100,
                    angle: Math.random() * Math.PI * 2,
                    personality: {
                        speed: 0.8 + Math.random() * 0.8,
                        wildness: Math.random() * 0.7,
                        verticalRange: 5 + Math.random() * 8
                    }
                });
            });
        }
        
        // Another whale - majestic!
        if (this.models.whale) {
            const clone = this.models.whale.clone();
            clone.position.set(35, 22, -20);
            clone.scale.setScalar(1.5);
            this.scene.add(clone);
            this.floatingObjects.push({
                mesh: clone,
                config: { whaleSwim: true },
                base: clone.position.clone(),
                time: Math.random() * 100,
                angle: Math.random() * Math.PI * 2 + Math.PI,
                personality: {
                    speed: 0.4,
                    wildness: 0.3,
                    verticalRange: 12
                }
            });
        }
    }
    
    createHomeText() {
        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 300;
        const ctx = canvas.getContext('2d');
        
        ctx.shadowColor = '#ff6b8b';
        ctx.shadowBlur = 50;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#ff6b8b';
        ctx.lineWidth = 8;
        ctx.font = 'bold 110px "Brush Script MT", cursive';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.strokeText("Where My Heart Lives", 600, 110);
        ctx.fillText("Where My Heart Lives", 600, 110);
        
        ctx.font = 'italic 40px Georgia';
        ctx.fillStyle = '#ffaacc';
        ctx.shadowBlur = 25;
        ctx.fillText('✨ A Universe Built For You ✨', 600, 200);
        
        const texture = new THREE.CanvasTexture(canvas);
        const text = new THREE.Mesh(
            new THREE.PlaneGeometry(12, 3),
            new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide })
        );
        text.position.set(0, 9, -7);
        this.scene.add(text);
        this.homeText = text;
    }
    
    createSkyPlanets() {
        // Jupiter
        const jupiter = new THREE.Mesh(
            new THREE.SphereGeometry(40, 32, 32),
            new THREE.MeshStandardMaterial({ color: 0xd4a574 })
        );
        jupiter.position.set(-180, 100, -250);
        this.scene.add(jupiter);
        
        // Saturn with rings
        const saturn = new THREE.Mesh(
            new THREE.SphereGeometry(30, 32, 32),
            new THREE.MeshStandardMaterial({ color: 0xead6b8 })
        );
        saturn.position.set(200, 80, -220);
        this.scene.add(saturn);
        
        const saturnRing = new THREE.Mesh(
            new THREE.RingGeometry(45, 70, 64),
            new THREE.MeshBasicMaterial({ color: 0xc9b896, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
        );
        saturnRing.position.copy(saturn.position);
        saturnRing.rotation.x = Math.PI / 2.5;
        this.scene.add(saturnRing);
        
        // Moon
        const moon = new THREE.Mesh(
            new THREE.SphereGeometry(12, 32, 32),
            new THREE.MeshStandardMaterial({ color: 0xffffee, emissive: 0xffffaa, emissiveIntensity: 0.6 })
        );
        moon.position.set(70, 60, -120);
        this.scene.add(moon);
        
        [
            { obj: jupiter, info: { name: '🪐 Jupiter', description: 'King of the celestial dance,\nWhere storms of passion endlessly romance.', fact: 'Each swirl holds a thousand wishes' }},
            { obj: saturn, info: { name: '🪐 Saturn', description: 'Adorned with rings of memories spun,\nEach orbit marks a love begun.', fact: 'Every ring is a promise kept' }},
            { obj: moon, info: { name: '🌙 Moon', description: 'Gentle guardian of the night,\nReflecting love in silver light.', fact: 'When I see you, the moon smiles' }}
        ].forEach(p => this.interactables.push({ object: p.obj, info: p.info, action: () => this.showInfoCard(p.info) }));
        
        this.skyPlanets = { jupiter, saturn, saturnRing, moon };
    }
    
    setupControls() {
        window.addEventListener('keydown', e => {
            this.keys[e.code] = true;
            if (e.code === 'KeyE' && this.currentTarget && this.state.started) this.currentTarget.action();
            if (e.code === 'Escape') document.exitPointerLock();
        });
        window.addEventListener('keyup', e => this.keys[e.code] = false);
        
        const canvas = document.getElementById('game-canvas');
        canvas.addEventListener('click', () => {
            if (this.state.started && !this.mouseLocked) canvas.requestPointerLock();
        });
        document.addEventListener('pointerlockchange', () => {
            this.mouseLocked = document.pointerLockElement === canvas;
        });
        document.addEventListener('mousemove', e => {
            if (this.mouseLocked && this.state.started) {
                this.player.yaw -= e.movementX * 0.002;
                this.player.pitch = Math.max(-Math.PI/2.2, Math.min(Math.PI/2.2, this.player.pitch - e.movementY * 0.002));
            }
        });
    }
    
    setupUI() {
        document.getElementById('btn-enter')?.addEventListener('click', () => this.startGame());
        document.getElementById('close-letter')?.addEventListener('click', () => this.closeLetter());
        document.getElementById('close-info-card')?.addEventListener('click', () => this.closeInfoCard());
        document.querySelector('#letter-modal .modal-backdrop')?.addEventListener('click', () => this.closeLetter());
        document.querySelector('#info-card-modal .modal-backdrop')?.addEventListener('click', () => this.closeInfoCard());
    }
    
    setupAudio() {
        const self = this;
        
        this.audioElement = new Audio();
        this.audioElement.loop = false;
        this.audioElement.volume = 0.5;
        this.audioElement.addEventListener('ended', () => this.playNextSong());
        
        this.scanForMusic();
        
        const playBtn = document.getElementById('music-play-btn');
        const prevBtn = document.getElementById('music-prev-btn');
        const nextBtn = document.getElementById('music-next-btn');
        const volSlider = document.getElementById('music-volume');
        
        if (playBtn) {
            playBtn.onclick = function() {
                console.log('▶️ Play clicked!');
                self.toggleMusic();
            };
        }
        if (prevBtn) {
            prevBtn.onclick = function() {
                console.log('⏮️ Prev clicked!');
                self.playPrevSong();
            };
        }
        if (nextBtn) {
            nextBtn.onclick = function() {
                console.log('⏭️ Next clicked!');
                self.playNextSong();
            };
        }
        if (volSlider) {
            volSlider.oninput = function() {
                self.audioElement.volume = this.value / 100;
            };
        }
        
        console.log('🎵 Music player ready!');
    }
    
    scanForMusic() {
        const patterns = [
            'sounds/music.mp3',
            'sounds/Chinuku Take-SenSongsMp3.Co.mp3',
            'sounds/song.mp3',
            'sounds/background.mp3',
            'sounds/1.mp3', 'sounds/2.mp3', 'sounds/3.mp3'
        ];
        
        patterns.forEach(path => {
            const audio = new Audio();
            audio.src = path;
            audio.oncanplaythrough = () => {
                if (!this.playlist.includes(path)) {
                    this.playlist.push(path);
                    console.log('✓ Found:', path);
                    this.updateMusicUI();
                }
            };
        });
        
        setTimeout(() => {
            if (this.playlist.length === 0) {
                const el = document.getElementById('music-name');
                if (el) el.textContent = 'Add .mp3 to sounds/';
            }
        }, 3000);
    }
    
    updateMusicUI() {
        if (this.playlist.length > 0) {
            const name = this.playlist[this.state.currentSongIndex].split('/').pop();
            const el = document.getElementById('music-name');
            if (el) el.textContent = '🎵 ' + decodeURIComponent(name);
            if (!this.audioElement.src) this.audioElement.src = this.playlist[0];
        }
    }
    
    playMusic() {
        if (this.playlist.length === 0) return;
        if (!this.audioElement.src) this.audioElement.src = this.playlist[this.state.currentSongIndex];
        this.audioElement.play()
            .then(() => {
                this.state.musicPlaying = true;
                const btn = document.getElementById('music-play-btn');
                if (btn) btn.innerHTML = '<i class="fas fa-pause"></i>';
            })
            .catch(e => console.log('Play error:', e));
    }
    
    pauseMusic() {
        this.audioElement.pause();
        this.state.musicPlaying = false;
        const btn = document.getElementById('music-play-btn');
        if (btn) btn.innerHTML = '<i class="fas fa-play"></i>';
    }
    
    toggleMusic() {
        if (this.state.musicPlaying) this.pauseMusic();
        else this.playMusic();
    }
    
    playNextSong() {
        if (this.playlist.length === 0) return;
        this.state.currentSongIndex = (this.state.currentSongIndex + 1) % this.playlist.length;
        this.audioElement.src = this.playlist[this.state.currentSongIndex];
        this.updateMusicUI();
        if (this.state.musicPlaying) this.playMusic();
    }
    
    playPrevSong() {
        if (this.playlist.length === 0) return;
        this.state.currentSongIndex = (this.state.currentSongIndex - 1 + this.playlist.length) % this.playlist.length;
        this.audioElement.src = this.playlist[this.state.currentSongIndex];
        this.updateMusicUI();
        if (this.state.musicPlaying) this.playMusic();
    }
    
    startGame() {
        document.getElementById('main-menu')?.classList.add('hidden');
        document.getElementById('hud')?.classList.remove('hidden');
        this.state.started = true;
        document.getElementById('game-canvas')?.requestPointerLock();
        if (this.playlist.length > 0) setTimeout(() => this.playMusic(), 500);
    }
    
    openLetter() {
        document.exitPointerLock();
        document.getElementById('letter-modal')?.classList.remove('hidden');
        const dateEl = document.getElementById('letter-date');
        if (dateEl) dateEl.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        if (!this.state.letterRead) {
            this.state.letterRead = true;
            setTimeout(() => { this.showFireworks(); this.showValentineMessage(); }, 2000);
        }
    }
    
    closeLetter() {
        document.getElementById('letter-modal')?.classList.add('hidden');
        if (this.state.started) document.getElementById('game-canvas')?.requestPointerLock();
    }
    
    showInfoCard(info) {
        document.exitPointerLock();
        document.getElementById('info-card-modal')?.classList.remove('hidden');
        const n = document.getElementById('info-name');
        const d = document.getElementById('info-description');
        const f = document.getElementById('info-fact');
        if (n) n.textContent = info.name;
        if (d) d.textContent = info.description;
        if (f) f.textContent = info.fact || 'Part of the magic!';
    }
    
    closeInfoCard() {
        document.getElementById('info-card-modal')?.classList.add('hidden');
        if (this.state.started) document.getElementById('game-canvas')?.requestPointerLock();
    }
    
    showFireworks() {
        if (this.state.fireworksShown) return;
        this.state.fireworksShown = true;
        const container = document.getElementById('fireworks-container');
        if (!container) return;
        const colors = ['#ff6b8b', '#ffcc00', '#ff8e53', '#9966ff', '#66ffaa'];
        for (let i = 0; i < 25; i++) {
            setTimeout(() => {
                const x = 10 + Math.random() * 80, y = 10 + Math.random() * 60;
                const color = colors[Math.floor(Math.random() * colors.length)];
                for (let j = 0; j < 25; j++) {
                    const p = document.createElement('div');
                    p.className = 'firework';
                    p.style.cssText = `left:${x}%;top:${y}%;background:${color};box-shadow:0 0 15px ${color}`;
                    container.appendChild(p);
                    setTimeout(() => p.remove(), 1800);
                }
            }, i * 250);
        }
    }
    
    showValentineMessage() {
        const msg = document.getElementById('valentine-message');
        if (msg) { msg.classList.remove('hidden'); setTimeout(() => msg.classList.add('hidden'), 6000); }
    }
    
    finishLoading() {
        setTimeout(() => {
            document.getElementById('loading-screen')?.classList.add('fade-out');
            document.getElementById('main-menu')?.classList.remove('hidden');
        }, 500);
    }
    
    updatePlayer(delta) {
        if (!this.state.started) return;
        const speed = this.player.speed * delta;
        const forward = new THREE.Vector3(-Math.sin(this.player.yaw), 0, -Math.cos(this.player.yaw));
        const right = new THREE.Vector3(Math.cos(this.player.yaw), 0, -Math.sin(this.player.yaw));
        const dir = new THREE.Vector3();
        if (this.keys['KeyW']) dir.add(forward);
        if (this.keys['KeyS']) dir.sub(forward);
        if (this.keys['KeyD']) dir.add(right);
        if (this.keys['KeyA']) dir.sub(right);
        if (dir.length() > 0) { dir.normalize().multiplyScalar(speed); this.player.position.add(dir); }
        const dist = Math.sqrt(this.player.position.x ** 2 + this.player.position.z ** 2);
        if (dist > 28) { const a = Math.atan2(this.player.position.z, this.player.position.x); this.player.position.x = Math.cos(a) * 28; this.player.position.z = Math.sin(a) * 28; }
        this.camera.position.copy(this.player.position);
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.y = this.player.yaw;
        this.camera.rotation.x = this.player.pitch;
    }
    
    updateInteraction() {
        if (!this.state.started) return;
        const prompt = document.getElementById('interact-prompt');
        const text = document.getElementById('interact-text');
        const crosshair = document.querySelector('.crosshair');
        let nearest = null, nearestDist = 15;
        for (const item of this.interactables) {
            const pos = new THREE.Vector3(); item.object.getWorldPosition(pos);
            const dist = this.player.position.distanceTo(pos);
            if (dist < nearestDist) {
                const toObj = pos.clone().sub(this.player.position).normalize();
                const look = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
                if (toObj.dot(look) > 0.4) { nearestDist = dist; nearest = item; }
            }
        }
        this.currentTarget = nearest;
        if (nearest && prompt) { prompt.classList.remove('hidden'); text.textContent = `${nearest.info?.name || 'Interact'} - Press E`; crosshair?.classList.add('active'); }
        else { prompt?.classList.add('hidden'); crosshair?.classList.remove('active'); }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ENHANCED ANIMATIONS - CREATURES MOVE LIKE LIVING BEINGS! 🌊🔥
    // ═══════════════════════════════════════════════════════════════════════════
    updateAnimations(delta, time) {
        this.mixers.forEach(m => m.update(delta));
        
        // ═══════════════════════════════════════════════════════════════
        // CREATURES WITH PERSONALITIES AND FREEDOM!
        // ═══════════════════════════════════════════════════════════════
        for (const obj of this.floatingObjects) {
            obj.time += delta;
            const t = obj.time;
            const p = obj.personality || { speed: 1, wildness: 0.5, verticalRange: 15 };
            
            if (obj.config.phoenixFly) {
                // ═══════════════════════════════════════════════════════════
                // PHOENIX - TRULY FREE FLIGHT WITH PERSONALITY!
                // ═══════════════════════════════════════════════════════════
                const flyRadius = 70 + Math.sin(t * 0.04 * p.speed) * 40;
                const flyHeight = 35 + Math.sin(t * 0.06 * p.speed) * 25;
                
                obj.angle += delta * 0.25 * p.speed;
                
                // More complex flight pattern - figure-8s and swoops!
                const xPattern = Math.cos(obj.angle) * flyRadius;
                const zPattern = Math.sin(obj.angle * 0.6) * flyRadius * 1.2;
                
                obj.mesh.position.x = xPattern + Math.sin(t * 0.3) * 15;
                obj.mesh.position.z = zPattern + Math.cos(t * 0.25) * 15;
                obj.mesh.position.y = flyHeight + Math.sin(t * 0.4) * 12 + Math.cos(t * 0.7) * 8;
                
                // Dynamic banking and pitching based on direction
                obj.mesh.rotation.y = obj.angle + Math.PI / 2 + Math.sin(t * 0.5) * 0.3;
                obj.mesh.rotation.z = Math.sin(t * 0.7) * 0.5 + Math.cos(obj.angle * 2) * 0.3;
                obj.mesh.rotation.x = Math.cos(t * 0.5) * 0.3 + Math.sin(t) * 0.15;
                
            } else if (obj.config.whaleSwim) {
                // ═══════════════════════════════════════════════════════════
                // WHALE - MAJESTIC OCEAN-LIKE SWIMMING!
                // ═══════════════════════════════════════════════════════════
                const swimRadius = 50 + Math.sin(t * 0.025 * p.speed) * 20;
                obj.angle += delta * 0.05 * p.speed;
                
                // Graceful spiraling motion
                obj.mesh.position.x = Math.cos(obj.angle) * swimRadius + Math.sin(t * 0.2) * 10;
                obj.mesh.position.z = Math.sin(obj.angle) * swimRadius + Math.cos(t * 0.15) * 10;
                obj.mesh.position.y = obj.base.y + Math.sin(t * 0.12) * 8 + Math.cos(t * 0.08) * 5;
                
                // Gentle rolling and tail movement
                obj.mesh.rotation.y = obj.angle + Math.PI / 2;
                obj.mesh.rotation.z = Math.sin(t * 0.18) * 0.2;
                obj.mesh.rotation.x = Math.cos(t * 0.15) * 0.12;
                
            } else if (obj.config.jellyFloat) {
                // ═══════════════════════════════════════════════════════════
                // JELLYFISH - PULSING UPWARD LIKE REAL JELLIES!
                // ═══════════════════════════════════════════════════════════
                const driftX = Math.sin(t * 0.12 * p.speed) * 15 * p.wildness;
                const driftZ = Math.cos(t * 0.1 * p.speed) * 15 * p.wildness;
                
                obj.mesh.position.x = obj.base.x + driftX + Math.sin(t * 0.3) * 5;
                obj.mesh.position.z = obj.base.z + driftZ + Math.cos(t * 0.25) * 5;
                
                // PULSE UPWARD like real jellyfish pumping!
                const pulse = Math.max(0, Math.sin(t * 1.0 * p.speed)) * 6;
                const drift = Math.sin(t * 0.15) * p.verticalRange * 0.3;
                obj.mesh.position.y = obj.base.y + pulse + drift;
                
                // Gentle spinning and tilting
                obj.mesh.rotation.y += delta * 0.06;
                obj.mesh.rotation.x = Math.sin(t * 0.4) * 0.15;
                obj.mesh.rotation.z = Math.cos(t * 0.35) * 0.15;
                
            } else if (obj.config.fishSwim) {
                // ═══════════════════════════════════════════════════════════
                // FISH - DARTING SCHOOL BEHAVIOR!
                // ═══════════════════════════════════════════════════════════
                const swimR = 18 + Math.sin(t * 0.15 * p.speed) * 8;
                obj.angle += delta * 0.3 * p.speed;
                
                // Darting, school-like movement
                obj.mesh.position.x = obj.base.x + Math.cos(obj.angle) * swimR + Math.sin(t * 0.8) * 4;
                obj.mesh.position.z = obj.base.z + Math.sin(obj.angle) * swimR + Math.cos(t * 0.7) * 4;
                obj.mesh.position.y = obj.base.y + Math.sin(t * 0.5 * p.speed) * 3 + Math.cos(t * 0.9) * 2;
                
                // Quick direction changes
                obj.mesh.rotation.y = obj.angle + Math.PI / 2 + Math.sin(t * 1.5) * 0.4;
                obj.mesh.rotation.x = Math.sin(t * 0.8) * 0.2;
                
            } else if (obj.config.float) {
                obj.mesh.position.y = obj.base.y + Math.sin(t * 0.5) * 0.4;
                obj.mesh.rotation.y += delta * 0.1;
                
            } else if (obj.config.spin) {
                obj.mesh.rotation.y += delta * 0.015;
                obj.mesh.rotation.x = Math.sin(t * 0.1) * 0.05;
            }
        }
        
        // ═══════════════════════════════════════════════════════════════
        // ROSE PETALS FALLING!
        // ═══════════════════════════════════════════════════════════════
        if (this.petals) {
            this.petals.forEach(p => {
                p.mesh.position.y -= delta * p.speed;
                p.mesh.position.x += Math.sin(time * p.swaySpeed + p.mesh.position.z) * delta * p.swayAmount;
                p.mesh.position.z += Math.cos(time * p.swaySpeed * 0.7 + p.mesh.position.x) * delta * p.swayAmount * 0.5;
                p.mesh.rotation.z += delta * p.rotSpeed;
                p.mesh.rotation.x += delta * p.rotSpeed * 0.5;
                
                // Respawn at top
                if (p.mesh.position.y < 0) {
                    p.mesh.position.y = 35 + Math.random() * 10;
                    p.mesh.position.x = (Math.random() - 0.5) * 60;
                    p.mesh.position.z = (Math.random() - 0.5) * 60;
                }
            });
        }
        
        // ═══════════════════════════════════════════════════════════════
        // HEART CONSTELLATION TWINKLING!
        // ═══════════════════════════════════════════════════════════════
        if (this.heartStars) {
            this.heartStars.forEach((star, i) => {
                const twinkle = Math.sin(time * 2 + star.offset) * 0.4 + 0.6;
                star.mesh.material.opacity = twinkle;
                star.mesh.scale.setScalar(0.8 + twinkle * 0.4);
            });
        }
        
        // ═══════════════════════════════════════════════════════════════
        // AURORA LIGHTS DANCING!
        // ═══════════════════════════════════════════════════════════════
        if (this.aurora1 && this.aurora2) {
            this.aurora1.intensity = 1.2 + Math.sin(time * 0.8) * 0.5;
            this.aurora2.intensity = 1.2 + Math.cos(time * 0.7) * 0.5;
            
            this.aurora1.position.x = 40 + Math.sin(time * 0.3) * 15;
            this.aurora2.position.x = -40 + Math.cos(time * 0.25) * 15;
        }
        
        if (this.stars) this.stars.rotation.y += delta * 0.003;
        if (this.particles) {
            const pos = this.particles.geometry.attributes.position.array;
            for (let i = 1; i < pos.length; i += 3) pos[i] += Math.sin(time + i) * 0.003;
            this.particles.geometry.attributes.position.needsUpdate = true;
        }
        if (this.glowRing) this.glowRing.material.opacity = 0.35 + Math.sin(time * 2) * 0.2;
        if (this.skyPlanets) {
            this.skyPlanets.jupiter.rotation.y += delta * 0.006;
            this.skyPlanets.saturn.rotation.y += delta * 0.009;
            this.skyPlanets.saturnRing.rotation.z += delta * 0.004;
        }
        if (this.homeText) this.homeText.lookAt(this.camera.position);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        const delta = Math.min(this.clock.getDelta(), 0.1);
        const time = this.clock.getElapsedTime();
        this.updatePlayer(delta);
        this.updateInteraction();
        this.updateAnimations(delta, time);
        this.renderer.render(this.scene, this.camera);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    console.log('🏠 Starting Tan\'s Home - A Universe of Love...');
    window.game = new TansHome();
});