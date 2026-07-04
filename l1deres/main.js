const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow () {
  // Crear la ventana del navegador.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    icon: path.join(__dirname, 'logo.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Ocultar el menú superior para darle un toque premium/nativo
  mainWindow.setMenuBarVisibility(false);

  // Cargar el index.html de la aplicación.
  mainWindow.loadFile('index.html');

  // Abrir maximizado por defecto
  mainWindow.maximize();
}

// Este método se llamará cuando Electron haya finalizado
// la inicialización y esté listo para crear ventanas del navegador.
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    // En macOS es común volver a crear una ventana en la app cuando
    // el icono del dock es clicado y no hay otras ventanas abiertas.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Salir cuando todas las ventanas estén cerradas, excepto en macOS.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
