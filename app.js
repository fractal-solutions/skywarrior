class SkyWarriorGame {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.playerJet = null;
        this.enemies = [];
        this.bullets = [];
        this.missiles = [];
        this.explosions = [];
        this.terrain = null;
        
        // Game state
        this.gameState = 'menu'; // menu, playing, paused, missionComplete
        this.currentMission = 1;
        this.score = 0;
        this.health = 100;
        this.maxMissiles = 10;
        this.ammo = { cannon: 500, missiles: this.maxMissiles };
        this.selectedWeapon = 'cannon';
        this.targetedEnemy = null;
        this.missionStartTime = 0;
        this.shotsFired = 0;
        this.hits = 0;
        
        // Flight physics
        this.gForce = 1.0;
        this.previousVelocity = new THREE.Vector3();
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.throttle = 0.5;
        this.maxSpeed = 400; // Increased max speed
        this.acceleration = 80; // Increased acceleration
        this.turnRate = 3.5; // Increased turn rate
        this.pitchRate = 2.5; // Increased pitch rate
        this.rollRate = 4.5; // Increased roll rate
        
        // Controls
        this.keys = {};
        this.mouse = { x: 0, y: 0, deltaX: 0, deltaY: 0 };
        this.mousePressed = false;
        this.isPointerLocked = false;

        // Afterburner
        this.afterburnerOn = false;
        this.afterburnerFuel = 100;
        this.maxAfterburnerFuel = 100;
        this.boostSpeed = 600;
        
        // Settings
        this.settings = {
            renderDistance: 3000,
            particleEffects: 'medium',
            shadowQuality: 'medium',
            masterVolume: 70,
            sfxVolume: 80,
            musicVolume: 60,
            mouseSensitivity: 1.0,
            invertY: false,
            controlMode: 'arcade'
        };
        
        this.missions = [
            {
                id: 1,
                name: "TRAINING FLIGHT",
                objective: "Destroy 3 training targets",
                enemies: 3,
                timeLimit: 300,
                difficulty: 'easy'
            },
            {
                id: 2,
                name: "FIRST CONTACT",
                objective: "Eliminate enemy patrol",
                enemies: 5,
                timeLimit: 420,
                difficulty: 'easy'
            },
            {
                id: 3,
                name: "AIR SUPERIORITY",
                objective: "Clear the airspace",
                enemies: 8,
                timeLimit: 600,
                difficulty: 'medium'
            },
            {
                id: 4,
                name: "DEEP STRIKE",
                objective: "Destroy ground targets",
                enemies: 6,
                timeLimit: 480,
                difficulty: 'medium'
            },
            {
                id: 5,
                name: "ACE COMBAT",
                objective: "Defeat the enemy ace",
                enemies: 1,
                timeLimit: 900,
                difficulty: 'hard'
            }
        ];
        
        this.enemyTypes = {
            'scout': {
                name: 'Scout Drone',
                model: 'dodecahedron', // Placeholder, will define actual models later
                size: 3,
                health: 50,
                speed: 200,
                aggressiveness: 0.6,
                canFireMissiles: false,
                missileChance: 0,
                turnRate: 0.08,
                canEvade: true, // New property
                lore: "Agile reconnaissance units, often deployed in swarms. Easily dispatched but hard to hit."
            },
            'assault': {
                name: 'Assault Fighter',
                model: 'box', // Placeholder
                size: 7,
                health: 150,
                speed: 150,
                aggressiveness: 0.8,
                canFireMissiles: true,
                missileChance: 0.05, // Increased for testing
                turnRate: 0.05,
                canEvade: true, // New property
                lore: "The backbone of the enemy fleet, these versatile fighters engage targets with both cannons and homing missiles."
            },
            'heavy': {
                name: 'Heavy Bomber',
                model: 'sphere', // Placeholder
                size: 15,
                health: 300,
                speed: 80,
                aggressiveness: 0.4,
                canFireMissiles: false,
                missileChance: 0,
                turnRate: 0.02,
                canEvade: false, // New property: Heavy bombers do not evade
                lore: "Slow but heavily armored, Heavy Bombers are designed to withstand significant damage while delivering devastating payloads."
            }
        };
        
        this.init();
    }
    
    init() {
        this.setupScene();
        this.setupControls();
        this.loadSettings();
        this.setupUI();
        this.createTerrain();
        this.createSkybox();
        
        // Hide loading screen after a short delay
        setTimeout(() => {
            document.getElementById('loadingScreen').style.display = 'none';
        }, 2000);
        
        this.animate();
    }
    
    setupScene() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x220033, 1000, 5000);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
        this.camera.position.set(0, 100, 200);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x220033, 1);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        document.getElementById('scene-container').appendChild(this.renderer.domElement);
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1000, 1000, 500);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 3000;
        directionalLight.shadow.camera.left = -1000;
        directionalLight.shadow.camera.right = 1000;
        directionalLight.shadow.camera.top = 1000;
        directionalLight.shadow.camera.bottom = -1000;
        this.scene.add(directionalLight);
        
        // Resize handler
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
    
    setupControls() {
        document.addEventListener('keydown', (event) => {
            this.keys[event.code] = true;
            this.handleKeyPress(event);
        });
        
        document.addEventListener('keyup', (event) => {
            this.keys[event.code] = false;
        });
        
        document.addEventListener('mousemove', (event) => {
            if (this.gameState === 'playing' && this.isPointerLocked) {
                this.mouse.deltaX = event.movementX || 0;
                this.mouse.deltaY = event.movementY || 0;
            }
            this.mouse.x = event.clientX;
            this.mouse.y = event.clientY;
        });
        
        document.addEventListener('mousedown', (event) => {
            this.mousePressed = true;
            if (this.gameState === 'playing' && event.button === 0) {
                this.firePrimaryWeapon();
            }
        });
        
        document.addEventListener('mouseup', (event) => {
            this.mousePressed = false;
        });
        
        // Pointer lock handling
        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === document.body;
        });
        
        // Request pointer lock for better mouse control
        document.addEventListener('click', () => {
            if (this.gameState === 'playing' && !this.isPointerLocked) {
                document.body.requestPointerLock();
            }
        });
    }
    
    handleKeyPress(event) {
        if (this.gameState === 'playing') {
            switch(event.code) {
                case 'Space':
                    event.preventDefault();
                    this.firePrimaryWeapon();
                    break;
                case 'ControlLeft':
                    this.fireMissile();
                    break;
                case 'Tab':
                    event.preventDefault();
                    this.cycleTargets();
                    break;
                case 'KeyR':
                    this.lockTarget();
                    break;
                case 'KeyB':
                    this.deployCountermeasures();
                    break;
                case 'KeyP':
                case 'Escape':
                    this.pauseGame();
                    break;
                case 'Digit1':
                    this.selectWeapon('cannon');
                    break;
            }
        } else if (this.gameState === 'paused') {
            if (event.code === 'KeyP' || event.code === 'Escape') {
                this.resumeGame();
            }
        } else if (this.gameState === 'missionComplete') {
            // Quick restart when dead/mission complete
            if (event.code === 'KeyP') {
                this.restartMission();
            }
        }
    }
    
    createPlayerJet() {
        const shipGroup = new THREE.Group();
        const shipMaterial = new THREE.MeshLambertMaterial({ color: 0xeeeeee, flatShading: true });

        // Main Body
        const bodyGeom = new THREE.SphereGeometry(4, 12, 12);
        const body = new THREE.Mesh(bodyGeom, shipMaterial);
        body.scale.x = 1.5; // Make it oblong
        shipGroup.add(body);

        // Nose Cone
        const noseGeom = new THREE.CylinderGeometry(0, 2, 12, 8);
        const nose = new THREE.Mesh(noseGeom, shipMaterial);
        nose.position.x = 8;
        nose.rotation.z = -Math.PI / 2;
        shipGroup.add(nose);

        // Connections from body to engines
        const connectionGeom = new THREE.CylinderGeometry(0.5, 0.5, 4, 8);
        const connectionMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });

        const leftConnection = new THREE.Mesh(connectionGeom, connectionMaterial);
        leftConnection.position.set(0, 0, 5);
        leftConnection.rotation.x = Math.PI / 2;
        shipGroup.add(leftConnection);

        const rightConnection = new THREE.Mesh(connectionGeom, connectionMaterial);
        rightConnection.position.set(0, 0, -5);
        rightConnection.rotation.x = Math.PI / 2;
        shipGroup.add(rightConnection);

        // Wings removed as per user feedback

        // Engines
        const engineGeom = new THREE.CylinderGeometry(1.5, 1, 5, 8);
        const engineMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
        
        const leftEngine = new THREE.Mesh(engineGeom, engineMaterial);
        leftEngine.position.set(-3, 0, 7);
        leftEngine.rotation.z = Math.PI / 2;
        leftEngine.name = 'exhaust_left';
        shipGroup.add(leftEngine);

        const rightEngine = new THREE.Mesh(engineGeom, engineMaterial);
        rightEngine.position.set(-3, 0, -7);
        rightEngine.rotation.z = Math.PI / 2;
        rightEngine.name = 'exhaust_right';
        shipGroup.add(rightEngine);

        shipGroup.position.set(0, 100, 0);
        this.scene.add(shipGroup);
        this.playerJet = shipGroup;

        // Camera is now handled in updateCamera()
        
        // Initialize velocity
        this.velocity.set(0, 0, 0);
    }
    
    createEnemy(position, enemyType = 'scout') { // Default to scout if type not provided
        let typeData = this.enemyTypes[enemyType];
        if (!typeData) {
            console.warn(`Unknown enemy type: ${enemyType}. Defaulting to scout.`);
            enemyType = 'scout';
            typeData = this.enemyTypes[enemyType];
        }

        const enemyGroup = new THREE.Group();
        const enemyMaterial = new THREE.MeshLambertMaterial({ color: 0xff4444, flatShading: true });

        // Create model based on typeData.model
        let body; // Declare body outside switch
        let bodyGeom; // Declare bodyGeom outside switch
        switch (typeData.model) {
            case 'dodecahedron': // Scout Drone
                // Central body (capsule-like)
                bodyGeom = new THREE.CylinderGeometry(typeData.size * 0.5, typeData.size * 0.5, typeData.size * 2, 8);
                body = new THREE.Mesh(bodyGeom, enemyMaterial);
                body.rotation.z = Math.PI / 2; // Orient along X-axis
                enemyGroup.add(body);

                // Swept-back wings
                const wingShape = new THREE.Shape();
                wingShape.moveTo(0, 0);
                wingShape.lineTo(typeData.size * 2, typeData.size * 0.5);
                wingShape.lineTo(typeData.size * 1.5, 0);
                wingShape.lineTo(typeData.size * 2, -typeData.size * 0.5);
                wingShape.lineTo(0, 0);

                const extrudeSettings = {
                    steps: 1,
                    depth: typeData.size * 0.2,
                    bevelEnabled: false
                };

                const wingGeometry = new THREE.ExtrudeGeometry(wingShape, extrudeSettings);
                const wingMaterial = new THREE.MeshLambertMaterial({ color: 0xaaaaaa, flatShading: true });

                const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
                leftWing.position.set(typeData.size * 0.5, 0, typeData.size * 0.8);
                leftWing.rotation.y = Math.PI / 2;
                enemyGroup.add(leftWing);

                const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
                rightWing.position.set(typeData.size * 0.5, 0, -typeData.size * 0.8);
                rightWing.rotation.y = Math.PI / 2;
                rightWing.scale.z = -1;
                enemyGroup.add(rightWing);

                // Thrusters
                const thrusterGeometry = new THREE.CylinderGeometry(typeData.size * 0.2, typeData.size * 0.3, typeData.size * 0.8, 6);
                const thrusterMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });

                const leftThruster = new THREE.Mesh(thrusterGeometry, thrusterMaterial);
                leftThruster.position.set(-typeData.size * 1.2, 0, typeData.size * 0.6);
                leftThruster.rotation.z = Math.PI / 2;
                enemyGroup.add(leftThruster);

                const rightThruster = new THREE.Mesh(thrusterGeometry, thrusterMaterial);
                rightThruster.position.set(-typeData.size * 1.2, 0, -typeData.size * 0.6);
                rightThruster.rotation.z = Math.PI / 2;
                enemyGroup.add(rightThruster);
                break;

            case 'box': // Assault Fighter
                // Main body (flattened box)
                bodyGeom = new THREE.BoxGeometry(typeData.size * 2, typeData.size * 0.8, typeData.size * 1.5);
                body = new THREE.Mesh(bodyGeom, enemyMaterial);
                enemyGroup.add(body);

                // Cockpit
                const cockpitGeom = new THREE.SphereGeometry(typeData.size * 0.4, 8, 8);
                const cockpit = new THREE.Mesh(cockpitGeom, enemyMaterial);
                cockpit.position.set(typeData.size * 0.8, typeData.size * 0.5, 0);
                enemyGroup.add(cockpit);

                // Engine pods
                const enginePodGeom = new THREE.CylinderGeometry(typeData.size * 0.3, typeData.size * 0.3, typeData.size * 1.2, 8);
                const enginePodMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });

                const leftEnginePod = new THREE.Mesh(enginePodGeom, enginePodMaterial);
                leftEnginePod.position.set(-typeData.size * 0.8, 0, typeData.size * 0.8);
                leftEnginePod.rotation.z = Math.PI / 2;
                enemyGroup.add(leftEnginePod);

                const rightEnginePod = new THREE.Mesh(enginePodGeom, enginePodMaterial);
                rightEnginePod.position.set(-typeData.size * 0.8, 0, -typeData.size * 0.8);
                rightEnginePod.rotation.z = Math.PI / 2;
                enemyGroup.add(rightEnginePod);
                break;

            case 'sphere': // Heavy Bomber
                // Central core (large sphere)
                bodyGeom = new THREE.SphereGeometry(typeData.size, 16, 16);
                body = new THREE.Mesh(bodyGeom, enemyMaterial);
                enemyGroup.add(body);

                // Armored wings/plates
                const plateGeom = new THREE.BoxGeometry(typeData.size * 0.5, typeData.size * 0.2, typeData.size * 3);
                const plateMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });

                const topPlate = new THREE.Mesh(plateGeom, plateMaterial);
                topPlate.position.set(0, typeData.size * 0.8, 0);
                enemyGroup.add(topPlate);

                const bottomPlate = new THREE.Mesh(plateGeom, plateMaterial);
                bottomPlate.position.set(0, -typeData.size * 0.8, 0);
                enemyGroup.add(bottomPlate);

                // Large thrusters
                const largeThrusterGeom = new THREE.CylinderGeometry(typeData.size * 0.4, typeData.size * 0.6, typeData.size * 1.5, 8);
                const largeThrusterMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });

                const rearThruster1 = new THREE.Mesh(largeThrusterGeom, largeThrusterMaterial);
                rearThruster1.position.set(-typeData.size * 1.2, typeData.size * 0.5, typeData.size * 0.8);
                rearThruster1.rotation.z = Math.PI / 2;
                enemyGroup.add(rearThruster1);

                const rearThruster2 = new THREE.Mesh(largeThrusterGeom, largeThrusterMaterial);
                rearThruster2.position.set(-typeData.size * 1.2, typeData.size * 0.5, -typeData.size * 0.8);
                rearThruster2.rotation.z = Math.PI / 2;
                enemyGroup.add(rearThruster2);

                const rearThruster3 = new THREE.Mesh(largeThrusterGeom, largeThrusterMaterial);
                rearThruster3.position.set(-typeData.size * 1.2, -typeData.size * 0.5, typeData.size * 0.8);
                rearThruster3.rotation.z = Math.PI / 2;
                enemyGroup.add(rearThruster3);

                const rearThruster4 = new THREE.Mesh(largeThrusterGeom, largeThrusterMaterial);
                rearThruster4.position.set(-typeData.size * 1.2, -typeData.size * 0.5, -typeData.size * 0.8);
                rearThruster4.rotation.z = Math.PI / 2;
                enemyGroup.add(rearThruster4);
                break;

            case 'pyramid': // Example of another shape
                bodyGeom = new THREE.ConeGeometry(typeData.size, typeData.size * 2, 4);
                body = new THREE.Mesh(bodyGeom, enemyMaterial);
                enemyGroup.add(body);
                break;

            default:
                bodyGeom = new THREE.DodecahedronGeometry(typeData.size);
                body = new THREE.Mesh(bodyGeom, enemyMaterial);
                enemyGroup.add(body);
        }


        enemyGroup.position.copy(position);
        
        // Update userData with type-specific properties
        enemyGroup.userData = {
            type: enemyType, // Store the type string
            health: typeData.health,
            speed: typeData.speed,
            aggressiveness: typeData.aggressiveness,
            canFireMissiles: typeData.canFireMissiles,
            missileChance: typeData.missileChance,
            lastShot: 0,
            target: this.playerJet,
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 150,
                (Math.random() - 0.5) * 30,
                (Math.random() - 0.5) * 150
            ),
            targetDirection: new THREE.Vector3(),
            attackDistance: typeData.size * 50 + Math.random() * 100, // Preferred attack distance based on size
            retreatDistance: typeData.size * 20, // Distance to retreat when too close based on size
            circleDirection: Math.random() > 0.5 ? 1 : -1,
            lastPlayerDirection: new THREE.Vector3(),
            evasionTimer: 0,
            attackMode: 'approach'
        };
        
        this.scene.add(enemyGroup);
        this.enemies.push(enemyGroup);
        
        return enemyGroup;
    }
    
    createTerrain() {
        // Create a large ground plane with height variation
        const groundGeometry = new THREE.PlaneGeometry(10000, 10000, 50, 50);
        const groundMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x3a5f3a,
            wireframe: false
        });
        
        // Add height variation
        const vertices = groundGeometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            vertices[i + 2] = Math.random() * 50 - 25; // Random height
        }
        groundGeometry.attributes.position.needsUpdate = true;
        groundGeometry.computeVertexNormals();
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -100;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Add some buildings/obstacles
        for (let i = 0; i < 20; i++) {
            const buildingGeometry = new THREE.BoxGeometry(
                20 + Math.random() * 40,
                50 + Math.random() * 100,
                20 + Math.random() * 40
            );
            const buildingMaterial = new THREE.MeshLambertMaterial({ 
                color: new THREE.Color().setHSL(0, 0, 0.3 + Math.random() * 0.3)
            });
            const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
            building.position.set(
                (Math.random() - 0.5) * 4000,
                -50,
                (Math.random() - 0.5) * 4000
            );
            building.castShadow = true;
            building.receiveShadow = true;
            this.scene.add(building);
        }
    }
    
    createSkybox() {
        const skyGeometry = new THREE.SphereGeometry(5000, 32, 32);
        const skyMaterial = new THREE.MeshBasicMaterial({
            color: 0x220033, // Deep purple
            side: THREE.BackSide,
            fog: false
        });
        const sky = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(sky);
        
        // Add a large planet to the sky
        const planetGeometry = new THREE.SphereGeometry(400, 32, 32);
        const planetMaterial = new THREE.MeshLambertMaterial({ color: 0xffaa88, emissive: 0x442211 });
        const planet = new THREE.Mesh(planetGeometry, planetMaterial);
        planet.position.set(2000, 800, -3000);
        this.scene.add(planet);

        // Add glowing particles for atmospheric effect
        const particleGeometry = new THREE.BufferGeometry();
        const particles = 500;
        const positions = new Float32Array(particles * 3);
        for (let i = 0; i < particles * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 8000;
        }
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 5,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending
        });
        const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(particleSystem);
    }
    
    createBullet(position, direction, isPlayer = true) {
        const bulletGeometry = new THREE.SphereGeometry(2, 8, 8); // Made larger and more detailed
        const bulletMaterial = new THREE.MeshBasicMaterial({ 
            color: isPlayer ? 0xffff00 : 0xff4400,
            emissive: isPlayer ? 0xffff00 : 0xff4400 // Make bullets glow
        });
        const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
        bullet.position.copy(position);
        
        // Add a glowing trail effect
        const trailGeometry = new THREE.SphereGeometry(3, 6, 6);
        const trailMaterial = new THREE.MeshBasicMaterial({ 
            color: isPlayer ? 0xffff00 : 0xff4400,
            transparent: true,
            opacity: 0.3
        });
        const trail = new THREE.Mesh(trailGeometry, trailMaterial);
        bullet.add(trail);
        
        bullet.userData = {
            velocity: direction.clone().multiplyScalar(1200), // Increased speed
            life: 120, // Increased lifetime
            isPlayer: isPlayer,
            damage: 20
        };
        
        this.scene.add(bullet);
        this.bullets.push(bullet);
    }
    
    createExplosion(position, size = 1) {
        const explosionGroup = new THREE.Group();
        
        // Create multiple particle spheres for explosion effect
        for (let i = 0; i < 8; i++) {
            const particleGeometry = new THREE.SphereGeometry(2 * size, 6, 6);
            const particleMaterial = new THREE.MeshBasicMaterial({ 
                color: new THREE.Color().setHSL(0.1 * Math.random(), 1, 0.5 + Math.random() * 0.3),
                transparent: true,
                opacity: 0.8
            });
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.set(
                (Math.random() - 0.5) * 10 * size,
                (Math.random() - 0.5) * 10 * size,
                (Math.random() - 0.5) * 10 * size
            );
            explosionGroup.add(particle);
        }
        
        explosionGroup.position.copy(position);
        explosionGroup.userData = {
            life: 30,
            initialSize: size,
            age: 0
        };
        
        this.scene.add(explosionGroup);
        this.explosions.push(explosionGroup);
    }

    createParticleTrail(position) {
        const particleCount = 20;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 0.5;
        }
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const particleMaterial = new THREE.PointsMaterial({
            color: 0xffa500,
            size: 0.5,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const particleSystem = new THREE.Points(particles, particleMaterial);
        particleSystem.position.copy(position);
        particleSystem.userData = {
            life: 20,
            velocity: new THREE.Vector3(
                -20 - Math.random() * 10,
                (Math.random() - 0.5) * 5,
                (Math.random() - 0.5) * 5
            )
        };
        this.scene.add(particleSystem);
        this.explosions.push(particleSystem); // Reuse explosions array for cleanup
    }
    
    firePrimaryWeapon() {
        if (this.selectedWeapon === 'cannon' && this.ammo.cannon > 0) {
            const direction = new THREE.Vector3(1, 0, 0);
            direction.applyQuaternion(this.playerJet.quaternion);
            
            const bulletPosition = this.playerJet.position.clone();
            bulletPosition.add(direction.clone().multiplyScalar(25));
            
            this.createBullet(bulletPosition, direction, true);
            this.ammo.cannon--;
            this.shotsFired++;
            
            this.updateHUD();
        }
    }
    
    fireMissile() {
        if (this.ammo.missiles > 0) {
            this.createHomingMissile(this.playerJet.position, this.targetedEnemy, this.playerJet); // Pass firing entity
            this.ammo.missiles--;
            this.updateHUD();
        }
    }

    createHomingMissile(position, target, firingEntity) {
        const missileGeometry = new THREE.CylinderGeometry(0.5, 1, 8, 8);
        const missileMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0xffffff });
        const missile = new THREE.Mesh(missileGeometry, missileMaterial);
        
        // Copy firing entity's orientation
        missile.quaternion.copy(firingEntity.quaternion);
        // Rotate missile to align its Y-axis with firing entity's X-axis (forward)
        missile.rotateZ(-Math.PI / 2); // Rotate -90 degrees around Z-axis

        // Calculate starting position slightly in front of firing entity
        const forwardOffset = new THREE.Vector3(1, 0, 0); // Assuming X is forward for the entity
        forwardOffset.applyQuaternion(firingEntity.quaternion);
        forwardOffset.multiplyScalar(firingEntity.userData.size * 2 || 20); // Offset based on entity size

        missile.position.copy(position).add(forwardOffset);

        missile.userData = {
            type: 'missile',
            target: target,
            life: 200,
            speed: 300,
            turnRate: 0.05,
            homingStartTime: Date.now(),
            homingDuration: 5000,
            firedBy: firingEntity // Store the firing entity
        };

        this.scene.add(missile);
        this.missiles.push(missile);
    }
    
    cycleTargets() {
        if (this.enemies.length === 0) return;
        
        let currentIndex = -1;
        if (this.targetedEnemy) {
            currentIndex = this.enemies.indexOf(this.targetedEnemy);
        }
        
        currentIndex = (currentIndex + 1) % this.enemies.length;
        this.targetedEnemy = this.enemies[currentIndex];
    }
    
    lockTarget() {
        if (this.enemies.length > 0 && !this.targetedEnemy) {
            // Find closest enemy
            let closest = null;
            let closestDistance = Infinity;
            
            this.enemies.forEach(enemy => {
                const distance = this.playerJet.position.distanceTo(enemy.position);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closest = enemy;
                }
            });
            
            this.targetedEnemy = closest;
        }
    }
    
    deployCountermeasures() {
        // Create visual effect for chaff/flares
        for (let i = 0; i < 5; i++) {
            const flareGeometry = new THREE.SphereGeometry(1, 4, 4);
            const flareMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xffffff,
                transparent: true,
                opacity: 0.8
            });
            const flare = new THREE.Mesh(flareGeometry, flareMaterial);
            flare.position.copy(this.playerJet.position);
            flare.position.add(new THREE.Vector3(
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20
            ));
            
            flare.userData = { life: 60 };
            this.scene.add(flare);
            this.explosions.push(flare); // Reuse explosions array for cleanup
        }
    }
    
    selectWeapon(weapon) {
        this.selectedWeapon = weapon;
        this.updateHUD();
    }
    
    updatePlayerPhysics(deltaTime) {
        if (!this.playerJet) return;
        
        // Throttle control
        if (this.keys['KeyW']) {
            this.throttle = Math.min(1.0, this.throttle + deltaTime * 1.5);
        }
        if (this.keys['KeyS']) {
            this.throttle = Math.max(0.0, this.throttle - deltaTime * 1.5);
        }

        // Afterburner control
        if (this.keys['ShiftLeft']) {
            console.log('Shift key pressed. Throttle:', this.throttle, 'Fuel:', this.afterburnerFuel);
        }
        this.afterburnerOn = this.keys['ShiftLeft'] && this.throttle > 0.5 && this.afterburnerFuel > 0;

        if (this.afterburnerOn) {
            this.afterburnerFuel = Math.max(0, this.afterburnerFuel - 20 * deltaTime);
        } else if (this.afterburnerFuel < this.maxAfterburnerFuel) {
            this.afterburnerFuel = Math.min(this.maxAfterburnerFuel, this.afterburnerFuel + 10 * deltaTime);
        }

        // Afterburner visual effect
        const exhaustLeft = this.playerJet.getObjectByName('exhaust_left');
        const exhaustRight = this.playerJet.getObjectByName('exhaust_right');

        if (exhaustLeft && exhaustRight) {
            if (this.afterburnerOn) {
                const targetColor = new THREE.Color(0xff4500);
                exhaustLeft.material.emissive.lerp(targetColor, 0.05);
                exhaustRight.material.emissive.lerp(targetColor, 0.05);

                const leftPos = new THREE.Vector3();
                exhaustLeft.getWorldPosition(leftPos);
                this.createParticleTrail(leftPos);

                const rightPos = new THREE.Vector3();
                exhaustRight.getWorldPosition(rightPos);
                this.createParticleTrail(rightPos);
            } else {
                const targetColor = new THREE.Color(0x000000);
                exhaustLeft.material.emissive.lerp(targetColor, 0.02);
                exhaustRight.material.emissive.lerp(targetColor, 0.02);
            }
        }
        
        // More realistic flight model with drift
        const forward = new THREE.Vector3(1, 0, 0);
        forward.applyQuaternion(this.playerJet.quaternion);

        // Calculate the target velocity based on the ship's orientation and throttle
        const targetVelocity = forward.clone().multiplyScalar(this.throttle * this.maxSpeed);

        // Interpolate the current velocity towards the target velocity
        this.velocity.lerp(targetVelocity, 0.05);

        // Apply afterburner thrust as a direct force
        if (this.afterburnerOn) {
            const afterburnerThrust = forward.clone().multiplyScalar(this.acceleration * 2.0 * deltaTime);
            this.velocity.add(afterburnerThrust);
        }

        // Apply drag
        this.velocity.multiplyScalar(0.995);
        
        // Limit maximum speed
        const targetSpeed = this.afterburnerOn ? this.boostSpeed : this.throttle * this.maxSpeed;
        if (this.velocity.length() > targetSpeed) {
            this.velocity.normalize().multiplyScalar(targetSpeed);
        }
        
        // Apply velocity to position
        this.playerJet.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        
        // Flight controls with improved responsiveness
        let pitchInput = 0;
        let yawInput = 0;
        let rollInput = 0;
        
        // Keyboard controls
        if (this.keys['ArrowUp']) pitchInput -= 1;      // Pitch up
        if (this.keys['ArrowDown']) pitchInput += 1;    // Pitch down
        if (this.keys['ArrowLeft']) yawInput += 1;      // Yaw left
        if (this.keys['ArrowRight']) yawInput -= 1;     // Yaw right
        if (this.keys['KeyA']) rollInput -= 1;          // Roll left
        if (this.keys['KeyD']) rollInput += 1;          // Roll right
        
        // Mouse controls (when pointer is locked)
        if (this.isPointerLocked && this.settings.controlMode === 'arcade') {
            const sensitivity = this.settings.mouseSensitivity * 0.003; // Increased sensitivity
            if (Math.abs(this.mouse.deltaX) > 0) {
                yawInput += this.mouse.deltaX * sensitivity;
            }
            if (Math.abs(this.mouse.deltaY) > 0) {
                const yawMultiplier = this.settings.invertY ? -1 : 1;
                pitchInput += this.mouse.deltaY * sensitivity * yawMultiplier;
            }
        }
        
        // Apply rotations with proper axis and improved responsiveness
        if (Math.abs(pitchInput) > 0.01) {
            this.playerJet.rotateOnAxis(new THREE.Vector3(0, 0, 1), pitchInput * this.pitchRate * deltaTime);
        }
        if (Math.abs(yawInput) > 0.01) {
            this.playerJet.rotateOnAxis(new THREE.Vector3(0, 1, 0), yawInput * this.turnRate * deltaTime);
        }
        if (Math.abs(rollInput) > 0.01) {
            this.playerJet.rotateOnAxis(new THREE.Vector3(1, 0, 0), rollInput * this.rollRate * deltaTime);
        }
        
        // Calculate G-force
        const accelerationVector = this.velocity.clone().sub(this.previousVelocity).divideScalar(deltaTime);
        const g = 9.8; // approximation of gravitational acceleration
        this.gForce = 1.0 + (accelerationVector.length() / g);
        this.previousVelocity.copy(this.velocity);

        // Reset mouse delta
        this.mouse.deltaX = 0;
        this.mouse.deltaY = 0;
        
        // Keep player above ground
        if (this.playerJet.position.y < 10) {
            this.playerJet.position.y = 10;
            if (this.velocity.y < 0) this.velocity.y = 0;
        }
        
        // Keep player in bounds
        const maxDistance = 2500;
        if (Math.abs(this.playerJet.position.x) > maxDistance) {
            this.playerJet.position.x = Math.sign(this.playerJet.position.x) * maxDistance;
        }
        if (Math.abs(this.playerJet.position.z) > maxDistance) {
            this.playerJet.position.z = Math.sign(this.playerJet.position.z) * maxDistance;
        }
    }

    updateCamera(deltaTime) {
        if (!this.playerJet) return;

        // Desired camera position
        const desiredPosition = new THREE.Vector3(-50, 25, 0);
        desiredPosition.applyQuaternion(this.playerJet.quaternion);
        desiredPosition.add(this.playerJet.position);

        // Smoothly move the camera to the desired position
        this.camera.position.lerp(desiredPosition, 0.1);

        // Point the camera at a point slightly in front of the ship
        const lookAtPoint = new THREE.Vector3(50, 0, 0);
        lookAtPoint.applyQuaternion(this.playerJet.quaternion);
        lookAtPoint.add(this.playerJet.position);

        this.camera.lookAt(lookAtPoint);
    }

    updateTargeting() {
        if (!this.playerJet) return;

        let closestEnemy = null;
        let closestDist = Infinity;

        const screenCenter = new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2);
        const playerForward = new THREE.Vector3(1, 0, 0).applyQuaternion(this.playerJet.quaternion);

        this.enemies.forEach(enemy => {
            const enemyPos = new THREE.Vector3();
            enemy.getWorldPosition(enemyPos);

            const toEnemy = new THREE.Vector3().subVectors(enemyPos, this.playerJet.position);
            const dot = toEnemy.dot(playerForward);

            if (dot > 0) { // Check if enemy is in front of the player
                const enemyScreenPos = enemyPos.clone().project(this.camera);
                const screenX = (enemyScreenPos.x + 1) * window.innerWidth / 2;
                const screenY = (-enemyScreenPos.y + 1) * window.innerHeight / 2;

                const dist = new THREE.Vector2(screenX, screenY).distanceTo(screenCenter);

                if (dist < closestDist && dist < 200) { // 200px threshold
                    closestDist = dist;
                    closestEnemy = enemy;
                }
            }
        });

        this.targetedEnemy = closestEnemy;

        const targetBox = document.getElementById('targetBox');
        if (this.targetedEnemy) {
            const enemyPos = new THREE.Vector3();
            this.targetedEnemy.getWorldPosition(enemyPos);
            const enemyScreenPos = enemyPos.clone().project(this.camera);

            const screenX = (enemyScreenPos.x + 1) * window.innerWidth / 2;
            const screenY = (-enemyScreenPos.y + 1) * window.innerHeight / 2;

            targetBox.style.display = 'block';
            targetBox.style.left = (screenX - 25) + 'px';
            targetBox.style.top = (screenY - 25) + 'px';
            targetBox.style.width = '50px';
            targetBox.style.height = '50px';
        } else {
            targetBox.style.display = 'none';
        }
    }
    
    updateEnemyAI(enemy, deltaTime, allBullets, allMissiles) {
        if (!enemy.userData || !this.playerJet) return;
        
        const data = enemy.userData;
        const playerPos = this.playerJet.position;
        const enemyPos = enemy.position;
        const distance = playerPos.distanceTo(enemyPos);
        
        // Calculate direction to player
        const directionToPlayer = playerPos.clone().sub(enemyPos).normalize();
        
        // Update evasion timer
        data.evasionTimer = Math.max(0, data.evasionTimer - deltaTime);

        // Declare targetDirection here and initialize it
        let targetDirection = new THREE.Vector3(); // Initialize with a default vector

        // Projectile Evasion Logic
        let threatDetected = false;
        const evasionThreshold = 100; // Distance to start evading
        const evasionStrength = 0.2; // How strongly to evade (reduced)

        if (data.canEvade) { // Only apply evasion if enemy can evade
            // Check player bullets
            allBullets.forEach(bullet => {
                if (bullet.userData.isPlayer) {
                    const bulletPos = bullet.position;
                    const bulletVel = bullet.userData.velocity.clone().normalize();
                    const toEnemy = enemyPos.clone().sub(bulletPos);
                    const dot = toEnemy.dot(bulletVel);

                    if (dot > 0 && toEnemy.length() < evasionThreshold) { // Bullet is in front and close
                        // Calculate evasion direction perpendicular to bullet path
                        let evasionDirection = new THREE.Vector3();
                        if (Math.abs(bulletVel.x) > 0.1 || Math.abs(bulletVel.z) > 0.1) { // If not mostly vertical
                            evasionDirection.crossVectors(bulletVel, new THREE.Vector3(0, 1, 0)).normalize();
                        } else { // If mostly vertical, cross with X-axis
                            evasionDirection.crossVectors(bulletVel, new THREE.Vector3(1, 0, 0)).normalize();
                        }
                        
                        if (Math.random() > 0.5) evasionDirection.negate(); // Randomize evasion side
                        
                        data.attackMode = 'evade';
                        data.evasionTimer = 1.0; // Evade for 1 second
                        targetDirection = evasionDirection.multiplyScalar(evasionStrength);
                        threatDetected = true;
                    }
                }d
            });

            // Check player missiles (more aggressive evasion)
            if (!threatDetected) { // Only check missiles if no bullet threat
                allMissiles.forEach(missile => {
                    if (missile.userData.type === 'missile' && missile.userData.target === enemy) { // Missile is targeting this enemy
                        const missilePos = missile.position;
                        const missileVel = new THREE.Vector3(0, 1, 0).applyQuaternion(missile.quaternion).normalize(); // Missile's forward
                        const toEnemy = enemyPos.clone().sub(missilePos);
                        const dot = toEnemy.dot(missileVel);

                        if (dot > 0 && toEnemy.length() < evasionThreshold * 2) { // Missile is in front and closer
                            let evasionDirection = new THREE.Vector3();
                            if (Math.abs(missileVel.x) > 0.1 || Math.abs(missileVel.z) > 0.1) { // If not mostly vertical
                                evasionDirection.crossVectors(missileVel, new THREE.Vector3(0, 1, 0)).normalize();
                            } else { // If mostly vertical, cross with X-axis
                                evasionDirection.crossVectors(missileVel, new THREE.Vector3(1, 0, 0)).normalize();
                            }
                            if (Math.random() > 0.5) evasionDirection.negate();
                            
                            data.attackMode = 'evade';
                            data.evasionTimer = 2.0; // Evade for 2 seconds
                            targetDirection = evasionDirection.multiplyScalar(evasionStrength * 2); // Stronger evasion
                            threatDetected = true;
                        }
                    }
                });
            }
        } // End of if (data.canEvade)
        
        // Determine AI behavior based on distance and current mode
        // targetDirection is already declared at the top of the function

        if (data.attackMode === 'evade' && data.evasionTimer > 0) {
            // Continue current evasion (targetDirection already set by projectile evasion or proximity retreat)
        } else if (distance < data.retreatDistance) {
            // Too close - initiate retreat
            data.attackMode = 'evade'; // Use 'evade' mode for retreat as well
            data.evasionTimer = 2.0; // Retreat for 2 seconds
            targetDirection = directionToPlayer.clone().negate(); // Move away from player
            
            // Only add perpendicular movement if the enemy can evade (i.e., not heavy bomber)
            if (data.canEvade) {
                const perpendicular = new THREE.Vector3(-directionToPlayer.z, 0, directionToPlayer.x);
                perpendicular.multiplyScalar(data.circleDirection);
                targetDirection.add(perpendicular.multiplyScalar(0.2)); // Reduced perpendicular movement
            }
        } else if (distance > data.attackDistance) {
            // Too far - approach player
            data.attackMode = 'approach';
            targetDirection = directionToPlayer.clone();
        } else {
            // Good attack distance - circle around player
            data.attackMode = 'circle';
            const perpendicular = new THREE.Vector3(-directionToPlayer.z, 0, directionToPlayer.x);
            perpendicular.multiplyScalar(data.circleDirection);
            targetDirection = perpendicular.clone().multiplyScalar(0.7);
            if (Math.random() < 0.01) {
                data.circleDirection *= -1;
            }
            const distanceError = distance - data.attackDistance;
            if (Math.abs(distanceError) > 50) {
                const correction = directionToPlayer.clone().multiplyScalar(distanceError > 0 ? -0.3 : 0.3);
                targetDirection.add(correction);
            }
        }
        
        // Add some randomness for unpredictability
        targetDirection.add(new THREE.Vector3(
            (Math.random() - 0.5) * 0.2,
            (Math.random() - 0.5) * 0.1,
            (Math.random() - 0.5) * 0.2
        ));
        
        // Normalize and apply speed
        targetDirection.normalize();
        const targetVelocity = targetDirection.multiplyScalar(data.speed);
        
        // Smooth velocity transition
        data.velocity.lerp(targetVelocity, deltaTime * 0.5); // Reduced from 1.5
        
        // Apply movement
        enemy.position.add(data.velocity.clone().multiplyScalar(deltaTime));
        
        // Orient enemy jet to face movement direction
        if (data.velocity.length() > 0.1) {
            const lookDirection = data.velocity.clone().normalize();
            // Revert to simple lookAt for testing
            enemy.lookAt(enemy.position.clone().add(lookDirection));
        }
        
        // Keep enemy above ground
        if (enemy.position.y < 15) {
            enemy.position.y = 15;
            data.velocity.y = Math.max(0, data.velocity.y);
        }
        
        // Smart shooting - only shoot when player is in reasonable firing arc
        const shootDirection = playerPos.clone().sub(enemyPos).normalize();
        const enemyForward = new THREE.Vector3(1, 0, 0);
        enemyForward.applyQuaternion(enemy.quaternion);
        
        const aimDot = shootDirection.dot(enemyForward);
        
        // Shoot when player is in front and at good distance
        if (distance < 800 && distance > 150 && aimDot > 0.7 && Math.random() < data.aggressiveness * deltaTime * 0.3) {
            // Lead the target slightly
            const playerVelocity = this.velocity.clone();
            const timeToHit = distance / 1200; // Bullet speed
            const leadPosition = playerPos.clone().add(playerVelocity.multiplyScalar(timeToHit));
            const leadDirection = leadPosition.sub(enemyPos).normalize();
            
            this.createBullet(enemyPos.clone(), leadDirection, false);
        }

        // Enemy missile firing logic
        if (data.canFireMissiles && data.target && distance < 1000 && aimDot > 0.2 && Math.random() < data.missileChance) {
            // Ensure enemy doesn't spam missiles
            if (Date.now() - data.lastShot > 3000) { // 3 second cooldown
                this.createHomingMissile(enemyPos.clone(), this.playerJet, enemy); // Pass firing entity
                data.lastShot = Date.now();
            }
        }
    }
    
    updateBullets(deltaTime) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            const data = bullet.userData;
            
            // Move bullet
            bullet.position.add(data.velocity.clone().multiplyScalar(deltaTime));
            
            // Decrease life
            data.life--;
            
            // Check collisions
            let hit = false;
            
            if (data.isPlayer) {
                // Check collision with enemies
                this.enemies.forEach((enemy, enemyIndex) => {
                    if (bullet.position.distanceTo(enemy.position) < 15) {
                        // Hit enemy
                        enemy.userData.health -= data.damage;
                        this.hits++;
                        this.score += 100;
                        
                        if (enemy.userData.health <= 0) {
                            // Destroy enemy
                            this.createExplosion(enemy.position, 2);
                            this.scene.remove(enemy);
                            this.enemies.splice(enemyIndex, 1);
                            this.score += 500;
                            
                            // Clear target if destroyed
                            if (this.targetedEnemy === enemy) {
                                this.targetedEnemy = null;
                            }
                        } else {
                            this.createExplosion(bullet.position, 0.5);
                        }
                        
                        hit = true;
                    }
                });
            } else {
                // Check collision with player
                if (this.playerJet && bullet.position.distanceTo(this.playerJet.position) < 20) {
                    this.health -= data.damage;
                    this.createExplosion(bullet.position, 1);
                    hit = true;
                    
                    if (this.health <= 0) {
                        this.endMission(false);
                    }
                }
            }
            
            // Remove bullet if hit or expired
            if (hit || data.life <= 0 || bullet.position.y < -50) {
                this.scene.remove(bullet);
                this.bullets.splice(i, 1);
            }
        }
    }

    updateMissiles(deltaTime) {
        for (let i = this.missiles.length - 1; i >= 0; i--) {
            const missile = this.missiles[i];
            const data = missile.userData;

            // Homing logic
            if (data.target && (Date.now() - data.homingStartTime) < data.homingDuration) {
                const targetDirection = new THREE.Vector3().subVectors(data.target.position, missile.position).normalize();
                missile.quaternion.slerp(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), targetDirection), data.turnRate);
            }

            // Move missile forward
            const forward = new THREE.Vector3(0, 1, 0).applyQuaternion(missile.quaternion);
            missile.position.add(forward.multiplyScalar(data.speed * deltaTime));

            

            // Collision detection
            let hit = false; // Flag to indicate if missile hit something

            // Check collision with enemies
            this.enemies.forEach((enemy, enemyIndex) => {
                // Ignore collision with firing entity for a short duration
                const ignoreCollisionTime = 500; // milliseconds
                if (data.firedBy === enemy && (Date.now() - data.homingStartTime) < ignoreCollisionTime) {
                    return; // Skip collision check for the firing entity
                }

                if (missile.position.distanceTo(enemy.position) < 15) {
                    // Hit enemy
                    enemy.userData.health -= 50; // More damage than bullets
                    this.score += 200;
                    
                    if (enemy.userData.health <= 0) {
                        // Destroy enemy
                        this.createExplosion(enemy.position, 3); // Bigger explosion
                        this.scene.remove(enemy);
                        this.enemies.splice(enemyIndex, 1);
                        this.score += 1000;
                        
                        // Clear target if destroyed
                        if (this.targetedEnemy === enemy) {
                            this.targetedEnemy = null;
                        }
                    } else {
                        this.createExplosion(missile.position, 1.5);
                    }
                    
                    hit = true; // Missile hit an enemy
                }
            });

            // Check collision with player (only if missile was fired by an enemy)
            if (!hit && data.firedBy !== this.playerJet && this.playerJet && missile.position.distanceTo(this.playerJet.position) < 20) {
                this.health -= 50; // Missiles do more damage
                this.createExplosion(missile.position, 1.5);
                hit = true;
                
                if (this.health <= 0) {
                    this.endMission(false);
                }
            }

            // Remove missile if hit or expired
            if (hit || data.life <= 0) { // Removed || missile.position.y < -50 as it's not relevant for missiles
                this.scene.remove(missile);
                this.missiles.splice(i, 1);
            }
        }
    }
    
    updateExplosions(deltaTime) {
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const explosion = this.explosions[i];
            const data = explosion.userData;

            if (data.velocity) { // It's a particle trail
                explosion.position.add(data.velocity.clone().multiplyScalar(deltaTime));
                data.life--;
                if (data.life <= 0) {
                    this.scene.remove(explosion);
                    this.explosions.splice(i, 1);
                }
            } else { // It's a regular explosion
                data.age++;
                const progress = data.age / data.life;
                
                // Scale and fade explosion
                const scale = data.initialSize * (1 + progress * 2);
                explosion.scale.set(scale, scale, scale);
                
                explosion.children.forEach(child => {
                    if (child.material) {
                        child.material.opacity = 1 - progress;
                    }
                });
                
                // Remove expired explosions
                if (data.age >= data.life) {
                    this.scene.remove(explosion);
                    this.explosions.splice(i, 1);
                }
            }
        }
    }
    
    updateHUD() {
        if (this.gameState !== 'playing') return;
        
        // Update flight data
        const speed = this.velocity.length();
        const altitude = Math.max(0, this.playerJet.position.y);
        
        document.getElementById('altitudeValue').textContent = Math.round(altitude) + ' ft';
        document.getElementById('speedValue').textContent = Math.round(speed) + ' kts';
        document.getElementById('throttleValue').textContent = Math.round(this.throttle * 100) + '%';
        document.getElementById('gforceValue').textContent = this.gForce.toFixed(1) + 'g';
        
        // Update weapon info
        document.getElementById('weaponType').textContent = this.selectedWeapon.toUpperCase();
        const ammoText = this.selectedWeapon === 'cannon' ? 
            `${this.ammo.cannon}/500` : 
            `${this.ammo.missiles}/${this.maxMissiles}`;
        document.getElementById('ammoCount').textContent = ammoText;

        // Add this line to update the missile count display
        document.getElementById('missileCountDisplay').textContent = `${this.ammo.missiles}/${this.maxMissiles}`;
        
        // Update mission info
        document.getElementById('scoreDisplay').textContent = `SCORE: ${this.score}`;
        
        // Update health
        const healthPercent = Math.max(0, this.health);
        document.getElementById('healthFill').style.width = healthPercent + '%';

        // Update afterburner fuel
        if (document.getElementById('afterburnerFill')) {
            const fuelPercent = Math.max(0, (this.afterburnerFuel / this.maxAfterburnerFuel) * 100);
            document.getElementById('afterburnerFill').style.width = fuelPercent + '%';
        }
        
        // Update radar
        this.updateRadar();
    }
    
    updateRadar() {
        const canvas = document.getElementById('radarCanvas');
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radarRadius = Math.min(centerX, centerY) - 10;
        
        // Clear radar
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw radar circle
        ctx.strokeStyle = '#ff6600';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radarRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw range rings
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.5;
        for (let i = 1; i < 4; i++) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, radarRadius * i / 4, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
        
        // Draw player (center dot)
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
        ctx.fill();

        // Draw player orientation
        const playerForwardWorld = new THREE.Vector3(1, 0, 0).applyQuaternion(this.playerJet.quaternion);
        // Project to XZ plane (radar's XY)
        const playerForwardRadarX = playerForwardWorld.x;
        const playerForwardRadarY = playerForwardWorld.z; // Assuming radar Y is world Z
        const playerForwardAngle = Math.atan2(playerForwardRadarY, playerForwardRadarX);

        const orientationLineLength = 8;
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + Math.cos(playerForwardAngle) * orientationLineLength,
                   centerY + Math.sin(playerForwardAngle) * orientationLineLength);
        ctx.stroke();
        
        // Draw enemies
        if (this.playerJet) {
            this.enemies.forEach(enemy => {
                const relativePos = enemy.position.clone().sub(this.playerJet.position);
                const distance = relativePos.length();
                const maxRange = 1000;
                
                if (distance < maxRange) {
                    const radarDistance = (distance / maxRange) * radarRadius;
                    const angle = Math.atan2(relativePos.z, relativePos.x);
                    
                    const x = centerX + Math.cos(angle) * radarDistance;
                    const y = centerY + Math.sin(angle) * radarDistance;
                    
                    ctx.fillStyle = enemy === this.targetedEnemy ? '#ffff00' : '#ff0000';
                    ctx.beginPath();
                    ctx.arc(x, y, 2, 0, Math.PI * 2);
                    ctx.fill();

                    // Draw enemy orientation
                    const enemyForwardWorld = new THREE.Vector3(1, 0, 0).applyQuaternion(enemy.quaternion);
                    // Project to XZ plane (radar's XY)
                    const enemyForwardRadarX = enemyForwardWorld.x;
                    const enemyForwardRadarY = enemyForwardWorld.z; // Assuming radar Y is world Z

                    // Calculate angle relative to the enemy's position on the radar
                    // This needs to be relative to the player's forward, not absolute world forward
                    // The radar is player-centric, so enemy orientation should be relative to player's current heading
                    
                    // To get enemy's orientation relative to player's forward on radar:
                    // 1. Get enemy's world forward vector.
                    // 2. Get player's world forward vector.
                    // 3. Rotate enemy's forward vector by inverse of player's quaternion (to get it into player's local space)
                    // 4. Project that local vector onto XZ plane.

                    const playerQuaternionInverse = this.playerJet.quaternion.clone().invert();
                    const enemyForwardRelative = enemyForwardWorld.clone().applyQuaternion(playerQuaternionInverse);

                    const enemyOrientationAngle = Math.atan2(enemyForwardRelative.z, enemyForwardRelative.x);

                    const enemyOrientationLineLength = 5; // Shorter line for enemies
                    ctx.strokeStyle = enemy === this.targetedEnemy ? '#ffff00' : '#ff0000';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + Math.cos(enemyOrientationAngle) * enemyOrientationLineLength,
                               y + Math.sin(enemyOrientationAngle) * enemyOrientationLineLength);
                    ctx.stroke();
                }
            });
        }
    }
    
    startMission(missionId) {
        this.currentMission = missionId;
        const mission = this.missions[missionId - 1];

        // Create a new camera to ensure a clean state
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
        this.applySettings(); // Re-apply settings to the new camera
        
        // Reset game state
        this.score = 0;
        this.health = 100;
        this.ammo = { cannon: 500, missiles: this.maxMissiles };
        this.selectedWeapon = 'cannon';
        this.targetedEnemy = null;
        this.missionStartTime = Date.now();
        this.shotsFired = 0;
        this.hits = 0;
        
        // Clear existing objects
        this.enemies.forEach(enemy => this.scene.remove(enemy));
        this.enemies = [];
        this.bullets.forEach(bullet => this.scene.remove(bullet));
        this.bullets = [];
        this.explosions.forEach(explosion => this.scene.remove(explosion));
        this.explosions = [];
        
        // Create player jet
        if (this.playerJet) {
            this.scene.remove(this.playerJet);
        }
        this.createPlayerJet();
        
        // Create enemies
        for (let i = 0; i < mission.enemies; i++) {
            const angle = (i / mission.enemies) * Math.PI * 2;
            const distance = 500 + Math.random() * 1000;
            const position = new THREE.Vector3(
                Math.cos(angle) * distance,
                50 + Math.random() * 200,
                Math.sin(angle) * distance
            );
            
            // Randomly select an enemy type
            const enemyTypes = Object.keys(this.enemyTypes);
            const randomType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            
            this.createEnemy(position, randomType); // Pass the selected type
        }
        
        // Update UI
        document.getElementById('missionTitle').textContent = mission.name;
        document.getElementById('missionObjective').textContent = mission.objective;
        
        // Switch to game state
        this.gameState = 'playing';
        this.hideAllMenus();
        document.getElementById('hud').style.display = 'block';
        
        this.updateHUD();
    }
    
    endMission(success) {
        this.gameState = 'missionComplete';
        
        const missionTime = Math.round((Date.now() - this.missionStartTime) / 1000);
        const accuracy = this.shotsFired > 0 ? Math.round((this.hits / this.shotsFired) * 100) : 0;
        
        document.getElementById('missionResultTitle').textContent = success ? 'MISSION COMPLETE' : 'MISSION FAILED';
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('targetsDestroyed').textContent = this.hits;
        document.getElementById('accuracy').textContent = accuracy + '%';
        document.getElementById('missionTime').textContent = Math.floor(missionTime / 60) + ':' + (missionTime % 60).toString().padStart(2, '0');
        
        document.getElementById('hud').style.display = 'none';
        document.getElementById('missionResults').classList.remove('hidden');

        document.exitPointerLock();
        
        const nextMissionButton = document.getElementById('nextMissionButton');

        // Save progress and show/hide next mission button
        if (success) {
            nextMissionButton.style.display = 'block';
            const completedMissions = JSON.parse(localStorage.getItem('skywarrior_completed') || '[]');
            if (!completedMissions.includes(this.currentMission)) {
                completedMissions.push(this.currentMission);
                localStorage.setItem('skywarrior_completed', JSON.stringify(completedMissions));
            }
        } else {
            nextMissionButton.style.display = 'none';
        }
    }
    
    checkMissionComplete() {
        if (this.gameState === 'playing' && this.enemies.length === 0) {
            this.endMission(true);
        }
    }
    
    nextMission() {
        if (this.currentMission < this.missions.length) {
            this.startMission(this.currentMission + 1);
        } else {
            this.returnToMenu();
        }
    }
    
    pauseGame() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            document.getElementById('pauseMenu').classList.remove('hidden');
        }
    }
    
    resumeGame() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
            document.getElementById('pauseMenu').classList.add('hidden');
        }
    }
    
    restartMission() {
        this.startMission(this.currentMission);
    }
    
    returnToMenu() {
        this.gameState = 'menu';
        this.hideAllMenus();
        document.getElementById('mainMenu').classList.remove('hidden');
        document.getElementById('hud').style.display = 'none';
        
        // Clean up game objects
        if (this.playerJet) {
            this.scene.remove(this.playerJet);
            this.playerJet = null;
        }
        this.enemies.forEach(enemy => this.scene.remove(enemy));
        this.enemies = [];
        this.bullets.forEach(bullet => this.scene.remove(bullet));
        this.bullets = [];
        this.explosions.forEach(explosion => this.scene.remove(explosion));
        this.explosions = [];
    }
    
    showSettings() {
        this.hideAllMenus();
        document.getElementById('settingsMenu').classList.remove('hidden');
        this.loadSettingsUI();
    }
    
    hideSettings() {
        document.getElementById('settingsMenu').classList.add('hidden');
        if (this.gameState === 'menu') {
            document.getElementById('mainMenu').classList.remove('hidden');
        } else if (this.gameState === 'paused') {
            document.getElementById('pauseMenu').classList.remove('hidden');
        }
    }
    
    showInstructions() {
        this.hideAllMenus();
        document.getElementById('instructionsMenu').classList.remove('hidden');
    }
    
    hideInstructions() {
        document.getElementById('instructionsMenu').classList.add('hidden');
        document.getElementById('mainMenu').classList.remove('hidden');
    }
    
    showEnemyIntel() {
        this.hideAllMenus();
        const intelMenu = document.getElementById('enemyIntelMenu');
        const intelContent = document.getElementById('enemyIntelContent');
        intelContent.innerHTML = ''; // Clear previous content

        for (const typeKey in this.enemyTypes) {
            const typeData = this.enemyTypes[typeKey];
            const enemyDiv = document.createElement('div');
            enemyDiv.className = 'enemy-intel-entry';
            enemyDiv.innerHTML = `
                <h3 style="color: #00ffff;">${typeData.name}</h3>
                <p><strong>Type:</strong> ${typeKey.charAt(0).toUpperCase() + typeKey.slice(1)}</p>
                <p><strong>Health:</strong> ${typeData.health}</p>
                <p><strong>Speed:</strong> ${typeData.speed}</p>
                <p><strong>Abilities:</strong> ${typeData.canFireMissiles ? 'Missiles, Cannon' : 'Cannon'}</p>
                <p>${typeData.lore}</p>
                <hr style="border-color: #333; margin: 15px 0;">
            `;
            intelContent.appendChild(enemyDiv);
        }

        intelMenu.classList.remove('hidden');
    }

    hideEnemyIntel() {
        document.getElementById('enemyIntelMenu').classList.add('hidden');
        document.getElementById('mainMenu').classList.remove('hidden');
    }
    
    showAbout() {
        alert('SKY WARRIOR\nVersion 1.0\n\nA complete 3D fighter jet combat simulator\nBuilt with Three.js and software rendering\n\nProving that modern CPUs can handle\nimpressive 3D graphics without GPU acceleration!\n\nCreated by Berrry Computer\nberrry.app');
    }
    
    showMissionSelect() {
        this.hideAllMenus();
        
        const completedMissions = JSON.parse(localStorage.getItem('skywarrior_completed') || '[]');
        let html = '<h2 style="color: #ff6600; text-align: center; margin-bottom: 20px;">SELECT MISSION</h2>';
        
        this.missions.forEach((mission, index) => {
            const available = index === 0 || completedMissions.includes(index);
            const completed = completedMissions.includes(index + 1);
            
            html += `<button class="menu-button ${!available ? 'disabled' : ''}" 
                     ${available ? `onclick="game.startMission(${mission.id})"` : 'disabled'}>
                     ${mission.name} ${completed ? '✓' : ''}
                     ${!available ? ' (LOCKED)' : ''}
                     </button>`;
        });
        
        html += '<button class="menu-button" onclick="game.hideMissionSelect()">Back</button>';
        
        const menu = document.createElement('div');
        menu.id = 'missionSelectMenu';
        menu.className = 'ui-element';
        menu.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            padding: 30px;
            border: 2px solid #ff6600;
            border-radius: 10px;
            text-align: center;
            max-width: 500px;
            max-height: 80vh;
            overflow-y: auto;
        `;
        menu.innerHTML = html;
        
        document.getElementById('ui').appendChild(menu);
    }
    
    hideMissionSelect() {
        const menu = document.getElementById('missionSelectMenu');
        if (menu) menu.remove();
        document.getElementById('mainMenu').classList.remove('hidden');
    }
    
    hideAllMenus() {
        const menus = ['mainMenu', 'settingsMenu', 'instructionsMenu', 'pauseMenu', 'missionResults', 'enemyIntelMenu']; // Added enemyIntelMenu
        menus.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.classList.add('hidden');
        });
        
        // Remove dynamic menus
        const dynamicMenu = document.getElementById('missionSelectMenu');
        if (dynamicMenu) dynamicMenu.remove();
    }
    
    loadSettings() {
        const saved = localStorage.getItem('skywarrior_settings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
    }
    
    saveSettings() {
        // Get values from UI
        this.settings.renderDistance = parseInt(document.getElementById('renderDistance').value);
        this.settings.particleEffects = document.getElementById('particleEffects').value;
        this.settings.shadowQuality = document.getElementById('shadowQuality').value;
        this.settings.masterVolume = parseInt(document.getElementById('masterVolume').value);
        this.settings.sfxVolume = parseInt(document.getElementById('sfxVolume').value);
        this.settings.musicVolume = parseInt(document.getElementById('musicVolume').value);
        this.settings.mouseSensitivity = parseFloat(document.getElementById('mouseSensitivity').value);
        this.settings.invertY = document.getElementById('invertY').checked;
        this.settings.controlMode = document.getElementById('controlMode').value;
        
        localStorage.setItem('skywarrior_settings', JSON.stringify(this.settings));
        
        // Apply settings
        this.applySettings();
        this.hideSettings();
    }
    
    loadSettingsUI() {
        document.getElementById('renderDistance').value = this.settings.renderDistance;
        document.getElementById('particleEffects').value = this.settings.particleEffects;
        document.getElementById('shadowQuality').value = this.settings.shadowQuality;
        document.getElementById('masterVolume').value = this.settings.masterVolume;
        document.getElementById('sfxVolume').value = this.settings.sfxVolume;
        document.getElementById('musicVolume').value = this.settings.musicVolume;
        document.getElementById('mouseSensitivity').value = this.settings.mouseSensitivity;
        document.getElementById('invertY').checked = this.settings.invertY;
        document.getElementById('controlMode').value = this.settings.controlMode;
    }
    
    applySettings() {
        // Apply render distance
        if (this.camera) {
            this.camera.far = this.settings.renderDistance;
            this.camera.updateProjectionMatrix();
        }
        
        // Apply fog
        if (this.scene.fog) {
            this.scene.fog.far = this.settings.renderDistance;
        }
        
        // Other settings would be applied here in a full implementation
    }
    
    setupUI() {
        // Any additional UI setup can go here
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.gameState === 'playing') {
            const deltaTime = 1/60; // Fixed timestep for consistent physics
            
            this.updatePlayerPhysics(deltaTime);
            this.updateCamera(deltaTime);
            this.updateTargeting();
            
            this.enemies.forEach(enemy => {
                this.updateEnemyAI(enemy, deltaTime, this.bullets, this.missiles);
            });
            
            this.updateBullets(deltaTime);
            this.updateMissiles(deltaTime);
            this.updateExplosions(deltaTime);
            this.updateHUD();
            this.checkMissionComplete();
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize game when page loads
window.game = null;
window.addEventListener('load', () => {
    window.game = new SkyWarriorGame();
});

// Add footer link
document.addEventListener('DOMContentLoaded', () => {
    const footer = document.createElement('div');
    footer.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        z-index: 10001;
        font-size: 12px;
        color: #666;
    `;
    footer.innerHTML = '<a href="https://berrry.app" target="_blank" style="color: #ff6600; text-decoration: none;">Made with Berrry</a>';
    document.body.appendChild(footer);
});