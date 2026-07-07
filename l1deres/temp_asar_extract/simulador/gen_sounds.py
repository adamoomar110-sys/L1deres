import wave
import math
import struct
import os

SAMPLE_RATE = 44100

def write_wav(filename, data):
    with wave.open(filename, 'w') as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(SAMPLE_RATE)
        f.writeframes(data)

def generate_beep(freq, duration, volume=0.5):
    n_samples = int(SAMPLE_RATE * duration)
    data = bytearray()
    period = SAMPLE_RATE / freq
    for i in range(n_samples):
        value = 32767 if (i % period) < (period / 2) else -32767
        data += struct.pack('<h', int(value * volume))
    return data

def generate_silence(duration):
    n_samples = int(SAMPLE_RATE * duration)
    return bytearray(b'\x00\x00' * n_samples)

def generate_sweep(start_freq, end_freq, duration, volume=0.5):
    n_samples = int(SAMPLE_RATE * duration)
    data = bytearray()
    for i in range(n_samples):
        current_freq = start_freq + (end_freq - start_freq) * (i / n_samples)
        period = SAMPLE_RATE / current_freq
        value = 32767 if (i % period) < (period / 2) else -32767
        data += struct.pack('<h', int(value * volume))
    return data

def main():
    if not os.path.exists("assets"):
        os.makedirs("assets")
        
    # 1. Alerta nuevo auto (doble beep agudo)
    data = generate_beep(1000, 0.1, 0.2) + generate_silence(0.1) + generate_beep(1200, 0.1, 0.2)
    write_wav("assets/alert.wav", data)
    
    # 2. Escáner (Sweep agudo rápido)
    data = generate_sweep(1500, 2500, 0.3, 0.1)
    write_wav("assets/scan.wav", data)
    
    # 3. Cash / Ticket (blip corto muy agudo)
    data = generate_beep(2000, 0.05, 0.2) + generate_beep(3000, 0.1, 0.2)
    write_wav("assets/cash.wav", data)
    
    print("Sonidos generados con éxito.")

if __name__ == "__main__":
    main()
