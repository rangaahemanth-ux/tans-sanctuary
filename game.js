// ═══════════════════════════════════════════════════════════════════════════
// TAN'S HOME — Fixed Edition with Flying Phoenix & Whale
// Built with passion for Tanmai 💕
// Phoenix flies, Whale swims, Music works!
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
            position: new THREE.Vector3(0, 2, 10),
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
        
        // Audio
        this.audioElement = null;
        this.playlist = [];
        
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
        this.animate();
    }
    
    setupRenderer() {
        const canvas = document.getElementById('game-canvas');
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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
        // Bright ambient
        const ambient = new THREE.AmbientLight(0x8090b0, 0.8);
        this.scene.add(ambient);
        
        // Main light
        const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
        mainLight.position.set(30, 50, 20);
        mainLight.castShadow = true;
        this.scene.add(mainLight);
        
        // Warm light near house
        const warmLight = new THREE.PointLight(0xffaa66, 2, 30);
        warmLight.position.set(0, 5, -3);
        this.scene.add(warmLight);
        
        // Rose accent
        const roseLight = new THREE.PointLight(0xff6b8b, 1.5, 40);
        roseLight.position.set(-8, 8, 5);
        this.scene.add(roseLight);
        
        // Blue fill
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
        const geometry = new THREE.SphereGeometry(800, 64, 64);
        const vertexShader = `
            varying vec3 vWorldPosition;
            void main() {
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPosition.xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
        const fragmentShader = `
            varying vec3 vWorldPosition;
            void main() {
                float y = normalize(vWorldPosition).y;
                vec3 bottom = vec3(0.02, 0.01, 0.06);
                vec3 mid = vec3(0.08, 0.03, 0.15);
                vec3 top = vec3(0.05, 0.02, 0.12);
                vec3 color = y < 0.0 ? mix(bottom, mid, y + 1.0) : mix(mid, top, y);
                gl_FragColor = vec4(color, 1.0);
            }
        `;
        const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, side: THREE.BackSide });
        this.scene.add(new THREE.Mesh(geometry, material));
    }
    
    createStars() {
        const count = 5000;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        
        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            const r = 300 + Math.random() * 400;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            positions[i3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = r * Math.cos(phi);
            
            const c = Math.random();
            colors[i3] = c < 0.7 ? 1 : (c < 0.85 ? 1 : 0.7);
            colors[i3 + 1] = c < 0.7 ? 1 : (c < 0.85 ? 0.9 : 0.8);
            colors[i3 + 2] = c < 0.7 ? 1 : (c < 0.85 ? 0.7 : 1);
        }
        
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        const mat = new THREE.PointsMaterial({ size: 2, vertexColors: true, transparent: true, opacity: 0.9 });
        this.stars = new THREE.Points(geo, mat);
        this.scene.add(this.stars);
    }
    
    createGround() {
        // Platform
        const ground = new THREE.Mesh(
            new THREE.CylinderGeometry(30, 35, 2, 64),
            new THREE.MeshStandardMaterial({ color: 0x15102a, roughness: 0.8 })
        );
        ground.position.y = -1;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Glow ring
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
        const mat = new THREE.PointsMaterial({ size: 0.2, color: 0xff6b8b, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending });
        this.particles = new THREE.Points(geo, mat);
        this.scene.add(this.particles);
    }
    
    async loadModels() {
        const loadBar = document.getElementById('load-bar');
        const loadStatus = document.getElementById('load-status');
        
        // UPDATED MODEL LIST - REMOVED JELLYFISH, ADDED WHALE, PHOENIX FLIES!
        const models = [
            // === HOUSE (center) ===
            {
                file: 'mushroom_water_house.glb',
                name: 'house',
                scale: 1.8,
                position: [0, 0, -5],
                noAnimation: true,
                interactive: true,
                info: {
                    name: '🏠 Tan\'s Home',
                    description: 'This magical mushroom house was built just for you, Tanmai. It\'s a place where love lives forever.',
                    fact: 'Every room inside is filled with memories of us!'
                }
            },
            // === POSTBOX ===
            {
                file: 'red_post_box.glb',
                name: 'postbox',
                scale: 1.0,
                position: [8, 0, 3],
                rotation: [0, -0.5, 0],
                noAnimation: true,
                interactive: true,
                isLetter: true,
                info: { name: '💌 Love Letter', description: 'A special letter waiting for you...', fact: '' }
            },
            // === PHOENIX - NOW FLIES AROUND THE SKY! ===
            {
                file: 'phoenix_on_fire_update.glb',
                name: 'phoenix',
                scale: 0.15,  // Bigger so you can see it flying!
                position: [0, 25, -20],  // Start high in sky
                rotation: [0, 0, 0],
                animate: true,  // Use animations!
                explore: true,  // FLY AROUND!
                birdFlight: true,  // Special bird flight behavior
                addGlow: true,  // Add fire glow!
                interactive: true,
                info: {
                    name: '🔥 Guardian Phoenix',
                    description: 'This mystical firebird soars through the sky, watching over our home.',
                    fact: 'Legend says it grants wishes to those with pure hearts!'
                }
            },
            // === MYTHIC WHALE - NEW! ===
            {
                file: 'mythic_whale_-_stylized_animated_model.glb',
                name: 'whale',
                scale: 2.0,
                position: [-25, 18, 10],
                animate: true,
                explore: true,
                swimGracefully: true,
                interactive: true,
                info: {
                    name: '🐋 Cosmic Whale',
                    description: 'A majestic space whale that swims through the stars.',
                    fact: 'It carries the songs of the universe within its heart!'
                }
            },
            // === BLADDERFISH - still exploring ===
            {
                file: 'bladderfish.glb',
                name: 'bladderfish',
                scale: 1.2,
                position: [10, 8, 20],
                animate: true,
                explore: true,
                interactive: true,
                info: {
                    name: '🐡 Space Bladderfish',
                    description: 'A friendly fish that brings joy wherever it floats.',
                    fact: 'It chose to live here because of all the love!'
                }
            },
            // === SALSA DANCER ===
            {
                file: 'salsa_dance_basic_steps_-_lowpoly_style.glb',
                name: 'dancer',
                scale: 1.0,
                position: [-8, 0, 5],
                rotation: [0, 0.8, 0],
                animate: true,
                noMovement: true,
                interactive: true,
                info: {
                    name: '💃 Dancing Spirit',
                    description: 'A joyful spirit that dances eternally to celebrate love.',
                    fact: 'It dances to the rhythm of your heartbeat!'
                }
            },
            // === PURPLE PLANET - HUGE in sky ===
            {
                file: 'purple_planet.glb',
                name: 'purplePlanet',
                scale: 25,
                position: [-100, 80, -150],
                spin: true,
                interactive: true,
                info: {
                    name: '💜 Amethyst Planet',
                    description: 'A beautiful purple world where dreams come true.',
                    fact: 'Some say lovers who wish upon it will be together forever!'
                }
            },
            // === STYLIZED PLANET - HUGE ===
            {
                file: 'stylized_planet.glb',
                name: 'stylizedPlanet',
                scale: 20,
                position: [120, 60, -140],
                spin: true,
                interactive: true,
                info: {
                    name: '🌍 Dream World',
                    description: 'A colorful planet painted by the universe itself.',
                    fact: 'Every color represents a beautiful emotion!'
                }
            },
            // === PAPYRUS ===
            {
                file: 'furled_papyrus.glb',
                name: 'papyrus',
                scale: 0.3,
                position: [8, 2.2, 3],
                float: true,
                noAnimation: true
            },
            // === DEEP SPACE SKYBOX ===
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
            await this.sleep(80);
        }
        
        // Add more creatures
        this.addCreatureClones();
        
        // Create home text
        this.createHomeText();
        
        // Create visible planets in sky
        this.createSkyPlanets();
        
        this.state.loaded = true;
        this.finishLoading();
    }
    
    loadModel(config) {
        return new Promise((resolve, reject) => {
            this.loader.load(
                config.file,
                (gltf) => {
                    const model = gltf.scene;
                    model.scale.setScalar(config.scale);
                    model.position.set(...config.position);
                    if (config.rotation) model.rotation.set(...config.rotation);
                    
                    // Add glow effect to phoenix!
                    if (config.addGlow) {
                        model.traverse(child => {
                            if (child.isMesh) {
                                child.castShadow = true;
                                child.receiveShadow = true;
                                // Add fiery glow!
                                if (child.material) {
                                    child.material.emissive = new THREE.Color(0xff4400);
                                    child.material.emissiveIntensity = 0.8;
                                }
                            }
                        });
                        
                        // Add point light to phoenix for glow
                        const phoenixLight = new THREE.PointLight(0xff6600, 3, 30);
                        phoenixLight.position.set(0, 0, 0);
                        model.add(phoenixLight);
                        
                        // Add outer glow sphere
                        const glowGeometry = new THREE.SphereGeometry(config.scale * 8, 16, 16);
                        const glowMaterial = new THREE.MeshBasicMaterial({
                            color: 0xff6600,
                            transparent: true,
                            opacity: 0.15,
                            side: THREE.BackSide
                        });
                        const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
                        model.add(glowMesh);
                    } else {
                        model.traverse(child => {
                            if (child.isMesh) {
                                child.castShadow = true;
                                child.receiveShadow = true;
                            }
                        });
                    }
                    
                    this.scene.add(model);
                    this.models[config.name] = model;
                    
                    // Animations
                    if (gltf.animations?.length && !config.noAnimation) {
                        const mixer = new THREE.AnimationMixer(model);
                        gltf.animations.forEach(clip => {
                            const action = mixer.clipAction(clip);
                            action.play();
                        });
                        this.mixers.push(mixer);
                        console.log(`🎬 Playing ${gltf.animations.length} animations for ${config.name}`);
                    }
                    
                    // Movement system
                    if ((config.swim || config.float || config.spin || config.explore || config.birdFlight || config.swimGracefully) && !config.noMovement) {
                        this.floatingObjects.push({
                            mesh: model,
                            config,
                            base: new THREE.Vector3(...config.position),
                            offset: Math.random() * Math.PI * 2,
                            currentWaypoint: new THREE.Vector3(...config.position),
                            targetWaypoint: config.birdFlight ? this.generateSkyWaypoint() : this.generateWaypoint(),
                            waypointProgress: 0,
                            waypointSpeed: config.birdFlight ? 0.3 : (config.swimGracefully ? 0.12 : 0.2),
                            swimOffset: Math.random() * Math.PI * 2,
                            tiltAmount: config.birdFlight ? 0.5 : 0.3,
                            wanderAngle: Math.random() * Math.PI * 2,
                            wanderSpeed: config.birdFlight ? 0.04 : 0.02
                        });
                    }
                    
                    // Interactive
                    if (config.interactive) {
                        this.interactables.push({
                            object: model,
                            isLetter: config.isLetter,
                            info: config.info,
                            action: () => {
                                if (config.isLetter) this.openLetter();
                                else this.showInfoCard(config.info);
                            }
                        });
                    }
                    
                    resolve(model);
                },
                undefined,
                reject
            );
        });
    }
    
    // Generate waypoints high in the sky for bird flight!
    generateSkyWaypoint() {
        const radius = 30 + Math.random() * 40;  // Wide area
        const angle = Math.random() * Math.PI * 2;
        const height = 20 + Math.random() * 25;  // HIGH in sky!
        
        return new THREE.Vector3(
            Math.cos(angle) * radius,
            height,
            Math.sin(angle) * radius
        );
    }
    
    // Generate regular waypoints for other creatures
    generateWaypoint() {
        const radius = 20 + Math.random() * 25;
        const angle = Math.random() * Math.PI * 2;
        const height = 8 + Math.random() * 20;
        
        return new THREE.Vector3(
            Math.cos(angle) * radius,
            height,
            Math.sin(angle) * radius
        );
    }
    
    addCreatureClones() {
        // Clone whale - add more whales swimming
        if (this.models.whale) {
            [[30, 20, -15], [-35, 16, 20]].forEach(pos => {
                const clone = this.models.whale.clone();
                clone.position.set(...pos);
                clone.scale.setScalar(1.5 + Math.random() * 1.0);
                this.scene.add(clone);
                this.floatingObjects.push({
                    mesh: clone,
                    config: { explore: true, swimGracefully: true, scale: clone.scale.x },
                    base: clone.position.clone(),
                    offset: Math.random() * Math.PI * 2,
                    currentWaypoint: clone.position.clone(),
                    targetWaypoint: this.generateWaypoint(),
                    waypointProgress: 0,
                    waypointSpeed: 0.1,
                    tiltAmount: 0.25,
                    wanderAngle: Math.random() * Math.PI * 2,
                    wanderSpeed: 0.015
                });
            });
        }
        
        // Clone bladderfish
        if (this.models.bladderfish) {
            [[-20, 10, 20], [25, 8, 15]].forEach(pos => {
                const clone = this.models.bladderfish.clone();
                clone.position.set(...pos);
                clone.scale.setScalar(0.8 + Math.random() * 0.5);
                this.scene.add(clone);
                this.floatingObjects.push({
                    mesh: clone,
                    config: { explore: true, scale: clone.scale.x },
                    base: clone.position.clone(),
                    offset: Math.random() * Math.PI * 2,
                    currentWaypoint: clone.position.clone(),
                    targetWaypoint: this.generateWaypoint(),
                    waypointProgress: 0,
                    waypointSpeed: 0.25,
                    tiltAmount: 0.3,
                    wanderAngle: Math.random() * Math.PI * 2,
                    wanderSpeed: 0.025
                });
            });
        }
    }
    
    createHomeText() {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.shadowColor = '#ff6b8b';
        ctx.shadowBlur = 40;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#ff6b8b';
        ctx.lineWidth = 6;
        ctx.font = 'bold 120px "Cormorant Garamond", Georgia, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.strokeText("Tan's Home", canvas.width / 2, canvas.height / 2 - 15);
        ctx.fillText("Tan's Home", canvas.width / 2, canvas.height / 2 - 15);
        
        ctx.font = '36px serif';
        ctx.fillStyle = '#ffaacc';
        ctx.shadowBlur = 20;
        ctx.fillText('💕 Made with love 💕', canvas.width / 2, canvas.height / 2 + 70);
        
        const texture = new THREE.CanvasTexture(canvas);
        const text = new THREE.Mesh(
            new THREE.PlaneGeometry(10, 2.5),
            new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide, depthWrite: false })
        );
        text.position.set(0, 9, -7);
        this.scene.add(text);
        this.homeText = text;
        
        const glow = new THREE.Mesh(
            new THREE.PlaneGeometry(11, 3),
            new THREE.MeshBasicMaterial({ color: 0xff6b8b, transparent: true, opacity: 0.12, side: THREE.DoubleSide })
        );
        glow.position.set(0, 9, -7.1);
        this.scene.add(glow);
        this.homeTextGlow = glow;
    }
    
    createSkyPlanets() {
        const jupiter = new THREE.Mesh(
            new THREE.SphereGeometry(40, 32, 32),
            new THREE.MeshStandardMaterial({ color: 0xd4a574, roughness: 0.8 })
        );
        jupiter.position.set(-180, 100, -250);
        this.scene.add(jupiter);
        
        const stripeColors = [0xc99b65, 0xb8845a, 0xd4a574];
        for (let i = -2; i <= 2; i++) {
            const stripe = new THREE.Mesh(
                new THREE.TorusGeometry(41, 2, 8, 64),
                new THREE.MeshBasicMaterial({ color: stripeColors[(i + 2) % 3] })
            );
            stripe.position.copy(jupiter.position);
            stripe.position.y += i * 12;
            stripe.rotation.x = Math.PI / 2;
            this.scene.add(stripe);
        }
        
        const saturn = new THREE.Mesh(
            new THREE.SphereGeometry(30, 32, 32),
            new THREE.MeshStandardMaterial({ color: 0xead6b8, roughness: 0.7 })
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
        
        const moon = new THREE.Mesh(
            new THREE.SphereGeometry(12, 32, 32),
            new THREE.MeshStandardMaterial({ color: 0xffffee, emissive: 0xffffaa, emissiveIntensity: 0.6 })
        );
        moon.position.set(70, 60, -120);
        this.scene.add(moon);
        
        const moonGlow = new THREE.Mesh(
            new THREE.SphereGeometry(18, 32, 32),
            new THREE.MeshBasicMaterial({ color: 0xffffcc, transparent: true, opacity: 0.15 })
        );
        moonGlow.position.copy(moon.position);
        this.scene.add(moonGlow);
        
        [
            { obj: jupiter, info: { name: '🪐 Jupiter', description: 'The king of planets watches over Tan\'s Home.', fact: 'Its Great Red Spot is a storm of love!' }},
            { obj: saturn, info: { name: '🪐 Saturn', description: 'The ringed wonder, symbolizing the eternal circle of our love.', fact: 'Each ring represents a beautiful memory!' }},
            { obj: moon, info: { name: '🌙 Moon', description: 'Our moon lights up the night, just like you light up my life.', fact: 'I think of you every time I see the moon!' }}
        ].forEach(p => {
            this.interactables.push({
                object: p.obj,
                info: p.info,
                action: () => this.showInfoCard(p.info)
            });
        });
        
        this.skyPlanets = { jupiter, saturn, saturnRing, moon };
    }
    
    setupControls() {
        window.addEventListener('keydown', e => {
            this.keys[e.code] = true;
            if (e.code === 'KeyE' && this.currentTarget && this.state.started) {
                this.currentTarget.action();
            }
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
                this.player.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.player.pitch - e.movementY * 0.002));
            }
        });
    }
    
    setupUI() {
        document.getElementById('btn-enter').addEventListener('click', () => this.startGame());
        document.getElementById('close-letter').addEventListener('click', () => this.closeLetter());
        document.getElementById('close-info-card')?.addEventListener('click', () => this.closeInfoCard());
        document.querySelector('#letter-modal .modal-backdrop')?.addEventListener('click', () => this.closeLetter());
        document.querySelector('#info-card-modal .modal-backdrop')?.addEventListener('click', () => this.closeInfoCard());
    }
    
    setupAudio() {
        this.audioElement = new Audio();
        this.audioElement.loop = false;
        this.audioElement.volume = 0.5;
        
        this.audioElement.addEventListener('ended', () => this.playNextSong());
        this.scanForMusic();
        
        // FIXED: Proper event listeners for music controls
        const playBtn = document.getElementById('music-play-btn');
        const prevBtn = document.getElementById('music-prev-btn');
        const nextBtn = document.getElementById('music-next-btn');
        const volumeSlider = document.getElementById('music-volume');
        
        if (playBtn) playBtn.addEventListener('click', () => this.toggleMusic());
        if (prevBtn) prevBtn.addEventListener('click', () => this.playPrevSong());
        if (nextBtn) nextBtn.addEventListener('click', () => this.playNextSong());
        if (volumeSlider) {
            volumeSlider.addEventListener('input', e => {
                this.audioElement.volume = e.target.value / 100;
            });
        }
        
        console.log('🎵 Music player initialized');
    }
    
    scanForMusic() {
        const patterns = [
            'sounds/music.mp3/Chinuku Take-SenSongsMp3.Co.mp3',
            'sounds/music.mp3/Chinuku%20Take-SenSongsMp3.Co.mp3',
            'sounds/Chinuku Take-SenSongsMp3.Co.mp3',
            'sounds/Chinuku%20Take-SenSongsMp3.Co.mp3',
            'sounds/music.mp3', 'sounds/song.mp3', 'sounds/background.mp3',
            'sounds/track.mp3', 'sounds/bgm.mp3', 'sounds/audio.mp3',
            'sounds/love.mp3', 'sounds/tanmai.mp3', 'sounds/chinuku.mp3',
            'sounds/song1.mp3', 'sounds/song2.mp3', 'sounds/song3.mp3',
            'sounds/track1.mp3', 'sounds/track2.mp3', 'sounds/track3.mp3',
            'sounds/1.mp3', 'sounds/2.mp3', 'sounds/3.mp3',
            'sounds/music.wav', 'sounds/music.ogg', 'sounds/music.m4a'
        ];
        
        this.playlist = [];
        
        patterns.forEach(path => {
            const audio = new Audio();
            audio.src = path;
            audio.oncanplaythrough = () => {
                if (!this.playlist.find(p => p === path)) {
                    this.playlist.push(path);
                    console.log('✓ Found music:', path);
                    this.updateMusicUI();
                }
            };
        });
        
        setTimeout(() => {
            if (this.playlist.length === 0) {
                const nameEl = document.getElementById('music-name');
                if (nameEl) nameEl.textContent = 'No music found - add .mp3 to sounds/';
            }
        }, 2000);
    }
    
    updateMusicUI() {
        if (this.playlist.length > 0) {
            const name = this.playlist[this.state.currentSongIndex].split('/').pop().replace(/%20/g, ' ');
            const nameEl = document.getElementById('music-name');
            if (nameEl) nameEl.textContent = '🎵 ' + name;
            
            if (!this.audioElement.src || this.audioElement.src === '') {
                this.audioElement.src = this.playlist[0];
                console.log('🎵 Loaded:', this.playlist[0]);
            }
        }
    }
    
    playMusic() {
        if (this.playlist.length === 0) {
            console.log('No music in playlist');
            return;
        }
        
        if (!this.audioElement.src || this.audioElement.src === '') {
            this.audioElement.src = this.playlist[this.state.currentSongIndex];
        }
        
        const playPromise = this.audioElement.play();
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    this.state.musicPlaying = true;
                    const playBtn = document.getElementById('music-play-btn');
                    if (playBtn) playBtn.innerHTML = '<i class="fas fa-pause"></i>';
                    console.log('▶️ Playing music');
                })
                .catch(e => {
                    console.log('Play blocked:', e.message);
                    console.log('Click play button to start music');
                });
        }
    }
    
    pauseMusic() {
        this.audioElement.pause();
        this.state.musicPlaying = false;
        const playBtn = document.getElementById('music-play-btn');
        if (playBtn) playBtn.innerHTML = '<i class="fas fa-play"></i>';
        console.log('⏸️ Paused music');
    }
    
    toggleMusic() {
        console.log('🎵 Toggle music - currently:', this.state.musicPlaying ? 'playing' : 'paused');
        if (this.state.musicPlaying) {
            this.pauseMusic();
        } else {
            this.playMusic();
        }
    }
    
    playNextSong() {
        if (this.playlist.length === 0) return;
        this.state.currentSongIndex = (this.state.currentSongIndex + 1) % this.playlist.length;
        this.audioElement.src = this.playlist[this.state.currentSongIndex];
        this.updateMusicUI();
        if (this.state.musicPlaying) {
            this.playMusic();
        }
        console.log('⏭️ Next song');
    }
    
    playPrevSong() {
        if (this.playlist.length === 0) return;
        this.state.currentSongIndex = (this.state.currentSongIndex - 1 + this.playlist.length) % this.playlist.length;
        this.audioElement.src = this.playlist[this.state.currentSongIndex];
        this.updateMusicUI();
        if (this.state.musicPlaying) {
            this.playMusic();
        }
        console.log('⏮️ Previous song');
    }
    
    startGame() {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');
        this.state.started = true;
        document.getElementById('game-canvas').requestPointerLock();
        
        if (this.playlist.length > 0) {
            setTimeout(() => this.playMusic(), 500);
        }
    }
    
    openLetter() {
        document.exitPointerLock();
        document.getElementById('letter-modal').classList.remove('hidden');
        document.getElementById('letter-date').textContent = new Date().toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
        
        if (!this.state.letterRead) {
            this.state.letterRead = true;
            setTimeout(() => {
                this.showFireworks();
                this.showValentineMessage();
            }, 2000);
        }
    }
    
    closeLetter() {
        document.getElementById('letter-modal').classList.add('hidden');
        if (this.state.started) document.getElementById('game-canvas').requestPointerLock();
    }
    
    showInfoCard(info) {
        document.exitPointerLock();
        document.getElementById('info-card-modal').classList.remove('hidden');
        document.getElementById('info-name').textContent = info.name;
        document.getElementById('info-description').textContent = info.description;
        document.getElementById('info-fact').textContent = info.fact || 'Part of Tan\'s magical home!';
    }
    
    closeInfoCard() {
        document.getElementById('info-card-modal').classList.add('hidden');
        if (this.state.started) document.getElementById('game-canvas').requestPointerLock();
    }
    
    showFireworks() {
        if (this.state.fireworksShown) return;
        this.state.fireworksShown = true;
        
        const container = document.getElementById('fireworks-container');
        const colors = ['#ff6b8b', '#ffcc00', '#ff8e53', '#9966ff', '#ff88aa', '#88ff88'];
        
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const x = 15 + Math.random() * 70;
                const y = 15 + Math.random() * 50;
                const color = colors[Math.floor(Math.random() * colors.length)];
                
                for (let j = 0; j < 25; j++) {
                    const p = document.createElement('div');
                    p.className = 'firework';
                    p.style.cssText = `left:${x}%;top:${y}%;background:${color};box-shadow:0 0 10px ${color};animation-delay:${Math.random()*0.1}s`;
                    container.appendChild(p);
                    setTimeout(() => p.remove(), 1500);
                }
            }, i * 250);
        }
    }
    
    showValentineMessage() {
        const msg = document.getElementById('valentine-message');
        msg.classList.remove('hidden');
        setTimeout(() => msg.classList.add('hidden'), 5000);
    }
    
    finishLoading() {
        setTimeout(() => {
            document.getElementById('loading-screen').classList.add('fade-out');
            document.getElementById('main-menu').classList.remove('hidden');
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
        
        if (dir.length() > 0) {
            dir.normalize().multiplyScalar(speed);
            this.player.position.add(dir);
        }
        
        const dist = Math.sqrt(this.player.position.x ** 2 + this.player.position.z ** 2);
        if (dist > 28) {
            const angle = Math.atan2(this.player.position.z, this.player.position.x);
            this.player.position.x = Math.cos(angle) * 28;
            this.player.position.z = Math.sin(angle) * 28;
        }
        
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
        
        let nearest = null;
        let nearestDist = 12;
        
        for (const item of this.interactables) {
            const pos = new THREE.Vector3();
            item.object.getWorldPosition(pos);
            const dist = this.player.position.distanceTo(pos);
            
            if (dist < nearestDist) {
                const toObj = pos.clone().sub(this.player.position).normalize();
                const look = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
                if (toObj.dot(look) > 0.5) {
                    nearestDist = dist;
                    nearest = item;
                }
            }
        }
        
        this.currentTarget = nearest;
        
        if (nearest) {
            prompt.classList.remove('hidden');
            text.textContent = `${nearest.info?.name || 'Interact'} - Press E`;
            if (crosshair) crosshair.classList.add('active');
        } else {
            prompt.classList.add('hidden');
            if (crosshair) crosshair.classList.remove('active');
        }
    }
    
    updateAnimations(delta, time) {
        // GLB animations
        this.mixers.forEach(m => m.update(delta));
        
        // Flying/swimming creatures
        for (const obj of this.floatingObjects) {
            const t = time + obj.offset;
            
            if (obj.config.explore || obj.config.birdFlight || obj.config.swimGracefully) {
                // Waypoint navigation
                obj.waypointProgress += delta * obj.waypointSpeed;
                
                const easeProgress = obj.waypointProgress < 0.5 
                    ? 2 * obj.waypointProgress * obj.waypointProgress 
                    : 1 - Math.pow(-2 * obj.waypointProgress + 2, 2) / 2;
                
                obj.mesh.position.lerpVectors(
                    obj.currentWaypoint,
                    obj.targetWaypoint,
                    easeProgress
                );
                
                // Wandering
                const wanderRadius = obj.config.birdFlight ? 5 : 3;
                obj.wanderAngle += (Math.random() - 0.5) * 0.1;
                obj.mesh.position.x += Math.cos(obj.wanderAngle) * wanderRadius * delta;
                obj.mesh.position.z += Math.sin(obj.wanderAngle) * wanderRadius * delta;
                
                // Vertical bobbing
                obj.mesh.position.y += Math.sin(t * (obj.config.birdFlight ? 0.8 : 0.5)) * 0.02;
                
                // Reached waypoint?
                if (obj.waypointProgress >= 1.0) {
                    obj.currentWaypoint.copy(obj.mesh.position);
                    obj.targetWaypoint = obj.config.birdFlight ? this.generateSkyWaypoint() : this.generateWaypoint();
                    obj.waypointProgress = 0;
                    console.log(`🦅 ${obj.config.birdFlight ? 'Phoenix' : 'Creature'} exploring new area!`);
                }
                
                // Face direction
                const direction = new THREE.Vector3()
                    .subVectors(obj.targetWaypoint, obj.currentWaypoint)
                    .normalize();
                const targetAngle = Math.atan2(direction.x, direction.z);
                obj.mesh.rotation.y += (targetAngle - obj.mesh.rotation.y) * 0.05;
                
                // Tilting (bird banking)
                const velocity = new THREE.Vector3()
                    .subVectors(obj.targetWaypoint, obj.currentWaypoint);
                obj.mesh.rotation.z = Math.sin(t * 2) * obj.tiltAmount * (velocity.length() / 50);
                if (obj.config.birdFlight) {
                    obj.mesh.rotation.x = Math.cos(t * 1.5) * obj.tiltAmount * 0.3;
                }
                
            } else if (obj.config.float) {
                obj.mesh.position.y = obj.base.y + Math.sin(t * 0.5) * 0.4;
                obj.mesh.rotation.y += delta * 0.2;
                
            } else if (obj.config.spin) {
                obj.mesh.rotation.y += delta * 0.02;
            }
        }
        
        if (this.stars) this.stars.rotation.y += delta * 0.003;
        
        if (this.particles) {
            const pos = this.particles.geometry.attributes.position.array;
            for (let i = 1; i < pos.length; i += 3) {
                pos[i] += Math.sin(time + i) * 0.003;
            }
            this.particles.geometry.attributes.position.needsUpdate = true;
            this.particles.rotation.y += delta * 0.01;
        }
        
        if (this.glowRing) {
            this.glowRing.material.opacity = 0.35 + Math.sin(time * 2) * 0.15;
        }
        
        if (this.skyPlanets) {
            this.skyPlanets.jupiter.rotation.y += delta * 0.008;
            this.skyPlanets.saturn.rotation.y += delta * 0.01;
            this.skyPlanets.saturnRing.rotation.z += delta * 0.005;
        }
        
        if (this.homeText) this.homeText.lookAt(this.camera.position);
        if (this.homeTextGlow) {
            this.homeTextGlow.lookAt(this.camera.position);
            this.homeTextGlow.material.opacity = 0.1 + Math.sin(time * 3) * 0.06;
        }
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
    
    sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    }
}

window.addEventListener('DOMContentLoaded', () => window.game = new TansHome());