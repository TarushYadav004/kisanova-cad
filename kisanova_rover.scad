/*
 * ==============================================================================
 * KISANOVA - SMART AGRITECH ROVER
 * Parametric 3D CAD Model (OpenSCAD)
 * Project: Smart AgriTech Rover for Precision In-Field Soil Monitoring
 * Team: Tech Falcons
 * ==============================================================================
 * 
 * Specifications from Engineering Design:
 * - Dimensions: 380mm (L) x 280mm (W) x 220mm (H)
 * - Wheelbase: 260mm, Track Width: 320mm, Ground Clearance: ~65mm
 * - Drive: 4WD Differential Drive with 12V DC Geared Motors & High-Traction Ag Lug Wheels
 * - Power: 14.8V 4400mAh Li-ion Battery + 5V/6W-20W Top Solar Panel (Tilt Adjustable)
 * - Electronics: ESP32 MCU, Dual L298N Drivers, ESP32-CAM, HC-SR04 Ultrasonic Sensor, GPS Dome
 * - Soil Probe: Vertical Linear Actuator, Dual Guide Rails, Lead Screw, Sliding Carriage,
 *   Linkage, and 4-in-1 Multi-Sensor Stainless Probe (Moisture, Temp, pH, EC, Cone Tip)
 *
 * Use with OpenSCAD, FreeCAD, or export to STL / 3MF / STEP.
 */

$fn = 40; // Circle facet resolution (increase to 80+ for high-res STL export)

// ==========================================
// 1. PARAMETRIC GLOBAL DIMENSIONS (in mm)
// ==========================================
chassis_length      = 380;   // Overall frame length
chassis_width       = 240;   // Frame width (between wheel plates)
chassis_height      = 120;   // Frame vertical deck height
tube_size           = 20;    // Aluminum extrusion profile (20x20mm T-slot)
deck_thickness      = 3;     // Aluminum mounting deck plate thickness

wheel_diameter      = 130;   // Farm off-road tire diameter
wheel_width         = 55;    // Farm tire tread width
wheelbase           = 260;   // Distance between front and rear axles
track_width         = 320;   // Center-to-center lateral wheel distance

motor_diameter      = 37;    // 12V DC Geared Motor diameter
motor_length        = 75;    // Motor body length

solar_panel_len     = 280;   // Solar panel length
solar_panel_wid     = 180;   // Solar panel width
solar_panel_thick   = 12;    // Solar panel frame thickness
solar_tilt_deg      = 15;    // Solar panel tilt angle

probe_stroke        = 150;   // Maximum vertical linear actuator stroke
probe_deploy_depth  = 60;    // Current deployment depth (0 = stowed, 120 = max deep)
probe_shaft_dia     = 14;    // Stainless steel probe shaft diameter
probe_shaft_len     = 160;   // Total probe shaft length

// Explode factor for CAD exploded view (0.0 = assembled, 1.0 = exploded)
explode             = 0.0;

// Render mode selector: "ALL", "CHASSIS", "DRIVE", "ELECTRONICS", "PROBE", "SOLAR"
RENDER_MODULE       = "ALL";

// ==========================================
// COLOR PALETTE FOR CAD VISUALIZATION
// ==========================================
color_aluminum      = [0.82, 0.84, 0.86, 1.0];
color_dark_metal    = [0.25, 0.27, 0.30, 1.0];
color_rubber        = [0.15, 0.15, 0.16, 1.0];
color_rim_white     = [0.92, 0.93, 0.95, 1.0];
color_pcb_green     = [0.08, 0.45, 0.22, 1.0];
color_pcb_red       = [0.70, 0.12, 0.12, 1.0];
color_solar_blue    = [0.10, 0.20, 0.45, 1.0];
color_brass_gold    = [0.85, 0.70, 0.25, 1.0];
color_sensor_orange = [0.95, 0.55, 0.10, 1.0];
color_stainless     = [0.75, 0.78, 0.82, 1.0];
color_gps_black     = [0.10, 0.10, 0.12, 1.0];
color_acrylic_blue  = [0.20, 0.60, 0.90, 0.6];

// ==========================================
// ROOT ASSEMBLY
// ==========================================
if (RENDER_MODULE == "ALL" || RENDER_MODULE == "CHASSIS") {
    kisanova_chassis();
}

if (RENDER_MODULE == "ALL" || RENDER_MODULE == "DRIVE") {
    kisanova_drivetrain();
}

if (RENDER_MODULE == "ALL" || RENDER_MODULE == "ELECTRONICS") {
    translate([0, 0, explode * 40])
        kisanova_electronics_deck();
}

if (RENDER_MODULE == "ALL" || RENDER_MODULE == "PROBE") {
    translate([chassis_length/2 - 45, 0, explode * 70])
        kisanova_soil_probe_assembly();
}

if (RENDER_MODULE == "ALL" || RENDER_MODULE == "SOLAR") {
    translate([0, 0, explode * 110])
        kisanova_solar_and_gps_subsystem();
}

// ==========================================
// MODULE 1: CHASSIS & STRUCTURAL FRAME
// ==========================================
module kisanova_chassis() {
    color(color_aluminum) {
        // Lower Longitudinal Extrusions (Left & Right)
        for (y = [-chassis_width/2 + tube_size/2, chassis_width/2 - tube_size/2]) {
            translate([0, y, tube_size/2])
                cube([chassis_length, tube_size, tube_size], center=true);
        }

        // Lower Transverse Crossbeams (Front, Middle, Rear)
        for (x = [-chassis_length/2 + tube_size/2, 0, chassis_length/2 - tube_size/2]) {
            translate([x, 0, tube_size/2])
                cube([tube_size, chassis_width - 2*tube_size, tube_size], center=true);
        }

        // Vertical Corner Uprights (4x)
        for (x = [-chassis_length/2 + tube_size/2, chassis_length/2 - tube_size/2]) {
            for (y = [-chassis_width/2 + tube_size/2, chassis_width/2 - tube_size/2]) {
                translate([x, y, chassis_height/2])
                    cube([tube_size, tube_size, chassis_height], center=true);
            }
        }

        // Upper Longitudinal Extrusions (Left & Right)
        for (y = [-chassis_width/2 + tube_size/2, chassis_width/2 - tube_size/2]) {
            translate([0, y, chassis_height - tube_size/2])
                cube([chassis_length, tube_size, tube_size], center=true);
        }

        // Upper Transverse Crossbeams
        for (x = [-chassis_length/2 + tube_size/2, 0, chassis_length/2 - tube_size/2]) {
            translate([x, 0, chassis_height - tube_size/2])
                cube([tube_size, chassis_width - 2*tube_size, tube_size], center=true);
        }
    }

    // Corner Reinforcement Gusset Brackets
    color(color_dark_metal) {
        for (x = [-chassis_length/2 + tube_size + 5, chassis_length/2 - tube_size - 5]) {
            for (y = [-chassis_width/2 + tube_size + 5, chassis_width/2 - tube_size - 5]) {
                translate([x, y, tube_size + 1])
                    linear_extrude(3)
                    polygon(points=[[0,0], [15*sign(x), 0], [0, 15*sign(y)]]);
            }
        }
    }

    // Bottom Base Skid & Protection Plate
    color(color_dark_metal) {
        translate([0, 0, 1.5])
            difference() {
                cube([chassis_length - 20, chassis_width - 20, deck_thickness], center=true);
                // Ventilation & drainage slots
                for (ix = [-100:40:100]) {
                    for (iy = [-60:30:60]) {
                        translate([ix, iy, 0])
                            cylinder(r=4, h=10, center=true);
                    }
                }
            }
    }

    // Front Bumper / Sensor Mount Plate
    color(color_dark_metal) {
        translate([chassis_length/2 + 8, 0, 45])
            difference() {
                cube([6, chassis_width * 0.75, 45], center=true);
                // Cutout for ESP32-CAM
                translate([0, 0, 8])
                    cube([10, 26, 26], center=true);
                // Cutouts for HC-SR04 Ultrasonic Transducers
                translate([0, -22, -8]) rotate([0, 90, 0]) cylinder(r=8.5, h=10, center=true);
                translate([0, 22, -8]) rotate([0, 90, 0]) cylinder(r=8.5, h=10, center=true);
            }
    }
}

// ==========================================
// MODULE 2: 4WD DRIVETRAIN & AG-LUG WHEELS
// ==========================================
module kisanova_drivetrain() {
    // 4 Wheel & Motor Assemblies (Front-Left, Front-Right, Rear-Left, Rear-Right)
    for (x = [-wheelbase/2, wheelbase/2]) {
        for (side = [-1, 1]) {
            y_pos = side * (track_width/2);
            translate([x, y_pos, 0]) {
                // Motor Mount Bracket & 12V DC Geared Motor
                translate([0, -side * (wheel_width/2 + 25), 0]) {
                    // Motor Mounting L-Bracket
                    color(color_aluminum) {
                        translate([0, side * 6, 0])
                            cube([50, 4, 45], center=true);
                    }
                    // Motor Body
                    color(color_dark_metal) {
                        rotate([90, 0, 0])
                            cylinder(r=motor_diameter/2, h=motor_length, center=true);
                    }
                    // Gearbox Output Shaft & Brass Coupler
                    color(color_brass_gold) {
                        rotate([90, 0, 0])
                            cylinder(r=6, h=motor_length + 20, center=true);
                    }
                }

                // High-Traction Agricultural Wheel with Deep Lugs
                kisanova_ag_wheel(side);
            }
        }
    }
}

module kisanova_ag_wheel(side=1) {
    // Agricultural Knobby Lug Wheel
    rotate([90, 0, 0]) {
        // Outer Rubber Tire
        color(color_rubber) {
            difference() {
                cylinder(r=wheel_diameter/2, h=wheel_width, center=true);
                cylinder(r=wheel_diameter/2 - 18, h=wheel_width + 2, center=true);
            }
            // Chevron Agricultural Tread Lugs
            for (ang = [0:18:342]) {
                rotate([0, 0, ang]) {
                    translate([wheel_diameter/2 - 3, 0, -wheel_width/4])
                        rotate([0, 25 * side, 0])
                        cube([6, 10, wheel_width/2], center=true);
                    translate([wheel_diameter/2 - 3, 0, wheel_width/4])
                        rotate([0, -25 * side, 0])
                        cube([6, 10, wheel_width/2], center=true);
                }
            }
        }

        // Rim & Hub
        color(color_rim_white) {
            difference() {
                cylinder(r=wheel_diameter/2 - 16, h=wheel_width - 8, center=true);
                // Center Axle Bore
                cylinder(r=5, h=wheel_width + 4, center=true);
                // Weight Reduction Rim Windows (6x)
                for (a = [0:60:300]) {
                    rotate([0, 0, a])
                        translate([25, 0, 0])
                        cylinder(r=8, h=wheel_width + 4, center=true);
                }
            }
            // Central Hex Hub Cap & Lug Bolts
            color(color_brass_gold) {
                cylinder(r=12, h=wheel_width - 2, center=true);
                for (b = [0:60:300]) {
                    rotate([0, 0, b])
                        translate([16, 0, (wheel_width-4)/2 * side])
                        cylinder(r=2, h=4, center=true);
                }
            }
        }
    }
}

// ==========================================
// MODULE 3: ELECTRONICS DECK & SENSORS
// ==========================================
module kisanova_electronics_deck() {
    // Main Mid-Level Electronics Tray
    color(color_dark_metal) {
        translate([-20, 0, 25])
            cube([chassis_length - 120, chassis_width - 30, deck_thickness], center=true);
    }

    // 1. Heavy Duty Battery Pack (14.8V 4400mAh Li-ion / 12V LiFePO4)
    color([0.2, 0.2, 0.25, 1.0]) {
        translate([-85, 0, 50]) {
            cube([95, 120, 45], center=true);
            // Battery Terminal & Straps
            color(color_sensor_orange)
                translate([0, 0, 24]) cube([25, 122, 4], center=true);
        }
    }

    // 2. Dual L298N High-Power Dual H-Bridge Motor Drivers (Left & Right Banks)
    for (y_offset = [-60, 60]) {
        translate([30, y_offset, 35]) {
            // Driver PCB
            color(color_pcb_red)
                cube([43, 43, 3], center=true);
            // Multi-Fin Aluminum Heatsink
            color(color_dark_metal) {
                translate([0, 0, 12]) {
                    cube([24, 20, 20], center=true);
                    for (fin = [-8:4:8]) {
                        translate([fin, 0, 4])
                            cube([1.5, 22, 14], center=true);
                    }
                }
            }
            // Screw Terminals (Green blocks)
            color([0.1, 0.6, 0.2, 1.0]) {
                translate([-16, 0, 5]) cube([6, 32, 8], center=true);
                translate([16, 0, 5]) cube([6, 32, 8], center=true);
            }
        }
    }

    // 3. ESP32 Main Dual-Core Controller Module
    translate([35, 0, 32]) {
        // ESP32 DevKit Board
        color(color_pcb_green)
            cube([55, 28, 3], center=true);
        // ESP32 Metal Shielding Can (WROOM-32)
        color(color_aluminum)
            translate([5, 0, 3])
            cube([18, 18, 3], center=true);
        // Onboard Antenna Trace (Gold)
        color(color_brass_gold)
            translate([20, 0, 2.5])
            cube([8, 16, 1], center=true);
        // Dual Pin Header Rows
        color(color_dark_metal) {
            translate([0, -12, 4]) cube([50, 3, 6], center=true);
            translate([0, 12, 4]) cube([50, 3, 6], center=true);
        }
    }

    // 4. Front Vision & Navigation: ESP32-CAM & HC-SR04 Ultrasonic Sensor
    translate([chassis_length/2 + 2, 0, 45]) {
        // ESP32-CAM Module
        translate([0, 0, 8]) {
            color(color_pcb_green)
                cube([3, 27, 40], center=true);
            // OV2640 Camera Lens Barrel
            color([0.1, 0.1, 0.1, 1.0])
                translate([4, 0, 6])
                rotate([0, 90, 0])
                cylinder(r=5, h=6, center=true);
            // Gold Camera Ribbon Flex Cable
            color(color_brass_gold)
                translate([1.5, 0, -4])
                cube([1, 12, 14], center=true);
        }

        // HC-SR04 Ultrasonic Distance Sensor (Dual Transducers)
        translate([0, 0, -8]) {
            color([0.1, 0.3, 0.7, 1.0])
                cube([3, 45, 20], center=true);
            // Left & Right Aluminum Ultrasonic Cylinders
            color(color_aluminum) {
                translate([6, -13, 0]) rotate([0, 90, 0]) cylinder(r=8, h=10, center=true);
                translate([6, 13, 0]) rotate([0, 90, 0]) cylinder(r=8, h=10, center=true);
            }
            // Transducer Mesh Grilles
            color([0.2, 0.2, 0.2, 1.0]) {
                translate([11.2, -13, 0]) rotate([0, 90, 0]) cylinder(r=7, h=1, center=true);
                translate([11.2, 13, 0]) rotate([0, 90, 0]) cylinder(r=7, h=1, center=true);
            }
        }
    }
}

// ==========================================
// MODULE 4: VERTICAL SOIL PROBE MECHANISM
// (Based on Detailed Slide 6 Engineering Specs)
// ==========================================
module kisanova_soil_probe_assembly() {
    // 1. Rigid Mounting Bracket & Base Support Structure
    color(color_dark_metal) {
        // Top Mounting Bridge
        translate([0, 0, chassis_height - 10])
            cube([45, 90, 8], center=true);
        // Bottom Guide Plate
        translate([0, 0, 10])
            cube([45, 90, 8], center=true);
        // Vibration Isolation Dampers (4x)
        color([0.1, 0.1, 0.1, 1.0]) {
            for (y = [-35, 35]) {
                translate([-15, y, chassis_height - 10]) cylinder(r=5, h=12, center=true);
                translate([15, y, chassis_height - 10]) cylinder(r=5, h=12, center=true);
            }
        }
    }

    // 2. Actuator Drive Motor (NEMA / High Torque Stepper with Encoder)
    translate([0, 0, chassis_height + 25]) {
        color(color_dark_metal)
            cube([42, 42, 40], center=true);
        // Motor Shaft & Flexible Coupling
        color(color_aluminum)
            translate([0, 0, -25])
            cylinder(r=10, h=14, center=true);
    }

    // 3. Dual Linear Guide Rails (Stainless Steel 8mm rods)
    color(color_stainless) {
        for (y = [-28, 28]) {
            translate([0, y, chassis_height/2 + 5])
                cylinder(r=4, h=chassis_height + 20, center=true);
        }
    }

    // 4. Central Precision Lead Screw (T8 8mm Lead Screw)
    color(color_brass_gold) {
        translate([0, 0, chassis_height/2 + 5])
            cylinder(r=4, h=chassis_height + 20, center=true);
    }

    // 5. Sliding Linear Carriage & Brass Nut Block (Travels Vertically)
    z_carriage = (chassis_height - 30) - (probe_deploy_depth * (chassis_height - 40) / probe_stroke);
    translate([0, 0, z_carriage]) {
        // Sliding Carriage Block
        color(color_aluminum) {
            cube([38, 75, 22], center=true);
            // Linear Ball Bearings (LM8UU housings)
            for (y = [-28, 28]) {
                translate([0, y, 0])
                    cylinder(r=7.5, h=24, center=true);
            }
        }
        // Central Anti-Backlash Brass Nut
        color(color_brass_gold)
            cylinder(r=6, h=15, center=true);

        // 6. Mechanical Pivot Linkage Arm (Transmits load, reduces side force)
        color(color_dark_metal) {
            translate([15, 0, -10]) {
                cube([18, 25, 8], center=true);
                // Pivot Pins
                color(color_brass_gold) {
                    translate([6, 0, 0]) rotate([90, 0, 0]) cylinder(r=2.5, h=28, center=true);
                    translate([-6, 0, 0]) rotate([90, 0, 0]) cylinder(r=2.5, h=28, center=true);
                }
            }
        }

        // 7. MULTI-SENSOR PROBE SHAFT & SEGMENTED SENSING TIP
        translate([0, 0, -probe_shaft_len/2 - 10]) {
            // Stainless Steel Main Shaft (Sealed IP67)
            color(color_stainless) {
                cylinder(r=probe_shaft_dia/2, h=probe_shaft_len - 55, center=true);
                // Waterproof O-ring Seal Collars
                color([0.1, 0.1, 0.1, 1.0])
                    translate([0, 0, probe_shaft_len/2 - 35])
                    cylinder(r=probe_shaft_dia/2 + 1.5, h=6, center=true);
            }

            // SEGMENTED MULTI-SENSOR TIP HEAD (Slide 6 Details: 7A, 7B, 7C, 7D)
            translate([0, 0, -probe_shaft_len/2 + 25]) {
                // 7A: Soil Moisture Sensor (Capacitive Sensing Ring - Blue)
                color([0.15, 0.45, 0.85, 1.0])
                    translate([0, 0, 20])
                    cylinder(r=probe_shaft_dia/2 + 0.4, h=12, center=true);

                // Insulation Ring 1
                color([0.2, 0.2, 0.2, 1.0])
                    translate([0, 0, 13])
                    cylinder(r=probe_shaft_dia/2, h=2, center=true);

                // 7B: Soil Temperature Sensor (DS18B20 / NTC Thermistor Band - Amber)
                color([0.9, 0.55, 0.1, 1.0])
                    translate([0, 0, 8])
                    cylinder(r=probe_shaft_dia/2 + 0.4, h=8, center=true);

                // Insulation Ring 2
                color([0.2, 0.2, 0.2, 1.0])
                    translate([0, 0, 3])
                    cylinder(r=probe_shaft_dia/2, h=2, center=true);

                // 7C: pH Electrode Sensing Zone (Glass/Polymer Electrode Band - Emerald)
                color([0.1, 0.75, 0.45, 1.0])
                    translate([0, 0, -3])
                    cylinder(r=probe_shaft_dia/2 + 0.4, h=10, center=true);

                // Insulation Ring 3
                color([0.2, 0.2, 0.2, 1.0])
                    translate([0, 0, -9])
                    cylinder(r=probe_shaft_dia/2, h=2, center=true);

                // 7D: EC / TDS 4-Electrode Conductivity Sensor (Dual Platinum/SS rings)
                color(color_brass_gold) {
                    translate([0, 0, -13])
                        cylinder(r=probe_shaft_dia/2 + 0.5, h=3, center=true);
                    translate([0, 0, -18])
                        cylinder(r=probe_shaft_dia/2 + 0.5, h=3, center=true);
                }

                // Hardened Stainless Steel Conical Penetration Piercing Tip
                color(color_stainless)
                    translate([0, 0, -28])
                    cylinder(r1=0.8, r2=probe_shaft_dia/2, h=16, center=true);
            }
        }
    }
}

// ==========================================
// MODULE 5: SOLAR POWER & GPS SUBSYSTEM
// ==========================================
module kisanova_solar_and_gps_subsystem() {
    // 1. Adjustable Aluminum Angle Bracket Struts
    color(color_aluminum) {
        for (y = [-chassis_width/2 + 18, chassis_width/2 - 18]) {
            translate([-chassis_length/4, y, chassis_height + 25])
                rotate([0, solar_tilt_deg, 0])
                cube([chassis_length * 0.7, 10, 8], center=true);
            // Vertical Support Risers
            translate([-chassis_length/2 + 50, y, chassis_height + 15])
                cube([8, 8, 30], center=true);
            translate([chassis_length/2 - 110, y, chassis_height + 25])
                cube([8, 8, 50], center=true);
        }
    }

    // 2. High-Efficiency Monocrystalline Solar Panel (5V/6W - 20W Array)
    translate([-40, 0, chassis_height + 38]) {
        rotate([0, -solar_tilt_deg, 0]) {
            // Anodized Aluminum Outer Bezel
            color(color_dark_metal)
                difference() {
                    cube([solar_panel_len, solar_panel_wid, solar_panel_thick], center=true);
                    cube([solar_panel_len - 14, solar_panel_wid - 14, solar_panel_thick + 2], center=true);
                }
            // Dark Blue Monocrystalline Photovoltaic Silicon Cells
            color(color_solar_blue)
                translate([0, 0, 1])
                cube([solar_panel_len - 16, solar_panel_wid - 16, solar_panel_thick - 4], center=true);
            // Silver Photovoltaic Busbar Grid Lines
            color([0.9, 0.9, 0.95, 0.8]) {
                for (gx = [-solar_panel_len/2 + 25 : 35 : solar_panel_len/2 - 25]) {
                    translate([gx, 0, solar_panel_thick/2 - 0.5])
                        cube([1, solar_panel_wid - 20, 0.8], center=true);
                }
                for (gy = [-solar_panel_wid/2 + 20 : 30 : solar_panel_wid/2 - 20]) {
                    translate([0, gy, solar_panel_thick/2 - 0.5])
                        cube([solar_panel_len - 20, 1, 0.8], center=true);
                }
            }

            // 3. High-Precision GNSS / GPS Active Antenna Puck
            translate([solar_panel_len/2 - 35, 0, solar_panel_thick/2 + 10]) {
                // Cylindrical Mast Standoff
                color(color_aluminum)
                    cylinder(r=6, h=16, center=true);
                // Aerodynamic Mushroom GPS Dome
                color(color_gps_black) {
                    translate([0, 0, 10]) {
                        cylinder(r1=22, r2=20, h=10, center=true);
                        translate([0, 0, 5])
                            cylinder(r1=20, r2=8, h=6, center=true);
                    }
                    // Green GPS Status Ring / Decal
                    color([0.1, 0.8, 0.3, 1.0])
                        translate([0, 0, 11])
                        cylinder(r=22.2, h=2, center=true);
                }
            }
        }
    }
}
