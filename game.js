// ═══════════════════════════════════════════════════════════════════════════
// TAN'S SANCTUARY — Clean 3D Experience
// ═══════════════════════════════════════════════════════════════════════════

class TansSanctuary {
    constructor() {
        // Three.js core
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();
        this.loader = new THREE.GLTFLoader();
        
        // Game state
        this.state = {
            loaded: false,
            started: false,
            letterRead: false,
            fireworksShown: false
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
        this.models = {
            house: null,
            postbox: null,
            skybox: null,
            planet: null,
            creatures: []
        };
        
        // Interactive objects
        this.interactables = [];
        this.currentTarget = null;
        
        // Animations
        this.floatingObjects = [];
        this.particles = [];
        
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
        
        // Handle resize
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
        // Ambient light - soft fill
        const ambient = new THREE.AmbientLight(0x404080, 0.4);
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
        
        // Warm accent light
        const warmLight = new THREE.PointLight(0xff8866, 1.5, 30);
        warmLight.position.set(0, 3, 0);
        this.scene.add(warmLight);
        
        // Rose colored rim light
        const roseLight = new THREE.PointLight(0xff6b8b, 0.8, 25);
        roseLight.position.set(-5, 5, -5);
        this.scene.add(roseLight);
    }
    
    createEnvironment() {
        // Create space background
        this.createSpaceSkybox();
        
        // Create stars
        this.createStars();
        
        // Create ground plane
        this.createGround();
        
        // Create floating particles
        this.createParticles();
    }
    
    createSpaceSkybox() {
        // Create a large sphere with stars texture
        const geometry = new THREE.SphereGeometry(500, 64, 64);
        
        // Create gradient space material
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
        const sizes = new Float32Array(starCount);
        
        for (let i = 0; i < starCount; i++) {
            const i3 = i * 3;
            const radius = 200 + Math.random() * 300;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);
            
            // Vary star colors slightly
            const colorChoice = Math.random();
            if (colorChoice < 0.7) {
                colors[i3] = 1;
                colors[i3 + 1] = 1;
                colors[i3 + 2] = 1;
            } else if (colorChoice < 0.85) {
                colors[i3] = 1;
                colors[i3 + 1] = 0.9;
                colors[i3 + 2] = 0.7;
            } else {
                colors[i3] = 0.7;
                colors[i3 + 1] = 0.8;
                colors[i3 + 2] = 1;
            }
            
            sizes[i] = Math.random() * 2 + 0.5;
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
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
        const geometry = new THREE.CylinderGeometry(15, 18, 2, 64);
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
        const ringGeom = new THREE.TorusGeometry(16.5, 0.2, 16, 100);
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
        const particleCount = 200;
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = (Math.random() - 0.5) * 40;
            positions[i3 + 1] = Math.random() * 20;
            positions[i3 + 2] = (Math.random() - 0.5) * 40;
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
        
        const modelConfigs = [
            { name: 'Loading environment...', progress: 20 },
            { name: 'Creating sanctuary...', progress: 40 },
            { name: 'Adding creatures...', progress: 60 },
            { name: 'Placing postbox...', progress: 80 },
            { name: 'Final touches...', progress: 100 }
        ];
        
        // Simulate loading with fallback procedural objects
        for (const config of modelConfigs) {
            await this.sleep(300);
            loadStatus.textContent = config.name;
            loadBar.style.width = config.progress + '%';
        }
        
        // Create fallback procedural models (will use GLB if available)
        this.createProceduralHouse();
        this.createProceduralPostbox();
        this.createProceduralCreatures();
        this.createProceduralPlanets();
        
        // Try to load GLB models
        this.tryLoadGLBModels();
        
        this.state.loaded = true;
        this.finishLoading();
    }
    
    tryLoadGLBModels() {
        // Attempt to load red_post_box.glb
        this.loader.load(
            'red_post_box.glb',
            (gltf) => {
                // Remove procedural postbox
                if (this.proceduralPostbox) {
                    this.scene.remove(this.proceduralPostbox);
                }
                
                const model = gltf.scene;
                model.scale.set(1.5, 1.5, 1.5);
                model.position.set(4, 0, -2);
                model.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                this.scene.add(model);
                this.models.postbox = model;
                
                // Update interactable
                this.interactables = this.interactables.filter(i => i.name !== 'Postbox');
                this.interactables.push({
                    object: model,
                    name: 'Postbox',
                    description: 'Open to read your letter',
                    action: () => this.openLetter()
                });
            },
            undefined,
            (error) => console.log('Using procedural postbox')
        );
        
        // Attempt to load mushroom_water_house.glb
        this.loader.load(
            'mushroom_water_house.glb',
            (gltf) => {
                if (this.proceduralHouse) {
                    this.scene.remove(this.proceduralHouse);
                }
                
                const model = gltf.scene;
                model.scale.set(0.8, 0.8, 0.8);
                model.position.set(0, 0, -5);
                model.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                this.scene.add(model);
                this.models.house = model;
            },
            undefined,
            (error) => console.log('Using procedural house')
        );
        
        // Attempt to load jellyray.glb
        this.loader.load(
            'jellyray.glb',
            (gltf) => {
                const model = gltf.scene;
                model.scale.set(0.5, 0.5, 0.5);
                
                // Create multiple instances
                for (let i = 0; i < 5; i++) {
                    const clone = model.clone();
                    clone.position.set(
                        (Math.random() - 0.5) * 30,
                        5 + Math.random() * 10,
                        (Math.random() - 0.5) * 30
                    );
                    clone.rotation.y = Math.random() * Math.PI * 2;
                    this.scene.add(clone);
                    this.floatingObjects.push({
                        mesh: clone,
                        speed: 0.3 + Math.random() * 0.2,
                        offset: Math.random() * Math.PI * 2
                    });
                }
            },
            undefined,
            () => {}
        );
        
        // Attempt to load bladderfish.glb
        this.loader.load(
            'bladderfish.glb',
            (gltf) => {
                const model = gltf.scene;
                model.scale.set(0.4, 0.4, 0.4);
                
                for (let i = 0; i < 5; i++) {
                    const clone = model.clone();
                    clone.position.set(
                        (Math.random() - 0.5) * 25,
                        3 + Math.random() * 8,
                        (Math.random() - 0.5) * 25
                    );
                    clone.rotation.y = Math.random() * Math.PI * 2;
                    this.scene.add(clone);
                    this.floatingObjects.push({
                        mesh: clone,
                        speed: 0.2 + Math.random() * 0.15,
                        offset: Math.random() * Math.PI * 2
                    });
                }
            },
            undefined,
            () => {}
        );
        
        // Attempt to load stylized_planet.glb
        this.loader.load(
            'stylized_planet.glb',
            (gltf) => {
                const model = gltf.scene;
                model.scale.set(5, 5, 5);
                model.position.set(-80, 30, -100);
                this.scene.add(model);
                this.models.planet = model;
            },
            undefined,
            () => {}
        );
        
        // Attempt to load phoenix
        this.loader.load(
            'phoenix_on_fire_update.glb',
            (gltf) => {
                const model = gltf.scene;
                model.scale.set(0.8, 0.8, 0.8);
                model.position.set(15, 12, -20);
                this.scene.add(model);
                
                // Add to floating objects for animation
                this.floatingObjects.push({
                    mesh: model,
                    speed: 0.15,
                    offset: 0,
                    isPhoenix: true
                });
            },
            undefined,
            () => {}
        );
    }
    
    createProceduralHouse() {
        const group = new THREE.Group();
        
        // Main structure - mushroom shape
        const capGeom = new THREE.SphereGeometry(4, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
        const capMat = new THREE.MeshStandardMaterial({
            color: 0xff6b8b,
            roughness: 0.6,
            metalness: 0.1
        });
        const cap = new THREE.Mesh(capGeom, capMat);
        cap.position.y = 4;
        cap.castShadow = true;
        group.add(cap);
        
        // Stem
        const stemGeom = new THREE.CylinderGeometry(1.5, 2, 4, 32);
        const stemMat = new THREE.MeshStandardMaterial({
            color: 0xeeddcc,
            roughness: 0.8
        });
        const stem = new THREE.Mesh(stemGeom, stemMat);
        stem.position.y = 2;
        stem.castShadow = true;
        group.add(stem);
        
        // Door
        const doorGeom = new THREE.PlaneGeometry(1.2, 2);
        const doorMat = new THREE.MeshStandardMaterial({
            color: 0x8b4513,
            roughness: 0.9
        });
        const door = new THREE.Mesh(doorGeom, doorMat);
        door.position.set(0, 1, 2.01);
        group.add(door);
        
        // Windows (glowing)
        const windowGeom = new THREE.CircleGeometry(0.4, 16);
        const windowMat = new THREE.MeshBasicMaterial({
            color: 0xffdd88
        });
        
        const window1 = new THREE.Mesh(windowGeom, windowMat);
        window1.position.set(-1.2, 3.5, 2.8);
        window1.rotation.y = 0.3;
        group.add(window1);
        
        const window2 = new THREE.Mesh(windowGeom, windowMat);
        window2.position.set(1.2, 3.5, 2.8);
        window2.rotation.y = -0.3;
        group.add(window2);
        
        // Spots on mushroom cap
        const spotMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        for (let i = 0; i < 8; i++) {
            const spotGeom = new THREE.CircleGeometry(0.3 + Math.random() * 0.3, 16);
            const spot = new THREE.Mesh(spotGeom, spotMat);
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * 0.4 + 0.2;
            spot.position.set(
                3.5 * Math.sin(phi) * Math.cos(theta),
                4 + 3.5 * Math.cos(phi),
                3.5 * Math.sin(phi) * Math.sin(theta)
            );
            spot.lookAt(new THREE.Vector3(0, 4, 0));
            group.add(spot);
        }
        
        group.position.set(0, 0, -5);
        this.scene.add(group);
        this.proceduralHouse = group;
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
        
        // Top (rounded)
        const topGeom = new THREE.CylinderGeometry(0.4, 0.4, 0.6, 32, 1, false, 0, Math.PI);
        const top = new THREE.Mesh(topGeom, bodyMat);
        top.rotation.x = Math.PI / 2;
        top.rotation.z = Math.PI / 2;
        top.position.set(0, 1.8, 0);
        top.castShadow = true;
        group.add(top);
        
        // Post
        const postGeom = new THREE.CylinderGeometry(0.1, 0.1, 0.6, 16);
        const postMat = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.5,
            metalness: 0.5
        });
        const post = new THREE.Mesh(postGeom, postMat);
        post.position.y = 0.3;
        group.add(post);
        
        // Slot
        const slotGeom = new THREE.BoxGeometry(0.5, 0.05, 0.1);
        const slotMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
        const slot = new THREE.Mesh(slotGeom, slotMat);
        slot.position.set(0, 1.5, 0.31);
        group.add(slot);
        
        // Heart decoration
        const heartShape = new THREE.Shape();
        const x = 0, y = 0;
        heartShape.moveTo(x, y + 0.1);
        heartShape.bezierCurveTo(x, y + 0.15, x - 0.05, y + 0.2, x - 0.1, y + 0.2);
        heartShape.bezierCurveTo(x - 0.2, y + 0.2, x - 0.2, y + 0.05, x - 0.2, y + 0.05);
        heartShape.bezierCurveTo(x - 0.2, y - 0.05, x - 0.1, y - 0.15, x, y - 0.2);
        heartShape.bezierCurveTo(x + 0.1, y - 0.15, x + 0.2, y - 0.05, x + 0.2, y + 0.05);
        heartShape.bezierCurveTo(x + 0.2, y + 0.05, x + 0.2, y + 0.2, x + 0.1, y + 0.2);
        heartShape.bezierCurveTo(x + 0.05, y + 0.2, x, y + 0.15, x, y + 0.1);
        
        const heartGeom = new THREE.ExtrudeGeometry(heartShape, {
            depth: 0.02,
            bevelEnabled: false
        });
        const heartMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const heart = new THREE.Mesh(heartGeom, heartMat);
        heart.scale.set(0.8, 0.8, 0.8);
        heart.position.set(0, 1.1, 0.32);
        group.add(heart);
        
        // Glow
        const glowGeom = new THREE.SphereGeometry(0.8, 16, 16);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0xff6b8b,
            transparent: true,
            opacity: 0.15
        });
        const glow = new THREE.Mesh(glowGeom, glowMat);
        glow.position.y = 1.3;
        group.add(glow);
        this.postboxGlow = glow;
        
        group.position.set(4, 0, -2);
        this.scene.add(group);
        this.proceduralPostbox = group;
        
        // Add to interactables
        this.interactables.push({
            object: group,
            name: 'Postbox',
            description: 'Open to read your letter 💌',
            action: () => this.openLetter()
        });
    }
    
    createProceduralCreatures() {
        // Create simple floating jellyfish-like creatures
        for (let i = 0; i < 8; i++) {
            const group = new THREE.Group();
            
            // Bell
            const bellGeom = new THREE.SphereGeometry(0.5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
            const bellMat = new THREE.MeshStandardMaterial({
                color: new THREE.Color().setHSL(0.8 + Math.random() * 0.2, 0.6, 0.6),
                transparent: true,
                opacity: 0.7,
                side: THREE.DoubleSide
            });
            const bell = new THREE.Mesh(bellGeom, bellMat);
            bell.rotation.x = Math.PI;
            group.add(bell);
            
            // Tentacles
            const tentacleMat = new THREE.MeshBasicMaterial({
                color: bellMat.color,
                transparent: true,
                opacity: 0.5
            });
            
            for (let j = 0; j < 5; j++) {
                const tentGeom = new THREE.CylinderGeometry(0.02, 0.01, 1 + Math.random(), 8);
                const tentacle = new THREE.Mesh(tentGeom, tentacleMat);
                tentacle.position.set(
                    (Math.random() - 0.5) * 0.3,
                    -0.5 - Math.random() * 0.3,
                    (Math.random() - 0.5) * 0.3
                );
                group.add(tentacle);
            }
            
            group.position.set(
                (Math.random() - 0.5) * 30,
                5 + Math.random() * 10,
                (Math.random() - 0.5) * 30
            );
            
            this.scene.add(group);
            this.floatingObjects.push({
                mesh: group,
                speed: 0.2 + Math.random() * 0.2,
                offset: Math.random() * Math.PI * 2
            });
        }
    }
    
    createProceduralPlanets() {
        // Large planet in distance
        const planetGeom = new THREE.SphereGeometry(15, 32, 32);
        const planetMat = new THREE.MeshStandardMaterial({
            color: 0x9966ff,
            roughness: 0.8,
            metalness: 0.1
        });
        const planet = new THREE.Mesh(planetGeom, planetMat);
        planet.position.set(-80, 30, -100);
        this.scene.add(planet);
        
        // Ring
        const ringGeom = new THREE.RingGeometry(20, 28, 64);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xffccdd,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeom, ringMat);
        ring.position.copy(planet.position);
        ring.rotation.x = Math.PI / 3;
        this.scene.add(ring);
        
        // Small moon
        const moonGeom = new THREE.SphereGeometry(5, 16, 16);
        const moonMat = new THREE.MeshStandardMaterial({
            color: 0xffddaa,
            emissive: 0xffddaa,
            emissiveIntensity: 0.3
        });
        const moon = new THREE.Mesh(moonGeom, moonMat);
        moon.position.set(50, 40, -80);
        this.scene.add(moon);
        this.moon = moon;
    }
    
    setupControls() {
        // Keyboard
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (e.code === 'KeyE' && this.currentTarget && this.state.started) {
                this.currentTarget.action();
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
        
        // Click backdrop to close
        document.querySelector('#letter-modal .modal-backdrop').addEventListener('click', () => {
            this.closeLetter();
        });
    }
    
    startGame() {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');
        this.state.started = true;
        document.getElementById('game-canvas').requestPointerLock();
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
            
            // Trigger fireworks after a delay
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
            
            // Create burst particles
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
        
        // Launch multiple fireworks
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
        
        // Calculate forward/right vectors based on yaw only
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
        
        // Movement input
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
        if (distFromCenter > 14) {
            const angle = Math.atan2(this.player.position.z, this.player.position.x);
            this.player.position.x = Math.cos(angle) * 14;
            this.player.position.z = Math.sin(angle) * 14;
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
        let nearestDist = 5; // Interaction range
        
        for (const interactable of this.interactables) {
            const objPos = new THREE.Vector3();
            interactable.object.getWorldPosition(objPos);
            
            const dist = this.player.position.distanceTo(objPos);
            
            if (dist < nearestDist) {
                // Check if looking at it
                const toObj = objPos.clone().sub(this.player.position).normalize();
                const lookDir = new THREE.Vector3(0, 0, -1);
                lookDir.applyQuaternion(this.camera.quaternion);
                
                const dot = toObj.dot(lookDir);
                if (dot > 0.7) {
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
    
    updateAnimations(time) {
        // Floating creatures
        for (const obj of this.floatingObjects) {
            const t = time * obj.speed + obj.offset;
            obj.mesh.position.y += Math.sin(t) * 0.003;
            
            if (obj.isPhoenix) {
                obj.mesh.position.x = 15 + Math.sin(t * 0.3) * 10;
                obj.mesh.position.z = -20 + Math.cos(t * 0.3) * 10;
                obj.mesh.rotation.y = t * 0.3 + Math.PI;
            } else {
                obj.mesh.rotation.y += 0.002;
            }
        }
        
        // Stars twinkle
        if (this.stars) {
            this.stars.rotation.y += 0.0001;
        }
        
        // Floating particles
        if (this.floatingParticles) {
            const positions = this.floatingParticles.geometry.attributes.position.array;
            for (let i = 1; i < positions.length; i += 3) {
                positions[i] += Math.sin(time + i) * 0.002;
            }
            this.floatingParticles.geometry.attributes.position.needsUpdate = true;
            this.floatingParticles.rotation.y += 0.0003;
        }
        
        // Glow ring pulse
        if (this.glowRing) {
            this.glowRing.material.opacity = 0.4 + Math.sin(time * 2) * 0.2;
        }
        
        // Postbox glow pulse
        if (this.postboxGlow) {
            this.postboxGlow.material.opacity = 0.1 + Math.sin(time * 3) * 0.1;
            this.postboxGlow.scale.setScalar(1 + Math.sin(time * 2) * 0.1);
        }
        
        // Moon glow
        if (this.moon) {
            this.moon.material.emissiveIntensity = 0.3 + Math.sin(time) * 0.1;
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const delta = Math.min(this.clock.getDelta(), 0.1);
        const time = this.clock.getElapsedTime();
        
        this.updatePlayer(delta);
        this.updateInteraction();
        this.updateAnimations(time);
        
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
