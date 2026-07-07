import cv2
import numpy as np
import sys

out_path = sys.argv[1]
width, height = 1280, 720
fps = 30
duration = 60 # 60 seconds
total_frames = fps * duration

fourcc = cv2.VideoWriter_fourcc(*'mp4v')
out = cv2.VideoWriter(out_path, fourcc, fps, (width, height))

bg_color = (237, 247, 255)
green_color = (128, 222, 74)
text_color = (30, 30, 30)

class Car:
    def __init__(self, id, color, spawn_frame):
        self.id = id
        self.color = color
        self.spawn_frame = spawn_frame
        self.x = 200
        self.y = -80
        self.state = "WAIT"
        self.wash_timer = 0
        self.angle = 90
        self.pickup_timer = 0

def draw_rotated_car(img, car):
    if car.state == "WAIT" or car.state == "DONE": return
    
    car_img = np.zeros((120, 120, 3), dtype=np.uint8)
    
    # Tires
    cv2.rectangle(car_img, (25, 32), (45, 40), (20,20,20), -1) # back-left
    cv2.rectangle(car_img, (75, 32), (95, 40), (20,20,20), -1) # front-left
    cv2.rectangle(car_img, (25, 80), (45, 88), (20,20,20), -1) # back-right
    cv2.rectangle(car_img, (75, 80), (95, 88), (20,20,20), -1) # front-right
    
    # Body (facing right)
    pts = np.array([[20,40], [20,80], [30,85], [90,85], [100,80], [100,40], [90,35], [30,35]], np.int32)
    cv2.fillConvexPoly(car_img, pts, car.color)
    cv2.polylines(car_img, [pts], True, (0,0,0), 2)
    
    # Windshield (front is right side X=90)
    wnd_pts = np.array([[72,42], [72,78], [82,75], [82,45]], np.int32)
    cv2.fillConvexPoly(car_img, wnd_pts, (220, 240, 255))
    cv2.polylines(car_img, [wnd_pts], True, (0,0,0), 1)
    
    # Rear Window (back is left side X=20)
    rear_pts = np.array([[35,45], [35,75], [25,78], [25,42]], np.int32)
    cv2.fillConvexPoly(car_img, rear_pts, (220, 240, 255))
    cv2.polylines(car_img, [rear_pts], True, (0,0,0), 1)
    
    # Headlights (right)
    cv2.circle(car_img, (98, 45), 4, (255, 255, 150), -1)
    cv2.circle(car_img, (98, 75), 4, (255, 255, 150), -1)
    
    # Taillights (left)
    cv2.circle(car_img, (22, 45), 3, (50, 50, 255), -1)
    cv2.circle(car_img, (22, 75), 3, (50, 50, 255), -1)
    
    # Mirrors
    cv2.circle(car_img, (68, 33), 4, car.color, -1)
    cv2.circle(car_img, (68, 87), 4, car.color, -1)
    
    # ID
    cv2.putText(car_img, f"#{car.id}", (42, 66), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255,255,255), 2)
    
    M = cv2.getRotationMatrix2D((60, 60), -car.angle, 1.0)
    rotated = cv2.warpAffine(car_img, M, (120, 120))
    
    mask = cv2.cvtColor(rotated, cv2.COLOR_BGR2GRAY)
    _, mask = cv2.threshold(mask, 1, 255, cv2.THRESH_BINARY)
    
    y1, y2 = int(car.y - 60), int(car.y + 60)
    x1, x2 = int(car.x - 60), int(car.x + 60)
    
    if y1 >= 0 and y2 < height and x1 >= 0 and x2 < width:
        roi = img[y1:y2, x1:x2]
        roi_bg = cv2.bitwise_and(roi, roi, mask=cv2.bitwise_not(mask))
        roi_fg = cv2.bitwise_and(rotated, rotated, mask=mask)
        img[y1:y2, x1:x2] = cv2.add(roi_bg, roi_fg)

    if car.state == "QUEUE":
        text = "ESPERA"
        bg_col = (200, 200, 200)
    elif car.state == "TUNEL":
        rem = int(11 - (car.wash_timer / 15))
        text = f"LAVADO: {max(0, rem)}m"
        bg_col = (0, 200, 255)
    elif car.state == "EXIT_Q":
        text = "LISTO"
        bg_col = green_color
    else:
        text = ""
        bg_col = (0,0,0)
        
    if text:
        cx = int(car.x)
        cy = int(car.y) - 50
        cv2.rectangle(img, (cx - 45, cy - 20), (cx + 45, cy), bg_col, -1)
        cv2.rectangle(img, (cx - 45, cy - 20), (cx + 45, cy), text_color, 1)
        cv2.putText(img, text, (cx - 40, cy - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.45, text_color, 2)

colors = [(200,50,50), (50,200,50), (50,50,200), (200,200,50), (50,200,200), (200,50,200), (255,100,50), (100,255,50), (150,150,150), (100,100,100), (50,100,200), (200,100,50), (255,200,200), (200,255,200)]
spawn_frames = [0, 30, 60, 90, 120, 150, 180, 210, 400, 600, 800, 1000, 1200]
cars = [Car(idx+1, colors[idx], sf) for idx, sf in enumerate(spawn_frames)]

WASH_FRAMES = 11 * 15 # 11 mins = 165 frames

for i in range(total_frames):
    frame = np.full((height, width, 3), bg_color, dtype=np.uint8)
    virtual_time = (i / fps) * 2
    
    # Reception Zone
    cv2.rectangle(frame, (100, 0), (300, 720), (220, 220, 220), -1)
    cv2.line(frame, (300, 0), (300, 550), text_color, 4)
    
    # Delivery Zone
    cv2.rectangle(frame, (900, 0), (1100, 720), (220, 250, 220), -1)
    cv2.line(frame, (900, 0), (900, 550), text_color, 4)
    
    # Tunnel Connection
    cv2.rectangle(frame, (100, 550), (1100, 720), (200, 220, 200), -1)
    
    # Tunnel Machine
    cv2.rectangle(frame, (530, 560), (670, 710), (150, 150, 150), -1)
    cv2.rectangle(frame, (530, 560), (670, 710), text_color, 4)
    cv2.putText(frame, "TUNEL 6M", (550, 640), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255,255,255), 2)
    
    # Queue Box Markers
    for q in range(8):
        cv2.rectangle(frame, (130, 550 - (q+1)*70), (270, 550 - (q)*70), text_color, 1)
    cv2.putText(frame, "RECEPCION (Max 8)", (115, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, text_color, 2)
    
    for q in range(5):
        cv2.rectangle(frame, (930, 100 + q*70), (1070, 100 + (q+1)*70), text_color, 1)
    cv2.putText(frame, "ENTREGA (Max 5)", (925, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, text_color, 2)
    
    tunnel_occupied_by = None
    for car in cars:
        if car.state in ["TURN_IN", "TUNEL", "TURN_OUT"]:
            tunnel_occupied_by = car.id
            
    # SEMAPHORE LOGIC
    if tunnel_occupied_by is not None:
        cv2.circle(frame, (450, 500), 20, (50, 50, 255), -1) # RED
        cv2.circle(frame, (450, 500), 20, text_color, 2)
        cv2.putText(frame, "TUNEL OCUPADO", (370, 460), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (50, 50, 255), 2)
        cv2.line(frame, (450, 520), (450, 550), text_color, 4)
    else:
        cv2.circle(frame, (450, 500), 20, (50, 255, 50), -1) # GREEN
        cv2.circle(frame, (450, 500), 20, text_color, 2)
        cv2.putText(frame, "TUNEL LIBRE", (385, 460), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (50, 200, 50), 2)
        cv2.line(frame, (450, 520), (450, 550), text_color, 4)
            
    for car in cars:
        if car.state == "WAIT" and i >= car.spawn_frame:
            car.state = "QUEUE"
            car.y = -80
            car.x = 200
            
        if car.state == "QUEUE":
            car.angle = 90
            target_y = 515
            for other in cars:
                if other.id < car.id and other.state == "QUEUE":
                    target_y = min(target_y, other.y - 70)
            
            if car.y < target_y:
                car.y += 5
            else:
                car.y = target_y
                if car.y == 515 and tunnel_occupied_by is None:
                    car.state = "TURN_IN"
                    
        elif car.state == "TURN_IN":
            car.angle = 0
            car.y = 635
            car.x += 6
            if car.x >= 600:
                car.state = "TUNEL"
                car.wash_timer = 0
                car.x = 600
                
        elif car.state == "TUNEL":
            car.angle = 0
            car.wash_timer += 1
            if car.wash_timer >= WASH_FRAMES:
                car.state = "TURN_OUT"
                
        elif car.state == "TURN_OUT":
            car.angle = 0
            car.x += 6
            if car.x >= 1000:
                car.state = "EXIT_Q"
                
        elif car.state == "EXIT_Q":
            car.angle = -90
            target_y = 135
            for other in cars:
                if other.id < car.id and other.state == "EXIT_Q":
                    target_y = max(target_y, other.y + 70)
                    
            if car.y > target_y:
                car.y -= 5
            else:
                car.y = target_y
                car.pickup_timer += 1
                if car.pickup_timer > 150: 
                    car.state = "DONE"

    for car in sorted(cars, key=lambda c: c.y):
        draw_rotated_car(frame, car)

    cv2.putText(frame, "LAVADERO VIP - SIMULACION DE METRICAS", (320, 80), cv2.FONT_HERSHEY_DUPLEX, 0.9, green_color, 2)
    cv2.putText(frame, "AUTOS REALISTAS CON LUCES Y ESPEJOS", (320, 120), cv2.FONT_HERSHEY_SIMPLEX, 0.6, text_color, 2)
    
    cv2.rectangle(frame, (320, 140), (550, 180), text_color, -1)
    cv2.putText(frame, f"RELOJ: {int(virtual_time):02d}:00 MIN", (340, 170), cv2.FONT_HERSHEY_DUPLEX, 0.7, (255,255,255), 2)
    
    out.write(frame)

out.release()
