/*
 * Copyright (C) 2018-2019 Gigadrive - All rights reserved.
 * https://gigadrivegroup.com
 * https://qpo.st
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://gnu.org/licenses/>
 */

const {remote, app, BrowserWindow, Menu, webContents, ipcMain: ipc} = require('electron');
const {autoUpdater} = require("electron-updater");
const {setup: setupPushReceiver} = require('electron-push-receiver');
const path = require('path');
let mainWindow;
let webviewId;

app.on('ready', () => {
	autoUpdater.checkForUpdatesAndNotify();

	const width = 1024;
	const height = 768;

	mainWindow = new BrowserWindow({
		titleBarStyle: 'hidden-inset',
		frame: false,
		webPreferences: {
			nodeIntegration: true,
			webviewTag: true
		},
		height,
		width,
		minHeight: 940,
		minWidth: 500
	});
	mainWindow.loadURL(path.join('file://', __dirname, 'index.html'));
	// mainWindow.openDevTools({mode: 'bottom'});
	mainWindow.maximize();

	//createMenu();
});

ipc.on("finishedWebviewInitiation", (event) => {
	console.log("received message", event);
	setupPushReceiver(getWebviewWebContents());
});

// get the webview's webContents
function getWebviewWebContents() {
	const contents = webContents.getAllWebContents().filter(value => {
		return value.getURL().toString().startsWith("http://localhost:8000");
	});

	return contents.length > 0 ? contents[0] : null;
}

function createMenu() {

	const topLevelItems = [
		{
			label: 'Application',
			submenu: [
				{
					label: 'Quit',
					accelerator: 'CmdOrCtrl+Q',
					click() {
						app.quit();
					}
				}
			]
		},
		{
			label: 'Edit',
			submenu: [
				{label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo'},
				{label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo'},
				{type: 'separator'},
				{label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut'},
				{label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy'},
				{label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste'},
				{label: 'Select All', accelerator: 'CmdOrCtrl+A', role: 'selectall'}
			]
		},
		{
			label: 'Actions',
			submenu: [
				{
					label: 'Mark All As Complete',
					click() {
						// send an IPC message to the webview for handling
						const wc = getWebviewWebContents();
						wc.send('markAllComplete');
					}
				}
			]
		}
	];

	Menu.setApplicationMenu(Menu.buildFromTemplate(topLevelItems));
}
