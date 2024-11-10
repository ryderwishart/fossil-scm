import * as vscode from 'vscode';
import { FossilExecutable } from './fossilExecutable';

export interface FossilStatus {
    isAvailable: boolean;
    version?: string;
    binaryPath?: string;
    error?: string;
}

export class FossilHeartbeat {
    constructor(private fossilExecutable: FossilExecutable) {}

    async checkStatus(): Promise<FossilStatus> {
        try {
            const versionOutput = await this.fossilExecutable.executeCommand(['version']);
            const version = this.parseVersion(versionOutput);
            
            return {
                isAvailable: true,
                version,
                binaryPath: this.fossilExecutable.getBinaryPath()
            };
        } catch (error) {
            return {
                isAvailable: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    private parseVersion(versionOutput: string): string {
        // Example output: "This is fossil version 2.23 [...]"
        const match = versionOutput.match(/fossil version (\d+\.\d+)/i);
        return match ? match[1] : versionOutput.trim();
    }
} 