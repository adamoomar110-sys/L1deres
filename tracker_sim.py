import os
import sys
import time
import random
import json
import argparse
import requests

# Cargar variables de entorno desde .env o .env.local local del proyecto
def load_env():
    env = {}
    for filename in ['.env', '.env.local']:
        env_path = os.path.join(os.path.dirname(__file__), filename)
        if os.path.exists(env_path):
            with open(env_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, val = line.split('=', 1)
                        env[key.strip()] = val.strip().strip("'\"")
            break
    return env

ENV = load_env()
SUPABASE_URL = ENV.get('SUPABASE_URL') or ENV.get('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = ENV.get('SUPABASE_KEY') or ENV.get('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("⚠️ ADVERTENCIA: No se encontraron credenciales de Supabase (.env o .env.local)")
    print("Crea un archivo .env en esta carpeta con SUPABASE_URL y SUPABASE_KEY si deseas sincronizar con la base de datos.")

# Headers para interactuar con la REST API de Supabase
HEADERS = {
    "apikey": SUPABASE_KEY or "",
    "Authorization": f"Bearer {SUPABASE_KEY}" if SUPABASE_KEY else "",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

# Banco de nombres y colores para avatares
NOMBRES = ["Rayo", "Toro", "Halcón", "Puma", "Tigre", "Furia", "Centella", "Cometa", "Flecha", "Viento", "Cobra", "Trueno", "Ciclón", "Pantera", "Lobo", "Apolo", "Fénix"]
ADJETIVOS = ["Azul", "Rojo", "Gris", "Plata", "Verde", "Negro", "Dorado", "Feroz", "Veloz", "Oscuro", "Blanco", "Brillante", "Neon", "Rápido", "Relámpago"]
COLORES = ["#00f0ff", "#84cc16", "#ffb800", "#3b82f6", "#ef4444", "#a855f7", "#f97316", "#ec4899", "#14b8a6"]

def generar_apodo():
    return f"{random.choice(NOMBRES)} {random.choice(ADJETIVOS)}"

def generar_color():
    return random.choice(COLORES)

# API Helpers para base de datos Supabase
def db_get_all():
    if not SUPABASE_URL: return []
    url = f"{SUPABASE_URL}/rest/v1/lavadero_camera_queue"
    try:
        r = requests.get(url, headers=HEADERS)
        if r.status_code == 200:
            return r.json()
    except Exception as e:
        print(f"Error cargando base de datos: {e}")
    return []

def db_insert(tracking_id, nickname, zone, color):
    if not SUPABASE_URL: return None
    url = f"{SUPABASE_URL}/rest/v1/lavadero_camera_queue"
    body = {
        "tracking_id": tracking_id,
        "nickname": nickname,
        "zone": zone,
        "color": color
    }
    try:
        r = requests.post(url, headers=HEADERS, json=body)
        if r.status_code == 201:
            print(f"🚀 [INSERT] {nickname} registrado en zona '{zone}'")
            return r.json()[0]
    except Exception as e:
        print(f"Error insertando vehículo: {e}")
    return None

def db_update_zone(id, zone):
    if not SUPABASE_URL: return
    url = f"{SUPABASE_URL}/rest/v1/lavadero_camera_queue?id=eq.{id}"
    body = {
        "zone": zone,
        "entered_at": "now()"
    }
    try:
        r = requests.patch(url, headers=HEADERS, json=body)
        if r.status_code in [200, 204]:
            print(f"🔄 [UPDATE] Auto actualizado a zona '{zone}'")
    except Exception as e:
        print(f"Error actualizando zona: {e}")

def db_delete(id):
    if not SUPABASE_URL: return
    url = f"{SUPABASE_URL}/rest/v1/lavadero_camera_queue?id=eq.{id}"
    try:
        r = requests.delete(url, headers=HEADERS)
        if r.status_code in [200, 204]:
            print(f"❌ [DELETE] Auto liberado y eliminado del visualizador")
    except Exception as e:
        print(f"Error eliminando vehículo: {e}")

def db_clear_all():
    if not SUPABASE_URL: return
    url = f"{SUPABASE_URL}/rest/v1/lavadero_camera_queue?id=neq.00000000-0000-0000-0000-000000000000"
    try:
        requests.delete(url, headers=HEADERS)
        print("🧹 Visualizador de clientes limpiado por completo.")
    except Exception as e:
        print(f"Error limpiando tabla: {e}")

# MODO SIMULACIÓN AUTOMÁTICA EN BD
def run_simulation(interval=12):
    if not SUPABASE_URL:
        print("❌ Error: No se puede simular en base de datos remota porque faltan las credenciales.")
        sys.exit(1)
        
    print("🎮 Iniciando Simulación de Lavadero de Autos en Supabase...")
    db_clear_all()
    virtual_id_counter = 100
    
    while True:
        try:
            current_queue = db_get_all()
            num_cars = len(current_queue)
            
            action = random.choice(['add', 'move', 'remove', 'idle'])
            
            if action == 'add' and num_cars < 6:
                nickname = generar_apodo()
                color = generar_color()
                db_insert(virtual_id_counter, nickname, 'espera', color)
                virtual_id_counter += 1
                
            elif action == 'move' and num_cars > 0:
                espera_cars = [c for c in current_queue if c['zone'] == 'espera']
                lavado_cars = [c for c in current_queue if c['zone'] == 'lavado']
                
                if lavado_cars and (not espera_cars or random.random() > 0.5):
                    car_to_move = random.choice(lavado_cars)
                    db_update_zone(car_to_move['id'], 'terminado')
                    print(f"✨ {car_to_move['nickname']} terminó su lavado!")
                elif espera_cars:
                    car_to_move = random.choice(espera_cars)
                    db_update_zone(car_to_move['id'], 'lavado')
                    print(f"💧 {car_to_move['nickname']} ingresó a zona de lavado.")
                    
            elif action == 'remove' and num_cars > 0:
                terminado_cars = [c for c in current_queue if c['zone'] == 'terminado']
                if terminado_cars:
                    car_to_remove = random.choice(terminado_cars)
                    db_delete(car_to_remove['id'])
                    print(f"🚗 {car_to_remove['nickname']} fue retirado por el cliente.")
            
            print(f"Status actual: {len(db_get_all())} vehículos en sistema.")
            time.sleep(interval)
            
        except KeyboardInterrupt:
            print("\n👋 Simulación finalizada.")
            break
        except Exception as e:
            print(f"Error en bucle de simulación: {e}")
            time.sleep(5)

# MODO CÁMARA (OPENCV DETECTOR)
def run_camera(source=0):
    try:
        import cv2
        import numpy as np
    except ImportError:
        print("❌ Error: Para correr el modo cámara, necesitas instalar OpenCV y NumPy.")
        print("Ejecuta: pip install opencv-python numpy")
        sys.exit(1)
        
    print(f"📷 Conectando a cámara en source: {source}...")
    cap = cv2.VideoCapture(source)
    if not cap.isOpened():
        print(f"❌ Error: No se pudo abrir la cámara {source}.")
        sys.exit(1)
        
    zones_file = "lavadero_zones.json"
    zones = {"espera": None, "lavado": None, "terminado": None}
    if os.path.exists(zones_file):
        with open(zones_file, 'r') as f:
            zones = json.load(f)
            print("💾 Configuración de zonas cargada desde archivo.")
            
    print("\n--- INSTRUCCIONES DE CALIBRACIÓN DE CÁMARA ---")
    print("Presiona las siguientes teclas en la ventana de video:")
    print(" 'e': Dibujar Zona ESPERA (Haz clic en 4 puntos en orden horario)")
    print(" 'l': Dibujar Zona LAVADO (Haz clic en 4 puntos en orden horario)")
    print(" 't': Dibujar Zona TERMINADO (Haz clic en 4 puntos en orden horario)")
    print(" 's': Guardar calibración de zonas")
    print(" 'q': Salir del detector")
    print("--------------------------------------------\n")
    
    current_drawing_zone = None
    points = []
    
    def mouse_callback(event, x, y, flags, param):
        nonlocal points
        if event == cv2.EVENT_LBUTTONDOWN:
            points.append((x, y))
            print(f"Punto añadido: ({x}, {y})")
            if len(points) == 4:
                if current_drawing_zone:
                    zones[current_drawing_zone] = points.copy()
                    print(f"✅ Zona {current_drawing_zone.upper()} definida.")
                points = []
                
    cv2.namedWindow("Visualizador de Lavadero - Tracking de Camara")
    cv2.setMouseCallback("Visualizador de Lavadero - Tracking de Camara", mouse_callback)
    
    fgbg = cv2.createBackgroundSubtractorMOG2(history=500, varThreshold=50, detectShadows=True)
    
    while True:
        ret, frame = cap.read()
        if not ret:
            print("⚠️ Error leyendo de la cámara.")
            break
            
        h, w, _ = frame.shape
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Procesar fondo
        fgmask = fgbg.apply(frame)
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        fgmask = cv2.morphologyEx(fgmask, cv2.MORPH_OPEN, kernel)
        fgmask = cv2.morphologyEx(fgmask, cv2.MORPH_CLOSE, kernel)
        
        contours, _ = cv2.findContours(fgmask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Dibujar zonas
        for name, pts in zones.items():
            if pts:
                color = (0, 184, 255) if name == "espera" else (240, 240, 0) if name == "lavado" else (20, 255, 57)
                pts_np = np.array(pts, np.int32)
                cv2.polylines(frame, [pts_np], True, color, 2)
                cv2.putText(frame, name.upper(), (pts[0][0], pts[0][1] - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
                
        # Contornos
        for c in contours:
            if cv2.contourArea(c) < 3000:
                continue
                
            x, y, w_box, h_box = cv2.boundingRect(c)
            cx, cy = x + w_box // 2, y + h_box // 2
            
            cv2.circle(frame, (cx, cy), 5, (0, 0, 255), -1)
            cv2.rectangle(frame, (x, y), (x + w_box, y + h_box), (0, 0, 255), 1)
            
            # Chequear en qué zona cae el auto detectado
            current_zone = None
            for zone_name, pts in zones.items():
                if pts:
                    pts_np = np.array(pts, np.int32)
                    dist = cv2.pointPolygonTest(pts_np, (float(cx), float(cy)), False)
                    if dist >= 0:
                        current_zone = zone_name
                        break
                        
            if current_zone:
                cv2.putText(frame, f"Zona: {current_zone.upper()}", (x, y - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
                
        if current_drawing_zone:
            cv2.putText(frame, f"DIBUJANDO: {current_drawing_zone.upper()} (Haz 4 clics)", (15, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            for p in points:
                cv2.circle(frame, p, 5, (0, 0, 255), -1)
                
        cv2.imshow("Visualizador de Lavadero - Tracking de Camara", frame)
        key = cv2.waitKey(30) & 0xFF
        
        if key == ord('q'):
            break
        elif key == ord('e'):
            current_drawing_zone = "espera"
            points = []
        elif key == ord('l'):
            current_drawing_zone = "lavado"
            points = []
        elif key == ord('t'):
            current_drawing_zone = "terminado"
            points = []
        elif key == ord('s'):
            with open(zones_file, 'w') as f:
                json.dump(zones, f)
            print("💾 Configuración de zonas guardada exitosamente.")
            current_drawing_zone = None
            
    cap.release()
    cv2.destroyAllWindows()

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Visualizador e Integrador de Cámara para Lavadero")
    parser.add_argument('--simulate', action='store_true', help="Ejecutar simulador automático en base de datos remota")
    parser.add_argument('--interval', type=int, default=12, help="Intervalo en segundos para simulación")
    parser.add_argument('--camera', default="0", help="ID de la cámara o URL RTSP")
    parser.add_argument('--clear', action='store_true', help="Limpiar visualizador y salir")
    
    args = parser.parse_args()
    
    if args.clear:
        db_clear_all()
        sys.exit(0)
        
    if args.simulate:
        run_simulation(args.interval)
    else:
        cam_source = args.camera
        if cam_source.isdigit():
            cam_source = int(cam_source)
        run_camera(cam_source)
