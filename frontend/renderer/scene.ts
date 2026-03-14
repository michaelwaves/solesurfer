import * as THREE from "three";
import { CONFIG } from "@/game/config";

export function createScene() {
  const scene = new THREE.Scene();

  // Sky color
  scene.background = new THREE.Color(0x87ceeb);

  // Fog
  scene.fog = new THREE.Fog(0xd0e8f0, CONFIG.fogNear, CONFIG.fogFar);

  // Directional light (sun)
  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(50, 100, -50);
  sun.castShadow = false;
  scene.add(sun);

  // Ambient light
  const ambient = new THREE.AmbientLight(0x8899bb, 0.6);
  scene.add(ambient);

  // Hemisphere light for sky/ground color bleed
  const hemi = new THREE.HemisphereLight(0x87ceeb, 0xd4e8d4, 0.4);
  scene.add(hemi);

  return scene;
}

export function createRenderer(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false, // Disabled for splat performance
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  // WebGL context loss handling
  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    console.error("WebGL context lost");
    document.getElementById("webgl-lost-overlay")?.classList.remove("hidden");
  });

  return renderer;
}
