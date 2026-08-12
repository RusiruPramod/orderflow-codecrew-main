import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Sliders, RotateCcw, Sparkles } from "lucide-react";

interface LayerData {
  id: number;
  label: string;
  subLabel: string;
  type: string;
  color: string;
  description: string;
}

const STACKUP_INFO: LayerData[] = [
  {
    id: 1,
    label: "Top Layer",
    subLabel: "Component & Signal",
    type: "Green Soldermask",
    color: "#15803d",
    description: "Primary mounting layer with QFP MCU, SMD passives, crystal oscillator & high-speed traces.",
  },
  {
    id: 2,
    label: "Layer 2 (Inner Layer)",
    subLabel: "Ground Plane (GND)",
    type: "Copper Foil Substrate",
    color: "#b45309",
    description: "Solid copper reference plane providing low-impedance signal return paths & EMI shielding.",
  },
  {
    id: 3,
    label: "Layer 3 (Inner Layer)",
    subLabel: "Power Plane (3.3V/5V)",
    type: "Copper Foil Substrate",
    color: "#c2410c",
    description: "Low-resistance power distribution pour supplying stable voltage rails across the board.",
  },
  {
    id: 4,
    label: "Bottom Layer",
    subLabel: "Routing & Test Pads",
    type: "Green Soldermask",
    color: "#15803d",
    description: "Secondary signal routing layer with bottom SMD pads and test points.",
  },
];

export function Pcb3dStackup() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [explosion, setExplosion] = useState<number>(35); // separation gap %
  const [selectedLayer, setSelectedLayer] = useState<number | null>(null);
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [mounted, setMounted] = useState<boolean>(false);

  const layerGroupsRef = useRef<THREE.Group[]>([]);
  const cornerPinsRef = useRef<THREE.Mesh[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 640;
    const height = container.clientHeight || 450;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e17);

    // 2. Camera (Isometric Perspective)
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 1000);
    camera.position.set(52, 42, 52);
    camera.lookAt(0, 2, 0);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.6);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 2.5);
    mainLight.position.set(40, 65, 45);
    scene.add(mainLight);

    const rimLight = new THREE.DirectionalLight(0xf59e0b, 1.8);
    rimLight.position.set(-40, -20, -40);
    scene.add(rimLight);

    const topSpot = new THREE.PointLight(0xffffff, 2, 100);
    topSpot.position.set(0, 40, 0);
    scene.add(topSpot);

    // 5. Main Model Group
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    const boardSize = 32;
    const boardThickness = 0.9;
    const cornerOffset = 13.5;

    // Materials
    const greenMaskMat = new THREE.MeshStandardMaterial({
      color: 0x15803d, // Green soldermask
      roughness: 0.3,
      metalness: 0.2,
    });

    const copperMat1 = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Shiny Copper / Gold
      roughness: 0.2,
      metalness: 0.85,
    });

    const copperMat2 = new THREE.MeshStandardMaterial({
      color: 0xb45309, // Darker Copper
      roughness: 0.25,
      metalness: 0.85,
    });

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.95,
      roughness: 0.1,
    });

    const silverMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.95,
      roughness: 0.1,
    });

    const icBodyMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.5,
      metalness: 0.3,
    });

    const smdBodyMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.4,
    });

    const layerGroups: THREE.Group[] = [];

    // Helper: Create Corner Holes with Gold Rings
    const createCornerRings = (parentGroup: THREE.Group) => {
      const ringGeo = new THREE.CylinderGeometry(1.4, 1.4, boardThickness + 0.05, 24);
      const holeGeo = new THREE.CylinderGeometry(0.8, 0.8, boardThickness + 0.1, 24);

      [
        { x: -cornerOffset, z: -cornerOffset },
        { x: cornerOffset, z: -cornerOffset },
        { x: -cornerOffset, z: cornerOffset },
        { x: cornerOffset, z: cornerOffset },
      ].forEach((pos) => {
        const ring = new THREE.Mesh(ringGeo, goldMat);
        ring.position.set(pos.x, 0, pos.z);
        parentGroup.add(ring);
      });
    };

    // ────────────────────────────────────────────────────────────────────────
    // LAYER 1: TOP LAYER (Green + MCU Chip + SMD Components)
    // ────────────────────────────────────────────────────────────────────────
    const layer1Group = new THREE.Group();

    // Base Green Plate
    const l1Plate = new THREE.Mesh(new THREE.BoxGeometry(boardSize, boardThickness, boardSize), greenMaskMat);
    layer1Group.add(l1Plate);
    createCornerRings(layer1Group);

    // QFP Microcontroller (Center IC)
    const icSize = 10;
    const icHeight = 1.4;
    const icBody = new THREE.Mesh(new THREE.BoxGeometry(icSize, icHeight, icSize), icBodyMat);
    icBody.position.set(0, boardThickness / 2 + icHeight / 2, 0);
    layer1Group.add(icBody);

    // QFP Silver Pins around 4 sides
    const pinGeo = new THREE.BoxGeometry(0.4, 0.2, 1.2);
    const pinsPerSide = 8;
    const pinSpacing = 1.0;

    for (let i = 0; i < pinsPerSide; i++) {
      const offset = (i - (pinsPerSide - 1) / 2) * pinSpacing;

      // North side
      const pinN = new THREE.Mesh(pinGeo, silverMat);
      pinN.position.set(offset, boardThickness / 2 + 0.1, -icSize / 2 - 0.5);
      layer1Group.add(pinN);

      // South side
      const pinS = new THREE.Mesh(pinGeo, silverMat);
      pinS.position.set(offset, boardThickness / 2 + 0.1, icSize / 2 + 0.5);
      layer1Group.add(pinS);

      // East side
      const pinE = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 0.4), silverMat);
      pinE.position.set(icSize / 2 + 0.5, boardThickness / 2 + 0.1, offset);
      layer1Group.add(pinE);

      // West side
      const pinW = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 0.4), silverMat);
      pinW.position.set(-icSize / 2 - 0.5, boardThickness / 2 + 0.1, offset);
      layer1Group.add(pinW);
    }

    // SMD Capacitors / Resistors
    const smdGeo = new THREE.BoxGeometry(1.2, 0.6, 0.8);
    const smdEndGeo = new THREE.BoxGeometry(0.3, 0.62, 0.82);

    [
      { x: -8, z: -8 }, { x: -6, z: -8 }, { x: 8, z: -8 }, { x: 10, z: -8 },
      { x: -8, z: 8 }, { x: -6, z: 8 }, { x: 8, z: 8 }, { x: 10, z: 8 },
      { x: -11, z: 0 }, { x: -11, z: 2 }, { x: 11, z: 0 }, { x: 11, z: 2 },
    ].forEach((pos) => {
      const smd = new THREE.Mesh(smdGeo, smdBodyMat);
      smd.position.set(pos.x, boardThickness / 2 + 0.3, pos.z);
      layer1Group.add(smd);

      const end1 = new THREE.Mesh(smdEndGeo, silverMat);
      end1.position.set(pos.x - 0.45, boardThickness / 2 + 0.3, pos.z);
      layer1Group.add(end1);

      const end2 = new THREE.Mesh(smdEndGeo, silverMat);
      end2.position.set(pos.x + 0.45, boardThickness / 2 + 0.3, pos.z);
      layer1Group.add(end2);
    });

    // Crystal Oscillator
    const xtal = new THREE.Mesh(new THREE.BoxGeometry(3, 1.4, 2), silverMat);
    xtal.position.set(8, boardThickness / 2 + 0.7, -4);
    layer1Group.add(xtal);

    // Gold Traces on top
    const trace1 = new THREE.Mesh(new THREE.BoxGeometry(18, 0.06, 0.5), goldMat);
    trace1.position.set(0, boardThickness / 2 + 0.03, -11);
    layer1Group.add(trace1);

    const trace2 = new THREE.Mesh(new THREE.BoxGeometry(18, 0.06, 0.5), goldMat);
    trace2.position.set(0, boardThickness / 2 + 0.03, 11);
    layer1Group.add(trace2);

    layerGroups.push(layer1Group);
    modelGroup.add(layer1Group);

    // ────────────────────────────────────────────────────────────────────────
    // LAYER 2: INNER LAYER 1 (Copper Plate + Traces)
    // ────────────────────────────────────────────────────────────────────────
    const layer2Group = new THREE.Group();
    const l2Plate = new THREE.Mesh(new THREE.BoxGeometry(boardSize, boardThickness, boardSize), copperMat1);
    layer2Group.add(l2Plate);
    createCornerRings(layer2Group);

    // Copper Trace Grid
    for (let i = -10; i <= 10; i += 5) {
      const trace = new THREE.Mesh(new THREE.BoxGeometry(boardSize * 0.85, 0.08, 0.6), goldMat);
      trace.position.set(0, boardThickness / 2 + 0.04, i);
      layer2Group.add(trace);
    }

    layerGroups.push(layer2Group);
    modelGroup.add(layer2Group);

    // ────────────────────────────────────────────────────────────────────────
    // LAYER 3: INNER LAYER 2 (Copper Plate + Power Pour)
    // ────────────────────────────────────────────────────────────────────────
    const layer3Group = new THREE.Group();
    const l3Plate = new THREE.Mesh(new THREE.BoxGeometry(boardSize, boardThickness, boardSize), copperMat2);
    layer3Group.add(l3Plate);
    createCornerRings(layer3Group);

    // Diagonal Traces
    for (let i = -10; i <= 10; i += 5) {
      const trace = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.08, boardSize * 0.85), goldMat);
      trace.position.set(i, boardThickness / 2 + 0.04, 0);
      layer3Group.add(trace);
    }

    layerGroups.push(layer3Group);
    modelGroup.add(layer3Group);

    // ────────────────────────────────────────────────────────────────────────
    // LAYER 4: BOTTOM LAYER (Green + Bottom Components)
    // ────────────────────────────────────────────────────────────────────────
    const layer4Group = new THREE.Group();
    const l4Plate = new THREE.Mesh(new THREE.BoxGeometry(boardSize, boardThickness, boardSize), greenMaskMat);
    layer4Group.add(l4Plate);
    createCornerRings(layer4Group);

    // Bottom SMD Pads
    [
      { x: -6, z: -6 }, { x: 6, z: -6 }, { x: -6, z: 6 }, { x: 6, z: 6 },
    ].forEach((pos) => {
      const pad = new THREE.Mesh(new THREE.BoxGeometry(2, 0.4, 1.2), smdBodyMat);
      pad.position.set(pos.x, -boardThickness / 2 - 0.2, pos.z);
      layer4Group.add(pad);
    });

    layerGroups.push(layer4Group);
    modelGroup.add(layer4Group);

    layerGroupsRef.current = layerGroups;

    // ────────────────────────────────────────────────────────────────────────
    // 4 CORNER STANDOFF PINS / VIAS (Golden Brass Rods)
    // ────────────────────────────────────────────────────────────────────────
    const cornerPins: THREE.Mesh[] = [];
    const pinGeoHeight = 45;
    const rodGeo = new THREE.CylinderGeometry(0.5, 0.5, pinGeoHeight, 20);

    [
      { x: -cornerOffset, z: -cornerOffset },
      { x: cornerOffset, z: -cornerOffset },
      { x: -cornerOffset, z: cornerOffset },
      { x: cornerOffset, z: cornerOffset },
    ].forEach((pos) => {
      const pin = new THREE.Mesh(rodGeo, goldMat);
      pin.position.set(pos.x, 0, pos.z);
      modelGroup.add(pin);
      cornerPins.push(pin);
    });

    cornerPinsRef.current = cornerPins;

    // Mouse Drag Rotation
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;

      modelGroup.rotation.y += dx * 0.008;
      modelGroup.rotation.x += dy * 0.008;

      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const canvasDom = renderer.domElement;
    canvasDom.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    // Render Loop
    let animId: number;
    let rotY = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (isRotating && !isDragging) {
        rotY += 0.004;
        modelGroup.rotation.y = rotY;
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth || 640;
      const h = container.clientHeight || 450;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      canvasDom.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      renderer.dispose();
    };
  }, [isRotating]);

  // Update Layer Spacing / Explosion Gap
  useEffect(() => {
    const layers = layerGroupsRef.current;
    if (layers.length !== 4) return;

    const gap = (explosion / 100) * 14 + 2; // gap spacing
    const totalSpan = 3 * gap;
    const topY = totalSpan / 2;

    layers.forEach((group, idx) => {
      const targetY = topY - idx * gap;
      group.position.y = targetY;

      if (selectedLayer !== null) {
        if (selectedLayer === idx + 1) {
          group.scale.set(1.08, 1.25, 1.08);
        } else {
          group.scale.set(0.94, 0.85, 0.94);
        }
      } else {
        group.scale.set(1, 1, 1);
      }
    });

    // Scale Corner Pins height to match total span
    cornerPinsRef.current.forEach((pin) => {
      pin.scale.set(1, (totalSpan + 6) / 45, 1);
    });
  }, [explosion, selectedLayer]);

  if (!mounted) {
    return (
      <div className="w-full h-[440px] bg-slate-950 rounded-3xl border border-slate-800 animate-pulse flex items-center justify-center text-xs font-mono text-slate-400">
        Initializing 3D PCB Canvas...
      </div>
    );
  }

  const activeLayerData = STACKUP_INFO.find((l) => l.id === selectedLayer) || null;

  return (
    <div className="relative w-full rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden">
      {/* 3D WebGL Canvas Viewport */}
      <div
        ref={mountRef}
        className="w-full h-[420px] sm:h-[480px] cursor-grab active:cursor-grabbing relative"
        style={{ minHeight: "420px" }}
      />

      {/* Top Header Controls Overlay */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/90 backdrop-blur px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs font-mono text-white">
          <Sparkles className="size-4 text-orange-500" />
          <span>4-Layer PCB Stackup Explorer</span>
        </div>

        <button
          onClick={() => setIsRotating(!isRotating)}
          className="pointer-events-auto px-3.5 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur border border-slate-800 text-xs text-slate-300 hover:text-white font-medium flex items-center gap-1.5 transition-colors"
        >
          <RotateCcw className={`size-3.5 ${isRotating ? "animate-spin" : ""}`} />
          <span>{isRotating ? "Pause Auto-Rotate" : "Auto-Rotate"}</span>
        </button>
      </div>

      {/* Floating 3D Text Overlay Labels matching reference image */}
      <div className="absolute top-16 right-4 sm:right-6 space-y-2 pointer-events-none hidden sm:block">
        {STACKUP_INFO.map((l) => (
          <div
            key={l.id}
            onClick={() => setSelectedLayer(selectedLayer === l.id ? null : l.id)}
            className={`pointer-events-auto px-3 py-1.5 rounded-lg text-xs font-bold font-sans backdrop-blur border transition-all cursor-pointer ${
              selectedLayer === l.id
                ? "bg-orange-600/90 border-orange-400 text-white shadow-lg translate-x-[-6px]"
                : "bg-slate-900/75 border-slate-800 text-slate-200 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full" style={{ backgroundColor: l.color }} />
              <span>{l.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Slider & Layer Details Bar */}
      <div className="absolute bottom-4 left-4 right-4 sm:right-auto bg-slate-900/95 backdrop-blur border border-slate-800 p-4 rounded-2xl sm:max-w-md text-white text-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold flex items-center gap-1.5">
            <Sliders className="size-4 text-orange-500" /> Stackup Gap Explosion
          </span>
          <span className="font-mono text-orange-400 font-bold">{explosion}% Gap</span>
        </div>

        <input
          type="range"
          min="10"
          max="80"
          value={explosion}
          onChange={(e) => setExplosion(Number(e.target.value))}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
        />

        {/* Layer Selector Buttons */}
        <div className="pt-2 border-t border-slate-800 grid grid-cols-4 gap-1.5 text-center">
          {STACKUP_INFO.map((l) => (
            <button
              key={l.id}
              onClick={() => setSelectedLayer(selectedLayer === l.id ? null : l.id)}
              className={`py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                selectedLayer === l.id
                  ? "bg-orange-600 text-white shadow-sm"
                  : "bg-slate-800 text-slate-300 hover:text-white"
              }`}
            >
              L{l.id}
            </button>
          ))}
        </div>

        {activeLayerData && (
          <div className="pt-2 border-t border-slate-800 text-[11px]">
            <div className="font-bold text-orange-400">{activeLayerData.label} ({activeLayerData.subLabel})</div>
            <div className="text-slate-300 mt-0.5 leading-relaxed">{activeLayerData.description}</div>
          </div>
        )}
      </div>
    </div>
  );
}
