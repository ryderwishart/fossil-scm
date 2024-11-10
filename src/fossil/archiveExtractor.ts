import * as vscode from 'vscode';
import * as tar from 'tar';
import { createGunzip } from 'zlib';
import { createReadStream } from 'fs';

interface JSZipFile {
    dir: boolean;
    async(type: string): Promise<Uint8Array>;
}

interface JSZipFiles {
    [key: string]: JSZipFile;
}

export class ArchiveExtractor {
    static async extract(
        archiveUri: vscode.Uri,
        targetUri: vscode.Uri,
        progress: vscode.Progress<{ message?: string; increment?: number }>
    ): Promise<void> {
        const isZip = archiveUri.fsPath.endsWith('.zip');
        const isTarGz = archiveUri.fsPath.endsWith('.tar.gz');

        if (!isZip && !isTarGz) {
            throw new Error('Unsupported archive format');
        }

        if (isZip) {
            await this.extractZip(archiveUri, targetUri, progress);
        } else {
            await this.extractTarGz(archiveUri, targetUri, progress);
        }
    }

    private static async extractZip(
        archiveUri: vscode.Uri,
        targetUri: vscode.Uri,
        progress: vscode.Progress<{ message?: string; increment?: number }>
    ): Promise<void> {
        const JSZip = require('jszip');
        const archiveData = await vscode.workspace.fs.readFile(archiveUri);
        const zip = await JSZip.loadAsync(archiveData);

        const files = zip.files as JSZipFiles;
        for (const [filename, file] of Object.entries(files)) {
            if (!file.dir) {
                progress.report({ message: `Extracting ${filename}...` });
                const content = await file.async('uint8array');
                const targetPath = vscode.Uri.joinPath(targetUri, filename);
                await vscode.workspace.fs.writeFile(targetPath, content);
            }
        }
    }

    static async extractTarGz(
        sourceUri: vscode.Uri,
        targetUri: vscode.Uri,
        progress?: vscode.Progress<{ message?: string }>
    ): Promise<void> {
        const sourcePath = sourceUri.fsPath;
        const targetPath = targetUri.fsPath;

        return new Promise((resolve, reject) => {
            createReadStream(sourcePath)
                .pipe(createGunzip())
                .pipe(
                    tar.extract({
                        cwd: targetPath,
                        strict: true,
                        onentry: (entry) => {
                            if (progress) {
                                progress.report({ message: `Extracting ${entry.path}...` });
                            }
                        }
                    })
                )
                .on('end', resolve)
                .on('error', reject);
        });
    }
} 