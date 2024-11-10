import * as vscode from 'vscode';
import * as os from 'os';
import * as https from 'https';
import { FossilExecutable } from './fossilExecutable';
import * as path from 'path';
import { ArchiveExtractor } from './archiveExtractor';
import { FossilHeartbeat, FossilStatus } from './fossilHeartbeat';
import { promises as fs } from 'fs';

interface FossilDownloadUrls {
    win32: string;
    darwin: string;
    linux: string;
}

export class FossilBinaryManager {
    private static readonly DOWNLOAD_URLS: FossilDownloadUrls = {
        win32: 'https://fossil-scm.org/home/uv/fossil-windows-x64-2.25.zip',
        darwin: 'https://fossil-scm.org/home/uv/fossil-macos-x64-2.25.tar.gz',
        linux: 'https://fossil-scm.org/home/uv/fossil-linux-x64-2.25.tar.gz'
    };

    private fossilExecutable: FossilExecutable;
    private heartbeat: FossilHeartbeat;

    constructor(private context: vscode.ExtensionContext) {
        this.fossilExecutable = new FossilExecutable(context);
        this.heartbeat = new FossilHeartbeat(this.fossilExecutable);
    }

    async ensureFossilExists(): Promise<boolean> {
        // First check if fossil is already available
        if (await this.checkFossilInstalled()) {
            return true;
        }

        const response = await vscode.window.showInformationMessage(
            'Fossil SCM is required but not found. Would you like to download and install it?',
            'Yes',
            'Cancel'
        );

        if (response !== 'Yes') {
            return false;
        }

        return await this.downloadAndInstallFossil();
    }

    private async checkFossilInstalled(): Promise<boolean> {
        try {
            const result = await vscode.commands.executeCommand('fossil-scm.checkVersion');
            return !!result;
        } catch {
            return false;
        }
    }

    private async downloadFile(url: string, targetUri: vscode.Uri): Promise<void> {
        return new Promise((resolve, reject) => {
            https.get(url, response => {
                if (response.statusCode !== 200) {
                    reject(new Error(`Failed to download: ${response.statusMessage}`));
                    return;
                }

                const chunks: Buffer[] = [];
                response.on('data', (chunk: Buffer) => chunks.push(chunk));
                response.on('end', async () => {
                    const buffer = Buffer.concat(chunks);
                    await vscode.workspace.fs.writeFile(targetUri, buffer);
                    resolve();
                });
                response.on('error', reject);
            }).on('error', reject);
        });
    }

    private async downloadAndInstallFossil(): Promise<boolean> {
        const platform = os.platform();
        if (!this.isSupportedPlatform(platform)) {
            void vscode.window.showErrorMessage(
                'Your platform is not supported for automatic Fossil installation.'
            );
            return false;
        }

        const downloadUrl = FossilBinaryManager.DOWNLOAD_URLS[platform as keyof FossilDownloadUrls];
        
        return vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Installing Fossil SCM',
                cancellable: true
            },
            async (progress, token) => {
                try {
                    progress.report({ message: 'Downloading Fossil binary...' });
                    
                    // Create the binary directory if it doesn't exist
                    const binaryDir = this.fossilExecutable.getBinaryDir();
                    await vscode.workspace.fs.createDirectory(vscode.Uri.file(binaryDir));

                    const downloadPath = vscode.Uri.file(
                        path.join(binaryDir, path.basename(downloadUrl))
                    );

                    await this.downloadFile(downloadUrl, downloadPath);

                    progress.report({ message: 'Extracting Fossil...' });
                    await ArchiveExtractor.extract(
                        downloadPath,
                        vscode.Uri.file(binaryDir),
                        progress
                    );

                    // Make the binary executable on Unix-like systems
                    if (platform !== 'win32') {
                        const binaryPath = this.fossilExecutable.getBinaryPath();
                        await fs.chmod(binaryPath, 0o755);
                    }

                    // Clean up the archive
                    await vscode.workspace.fs.delete(downloadPath);

                    return true;
                } catch (error) {
                    void vscode.window.showErrorMessage(
                        `Failed to install Fossil: ${error instanceof Error ? error.message : String(error)}`
                    );
                    return false;
                }
            }
        );
    }

    async getFossilVersion(): Promise<string | undefined> {
        try {
            return await this.fossilExecutable.executeCommand(['version']);
        } catch (error) {
            console.error('Failed to get Fossil version:', error);
            return undefined;
        }
    }

    private isSupportedPlatform(platform: string): platform is keyof FossilDownloadUrls {
        return platform in FossilBinaryManager.DOWNLOAD_URLS;
    }

    async getStatus(): Promise<FossilStatus> {
        return await this.heartbeat.checkStatus();
    }
} 