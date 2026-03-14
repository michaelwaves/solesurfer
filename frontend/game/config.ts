export const CONFIG = {
  // Physics — realistic values
  gravity: 9.81,              // m/s² (real gravity)
  maxSpeed: 25,               // m/s = 90 km/h terminal velocity
  slopeGrade: 0.45,           // tangent of slope angle (~24°, steep blue/black run)

  // Sidecut carving — based on real board geometry
  sidecutRadius: 7,           // meters (real boards: 7-9m)
  maxEdgeAngle: Math.PI / 3,  // 60° max edge tilt
  edgeEngagement: 0.35,       // how fast edge angle responds (0-1)

  // Friction coefficients
  snowFriction: 0.04,         // kinetic friction of waxed base on snow (~0.03-0.05)
  carveFrictionCoeff: 0.02,   // additional friction per radian² of edge angle
  lateralGripBase: 0.3,       // lateral grip with flat base (low = slidey)
  lateralGripEdge: 0.6,       // additional lateral grip per radian of edge angle

  // Air
  airDragCoeff: 0.5,          // drag coefficient (simplified)
  airDragArea: 0.6,           // frontal area m² (crouched rider)
  airDensity: 1.225,          // kg/m³ at sea level
  riderMass: 80,              // kg (rider + board + gear)

  // Jump
  jumpForce: 2.5,             // m/s upward velocity on ollie (~0.3m height)
  jumpCooldown: 500,          // ms
  accelJumpThreshold: 15,     // IMU threshold for jump detection

  // Terrain
  chunkSize: 50,
  chunkSegments: 32,
  maxChunks: 16,

  // Rendering
  maxParticles: 200,
  cameraDistance: 12,
  cameraHeight: 8,
  cameraLerp: 0.06,
  fogNear: 50,
  fogFar: 300,

  // Input
  inputDeadzone: 10,       // degrees — ignore tilt below this (was 5)
  inputSmoothing: 0.08,    // lower = smoother/slower response (was 0.15)
  inputMaxAngle: 45,       // degrees of tilt for full input (±1)

  // Physics timestep
  fixedDt: 1 / 60,
  maxDt: 0.1,
};
