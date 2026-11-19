# ☀️ Proyecto Inti — Visualizador de Llamaradas Solares (NASA DONKI)

[![Framework: React 19](https://img.shields.io/badge/Framework-React%2019-61DAFB.svg)](https://react.dev/)
[![Bundler: Vite 8](https://img.shields.io/badge/Bundler-Vite%208-646CFF.svg)](https://vitejs.dev/)
[![Language: TypeScript 5.9](https://img.shields.io/badge/Language-TypeScript%205.9-3178C6.svg)](https://www.typescriptlang.org/)
[![Graphics: Three.js](https://img.shields.io/badge/3D-Three.js-black.svg)](https://threejs.org/)
[![Styling: Tailwind CSS v4](https://img.shields.io/badge/CSS-Tailwind%20v4-38B2AC.svg)](https://tailwindcss.com/)
[![Deployment: Vercel](https://img.shields.io/badge/Deployment-Vercel-000000.svg)](https://vercel.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

**Proyecto Inti** es una aplicación web interactiva de monitoreo, simulación y visualización espacial en tiempo real desarrollada con **React 19**, **Three.js** y **Vite 8**. Consume los datos científicos abiertos de la API DONKI (*Database of Notifications, Knowledge, Information*) del Centro de Vuelo Espacial Goddard de la NASA (CCMC) para representar eventos de llamaradas solares (*Solar Flares - FLR*) sobre un globo solar tridimensional interactivo con coordenadas heliográficas precisas.

---

## 🚀 Características Principales

- 🛰️ **Datos Abiertos de la NASA DONKI:**
  - Conexión con la API del CCMC (`https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR`) para clasificar eventos según su escala de intensidad radiativa (Clases X, M, C, B, A).
  - Manejo defensivo de credenciales con fallback a `DEMO_KEY` y detección de límite de cuota (HTTP 429).

- 🌐 **Simulación Solar y Mapeo Heliográfico 3D (Three.js):**
  - **Esfera Solar Fotorrealista:** Malla con textura difusa y mapa de emisión solar activo (`MeshStandardMaterial` con `emissive: 0xff8800` y mapeo tonal `ACESFilmicToneMapping`).
  - **Atmósfera Solar Volumétrica:** Efecto de corona integrado mediante geometrías con mezcla aditiva (`AdditiveBlending`), sin dependencias de texturas pesadas adicionales.
  - **Puntos Cardinales Heliográficos 3D:** Marcadores espaciales dinámicos (N, S, E, O) proyectados sobre la fotosfera solar mediante sprites de alta resolución generados en Canvas 2D.
  - **Navegación Orbital Fluida:** `OrbitControls` con amortiguación suave (*damping factor* de `0.05`), límites de zoom adaptados y soporte para gestos táctiles y ratón.
  - **Redimensionado Dinámico:** Integración con `ResizeObserver` y `requestAnimationFrame` para adaptación instantánea a cualquier resolución de pantalla sin distorsión de aspecto.

- 📍 **Enfoque y Marcado Interactivo de Eventos:**
  - **Cálculo Trigonométrico Preciso:** Conversión de coordenadas de latitud/longitud solar (ej. `N15E30`, `S20O45`, `N08W62`) a posiciones cartesianas tridimensionales sobre la superficie solar.
  - **Rotación Automática:** Al seleccionar una llamarada, la cámara solar interpola suavemente su rotación (`targetRotation`) para centrar y orientar el evento hacia el observador.
  - **Anillo Pulsante & Luz Dedicada:** Marcador con núcleo brillante, anillo animado en expansión pulsante continua (`pulseRing`) y luz puntual dinámica (`PointLight`) cuya escala y tonalidad cromática responden a la magnitud de la llamarada (Clase X = rojo/fuego intenso, Clase M = naranja/ámbar, Clase C = dorado).
  - **Etiqueta Flotante Tridimensional:** Sprite 3D informativo que flota sobre la región del evento mostrando la clasificación y las coordenadas heliográficas.

- ⚡ **Arquitectura Reactiva con React 19 & TypeScript:**
  - **Gestión de Estado Unificada:** Patrón Context + Reducer (`SolarContext.tsx`) con despacho de acciones atómicas y referencias seguras (`useRef`) para optimización de renderizados.
  - **Store Facade Hook:** Hook personalizado `useSolarStore()` que expone estado, acciones y selectores derivados (`hasFlaresToday`, `findFlareById`).
  - **Desacoplamiento Modular:** Componentes funcionales aislados para selector de fecha, listado de eventos del día, tarjeta de métricas, visor WebGL y modales de ayuda.

- 📅 **Registro Cronológico Sincronizado (Flatpickr):**
  - Calendario embebido en línea (*inline*) totalmente traducido al español (`es.js`).
  - Resaltado dinámico con clase `.solar-flare-day` en días con actividad solar confirmada y tooltips informativos con el número de eventos registrados.
  - Carga por demanda y navegación por mes/año sincronizada con el estado global.

- 💾 **Persistencia Cache-First con IndexedDB:**
  - Base de datos estructurada en el navegador (`SolarFlareDB`) con el object store `flares`.
  - Almacena rangos mensuales consultados para garantizar navegación instantánea ($O(1)$) y funcionamiento ante pérdida temporal de conectividad.

- ☁️ **Despliegue Continuo en Vercel:**
  - Optimizado para la red perimetral Edge con reglas de enrutamiento SPA (`vercel.json`) y cabeceras de caché inmutable para texturas gráficas.

---

## 📂 Estructura del Proyecto

```text
proyecto-inti/
├── public/                       # Assets estáticos servidos directamente por Vite
│   ├── favicon.ico               # Favicon oficial de la aplicación
│   └── textures/                 # Texturas gráficas WebGL
│       └── sun.jpeg              # Textura superficial de la fotosfera solar
├── src/
│   ├── assets/                   # Recursos visuales compilados y optimizados
│   │   └── images/
│   │       └── logo-proyecto-inti.png  # Logotipo oficial de Proyecto Inti
│   ├── components/               # Componentes modulares React (TSX)
│   │   ├── layout/               # Componentes estructurales
│   │   │   ├── Header.tsx        # Encabezado con branding, logo y acceso a la guía
│   │   │   └── Footer.tsx        # Pie de página con créditos y enlaces oficiales
│   │   ├── modal/                # Diálogos emergentes
│   │   │   └── HelpModal.tsx     # Modal interactivo con instrucciones de uso
│   │   └── solar/                # Componentes del dominio solar
│   │       ├── CalendarSection.tsx # Calendario Flatpickr embebido con días destacados
│   │       ├── FlareSelector.tsx   # Menú desplegable reactivo de eventos del día
│   │       ├── FlareCard.tsx       # Tarjeta de métricas (horas UTC, coordenadas, AR, instrumentos)
│   │       └── SolarViewer3D.tsx   # Visor WebGL 3D con Three.js, animación y pulso
│   ├── context/
│   │   └── SolarContext.tsx      # Proveedor de estado global con createContext y useReducer
│   ├── hooks/
│   │   └── useSolarStore.ts      # Custom hook facade para consumo ergonómico del store
│   ├── services/                 # Servicios externos y lógica asíncrona
│   │   ├── db.service.ts         # Wrapper tipado de persistencia local en IndexedDB
│   │   └── nasa.service.ts       # Consumo de la API DONKI de la NASA con manejo de rangos
│   ├── types/
│   │   └── solar.ts              # Definiciones e interfaces TypeScript para eventos y coordenadas
│   ├── App.tsx                   # Componente raíz orquestador dentro de SolarProvider
│   ├── main.tsx                  # Punto de entrada de React con ReactDOM.createRoot()
│   ├── index.css                 # Tailwind CSS v4 (@import "tailwindcss";) y estilos de calendario
│   └── vite-env.d.ts             # Tipado estricto para variables de entorno de Vite
├── .env.example                  # Plantilla de variables de entorno para colaboradores
├── .gitignore                    # Exclusiones de control de versiones y seguridad
├── .vercelignore                 # Exclusiones de artefactos para el despliegue en Vercel
├── vercel.json                   # Enrutamiento SPA y políticas de caché Edge en Vercel
├── package.json                  # Definición de dependencias y scripts de ejecución
├── package-lock.json             # Árbol de dependencias bloqueadas
├── tsconfig.json                 # Configuración estricta de TypeScript y resolución de alias @/*
└── vite.config.ts                # Configuración de Vite con plugins de React, Tailwind y TsconfigPaths
```

---

## 🛠️ Instalación y Ejecución Local

### Prerrequisitos
- [Node.js](https://nodejs.org/) v18.0.0 o superior (recomendado v20+)
- Gestor de paquetes `npm` (o `pnpm` / `bun`)

### 1. Clonar el repositorio
```bash
git clone https://github.com/DiegoCMJava/proyecto-inti.git
cd proyecto-inti
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crea un archivo local de variables de entorno a partir de la plantilla:
```bash
cp .env.example .env.local
```

Edita `.env.local` e ingresa tu clave gratuita de la API de la NASA (obtenida en [api.nasa.gov](https://api.nasa.gov/)):
```env
VITE_NASA_API_KEY=tu_clave_de_la_nasa_aqui
```

> [!NOTE]
> Si no configuras una clave personal, la aplicación utilizará automáticamente la `DEMO_KEY` de la NASA (con un límite de 30 consultas por hora).

### 4. Iniciar el servidor de desarrollo
```bash
npm run dev
```
Abre en tu navegador la dirección indicada en la consola (por defecto `http://localhost:3000`).

---

## 📦 Scripts Disponibles

| Comando | Acción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor de desarrollo local de Vite con HMR instantáneo. |
| `npm run build` | Chequea tipos estrictos con `tsc --noEmit` y genera el bundle de producción en `/dist`. |
| `npm run preview` | Ejecuta un servidor local para inspeccionar el bundle generado antes de desplegar. |

---

## 🌐 Despliegue en Vercel

El proyecto está preparado para despliegue automático continuo con **Vercel**:

1. Ingresa a tu panel en [Vercel](https://vercel.com/new) e importa el repositorio `DiegoCMJava/proyecto-inti`.
2. Vercel detectará automáticamente el preset de **Vite**:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. En la sección **Environment Variables**, registra:
   - **Name:** `VITE_NASA_API_KEY`
   - **Value:** Tu clave de acceso de la NASA registrada en `api.nasa.gov`.
   - **Environments:** *Production*, *Preview* y *Development*.
4. Haz clic en **Deploy**. Cada commit a la rama principal (`main`) generará un despliegue automático a producción, y cada Pull Request generará un entorno de previsualización aislado.

---

## 🤝 Atribuciones y Créditos

- **Datos Científicos:** [NASA Space Weather Database of Notifications, Knowledge, Information (DONKI)](https://ccmc.gsfc.nasa.gov/tools/DONKI/) — Centro de Vuelo Espacial Goddard (GSFC / CCMC).
- **Motor Gráfico:** [Three.js](https://threejs.org/) — Visualización WebGL interactiva y renderizado 3D.
- **Selector Cronológico:** [Flatpickr](https://flatpickr.js.org/) — Calendario interactivo con localización en español.
- **Framework UI:** [React](https://react.dev/) v19 & [Vite](https://vitejs.dev/) v8.
- **Estilos:** [Tailwind CSS](https://tailwindcss.com/) v4.
- **Desarrollo y Autoría:** [Diego C. M. (DiegoCMJava)](https://github.com/DiegoCMJava) y agentes de IA como Antigravity, Copilot, Gemini web, entre otros.

---

## 📄 Licencia

Este proyecto se distribuye bajo la licencia **MIT**. Para más detalles, consulta el archivo [LICENSE](./LICENSE).
