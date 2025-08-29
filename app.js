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
        this.ammo = { cannon: 500, missiles: 20 };
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
                case 'KeyF':
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
                case 'Digit2':
                    this.selectWeapon('missiles');
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

        // Detach camera from old jet if it exists
        if (this.camera.parent) {
            this.camera.parent.remove(this.camera);
        }

        // Add camera to the jet
        this.playerJet.add(this.camera);

        // Set position and orientation relative to the jet
        this.camera.position.set(-40, 15, 0);
        this.camera.lookAt(this.playerJet.position);
        
        // Initialize velocity
        this.velocity.set(0, 0, 0);
    }
    
    createEnemy(position) {
        const enemyGroup = new THREE.Group();
        const enemyMaterial = new THREE.MeshLambertMaterial({ color: 0xff4444, flatShading: true });

        // Central Body
        const bodyGeom = new THREE.DodecahedronGeometry(5);
        const body = new THREE.Mesh(bodyGeom, enemyMaterial);
        enemyGroup.add(body);

        // Spikes
        for (let i = 0; i < 4; i++) {
            const spikeGeom = new THREE.CylinderGeometry(0, 0.8, 10, 4);
            const spike = new THREE.Mesh(spikeGeom, enemyMaterial);
            const angle = (i / 4) * Math.PI * 2;
            spike.position.set(Math.cos(angle) * 6, 0, Math.sin(angle) * 6);
            spike.lookAt(enemyGroup.position);
            enemyGroup.add(spike);
        }

        enemyGroup.position.copy(position);
        
        // Improved AI properties
        enemyGroup.userData = {
            type: 'enemy',
            health: 100,
            speed: 120 + Math.random() * 80,
            aggressiveness: 0.4 + Math.random() * 0.6,
            lastShot: 0,
            target: this.playerJet,
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 150,
                (Math.random() - 0.5) * 30,
                (Math.random() - 0.5) * 150
            ),
            targetDirection: new THREE.Vector3(),
            // New AI properties for better behavior
            attackDistance: 200 + Math.random() * 300, // Preferred attack distance
            retreatDistance: 100, // Distance to retreat when too close
            circleDirection: Math.random() > 0.5 ? 1 : -1, // Circling direction
            lastPlayerDirection: new THREE.Vector3(),
            evasionTimer: 0,
            attackMode: 'approach' // approach, attack, evade, circle
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
        if (this.selectedWeapon === 'missiles' && this.ammo.missiles > 0 && this.targetedEnemy) {
            // Simplified missile - just a fast bullet that homes in
            const direction = new THREE.Vector3(1, 0, 0);
            direction.applyQuaternion(this.playerJet.quaternion);
            
            const missilePosition = this.playerJet.position.clone();
            missilePosition.add(direction.clone().multiplyScalar(25));
            
            this.createBullet(missilePosition, direction, true);
            this.ammo.missiles--;
            this.shotsFired++;
            
            this.updateHUD();
        }
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
    
    updateEnemyAI(enemy, deltaTime) {
        if (!enemy.userData || !this.playerJet) return;
        
        const data = enemy.userData;
        const playerPos = this.playerJet.position;
        const enemyPos = enemy.position;
        const distance = playerPos.distanceTo(enemyPos);
        
        // Calculate direction to player
        const directionToPlayer = playerPos.clone().sub(enemyPos).normalize();
        
        // Update evasion timer
        data.evasionTimer = Math.max(0, data.evasionTimer - deltaTime);
        
        // Determine AI behavior based on distance and current mode
        let targetDirection = new THREE.Vector3();
        
        if (distance < data.retreatDistance) {
            // Too close - retreat and evade
            data.attackMode = 'evade';
            targetDirection = directionToPlayer.clone().negate(); // Move away from player
            
            // Add perpendicular movement for evasion
            const perpendicular = new THREE.Vector3(-directionToPlayer.z, 0, directionToPlayer.x);
            perpendicular.multiplyScalar(data.circleDirection);
            targetDirection.add(perpendicular.multiplyScalar(0.8));
            
            data.evasionTimer = 2.0; // Set evasion timer
            
        } else if (distance > data.attackDistance && data.attackMode !== 'evade') {
            // Too far - approach player
            data.attackMode = 'approach';
            targetDirection = directionToPlayer.clone();
            
        } else if (data.evasionTimer <= 0) {
            // Good attack distance - circle around player
            data.attackMode = 'circle';
            
            // Create circular movement around player
            const perpendicular = new THREE.Vector3(-directionToPlayer.z, 0, directionToPlayer.x);
            perpendicular.multiplyScalar(data.circleDirection);
            
            // Mix perpendicular movement with slight approach/retreat
            targetDirection = perpendicular.clone().multiplyScalar(0.7);
            
            // Occasionally change circle direction
            if (Math.random() < 0.01) {
                data.circleDirection *= -1;
            }
            
            // Add slight movement toward/away to maintain distance
            const distanceError = distance - data.attackDistance;
            if (Math.abs(distanceError) > 50) {
                const correction = directionToPlayer.clone().multiplyScalar(distanceError > 0 ? -0.3 : 0.3);
                targetDirection.add(correction);
            }
        } else {
            // Continue evasion
            targetDirection = directionToPlayer.clone().negate();
            const perpendicular = new THREE.Vector3(-directionToPlayer.z, 0, directionToPlayer.x);
            perpendicular.multiplyScalar(data.circleDirection);
            targetDirection.add(perpendicular.multiplyScalar(0.8));
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
        data.velocity.lerp(targetVelocity, deltaTime * 1.5);
        
        // Apply movement
        enemy.position.add(data.velocity.clone().multiplyScalar(deltaTime));
        
        // Orient enemy jet to face movement direction
        if (data.velocity.length() > 0.1) {
            const lookDirection = data.velocity.clone().normalize();
            const targetPosition = enemy.position.clone().add(lookDirection);
            enemy.lookAt(targetPosition);
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
            `${this.ammo.missiles}/20`;
        document.getElementById('ammoCount').textContent = ammoText;
        
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
        this.ammo = { cannon: 500, missiles: 20 };
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
            this.createEnemy(position);
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
        const menus = ['mainMenu', 'settingsMenu', 'instructionsMenu', 'pauseMenu', 'missionResults'];
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
            
            this.enemies.forEach(enemy => {
                this.updateEnemyAI(enemy, deltaTime);
            });
            
            this.updateBullets(deltaTime);
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