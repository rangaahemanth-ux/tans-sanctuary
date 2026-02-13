// ═══════════════════════════════════════════════════════════════════════════
// TAN'S HOME — Final Polished Edition
// Built with passion for Tanmai 💕
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
        
        // ALL YOUR MODELS - FIXED SIZES & TRAVELING MOVEMENT
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
            // === PHOENIX - TINY and far behind ===
            {
                file: 'phoenix_on_fire_update.glb',
                name: 'phoenix',
                scale: 1.1,  // SUPER TINY!
                position: [0, 12, -35],  // Far behind house
                rotation: [0, Math.PI, 0],
                noAnimation: false,
                noMovement: true,
                interactive: true,
                info: {
                    name: '🔥 Guardian Phoenix',
                    description: 'This mystical firebird watches over our home from afar.',
                    fact: 'Legend says it grants wishes to those with pure hearts!'
                }
            },
            // === CRYSTAL JELLYFISH - BIG, travels across sky ===
            {
                file: 'crystal_jellyfish_leptomedusae.glb',
                name: 'crystalJelly',
                scale: 2.5,  // BIG!
                position: [-15, 12, 10],
                animate: true,
                travel: true,  // Travels across the site!
                jellyPulse: true,  // Pulses upward like real jellyfish
                interactive: true,
                info: {
                    name: '💎 Crystal Jellyfish',
                    description: 'A rare crystalline jellyfish that glows with inner light.',
                    fact: 'Its light changes color based on the emotions around it!'
                }
            },
            // === JELLYRAYS - BIG, travel across sky ===
            {
                file: 'jellyray.glb',
                name: 'jellyray1',
                scale: 1.8,  // BIG!
                position: [20, 15, -10],
                animate: true,
                travel: true,
                jellyPulse: true,
                interactive: true,
                info: {
                    name: '🎐 Cosmic Jellyray',
                    description: 'These graceful creatures glide through space, leaving trails of stardust.',
                    fact: 'Jellyrays are naturally drawn to happiness!'
                }
            },
            {
                file: 'jellyray (1).glb',
                name: 'jellyray2',
                scale: 1.5,  // BIG!
                position: [-20, 18, 15],
                animate: true,
                travel: true,
                jellyPulse: true,
                interactive: true,
                info: {
                    name: '✨ Starlight Jellyray',
                    description: 'This species carries the glow of distant galaxies within its body.',
                    fact: 'Each one holds memories of the cosmos!'
                }
            },
            // === BLADDERFISH - travels around ===
            {
                file: 'bladderfish.glb',
                name: 'bladderfish',
                scale: 1.2,  // Bigger!
                position: [10, 8, 20],
                animate: true,
                travel: true,
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
                scale: 25,  // HUGE!
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
                scale: 20,  // HUGE!
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
        
        // Add clones of creatures
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
                    
                    model.traverse(child => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });
                    
                    this.scene.add(model);
                    this.models[config.name] = model;
                    
                    // Animations
                    if (gltf.animations?.length && !config.noAnimation) {
                        const mixer = new THREE.AnimationMixer(model);
                        gltf.animations.forEach(clip => mixer.clipAction(clip).play());
                        this.mixers.push(mixer);
                    }
                    
                    // Movement - including travel across site
                    if ((config.swim || config.float || config.spin || config.travel || config.jellyPulse) && !config.noMovement) {
                        this.floatingObjects.push({
                            mesh: model,
                            config,
                            base: new THREE.Vector3(...config.position),
                            offset: Math.random() * Math.PI * 2,
                            swimOffset: Math.random() * Math.PI * 2,
                            travelAngle: Math.random() * Math.PI * 2,  // Starting angle for travel
                            travelSpeed: 0.02 + Math.random() * 0.03,  // Travel speed variation
                            pulsePhase: Math.random() * Math.PI * 2   // Jelly pulse phase
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
    
    addCreatureClones() {
        // Clone jellyrays - traveling across sky
        if (this.models.jellyray1) {
            [[-25, 20, 15], [30, 16, -20], [0, 22, 25]].forEach((pos, i) => {
                const clone = this.models.jellyray1.clone();
                clone.position.set(...pos);
                clone.scale.setScalar(1.2 + Math.random() * 0.8);  // Big!
                clone.rotation.y = Math.random() * Math.PI * 2;
                this.scene.add(clone);
                this.floatingObjects.push({
                    mesh: clone,
                    config: { travel: true, jellyPulse: true, scale: clone.scale.x },
                    base: clone.position.clone(),
                    offset: Math.random() * Math.PI * 2,
                    travelAngle: Math.random() * Math.PI * 2,
                    travelSpeed: 0.015 + Math.random() * 0.02,
                    pulsePhase: Math.random() * Math.PI * 2
                });
            });
        }
        
        // Clone crystal jelly - traveling with pulse
        if (this.models.crystalJelly) {
            [[25, 18, 10], [-30, 15, -15]].forEach(pos => {
                const clone = this.models.crystalJelly.clone();
                clone.position.set(...pos);
                clone.scale.setScalar(1.8 + Math.random() * 1.0);  // Big!
                this.scene.add(clone);
                this.floatingObjects.push({
                    mesh: clone,
                    config: { travel: true, jellyPulse: true, scale: clone.scale.x },
                    base: clone.position.clone(),
                    offset: Math.random() * Math.PI * 2,
                    travelAngle: Math.random() * Math.PI * 2,
                    travelSpeed: 0.01 + Math.random() * 0.015,
                    pulsePhase: Math.random() * Math.PI * 2
                });
            });
        }
        
        // Clone bladderfish - traveling
        if (this.models.bladderfish) {
            [[-20, 10, 20], [25, 8, 15]].forEach(pos => {
                const clone = this.models.bladderfish.clone();
                clone.position.set(...pos);
                clone.scale.setScalar(0.8 + Math.random() * 0.5);  // Bigger!
                this.scene.add(clone);
                this.floatingObjects.push({
                    mesh: clone,
                    config: { travel: true, scale: clone.scale.x },
                    base: clone.position.clone(),
                    offset: Math.random() * Math.PI * 2,
                    travelAngle: Math.random() * Math.PI * 2,
                    travelSpeed: 0.025 + Math.random() * 0.02
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
        
        // Glow behind
        const glow = new THREE.Mesh(
            new THREE.PlaneGeometry(11, 3),
            new THREE.MeshBasicMaterial({ color: 0xff6b8b, transparent: true, opacity: 0.12, side: THREE.DoubleSide })
        );
        glow.position.set(0, 9, -7.1);
        this.scene.add(glow);
        this.homeTextGlow = glow;
    }
    
    createSkyPlanets() {
        // Jupiter - HUGE
        const jupiter = new THREE.Mesh(
            new THREE.SphereGeometry(40, 32, 32),  // HUGE!
            new THREE.MeshStandardMaterial({ color: 0xd4a574, roughness: 0.8 })
        );
        jupiter.position.set(-180, 100, -250);
        this.scene.add(jupiter);
        
        // Jupiter stripes
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
        
        // Saturn with rings - HUGE
        const saturn = new THREE.Mesh(
            new THREE.SphereGeometry(30, 32, 32),  // HUGE!
            new THREE.MeshStandardMaterial({ color: 0xead6b8, roughness: 0.7 })
        );
        saturn.position.set(200, 80, -220);
        this.scene.add(saturn);
        
        const saturnRing = new THREE.Mesh(
            new THREE.RingGeometry(45, 70, 64),  // Big rings!
            new THREE.MeshBasicMaterial({ color: 0xc9b896, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
        );
        saturnRing.position.copy(saturn.position);
        saturnRing.rotation.x = Math.PI / 2.5;
        this.scene.add(saturnRing);
        
        // Moon - glowing, closer
        const moon = new THREE.Mesh(
            new THREE.SphereGeometry(12, 32, 32),
            new THREE.MeshStandardMaterial({ color: 0xffffee, emissive: 0xffffaa, emissiveIntensity: 0.6 })
        );
        moon.position.set(70, 60, -120);
        this.scene.add(moon);
        
        // Moon glow
        const moonGlow = new THREE.Mesh(
            new THREE.SphereGeometry(18, 32, 32),
            new THREE.MeshBasicMaterial({ color: 0xffffcc, transparent: true, opacity: 0.15 })
        );
        moonGlow.position.copy(moon.position);
        this.scene.add(moonGlow);
        
        // Make planets interactive
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
        document.querySelector('#letter-modal .modal-backdrop').addEventListener('click', () => this.closeLetter());
        document.querySelector('#info-card-modal .modal-backdrop')?.addEventListener('click', () => this.closeInfoCard());
    }
    
    setupAudio() {
        this.audioElement = new Audio();
        this.audioElement.loop = false; // We'll handle looping for playlist
        this.audioElement.volume = 0.5;
        
        // When song ends, play next
        this.audioElement.addEventListener('ended', () => this.playNextSong());
        
        // Scan for music files
        this.scanForMusic();
        
        // Play button
        document.getElementById('music-play-btn')?.addEventListener('click', () => this.toggleMusic());
        
        // Previous/Next buttons
        document.getElementById('music-prev-btn')?.addEventListener('click', () => this.playPrevSong());
        document.getElementById('music-next-btn')?.addEventListener('click', () => this.playNextSong());
        
        // Volume
        document.getElementById('music-volume')?.addEventListener('input', e => {
            this.audioElement.volume = e.target.value / 100;
        });
    }
    
    scanForMusic() {
        // All possible music file patterns including your actual file structure
        const patterns = [
            // Your actual file structure (music.mp3 is a folder!)
            'sounds/music.mp3/Chinuku Take-SenSongsMp3.Co.mp3',
            'sounds/music.mp3/Chinuku%20Take-SenSongsMp3.Co.mp3',
            // Direct in sounds folder
            'sounds/Chinuku Take-SenSongsMp3.Co.mp3',
            'sounds/Chinuku%20Take-SenSongsMp3.Co.mp3',
            // Common names
            'sounds/music.mp3', 'sounds/song.mp3', 'sounds/background.mp3',
            'sounds/track.mp3', 'sounds/bgm.mp3', 'sounds/audio.mp3',
            'sounds/love.mp3', 'sounds/tanmai.mp3', 'sounds/chinuku.mp3',
            // Numbered
            'sounds/song1.mp3', 'sounds/song2.mp3', 'sounds/song3.mp3',
            'sounds/track1.mp3', 'sounds/track2.mp3', 'sounds/track3.mp3',
            'sounds/1.mp3', 'sounds/2.mp3', 'sounds/3.mp3',
            // Other formats
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
        
        // Set default message after a delay if nothing found
        setTimeout(() => {
            if (this.playlist.length === 0) {
                document.getElementById('music-name').textContent = 'Add .mp3 files to sounds/ folder';
            }
        }, 2000);
    }
    
    updateMusicUI() {
        if (this.playlist.length > 0) {
            const name = this.playlist[this.state.currentSongIndex].split('/').pop();
            document.getElementById('music-name').textContent = '🎵 ' + name;
            if (!this.audioElement.src) {
                this.audioElement.src = this.playlist[0];
            }
        }
    }
    
    playMusic() {
        if (this.playlist.length === 0) return;
        
        if (!this.audioElement.src) {
            this.audioElement.src = this.playlist[this.state.currentSongIndex];
        }
        
        this.audioElement.play().catch(e => console.log('Play blocked:', e));
        this.state.musicPlaying = true;
        document.getElementById('music-play-btn').innerHTML = '<i class="fas fa-pause"></i>';
    }
    
    pauseMusic() {
        this.audioElement.pause();
        this.state.musicPlaying = false;
        document.getElementById('music-play-btn').innerHTML = '<i class="fas fa-play"></i>';
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
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');
        this.state.started = true;
        document.getElementById('game-canvas').requestPointerLock();
        
        // Auto-play music
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
        
        // Keep on platform
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
        let nearestDist = 12; // Detection range
        
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
            crosshair.classList.add('active');
        } else {
            prompt.classList.add('hidden');
            crosshair.classList.remove('active');
        }
    }
    
    updateAnimations(delta, time) {
        // GLB animations
        this.mixers.forEach(m => m.update(delta));
        
        // Floating/traveling objects
        for (const obj of this.floatingObjects) {
            const t = time + obj.offset;
            
            if (obj.config.travel) {
                // TRAVEL across the entire site in big circles/paths
                const travelRadius = 25 + Math.sin(t * 0.1) * 10;  // Varying radius
                const angle = t * obj.travelSpeed + obj.travelAngle;
                
                // Move in a large figure-8 or circular pattern across the sky
                obj.mesh.position.x = Math.sin(angle) * travelRadius;
                obj.mesh.position.z = Math.cos(angle * 0.7) * travelRadius - 5;
                
                // Height variation
                const baseHeight = obj.base.y;
                obj.mesh.position.y = baseHeight + Math.sin(t * 0.3) * 5;
                
                // Face direction of travel
                obj.mesh.rotation.y = -angle + Math.PI / 2;
                
                // Jellyfish pulse - move UPWARD rhythmically
                if (obj.config.jellyPulse) {
                    const pulseT = t * 2 + obj.pulsePhase;
                    // Quick up, slow down (like real jellyfish)
                    const pulse = Math.max(0, Math.sin(pulseT)) * 3;
                    obj.mesh.position.y += pulse;
                    
                    // Slight squish effect
                    const squish = 1 + Math.sin(pulseT) * 0.1;
                    obj.mesh.scale.y = obj.config.scale * squish;
                    obj.mesh.scale.x = obj.config.scale * (2 - squish) * 0.5 + obj.config.scale * 0.5;
                    obj.mesh.scale.z = obj.config.scale * (2 - squish) * 0.5 + obj.config.scale * 0.5;
                }
            } else if (obj.config.swim) {
                // Regular swimming - still moves but in smaller area
                const st = time + obj.swimOffset;
                obj.mesh.position.x = obj.base.x + Math.sin(st * 0.4) * 3;
                obj.mesh.position.y = obj.base.y + Math.sin(st * 0.6) * 1.5;
                obj.mesh.position.z = obj.base.z + Math.cos(st * 0.35) * 3;
                obj.mesh.rotation.y += Math.sin(st * 0.5) * 0.01;
            } else if (obj.config.float) {
                obj.mesh.position.y = obj.base.y + Math.sin(t * 0.5) * 0.4;
            } else if (obj.config.spin) {
                obj.mesh.rotation.y += delta * 0.02;
            }
        }
        
        // Stars
        if (this.stars) this.stars.rotation.y += delta * 0.003;
        
        // Particles
        if (this.particles) {
            const pos = this.particles.geometry.attributes.position.array;
            for (let i = 1; i < pos.length; i += 3) pos[i] += Math.sin(time + i) * 0.003;
            this.particles.geometry.attributes.position.needsUpdate = true;
            this.particles.rotation.y += delta * 0.01;
        }
        
        // Glow ring
        if (this.glowRing) this.glowRing.material.opacity = 0.35 + Math.sin(time * 2) * 0.15;
        
        // Sky planets rotate slowly
        if (this.skyPlanets) {
            this.skyPlanets.jupiter.rotation.y += delta * 0.008;
            this.skyPlanets.saturn.rotation.y += delta * 0.01;
            this.skyPlanets.saturnRing.rotation.z += delta * 0.005;
        }
        
        // Text faces player
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