import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const apiKey = "eX6pTZ5zgTyBN13Mhha97He4FB7a3qKvIcZbsT0X";

// Referencias a elementos del DOM
const flrCalendar = document.getElementById('flr-calendar');
const flrSelect = document.getElementById('flr-select');
const flareInfo = document.getElementById('flare-info');

// Estrategia de Caché en Memoria para acceso O(1) e instantáneo
const loadedEventsByDate = new Map(); // Clave: "YYYY-MM-DD", Valor: Array de eventos
const loadedMonths = new Set();       // Clave: "YYYY-MM" para controlar meses ya cargados

// --- BASE DE DATOS INDEXEDDB ---
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("SolarFlaresDB", 1);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains("flares")) {
                db.createObjectStore("flares", { keyPath: "range" });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function saveRange(rangeKey, data) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction("flares", "readwrite");
        const store = tx.objectStore("flares");
        const req = store.put({ range: rangeKey, data, savedAt: Date.now() });
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

async function loadRange(rangeKey) {
    const db = await openDB();
    return new Promise((resolve) => {
        const tx = db.transaction("flares", "readonly");
        const req = tx.objectStore("flares").get(rangeKey);
        req.onsuccess = () => resolve(req.result ? req.result.data : null);
        req.onerror = () => resolve(null);
    });
}

/**
 * Calcula el rango de fechas exacto (inicio y fin) para un mes/año dado
 */
function getMonthDateRange(year, month) {
    // month en JS es 0-11
    const start = new Date(Date.UTC(year, month, 1));
    const end = new Date(Date.UTC(year, month + 1, 0));

    const startDate = start.toISOString().split("T")[0];
    const endDate = end.toISOString().split("T")[0];
    return { startDate, endDate };
}

/**
 * Obtiene las llamaradas del mes especificado (desde IndexedDB o API NASA)
 */
async function loadMonthData(year, month) {
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
    if (loadedMonths.has(monthKey)) return;

    const { startDate, endDate } = getMonthDateRange(year, month);
    const rangeKey = `${startDate}_${endDate}`;

    let result = await loadRange(rangeKey);

    if (!result) {
        try {
            if (flareInfo) {
                flareInfo.innerHTML = "<p class='text-gray-500 animate-pulse'>Cargando datos de la NASA...</p>";
            }

            const res = await fetch(`https://api.nasa.gov/DONKI/FLR?startDate=${startDate}&endDate=${endDate}&api_key=${apiKey}`);
            if (!res.ok) {
                throw new Error(`Error en la API: ${res.status} ${res.statusText}`);
            }
            const data = await res.json();
            const flareDates = [...new Set(data.map(ev => ev.beginTime ? ev.beginTime.split("T")[0] : null).filter(Boolean))];

            result = { flareDates, data };
            await saveRange(rangeKey, result);
        } catch (error) {
            console.error(`Error al obtener llamaradas del mes ${monthKey}:`, error);
            if (flareInfo) {
                flareInfo.innerHTML = `<p class='text-red-500 font-medium'>Error al cargar datos de la NASA: ${error.message}</p>`;
            }
            return;
        }
    }

    // Guardar los datos en el Map en memoria
    if (result && result.data) {
        result.data.forEach(ev => {
            if (!ev.beginTime) return;
            const dateStr = ev.beginTime.split("T")[0];
            if (!loadedEventsByDate.has(dateStr)) {
                loadedEventsByDate.set(dateStr, []);
            }
            const list = loadedEventsByDate.get(dateStr);
            const exists = list.some(e => e.beginTime === ev.beginTime && e.classType === ev.classType);
            if (!exists) list.push(ev);
        });
    }

    loadedMonths.add(monthKey);
}

/**
 * Genera el HTML de la tarjeta con los detalles de la llamarada seleccionada
 */
function createFlareCard(ev) {
    if (!ev) return "";
    return `
        <div class="p-5 bg-white rounded-xl shadow-md border border-orange-100 space-y-3 max-w-md">
            <div class="flex items-center justify-between border-b pb-2">
                <span class="text-sm uppercase tracking-wide font-bold text-gray-500">Clasificación</span>
                <span class="text-xl font-bold px-3 py-1 bg-red-100 text-red-600 rounded-full">${ev.classType || "N/A"}</span>
            </div>
            <div class="space-y-1 text-sm text-gray-700">
                <p><strong>Inicio:</strong> ${ev.beginTime ? ev.beginTime.replace("Z", " UTC") : "No disponible"}</p>
                <p><strong>Pico máximo:</strong> ${ev.peakTime ? ev.peakTime.replace("Z", " UTC") : "No disponible"}</p>
                <p><strong>Fin:</strong> ${ev.endTime ? ev.endTime.replace("Z", " UTC") : "En curso / No disponible"}</p>
                <p><strong>Región activa:</strong> ${ev.activeRegionNum ? `#${ev.activeRegionNum}` : "Sin registrar"}</p>
                <p><strong>Instrumentos:</strong> ${ev.instruments?.map(inst => inst.displayName).join(", ") || "Sin registrar"}</p>
            </div>
        </div>
    `;
}

/**
 * Actualiza el selector de eventos del día y actualiza la tarjeta y visor 3D
 */
function updateSelectAndCard(events) {
    if (!flrSelect || !flareInfo) return;

    flrSelect.innerHTML = "";

    if (events && events.length > 0) {
        events.forEach((ev, idx) => {
            const opt = document.createElement("option");
            opt.value = idx;
            opt.textContent = `${ev.classType || "Llamarada"} - ${ev.beginTime || ""}`;
            flrSelect.appendChild(opt);
        });

        // Mostrar la primera llamarada por defecto
        flareInfo.innerHTML = createFlareCard(events[0]);
        initSolarFlareScene(events[0].sourceLocation, events[0].classType, "flare-3d-container");
        console.log(events[0].sourceLocation, events[0].classType);

        // Al cambiar de llamarada en el mismo día
        flrSelect.onchange = () => {
            const selectedEvent = events[Number(flrSelect.value)];
            flareInfo.innerHTML = createFlareCard(selectedEvent);
            initSolarFlareScene(selectedEvent.sourceLocation, selectedEvent.classType, "flare-3d-container");
            console.log(selectedEvent.sourceLocation, selectedEvent.classType);
        };
    } else {
        flrSelect.innerHTML = "<option value=''>No se registraron llamaradas</option>";
        flareInfo.innerHTML = "<p class='text-gray-500 italic'>No se registraron llamaradas en esta fecha.</p>";
    }
}

/**
 * Gestiona el cambio de mes o año en el calendario
 */
async function handleMonthOrYearChange(instance) {
    const year = instance.currentYear;
    const month = instance.currentMonth;

    // Cargar los datos del nuevo mes seleccionado
    await loadMonthData(year, month);
    // Redibujar el calendario síncronamente para marcar los días con llamaradas
    instance.redraw();
}

/**
 * Inicializa el calendario con Flatpickr y enlaza los eventos
 */
async function initCalendar() {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    // 1. Cargar ÚNICAMENTE el mes actual al inicio (Carga instantánea)
    await loadMonthData(currentYear, currentMonth);

    // 2. Mostrar la llamarada más reciente si existen eventos este mes
    let currentMonthEvents = [];
    for (const [dateStr, events] of loadedEventsByDate.entries()) {
        currentMonthEvents = currentMonthEvents.concat(events);
    }

    if (currentMonthEvents.length > 0) {
        currentMonthEvents.sort((a, b) => new Date(b.beginTime) - new Date(a.beginTime));
        const lastFlare = currentMonthEvents[0];
        const lastDate = lastFlare.beginTime.split("T")[0];
        const eventsOfDay = loadedEventsByDate.get(lastDate) || [lastFlare];
        updateSelectAndCard(eventsOfDay);
    } else {
        updateSelectAndCard([]);
    }

    // 3. Inicializar Flatpickr
    flatpickr(flrCalendar, {
        dateFormat: "Y-m-d",
        inline: true,

        // SÍNCRONO: consulta rápida a memoria sin llamadas HTTP bloqueantes
        onDayCreate: function (dObj, dStr, fp, dayElem) {
            const iso = fp.formatDate(dayElem.dateObj, "Y-m-d");
            const events = loadedEventsByDate.get(iso);

            if (events && events.length > 0) {
                dayElem.style.backgroundColor = "#ea580c"; // Naranja llamativo
                dayElem.style.color = "white";
                dayElem.style.fontWeight = "bold";
                dayElem.title = `Llamarada solar (${events.length})`;
            }
        },

        // Carga gradual al navegar entre meses o años
        onMonthChange: async function (selectedDates, dateStr, instance) {
            await handleMonthOrYearChange(instance);
        },
        onYearChange: async function (selectedDates, dateStr, instance) {
            await handleMonthOrYearChange(instance);
        },

        // Selección de un día específico
        onChange: function (selectedDates, dateStr) {
            const events = loadedEventsByDate.get(dateStr) || [];
            updateSelectAndCard(events);
        }
    });
}

// Iniciar aplicación
initCalendar();

/**
 * Modelo 3D del Sol con Three.js
 */
function initSolarFlareScene(locationStr, classType, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = "";
    container.className = "w-full";

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 600;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 12.9;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.5;

    const sunGeometry = new THREE.SphereGeometry(4, 32, 32);
    const sunMesh = new THREE.Mesh(sunGeometry, new THREE.MeshPhongMaterial({
        color: 0xffaa00,
        emissive: 0xff4500,
        emissiveIntensity: 0.5,
        shininess: 100
    }));
    scene.add(sunMesh);

    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1.5, 100);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    const labelN = createTextSprite("N");
    labelN.position.set(0, 5, 0);
    scene.add(labelN);

    const labelS = createTextSprite("S");
    labelS.position.set(0, -5, 0);
    scene.add(labelS);

    const labelE = createTextSprite("E");
    labelE.position.set(-5, 0, 0);
    scene.add(labelE);

    const labelO = createTextSprite("O");
    labelO.position.set(5, 0, 0);
    scene.add(labelO);

    const coords = parseLocation(locationStr);
    if (coords) {
        const { lat, lon } = coords;
        const R = 4;
        const phi = (lat * Math.PI) / 180;
        const theta = (lon * Math.PI) / 180;
        const y = R * Math.sin(phi);
        const r_xz = R * Math.cos(phi);
        const x = r_xz * Math.sin(theta);
        const z = r_xz * Math.cos(theta);
        let flareRadius = 0.2;
        let flareColor = 0xff0000;

        if (classType) {
            const match = classType.match(/([A-Z])([\d\.]+)/i);

            if (match) {
                const letter = match[1].toUpperCase();
                const intensity = parseFloat(match[2]) || 1;

                if (letter === 'X') {
                    flareRadius = 0.5 + (intensity * 0.1);
                    flareColor = 0xff4500;
                } else if (letter === 'M') {
                    flareRadius = 0.25 + (intensity * 0.03);
                    flareColor = 0xff4500;
                }
            } else {
                const mainClass = classType.charAt(0).toUpperCase();
                if (mainClass === 'X') {
                    flareRadius = 0.8;
                    flareColor = 0xff4500;
                } else if (mainClass === 'M') {
                    flareRadius = 0.4;
                }
            }

        }



        const flareGeometry = new THREE.SphereGeometry(flareRadius, 16, 16);
        const flareMaterial = new THREE.MeshBasicMaterial({ color: flareColor });
        const flareMesh = new THREE.Mesh(flareGeometry, flareMaterial);

        flareMesh.position.set(x, y, z);
        sunMesh.add(flareMesh);
    }



    function animate() {
        requestAnimationFrame(animate);

        sunMesh.rotation.y += 0.002;

        controls.update();
        renderer.render(scene, camera);
    }

    animate();

    window.addEventListener('resize', () => {
        if (document.getElementById(containerId)) {
            const w = container.clientWidth;
            const h = container.clientHeight;
            renderer.setSize(w, h);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        }
    });
}

function parseLocation(locStr) {

    if (!locStr) return null;

    const regex = /([NS])(\d+)([EO])(\d+)/;
    const match = locStr.match(regex);

    if (match) {
        let lat = parseInt(match[2]);
        if (match[1].toUpperCase() === 'S') lat = -lat;

        let lon = parseInt(match[4]);
        if (match[3].toUpperCase() === 'O') lon = -lon;

        return { lat, lon };
    }
    return null;
}



function createTextSprite(message, parameters = {}) {
    const fontface = parameters.fontface || "Arial";
    const fontsize = parameters.fontsize || 24;
    const textColor = parameters.textColor || "white";

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    canvas.width = 256;
    canvas.height = 128;

    context.font = "Bold " + fontsize + "px " + fontface;

    const metrics = context.measureText(message);
    const textWidth = metrics.width;

    context.fillStyle = textColor;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(message, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;

    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);

    sprite.scale.set(4, 2, 1);
    return sprite;
}

document.addEventListener('DOMContentLoaded', () => {
    const modalButtons = document.querySelectorAll('[data-modal-toggle]');
    const modals = document.querySelectorAll("[id^='modal-']");

    modalButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-modal-target');
            const modal = document.getElementById(targetId);
            const content = modal.querySelector("div");

            if (modal.classList.contains("hidden")) {
                modal.classList.remove("hidden");
                setTimeout(() => {
                    modal.classList.add("opacity-100");
                    content.classList.remove("scale-95", "opacity-0");
                    content.classList.add("scale-100", "opacity-100");
                }, 10);
            } else {
                // Ocultar con animación
                modal.classList.remove("opacity-100");
                content.classList.remove("scale-100", "opacity-100");
                content.classList.add("scale-95", "opacity-0");

                setTimeout(() => {
                    modal.classList.add("hidden");
                }, 100); // coincide con duration-300
            }
        });

    });


    modals.forEach(modal => {
        modal.addEventListener("click", (e) => {
            const content = modal.querySelector("div");
            if (!content.contains(e.target)) {
                modal.classList.remove("opacity-100");
                content.classList.remove("scale-100", "opacity-100");
                content.classList.add("scale-95", "opacity-0");

                setTimeout(() => {
                    modal.classList.add("hidden");
                }, 300);
            }
        });
    });

});
