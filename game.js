// ═══════════════════════════════════════════════════════════════════════════
// TAN'S HOME — Final Edition with Animal Cards & Natural Movement
// ═══════════════════════════════════════════════════════════════════════════

class TansHome {
    constructor() {
        // Three.js core
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();
        this.loader = new THREE.GLTFLoader();
        
        // Animation mixers for GLB animations
        this.mixers = [];
        
        // Game state
        this.state = {
            loaded: false,
            started: false,
            letterRead: false,
            fireworksShown: false,
            musicPlaying: false
        };
        
        // Player
        this.player = {
            position: new THREE.Vector3(0, 2, 8),
            velocity: new THREE.Vector3(),
            yaw: 0,
            pitch: 0,
            speed: 5,
            grounded: true
        };
        
        // Controls
        this.keys = {};
        this.mouseLocked = false;
        
        // 3D Models
        this.models = {};
        
        // Interactive objects (postbox + animals)
        this.interactables = [];
        this.currentTarget = null;
        
        // Floating objects for animation
        this.floatingObjects = [];
        
        // Audio
        this.audioElement = null;
        this.musicReady = false;
        
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
        this.renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            alpha: false
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        
        this.scene = new THREE.Scene();
        
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
    
    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            70,
            window.innerWidth / window.innerHeight,
            0.1,
            2000
        );
        this.camera.position.copy(this.player.position);
    }
    
    setupLights() {
        // Ambient light - brighter
        const ambient = new THREE.AmbientLight(0x6080a0, 0.7);
        this.scene.add(ambient);
        
        // Main directional light
        const moonLight = new THREE.DirectionalLight(0xaaccff, 1.0);
        moonLight.position.set(30, 50, 20);
        moonLight.castShadow = true;
        moonLight.shadow.mapSize.width = 2048;
        moonLight.shadow.mapSize.height = 2048;
        this.scene.add(moonLight);
        
        // Warm accent lights
        const warmLight = new THREE.PointLight(0xff8866, 2, 40);
        warmLight.position.set(0, 5, 0);
        this.scene.add(warmLight);
        
        const roseLight = new THREE.PointLight(0xff6b8b, 1, 30);
        roseLight.position.set(-5, 8, -5);
        this.scene.add(roseLight);
        
        // Blue fill light
        const fillLight = new THREE.PointLight(0x6688ff, 0.8, 60);
        fillLight.position.set(10, 15, 10);
        this.scene.add(fillLight);
    }
    
    createEnvironment() {
        this.createSpaceSkybox();
        this.createStars();
        this.createPlanets(); // Add visible planets!
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
                vec3 bottomColor = vec3(0.02, 0.01, 0.08);
                vec3 topColor = vec3(0.08, 0.04, 0.2);
                vec3 midColor = vec3(0.15, 0.05, 0.25);
                
                vec3 color;
                if (y < 0.0) {
                    color = mix(bottomColor, midColor, y + 1.0);
                } else {
                    color = mix(midColor, topColor, y);
                }
                
                gl_FragColor = vec4(color, 1.0);
            }
        `;
        
        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            side: THREE.BackSide
        });
        
        const skybox = new THREE.Mesh(geometry, material);
        this.scene.add(skybox);
    }
    
    createStars() {
        const starCount = 4000;
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);
        
        for (let i = 0; i < starCount; i++) {
            const i3 = i * 3;
            const radius = 300 + Math.random() * 400;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);
            
            const colorChoice = Math.random();
            if (colorChoice < 0.6) {
                colors[i3] = 1; colors[i3 + 1] = 1; colors[i3 + 2] = 1;
            } else if (colorChoice < 0.8) {
                colors[i3] = 1; colors[i3 + 1] = 0.9; colors[i3 + 2] = 0.7;
            } else {
                colors[i3] = 0.7; colors[i3 + 1] = 0.8; colors[i3 + 2] = 1;
            }
            
            sizes[i] = Math.random() * 2 + 0.5;
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
            size: 2,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            sizeAttenuation: true
        });
        
        const stars = new THREE.Points(geometry, material);
        this.scene.add(stars);
        this.stars = stars;
    }
    
    createPlanets() {
        // JUPITER - Big orange/brown planet
        const jupiterGeom = new THREE.SphereGeometry(25, 32, 32);
        const jupiterMat = new THREE.MeshStandardMaterial({
            color: 0xd4a574,
            roughness: 0.8,
            metalness: 0.1
        });
        const jupiter = new THREE.Mesh(jupiterGeom, jupiterMat);
        jupiter.position.set(-150, 80, -200);
        this.scene.add(jupiter);
        
        // Jupiter bands (stripes)
        const bandGeom = new THREE.TorusGeometry(25.5, 0.5, 8, 64);
        const bandMat = new THREE.MeshBasicMaterial({ color: 0xc4956a });
        for (let i = 0; i < 5; i++) {
            const band = new THREE.Mesh(bandGeom, bandMat);
            band.position.copy(jupiter.position);
            band.rotation.x = Math.PI / 2;
            band.position.y += (i - 2) * 6;
            band.scale.set(1, 1, 0.3);
            this.scene.add(band);
        }
        
        // SATURN - With rings!
        const saturnGeom = new THREE.SphereGeometry(18, 32, 32);
        const saturnMat = new THREE.MeshStandardMaterial({
            color: 0xead6b8,
            roughness: 0.7
        });
        const saturn = new THREE.Mesh(saturnGeom, saturnMat);
        saturn.position.set(180, 60, -180);
        this.scene.add(saturn);
        
        // Saturn rings
        const ringGeom = new THREE.RingGeometry(25, 40, 64);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xc9b896,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7
        });
        const saturnRing = new THREE.Mesh(ringGeom, ringMat);
        saturnRing.position.copy(saturn.position);
        saturnRing.rotation.x = Math.PI / 2.5;
        this.scene.add(saturnRing);
        this.saturnRing = saturnRing;
        
        // MOON - Closer, glowing
        const moonGeom = new THREE.SphereGeometry(8, 32, 32);
        const moonMat = new THREE.MeshStandardMaterial({
            color: 0xffffee,
            emissive: 0xffffaa,
            emissiveIntensity: 0.4
        });
        const moon = new THREE.Mesh(moonGeom, moonMat);
        moon.position.set(60, 50, -100);
        this.scene.add(moon);
        this.moon = moon;
        
        // Moon glow
        const moonGlowGeom = new THREE.SphereGeometry(12, 32, 32);
        const moonGlowMat = new THREE.MeshBasicMaterial({
            color: 0xffffcc,
            transparent: true,
            opacity: 0.15
        });
        const moonGlow = new THREE.Mesh(moonGlowGeom, moonGlowMat);
        moonGlow.position.copy(moon.position);
        this.scene.add(moonGlow);
        
        // MARS - Small red planet
        const marsGeom = new THREE.SphereGeometry(6, 32, 32);
        const marsMat = new THREE.MeshStandardMaterial({
            color: 0xc1440e,
            roughness: 0.9
        });
        const mars = new THREE.Mesh(marsGeom, marsMat);
        mars.position.set(-80, 100, -150);
        this.scene.add(mars);
        
        // Store for rotation
        this.planets = { jupiter, saturn, moon, mars, saturnRing };
    }
    
    createGround() {
        // Ethereal floating platform
        const geometry = new THREE.CylinderGeometry(25, 30, 2, 64);
        const material = new THREE.MeshStandardMaterial({
            color: 0x1a1030,
            roughness: 0.8,
            metalness: 0.2,
            transparent: true,
            opacity: 0.9
        });
        
        const ground = new THREE.Mesh(geometry, material);
        ground.position.y = -1;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Glowing edge ring
        const ringGeom = new THREE.TorusGeometry(27.5, 0.4, 16, 100);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xff6b8b,
            transparent: true,
            opacity: 0.6
        });
        const ring = new THREE.Mesh(ringGeom, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0;
        this.scene.add(ring);
        this.glowRing = ring;
    }
    
    createParticles() {
        const particleCount = 400;
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = (Math.random() - 0.5) * 80;
            positions[i3 + 1] = Math.random() * 40;
            positions[i3 + 2] = (Math.random() - 0.5) * 80;
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            size: 0.2,
            color: 0xff6b8b,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending
        });
        
        const particles = new THREE.Points(geometry, material);
        this.scene.add(particles);
        this.floatingParticles = particles;
    }
    
    async loadModels() {
        const loadBar = document.getElementById('load-bar');
        const loadStatus = document.getElementById('load-status');
        
        const modelPath = '';
        
        // Model configurations - Your actual files
        const modelConfigs = [
            { 
                file: 'mushroom_water_house.glb', 
                name: 'house',
                scale: 1.5, 
                position: [0, 0, -5],
                rotation: [0, 0, 0],
                noAnimation: true
            },
            { 
                file: 'red_post_box.glb', 
                name: 'postbox',
                scale: 1.2, 
                position: [5, 0, 3],
                rotation: [0, -0.3, 0],
                interactive: true,
                interactType: 'letter',
                noAnimation: true
            },
            { 
                file: 'phoenix_on_fire_update.glb', 
                name: 'phoenix',
                scale: 0.15,  // MUCH smaller!
                position: [0, 10, 0],
                rotation: [0, 0, 0],
                animate: true,
                orbit: true,
                orbitRadius: 15,
                orbitSpeed: 0.15,
                orbitHeight: 8,
                interactive: true,
                interactType: 'animal',
                animalInfo: {
                    name: '🔥 Phoenix',
                    description: 'A mystical firebird that symbolizes eternal love and rebirth. It flies around protecting this sanctuary.',
                    fact: 'Legend says if you see a phoenix, your wishes will come true!'
                }
            },
            { 
                file: 'jellyray.glb', 
                name: 'jellyray1',
                scale: 0.5, 
                position: [-6, 5, 3],
                rotation: [0, 0, 0],
                animate: true,
                swim: true,
                interactive: true,
                interactType: 'animal',
                animalInfo: {
                    name: '🎐 Cosmic Jellyray',
                    description: 'A graceful creature that glides through space, leaving trails of stardust.',
                    fact: 'Jellyrays are attracted to love and happiness!'
                }
            },
            { 
                file: 'jellyray (1).glb', 
                name: 'jellyray2',
                scale: 0.4, 
                position: [8, 6, -8],
                rotation: [0, Math.PI, 0],
                animate: true,
                swim: true,
                interactive: true,
                interactType: 'animal',
                animalInfo: {
                    name: '✨ Starlight Jellyray',
                    description: 'This rare species glows with the light of distant stars.',
                    fact: 'Each jellyray carries memories of the cosmos!'
                }
            },
            { 
                file: 'bladderfish.glb', 
                name: 'bladderfish',
                scale: 0.4, 
                position: [-8, 4, -3],
                rotation: [0, 0.5, 0],
                animate: true,
                swim: true,
                interactive: true,
                interactType: 'animal',
                animalInfo: {
                    name: '🐡 Space Bladderfish',
                    description: 'A curious fish that floats through the void, bringing joy wherever it goes.',
                    fact: 'Bladderfish love romantic places like this one!'
                }
            },
            {
                file: 'mythic_whale_-_stylized_animated_model.glb',
                name: 'mythicWhale',
                scale: 0.8,  // Smaller, closer
                position: [0, 12, -15],
                rotation: [0, 0, 0],
                animate: true,
                orbit: true,
                orbitRadius: 20,
                orbitSpeed: 0.08,
                orbitHeight: 12,
                interactive: true,
                interactType: 'animal',
                animalInfo: {
                    name: '🐋 Mythic Space Whale',
                    description: 'An ancient guardian of love that swims through the stars, singing songs of the heart.',
                    fact: 'This whale chose to protect Tan\'s Home because of the love here!'
                }
            },
            { 
                file: 'stylized_planet.glb', 
                name: 'planet',
                scale: 5, 
                position: [100, 30, -80],
                rotation: [0.2, 0, 0.1],
                spin: true
            },
            { 
                file: 'furled_papyrus.glb', 
                name: 'papyrus',
                scale: 0.3, 
                position: [5, 2.2, 3],
                rotation: [0, 0.5, 0],
                float: true,
                noAnimation: true
            }
        ];
        
        let loaded = 0;
        const total = modelConfigs.length;
        
        for (const config of modelConfigs) {
            loadStatus.textContent = `Loading ${config.name}...`;
            
            try {
                await this.loadModel(modelPath + config.file, config);
                console.log(`✓ Loaded: ${config.name}`);
            } catch (error) {
                console.log(`✗ Failed: ${config.name}`, error.message);
            }
            
            loaded++;
            loadBar.style.width = (loaded / total * 100) + '%';
            await this.sleep(100);
        }
        
        // Add more creatures
        this.addMoreCreatures();
        
        // Create "Tan's Home" text
        this.createHomeText();
        
        // Fallback postbox
        if (!this.models.postbox) {
            this.createProceduralPostbox();
        }
        
        this.state.loaded = true;
        this.finishLoading();
    }
    
    loadModel(path, config) {
        return new Promise((resolve, reject) => {
            this.loader.load(
                path,
                (gltf) => {
                    const model = gltf.scene;
                    
                    model.scale.setScalar(config.scale);
                    model.position.set(...config.position);
                    if (config.rotation) {
                        model.rotation.set(...config.rotation);
                    }
                    
                    model.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });
                    
                    this.scene.add(model);
                    this.models[config.name] = model;
                    
                    // Play animations unless disabled
                    if (gltf.animations && gltf.animations.length > 0 && !config.noAnimation) {
                        const mixer = new THREE.AnimationMixer(model);
                        gltf.animations.forEach((clip) => {
                            const action = mixer.clipAction(clip);
                            action.play();
                        });
                        this.mixers.push(mixer);
                    }
                    
                    // Add to floating/orbiting objects
                    if (config.float || config.orbit || config.spin || config.swim) {
                        this.floatingObjects.push({
                            mesh: model,
                            config: config,
                            basePosition: new THREE.Vector3(...config.position),
                            offset: Math.random() * Math.PI * 2,
                            swimOffset: Math.random() * Math.PI * 2
                        });
                    }
                    
                    // Make interactive
                    if (config.interactive) {
                        this.interactables.push({
                            object: model,
                            type: config.interactType,
                            name: config.interactType === 'letter' ? 'Love Letter 💌' : config.animalInfo?.name,
                            description: config.interactType === 'letter' ? 'Press E to read' : 'Press E to learn more',
                            animalInfo: config.animalInfo,
                            action: () => {
                                if (config.interactType === 'letter') {
                                    this.openLetter();
                                } else if (config.interactType === 'animal') {
                                    this.showAnimalCard(config.animalInfo);
                                }
                            }
                        });
                    }
                    
                    resolve(model);
                },
                undefined,
                (error) => reject(error)
            );
        });
    }
    
    addMoreCreatures() {
        // Clone jellyray
        if (this.models.jellyray1) {
            const positions = [
                [10, 7, 5], [-5, 8, 8], [3, 5, -5]
            ];
            positions.forEach((pos, i) => {
                const clone = this.models.jellyray1.clone();
                clone.position.set(...pos);
                clone.scale.setScalar(0.3 + Math.random() * 0.2);
                clone.rotation.y = Math.random() * Math.PI * 2;
                this.scene.add(clone);
                this.floatingObjects.push({
                    mesh: clone,
                    config: { swim: true },
                    basePosition: clone.position.clone(),
                    offset: Math.random() * Math.PI * 2,
                    swimOffset: Math.random() * Math.PI * 2
                });
            });
        }
        
        // Clone bladderfish
        if (this.models.bladderfish) {
            const positions = [
                [6, 3, 6], [-4, 5, 5], [0, 4, 8]
            ];
            positions.forEach((pos, i) => {
                const clone = this.models.bladderfish.clone();
                clone.position.set(...pos);
                clone.scale.setScalar(0.25 + Math.random() * 0.15);
                clone.rotation.y = Math.random() * Math.PI * 2;
                this.scene.add(clone);
                this.floatingObjects.push({
                    mesh: clone,
                    config: { swim: true },
                    basePosition: clone.position.clone(),
                    offset: Math.random() * Math.PI * 2,
                    swimOffset: Math.random() * Math.PI * 2
                });
            });
        }
    }
    
    createHomeText() {
        // Create bigger, more visible "Tan's Home" text
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Glow effect
        ctx.shadowColor = '#ff6b8b';
        ctx.shadowBlur = 30;
        
        // Main text
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#ff6b8b';
        ctx.lineWidth = 4;
        ctx.font = 'bold 100px "Cormorant Garamond", Georgia, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Draw text
        ctx.strokeText("Tan's Home", canvas.width / 2, canvas.height / 2 - 20);
        ctx.fillText("Tan's Home", canvas.width / 2, canvas.height / 2 - 20);
        
        // Subtitle with heart
        ctx.font = '40px serif';
        ctx.fillStyle = '#ff8ea8';
        ctx.shadowBlur = 15;
        ctx.fillText('💕 Made with love 💕', canvas.width / 2, canvas.height / 2 + 60);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        const geometry = new THREE.PlaneGeometry(8, 2);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        
        const textMesh = new THREE.Mesh(geometry, material);
        textMesh.position.set(0, 7, -4);
        this.scene.add(textMesh);
        this.homeText = textMesh;
        
        // Glow plane behind
        const glowGeom = new THREE.PlaneGeometry(9, 2.5);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0xff6b8b,
            transparent: true,
            opacity: 0.15,
            side: THREE.DoubleSide
        });
        const glow = new THREE.Mesh(glowGeom, glowMat);
        glow.position.copy(textMesh.position);
        glow.position.z -= 0.1;
        this.scene.add(glow);
        this.homeTextGlow = glow;
    }
    
    createProceduralPostbox() {
        const group = new THREE.Group();
        
        const bodyGeom = new THREE.BoxGeometry(0.8, 1.2, 0.6);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0xff3333,
            roughness: 0.3,
            metalness: 0.5
        });
        const body = new THREE.Mesh(bodyGeom, bodyMat);
        body.position.y = 1.2;
        group.add(body);
        
        group.position.set(5, 0, 3);
        this.scene.add(group);
        this.models.postbox = group;
        
        this.interactables.push({
            object: group,
            type: 'letter',
            name: 'Love Letter 💌',
            description: 'Press E to read',
            action: () => this.openLetter()
        });
    }
    
    setupControls() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (e.code === 'KeyE' && this.currentTarget && this.state.started) {
                this.currentTarget.action();
            }
            
            if (e.code === 'Escape' && this.state.started) {
                document.exitPointerLock();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        const canvas = document.getElementById('game-canvas');
        
        canvas.addEventListener('click', () => {
            if (this.state.started && !this.mouseLocked) {
                canvas.requestPointerLock();
            }
        });
        
        document.addEventListener('pointerlockchange', () => {
            this.mouseLocked = document.pointerLockElement === canvas;
        });
        
        document.addEventListener('mousemove', (e) => {
            if (this.mouseLocked && this.state.started) {
                this.player.yaw -= e.movementX * 0.002;
                this.player.pitch -= e.movementY * 0.002;
                this.player.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.player.pitch));
            }
        });
    }
    
    setupUI() {
        document.getElementById('btn-enter').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('close-letter').addEventListener('click', () => {
            this.closeLetter();
        });
        
        document.querySelector('#letter-modal .modal-backdrop').addEventListener('click', () => {
            this.closeLetter();
        });
        
        // Animal card close
        document.getElementById('close-animal-card')?.addEventListener('click', () => {
            this.closeAnimalCard();
        });
        
        document.querySelector('#animal-card-modal .modal-backdrop')?.addEventListener('click', () => {
            this.closeAnimalCard();
        });
    }
    
    setupAudio() {
        this.audioElement = new Audio();
        this.audioElement.loop = true;
        this.audioElement.volume = 0.5;
        
        // Try many possible file names
        const musicFiles = [
            'sounds/music.mp3',
            'sounds/background.mp3',
            'sounds/song.mp3',
            'sounds/audio.mp3',
            'sounds/track.mp3',
            'sounds/bgm.mp3',
            'sounds/love.mp3',
            'sounds/tanmai.mp3',
            'sounds/music.wav',
            'sounds/music.ogg',
            'sounds/music.m4a',
            'sound/music.mp3',
            'audio/music.mp3',
            'music.mp3'
        ];
        
        this.tryLoadMusic(musicFiles, 0);
        
        const playBtn = document.getElementById('music-play-btn');
        if (playBtn) {
            playBtn.addEventListener('click', () => this.toggleMusic());
        }
        
        const volumeSlider = document.getElementById('music-volume');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                if (this.audioElement) {
                    this.audioElement.volume = e.target.value / 100;
                }
            });
        }
    }
    
    tryLoadMusic(files, index) {
        if (index >= files.length) {
            console.log('No music file found');
            const musicName = document.getElementById('music-name');
            if (musicName) musicName.textContent = 'Add music to sounds/ folder';
            return;
        }
        
        const testAudio = new Audio();
        testAudio.src = files[index];
        
        testAudio.oncanplaythrough = () => {
            this.audioElement.src = files[index];
            const fileName = files[index].split('/').pop();
            const musicName = document.getElementById('music-name');
            if (musicName) musicName.textContent = '🎵 ' + fileName;
            console.log('✓ Music loaded:', fileName);
            this.musicReady = true;
        };
        
        testAudio.onerror = () => {
            this.tryLoadMusic(files, index + 1);
        };
    }
    
    playMusic() {
        if (this.audioElement && this.audioElement.src) {
            this.audioElement.play().catch(e => console.log('Music blocked:', e));
            this.state.musicPlaying = true;
            const playBtn = document.getElementById('music-play-btn');
            if (playBtn) playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        }
    }
    
    pauseMusic() {
        if (this.audioElement) {
            this.audioElement.pause();
            this.state.musicPlaying = false;
            const playBtn = document.getElementById('music-play-btn');
            if (playBtn) playBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    }
    
    toggleMusic() {
        if (this.state.musicPlaying) {
            this.pauseMusic();
        } else {
            this.playMusic();
        }
    }
    
    startGame() {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');
        document.getElementById('music-player').classList.remove('hidden');
        this.state.started = true;
        document.getElementById('game-canvas').requestPointerLock();
        
        if (this.musicReady) {
            this.playMusic();
        }
    }
    
    openLetter() {
        document.exitPointerLock();
        document.getElementById('letter-modal').classList.remove('hidden');
        document.getElementById('letter-date').textContent = new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
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
        if (this.state.started) {
            document.getElementById('game-canvas').requestPointerLock();
        }
    }
    
    showAnimalCard(info) {
        document.exitPointerLock();
        document.getElementById('animal-card-modal').classList.remove('hidden');
        document.getElementById('animal-name').textContent = info.name;
        document.getElementById('animal-description').textContent = info.description;
        document.getElementById('animal-fact').textContent = info.fact;
    }
    
    closeAnimalCard() {
        document.getElementById('animal-card-modal').classList.add('hidden');
        if (this.state.started) {
            document.getElementById('game-canvas').requestPointerLock();
        }
    }
    
    showFireworks() {
        if (this.state.fireworksShown) return;
        this.state.fireworksShown = true;
        
        const container = document.getElementById('fireworks-container');
        const colors = ['#ff6b8b', '#ffcc00', '#ff8e53', '#9966ff', '#ff88aa', '#88ff88'];
        
        const launchFirework = () => {
            const x = 20 + Math.random() * 60;
            const y = 20 + Math.random() * 40;
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            for (let i = 0; i < 20; i++) {
                const particle = document.createElement('div');
                particle.className = 'firework';
                particle.style.left = x + '%';
                particle.style.top = y + '%';
                particle.style.backgroundColor = color;
                particle.style.boxShadow = `0 0 10px ${color}`;
                particle.style.animationDelay = Math.random() * 0.1 + 's';
                container.appendChild(particle);
                setTimeout(() => particle.remove(), 1500);
            }
        };
        
        for (let i = 0; i < 15; i++) {
            setTimeout(launchFirework, i * 300);
        }
    }
    
    showValentineMessage() {
        const message = document.getElementById('valentine-message');
        message.classList.remove('hidden');
        setTimeout(() => {
            message.classList.add('hidden');
        }, 5000);
    }
    
    finishLoading() {
        setTimeout(() => {
            document.getElementById('loading-screen').classList.add('fade-out');
            document.getElementById('main-menu').classList.remove('hidden');
        }, 500);
    }
    
    updatePlayer(delta) {
        if (!this.state.started) return;
        
        const moveSpeed = this.player.speed * delta;
        const direction = new THREE.Vector3();
        
        const forward = new THREE.Vector3(
            -Math.sin(this.player.yaw),
            0,
            -Math.cos(this.player.yaw)
        );
        const right = new THREE.Vector3(
            Math.cos(this.player.yaw),
            0,
            -Math.sin(this.player.yaw)
        );
        
        if (this.keys['KeyW']) direction.add(forward);
        if (this.keys['KeyS']) direction.sub(forward);
        if (this.keys['KeyD']) direction.add(right);
        if (this.keys['KeyA']) direction.sub(right);
        
        if (direction.length() > 0) {
            direction.normalize();
            this.player.position.add(direction.multiplyScalar(moveSpeed));
        }
        
        // Keep on platform
        const dist = Math.sqrt(this.player.position.x ** 2 + this.player.position.z ** 2);
        if (dist > 22) {
            const angle = Math.atan2(this.player.position.z, this.player.position.x);
            this.player.position.x = Math.cos(angle) * 22;
            this.player.position.z = Math.sin(angle) * 22;
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
        
        let nearestTarget = null;
        let nearestDist = 8; // Larger range for animals
        
        for (const interactable of this.interactables) {
            const objPos = new THREE.Vector3();
            interactable.object.getWorldPosition(objPos);
            
            const dist = this.player.position.distanceTo(objPos);
            
            if (dist < nearestDist) {
                const toObj = objPos.clone().sub(this.player.position).normalize();
                const lookDir = new THREE.Vector3(0, 0, -1);
                lookDir.applyQuaternion(this.camera.quaternion);
                
                const dot = toObj.dot(lookDir);
                if (dot > 0.5) {
                    nearestDist = dist;
                    nearestTarget = interactable;
                }
            }
        }
        
        this.currentTarget = nearestTarget;
        
        if (nearestTarget) {
            prompt.classList.remove('hidden');
            text.textContent = nearestTarget.name + ' - ' + nearestTarget.description;
            crosshair.classList.add('active');
        } else {
            prompt.classList.add('hidden');
            crosshair.classList.remove('active');
        }
    }
    
    updateAnimations(delta, time) {
        // Update GLB animations
        for (const mixer of this.mixers) {
            mixer.update(delta);
        }
        
        // Floating/orbiting/swimming objects
        for (const obj of this.floatingObjects) {
            const t = time + obj.offset;
            const st = time + (obj.swimOffset || 0);
            
            if (obj.config.orbit) {
                const radius = obj.config.orbitRadius || 15;
                const speed = obj.config.orbitSpeed || 0.15;
                const height = obj.config.orbitHeight || 8;
                
                obj.mesh.position.x = Math.sin(t * speed) * radius;
                obj.mesh.position.z = Math.cos(t * speed) * radius - 5;
                obj.mesh.position.y = height + Math.sin(t * 0.5) * 2;
                obj.mesh.rotation.y = -t * speed + Math.PI / 2;
            } else if (obj.config.swim) {
                // Natural swimming motion
                const swimX = Math.sin(st * 0.4) * 2;
                const swimY = Math.sin(st * 0.6) * 0.8;
                const swimZ = Math.cos(st * 0.3) * 1.5;
                
                obj.mesh.position.x = obj.basePosition.x + swimX;
                obj.mesh.position.y = obj.basePosition.y + swimY;
                obj.mesh.position.z = obj.basePosition.z + swimZ;
                
                // Natural rotation - look where swimming
                obj.mesh.rotation.y += Math.sin(st * 0.5) * 0.01;
                obj.mesh.rotation.z = Math.sin(st * 0.8) * 0.1;
            } else if (obj.config.float) {
                obj.mesh.position.y = obj.basePosition.y + Math.sin(t * 0.5) * 0.3;
                obj.mesh.rotation.z = Math.sin(t * 0.3) * 0.05;
            } else if (obj.config.spin) {
                obj.mesh.rotation.y += delta * 0.05;
            }
        }
        
        // Stars rotate slowly
        if (this.stars) {
            this.stars.rotation.y += delta * 0.005;
        }
        
        // Particles float
        if (this.floatingParticles) {
            const positions = this.floatingParticles.geometry.attributes.position.array;
            for (let i = 1; i < positions.length; i += 3) {
                positions[i] += Math.sin(time + i) * 0.003;
            }
            this.floatingParticles.geometry.attributes.position.needsUpdate = true;
            this.floatingParticles.rotation.y += delta * 0.01;
        }
        
        // Platform glow pulse
        if (this.glowRing) {
            this.glowRing.material.opacity = 0.4 + Math.sin(time * 2) * 0.2;
        }
        
        // Planets rotate
        if (this.planets) {
            if (this.planets.saturn) this.planets.saturn.rotation.y += delta * 0.02;
            if (this.planets.saturnRing) this.planets.saturnRing.rotation.z += delta * 0.01;
            if (this.planets.jupiter) this.planets.jupiter.rotation.y += delta * 0.015;
        }
        
        // Text always faces player
        if (this.homeText) {
            this.homeText.lookAt(this.camera.position);
        }
        if (this.homeTextGlow) {
            this.homeTextGlow.lookAt(this.camera.position);
            this.homeTextGlow.material.opacity = 0.12 + Math.sin(time * 3) * 0.08;
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
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    window.game = new TansHome();
});