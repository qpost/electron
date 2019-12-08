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

// in preload scripts, we have access to node.js and electron APIs
// the remote web app will not, so this is safe
const {ipcRenderer: ipc, remote} = require('electron');


init();


function init() {
	attachIPCListeners();

	// Expose a bridging API to remote app's window.
	// We'll add methods to it here first, and when the remote web app loads,
	// it'll add some additional methods as well.
	//
	// !CAREFUL! do not expose any functionality or APIs that could compromise the
	// user's computer. E.g. don't directly expose core Electron (even IPC) or node.js modules.
	window.Bridge = {
		setDockBadge
	};
}

function attachIPCListeners() {
	// we get this message from the main process, and then tell the todo app to make it so
	// the todo app defines this function
	/*ipc.on('markAllComplete', () => {
	  window.Bridge.markAllComplete();
	});*/
}

// the todo app calls this when the todo count changes
function setDockBadge(count) {
	if (process.platform === 'darwin') {
		remote.app.dock.setBadge('' + (count || ''));
	}
}