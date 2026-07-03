import os
from rembg import remove
from PIL import Image

assets_dir = 'assets'
images = ['hilux.png', 'gol.png', 'bmw.png', 'ecosport.png']

for img_name in images:
    img_path = os.path.join(assets_dir, img_name)
    if os.path.exists(img_path):
        print(f"Procesando {img_name}...")
        input_image = Image.open(img_path)
        output_image = remove(input_image)
        output_image.save(img_path)
        print(f"Fondo removido de {img_name}.")
    else:
        print(f"No se encontró {img_name}.")
