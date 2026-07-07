import requests
import time
import json
import uuid
import datetime
import sys

# Forzar utf-8 en consola si es posible, o ignorar
sys.stdout.reconfigure(encoding='utf-8')

SB_URL = 'https://hacmhlyvyyysnvekvhya.supabase.co'
SB_KEY = 'sb_publishable_oEB1MoOee7lM99mvHCu_aA_T98vg3NA'
SB_TABLE = 'lavadero_camera_queue'

HEADERS = {
    'apikey': SB_KEY,
    'Authorization': f'Bearer {SB_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}

def simular_domo():
    print("Iniciando simulacion del domo (Camara LPR)...")
    
    # 1. Buscar autos reservados
    print("Buscando vehiculos con reserva previa (zone=reservado)...")
    res = requests.get(f"{SB_URL}/rest/v1/{SB_TABLE}?zone=eq.reservado", headers=HEADERS)
    autos = res.json()
    
    auto_id = None
    patente = "AB123CD"
    
    if len(autos) > 0:
        print(f"EXITO Se encontraron {len(autos)} reservas! Tomando la primera...")
        auto = autos[0]
        auto_id = auto['id']
        patente = auto.get('plate', 'AB123CD')
    else:
        print("No hay reservas. Creando un auto de prueba desde la app del cliente...")
        auto_id = str(uuid.uuid4())
        payload = {
            "id": auto_id,
            "tracking_id": 999,
            "nickname": '{"name":"Cliente Test","plate":"AB123CD","budget":18000,"description":"Lavado VIP"}',
            "zone": "reservado",
            "color": "#ff0000",
            "entered_at": datetime.datetime.utcnow().isoformat()
        }
        requests.post(f"{SB_URL}/rest/v1/{SB_TABLE}", headers=HEADERS, json=payload)
        print("Vehiculo 'Cliente Test' reservado. Esperando a que arribe al local (3s)...")
        time.sleep(3)
        
    # Simular lectura de patente
    print(f"CLIC! Camara detecta patente {patente} en la entrada.")
    time.sleep(1)
    print("Procesando imagen con IA y cruzando datos...")
    time.sleep(1.5)
    
    # Actualizar estado a pre_espera
    patch_url = f"{SB_URL}/rest/v1/{SB_TABLE}?id=eq.{auto_id}"
    update_data = {
        "zone": "pre_espera",
        "entered_at": datetime.datetime.utcnow().isoformat()
    }
    res_patch = requests.patch(patch_url, headers=HEADERS, json=update_data)
    
    if res_patch.status_code in [200, 204]:
        print("EXITO El vehiculo ha sido ingresado al sistema automaticamente (Ingreso Inteligente).")
        print("Revisa la pantalla de Mesa de Control, el auto deberia haber pasado a la cola principal.")
    else:
        print(f"Error al actualizar Supabase: {res_patch.text}")

if __name__ == '__main__':
    simular_domo()
