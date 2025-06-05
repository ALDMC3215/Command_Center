        // --- Global Variables and Setup ---
        let scene, camera, renderer, globe, controls, ambientLight, directionalLight, sunMesh;
        let cloudMesh, atmosphereMesh, starField;
        let lastMarkerCoords = null, clickedEarthCoords = null;
        const globeContainer = document.getElementById('globeContainer');
        const loadingOverlay = document.getElementById('loadingOverlay');
        const loadingStatus = document.getElementById('loadingStatus');
        const initialCameraPosition = new THREE.Vector3(0, 20, 220);

        const EARTH_RADIUS = 100;
        const CLOUD_ALTITUDE = 1.2;
        const ATMOSPHERE_THICKNESS = 10;
        const SUN_DISTANCE = 800;

        let textureLoader, raycaster, mouse;
        let totalAssetsToAttempt = 0;
        let assetsAttempted = 0;
        let loadingTimeout;

        // UI Elements
        const getMarkerInfoButton = document.getElementById('getMarkerInfoButton');
        const geminiInfoPanel = document.getElementById('geminiInfoPanel');
        const geminiResponseText = document.getElementById('geminiResponseText');
        const geminiLoadingIndicator = document.getElementById('geminiLoadingIndicator');
        const toggleRotationButton = document.getElementById('toggleRotationButton');
        const controlsContent = document.getElementById('controlsContent');
        const togglePanelButton = document.getElementById('togglePanelButton');
        const panelIconMinimize = document.getElementById('panelIconMinimize');
        const panelIconExpand = document.getElementById('panelIconExpand');
        const togglePanelHeader = document.getElementById('togglePanelHeader');
        const clickedCoordsDisplay = document.getElementById('clickedCoordsDisplay');
        const selectedLatText = document.getElementById('selectedLat');
        const selectedLonText = document.getElementById('selectedLon');
        const clickableGlobeInfo = document.getElementById('clickableGlobeInfo');
        const bumpScaleSlider = document.getElementById('bumpScale');

        // --- Asset Loading Manager ---
        function assetAttemptFinished(name, success = true) {
            assetsAttempted++;
            loadingStatus.textContent = `Loading ${name}... (${assetsAttempted}/${totalAssetsToAttempt})${success ? '' : ' - FAILED (Using Default)'}`;
            if (assetsAttempted >= totalAssetsToAttempt) {
                clearTimeout(loadingTimeout);
                if (!loadingOverlay.classList.contains('hidden')) {
                    loadingOverlay.classList.add('hidden');
                    clickableGlobeInfo.classList.remove('hidden');
                    showMessage("Hyper Globe Ready! Some textures might be placeholders.", "success", 5000);
                }
            }
        }

        function loadOptionalTexture(url, name, materialToUpdate, mapType = 'map', onLoadSuccessCallback = () => { }) {
            totalAssetsToAttempt++;
            textureLoader.load(url,
                (texture) => {
                    console.log(`${name} loaded successfully from ${url}.`);
                    if (materialToUpdate) {
                        materialToUpdate[mapType] = texture;
                        if (mapType === 'bumpMap' && bumpScaleSlider) {
                            bumpScaleSlider.disabled = false;
                            bumpScaleSlider.value = globe.material.bumpScale || 5.0; // Set initial value if map loads
                        }
                        materialToUpdate.needsUpdate = true;
                    }
                    assetAttemptFinished(name, true);
                    onLoadSuccessCallback(texture);
                },
                undefined,
                (err) => {
                    console.error(`Error loading ${name} from ${url}:`, err);
                    assetAttemptFinished(name, false);
                    showMessage(`Texture ${name} failed. Using default.`, "warning", 3000);
                    if (mapType === 'bumpMap' && bumpScaleSlider) bumpScaleSlider.disabled = true;
                    onLoadSuccessCallback(null); // Indicate failure
                }
            );
        }

        // --- Initialization ---
        function init() {
            loadingStatus.textContent = "Initializing scene...";
            scene = new THREE.Scene();
            camera = new THREE.PerspectiveCamera(55, globeContainer.clientWidth / globeContainer.clientHeight, 0.1, SUN_DISTANCE * 2.5);
            camera.position.copy(initialCameraPosition);

            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(globeContainer.clientWidth, globeContainer.clientHeight);
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            globeContainer.appendChild(renderer.domElement);

            raycaster = new THREE.Raycaster();
            mouse = new THREE.Vector2();

            // Lighting
            ambientLight = new THREE.AmbientLight(document.getElementById('ambientLightColor').value, parseFloat(document.getElementById('ambientLightIntensity').value));
            scene.add(ambientLight);

            directionalLight = new THREE.DirectionalLight(0xffffff, parseFloat(document.getElementById('sunIntensity').value));
            directionalLight.position.set(-SUN_DISTANCE, SUN_DISTANCE / 2, SUN_DISTANCE / 3);
            directionalLight.castShadow = true;
            directionalLight.shadow.mapSize.width = 2048;
            directionalLight.shadow.mapSize.height = 2048;
            directionalLight.shadow.camera.near = SUN_DISTANCE / 2;
            directionalLight.shadow.camera.far = SUN_DISTANCE * 2;
            directionalLight.shadow.camera.left = -EARTH_RADIUS * 1.5;
            directionalLight.shadow.camera.right = EARTH_RADIUS * 1.5;
            directionalLight.shadow.camera.top = EARTH_RADIUS * 1.5;
            directionalLight.shadow.camera.bottom = -EARTH_RADIUS * 1.5;
            scene.add(directionalLight);

            // Sun Mesh (visual representation)
            const sunGeometry = new THREE.SphereGeometry(30, 32, 32);
            const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffddaa, fog: false });
            sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
            sunMesh.position.copy(directionalLight.position);
            scene.add(sunMesh);

            textureLoader = new THREE.TextureLoader();

// Starry Background - Default to solid color
const starGeometry = new THREE.SphereGeometry(SUN_DISTANCE * 1.2, 64, 64);
const starMaterial = new THREE.MeshBasicMaterial({ color: 0x0A0A1A, side: THREE.BackSide, fog: false, depthWrite: false });
starField = new THREE.Mesh(starGeometry, starMaterial);
loadOptionalTexture('https://threejs.org/examples/textures/eso_dark.jpg', 'Starfield', starMaterial);
scene.add(starField);

            scene.add(starField);

            // Globe - Default to solid color
            const globeGeometry = new THREE.SphereGeometry(EARTH_RADIUS, 128, 128);
            const globeMaterial = new THREE.MeshPhongMaterial({
                color: 0x3B82F6, // Default blue color
                shininess: 10,
                transparent: false,
                depthWrite: true
            });
loadOptionalTexture('https://threejs.org/examples/textures/earth_atmos_2048.jpg', 'Earth Color Map', globeMaterial, 'map');
loadOptionalTexture('https://threejs.org/examples/textures/earth_topology_512.jpg', 'Earth Bump Map', globeMaterial, 'bumpMap');
loadOptionalTexture('https://threejs.org/examples/textures/earth_specular_2048.jpg', 'Earth Specular Map', globeMaterial, 'specularMap');

globe = new THREE.Mesh(globeGeometry, globeMaterial);
globe.receiveShadow = true;
globe.castShadow = true;
scene.add(globe);


            // Cloud Layer - Default to semi-transparent color
            const cloudGeometry = new THREE.SphereGeometry(EARTH_RADIUS + CLOUD_ALTITUDE, 128, 128);
            const cloudMaterial = new THREE.MeshPhongMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.25,
                blending: THREE.NormalBlending,
                depthWrite: false,
            });
loadOptionalTexture('https://threejs.org/examples/textures/earth_clouds_1024.png', 'Clouds', cloudMaterial, 'map', (texture) => {
    if (texture) {
        cloudMaterial.opacity = 0.35;
        cloudMaterial.alphaTest = 0.05;
    }
});

            cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
            cloudMesh.receiveShadow = true;
            scene.add(cloudMesh);

            // Atmospheric Glow (Fresnel-like)
            const atmosphereGeometry = new THREE.SphereGeometry(EARTH_RADIUS + ATMOSPHERE_THICKNESS, 128, 128);
            const atmosphereMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    "c": { value: 0.1 },
                    "p": { value: 2.5 },
                    glowColor: { value: new THREE.Color(0x60a5fa) },
                    viewVector: { value: camera.position }
                },
                vertexShader: `
                    uniform vec3 viewVector;
                    uniform float c;
                    uniform float p;
                    varying float intensity;
                    void main() {
                        vec3 vNormal = normalize( normalMatrix * normal );
                        vec3 vNormCam = normalize( cameraPosition - position ); 
                        intensity = pow( c + dot(vNormal, vNormCam), p ); 
                        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
                    }
                `,
                fragmentShader: `
                    uniform vec3 glowColor;
                    varying float intensity;
                    void main() {
                        float alpha = clamp(intensity, 0.0, 0.6); 
                        gl_FragColor = vec4( glowColor, alpha );
                    }
                `,
                side: THREE.BackSide,
                blending: THREE.AdditiveBlending,
                transparent: true,
                depthWrite: false
            });
            atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
            scene.add(atmosphereMesh);

            // OrbitControls
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.03;
            controls.minDistance = EARTH_RADIUS + 10;
            controls.maxDistance = SUN_DISTANCE * 0.8;
            controls.autoRotate = true;
            controls.autoRotateSpeed = parseFloat(document.getElementById('rotationSpeed').value);
            controls.target.set(0, 0, 0);

            // Event Listeners
            setupEventListeners();

            // Initial UI state
            updateRotationButtonText();
            panelIconMinimize.classList.remove('hidden');
            panelIconExpand.classList.add('hidden');
            controlsContent.classList.remove('hidden');

            // Safety timeout for loading overlay
            if (totalAssetsToAttempt === 0) {
                assetAttemptFinished("Core Scene (No Textures)", true);
            } else {
                loadingTimeout = setTimeout(() => {
                    if (!loadingOverlay.classList.contains('hidden')) {
                        loadingOverlay.classList.add('hidden');
                        clickableGlobeInfo.classList.remove('hidden');
                        showMessage("Globe is ready. Some visual assets might be missing due to loading issues.", "warning", 7000);
                        console.warn("Loading overlay timed out. Some assets may not have loaded.");
                    }
                }, 5000); // Shortened timeout as we expect failures quickly
            }

            animate();
        }

        function setupEventListeners() {
            // Panel Controls
            document.getElementById('ambientLightColor').addEventListener('input', (event) => ambientLight.color.set(event.target.value));
            document.getElementById('ambientLightIntensity').addEventListener('input', (event) => ambientLight.intensity = parseFloat(event.target.value));
            document.getElementById('sunIntensity').addEventListener('input', (event) => directionalLight.intensity = parseFloat(event.target.value));
            bumpScaleSlider.addEventListener('input', (event) => {
                if (globe && globe.material && globe.material.bumpMap) {
                    globe.material.bumpScale = parseFloat(event.target.value);
                }
            });
            document.getElementById('rotationSpeed').addEventListener('input', (event) => { if (controls) controls.autoRotateSpeed = parseFloat(event.target.value); });

            document.getElementById('toggleRotationButton').addEventListener('click', handleToggleRotation);
            document.getElementById('toggleSunButton').addEventListener('click', () => { if (sunMesh) sunMesh.visible = !sunMesh.visible; directionalLight.visible = sunMesh.visible; showMessage(`Sun visibility ${sunMesh.visible ? 'ON' : 'OFF'}.`, "info"); });
            document.getElementById('toggleCloudsButton').addEventListener('click', () => { if (cloudMesh) cloudMesh.visible = !cloudMesh.visible; showMessage(`Clouds ${cloudMesh.visible ? 'ON' : 'OFF'}.`, "info"); });
            document.getElementById('toggleAtmosphereButton').addEventListener('click', () => { if (atmosphereMesh) atmosphereMesh.visible = !atmosphereMesh.visible; showMessage(`Atmosphere ${atmosphereMesh.visible ? 'ON' : 'OFF'}.`, "info"); });

            document.getElementById('addRandomMarkerButton').addEventListener('click', addRandomMarker);
            document.getElementById('resetViewButton').addEventListener('click', resetView);
            getMarkerInfoButton.addEventListener('click', () => fetchGeoInfoFromGemini(clickedEarthCoords || lastMarkerCoords));

            const panelToggleElements = [togglePanelButton, togglePanelHeader];
            panelToggleElements.forEach(el => el.addEventListener('click', toggleControlsPanel));

            window.addEventListener('resize', onWindowResize, false);
            // Globe click listener
            globeContainer.addEventListener('click', onGlobeClick, false);
        }

        // --- Animation Loop ---
        function animate() {
            requestAnimationFrame(animate);
            controls.update();

            if (cloudMesh && cloudMesh.visible) cloudMesh.rotation.y += 0.0003;
            if (starField) starField.rotation.y -= 0.00005;

            if (atmosphereMesh && atmosphereMesh.material.uniforms.viewVector) {
                atmosphereMesh.material.uniforms.viewVector.value.copy(camera.position);
            }
            renderer.render(scene, camera);
        }

        // --- Event Handlers ---
        function onWindowResize() {
            camera.aspect = globeContainer.clientWidth / globeContainer.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(globeContainer.clientWidth, globeContainer.clientHeight);
        }

        function handleToggleRotation() {
            controls.autoRotate = !controls.autoRotate;
            updateRotationButtonText();
            showMessage(controls.autoRotate ? "Globe rotation resumed." : "Globe rotation paused.", "info");
        }

        function updateRotationButtonText() {
            const icon = toggleRotationButton.querySelector('i');
            if (controls.autoRotate) {
                toggleRotationButton.innerHTML = '<i class="fas fa-pause"></i>Pause Rotation';
            } else {
                toggleRotationButton.innerHTML = '<i class="fas fa-play"></i>Resume Rotation';
            }
        }

        function toggleControlsPanel() {
            const isHidden = controlsContent.classList.toggle('hidden');
            panelIconMinimize.classList.toggle('hidden', isHidden);
            panelIconExpand.classList.toggle('hidden', !isHidden);
            showMessage(isHidden ? "Controls minimized." : "Controls expanded.", "info", 1500);
        }

        function onGlobeClick(event) {
            event.preventDefault();
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObject(globe);

            if (intersects.length > 0) {
                const point = intersects[0].point;
                const phi = Math.acos(point.y / EARTH_RADIUS);
                const theta = Math.atan2(point.x, point.z);

                let lat = (Math.PI / 2 - phi) * (180 / Math.PI);
                let lon = theta * (180 / Math.PI);

                if (lon < -180) lon += 360;
                if (lon > 180) lon -= 360;

                clickedEarthCoords = { lat: parseFloat(lat.toFixed(4)), lon: parseFloat(lon.toFixed(4)) };

                selectedLatText.textContent = clickedEarthCoords.lat;
                selectedLonText.textContent = clickedEarthCoords.lon;
                clickedCoordsDisplay.classList.remove('hidden');
                getMarkerInfoButton.classList.remove('hidden');
                getMarkerInfoButton.innerHTML = '<i class="fas fa-info-circle"></i>Get Info (Clicked Spot)';

                addTemporaryMarker(point);
                showMessage(`Location Clicked: Lat ${clickedEarthCoords.lat}, Lon ${clickedEarthCoords.lon}`, "info");
            }
        }

        let tempMarker;
        function addTemporaryMarker(position) {
            if (tempMarker) scene.remove(tempMarker);
            const markerGeometry = new THREE.SphereGeometry(1, 16, 16);
            const markerMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.8 });
            tempMarker = new THREE.Mesh(markerGeometry, markerMaterial);
            tempMarker.position.copy(position);
            scene.add(tempMarker);
            setTimeout(() => {
                if (tempMarker) scene.remove(tempMarker);
                tempMarker = null;
            }, 5000);
        }


        // --- Custom Functions ---
        function sphericalToCartesian(radius, lat, lon) {
            const phi = (90 - lat) * (Math.PI / 180);
            const theta = (lon + 180) * (Math.PI / 180);
            const x = -(radius * Math.sin(phi) * Math.cos(theta));
            const y = radius * Math.cos(phi);
            const z = radius * Math.sin(phi) * Math.sin(theta);
            return new THREE.Vector3(x, y, z);
        }

        function addRandomMarker() {
            const markerRadius = 1.2;
            const markerGeometry = new THREE.SphereGeometry(markerRadius, 24, 24);
            const markerMaterial = new THREE.MeshPhongMaterial({
                color: 0xff3333,
                emissive: 0x660000,
                shininess: 40,
                depthTest: false
            });
            const marker = new THREE.Mesh(markerGeometry, markerMaterial);

            const lat = Math.random() * 180 - 90;
            const lon = Math.random() * 360 - 180;
            const position = sphericalToCartesian(EARTH_RADIUS + CLOUD_ALTITUDE + markerRadius, lat, lon);
            marker.position.copy(position);
            marker.renderOrder = 1;
            scene.add(marker);

            lastMarkerCoords = { lat: parseFloat(lat.toFixed(4)), lon: parseFloat(lon.toFixed(4)) };
            clickedEarthCoords = null;

            clickedCoordsDisplay.classList.add('hidden');
            getMarkerInfoButton.classList.remove('hidden');
            getMarkerInfoButton.innerHTML = '<i class="fas fa-info-circle"></i>Get Info (Random Marker)';

            showMessage(`📍 Random Marker Added: Lat ${lastMarkerCoords.lat}, Lon ${lastMarkerCoords.lon}.`, "success");
        }

        function resetView() {
            controls.reset();
            camera.position.copy(initialCameraPosition);
            controls.target.set(0, 0, 0);
            controls.update();
            controls.autoRotate = true;
            updateRotationButtonText();

            getMarkerInfoButton.classList.add('hidden');
            geminiInfoPanel.classList.add('hidden');
            geminiResponseText.textContent = '';
            lastMarkerCoords = null;
            clickedEarthCoords = null;
            clickedCoordsDisplay.classList.add('hidden');
            if (tempMarker) scene.remove(tempMarker); tempMarker = null;
            showMessage("🔄 View Reset. Globe rotation enabled.", "info");
        }

        // --- Gemini API Integration ---
        async function fetchGeoInfoFromGemini(coordsToFetch) {
            if (!coordsToFetch) {
                showMessage("No location selected. Click on the globe or add a random marker.", "warning");
                return;
            }

            geminiInfoPanel.classList.remove('hidden');
            geminiLoadingIndicator.classList.remove('hidden');
            geminiResponseText.textContent = '';
            geminiResponseText.classList.add('hidden');

            const prompt = `You are a concise geographical assistant. Given latitude ${coordsToFetch.lat} and longitude ${coordsToFetch.lon}, provide an engaging, brief description (1-2 short paragraphs, max 100 words) of this location. Highlight key geographical features, nearby cities/landmarks, or interesting facts. If oceanic, describe the ocean region. Be informative yet succinct.`;

            let chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
            const payload = { contents: chatHistory };
            const apiKey = "";
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`API Error (${response.status}): ${errorData?.error?.message || response.statusText}`);
                }
                const result = await response.json();
                if (result.candidates && result.candidates[0]?.content?.parts?.[0]?.text) {
                    geminiResponseText.textContent = result.candidates[0].content.parts[0].text;
                    showMessage("Location insights loaded!", "success");
                } else {
                    throw new Error("Invalid response structure from Gemini API.");
                }
            } catch (error) {
                console.error("Error fetching data from Gemini:", error);
                geminiResponseText.textContent = `Error: ${error.message}. Please try again.`;
                showMessage(`Error fetching insights: ${error.message}`, "error", 5000);
            } finally {
                geminiLoadingIndicator.classList.add('hidden');
                geminiResponseText.classList.remove('hidden');
            }
        }

        // --- Utility for Messages ---
        function showMessage(message, type = "info", duration = 3000) {
            const messageBox = document.getElementById('customMessageBox');
            if (!messageBox) return;
            messageBox.textContent = message;

            messageBox.style.backgroundColor = '#1e293b'; // Default (Slate 800)
            if (type === "success") messageBox.style.backgroundColor = '#059669'; // Emerald 600
            else if (type === "error") messageBox.style.backgroundColor = '#be123c';   // Rose 700
            else if (type === "warning") messageBox.style.backgroundColor = '#d97706'; // Amber 600

            messageBox.classList.add('show');
            let transformTimeout = setTimeout(() => {
                messageBox.style.transform = 'translateX(-50%) translateY(0)';
            }, 50);

            let hideTimeout = setTimeout(() => {
                messageBox.style.transform = 'translateX(-50%) translateY(120%)';
                let removeShowTimeout = setTimeout(() => {
                    messageBox.classList.remove('show');
                }, 400);
                messageBox.dataset.removeShowTimeout = removeShowTimeout.toString();
            }, duration);

            if (messageBox.dataset.transformTimeout) clearTimeout(parseInt(messageBox.dataset.transformTimeout));
            if (messageBox.dataset.hideTimeout) clearTimeout(parseInt(messageBox.dataset.hideTimeout));
            if (messageBox.dataset.removeShowTimeout) clearTimeout(parseInt(messageBox.dataset.removeShowTimeout));

            messageBox.dataset.transformTimeout = transformTimeout.toString();
            messageBox.dataset.hideTimeout = hideTimeout.toString();
        }

        // --- Start the application ---
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
