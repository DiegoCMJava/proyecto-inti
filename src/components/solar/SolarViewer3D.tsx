import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { useSolarContext } from "@/context/SolarContext";
import type { SolarHeliographicCoordinates } from "@/types/solar";

function parseLocation(locStr?: string): SolarHeliographicCoordinates | null {
    if (!locStr) return null;
    const match = locStr.match(/([NS])(\d+)([EOW])(\d+)/i);
    if (!match) return null;
    let lat = parseInt(match[2], 10);
    if (match[1].toUpperCase() === "S") lat = -lat;
    let lon = parseInt(match[4], 10);
    const dir = match[3].toUpperCase();
    if ( dir === "O" || dir === "W") lon = -lon;
    return {lat, lon};

}

function createTextSprite(
    text: string,
    options: {
        fontSize?: number;
        textColor?: string;
        bgColor?: string;
        borderColor?: string;
        scale?: number;

    } = {}
): THREE.Sprite {
    const {
        fontSize = 36,
        textColor = "#fcd34d",
        bgColor ="rgba(9, 12, 18, 0.75)",
        borderColor = "rgba(245, 158, 11, 0.5)",
        scale = 1.2,
    } = options;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d")!;
    const font = `bold ${fontSize}px monospace`;
    context.font = font;

    const metrics = context.measureText(text);
    const paddingX = 28;
    const paddingY = 18;
    canvas.width = Math.ceil(metrics.width + paddingX * 2);
    canvas.height = Math.ceil(fontSize + paddingY * 2);

    context.fillStyle = bgColor;
    context.strokeStyle = borderColor;
    context.lineWidth = 4;
    const radius = 16;
    context.beginPath();
    context.roundRect(2, 2, canvas.width - 4, canvas.height - 4, radius);
    context.fill();
    context.stroke();
    
    context.font = font;
    context.fillStyle = textColor;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, canvas.width / 2, canvas.height / 2 + 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false});
    
    const sprite = new THREE.Sprite(material);
    const aspect = canvas.width / canvas.height;
    sprite.scale.set(scale * aspect, scale, 1);
    return sprite;
}
export function SolarViewer3D(){
    const containerRef = useRef<HTMLDivElement>(null);
    const { state: { selectedFlare } } = useSolarContext();

    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer  | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const sunMeshRef = useRef<THREE.Mesh | null>(null);

    const flareGroupRef = useRef<THREE.Group | null>(null);
    const pulseRingRef = useRef<THREE.Mesh | null>(null);
    const flareLightRef = useRef<THREE.PointLight | null>(null);
    const flareLabelRef = useRef<THREE.Sprite | null>(null);
    const targetRotationRef = useRef<{ x: number; y: number } | null>(null);

    useEffect(() => {
        const container = containerRef.current;
        if(!container) return;

        const witdth = container.clientWidth || 600;
        const height = container.clientHeight || 520;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x05070a); 
        sceneRef.current = scene;
        
        const camera = new THREE.PerspectiveCamera(45, witdth / height, 0.1, 100);
        camera.position.z = 12.9;
        cameraRef.current = camera;
        
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance"});
        renderer.setSize(witdth, height, false);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;

        renderer.domElement.style.position = "absolute";
        renderer.domElement.style.top = "0";
        renderer.domElement.style.left = "0";
        renderer.domElement.style.width = "100%";
        renderer.domElement.style.height = "100%";
        renderer.domElement.style.display = "block";

        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;
        
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 6.5;
        controls.maxDistance = 25;
        controlsRef.current = controls;

        scene.add(new THREE.AmbientLight(0xffedd5, 0.6));
        const keyLight = new THREE.PointLight(0xffaa00, 2, 100);
        keyLight.position.set(12, 8, 15);
        scene.add(keyLight);

        const textureLoader = new THREE.TextureLoader();
        const sunTexture = textureLoader.load("/textures/sun.jpeg");
        const sunGeometry = new THREE.SphereGeometry(4, 48, 48);
        const sunMaterial = new THREE.MeshStandardMaterial({ map: sunTexture, emissiveMap: sunTexture, emissive: new THREE.Color(0xff8800), emissiveIntensity: 0.85, roughness: 0.7});
        
        const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
        scene.add(sunMesh);
        sunMeshRef.current = sunMesh;

        const atmosphereGeom = new THREE.SphereGeometry(4.25, 64, 64);
        const atmosphereMat = new THREE.MeshBasicMaterial({ color: 0xff6b00, transparent: true, opacity: 0.14, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false });
        const atmosphereMesh = new THREE.Mesh(atmosphereGeom, atmosphereMat);
        sunMesh.add(atmosphereMesh);

        const cardinalsRadius = 4.65;
        const cardinals = [
            { label: "N", pos: [0, cardinalsRadius, 0]},
            { label: "S", pos: [0, -cardinalsRadius, 0]},
            { label: "E", pos: [cardinalsRadius, 0, 0]},
            { label: "O", pos: [-cardinalsRadius, 0, 0]},
        ];

        const cardinalSprites: THREE.Sprite[] = [];
        cardinals.forEach(({ label, pos }) => {
            const sprite = createTextSprite(label, {
                fontSize: 38,
                textColor: "#fbbf24",
                bgColor: "rgba(5, 7, 10, 0.8)",
                borderColor: "rbga(251, 191, 36, 0.6",
                scale: 0.55,
            });
            sprite.position.set(pos[0], pos[1], pos[2]);
            sunMesh.add(sprite);
            cardinalSprites.push(sprite);
        });

        const flareGroup = new THREE.Group();
        flareGroup.visible = false;
        sunMesh.add(flareGroup);
        flareGroupRef.current = flareGroup;

        const coreGeom = new THREE.SphereGeometry(1, 24, 24);
        const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff});
        const coreMesh = new THREE.Mesh(coreGeom, coreMat);
        flareGroup.add(coreMesh);

        const ringGeom = new THREE.RingGeometry(1.1, 1.6, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xff3b30, side: THREE.DoubleSide, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
        const pulseRing = new THREE.Mesh(ringGeom, ringMat);
        flareGroup.add(pulseRing);
        pulseRingRef.current = pulseRing;

        const flareLight = new THREE.PointLight(0xff4500, 4 , 6);
        flareLight.position.set(0, 0, 0.5);
        flareGroup.add(flareLight);
        flareLightRef.current = flareLight;
        
        const clock = new THREE.Clock();
        let animationFrameId: number;

        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            const elapsed = clock.getElapsedTime();

            if(sunMeshRef.current){
                if (targetRotationRef.current) {
                    sunMeshRef.current.rotation.y += (targetRotationRef.current.y - sunMeshRef.current.rotation.y) * 0.50;
                    sunMeshRef.current.rotation.x += (targetRotationRef.current.x - sunMeshRef.current.rotation.x) * 0.50;

                    if (Math.abs(targetRotationRef.current.y - sunMeshRef.current.rotation.y) < 0.005 && Math.abs(targetRotationRef.current.x - sunMeshRef.current.rotation.x) < 0.005) {
                        targetRotationRef.current = null;
                    }
                } else {
                    sunMeshRef.current.rotation.y += 0.0005;
                }
            }

            if (flareGroupRef.current?.visible && pulseRingRef.current && flareLightRef.current) {
                const pulse = (elapsed * 1.8) % 1;
                const scale = 1 + pulse * 2.2;
                pulseRingRef.current.scale.set(scale, scale, 1);
                (pulseRingRef.current.material as THREE.MeshBasicMaterial).opacity = (1 - pulse) * 0.9;

                flareLightRef.current.intensity = 3.5 + Math.sin(elapsed * 12 ) * 1.2;
            }
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        let resizeRafId: number;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const w = entry.contentRect.width;
                const h = entry.contentRect.height;
                if (w > 0 && h > 0 ) {
                    cancelAnimationFrame(resizeRafId);
                    resizeRafId = requestAnimationFrame(() => {
                        if (cameraRef.current && rendererRef.current){
                        cameraRef.current.aspect = w / h;
                        cameraRef.current.updateProjectionMatrix();
                        rendererRef.current.setSize(w, h, false);
                    }
                    });
                    
                }
            }
        });
        resizeObserver.observe(container);


        return() => {
        cancelAnimationFrame(animationFrameId);
        resizeObserver.disconnect();
        controls.dispose();
        sunGeometry.dispose();
        sunMaterial.dispose();
        sunTexture.dispose();
        atmosphereGeom.dispose();
        atmosphereMat.dispose();
        coreGeom.dispose();
        coreMat.dispose();
        ringGeom.dispose();
        ringMat.dispose();
        cardinalSprites.forEach((sprite) => {
            sprite.material.map?.dispose();
            sprite.material.dispose();
        });
        if (flareLabelRef.current){
            flareLabelRef.current.material.map?.dispose();
            flareLabelRef.current.material.dispose();
        }
        renderer.dispose();
        if (renderer.domElement.parentNode) {
            renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
    }
    }, []);

   useEffect(() => {
    const flareGroup = flareGroupRef.current;
    const pulseRing = pulseRingRef.current;
    const flareLight = flareLightRef.current;
    if (!flareGroup || !pulseRing || !flareLight) return;

    const coords = parseLocation(selectedFlare?.sourceLocation);
    if (!coords) {
        flareGroup.visible = false;
        return;
    }

    const R = 4.02;
    const phi = (coords.lat * Math.PI)  / 180;
    const theta = (coords.lon * Math.PI) / 180;

    const y = R * Math.sin(phi);
    const r_xz = R * Math.cos(phi);
    const x = r_xz * Math.sin(theta);
    const z = r_xz * Math.cos(theta);

    flareGroup.position.set(x, y, z);
    flareGroup.lookAt(x * 2, y * 2, z * 2);

    let baseScale = 0.14;
    let flareColor = 0xff3b30;
    let borderHex = "rgba(255, 59, 48, 0.85)";
    const firstLetter = selectedFlare?.classType?.charAt(0).toUpperCase();

    if (firstLetter === "X") {
        baseScale = 0.28;
        flareColor = 0xff2a00;
        borderHex = "rgba(255, 42, 0, 0.95)";
    } else if (firstLetter === "M") {
        baseScale = 0.20;
        flareColor = 0xff8800;
        borderHex = "rgba(255, 136, 0, 0.9)";
    }

    flareGroup.scale.set(baseScale, baseScale, baseScale);
    flareLight.color.setHex(flareColor);

    if (flareLabelRef.current) {
        flareGroup.remove(flareLabelRef.current);
        flareLabelRef.current.material.map?.dispose();
        flareLabelRef.current = null;
    }

    const labelText =`${selectedFlare?.classType || "FLARE"} (${selectedFlare?.sourceLocation})`;
    const labelSprite = createTextSprite(labelText, {
        fontSize: 30,
        textColor: "#ffffff",
        bgColor: "rgba(9, 12, 18, 0.88)",
        borderColor: borderHex,
        scale: 0.45 / baseScale,
    });

    labelSprite.position.set(0, 1.8, 1.8);
    flareGroup.add(labelSprite);
    flareLabelRef.current = labelSprite;



    flareGroup.visible = true;

    targetRotationRef.current = {x: phi * 0.6, y: -theta, };

   }, [selectedFlare]);

    
    return (
        <section className="flex-1 w-full min-h-125 bg-[#090c12]/80 backdrop-blur-xl border border-amber-500/50 rounded-2xl relative flex flex-col overflow-hidden shadow-2xl">
            <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-amber-500/30 text-xs font-mono text-amber-300">
                <span>Simulación Solar y Mapeo Heliográfico 3D </span>
                {selectedFlare?.sourceLocation && (
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-400/40">
                        {selectedFlare.classType} • {selectedFlare.sourceLocation}
                    </span>
                )}
                </div>
            <div ref={containerRef} className="w-full h-full relative overflow-hidden flex-1"/>
        </section>
    )
}