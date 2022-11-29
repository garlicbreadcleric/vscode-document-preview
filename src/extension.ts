import * as vscode from 'vscode';
import { PreviewPanel } from './preview';

let panel: PreviewPanel | undefined;

async function openPreview(context: vscode.ExtensionContext) {
	const activeEditor = vscode.window.activeTextEditor;
	if (!activeEditor) return;
	if (panel) panel.dispose();
	panel = new PreviewPanel(activeEditor, context);
	await panel.init();
}

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.commands.registerCommand('documentPreview.openDocumentPreview', () => openPreview(context)));
}

export function deactivate() {
	if (panel) panel.dispose();
}
