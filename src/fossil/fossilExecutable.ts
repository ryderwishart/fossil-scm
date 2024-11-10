import * as vscode from 'vscode';
import * as path from 'path';
import { exec } from 'child_process';

export class FossilExecutable {
    private static readonly BINARY_NAME = process.platform === 'win32' ? 'fossil.exe' : 'fossil';
    
    constructor(private context: vscode.ExtensionContext) {}

    getBinaryPath(): string {
        return path.join(this.getBinaryDir(), FossilExecutable.BINARY_NAME);
    }

    getBinaryDir(): string {
        return path.join(this.context.globalStorageUri.fsPath, 'bin');
    }

    async executeCommand(args: string[]): Promise<string> {
        const binaryPath = this.getBinaryPath();
        const outputChannel = vscode.window.createOutputChannel('Fossil SCM');
        
        return new Promise<string>((resolve, reject) => {
            const command = `"${binaryPath}" ${args.join(' ')}`;
            outputChannel.appendLine(`> ${command}`);

            const childProcess = exec(command, {
                maxBuffer: 1024 * 1024 * 10 // 10MB buffer
            }, (error, stdout, stderr) => {
                if (error) {
                    outputChannel.appendLine(stderr);
                    outputChannel.show();
                    reject(new Error(`Command failed: ${error.message}`));
                    return;
                }

                if (stderr) {
                    outputChannel.appendLine(stderr);
                }

                outputChannel.appendLine(stdout);
                resolve(stdout.trim());
            });

            // Set up a timeout to prevent hanging
            const timeout = setTimeout(() => {
                childProcess.kill();
                outputChannel.appendLine('Command timed out');
                reject(new Error('Command timed out'));
            }, 30000); // 30 second timeout

            childProcess.on('exit', () => {
                clearTimeout(timeout);
            });
        }).finally(() => {
            // Don't dispose the output channel immediately - let it stay around for debugging
            // Instead, we'll manage output channels at the extension level
        });
    }
} 