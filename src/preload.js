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
const {
	NOTIFICATION_SERVICE_STARTED,
	NOTIFICATION_SERVICE_ERROR,
	NOTIFICATION_RECEIVED: ON_NOTIFICATION_RECEIVED,
	TOKEN_UPDATED,
} = require("electron-push-receiver/src/constants");


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

	// https://github.com/MatthieuLemoine/electron-push-receiver
	ipc.on(NOTIFICATION_SERVICE_STARTED, (_, token) => {
		console.log("Notification service started", _, token);

		doSubscription(token);
	});

	ipc.on(NOTIFICATION_SERVICE_ERROR, (_, error) => {
		console.error("Notification service error", _, error);
	});

	ipc.on(TOKEN_UPDATED, (_, token) => {
		console.log("Token updated", _, token);

		doSubscription(token);
	});

	ipc.on(ON_NOTIFICATION_RECEIVED, (_, serverNotificationPayload) => {
		console.log("notification received", serverNotificationPayload);

		// check to see if payload contains a body string, if it doesn't consider it a silent push
		if (typeof serverNotificationPayload.notification.body !== "undefined") {
			// payload has a body, so show it to the user
			console.log('display notification', serverNotificationPayload);
			let myNotification = new Notification(serverNotificationPayload.notification.title, {
				body: serverNotificationPayload.notification.body,
				icon: serverNotificationPayload.notification.icon
			});

			myNotification.onclick = () => {
				console.log('Notification clicked')
			}
		} else {
			// payload has no body, so consider it silent (and just consider the data portion)
			console.log('do something with the key/value pairs in the data', serverNotificationPayload.data)
		}
	});
}

function doSubscription(token) {
	const Config = require("electron-config");
	const config = new Config();
	const credentials = config.get("credentials");

	console.log("credentials", credentials);

	const url = "https://fcm.googleapis.com/fcm/send/" + token;
	const subscription = {
		endpoint: url,
		expirationTime: null,
		keys: {
			p256dh: credentials.keys.publicKey,
			auth: credentials.keys.authSecret
		},
		GCM: credentials.gcm.token
	};

	fetch("http://localhost:8000/webpush/", {
		method: 'POST',
		mode: 'cors',
		credentials: 'include',
		cache: 'default',
		headers: new Headers({
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		}),
		body: JSON.stringify({
			subscription: subscription,
			options: {},
		})
	}).then(() => {
		console.log("subscribed");
	}).catch(reason => {
		console.error("failed to subscribe");
	});
}

// the todo app calls this when the todo count changes
function setDockBadge(count) {
	if (process.platform === 'darwin') {
		remote.app.dock.setBadge('' + (count || ''));
	}
}