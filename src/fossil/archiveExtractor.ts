import * as vscode from 'vscode';
import * as path from 'path';

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

    private static async extractTarGz(
        archiveUri: vscode.Uri,
        targetUri: vscode.Uri,
        progress: vscode.Progress<{ message?: string; increment?: number }>
    ): Promise<void> {
        const tar = require('tar');
        const zlib = require('zlib');
        const archiveData = await vscode.workspace.fs.readFile(archiveUri);
        
        // Decompress gzip
        const unzipped = await new Promise<Buffer>((resolve, reject) => {
            zlib.gunzip(archiveData, (err: Error | null, result: Buffer) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });

        // Extract tar
        const entries = await tar.list({ sync: true, noResume: true }, [unzipped]);
        for (const entry of entries) {
            progress.report({ message: `Extracting ${entry.name}...` });
            await tar.extract({ 
                file: archiveUri.fsPath,
                cwd: targetUri.fsPath,
                sync: true
            });
        }
    }
} 