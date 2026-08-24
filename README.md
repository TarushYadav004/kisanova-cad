# 🌱 KISANOVA™ - Smart AgriTech Rover CAD Studio & Engineering Model

[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/TarushYadav004/kisanova-cad)
[![Live Deployment](https://img.shields.io/badge/Live%20App-kisanova--cad.vercel.app-00e699?style=for-the-badge&logo=vercel&logoColor=white)](https://kisanova-cad.vercel.app/)
[![3D Engine](https://img.shields.io/badge/Three.js-WebGL%20r128-00d2ff?style=for-the-badge&logo=three.js)](https://threejs.org/)
[![Parametric CAD](https://img.shields.io/badge/OpenSCAD-Parametric%20CAD-ffaa00?style=for-the-badge&logo=openscad)](https://openscad.org/)
[![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)](LICENSE)

> **Precision In-Field Soil Monitoring & Autonomous Crop Sensing Robot**  
> Developed by **Team Tech Falcons**

---

## 🌐 Live Project Link

👉 **Live Web 3D CAD Studio:** **[https://kisanova-cad.vercel.app/](https://kisanova-cad.vercel.app/)**  
👉 **GitHub Source Code:** **[https://github.com/TarushYadav004/kisanova-cad](https://github.com/TarushYadav004/kisanova-cad)**

---

## 🚜 Rover Overview & Engineering Specifications

**KISANOVA** is a rugged 4WD autonomous agricultural rover engineered to conduct real-time, in-situ precision soil analysis in agricultural fields. Equipped with an automated linear lead-screw penetration probe, high-traction agricultural lug wheels, an adjustable solar canopy, and multi-spectral IoT telemetry, KISANOVA bridges the gap between mechanical durability and precision agritech.

### 📐 Dimensional & Mechanical Specifications

| Parameter | Value | Notes |
| :--- | :--- | :--- |
| **Overall Length ($L$)** | $380\text{ mm}$ | Front bumper to rear frame |
| **Overall Width ($W$)** | $280\text{ mm}$ | Wheel outer-edge to outer-edge ($320\text{ mm}$ track width) |
| **Overall Height ($H$)** | $220\text{ mm}$ | Ground to solar deck summit |
| **Wheelbase ($WB$)** | $260\text{ mm}$ | Axle-to-axle distance |
| **Ground Clearance ($GC$)** | $\sim 65\text{ mm}$ | High clearance for uneven furrows and muddy soil |
| **Frame Material** | $20\times20\text{ mm}$ T-Slot Aluminum | Structural modular extrusion + $3\text{ mm}$ AL plates |
| **Wheel Outer Diameter** | $\varnothing 130\text{ mm}$ | Deep chevron agricultural rubber lug tread |
| **Wheel Width** | $55\text{ mm}$ | High contact area for soft farm soil |
| **Drivetrain** | 4WD Differential Drive | 4x 12V DC High-Torque Geared Motors |
| **Probe Stroke Depth** | $0 - 150\text{ mm}$ | Dual linear guide rails + precision lead-screw actuator |
| **Solar Deck Tilt** | $15^\circ$ (Adjustable) | Monocrystalline solar array for continuous charging |
| **Power Source** | $14.8\text{V}\ 4400\text{mAh}$ Li-ion | $4\text{S}$ pack with integrated BMS |

---

## ⚙️ Key Subsystems

```
                                 [ SOLAR HARVESTING CANOPY ]
                                 (15° Monocrystalline Deck)
                                            │
                                            ▼
[ VISION & AVIONICS MAST ] ──► [ 20x20 ALUMINUM CHASSIS ] ◄── [ 4WD CHEVRON WHEELS ]
(ESP32-CAM + Ultrasonic)         (Dual 3mm Deck Plates)         (4x 12V Geared DC Motors)
                                            │
                                            ▼
                            [ VERTICAL SOIL PENETRATOR ]
                            (Lead Screw + 4-in-1 Sensor Probe)
```

1. **Chassis & Structural Frame:**
   * Ultra-rigid $20\times20\text{ mm}$ anodized aluminum extrusion frame.
   * Dual $3\text{ mm}$ CNC-milled aluminum deck plates for electronic mounting and lower chassis protection.
2. **4WD Drivetrain:**
   * 4x 12V high-torque DC geared motors with rugged aluminum mounting flanges.
   * Off-road chevron agricultural lug tires for superior grip in muddy, loose, or tilled field conditions.
3. **Automated Vertical Soil Probe Actuator:**
   * Central lead-screw linear actuator with dual chrome linear guide rails and sliding carriage block.
   * 4-in-1 multi-sensor stainless steel cone probe tip measuring **Moisture, Temperature, pH, and Electrical Conductivity (EC/NPK)**.
4. **Energy & Power Harvesting:**
   * $14.8\text{V}\ 4400\text{mAh}$ Li-ion 4S battery pack.
   * $280\times180\text{ mm}$ monocrystalline solar panel deck with a $15^\circ$ sun-optimized tilt angle.
5. **Electronics, Sensing & Vision:**
   * ESP32 32-bit dual-core MCU with Wi-Fi / LoRa / BLE telemetry.
   * Elevated sensor mast with ESP32-CAM for crop foliage inspection and HC-SR04 ultrasonic obstacle avoidance.
   * Dual L298N high-current H-bridge motor drivers and top-mounted GPS dome for RTK waypoint navigation.

---

## 🎨 Interactive 3D Web CAD Studio Features

The live Web Studio at **[https://kisanova-cad.vercel.app/](https://kisanova-cad.vercel.app/)** provides a complete in-browser CAD inspection environment:

* **Shading & Render Modes:**
  * 🎨 **Realistic PBR:** Realistic material shading, metallic reflection, and ambient occlusion.
  * 📐 **Technical Solid:** Clean engineering monochrome solid render with crisp edges.
  * 🕸️ **Wireframe Mesh:** Full polygonal wireframe inspection.
  * 🩻 **Internal X-Ray:** Semi-transparent translucent hull for internal subsystem inspection.
* **Camera View Presets:** Instant snap to **ISO 3D**, **Top**, **Front**, **Side**, and **Bottom** orthographic/perspective projections.
* **Interactive Dynamic Controls:**
  * **Exploded View Slider ($0\% \rightarrow 100\%$):** Parametrically pushes subsystems outward along their respective axes.
  * **Probe Deployment Slider & Auto-Cycle:** Live mechanical actuation of the soil penetration mechanism.
  * **Solar Panel Tilt Adjuster:** Real-time angle adjustment.
  * **Subsystem Isolation / Toggles:** Hide or focus individual subsystems (Chassis, Drive, Probe, Electronics, Solar).
* **Engineering Tools:**
  * 📋 **2D Blueprint & Dimension Overlay:** Dimension callouts and technical drawing modal.
  * 📊 **Bill of Materials (BOM) Table:** Component breakdown with quantities, materials, and functions.
  * ⚡ **Live STL Export:** Instant client-side 3D STL generation ready for 3D slicers and 3D printing.

---

## 📁 Repository Structure

```
kisanova-cad/
├── index.html                  # Main WebGL / Three.js 3D CAD Studio Application
├── cad_app.js                  # Complete 3D CAD procedural assembly & interactivity logic
├── styles.css                  # Modern dark-mode responsive glassmorphic UI design
├── kisanova_rover.scad         # Fully parametric OpenSCAD mechanical CAD source code
├── export_cad.py               # Python 3D mesh generator and STL/OBJ exporter
├── package.json                # Project scripts & npm metadata
├── vercel.json                 # Vercel deployment configuration
├── README.md                   # Complete documentation & project links
└── models/                     # Pre-rendered 3D CAD assets
    ├── kisanova_rover_full_assembly.stl   # Full rover assembly STL (3D printable)
    ├── kisanova_rover_full_assembly.obj   # Full rover OBJ mesh with materials
    ├── kisanova_soil_probe_mechanism.stl  # Soil penetrator linear actuator STL
    └── kisanova_wheel_ag_lug.stl          # High-traction agricultural tire STL
```

---

## 🚀 Running Locally

### Option 1: Using Python Built-in Server
```bash
# Clone the repository
git clone https://github.com/TarushYadav004/kisanova-cad.git
cd kisanova-cad

# Start local HTTP server
python -m http.server 8088
```
Open **[http://localhost:8088](http://localhost:8088)** in any modern web browser.

### Option 2: Using Node.js
```bash
npm start
```

### Option 3: Viewing OpenSCAD Model
1. Download and install [OpenSCAD](https://openscad.org/).
2. Open [`kisanova_rover.scad`](./kisanova_rover.scad).
3. Press **F5** for fast preview or **F6** for full geometric CGAL rendering.
4. Export to STL, 3MF, DXF, or SVG directly from OpenSCAD.

---

## 👥 Credits & Authors

* **Project:** KISANOVA Smart AgriTech Rover
* **Team:** Tech Falcons
* **Lead Developer & Maintainer:** [Tarush Yadav (@TarushYadav004)](https://github.com/TarushYadav004)
* **Live App:** [https://kisanova-cad.vercel.app/](https://kisanova-cad.vercel.app/)
* **License:** [MIT License](LICENSE)
