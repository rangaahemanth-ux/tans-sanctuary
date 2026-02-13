// ═══════════════════════════════════════════════════════════════════════════
// TAN'S HOME — All Your Models Edition
// Phoenix flies FREE and HIGH! Whale swims! Music WORKS!
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
    
    async loadModels() {
        const loadBar = document.getElementById('load-bar');
        const loadStatus = document.getElementById('load-status');
        
        // ═══════════════════════════════════════════════════════════════
        // ALL YOUR ACTUAL GLB FILES!
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
                info: { name: '🏠 Tan\'s Home', description: 'This magical house was built just for you, Tanmai.', fact: 'Every room is filled with memories of us!' }
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
                info: { name: '💌 Love Letter', description: 'A special letter...', fact: '' }
            },
            // ═══════════════════════════════════════════════════════════════
            // PHOENIX - FLIES FREE AND HIGH!!!
            // ═══════════════════════════════════════════════════════════════
            {
                file: 'phoenix_on_fire_update.glb',
                name: 'phoenix',
                scale: 0.08,
                position: [20, 90, 10],  // START VERY HIGH!
                animate: true,
                phoenixFly: true,  // Special free flying!
                addGlow: true,
                interactive: true,
                info: { name: '🔥 Guardian Phoenix', description: 'This firebird soars freely across the sky!', fact: 'It grants wishes to those with pure hearts!' }
            },
            // ═══════════════════════════════════════════════════════════════
            // MYTHIC WHALE - Swims gracefully
            // ═══════════════════════════════════════════════════════════════
            {
                file: 'mythic_whale_-_stylized_animated_model.glb',
                name: 'whale',
                scale: 40.0,
                position: [-30, 18, 15],
                animate: true,
                whaleSwim: true,
                interactive: true,
                info: { name: '🐋 Cosmic Whale', description: 'A majestic space whale swimming through stars.', fact: 'It carries songs of the universe!' }
            },
            // ═══════════════════════════════════════════════════════════════
            // JELLYRAY 1 - Big and floating!
            // ═══════════════════════════════════════════════════════════════
            {
                file: 'jellyray.glb',
                name: 'jellyray1',
                scale: 3.5,
                position: [15, 12, 10],
                animate: true,
                jellyFloat: true,
                interactive: true,
                info: { name: '🎐 Cosmic Jellyray', description: 'Graceful creatures leaving stardust trails.', fact: 'They are drawn to happiness!' }
            },
            // JELLYRAY 2
            {
                file: 'jellyray (1).glb',
                name: 'jellyray2',
                scale: 3.3,
                position: [-18, 15, -10],
                animate: true,
                jellyFloat: true,
                interactive: true,
                info: { name: '✨ Starlight Jellyray', description: 'Carries the glow of distant galaxies.', fact: 'Holds memories of the cosmos!' }
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
                info: { name: '🐡 Space Bladderfish', description: 'A friendly fish bringing joy.', fact: 'Lives here because of all the love!' }
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
                info: { name: '💃 Dancing Spirit', description: 'Dances eternally to celebrate love.', fact: 'Dances to your heartbeat!' }
            },
            // STYLIZED PLANET
            {
                file: 'stylized_planet.glb',
                name: 'stylizedPlanet',
                scale: 60,
                position: [120, 60, -140],
                spin: true,
                interactive: true,
                info: { name: '🌍 Dream World', description: 'A colorful planet painted by the universe.', fact: 'Every color is an emotion!' }
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
                
                // Movement
                if (!config.noMovement && (config.phoenixFly || config.whaleSwim || config.jellyFloat || config.fishSwim || config.float || config.spin)) {
                    this.floatingObjects.push({
                        mesh: model,
                        config,
                        base: new THREE.Vector3(...config.position),
                        time: Math.random() * 100,
                        angle: Math.random() * Math.PI * 2,
                        targetAngle: Math.random() * Math.PI * 2,
                        height: config.position[1],
                        targetHeight: config.position[1] + Math.random() * 20
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
        // More jellyfish
        if (this.models.jellyray1) {
            [[20, 20, -15], [-25, 16, 20], [5, 25, 25]].forEach(pos => {
                const clone = this.models.jellyray1.clone();
                clone.position.set(...pos);
                clone.scale.setScalar(1.0 + Math.random() * 0.8);
                this.scene.add(clone);
                this.floatingObjects.push({
                    mesh: clone, config: { jellyFloat: true },
                    base: clone.position.clone(), time: Math.random() * 100,
                    angle: Math.random() * Math.PI * 2
                });
            });
        }
        
        // More bladderfish
        if (this.models.bladderfish) {
            [[-15, 10, 15], [20, 7, 10]].forEach(pos => {
                const clone = this.models.bladderfish.clone();
                clone.position.set(...pos);
                clone.scale.setScalar(0.7 + Math.random() * 0.4);
                this.scene.add(clone);
                this.floatingObjects.push({
                    mesh: clone, config: { fishSwim: true },
                    base: clone.position.clone(), time: Math.random() * 100,
                    angle: Math.random() * Math.PI * 2
                });
            });
        }
        
        // Another whale
        if (this.models.whale) {
            const clone = this.models.whale.clone();
            clone.position.set(35, 22, -20);
            clone.scale.setScalar(1.5);
            this.scene.add(clone);
            this.floatingObjects.push({
                mesh: clone, config: { whaleSwim: true },
                base: clone.position.clone(), time: Math.random() * 100,
                angle: Math.random() * Math.PI * 2 + Math.PI
            });
        }
    }
    
    createHomeText() {
        const canvas = document.createElement('canvas');
        canvas.width = 1024; canvas.height = 256;
        const ctx = canvas.getContext('2d');
        ctx.shadowColor = '#ff6b8b'; ctx.shadowBlur = 40;
        ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#ff6b8b'; ctx.lineWidth = 6;
        ctx.font = 'bold 120px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.strokeText("Tan's Home", 512, 100); ctx.fillText("Tan's Home", 512, 100);
        ctx.font = '36px serif'; ctx.fillStyle = '#ffaacc'; ctx.shadowBlur = 20;
        ctx.fillText('💕 Made with love 💕', 512, 180);
        
        const texture = new THREE.CanvasTexture(canvas);
        const text = new THREE.Mesh(
            new THREE.PlaneGeometry(10, 2.5),
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
            { obj: jupiter, info: { name: '🪐 Jupiter', description: 'King of planets.', fact: 'Storm of love!' }},
            { obj: saturn, info: { name: '🪐 Saturn', description: 'Ringed wonder.', fact: 'Each ring is a memory!' }},
            { obj: moon, info: { name: '🌙 Moon', description: 'Lights up the night.', fact: 'I think of you!' }}
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
    
    // ═══════════════════════════════════════════════════════════════════════════
    // FIXED MUSIC PLAYER!
    // ═══════════════════════════════════════════════════════════════════════════
    setupAudio() {
        const self = this;
        
        this.audioElement = new Audio();
        this.audioElement.loop = false;
        this.audioElement.volume = 0.5;
        this.audioElement.addEventListener('ended', () => this.playNextSong());
        
        this.scanForMusic();
        
        // FIXED: Use onclick directly
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
        const colors = ['#ff6b8b', '#ffcc00', '#ff8e53', '#9966ff'];
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const x = 15 + Math.random() * 70, y = 15 + Math.random() * 50;
                const color = colors[Math.floor(Math.random() * colors.length)];
                for (let j = 0; j < 20; j++) {
                    const p = document.createElement('div');
                    p.className = 'firework';
                    p.style.cssText = `left:${x}%;top:${y}%;background:${color};box-shadow:0 0 10px ${color}`;
                    container.appendChild(p);
                    setTimeout(() => p.remove(), 1500);
                }
            }, i * 250);
        }
    }
    
    showValentineMessage() {
        const msg = document.getElementById('valentine-message');
        if (msg) { msg.classList.remove('hidden'); setTimeout(() => msg.classList.add('hidden'), 5000); }
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
    // ANIMATIONS - PHOENIX FLIES FREE AND HIGH!
    // ═══════════════════════════════════════════════════════════════════════════
    updateAnimations(delta, time) {
        this.mixers.forEach(m => m.update(delta));
        
        for (const obj of this.floatingObjects) {
            obj.time += delta;
            const t = obj.time;
            
            if (obj.config.phoenixFly) {
                // ═══════════════════════════════════════════════════════════
                // PHOENIX FLIES FREE ACROSS THE ENTIRE SKY!
                // ═══════════════════════════════════════════════════════════
                const flyRadius = 60 + Math.sin(t * 0.05) * 30;  // HUGE flight radius!
                const flyHeight = 30 + Math.sin(t * 0.08) * 20;  // 10-50 units HIGH!
                
                obj.angle += delta * 0.3;  // Steady flight speed
                
                // Fly in big sweeping patterns
                obj.mesh.position.x = Math.cos(obj.angle) * flyRadius;
                obj.mesh.position.z = Math.sin(obj.angle * 0.7) * flyRadius;
                obj.mesh.position.y = flyHeight + Math.sin(t * 0.5) * 8;  // Swooping!
                
                // Face direction of flight with banking
                obj.mesh.rotation.y = obj.angle + Math.PI / 2;
                obj.mesh.rotation.z = Math.sin(t * 0.8) * 0.4;  // Banking in turns
                obj.mesh.rotation.x = Math.cos(t * 0.6) * 0.2;  // Pitch variation
                
            } else if (obj.config.whaleSwim) {
                // Whale swims slowly and gracefully
                const swimRadius = 40 + Math.sin(t * 0.03) * 15;
                obj.angle += delta * 0.06;  // Slow majestic movement
                
                obj.mesh.position.x = Math.cos(obj.angle) * swimRadius;
                obj.mesh.position.z = Math.sin(obj.angle) * swimRadius;
                obj.mesh.position.y = obj.base.y + Math.sin(t * 0.15) * 6;
                
                obj.mesh.rotation.y = obj.angle + Math.PI / 2;
                obj.mesh.rotation.z = Math.sin(t * 0.2) * 0.15;
                
            } else if (obj.config.jellyFloat) {
                // Jellyfish float and pulse UPWARD
                obj.mesh.position.x = obj.base.x + Math.sin(t * 0.15) * 12;
                obj.mesh.position.z = obj.base.z + Math.cos(t * 0.12) * 12;
                
                // Pulse UP like real jellyfish!
                const pulse = Math.max(0, Math.sin(t * 1.2)) * 4;
                obj.mesh.position.y = obj.base.y + pulse + Math.sin(t * 0.2) * 3;
                
                obj.mesh.rotation.y += delta * 0.08;
                
            } else if (obj.config.fishSwim) {
                // Fish swim around
                const swimR = 15 + Math.sin(t * 0.2) * 5;
                obj.angle += delta * 0.25;
                
                obj.mesh.position.x = obj.base.x + Math.cos(obj.angle) * swimR * 0.4;
                obj.mesh.position.z = obj.base.z + Math.sin(obj.angle) * swimR * 0.4;
                obj.mesh.position.y = obj.base.y + Math.sin(t * 0.4) * 2;
                
                obj.mesh.rotation.y = obj.angle + Math.PI / 2;
                
            } else if (obj.config.float) {
                obj.mesh.position.y = obj.base.y + Math.sin(t * 0.5) * 0.3;
                
            } else if (obj.config.spin) {
                obj.mesh.rotation.y += delta * 0.02;
            }
        }
        
        if (this.stars) this.stars.rotation.y += delta * 0.002;
        if (this.particles) {
            const pos = this.particles.geometry.attributes.position.array;
            for (let i = 1; i < pos.length; i += 3) pos[i] += Math.sin(time + i) * 0.002;
            this.particles.geometry.attributes.position.needsUpdate = true;
        }
        if (this.glowRing) this.glowRing.material.opacity = 0.35 + Math.sin(time * 2) * 0.15;
        if (this.skyPlanets) {
            this.skyPlanets.jupiter.rotation.y += delta * 0.005;
            this.skyPlanets.saturn.rotation.y += delta * 0.008;
            this.skyPlanets.saturnRing.rotation.z += delta * 0.003;
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
    console.log('🏠 Starting Tan\'s Home...');
    window.game = new TansHome();
});