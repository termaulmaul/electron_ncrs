const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const prompt = require('electron-prompt');
const fs = require('fs');
const SerialPort = require('serialport');
const promisify = require('node-promisify'); // Add this line
const listSerialPorts = promisify(SerialPort.list); // Use the imported promisify function

let mainWindow;
let validSerialKeyEntered = false;

app.on('ready', () => {
  checkSerialPermission();
  initializeSerialPortListener();
});

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
    fullscreen: true,
  });

  mainWindow.loadFile('index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function checkSerialPermission() {
  const permissionFilePath = 'serial_permission.txt';

  if (fs.existsSync(permissionFilePath) || validSerialKeyEntered) {
    if (validSerialKeyEntered) {
      dialog.showMessageBoxSync(mainWindow, {
        type: 'info',
        buttons: ['OK'],
        title: 'Valid Serial Key',
        message: 'Your license is valid. Thank you!',
      });
    }

    createMainWindow();
    setDocumentTitle(validSerialKeyEntered);
    showAppContent();
    initializeSerialPortListener();
  } else {
    prompt({
      title: 'Serial Permission',
      label: 'Please enter the serial key to continue:',
      inputAttrs: {
        type: 'text',
      },
    })
      .then((enteredSerialKey) => {
        if (enteredSerialKey === null) {
          console.log('User canceled input. Exiting...');
          app.quit();
        } else {
          const validSerialKey = 'Y!*-3nhNJD123';

          if (enteredSerialKey === validSerialKey) {
            fs.writeFileSync(permissionFilePath, enteredSerialKey);
            validSerialKeyEntered = true;

            dialog.showMessageBoxSync(mainWindow, {
              type: 'info',
              buttons: ['OK'],
              title: 'Valid Serial Key',
              message: 'Your license is valid. Thank you!',
            });

            console.log('Serial permission granted!');
            createMainWindow();
            setDocumentTitle(validSerialKeyEntered);
            showAppContent();
            initializeSerialPortListener();
          } else {
            const invalidKeyMessage = 'Invalid serial key. Please contact IT Support to purchase the license.';
            dialog.showMessageBoxSync(mainWindow, {
              type: 'error',
              buttons: ['OK'],
              title: 'Invalid Serial Key',
              message: invalidKeyMessage,
            });

            console.log('Invalid serial key. Exiting...');
            app.quit();
          }
        }
      })
      .catch((err) => {
        console.error(err);
        app.quit();
      });
  }
}

function setDocumentTitle(isActivated) {
  const baseTitle = 'Nurse Call Respons Systems - AMS';
  const title = isActivated ? `${baseTitle} (Activated)` : `${baseTitle} (No License Key)`;
  if (mainWindow) {
    mainWindow.setTitle(title);
  }
}

function showAppContent() {
  if (mainWindow) {
    mainWindow.webContents.send('showAppContent', validSerialKeyEntered);
  }
}

function initializeSerialPortListener() {
    listSerialPorts()
      .then((ports) => {
        const portNames = ports.map((port) => port.path);
        mainWindow.webContents.send('updateSerialPorts', portNames);
      })
      .catch((err) => {
        console.error('Error fetching serial ports:', err);
      });
  }