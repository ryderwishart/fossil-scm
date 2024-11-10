// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { FossilBinaryManager } from './fossil/binaryManager';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Fossil SCM extension is now active');

	const binaryManager = new FossilBinaryManager(context);

	// Register the heartbeat command
	let heartbeatCommand = vscode.commands.registerCommand('fossil-scm.checkStatus', async () => {
		return await binaryManager.getStatus();
	});

	// Register the check version command
	let checkVersionCommand = vscode.commands.registerCommand('fossil-scm.checkVersion', async () => {
		const version = await binaryManager.getFossilVersion();
		if (version) {
			void vscode.window.showInformationMessage(`Fossil version: ${version}`);
			return version;
		}
		return undefined;
	});

	// Register the hello world command
	let helloCommand = vscode.commands.registerCommand('fossil-scm.helloWorld', async () => {
		// First ensure fossil exists
		const fossilExists = await binaryManager.ensureFossilExists();
		if (!fossilExists) {
			void vscode.window.showErrorMessage('Fossil SCM is required to use this extension.');
			return;
		}

		void vscode.window.showInformationMessage('Hello World from fossil-scm!');
	});

	context.subscriptions.push(heartbeatCommand, checkVersionCommand, helloCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {}
