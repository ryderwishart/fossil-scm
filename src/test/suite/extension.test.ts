import * as assert from 'assert';
import * as vscode from 'vscode';
import * as myExtension from '../../extension';
import { ArchiveExtractor } from '../../fossil/archiveExtractor';
import { FossilExecutable } from '../../fossil/fossilExecutable';
import { FossilHeartbeat } from '../../fossil/fossilHeartbeat';
import { FossilBinaryManager } from '../../fossil/binaryManager';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Check if extension activates', async () => {
		const context = {
			subscriptions: [],
			workspaceState: {
				get: () => undefined,
				update: () => Promise.resolve(),
				keys: () => [],
			} as vscode.Memento,
			globalState: {
				get: () => undefined,
				update: () => Promise.resolve(),
				keys: () => [],
			} as vscode.Memento,
			secrets: {
				get: () => Promise.resolve(undefined),
				store: () => Promise.resolve(),
				delete: () => Promise.resolve(),
				onDidChange: new vscode.EventEmitter<vscode.SecretStorageChangeEvent>().event
			} as vscode.SecretStorage,
			extensionUri: vscode.Uri.parse(''),
			globalStorageUri: vscode.Uri.parse(''),
			storageUri: vscode.Uri.parse(''),
			extensionPath: '',
			logPath: vscode.Uri.parse(''),
			environmentVariableCollection: {
				persistent: true,
				replace: () => { },
				append: () => { },
				prepend: () => { },
				get: () => undefined,
				forEach: () => { },
				delete: () => { },
				clear: () => { },
				description: undefined,
				[Symbol.iterator]: function* () { yield* []; }
			} as vscode.EnvironmentVariableCollection,
		} as unknown as vscode.ExtensionContext; // Mock context
		await myExtension.activate(context);
		assert.ok(context.subscriptions.length > 0, 'Extension should register commands');
	});

	test('ArchiveExtractor should throw error for unsupported format', async () => {
		const archiveUri = vscode.Uri.parse('file:///path/to/unsupported.txt');
		const targetUri = vscode.Uri.parse('file:///path/to/target');
		const progress = { report: (progress: { message?: string; increment?: number }) => { } } as vscode.Progress<{ message?: string; increment?: number }>;

		await assert.rejects(
			ArchiveExtractor.extract(archiveUri, targetUri, progress),
			{ message: 'Unsupported archive format' }
		);
	});

	test('FossilExecutable should execute command', async () => {
		const context = { globalStorageUri: vscode.Uri.parse('file:///path/to/globalStorage') } as vscode.ExtensionContext;
		const fossilExecutable = new FossilExecutable(context);
		const output = await fossilExecutable.executeCommand(['version']);
		assert.ok(output.includes('fossil version'), 'Output should contain version information');
	});

	test('FossilHeartbeat should check status', async () => {
		const context = { globalStorageUri: vscode.Uri.parse('file:///path/to/globalStorage') } as vscode.ExtensionContext;
		const fossilExecutable = new FossilExecutable(context);
		const heartbeat = new FossilHeartbeat(fossilExecutable);
		const status = await heartbeat.checkStatus();
		assert.ok(status.isAvailable, 'Fossil should be available');
	});

	test('FossilBinaryManager should ensure Fossil exists', async () => {
		const context = { globalStorageUri: vscode.Uri.parse('file:///path/to/globalStorage') } as vscode.ExtensionContext;
		const binaryManager = new FossilBinaryManager(context);
		const exists = await binaryManager.ensureFossilExists();
		assert.ok(exists, 'Fossil should be ensured to exist');
	});

	test('Sample test', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});
});
