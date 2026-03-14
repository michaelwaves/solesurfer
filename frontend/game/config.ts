export const CONFIG = {
  // Physics
  gravity: 9.81,
  maxSpeed: 40,
  acceleration: 8,
  brakeDeceleration: 15,
  tuckSpeedBoost: 1.3,
  turnRate: 2.5,
  edgeGrip: 0.92,
  airDrag: 0.001,
  groundFriction: 0.02,
  slopeSteepness: 0.3,

  // Sidecut carving
  sidecutRadius: 8,
  maxEdgeAngle: Math.PI / 3,

  // Jump
  jumpForce: 8,
  jumpCooldown: 500,
  accelJumpThreshold: 15,

  // Terrain
  chunkSize: 50,
  chunkSegments: 32,
  maxChunks: 16,
  noiseScale: 0.008,
  noiseAmplitude: 15,
  slopeGrade: 0.3,

  // Rendering
  maxParticles: 200,
  cameraDistance: 8,
  cameraHeight: 4,
  cameraLerp: 0.08,
  fogNear: 50,
  fogFar: 300,

  // Input
  inputDeadzone: 5,
  inputSmoothing: 0.15,

  // Physics timestep
  fixedDt: 1 / 60,
  maxDt: 0.1,
};
