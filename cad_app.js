/**
 * ==============================================================================
 * KISANOVA CAD STUDIO - INTERACTIVE 3D CAD ENGINE & CONTROLLER
 * Project: Smart AgriTech Rover 3D Model
 * Three.js WebGL Parametric CAD Engine
 * ==============================================================================
 */

// Global App State
const CAD_STATE = {
  renderMode: 'realistic', // 'realistic', 'technical', 'wireframe', 'xray'
  explodedFactor: 0.0,
  probeDepth: 0.0, // 0 to 120 mm
  isDeploying: false,
  isRetracting: false,
  showDimensions: true,
  showGrid: true,
  showShadows: true,
  isOrthographic: false,
  selectedPart: null,
  activeSubsystems: {
    chassis: true,
    drive: true,
    electronics: true,
    probe: true,
    solar: true,
  },
  params: {
    length: 380,
    width: 240,
    height: 120,
    wheelDia: 130,
    solarTilt: 15,
    probeStroke: 150
  }
};

// Three.js Core Globals
let scene, cameraPersp, cameraOrtho, activeCamera, renderer, controls;
let roverRoot, dimRoot, groundGrid;
let subGroups = {};
let probeAnimatedParts = {};
let raycaster, mouse;
let lastTime = 0;
let leadScrewRot = 0;

// Engineering Materials Palette
let materials = {};

function initMaterials() {
  const isPBR = CAD_STATE.renderMode === 'realistic';
  
  materials.aluminum = new THREE.MeshStandardMaterial({
    color: 0xd8dde4,
    metalness: 0.85,
    roughness: 0.28,
    name: 'Anodized Aluminum 6061-T6'
  });

  materials.darkMetal = new THREE.MeshStandardMaterial({
    color: 0x22262d,
    metalness: 0.7,
    roughness: 0.45,
    name: 'Powder-Coated Steel'
  });

  materials.rubber = new THREE.MeshStandardMaterial({
    color: 0x1b1c1e,
    roughness: 0.92,
    metalness: 0.05,
    name: 'Natural Nitrile Agri-Rubber'
  });

  materials.rimWhite = new THREE.MeshStandardMaterial({
    color: 0xeeeff2,
    roughness: 0.35,
    metalness: 0.2,
    name: 'Reinforced Polymer Rim'
  });

  materials.brass = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.9,
    roughness: 0.25,
    name: 'C36000 Machined Brass'
  });

  materials.stainless = new THREE.MeshStandardMaterial({
    color: 0xc4cbd4,
    metalness: 0.92,
    roughness: 0.18,
    name: 'SS316L Stainless Steel'
  });

  materials.pcbGreen = new THREE.MeshStandardMaterial({
    color: 0x0c6b37,
    roughness: 0.4,
    metalness: 0.1,
    name: 'FR-4 Glass Epoxy PCB'
  });

  materials.pcbRed = new THREE.MeshStandardMaterial({
    color: 0xb51a1a,
    roughness: 0.4,
    metalness: 0.1,
    name: 'FR-4 Driver PCB'
  });

  materials.solarSilicon = new THREE.MeshStandardMaterial({
    color: 0x0f2952,
    roughness: 0.12,
    metalness: 0.6,
    name: 'Monocrystalline Photovoltaic Silicon'
  });

  materials.sensorMoisture = new THREE.MeshStandardMaterial({
    color: 0x1e88e5,
    roughness: 0.3,
    metalness: 0.4,
    name: 'Capacitive Moisture Sensor Ring'
  });

  materials.sensorTemp = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.3,
    metalness: 0.4,
    name: 'DS18B20 Temperature Band'
  });

  materials.sensorPH = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    roughness: 0.15,
    metalness: 0.3,
    transparent: true,
    opacity: 0.88,
    name: 'Glass pH Electrode'
  });

  materials.sensorEC = new THREE.MeshStandardMaterial({
    color: 0xffb703,
    metalness: 0.95,
    roughness: 0.2,
    name: 'Platinum 4-Electrode EC Array'
  });

  materials.cameraLens = new THREE.MeshStandardMaterial({
    color: 0x050508,
    metalness: 0.95,
    roughness: 0.05,
    name: 'OV2640 Optical Glass Lens'
  });

  materials.acrylicDeck = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.3,
    metalness: 0.1,
    name: 'CNC Acrylic Mounting Plate'
  });
}

function updateMaterialsForRenderMode() {
  const mode = CAD_STATE.renderMode;
  scene.traverse(child => {
    if (child.isMesh && child.userData.origMaterial) {
      if (mode === 'wireframe') {
        child.material = new THREE.MeshBasicMaterial({
          color: 0x00e699,
          wireframe: true
        });
      } else if (mode === 'xray') {
        child.material = new THREE.MeshStandardMaterial({
          color: child.userData.origMaterial.color || 0x4080ff,
          transparent: true,
          opacity: 0.35,
          wireframe: false,
          metalness: 0.2,
          roughness: 0.8
        });
      } else if (mode === 'technical') {
        child.material = new THREE.MeshStandardMaterial({
          color: 0xd8dde6,
          roughness: 0.7,
          metalness: 0.1
        });
      } else {
        // Realistic
        child.material = child.userData.origMaterial;
      }
    }
  });
}

// ==============================================================================
// 3D CAD BUILDER PROCEDURAL ENGINE
// ==============================================================================
function registerMesh(mesh, name, subcategory, specs = {}) {
  mesh.userData = {
    name: name,
    subcategory: subcategory,
    specs: specs,
    origMaterial: mesh.material,
    defaultPos: mesh.position.clone()
  };
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function buildChassisSubsystem() {
  const group = new THREE.Group();
  group.name = "subsystem_chassis";
  const { length, width, height } = CAD_STATE.params;
  const tube = 20;

  // Aluminum Frame Extrusions (2020 T-Slot)
  const extrusionMat = materials.aluminum;

  // Lower Longitudinal Rails
  [-width/2 + tube/2, width/2 - tube/2].forEach(y => {
    const geo = new THREE.BoxGeometry(length, tube, tube);
    const m = new THREE.Mesh(geo, extrusionMat);
    m.position.set(0, tube/2, y);
    group.add(registerMesh(m, "Lower Frame Rail", "Chassis", {
      Material: "6061-T6 Aluminum (2020 T-Slot)",
      Dimensions: `${length} x 20 x 20 mm`,
      Mass: "280 g"
    }));
  });

  // Lower Crossbeams
  [-length/2 + tube/2, 0, length/2 - tube/2].forEach(x => {
    const geo = new THREE.BoxGeometry(tube, tube, width - 2*tube);
    const m = new THREE.Mesh(geo, extrusionMat);
    m.position.set(x, tube/2, 0);
    group.add(registerMesh(m, "Lower Crossbeam", "Chassis", {
      Material: "6061-T6 Aluminum",
      Dimensions: `20 x 20 x ${width - 2*tube} mm`
    }));
  });

  // Vertical Uprights (4x Corners)
  [-length/2 + tube/2, length/2 - tube/2].forEach(x => {
    [-width/2 + tube/2, width/2 - tube/2].forEach(y => {
      const geo = new THREE.BoxGeometry(tube, height, tube);
      const m = new THREE.Mesh(geo, extrusionMat);
      m.position.set(x, height/2, y);
      group.add(registerMesh(m, "Corner Upright Pillar", "Chassis", {
        Material: "2020 Extruded Aluminum",
        Height: `${height} mm`
      }));
    });
  });

  // Upper Longitudinal Rails
  [-width/2 + tube/2, width/2 - tube/2].forEach(y => {
    const geo = new THREE.BoxGeometry(length, tube, tube);
    const m = new THREE.Mesh(geo, extrusionMat);
    m.position.set(0, height - tube/2, y);
    group.add(registerMesh(m, "Upper Deck Rail", "Chassis", {
      Material: "6061-T6 Aluminum",
      Dimensions: `${length} x 20 x 20 mm`
    }));
  });

  // Upper Crossbeams
  [-length/2 + tube/2, 0, length/2 - tube/2].forEach(x => {
    const geo = new THREE.BoxGeometry(tube, tube, width - 2*tube);
    const m = new THREE.Mesh(geo, extrusionMat);
    m.position.set(x, height - tube/2, 0);
    group.add(registerMesh(m, "Upper Crossbeam", "Chassis", {
      Material: "6061-T6 Aluminum"
    }));
  });

  // Underbody Protective Skid Plate
  const skidGeo = new THREE.BoxGeometry(length - 30, 3, width - 30);
  const skid = new THREE.Mesh(skidGeo, materials.darkMetal);
  skid.position.set(0, 1.5, 0);
  group.add(registerMesh(skid, "Underbody Skid Plate", "Chassis", {
    Material: "Anodized Heavy Sheet Metal",
    Protection: "IP65 Soil & Mud Protection"
  }));

  // Front Bumper / Sensor Bracket Plate
  const bumperGeo = new THREE.BoxGeometry(6, 45, width * 0.75);
  const bumper = new THREE.Mesh(bumperGeo, materials.darkMetal);
  bumper.position.set(length/2 + 6, 45, 0);
  group.add(registerMesh(bumper, "Front Sensor Mount Plate", "Chassis", {
    Material: "CNC 4mm Delrin / Aluminum",
    Mounts: "ESP32-CAM & HC-SR04 Ultrasonic Sensor"
  }));

  return group;
}

function buildDrivetrainSubsystem() {
  const group = new THREE.Group();
  group.name = "subsystem_drive";
  const { length, width, wheelDia } = CAD_STATE.params;
  const wheelbase = 260;
  const trackWidth = 320;
  const wheelRadius = wheelDia / 2;
  const wheelWidth = 55;

  [-wheelbase/2, wheelbase/2].forEach((x, axIdx) => {
    [-1, 1].forEach((side, sIdx) => {
      const zPos = side * (trackWidth / 2);
      const wheelAssembly = new THREE.Group();
      wheelAssembly.position.set(x, 0, zPos);

      // Motor & L-Bracket
      const motorGeo = new THREE.CylinderGeometry(18.5, 18.5, 75, 20);
      motorGeo.rotateX(Math.PI / 2);
      const motor = new THREE.Mesh(motorGeo, materials.darkMetal);
      motor.position.set(0, 0, -side * (wheelWidth/2 + 20));
      wheelAssembly.add(registerMesh(motor, "12V DC High-Torque Geared Motor", "Drivetrain", {
        Voltage: "12V DC",
        Torque: "15 kg.cm @ 120 RPM",
        Reduction: "1:45 Metal Planetary Gearbox"
      }));

      // Brass Coupler
      const coupGeo = new THREE.CylinderGeometry(6, 6, 25, 14);
      coupGeo.rotateX(Math.PI / 2);
      const coupler = new THREE.Mesh(coupGeo, materials.brass);
      coupler.position.set(0, 0, -side * (wheelWidth/2 + 4));
      wheelAssembly.add(registerMesh(coupler, "D-Shaft Brass Coupler", "Drivetrain", {
        Bore: "6mm to Hex Hub"
      }));

      // Tire Tread Outer Cylinder
      const tireGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 32);
      tireGeo.rotateX(Math.PI / 2);
      const tire = new THREE.Mesh(tireGeo, materials.rubber);
      wheelAssembly.add(registerMesh(tire, "High-Traction Agricultural Lug Tire", "Drivetrain", {
        Diameter: `${wheelDia} mm`,
        Width: `${wheelWidth} mm`,
        Tread: "Deep Chevron V-Lug Pattern"
      }));

      // Chevron Lug geometry (16 lugs)
      for (let i = 0; i < 16; i++) {
        const ang = (i / 16) * Math.PI * 2;
        const lugGeo = new THREE.BoxGeometry(8, 7, wheelWidth * 0.85);
        const lug = new THREE.Mesh(lugGeo, materials.rubber);
        lug.position.set(
          (wheelRadius - 2) * Math.cos(ang),
          (wheelRadius - 2) * Math.sin(ang),
          0
        );
        lug.rotation.z = ang;
        wheelAssembly.add(lug);
      }

      // Wheel Rim
      const rimGeo = new THREE.CylinderGeometry(wheelRadius - 16, wheelRadius - 16, wheelWidth - 6, 24);
      rimGeo.rotateX(Math.PI / 2);
      const rim = new THREE.Mesh(rimGeo, materials.rimWhite);
      wheelAssembly.add(registerMesh(rim, "Reinforced Polymer Rim", "Drivetrain", {
        Material: "High-Impact Nylon / ABS"
      }));

      // Brass Hex Hub Cap
      const hubGeo = new THREE.CylinderGeometry(14, 14, wheelWidth + 2, 6);
      hubGeo.rotateX(Math.PI / 2);
      const hub = new THREE.Mesh(hubGeo, materials.brass);
      wheelAssembly.add(registerMesh(hub, "12mm Hex Hub & Locking Nut", "Drivetrain"));

      group.add(wheelAssembly);
    });
  });

  return group;
}

function buildElectronicsSubsystem() {
  const group = new THREE.Group();
  group.name = "subsystem_electronics";
  const { length, width } = CAD_STATE.params;

  // Mounting Deck
  const deckGeo = new THREE.BoxGeometry(length - 120, 3, width - 30);
  const deck = new THREE.Mesh(deckGeo, materials.acrylicDeck);
  deck.position.set(-20, 25, 0);
  group.add(registerMesh(deck, "Electronics Mounting Deck", "Electronics", {
    Material: "3mm Matte Acrylic / CNC Plate"
  }));

  // 14.8V 4400mAh Li-ion Battery
  const battGeo = new THREE.BoxGeometry(95, 45, 120);
  const batt = new THREE.Mesh(battGeo, materials.darkMetal);
  batt.position.set(-85, 50, 0);
  group.add(registerMesh(batt, "14.8V 4400mAh 4S Li-ion Battery", "Electronics", {
    Voltage: "14.8V Nominal (16.8V Peak)",
    Capacity: "4400 mAh (65.1 Wh)",
    Runtime: "6 - 8 Hours Continuous"
  }));

  // Dual L298N Motor Drivers
  [-60, 60].forEach((zOff, i) => {
    const l298 = new THREE.Group();
    l298.position.set(30, 32, zOff);

    const pcbGeo = new THREE.BoxGeometry(43, 3, 43);
    const pcb = new THREE.Mesh(pcbGeo, materials.pcbRed);
    l298.add(registerMesh(pcb, `L298N Dual H-Bridge Driver #${i+1}`, "Electronics", {
      MaxCurrent: "2A Peak / Channel",
      Control: "PWM Dual Motor Speed Control"
    }));

    // Multi-Fin Aluminum Heatsink
    const hsGeo = new THREE.BoxGeometry(24, 20, 20);
    const hs = new THREE.Mesh(hsGeo, materials.darkMetal);
    hs.position.set(0, 11, 0);
    l298.add(hs);

    group.add(l298);
  });

  // ESP32 Main MCU Board
  const espGroup = new THREE.Group();
  espGroup.position.set(35, 32, 0);

  const espPcbGeo = new THREE.BoxGeometry(55, 3, 28);
  const espPcb = new THREE.Mesh(espPcbGeo, materials.pcbGreen);
  espGroup.add(registerMesh(espPcb, "ESP32-WROOM-32 Main Controller", "Electronics", {
    Core: "Xtensa 32-bit Dual-Core @ 240MHz",
    Wireless: "Wi-Fi 802.11 b/g/n + BLE 5.0",
    Protocol: "MQTT / HTTP Cloud Telemetry"
  }));

  // Shield Can
  const shieldGeo = new THREE.BoxGeometry(18, 3, 18);
  const shield = new THREE.Mesh(shieldGeo, materials.aluminum);
  shield.position.set(5, 3, 0);
  espGroup.add(shield);

  // Antenna trace
  const antGeo = new THREE.BoxGeometry(8, 1, 16);
  const ant = new THREE.Mesh(antGeo, materials.brass);
  ant.position.set(20, 2.5, 0);
  espGroup.add(ant);

  group.add(espGroup);

  // ESP32-CAM & HC-SR04 on Front Bumper
  const camGroup = new THREE.Group();
  camGroup.position.set(length/2 + 10, 45, 0);

  const camPcbGeo = new THREE.BoxGeometry(3, 40, 27);
  const camPcb = new THREE.Mesh(camPcbGeo, materials.pcbGreen);
  camPcb.position.set(0, 8, 0);
  camGroup.add(registerMesh(camPcb, "ESP32-CAM AI Vision Module", "Vision", {
    Sensor: "OV2640 2-Megapixel Camera",
    Features: "Crop Health Inspection & Weed Detection"
  }));

  // Lens
  const lensGeo = new THREE.CylinderGeometry(5, 5, 6, 16);
  lensGeo.rotateZ(Math.PI / 2);
  const lens = new THREE.Mesh(lensGeo, materials.cameraLens);
  lens.position.set(4, 14, 0);
  camGroup.add(lens);

  // Ultrasonic Sensor HC-SR04
  const usPcbGeo = new THREE.BoxGeometry(3, 20, 45);
  const usPcb = new THREE.Mesh(usPcbGeo, materials.sensorMoisture);
  usPcb.position.set(0, -8, 0);
  camGroup.add(registerMesh(usPcb, "HC-SR04 Ultrasonic Distance Sensor", "Vision", {
    Range: "2 cm - 400 cm",
    Purpose: "Autonomous Obstacle Avoidance"
  }));

  // Dual Ultrasonic Transducers
  [-13, 13].forEach(z => {
    const eyeGeo = new THREE.CylinderGeometry(8, 8, 10, 18);
    eyeGeo.rotateZ(Math.PI / 2);
    const eye = new THREE.Mesh(eyeGeo, materials.aluminum);
    eye.position.set(6, -8, z);
    camGroup.add(eye);
  });

  group.add(camGroup);

  return group;
}

function buildSoilProbeSubsystem() {
  const group = new THREE.Group();
  group.name = "subsystem_probe";
  const { length, height } = CAD_STATE.params;
  const px = length/2 - 45;

  group.position.set(px, 0, 0);

  // 1. Rigid Mounting Brackets (Top & Bottom Bridges)
  const bridgeGeo = new THREE.BoxGeometry(45, 8, 90);
  const topBridge = new THREE.Mesh(bridgeGeo, materials.darkMetal);
  topBridge.position.set(0, height - 10, 0);
  group.add(registerMesh(topBridge, "Actuator Top Mounting Bridge", "Soil Probe", {
    Material: "CNC 8mm Anodized Plate",
    Mount: "Vibration Isolated"
  }));

  const botBridge = new THREE.Mesh(bridgeGeo, materials.darkMetal);
  botBridge.position.set(0, 10, 0);
  group.add(registerMesh(botBridge, "Actuator Bottom Guide Plate", "Soil Probe"));

  // 2. Stepper Actuator Motor
  const motorGeo = new THREE.BoxGeometry(42, 40, 42);
  const motor = new THREE.Mesh(motorGeo, materials.darkMetal);
  motor.position.set(0, height + 25, 0);
  group.add(registerMesh(motor, "Precision Stepper Actuator Motor", "Soil Probe", {
    Type: "NEMA 17 High-Torque Bi-Polar",
    Stroke: "150 mm Max Linear Travel",
    DepthControl: "0.1 mm Resolution"
  }));

  // 3. Dual Linear Guide Rods
  [-28, 28].forEach(z => {
    const rodGeo = new THREE.CylinderGeometry(4, 4, height + 20, 16);
    const rod = new THREE.Mesh(rodGeo, materials.stainless);
    rod.position.set(0, height/2 + 5, z);
    group.add(registerMesh(rod, "Precision Ground Linear Guide Rail", "Soil Probe", {
      Material: "Hardened Chrome SS Rod (8mm Dia)"
    }));
  });

  // 4. Central Lead Screw
  const lsGeo = new THREE.CylinderGeometry(4, 4, height + 20, 16);
  const leadScrew = new THREE.Mesh(lsGeo, materials.brass);
  leadScrew.position.set(0, height/2 + 5, 0);
  group.add(registerMesh(leadScrew, "T8 Trapezoidal Lead Screw", "Soil Probe", {
    Pitch: "8mm Lead / 2mm Pitch",
    Efficiency: "High-Load Linear Thrust"
  }));
  probeAnimatedParts.leadScrew = leadScrew;

  // 5. Sliding Carriage & Deployable Probe Shaft Assembly (Translates vertically)
  const carriageAssembly = new THREE.Group();
  carriageAssembly.position.set(0, height - 30, 0);

  // Carriage Block
  const blockGeo = new THREE.BoxGeometry(38, 22, 75);
  const block = new THREE.Mesh(blockGeo, materials.aluminum);
  carriageAssembly.add(registerMesh(block, "Linear Sliding Carriage", "Soil Probe", {
    Bearings: "Dual LM8UU Linear Ball Bushings",
    Nut: "Anti-Backlash Brass Nut"
  }));

  // Brass Nut
  const nutGeo = new THREE.CylinderGeometry(6, 6, 15, 16);
  const nut = new THREE.Mesh(nutGeo, materials.brass);
  carriageAssembly.add(nut);

  // Linkage Arm
  const armGeo = new THREE.BoxGeometry(18, 8, 25);
  const arm = new THREE.Mesh(armGeo, materials.darkMetal);
  arm.position.set(15, -10, 0);
  carriageAssembly.add(registerMesh(arm, "Pivot Load-Balancing Linkage", "Soil Probe"));

  // 6. Stainless Steel Probe Shaft
  const shaftGeo = new THREE.CylinderGeometry(7, 7, 130, 24);
  const shaft = new THREE.Mesh(shaftGeo, materials.stainless);
  shaft.position.set(0, -75, 0);
  carriageAssembly.add(registerMesh(shaft, "Stainless Steel Probe Shaft", "Soil Probe", {
    Material: "SS316 Marine Grade Stainless",
    IngressRating: "IP68 Submersible / Hermetic Seal"
  }));

  // 7. Multi-Sensor Segmented Sensing Tip Head (Slide 6 Specs: 7A, 7B, 7C, 7D)
  const tipGroup = new THREE.Group();
  tipGroup.position.set(0, -140, 0);

  // 7A: Soil Moisture Sensor
  const mGeo = new THREE.CylinderGeometry(7.5, 7.5, 12, 24);
  const mRing = new THREE.Mesh(mGeo, materials.sensorMoisture);
  mRing.position.set(0, 18, 0);
  tipGroup.add(registerMesh(mRing, "7A: Capacitive Soil Moisture Sensor", "Soil Probe", {
    Type: "Frequency Domain Volumetric Water Content",
    Range: "0% - 100% VWC",
    Accuracy: "±2%"
  }));

  // 7B: Soil Temperature Sensor
  const tGeo = new THREE.CylinderGeometry(7.5, 7.5, 8, 24);
  const tRing = new THREE.Mesh(tGeo, materials.sensorTemp);
  tRing.position.set(0, 8, 0);
  tipGroup.add(registerMesh(tRing, "7B: Soil Temperature Sensor", "Soil Probe", {
    Type: "DS18B20 Digital Thermometer Band",
    Range: "-20°C to +80°C",
    Resolution: "0.0625°C"
  }));

  // 7C: pH Electrode Sensing Zone
  const phGeo = new THREE.CylinderGeometry(7.5, 7.5, 10, 24);
  const phRing = new THREE.Mesh(phGeo, materials.sensorPH);
  phRing.position.set(0, -2, 0);
  tipGroup.add(registerMesh(phRing, "7C: Soil pH Electrode", "Soil Probe", {
    Type: "Combination Polymer-Gel Glass Electrode",
    Range: "3.0 - 10.0 pH",
    Accuracy: "±0.1 pH"
  }));

  // 7D: EC / TDS Conductivity Electrodes (Dual Platinum Rings)
  [-8, -13].forEach((yOff, ecIdx) => {
    const ecGeo = new THREE.CylinderGeometry(7.6, 7.6, 3, 24);
    const ecRing = new THREE.Mesh(ecGeo, materials.sensorEC);
    ecRing.position.set(0, yOff, 0);
    tipGroup.add(registerMesh(ecRing, `7D: EC Electrode Ring #${ecIdx+1}`, "Soil Probe", {
      Type: "4-Electrode Alternating Field",
      Range: "0 - 20 mS/cm (EC / Salinity)"
    }));
  });

  // Conical Penetration Piercing Tip
  const coneGeo = new THREE.ConeGeometry(7.5, 16, 24);
  coneGeo.rotateX(Math.PI);
  const cone = new THREE.Mesh(coneGeo, materials.stainless);
  cone.position.set(0, -23, 0);
  tipGroup.add(registerMesh(cone, "Hardened Conical Penetration Piercer", "Soil Probe", {
    Material: "Hardened Stainless Steel",
    Angle: "30° Included Cone for Easy Soil Insertion"
  }));

  carriageAssembly.add(tipGroup);
  group.add(carriageAssembly);
  probeAnimatedParts.carriage = carriageAssembly;

  return group;
}

function buildSolarSubsystem() {
  const group = new THREE.Group();
  group.name = "subsystem_solar";
  const { length, width, height, solarTilt } = CAD_STATE.params;
  const pLen = 280;
  const pWid = 180;
  const pThick = 12;

  // Support Risers
  [-width/2 + 18, width/2 - 18].forEach(z => {
    const strutGeo = new THREE.BoxGeometry(length * 0.7, 8, 10);
    const strut = new THREE.Mesh(strutGeo, materials.aluminum);
    strut.position.set(-length/4, height + 25, z);
    strut.rotation.z = (solarTilt * Math.PI) / 180;
    group.add(registerMesh(strut, "Solar Tilt Support Strut", "Solar Subsystem"));

    const r1Geo = new THREE.BoxGeometry(8, 30, 8);
    const r1 = new THREE.Mesh(r1Geo, materials.aluminum);
    r1.position.set(-length/2 + 50, height + 15, z);
    group.add(r1);

    const r2Geo = new THREE.BoxGeometry(8, 50, 8);
    const r2 = new THREE.Mesh(r2Geo, materials.aluminum);
    r2.position.set(length/2 - 110, height + 25, z);
    group.add(r2);
  });

  // Solar Panel Frame Assembly
  const panelGroup = new THREE.Group();
  panelGroup.position.set(-40, height + 38, 0);
  panelGroup.rotation.z = -(solarTilt * Math.PI) / 180;

  // Outer Bezel
  const bezelGeo = new THREE.BoxGeometry(pLen, pThick, pWid);
  const bezel = new THREE.Mesh(bezelGeo, materials.darkMetal);
  panelGroup.add(registerMesh(bezel, "5V/6W Solar Panel Frame", "Solar Subsystem", {
    Power: "5V / 6W - 20W Monocrystalline",
    Efficiency: "21.5% High Yield Cell Array",
    Tilt: `${solarTilt}° Field Angle`
  }));

  // PV Silicon Surface
  const pvGeo = new THREE.BoxGeometry(pLen - 16, 2, pWid - 16);
  const pv = new THREE.Mesh(pvGeo, materials.solarSilicon);
  pv.position.set(0, pThick/2 + 0.5, 0);
  panelGroup.add(registerMesh(pv, "Monocrystalline Solar PV Cells", "Solar Subsystem"));

  // High-Precision GNSS GPS Mushroom Dome Puck
  const gpsGroup = new THREE.Group();
  gpsGroup.position.set(pLen/2 - 35, pThick/2 + 8, 0);

  const mastGeo = new THREE.CylinderGeometry(6, 6, 16, 16);
  const mast = new THREE.Mesh(mastGeo, materials.aluminum);
  gpsGroup.add(mast);

  const domeGeo = new THREE.CylinderGeometry(20, 22, 10, 24);
  const dome = new THREE.Mesh(domeGeo, materials.darkMetal);
  dome.position.set(0, 10, 0);
  gpsGroup.add(registerMesh(dome, "High-Precision GNSS / GPS Antenna Puck", "Navigation", {
    Constellation: "GPS / GLONASS / Galileo / BeiDou",
    Accuracy: "±0.5 m RTK / Sub-Meter Field Tagging",
    Frequency: "L1 / L5 Dual-Band"
  }));

  const capGeo = new THREE.ConeGeometry(20, 6, 24);
  const cap = new THREE.Mesh(capGeo, materials.darkMetal);
  cap.position.set(0, 16, 0);
  gpsGroup.add(cap);

  panelGroup.add(gpsGroup);
  group.add(panelGroup);

  return group;
}

// ==============================================================================
// TECHNICAL CAD DIMENSION OVERLAYS
// ==============================================================================
function buildDimensionOverlays() {
  const group = new THREE.Group();
  group.name = "dimensions_overlay";
  const { length, width, height, wheelDia } = CAD_STATE.params;
  const lineMat = new THREE.LineBasicMaterial({ color: 0x00e699, linewidth: 2 });
  const textMat = new THREE.MeshBasicMaterial({ color: 0x00e699 });

  function makeDimLine(p1, p2, textStr) {
    const dimG = new THREE.Group();
    const geo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
    const line = new THREE.Line(geo, lineMat);
    dimG.add(line);

    // End ticks
    const tickLen = 6;
    const t1Geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(p1.x, p1.y - tickLen, p1.z),
      new THREE.Vector3(p1.x, p1.y + tickLen, p1.z)
    ]);
    const t2Geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(p2.x, p2.y - tickLen, p2.z),
      new THREE.Vector3(p2.x, p2.y + tickLen, p2.z)
    ]);
    dimG.add(new THREE.Line(t1Geo, lineMat));
    dimG.add(new THREE.Line(t2Geo, lineMat));

    return dimG;
  }

  // Length Dimension (380 mm)
  group.add(makeDimLine(
    new THREE.Vector3(-length/2, -15, width/2 + 35),
    new THREE.Vector3(length/2, -15, width/2 + 35),
    `380 mm (L)`
  ));

  // Width Dimension (280 mm overall)
  group.add(makeDimLine(
    new THREE.Vector3(-length/2 - 35, -15, -width/2 - 40),
    new THREE.Vector3(-length/2 - 35, -15, width/2 + 40),
    `280 mm (W)`
  ));

  // Height Dimension (220 mm)
  group.add(makeDimLine(
    new THREE.Vector3(-length/2 - 35, 0, width/2 + 35),
    new THREE.Vector3(-length/2 - 35, height + 80, width/2 + 35),
    `220 mm (H)`
  ));

  return group;
}

function rebuildRoverModel() {
  if (roverRoot) {
    scene.remove(roverRoot);
  }
  if (dimRoot) {
    scene.remove(dimRoot);
  }

  roverRoot = new THREE.Group();
  roverRoot.name = "KISANOVA_ROVER_ASSEMBLY";

  subGroups.chassis = buildChassisSubsystem();
  subGroups.drive = buildDrivetrainSubsystem();
  subGroups.electronics = buildElectronicsSubsystem();
  subGroups.probe = buildSoilProbeSubsystem();
  subGroups.solar = buildSolarSubsystem();

  Object.values(subGroups).forEach(sub => roverRoot.add(sub));
  scene.add(roverRoot);

  dimRoot = buildDimensionOverlays();
  dimRoot.visible = CAD_STATE.showDimensions;
  scene.add(dimRoot);

  updateSubsystemVisibility();
  updateMaterialsForRenderMode();
  updateExplodedView();
}

// ==============================================================================
// ANIMATION & INTERACTION HANDLERS
// ==============================================================================
function updateExplodedView() {
  const f = CAD_STATE.explodedFactor;

  // Chassis stays anchored at origin
  // Drive expands laterally along Z
  if (subGroups.drive) {
    subGroups.drive.children.forEach((wGroup, i) => {
      const zDir = wGroup.position.z >= 0 ? 1 : -1;
      const xDir = wGroup.position.x >= 0 ? 1 : -1;
      wGroup.position.z = (CAD_STATE.params.width / 2 + 40) * zDir + (f * 70 * zDir);
      wGroup.position.x = (130 * xDir) + (f * 20 * xDir);
    });
  }

  // Electronics deck lifts upwards along Y
  if (subGroups.electronics) {
    subGroups.electronics.position.y = f * 60;
  }

  // Probe assembly shifts forward & up
  if (subGroups.probe) {
    subGroups.probe.position.y = f * 50;
    subGroups.probe.position.x = (CAD_STATE.params.length/2 - 45) + (f * 40);
  }

  // Solar panel ascends highest
  if (subGroups.solar) {
    subGroups.solar.position.y = f * 110;
  }
}

function updateProbeDeployment(delta) {
  const targetDepth = CAD_STATE.probeDepth; // 0 to 120 mm
  const { height, probeStroke } = CAD_STATE.params;

  if (CAD_STATE.isDeploying) {
    CAD_STATE.probeDepth += delta * 45;
    if (CAD_STATE.probeDepth >= 115) {
      CAD_STATE.probeDepth = 115;
      CAD_STATE.isDeploying = false;
      document.getElementById('btn-deploy-probe').classList.remove('active');
    }
    updateTelemetryReadouts();
  } else if (CAD_STATE.isRetracting) {
    CAD_STATE.probeDepth -= delta * 55;
    if (CAD_STATE.probeDepth <= 0) {
      CAD_STATE.probeDepth = 0;
      CAD_STATE.isRetracting = false;
      document.getElementById('btn-retract-probe').classList.remove('active');
    }
    updateTelemetryReadouts();
  }

  if (probeAnimatedParts.carriage) {
    const travel = (CAD_STATE.probeDepth / probeStroke) * (height - 30);
    probeAnimatedParts.carriage.position.y = (height - 30) - travel;
  }

  if (probeAnimatedParts.leadScrew) {
    if (CAD_STATE.isDeploying || CAD_STATE.isRetracting) {
      leadScrewRot += delta * 12;
      probeAnimatedParts.leadScrew.rotation.y = leadScrewRot;
    }
  }

  const depthSlider = document.getElementById('probe-depth-slider');
  if (depthSlider && document.activeElement !== depthSlider) {
    depthSlider.value = Math.round(CAD_STATE.probeDepth);
    document.getElementById('probe-depth-val').innerText = `${Math.round(CAD_STATE.probeDepth)} mm`;
  }
}

function updateTelemetryReadouts() {
  const depth = CAD_STATE.probeDepth;
  document.getElementById('telemetry-depth').innerText = `${Math.round(depth)} mm`;

  // Realistic sensor curve based on depth
  if (depth > 20) {
    const moist = Math.min(48, Math.round(22 + (depth - 20) * 0.28));
    const ph = (6.8 - (depth - 20) * 0.003).toFixed(1);
    const temp = (29.5 - (depth - 20) * 0.04).toFixed(1);
    const ec = (1.1 + (depth - 20) * 0.006).toFixed(2);

    document.getElementById('telemetry-moist').innerText = `${moist}%`;
    document.getElementById('telemetry-ph').innerText = `${ph}`;
    document.getElementById('telemetry-temp').innerText = `${temp}°C`;
    document.getElementById('telemetry-ec').innerText = `${ec} dS/m`;
  } else {
    document.getElementById('telemetry-moist').innerText = `Air (0%)`;
    document.getElementById('telemetry-ph').innerText = `Calibrated`;
    document.getElementById('telemetry-temp').innerText = `31.2°C`;
    document.getElementById('telemetry-ec').innerText = `0.00`;
  }
}

function updateSubsystemVisibility() {
  Object.keys(CAD_STATE.activeSubsystems).forEach(subKey => {
    if (subGroups[subKey]) {
      subGroups[subKey].visible = CAD_STATE.activeSubsystems[subKey];
    }
  });
}

// ==============================================================================
// SCENE INITIALIZATION & LIGHTING
// ==============================================================================
function initScene() {
  const container = document.getElementById('viewport-container');
  const width = container.clientWidth;
  const height = container.clientHeight;

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0d14);
  scene.fog = new THREE.FogExp2(0x0a0d14, 0.0012);

  // Cameras
  const aspect = width / height;
  cameraPersp = new THREE.PerspectiveCamera(45, aspect, 1, 3000);
  cameraPersp.position.set(450, 320, 520);

  const frustumSize = 650;
  cameraOrtho = new THREE.OrthographicCamera(
    (frustumSize * aspect) / -2,
    (frustumSize * aspect) / 2,
    frustumSize / 2,
    frustumSize / -2,
    1,
    3000
  );
  cameraOrtho.position.set(450, 320, 520);

  activeCamera = cameraPersp;

  // Renderer
  renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('cad-canvas'),
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  // Controls
  controls = new THREE.OrbitControls(activeCamera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.maxPolarAngle = Math.PI / 2 + 0.05; // Don't go far below ground
  controls.minDistance = 80;
  controls.maxDistance = 1400;
  controls.target.set(0, 60, 0);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xddeeff, 0.75);
  scene.add(ambientLight);

  const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.3);
  dirLight1.position.set(300, 500, 350);
  dirLight1.castShadow = true;
  dirLight1.shadow.mapSize.width = 2048;
  dirLight1.shadow.mapSize.height = 2048;
  dirLight1.shadow.camera.near = 10;
  dirLight1.shadow.camera.far = 1200;
  const d = 350;
  dirLight1.shadow.camera.left = -d;
  dirLight1.shadow.camera.right = d;
  dirLight1.shadow.camera.top = d;
  dirLight1.shadow.camera.bottom = -d;
  dirLight1.shadow.bias = -0.0005;
  scene.add(dirLight1);

  const fillLight = new THREE.DirectionalLight(0x70a0ff, 0.65);
  fillLight.position.set(-300, 200, -300);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0x00e699, 0.45);
  rimLight.position.set(0, -100, 200);
  scene.add(rimLight);

  // Ground Grid
  groundGrid = new THREE.GridHelper(1200, 60, 0x00e699, 0x1f2e48);
  groundGrid.position.y = -65;
  scene.add(groundGrid);

  // Ground Shadow Receiver Plane
  const shadowPlaneGeo = new THREE.PlaneGeometry(1600, 1600);
  const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.35 });
  const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = -65.2;
  shadowPlane.receiveShadow = true;
  scene.add(shadowPlane);

  // Raycaster for part selection
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  initMaterials();
  rebuildRoverModel();

  window.addEventListener('resize', onWindowResize);
  document.getElementById('cad-canvas').addEventListener('pointerdown', onCanvasClick);
  document.getElementById('cad-canvas').addEventListener('pointermove', onCanvasMouseMove);
}

function onWindowResize() {
  const container = document.getElementById('viewport-container');
  const width = container.clientWidth;
  const height = container.clientHeight;
  const aspect = width / height;

  cameraPersp.aspect = aspect;
  cameraPersp.updateProjectionMatrix();

  const frustumSize = 650;
  cameraOrtho.left = (frustumSize * aspect) / -2;
  cameraOrtho.right = (frustumSize * aspect) / 2;
  cameraOrtho.top = frustumSize / 2;
  cameraOrtho.bottom = frustumSize / -2;
  cameraOrtho.updateProjectionMatrix();

  renderer.setSize(width, height);
}

function onCanvasMouseMove(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function onCanvasClick(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, activeCamera);
  const intersects = raycaster.intersectObjects(roverRoot.children, true);

  if (intersects.length > 0) {
    let hitMesh = intersects[0].object;
    while (hitMesh && !hitMesh.userData.name && hitMesh.parent) {
      hitMesh = hitMesh.parent;
    }
    if (hitMesh && hitMesh.userData.name) {
      selectPart(hitMesh);
    }
  }
}

function selectPart(partMesh) {
  CAD_STATE.selectedPart = partMesh;
  const name = partMesh.userData.name || 'Component';
  const subcategory = partMesh.userData.subcategory || 'Rover Assembly';
  const specs = partMesh.userData.specs || {};

  // Switch right sidebar tab to 'inspector'
  switchTab('tab-inspector');

  // Update Inspector Card
  const specCard = document.getElementById('inspector-card');
  let specsHtml = `
    <div class="spec-box-header">
      <span class="spec-title">${name}</span>
      <span class="spec-tag">${subcategory}</span>
    </div>
    <table class="spec-table">
  `;
  for (let key in specs) {
    specsHtml += `<tr><td>${key}</td><td>${specs[key]}</td></tr>`;
  }
  specsHtml += `
      <tr><td>Subsystem</td><td>${subcategory}</td></tr>
      <tr><td>CAD Status</td><td>Active Mesh</td></tr>
    </table>
  `;
  specCard.innerHTML = specsHtml;

  // Flash part outline
  if (partMesh.material && partMesh.material.emissive) {
    const origEmissive = partMesh.material.emissive.getHex();
    partMesh.material.emissive.setHex(0x00e699);
    setTimeout(() => {
      partMesh.material.emissive.setHex(origEmissive);
    }, 450);
  }
}

// Camera Preset Views
function setCameraView(view) {
  const dist = 550;
  const target = new THREE.Vector3(0, 50, 0);

  if (view === 'iso') {
    activeCamera.position.set(400, 320, 450);
  } else if (view === 'top') {
    activeCamera.position.set(0, dist + 200, 0.001);
  } else if (view === 'front') {
    activeCamera.position.set(dist + 100, 50, 0);
  } else if (view === 'side') {
    activeCamera.position.set(0, 50, dist + 100);
  } else if (view === 'bottom') {
    activeCamera.position.set(0, -dist, 0.001);
  }

  controls.target.copy(target);
  controls.update();
}

function setProjection(isOrtho) {
  CAD_STATE.isOrthographic = isOrtho;
  const prevCam = activeCamera;
  activeCamera = isOrtho ? cameraOrtho : cameraPersp;
  activeCamera.position.copy(prevCam.position);
  activeCamera.rotation.copy(prevCam.rotation);
  controls.object = activeCamera;
  controls.update();
}

// ==============================================================================
// UI EVENT BINDINGS
// ==============================================================================
function initUIEvents() {
  // Render Mode Buttons
  document.querySelectorAll('.render-mode-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.render-mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      CAD_STATE.renderMode = btn.dataset.mode;
      updateMaterialsForRenderMode();
    });
  });

  // View Preset Buttons
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setCameraView(btn.dataset.view);
    });
  });

  // Exploded View Slider
  const explodeSlider = document.getElementById('explode-slider');
  explodeSlider.addEventListener('input', (e) => {
    CAD_STATE.explodedFactor = parseFloat(e.target.value) / 100.0;
    document.getElementById('explode-val').innerText = `${e.target.value}%`;
    updateExplodedView();
  });

  // Soil Probe Depth Slider
  const probeSlider = document.getElementById('probe-depth-slider');
  probeSlider.addEventListener('input', (e) => {
    CAD_STATE.probeDepth = parseFloat(e.target.value);
    CAD_STATE.isDeploying = false;
    CAD_STATE.isRetracting = false;
    document.getElementById('probe-depth-val').innerText = `${e.target.value} mm`;
    updateTelemetryReadouts();
  });

  // Probe Deploy / Retract Buttons
  const deployBtn = document.getElementById('btn-deploy-probe');
  const retractBtn = document.getElementById('btn-retract-probe');

  deployBtn.addEventListener('click', () => {
    CAD_STATE.isDeploying = true;
    CAD_STATE.isRetracting = false;
    deployBtn.classList.add('active');
    retractBtn.classList.remove('active');
  });

  retractBtn.addEventListener('click', () => {
    CAD_STATE.isRetracting = true;
    CAD_STATE.isDeploying = false;
    retractBtn.classList.add('active');
    deployBtn.classList.remove('active');
  });

  // Subsystem Visibility Checkboxes/Toggles
  document.querySelectorAll('.subsystem-tree-item').forEach(item => {
    const subKey = item.dataset.subsystem;
    const btnVis = item.querySelector('.visibility-toggle');

    item.addEventListener('click', (e) => {
      if (e.target.closest('.visibility-toggle')) {
        CAD_STATE.activeSubsystems[subKey] = !CAD_STATE.activeSubsystems[subKey];
        btnVis.classList.toggle('muted', !CAD_STATE.activeSubsystems[subKey]);
        btnVis.innerHTML = CAD_STATE.activeSubsystems[subKey] ? '👁️' : '👁️‍🗨️';
        updateSubsystemVisibility();
      } else {
        // Highlight Subsystem
        if (subGroups[subKey]) {
          selectPart(subGroups[subKey]);
        }
      }
    });
  });

  // Floating HUD Toolbar Buttons
  document.getElementById('tool-toggle-dims').addEventListener('click', function() {
    CAD_STATE.showDimensions = !CAD_STATE.showDimensions;
    dimRoot.visible = CAD_STATE.showDimensions;
    this.classList.toggle('active', CAD_STATE.showDimensions);
  });

  document.getElementById('tool-toggle-grid').addEventListener('click', function() {
    CAD_STATE.showGrid = !CAD_STATE.showGrid;
    groundGrid.visible = CAD_STATE.showGrid;
    this.classList.toggle('active', CAD_STATE.showGrid);
  });

  document.getElementById('tool-toggle-ortho').addEventListener('click', function() {
    const isOrtho = !CAD_STATE.isOrthographic;
    setProjection(isOrtho);
    this.classList.toggle('active', isOrtho);
    this.innerText = isOrtho ? '📐 ORTHO' : '🎥 PERSP';
  });

  document.getElementById('tool-reset-cam').addEventListener('click', () => {
    setCameraView('iso');
  });

  // Right Sidebar Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab);
    });
  });

  // Parametric Tuning Inputs
  const bindParam = (id, paramKey) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', (e) => {
        CAD_STATE.params[paramKey] = parseFloat(e.target.value);
        document.getElementById(`${id}-val`).innerText = `${e.target.value}`;
        rebuildRoverModel();
      });
    }
  };
  bindParam('param-length', 'length');
  bindParam('param-width', 'width');
  bindParam('param-wheel-dia', 'wheelDia');
  bindParam('param-solar-tilt', 'solarTilt');

  // Modal Open / Close
  document.getElementById('btn-open-blueprint').addEventListener('click', () => {
    document.getElementById('modal-blueprint').classList.add('open');
  });
  document.getElementById('btn-close-blueprint').addEventListener('click', () => {
    document.getElementById('modal-blueprint').classList.remove('open');
  });

  // Export Buttons
  document.getElementById('btn-export-stl').addEventListener('click', downloadAssemblySTL);
  document.getElementById('btn-export-obj').addEventListener('click', downloadAssemblyOBJ);
  document.getElementById('btn-export-scad').addEventListener('click', downloadOpenSCADFile);
  document.getElementById('btn-export-bom').addEventListener('click', downloadBOMCSV);
  document.getElementById('btn-export-blueprint-png').addEventListener('click', printBlueprint);
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tabId);
  });
  document.querySelectorAll('.tab-content').forEach(c => {
    c.classList.toggle('active', c.id === tabId);
  });
}

// ==============================================================================
// EXPORT HANDLERS (STL, OBJ, SCAD, BOM, BLUEPRINT)
// ==============================================================================
function triggerDownload(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function downloadAssemblySTL() {
  // Use pre-generated high-precision model or direct download
  const link = document.createElement('a');
  link.href = 'models/kisanova_rover_full_assembly.stl';
  link.download = 'kisanova_rover_full_assembly.stl';
  link.click();
}

function downloadAssemblyOBJ() {
  const link = document.createElement('a');
  link.href = 'models/kisanova_rover_full_assembly.obj';
  link.download = 'kisanova_rover_full_assembly.obj';
  link.click();
}

function downloadOpenSCADFile() {
  const link = document.createElement('a');
  link.href = 'kisanova_rover.scad';
  link.download = 'kisanova_rover.scad';
  link.click();
}

function downloadBOMCSV() {
  const bomRows = [
    ["Item No", "Part Name", "Subsystem", "Specification", "Qty", "Target Cost (INR)"],
    ["1", "Chassis Aluminum Extrusion 2020", "Chassis", "6061-T6 Anodized 380x280x220mm", "1 Set", "850"],
    ["2", "12V DC Geared Motors", "Drivetrain", "High Torque 15 kg.cm @ 120 RPM", "4", "1,200"],
    ["3", "Agri Lug Chevron Wheels", "Drivetrain", "130mm Diameter Deep Tread", "4", "600"],
    ["4", "L298N Dual H-Bridge Drivers", "Electronics", "Dual Motor Control 2A Peak", "2", "280"],
    ["5", "ESP32-WROOM-32 MCU", "Electronics", "Dual-Core 240MHz Wi-Fi + BLE", "1", "350"],
    ["6", "14.8V 4400mAh Li-ion Battery", "Power", "4S Pack with BMS Protection", "1", "1,600"],
    ["7", "Monocrystalline Solar Panel", "Power", "5V / 6W - 20W Monocrystalline Array", "1", "650"],
    ["8", "NEMA Linear Stepper Actuator", "Soil Probe", "150mm Stroke Lead Screw Mechanism", "1", "1,100"],
    ["9", "Soil Moisture Capacitive Sensor", "Soil Probe", "Corrosion Resistant VWC Sensor", "1", "120"],
    ["10", "DS18B20 Temp Probe", "Soil Probe", "Stainless Steel Waterproof Probe", "1", "80"],
    ["11", "Soil pH Glass Electrode", "Soil Probe", "Combination Polymer Gel Probe", "1", "450"],
    ["12", "EC / TDS 4-Electrode Sensor", "Soil Probe", "Conductivity Sensor 0-20 mS/cm", "1", "380"],
    ["13", "ESP32-CAM AI Vision Module", "Vision", "OV2640 2MP Camera Sensor", "1", "450"],
    ["14", "HC-SR04 Ultrasonic Sensor", "Vision", "Obstacle Detection 2-400cm", "1", "90"],
    ["15", "High-Precision GNSS Module", "Navigation", "NEO-6M / RTK GPS Puck", "1", "550"],
    ["TOTAL", "KISANOVA SMART AGRI-ROVER", "COMPLETE", "PROTOTYPE BOM ESTIMATE", "1 Unit", "₹8,800"]
  ];

  let csvContent = bomRows.map(e => e.map(cell => `"${cell}"`).join(",")).join("\n");
  triggerDownload(csvContent, "KISANOVA_Rover_BOM.csv", "text/csv;charset=utf-8;");
}

function printBlueprint() {
  window.print();
}

// ==============================================================================
// MAIN RENDER LOOP
// ==============================================================================
function animate(currentTime) {
  requestAnimationFrame(animate);

  const delta = (currentTime - lastTime) / 1000.0 || 0.016;
  lastTime = currentTime;

  updateProbeDeployment(delta);
  controls.update();
  renderer.render(scene, activeCamera);
}

// Initialize on DOM load
window.addEventListener('DOMContentLoaded', () => {
  initScene();
  initUIEvents();
  requestAnimationFrame(animate);
});
