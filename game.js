// ═══════════════════════════════════════════════════════════════════════════
// TAN'S SANCTUARY — Complete Edition with Animations & Music
// ═══════════════════════════════════════════════════════════════════════════

class TansSanctuary {
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
        
        // Interactive objects
        this.interactables = [];
        this.currentTarget = null;
        
        // Animations
        this.floatingObjects = [];
        this.particles = [];
        
        // Audio
        this.audioContext = null;
        this.audioSource = null;
        this.audioBuffer = null;
        this.gainNode = null;
        
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
        this.renderer.toneMappingExposure = 1.0;
        
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
        // Ambient light
        const ambient = new THREE.AmbientLight(0x404080, 0.5);
        this.scene.add(ambient);
        
        // Main directional light (moonlight)
        const moonLight = new THREE.DirectionalLight(0xaaccff, 0.8);
        moonLight.position.set(30, 50, 20);
        moonLight.castShadow = true;
        moonLight.shadow.mapSize.width = 2048;
        moonLight.shadow.mapSize.height = 2048;
        moonLight.shadow.camera.near = 0.5;
        moonLight.shadow.camera.far = 200;
        moonLight.shadow.camera.left = -50;
        moonLight.shadow.camera.right = 50;
        moonLight.shadow.camera.top = 50;
        moonLight.shadow.camera.bottom = -50;
        this.scene.add(moonLight);
        
        // Warm accent lights
        const warmLight = new THREE.PointLight(0xff8866, 1.5, 30);
        warmLight.position.set(0, 3, 0);
        this.scene.add(warmLight);
        
        const roseLight = new THREE.PointLight(0xff6b8b, 0.8, 25);
        roseLight.position.set(-5, 5, -5);
        this.scene.add(roseLight);
        
        // Add more lights for better model visibility
        const fillLight = new THREE.PointLight(0x6688ff, 0.5, 50);
        fillLight.position.set(10, 10, 10);
        this.scene.add(fillLight);
    }
    
    createEnvironment() {
        this.createSpaceSkybox();
        this.createStars();
        this.createGround();
        this.createParticles();
    }
    
    createSpaceSkybox() {
        const geometry = new THREE.SphereGeometry(500, 64, 64);
        
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
                vec3 bottomColor = vec3(0.02, 0.01, 0.05);
                vec3 topColor = vec3(0.05, 0.02, 0.15);
                vec3 midColor = vec3(0.1, 0.03, 0.2);
                
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
        const starCount = 3000;
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        
        for (let i = 0; i < starCount; i++) {
            const i3 = i * 3;
            const radius = 200 + Math.random() * 300;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);
            
            const colorChoice = Math.random();
            if (colorChoice < 0.7) {
                colors[i3] = 1; colors[i3 + 1] = 1; colors[i3 + 2] = 1;
            } else if (colorChoice < 0.85) {
                colors[i3] = 1; colors[i3 + 1] = 0.9; colors[i3 + 2] = 0.7;
            } else {
                colors[i3] = 0.7; colors[i3 + 1] = 0.8; colors[i3 + 2] = 1;
            }
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
            size: 1.5,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            sizeAttenuation: true
        });
        
        const stars = new THREE.Points(geometry, material);
        this.scene.add(stars);
        this.stars = stars;
    }
    
    createGround() {
        // Ethereal floating platform
        const geometry = new THREE.CylinderGeometry(20, 25, 2, 64);
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
        const ringGeom = new THREE.TorusGeometry(22.5, 0.3, 16, 100);
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
        const particleCount = 300;
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = (Math.random() - 0.5) * 60;
            positions[i3 + 1] = Math.random() * 30;
            positions[i3 + 2] = (Math.random() - 0.5) * 60;
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            size: 0.15,
            color: 0xff6b8b,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        
        const particles = new THREE.Points(geometry, material);
        this.scene.add(particles);
        this.floatingParticles = particles;
    }
    
    async loadModels() {
        const loadBar = document.getElementById('load-bar');
        const loadStatus = document.getElementById('load-status');
        
        const modelPath = ''; // Models are in root directory
        
        // Model configurations - ALL your models
        const modelConfigs = [
            { 
                file: 'mushroom_water_house.glb', 
                name: 'house',
                scale: 1.2, 
                position: [0, 0, -5],
                rotation: [0, 0, 0]
            },
            { 
                file: 'red_post_box.glb', 
                name: 'postbox',
                scale: 1.5, 
                position: [6, 0, 2],
                rotation: [0, -0.5, 0],
                interactive: true
            },
            { 
                file: 'phoenix_on_fire_update.glb', 
                name: 'phoenix',
                scale: 1.0, 
                position: [15, 15, -25],
                rotation: [0, 0, 0],
                animate: true,
                orbit: true
            },
            { 
                file: 'jellyray.glb', 
                name: 'jellyray1',
                scale: 0.8, 
                position: [-8, 8, -10],
                rotation: [0, 0, 0],
                animate: true,
                float: true
            },
            { 
                file: 'jellyray (1).glb', 
                name: 'jellyray2',
                scale: 0.6, 
                position: [10, 12, -15],
                rotation: [0, Math.PI, 0],
                animate: true,
                float: true
            },
            { 
                file: 'bladderfish.glb', 
                name: 'bladderfish1',
                scale: 0.5, 
                position: [-12, 6, 5],
                rotation: [0, 0.5, 0],
                animate: true,
                float: true
            },
            { 
                file: 'stylized_planet.glb', 
                name: 'planet',
                scale: 8, 
                position: [-80, 40, -120],
                rotation: [0.2, 0, 0.1],
                spin: true
            },
            { 
                file: 'deep_space_skybox_16k_with_planets.glb', 
                name: 'skybox',
                scale: 150, 
                position: [0, 0, 0],
                rotation: [0, 0, 0]
            },
            { 
                file: 'furled_papyrus.glb', 
                name: 'papyrus',
                scale: 0.4, 
                position: [6, 2.5, 2],
                rotation: [0, 0.5, 0],
                float: true
            }
        ];
        
        let loaded = 0;
        const total = modelConfigs.length;
        
        // Load each model
        for (const config of modelConfigs) {
            loadStatus.textContent = `Loading ${config.name}...`;
            
            try {
                await this.loadModel(modelPath + config.file, config);
                console.log(`✓ Loaded: ${config.name}`);
            } catch (error) {
                console.log(`✗ Failed to load: ${config.name}`, error.message);
            }
            
            loaded++;
            loadBar.style.width = (loaded / total * 100) + '%';
            await this.sleep(100);
        }
        
        // Add more creatures by cloning
        this.addMoreCreatures();
        
        // Create "Tanmai" text on house
        this.createTanmaiText();
        
        // Create procedural postbox as fallback
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
                    
                    // Apply transforms
                    model.scale.setScalar(config.scale);
                    model.position.set(...config.position);
                    if (config.rotation) {
                        model.rotation.set(...config.rotation);
                    }
                    
                    // Enable shadows
                    model.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });
                    
                    this.scene.add(model);
                    this.models[config.name] = model;
                    
                    // Setup animations if the model has them
                    if (gltf.animations && gltf.animations.length > 0) {
                        const mixer = new THREE.AnimationMixer(model);
                        gltf.animations.forEach((clip) => {
                            const action = mixer.clipAction(clip);
                            action.play();
                        });
                        this.mixers.push(mixer);
                        console.log(`  → Playing ${gltf.animations.length} animations for ${config.name}`);
                    }
                    
                    // Add to floating objects for movement
                    if (config.float || config.orbit || config.spin) {
                        this.floatingObjects.push({
                            mesh: model,
                            config: config,
                            basePosition: new THREE.Vector3(...config.position),
                            offset: Math.random() * Math.PI * 2
                        });
                    }
                    
                    // Make interactive
                    if (config.interactive) {
                        this.interactables.push({
                            object: model,
                            name: 'Love Letter 💌',
                            description: 'Press E to read your letter',
                            action: () => this.openLetter()
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
        // Clone jellyray to add more
        if (this.models.jellyray1) {
            for (let i = 0; i < 3; i++) {
                const clone = this.models.jellyray1.clone();
                clone.position.set(
                    (Math.random() - 0.5) * 40,
                    8 + Math.random() * 12,
                    (Math.random() - 0.5) * 40
                );
                clone.scale.setScalar(0.4 + Math.random() * 0.4);
                this.scene.add(clone);
                this.floatingObjects.push({
                    mesh: clone,
                    config: { float: true },
                    basePosition: clone.position.clone(),
                    offset: Math.random() * Math.PI * 2
                });
            }
        }
        
        // Clone bladderfish
        if (this.models.bladderfish1) {
            for (let i = 0; i < 4; i++) {
                const clone = this.models.bladderfish1.clone();
                clone.position.set(
                    (Math.random() - 0.5) * 35,
                    4 + Math.random() * 10,
                    (Math.random() - 0.5) * 35
                );
                clone.scale.setScalar(0.3 + Math.random() * 0.3);
                clone.rotation.y = Math.random() * Math.PI * 2;
                this.scene.add(clone);
                this.floatingObjects.push({
                    mesh: clone,
                    config: { float: true },
                    basePosition: clone.position.clone(),
                    offset: Math.random() * Math.PI * 2
                });
            }
        }
    }
    
    createTanmaiText() {
        // Create 3D text "Tanmai" using canvas texture
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        // Background (transparent)
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Text styling
        ctx.fillStyle = '#ff6b8b';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.font = 'bold 72px "Cormorant Garamond", Georgia, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Draw text with glow
        ctx.shadowColor = '#ff6b8b';
        ctx.shadowBlur = 20;
        ctx.strokeText('Tanmai', canvas.width / 2, canvas.height / 2);
        ctx.fillText('Tanmai', canvas.width / 2, canvas.height / 2);
        
        // Add heart
        ctx.font = '48px serif';
        ctx.fillText('💕', canvas.width / 2, canvas.height / 2 + 50);
        
        // Create texture
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        // Create plane with text
        const geometry = new THREE.PlaneGeometry(4, 1);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
        });
        
        const textMesh = new THREE.Mesh(geometry, material);
        textMesh.position.set(0, 5.5, -3); // Above the house
        this.scene.add(textMesh);
        this.tanmaiText = textMesh;
        
        // Add glow behind text
        const glowGeom = new THREE.PlaneGeometry(4.5, 1.5);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0xff6b8b,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });
        const glow = new THREE.Mesh(glowGeom, glowMat);
        glow.position.copy(textMesh.position);
        glow.position.z -= 0.1;
        this.scene.add(glow);
        this.tanmaiGlow = glow;
    }
    
    createProceduralPostbox() {
        const group = new THREE.Group();
        
        // Main body
        const bodyGeom = new THREE.BoxGeometry(0.8, 1.2, 0.6);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0xff3333,
            roughness: 0.3,
            metalness: 0.5
        });
        const body = new THREE.Mesh(bodyGeom, bodyMat);
        body.position.y = 1.2;
        body.castShadow = true;
        group.add(body);
        
        // Top
        const topGeom = new THREE.CylinderGeometry(0.4, 0.4, 0.6, 32, 1, false, 0, Math.PI);
        const top = new THREE.Mesh(topGeom, bodyMat);
        top.rotation.x = Math.PI / 2;
        top.rotation.z = Math.PI / 2;
        top.position.set(0, 1.8, 0);
        group.add(top);
        
        // Post
        const postGeom = new THREE.CylinderGeometry(0.1, 0.1, 0.6, 16);
        const postMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const post = new THREE.Mesh(postGeom, postMat);
        post.position.y = 0.3;
        group.add(post);
        
        group.position.set(6, 0, 2);
        this.scene.add(group);
        this.models.postbox = group;
        
        // Add to interactables
        this.interactables.push({
            object: group,
            name: 'Love Letter 💌',
            description: 'Press E to read your letter',
            action: () => this.openLetter()
        });
    }
    
    setupControls() {
        // Keyboard
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
        
        // Mouse
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
        // Enter button
        document.getElementById('btn-enter').addEventListener('click', () => {
            this.startGame();
        });
        
        // Close letter
        document.getElementById('close-letter').addEventListener('click', () => {
            this.closeLetter();
        });
        
        document.querySelector('#letter-modal .modal-backdrop').addEventListener('click', () => {
            this.closeLetter();
        });
    }
    
    setupAudio() {
        // Auto-load music from sounds folder
        this.audioContext = null;
        this.audioElement = null;
        
        // Try to load music file from sounds folder
        // Supports: music.mp3, background.mp3, song.mp3, or any .mp3/.wav file
        const musicFiles = [
            'sounds/music.mp3',
            'sounds/background.mp3',
            'sounds/song.mp3',
            'sounds/audio.mp3',
            'sounds/track.mp3',
            'sounds/music.wav',
            'sounds/background.wav'
        ];
        
        // Create audio element
        this.audioElement = new Audio();
        this.audioElement.loop = true;
        this.audioElement.volume = 0.5;
        
        // Try each file until one works
        this.tryLoadMusic(musicFiles, 0);
        
        // Play/Pause button
        const playBtn = document.getElementById('music-play-btn');
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                this.toggleMusic();
            });
        }
        
        // Volume control
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
            console.log('No music file found in sounds folder');
            const musicName = document.getElementById('music-name');
            if (musicName) musicName.textContent = 'Add music to sounds/ folder';
            return;
        }
        
        const testAudio = new Audio();
        testAudio.src = files[index];
        
        testAudio.oncanplaythrough = () => {
            // Found a working file!
            this.audioElement.src = files[index];
            const fileName = files[index].split('/').pop();
            const musicName = document.getElementById('music-name');
            if (musicName) musicName.textContent = fileName;
            console.log('✓ Loaded music:', fileName);
            
            // Auto-play when game starts
            this.musicReady = true;
        };
        
        testAudio.onerror = () => {
            // Try next file
            this.tryLoadMusic(files, index + 1);
        };
    }
    
    playMusic() {
        if (this.audioElement && this.audioElement.src) {
            this.audioElement.play().catch(e => console.log('Music play blocked:', e));
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
        
        // Auto-play music if loaded
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
        
        // Keep player on platform
        const distFromCenter = Math.sqrt(
            this.player.position.x ** 2 + this.player.position.z ** 2
        );
        if (distFromCenter > 18) {
            const angle = Math.atan2(this.player.position.z, this.player.position.x);
            this.player.position.x = Math.cos(angle) * 18;
            this.player.position.z = Math.sin(angle) * 18;
        }
        
        // Update camera
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
        let nearestDist = 6;
        
        for (const interactable of this.interactables) {
            const objPos = new THREE.Vector3();
            interactable.object.getWorldPosition(objPos);
            
            const dist = this.player.position.distanceTo(objPos);
            
            if (dist < nearestDist) {
                const toObj = objPos.clone().sub(this.player.position).normalize();
                const lookDir = new THREE.Vector3(0, 0, -1);
                lookDir.applyQuaternion(this.camera.quaternion);
                
                const dot = toObj.dot(lookDir);
                if (dot > 0.6) {
                    nearestDist = dist;
                    nearestTarget = interactable;
                }
            }
        }
        
        this.currentTarget = nearestTarget;
        
        if (nearestTarget) {
            prompt.classList.remove('hidden');
            text.textContent = nearestTarget.description;
            crosshair.classList.add('active');
        } else {
            prompt.classList.add('hidden');
            crosshair.classList.remove('active');
        }
    }
    
    updateAnimations(delta, time) {
        // Update all animation mixers (plays GLB animations)
        for (const mixer of this.mixers) {
            mixer.update(delta);
        }
        
        // Floating/orbiting objects
        for (const obj of this.floatingObjects) {
            const t = time + obj.offset;
            
            if (obj.config.orbit) {
                // Phoenix orbits around
                const radius = 25;
                obj.mesh.position.x = Math.sin(t * 0.2) * radius;
                obj.mesh.position.z = Math.cos(t * 0.2) * radius - 10;
                obj.mesh.position.y = 12 + Math.sin(t * 0.5) * 3;
                obj.mesh.rotation.y = -t * 0.2 + Math.PI / 2;
            } else if (obj.config.float) {
                // Gentle floating
                obj.mesh.position.y = obj.basePosition.y + Math.sin(t * 0.5) * 0.5;
                obj.mesh.position.x = obj.basePosition.x + Math.sin(t * 0.3) * 0.3;
                obj.mesh.rotation.y += delta * 0.2;
            } else if (obj.config.spin) {
                // Planet slow rotation
                obj.mesh.rotation.y += delta * 0.05;
            }
        }
        
        // Stars twinkle
        if (this.stars) {
            this.stars.rotation.y += delta * 0.01;
        }
        
        // Floating particles
        if (this.floatingParticles) {
            const positions = this.floatingParticles.geometry.attributes.position.array;
            for (let i = 1; i < positions.length; i += 3) {
                positions[i] += Math.sin(time + i) * 0.002;
            }
            this.floatingParticles.geometry.attributes.position.needsUpdate = true;
            this.floatingParticles.rotation.y += delta * 0.02;
        }
        
        // Glow ring pulse
        if (this.glowRing) {
            this.glowRing.material.opacity = 0.4 + Math.sin(time * 2) * 0.2;
        }
        
        // Tanmai text glow
        if (this.tanmaiText) {
            this.tanmaiText.lookAt(this.camera.position);
        }
        if (this.tanmaiGlow) {
            this.tanmaiGlow.lookAt(this.camera.position);
            this.tanmaiGlow.material.opacity = 0.15 + Math.sin(time * 3) * 0.1;
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
    window.game = new TansSanctuary();
});