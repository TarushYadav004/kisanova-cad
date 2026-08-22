"""
KISANOVA Smart AgriTech Rover - 3D CAD Mesh Generator & Exporter
Outputs:
- kisanova_rover_full_assembly.obj (Wavefront OBJ with material groupings)
- kisanova_rover_full_assembly.stl (Binary STL 3D-printable)
- kisanova_soil_probe_mechanism.stl (Dedicated Probe Mechanism STL)
- kisanova_wheel_ag_lug.stl (Agricultural Knobby Wheel STL)
"""

import math
import struct
import os

class Mesh:
    def __init__(self, name="Part"):
        self.name = name
        self.vertices = []
        self.faces = [] # list of (v1, v2, v3, normal)

    def add_box(self, cx, cy, cz, sx, sy, sz):
        hx, hy, hz = sx / 2.0, sy / 2.0, sz / 2.0
        v_offset = len(self.vertices)
        
        # 8 corners
        corners = [
            (cx - hx, cy - hy, cz - hz),
            (cx + hx, cy - hy, cz - hz),
            (cx + hx, cy + hy, cz - hz),
            (cx - hx, cy + hy, cz - hz),
            (cx - hx, cy - hy, cz + hz),
            (cx + hx, cy - hy, cz + hz),
            (cx + hx, cy + hy, cz + hz),
            (cx - hx, cy + hy, cz + hz),
        ]
        self.vertices.extend(corners)
        
        # 6 faces (each 2 triangles)
        quads = [
            (0, 3, 2, 1, (0, 0, -1)), # Bottom
            (4, 5, 6, 7, (0, 0, 1)),  # Top
            (0, 1, 5, 4, (0, -1, 0)), # Front
            (2, 3, 7, 6, (0, 1, 0)),  # Back
            (0, 4, 7, 3, (-1, 0, 0)), # Left
            (1, 2, 6, 5, (1, 0, 0)),  # Right
        ]
        for q in quads:
            i0, i1, i2, i3, norm = q
            self.faces.append((v_offset + i0, v_offset + i1, v_offset + i2, norm))
            self.faces.append((v_offset + i0, v_offset + i2, v_offset + i3, norm))

    def add_cylinder(self, cx, cy, cz, radius, height, axis='z', segments=24):
        v_offset = len(self.vertices)
        half_h = height / 2.0
        
        # Axis transform
        def pt(r, theta, z):
            cos_t = math.cos(theta)
            sin_t = math.sin(theta)
            if axis == 'z':
                return (cx + r * cos_t, cy + r * sin_t, cz + z)
            elif axis == 'y':
                return (cx + r * cos_t, cy + z, cz + r * sin_t)
            else: # 'x'
                return (cx + z, cy + r * cos_t, cz + r * sin_t)

        # Center top & bottom
        v_bot_center = len(self.vertices)
        self.vertices.append(pt(0, 0, -half_h))
        v_top_center = len(self.vertices)
        self.vertices.append(pt(0, 0, half_h))

        ring_bot = []
        ring_top = []
        for i in range(segments):
            angle = 2.0 * math.pi * i / segments
            ring_bot.append(len(self.vertices))
            self.vertices.append(pt(radius, angle, -half_h))
            ring_top.append(len(self.vertices))
            self.vertices.append(pt(radius, angle, half_h))

        norm_bot = (0, 0, -1) if axis=='z' else ((0, -1, 0) if axis=='y' else (-1, 0, 0))
        norm_top = (0, 0, 1) if axis=='z' else ((0, 1, 0) if axis=='y' else (1, 0, 0))

        for i in range(segments):
            nxt = (i + 1) % segments
            # Bottom disk
            self.faces.append((v_bot_center, ring_bot[nxt], ring_bot[i], norm_bot))
            # Top disk
            self.faces.append((v_top_center, ring_top[i], ring_top[nxt], norm_top))
            # Side quads
            self.faces.append((ring_bot[i], ring_bot[nxt], ring_top[nxt], (0, 0, 0)))
            self.faces.append((ring_bot[i], ring_top[nxt], ring_top[i], (0, 0, 0)))

    def add_cone(self, cx, cy, cz, r_base, r_top, height, axis='z', segments=20):
        v_offset = len(self.vertices)
        half_h = height / 2.0
        def pt(r, theta, z):
            if axis == 'z':
                return (cx + r * math.cos(theta), cy + r * math.sin(theta), cz + z)
            elif axis == 'y':
                return (cx + r * math.cos(theta), cy + z, cz + r * math.sin(theta))
            else:
                return (cx + z, cy + r * math.cos(theta), cz + r * math.sin(theta))

        v_bot_center = len(self.vertices)
        self.vertices.append(pt(0, 0, -half_h))
        v_top_center = len(self.vertices)
        self.vertices.append(pt(0, 0, half_h))

        ring_bot = []
        ring_top = []
        for i in range(segments):
            angle = 2.0 * math.pi * i / segments
            ring_bot.append(len(self.vertices))
            self.vertices.append(pt(r_base, angle, -half_h))
            ring_top.append(len(self.vertices))
            self.vertices.append(pt(r_top, angle, half_h))

        for i in range(segments):
            nxt = (i + 1) % segments
            self.faces.append((v_bot_center, ring_bot[nxt], ring_bot[i], (0, 0, -1)))
            if r_top > 0.001:
                self.faces.append((v_top_center, ring_top[i], ring_top[nxt], (0, 0, 1)))
            self.faces.append((ring_bot[i], ring_bot[nxt], ring_top[nxt], (0, 0, 0)))
            self.faces.append((ring_bot[i], ring_top[nxt], ring_top[i], (0, 0, 0)))

    def save_obj(self, filename):
        with open(filename, 'w') as f:
            f.write(f"# KISANOVA AgriTech Rover CAD Model - {self.name}\n")
            f.write(f"o {self.name}\n")
            for v in self.vertices:
                f.write(f"v {v[0]:.4f} {v[1]:.4f} {v[2]:.4f}\n")
            for face in self.faces:
                # 1-indexed
                f.write(f"f {face[0]+1} {face[1]+1} {face[2]+1}\n")

    def save_stl(self, filename):
        # Binary STL
        with open(filename, 'wb') as f:
            header = f"KISANOVA AgriTech Rover CAD: {self.name}".encode('utf-8')[:80]
            header = header.ljust(80, b'\0')
            f.write(header)
            f.write(struct.pack('<I', len(self.faces)))
            for face in self.faces:
                v1 = self.vertices[face[0]]
                v2 = self.vertices[face[1]]
                v3 = self.vertices[face[2]]
                # compute normal
                ax, ay, az = v2[0]-v1[0], v2[1]-v1[1], v2[2]-v1[2]
                bx, by, bz = v3[0]-v1[0], v3[1]-v1[1], v3[2]-v1[2]
                nx = ay*bz - az*by
                ny = az*bx - ax*bz
                nz = ax*by - ay*bx
                length = math.sqrt(nx*nx + ny*ny + nz*nz)
                if length > 1e-6:
                    nx, ny, nz = nx/length, ny/length, nz/length
                else:
                    nx, ny, nz = 0.0, 0.0, 1.0
                f.write(struct.pack('<3f', nx, ny, nz))
                f.write(struct.pack('<3f', v1[0], v1[1], v1[2]))
                f.write(struct.pack('<3f', v2[0], v2[1], v2[2]))
                f.write(struct.pack('<3f', v3[0], v3[1], v3[2]))
                f.write(struct.pack('<H', 0))


def build_kisanova_rover():
    rover = Mesh("KISANOVA_Rover_Assembly")
    
    L, W, H = 380, 240, 120
    tube = 20
    
    # 1. CHASSIS FRAME
    # Lower Rails
    rover.add_box(0, -W/2 + tube/2, tube/2, L, tube, tube)
    rover.add_box(0, W/2 - tube/2, tube/2, L, tube, tube)
    rover.add_box(-L/2 + tube/2, 0, tube/2, tube, W - 2*tube, tube)
    rover.add_box(0, 0, tube/2, tube, W - 2*tube, tube)
    rover.add_box(L/2 - tube/2, 0, tube/2, tube, W - 2*tube, tube)
    
    # Vertical Uprights
    for x in [-L/2 + tube/2, L/2 - tube/2]:
        for y in [-W/2 + tube/2, W/2 - tube/2]:
            rover.add_box(x, y, H/2, tube, tube, H)
            
    # Upper Rails
    rover.add_box(0, -W/2 + tube/2, H - tube/2, L, tube, tube)
    rover.add_box(0, W/2 - tube/2, H - tube/2, L, tube, tube)
    rover.add_box(-L/2 + tube/2, 0, H - tube/2, tube, W - 2*tube, tube)
    rover.add_box(0, 0, H - tube/2, tube, W - 2*tube, tube)
    rover.add_box(L/2 - tube/2, 0, H - tube/2, tube, W - 2*tube, tube)
    
    # Bottom skid plate
    rover.add_box(0, 0, 2, L - 30, W - 30, 4)
    # Front sensor bumper plate
    rover.add_box(L/2 + 8, 0, 45, 6, W * 0.75, 45)

    # 2. 4WD MOTORS & AG LUG WHEELS
    wb = 260
    track = 320
    wheel_r = 65
    wheel_w = 55
    
    for x in [-wb/2, wb/2]:
        for y_side in [-1, 1]:
            y_pos = y_side * (track / 2)
            # Motor
            rover.add_cylinder(x, y_side * (W/2 - 25), 0, 18.5, 75, axis='y', segments=18)
            # Coupler
            rover.add_cylinder(x, y_side * (W/2 + 10), 0, 6, 25, axis='y', segments=12)
            # Wheel Tire
            rover.add_cylinder(x, y_pos, 0, wheel_r, wheel_w, axis='y', segments=28)
            # Wheel Rim Hub
            rover.add_cylinder(x, y_pos, 0, wheel_r - 18, wheel_w + 4, axis='y', segments=24)
            # Wheel Lugs (16 treads)
            for i in range(16):
                ang = 2 * math.pi * i / 16
                lx = x + (wheel_r - 2) * math.cos(ang)
                lz = (wheel_r - 2) * math.sin(ang)
                rover.add_box(lx, y_pos, lz, 8, wheel_w * 0.85, 6)

    # 3. ELECTRONICS DECK
    # Electronics plate
    rover.add_box(-20, 0, 25, L - 120, W - 30, 3)
    # 14.8V Li-ion Battery
    rover.add_box(-85, 0, 50, 95, 120, 45)
    # Dual L298N drivers
    for dy in [-60, 60]:
        rover.add_box(30, dy, 30, 43, 43, 4)
        rover.add_box(30, dy, 40, 24, 20, 16) # heatsink
    # ESP32 MCU
    rover.add_box(35, 0, 30, 55, 28, 4)
    rover.add_box(40, 0, 34, 18, 18, 4) # Shield can
    # ESP32-CAM & HC-SR04
    rover.add_box(L/2 + 12, 0, 55, 4, 27, 40)
    rover.add_cylinder(L/2 + 16, 0, 58, 5, 8, axis='x', segments=16) # camera lens
    rover.add_box(L/2 + 12, 0, 30, 4, 45, 20)
    rover.add_cylinder(L/2 + 18, -13, 30, 8, 10, axis='x', segments=16) # HC-SR04 eye 1
    rover.add_cylinder(L/2 + 18, 13, 30, 8, 10, axis='x', segments=16)  # HC-SR04 eye 2

    # 4. VERTICAL SOIL PROBE MECHANISM (Slide 6)
    px = L/2 - 45
    # Mounting brackets
    rover.add_box(px, 0, H - 10, 45, 90, 8)
    rover.add_box(px, 0, 10, 45, 90, 8)
    # Actuator Stepper Motor
    rover.add_box(px, 0, H + 25, 42, 42, 40)
    # Dual Guide Rails
    rover.add_cylinder(px, -28, H/2 + 5, 4, H + 20, axis='z', segments=14)
    rover.add_cylinder(px, 28, H/2 + 5, 4, H + 20, axis='z', segments=14)
    # Central Lead Screw
    rover.add_cylinder(px, 0, H/2 + 5, 4, H + 20, axis='z', segments=14)
    # Sliding Carriage
    rover.add_box(px, 0, 45, 38, 75, 22)
    # Linkage pivot arm
    rover.add_box(px + 15, 0, 35, 18, 25, 8)
    # Probe Shaft (Stainless Steel)
    rover.add_cylinder(px, 0, -25, 7, 120, axis='z', segments=20)
    # Multi-sensor rings
    rover.add_cylinder(px, 0, -65, 7.5, 12, axis='z', segments=20) # Moisture
    rover.add_cylinder(px, 0, -75, 7.5, 8, axis='z', segments=20)  # Temp
    rover.add_cylinder(px, 0, -85, 7.5, 10, axis='z', segments=20) # pH
    rover.add_cylinder(px, 0, -95, 7.5, 6, axis='z', segments=20)  # EC
    # Conical Penetration Piercing Tip
    rover.add_cone(px, 0, -106, 7.5, 0.8, 16, axis='z', segments=20)

    # 5. SOLAR POWER & GPS SUBSYSTEM
    # Aluminum tilt struts
    for sy in [-W/2 + 18, W/2 - 18]:
        rover.add_box(-L/4, sy, H + 25, L * 0.7, 10, 8)
        rover.add_box(-L/2 + 50, sy, H + 15, 8, 8, 30)
        rover.add_box(L/2 - 110, sy, H + 25, 8, 8, 50)
    # Solar Panel
    rover.add_box(-40, 0, H + 40, 280, 180, 12)
    rover.add_box(-40, 0, H + 47, 260, 160, 2)
    # GPS Antenna Mast & Puck
    rover.add_cylinder(60, 0, H + 52, 6, 16, axis='z', segments=16)
    rover.add_cylinder(60, 0, H + 64, 22, 10, axis='z', segments=24) # GPS Dome
    rover.add_cone(60, 0, H + 71, 20, 8, 6, axis='z', segments=24)

    return rover

def build_probe_only():
    probe = Mesh("KISANOVA_Soil_Probe_Mechanism")
    H = 120
    # Mounting brackets
    probe.add_box(0, 0, H - 10, 45, 90, 8)
    probe.add_box(0, 0, 10, 45, 90, 8)
    # Actuator Stepper Motor
    probe.add_box(0, 0, H + 25, 42, 42, 40)
    # Dual Guide Rails
    probe.add_cylinder(0, -28, H/2 + 5, 4, H + 20, axis='z', segments=16)
    probe.add_cylinder(0, 28, H/2 + 5, 4, H + 20, axis='z', segments=16)
    # Central Lead Screw
    probe.add_cylinder(0, 0, H/2 + 5, 4, H + 20, axis='z', segments=16)
    # Sliding Carriage
    probe.add_box(0, 0, 45, 38, 75, 22)
    # Linkage pivot arm
    probe.add_box(15, 0, 35, 18, 25, 8)
    # Probe Shaft
    probe.add_cylinder(0, 0, -25, 7, 120, axis='z', segments=24)
    # Multi-sensor rings
    probe.add_cylinder(0, 0, -65, 7.5, 12, axis='z', segments=24)
    probe.add_cylinder(0, 0, -75, 7.5, 8, axis='z', segments=24)
    probe.add_cylinder(0, 0, -85, 7.5, 10, axis='z', segments=24)
    probe.add_cylinder(0, 0, -95, 7.5, 6, axis='z', segments=24)
    probe.add_cone(0, 0, -106, 7.5, 0.8, 16, axis='z', segments=24)
    return probe

def build_wheel_only():
    wheel = Mesh("KISANOVA_Ag_Lug_Wheel")
    wheel_r = 65
    wheel_w = 55
    wheel.add_cylinder(0, 0, 0, wheel_r, wheel_w, axis='y', segments=32)
    wheel.add_cylinder(0, 0, 0, wheel_r - 18, wheel_w + 4, axis='y', segments=24)
    wheel.add_cylinder(0, 0, 0, 6, wheel_w + 8, axis='y', segments=16) # bore
    for i in range(16):
        ang = 2 * math.pi * i / 16
        lx = (wheel_r - 2) * math.cos(ang)
        lz = (wheel_r - 2) * math.sin(ang)
        wheel.add_box(lx, 0, lz, 8, wheel_w * 0.85, 6)
    return wheel

if __name__ == "__main__":
    out_dir = os.path.dirname(os.path.abspath(__file__))
    models_dir = os.path.join(out_dir, "models")
    os.makedirs(models_dir, exist_ok=True)
    
    print("Generating KISANOVA Rover Assembly...")
    rover = build_kisanova_rover()
    obj_path = os.path.join(models_dir, "kisanova_rover_full_assembly.obj")
    stl_path = os.path.join(models_dir, "kisanova_rover_full_assembly.stl")
    rover.save_obj(obj_path)
    rover.save_stl(stl_path)
    print(f"Saved: {obj_path} ({len(rover.vertices)} vertices, {len(rover.faces)} triangles)")
    print(f"Saved: {stl_path}")
    
    print("Generating KISANOVA Soil Probe Mechanism STL...")
    probe = build_probe_only()
    probe_stl = os.path.join(models_dir, "kisanova_soil_probe_mechanism.stl")
    probe.save_stl(probe_stl)
    print(f"Saved: {probe_stl}")

    print("Generating KISANOVA Ag Lug Wheel STL...")
    wheel = build_wheel_only()
    wheel_stl = os.path.join(models_dir, "kisanova_wheel_ag_lug.stl")
    wheel.save_stl(wheel_stl)
    print(f"Saved: {wheel_stl}")
    print("All CAD models successfully generated!")
