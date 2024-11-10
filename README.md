# Fossil SCM for VS Code

This extension provides Fossil SCM integration for Visual Studio Code, including automatic installation of the Fossil binary.

## Features

- 🚀 Automatic Fossil binary installation
- 🔍 Platform detection and appropriate binary selection
- 💓 Heartbeat functionality to check Fossil status
- 🔒 Safe binary management and execution
- 📝 Detailed logging and error reporting

## Usage

### Basic Status Check

You can check if Fossil is available and properly configured:

```typescript
// In your extension's activate function
export async function activate(context: vscode.ExtensionContext) {
    // First, check if Fossil is available
    const status = await vscode.commands.executeCommand<FossilStatus>('fossil-scm.checkStatus');
    if (!status?.isAvailable) {
        // The fossil-scm extension will handle downloading and installing Fossil
        const response = await vscode.window.showInformationMessage(
            'Fossil SCM is required for this extension. Would you like to install it?',
            'Yes',
            'No'
        );
        if (response === 'Yes') {
            await vscode.commands.executeCommand('fossil-scm.helloWorld'); // This will trigger installation
        }
    }
}
```

### Version Check

Get the installed Fossil version:

```typescript
const version = await vscode.commands.executeCommand<string>('fossil-scm.checkVersion');
if (version) {
    console.log(`Fossil version: ${version}`);
}
```


### Extension Integration

If you're building an extension that depends on Fossil, you can ensure it's available:

```typescript
// In your extension's activate function
export async function activate(context: vscode.ExtensionContext) {
    // First, check if Fossil is available
    const status = await vscode.commands.executeCommand<FossilStatus>('fossil-scm.checkStatus');
    if (!status?.isAvailable) {
        // The fossil-scm extension will handle downloading and installing Fossil
        const response = await vscode.window.showInformationMessage(
            'Fossil SCM is required for this extension. Would you like to install it?',
            'Yes',
            'No'
        );
        if (response === 'Yes') {
            await vscode.commands.executeCommand('fossil-scm.helloWorld'); // This will trigger installation
        }
    }
}
```

### Extension Integration

If you're building an extension that depends on Fossil, you can ensure it's available:

```typescript
// In your extension's activate function
export async function activate(context: vscode.ExtensionContext) {
    // First, check if Fossil is available
    const status = await vscode.commands.executeCommand<FossilStatus>('fossil-scm.checkStatus');
    if (!status?.isAvailable) {
        // The fossil-scm extension will handle downloading and installing Fossil
        const response = await vscode.window.showInformationMessage(
            'Fossil SCM is required for this extension. Would you like to install it?',
            'Yes',
            'No'
        );
        if (response === 'Yes') {
            await vscode.commands.executeCommand('fossil-scm.helloWorld'); // This will trigger installation
        }
    }
}
```

## Known Issues

- Initial installation may require elevated permissions on Unix-like systems
- Some antivirus software may flag the binary download


## Available Commands

| Command | Description |
|---------|-------------|
| `fossil-scm.checkStatus` | Get detailed status of Fossil installation |
| `fossil-scm.checkVersion` | Get the installed Fossil version |
| `fossil-scm.helloWorld` | Test command that ensures Fossil is installed |


## Extension Settings

Currently, this extension doesn't require any settings. It automatically manages the Fossil binary in the extension's global storage area.

## Requirements

- VS Code 1.95.0 or higher
- Internet connection (for initial Fossil download)
- Supported platforms: Windows, macOS, Linux

## Extension Development

### Building

```bash
pnpm run build
```

```bash
pnpm run watch
```

## Release Notes

### 0.0.1

Initial release:

- Basic Fossil binary management
- Platform-specific installation
- Status checking functionality

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[MIT License](LICENSE)

## Support

If you encounter any problems, please file an issue at the [issue tracker](https://github.com/ryderwishart/fossil-scm/issues).
