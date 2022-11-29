// import { Converter, ConverterConfig } from './converter';

// import * as open from 'open';
// import * as vscode from 'vscode';

// import * as path from 'path';
// import { Mutex } from 'async-mutex';

// export class PreviewPanel implements vscode.Disposable {
//     config: vscode.WorkspaceConfiguration;

//     protected isActive: boolean;
//     protected panel: vscode.WebviewPanel;
//     protected converter: Converter;
//     protected converterMutex: Mutex = new Mutex();
//     protected isDirty: boolean = false;
//     protected lastConvertedAt: number = Date.now();
    
//     protected disposables: vscode.Disposable[];

//     protected customCssUri: vscode.Uri | null;

//     protected jsUri: vscode.Uri;
//     protected themeCssUri: vscode.Uri;
//     protected highlightThemeCssUri: vscode.Uri;

//     protected fontAwesomeUri: vscode.Uri;
//     protected katexUri: vscode.Uri;
//     protected glightboxUri: vscode.Uri;
//     protected hljsUri: vscode.Uri;
//     protected mermaidUri: vscode.Uri;

//     constructor(protected editor: vscode.TextEditor, protected context: vscode.ExtensionContext) {
//         const config = vscode.workspace.getConfiguration('documentPreview');
//         this.config = config;

//         this.isActive = true;

//         const localResourceRoots: vscode.Uri[] = [];
//         localResourceRoots.push(vscode.Uri.file(context.extensionPath));
//         vscode.workspace.workspaceFolders?.forEach(f => localResourceRoots.push(f.uri));

//         if (config.customCssPath != null && config.customCssPath.trim() != "") {
//             localResourceRoots.push(vscode.Uri.file(path.dirname(config.customCssPath)))
//         }

//         this.panel = vscode.window.createWebviewPanel('documentPreview', 'Document Preview', vscode.ViewColumn.Beside, { enableScripts: true, localResourceRoots });
//         this.converter = new Converter(config.converters);
        
//         this.customCssUri = null;
//         if (config.customCssPath != null && config.customCssPath.trim() != "") {
//             this.customCssUri = this.panel.webview.asWebviewUri(vscode.Uri.file(config.customCssPath));
//         }

//         this.jsUri = this.panel.webview.asWebviewUri(vscode.Uri.file(
//             context.asAbsolutePath('assets/preview.js')
//         ));

//         this.themeCssUri = this.panel.webview.asWebviewUri(vscode.Uri.file(
//             context.asAbsolutePath(`assets/themes/${config.theme}.css`)
//         ));

//         this.highlightThemeCssUri = this.panel.webview.asWebviewUri(vscode.Uri.file(
//             context.asAbsolutePath(`assets/highlight-themes/${config.highlightTheme}.css`)
//         ));

//         this.fontAwesomeUri = this.panel.webview.asWebviewUri(vscode.Uri.file(
//             context.asAbsolutePath('assets/fontawesome')
//         ))

//         this.katexUri = this.panel.webview.asWebviewUri(vscode.Uri.file(
//             context.asAbsolutePath('node_modules/katex/dist')
//         ));

//         this.glightboxUri = this.panel.webview.asWebviewUri(vscode.Uri.file(
//             context.asAbsolutePath('node_modules/glightbox/dist')
//         ));

//         this.hljsUri = this.panel.webview.asWebviewUri(vscode.Uri.file(
//             context.asAbsolutePath('node_modules/@highlightjs/cdn-assets')
//         ));

//         this.mermaidUri = this.panel.webview.asWebviewUri(vscode.Uri.file(
//             context.asAbsolutePath('node_modules/mermaid/dist')
//         ));

//         this.disposables = [];

//         vscode.window.onDidChangeActiveTextEditor(ev => {
//             const editor = vscode.window.activeTextEditor;
//             if (editor) {
//                 this.render(editor.document);
//             }
//         });

//         vscode.workspace.onDidChangeTextDocument(ev => {
//             this.render(ev.document);
//         }, null, this.disposables);

//         const activeEditor = vscode.window.activeTextEditor;
//         if (activeEditor) {
//             this.render(activeEditor.document);
//         }

//         this.panel.webview.onDidReceiveMessage(message => {
//             console.log(JSON.stringify(message));
//             switch (message.command) {
//                 case 'click-link':
//                     const {href, filePath} = message;
//                     if (href.match(/^[a-z]+:\/\//)) {
//                         open(href);
//                     } else {
//                         const previousEditor = vscode.window.visibleTextEditors.find(e => e.document.uri.fsPath === filePath);
//                         const viewColumn = previousEditor?.viewColumn || vscode.ViewColumn.Beside;
                        
//                         vscode.window.showTextDocument(
//                             vscode.Uri.file(
//                                 path.join(path.dirname(filePath), href)
//                             ),
//                             {viewColumn}
//                         );
//                     }
//                     return;
//             }
//         });
//     }

//     render(document: vscode.TextDocument) {
//         if (this.converterMutex.isLocked()) {
//             const now = Date.now();
//             this.isDirty = true;
//             setTimeout(() => {
//                 if (this.isDirty && now > this.lastConvertedAt) this.render(document);
//             }, 500);
//             return;
//         }
//         this.converterMutex.runExclusive(async () => {
//             if (!this.isActive) return;
//             this.isDirty = false;
//             this.lastConvertedAt = Date.now();

//             let fileUri = document.uri;
//             if (fileUri.scheme === "markane-flashcard") {
//                 fileUri = fileUri.with({scheme: "file"});
//             }
//             const fileType = document.languageId;
//             const baseUri = this.panel.webview.asWebviewUri(fileUri);
//             const source = document.getText();

//             const html = await this.converter.render({
//                 source,
//                 fileType,

//                 fileUri,
//                 baseUri,
//                 jsUri: this.jsUri,
//                 themeCssUri: this.themeCssUri,
//                 customCssUri: this.customCssUri,
//                 highlightThemeCssUri: this.highlightThemeCssUri,
//                 fontAwesomeUri: this.fontAwesomeUri,
//                 katexUri: this.katexUri,
//                 glightboxUri: this.glightboxUri,
//                 hljsUri: this.hljsUri,
//                 mermaidUri: this.mermaidUri,

//                 features: this.config.previewFeatures
//             });
            
//             if (html) {
//                 this.showHtml(html);
//             }
//         })
//     }

//     showHtml(html: string) {
//         this.panel.webview.html = html;
//     }

//     dispose() {
//         if (!this.isActive) return;
//         this.isActive = false;
//         this.converter.dispose();
//         this.panel.dispose();
//         this.disposables.forEach(d => d.dispose());
//     }
// }
