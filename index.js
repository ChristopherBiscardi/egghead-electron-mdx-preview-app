const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const tmpPath = app.getPath("temp");
const fs = require("fs");
const { mdx, sync } = require("@mdx-js/mdx");
const { transformSync } = require("@babel/core");
const { dialog } = require("electron");
const crypto = require("crypto");

// // disable http cache, mdx preview depends on it
// app.commandLine.appendSwitch("disable-http-cache");
const windows = {
  editor: undefined,
  preview: undefined,
};
app.allowRendererProcessReuse = true;

const previewCache = {};

ipcMain.on("create-mdx", (event, { filename }) => {
  fs.writeFileSync(filename, "");
  event.returnValue = "done";
});

ipcMain.on("update-mdx", (event, { filename, value }) => {
  const hash = crypto.createHash("md5").update(filename).digest("hex");
  previewCache[hash] = previewCache[hash] ? previewCache[hash] + 1 : 1;
  const mdxPreviewPath = path.resolve(
    tmpPath,
    `preview-mdx-${hash}-${previewCache[hash]}.js`
  );

  try {
    const mdxContent = sync(value);
    const { code } = transformSync(mdxContent, {
      plugins: [`@babel/plugin-transform-react-jsx`],
    }); // => { code, map, ast }
    fs.writeFileSync(mdxPreviewPath, code);
    if (windows.preview) {
      windows.preview.webContents.send("mdx-changed", { mdxPreviewPath });
    }
    // event.reply("mdx-changed", { mdxPreviewPath });
  } catch (e) {
    if (windows.preview) {
      windows.preview.webContents.send("mdx-changed", { error: e });
    }
    // event.reply("mdx-changed", { error: e });
    console.log("error", e);
  }
});

ipcMain.on("open-preview", () => {
  createPreviewWindow();
});

function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
  });
  windows.editor = win;
  // and load the index.html of the app.
  win.loadFile("index.html");

  // Open the DevTools.
  // win.webContents.openDevTools();
}

function createPreviewWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
  });
  windows.preview = win;

  // and load the preview.html of the app.
  win.loadFile("preview.html");

  // Open the DevTools.
  // win.webContents.openDevTools();

  // win.webContents.session /*.defaultSession*/.webRequest
  //   .onBeforeRequest({ urls: ["*://*/*"] }, ({ url }, callback) => {
  //     console.log("url", url);
  //     callback({ cancel: false });
  //     // const filepath = url.split("file:///")[1];
  //     // console.log(">> intercept", filepath);
  //     // if (files.includes(filepath)) {
  //     //   callback({
  //     //     cancel: false,
  //     //     redirectURL:
  //     //       "file://" + path.join(path.resolve("."), "public", filepath),
  //     //   });
  //     // } else {
  //     //   callback({ cancel: false });
  //     // }
  //   });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
