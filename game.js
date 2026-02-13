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
        
        // ALL YOUR MODELS with proper sizes and positions
        const models = [
            // === HOUSE (center, interactive) ===
            {
                file: 'mushroom_water_house.glb',
                name: 'house',
                scale: 1.8,
                position: [0, 0, -8],
                noAnimation: true,
                interactive: true,
                info: {
                    name: '🏠 Tan\'s Home',
                    description: 'This magical mushroom house was built just for you, Tanmai. It\'s a place where love lives forever.',
                    fact: 'Every room inside is filled with memories of us!'
                }
            },
            // === POSTBOX (front right, interactive) ===
            {
                file: 'red_post_box.glb',
                name: 'postbox',
                scale: 1.0,
                position: [6, 0, 0],
                rotation: [0, -0.5, 0],
                noAnimation: true,
                interactive: true,
                isLetter: true,
                info: { name: '💌 Love Letter', description: 'A special letter waiting for you...', fact: '' }
            },
            // === PHOENIX (behind house, small, wings open, stationary) ===
            {
                file: 'phoenix_on_fire_update.glb',
                name: 'phoenix',
                scale: 0.03,  // TINY!
                position: [0, 6, -15],  // Behind house
                rotation: [0, Math.PI, 0],  // Facing forward
                noAnimation: false,  // Let wings animate
                noMovement: true,  // Don't orbit, stay still
                interactive: true,
                info: {
                    name: '🔥 Guardian Phoenix',
                    description: 'This mystical firebird watches over our home. Its eternal flame represents our undying love.',
                    fact: 'Legend says it grants wishes to those with pure hearts!'
                }
            },
            // === CRYSTAL JELLYFISH (new! front left) ===
            {
                file: 'crystal_jellyfish_leptomedusae.glb',
                name: 'crystalJelly',
                scale: 0.8,
                position: [-5, 4, 3],
                animate: true,
                swim: true,
                interactive: true,
                info: {
                    name: '💎 Crystal Jellyfish',
                    description: 'A rare crystalline jellyfish that glows with inner light. It\'s attracted to places filled with love.',
                    fact: 'Its light changes color based on the emotions around it!'
                }
            },
            // === JELLYRAYS (floating around) ===
            {
                file: 'jellyray.glb',
                name: 'jellyray1',
                scale: 0.4,
                position: [7, 5, -3],
                animate: true,
                swim: true,
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
                scale: 0.35,
                position: [-8, 6, -5],
                animate: true,
                swim: true,
                interactive: true,
                info: {
                    name: '✨ Starlight Jellyray',
                    description: 'This species carries the glow of distant galaxies within its body.',
                    fact: 'Each one holds memories of the cosmos!'
                }
            },
            // === BLADDERFISH ===
            {
                file: 'bladderfish.glb',
                name: 'bladderfish',
                scale: 0.35,
                position: [4, 3, 5],
                animate: true,
                swim: true,
                interactive: true,
                info: {
                    name: '🐡 Space Bladderfish',
                    description: 'A friendly fish that brings joy wherever it floats.',
                    fact: 'It chose to live here because of all the love!'
                }
            },
            // === SALSA DANCER (new! dancing figure) ===
            {
                file: 'salsa_dance_basic_steps_-_lowpoly_style.glb',
                name: 'dancer',
                scale: 0.8,
                position: [-6, 0, 2],
                rotation: [0, 0.5, 0],
                animate: true,
                noMovement: true,
                interactive: true,
                info: {
                    name: '💃 Dancing Spirit',
                    description: 'A joyful spirit that dances eternally to celebrate love. It appeared when this home was created.',
                    fact: 'It dances to the rhythm of your heartbeat!'
                }
            },
            // === PURPLE PLANET (new! in sky) ===
            {
                file: 'purple_planet.glb',
                name: 'purplePlanet',
                scale: 3,
                position: [-60, 40, -80],
                spin: true,
                interactive: true,
                info: {
                    name: '💜 Amethyst Planet',
                    description: 'A beautiful purple world where dreams come true.',
                    fact: 'Some say lovers who wish upon it will be together forever!'
                }
            },
            // === STYLIZED PLANET ===
            {
                file: 'stylized_planet.glb',
                name: 'stylizedPlanet',
                scale: 4,
                position: [70, 35, -90],
                spin: true,
                interactive: true,
                info: {
                    name: '🌍 Dream World',
                    description: 'A colorful planet painted by the universe itself.',
                    fact: 'Every color represents a beautiful emotion!'
                }
            },
            // === PAPYRUS (floating near postbox) ===
            {
                file: 'furled_papyrus.glb',
                name: 'papyrus',
                scale: 0.25,
                position: [6, 2, 0],
                float: true,
                noAnimation: true
            },
            // === DEEP SPACE SKYBOX (background) ===
            {
                file: 'deep_space_skybox_16k_with_planets.glb',
                name: 'spaceSkybox',
                scale: 100,
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
                    
                    // Movement
                    if ((config.swim || config.float || config.spin) && !config.noMovement) {
                        this.floatingObjects.push({
                            mesh: model,
                            config,
                            base: new THREE.Vector3(...config.position),
                            offset: Math.random() * Math.PI * 2,
                            swimOffset: Math.random() * Math.PI * 2
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
        // Clone jellyrays
        if (this.models.jellyray1) {
            [[3, 7, 6], [-4, 5, 8], [8, 4, -6]].forEach(pos => {
                const clone = this.models.jellyray1.clone();
                clone.position.set(...pos);
                clone.scale.setScalar(0.25 + Math.random() * 0.15);
                clone.rotation.y = Math.random() * Math.PI * 2;
                this.scene.add(clone);
                this.floatingObjects.push({
                    mesh: clone,
                    config: { swim: true },
                    base: clone.position.clone(),
                    offset: Math.random() * Math.PI * 2,
                    swimOffset: Math.random() * Math.PI * 2
                });
            });
        }
        
        // Clone crystal jelly
        if (this.models.crystalJelly) {
            [[6, 6, -4], [-3, 7, -2]].forEach(pos => {
                const clone = this.models.crystalJelly.clone();
                clone.position.set(...pos);
                clone.scale.setScalar(0.5 + Math.random() * 0.3);
                this.scene.add(clone);
                this.floatingObjects.push({
                    mesh: clone,
                    config: { swim: true },
                    base: clone.position.clone(),
                    offset: Math.random() * Math.PI * 2,
                    swimOffset: Math.random() * Math.PI * 2
                });
            });
        }
        
        // Clone bladderfish
        if (this.models.bladderfish) {
            [[-5, 4, 6], [2, 5, 3]].forEach(pos => {
                const clone = this.models.bladderfish.clone();
                clone.position.set(...pos);
                clone.scale.setScalar(0.2 + Math.random() * 0.15);
                this.scene.add(clone);
                this.floatingObjects.push({
                    mesh: clone,
                    config: { swim: true },
                    base: clone.position.clone(),
                    offset: Math.random() * Math.PI * 2,
                    swimOffset: Math.random() * Math.PI * 2
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
        // Jupiter
        const jupiter = new THREE.Mesh(
            new THREE.SphereGeometry(20, 32, 32),
            new THREE.MeshStandardMaterial({ color: 0xd4a574, roughness: 0.8 })
        );
        jupiter.position.set(-120, 60, -180);
        this.scene.add(jupiter);
        
        // Saturn with rings
        const saturn = new THREE.Mesh(
            new THREE.SphereGeometry(15, 32, 32),
            new THREE.MeshStandardMaterial({ color: 0xead6b8, roughness: 0.7 })
        );
        saturn.position.set(140, 50, -160);
        this.scene.add(saturn);
        
        const saturnRing = new THREE.Mesh(
            new THREE.RingGeometry(22, 35, 64),
            new THREE.MeshBasicMaterial({ color: 0xc9b896, side: THREE.DoubleSide, transparent: true, opacity: 0.6 })
        );
        saturnRing.position.copy(saturn.position);
        saturnRing.rotation.x = Math.PI / 2.5;
        this.scene.add(saturnRing);
        
        // Moon (closer)
        const moon = new THREE.Mesh(
            new THREE.SphereGeometry(6, 32, 32),
            new THREE.MeshStandardMaterial({ color: 0xffffee, emissive: 0xffffaa, emissiveIntensity: 0.5 })
        );
        moon.position.set(50, 40, -80);
        this.scene.add(moon);
        
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
        
        // Floating objects
        for (const obj of this.floatingObjects) {
            const t = time + obj.offset;
            const st = time + obj.swimOffset;
            
            if (obj.config.swim) {
                obj.mesh.position.x = obj.base.x + Math.sin(st * 0.4) * 1.5;
                obj.mesh.position.y = obj.base.y + Math.sin(st * 0.6) * 0.6;
                obj.mesh.position.z = obj.base.z + Math.cos(st * 0.35) * 1.2;
                obj.mesh.rotation.y += Math.sin(st * 0.5) * 0.008;
                obj.mesh.rotation.z = Math.sin(st * 0.7) * 0.08;
            } else if (obj.config.float) {
                obj.mesh.position.y = obj.base.y + Math.sin(t * 0.5) * 0.25;
            } else if (obj.config.spin) {
                obj.mesh.rotation.y += delta * 0.03;
            }
        }
        
        // Stars
        if (this.stars) this.stars.rotation.y += delta * 0.003;
        
        // Particles
        if (this.particles) {
            const pos = this.particles.geometry.attributes.position.array;
            for (let i = 1; i < pos.length; i += 3) pos[i] += Math.sin(time + i) * 0.002;
            this.particles.geometry.attributes.position.needsUpdate = true;
            this.particles.rotation.y += delta * 0.008;
        }
        
        // Glow ring
        if (this.glowRing) this.glowRing.material.opacity = 0.35 + Math.sin(time * 2) * 0.15;
        
        // Sky planets rotate slowly
        if (this.skyPlanets) {
            this.skyPlanets.jupiter.rotation.y += delta * 0.01;
            this.skyPlanets.saturn.rotation.y += delta * 0.015;
            this.skyPlanets.saturnRing.rotation.z += delta * 0.008;
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