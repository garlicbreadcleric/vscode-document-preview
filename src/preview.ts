import { Mutex } from "async-mutex";
import * as path from "path";

import * as vscode from "vscode";
import { convert } from "./convert";

export type PreviewResources = {
    customCssUri: vscode.Uri | null;

    jsUri: vscode.Uri;
    themeCssUri: vscode.Uri;
    highlightThemeCssUri: vscode.Uri;

    fontAwesomeBaseUri: vscode.Uri;
    katexBaseUri: vscode.Uri;
    glightboxBaseUri: vscode.Uri;
    mermaidBaseUri: vscode.Uri;
};

export class PreviewPanel implements vscode.Disposable {
    protected config: vscode.WorkspaceConfiguration;
    protected isActive: boolean = true;
    protected panel: vscode.WebviewPanel;
    protected resources: PreviewResources;

    protected disposables: vscode.Disposable[] = [];

    protected converterMutex: Mutex = new Mutex();
    protected isDirty: boolean = false;
    protected lastConvertedAt: number = Date.now();

    constructor(protected editor: vscode.TextEditor, protected context: vscode.ExtensionContext) {
        this.config = vscode.workspace.getConfiguration('documentPreview');

        const localResourceRoots: vscode.Uri[] = []; // TODO.
        localResourceRoots.push(vscode.Uri.file(context.extensionPath));
        vscode.workspace.workspaceFolders?.forEach(f => localResourceRoots.push(f.uri));

        if (this.config.customCssPath != null && this.config.customCssPath.trim() != "") {
            localResourceRoots.push(vscode.Uri.file(path.dirname(this.config.customCssPath)))
        }
        this.panel = vscode.window.createWebviewPanel('documentPreview', 'Document Preview', vscode.ViewColumn.Beside, { enableScripts: true, localResourceRoots });

        this.resources = {
            customCssUri: null,
            
            jsUri: this.makeLocalResourceUri('assets/preview.js'),
            themeCssUri: this.makeLocalResourceUri(`assets/themes/${this.config.theme}.css`),
            highlightThemeCssUri: this.makeLocalResourceUri(`assets/highlight-themes/${this.config.highlightTheme}.css`),

            fontAwesomeBaseUri: this.makeLocalResourceUri('assets/fontawesome'),
            katexBaseUri: this.makeNodeModulesResourceUri('katex/dist'),
            glightboxBaseUri: this.makeNodeModulesResourceUri('glightbox/dist'),
            mermaidBaseUri: this.makeNodeModulesResourceUri('mermaid/dist'),
        };
        if (this.config.customCssPath != null && this.config.customCssPath.trim() != "") {
            this.resources.customCssUri = this.panel.webview.asWebviewUri(vscode.Uri.file(this.config.customCssPath));
        }

        vscode.window.onDidChangeActiveTextEditor(ev => {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                this.render(editor.document);
            }
        });

        vscode.workspace.onDidChangeTextDocument(ev => {
            this.render(ev.document);
        }, null, this.disposables);

        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            this.render(activeEditor.document);
        }
    }

    async init() {
        if (!this.isActive) return;

        const meta = {
            features: this.config.previewFeatures,
        };
        const resources = this.resources;
        const customCssHtml = resources.customCssUri == null ? '' : `<link rel="stylesheet" type="text/css" href="${resources.customCssUri.toString()}" />`;

        this.panel.webview.html = `
<!DOCTYPE html>
<html>
  <head>
    <base href="" id="documentPreview-base" />

    <meta name="documentPreview-input" content="${Buffer.from(JSON.stringify(meta)).toString('base64')}" />

    <script src="${resources.mermaidBaseUri.toString()}/mermaid.min.js"></script>
    <script type="text/javascript">mermaid.mermaidAPI.initialize({ startOnLoad:false, theme:'dark' });</script>
    
    <link rel="stylesheet" type="text/css" href="${resources.katexBaseUri.toString()}/katex.min.css" />
    <script src="${resources.katexBaseUri.toString()}/katex.min.js" defer=""></script>
    
    <link rel="stylesheet" type="text/css" href="${resources.glightboxBaseUri.toString()}/css/glightbox.min.css" />
    <script src="${resources.glightboxBaseUri.toString()}/js/glightbox.min.js" defer=""></script>
    
    <link rel="stylesheet" type="text/css" href="${resources.fontAwesomeBaseUri.toString()}/css/fontawesome.min.css" />
    <link rel="stylesheet" type="text/css" href="${resources.fontAwesomeBaseUri.toString()}/css/regular.min.css" />
    <link rel="stylesheet" type="text/css" href="${resources.fontAwesomeBaseUri.toString()}/css/solid.min.css" />
    <link rel="stylesheet" type="text/css" href="${resources.fontAwesomeBaseUri.toString()}/css/brands.min.css" />
    
    ${customCssHtml}
    <link rel="stylesheet" type="text/css" href="${resources.themeCssUri.toString()}" />
    <link rel="stylesheet" type="text/css" href="${resources.highlightThemeCssUri.toString()}" />
    <script src="${resources.jsUri}" defer=""></script>
  </head>

  <body class="documentPreview">
  </body>
</html>
        `;
    }

    async render(document: vscode.TextDocument) {
        if (this.converterMutex.isLocked()) {
            const now = Date.now();
            this.isDirty = true;
            setTimeout(() => {
                if (this.isDirty && now > this.lastConvertedAt) this.render(document);
            }, 500);
            return;
        }
        this.converterMutex.runExclusive(async () => {
            if (!this.isActive) return;
            if (document.fileName != vscode.window.activeTextEditor?.document.fileName) return;
            this.isDirty = false;
            this.lastConvertedAt = Date.now();
            const converter = this.getConverter(document);
            if (converter == null || converter.command == null) return;
            const result = await convert({command: converter.command, filePath: document.uri.fsPath, source: document.getText()});
            if (result.status === "ok") {
                const baseUri = this.panel.webview.asWebviewUri(document.uri);
                this.renderHtml(document.uri, baseUri, result.body);
            }
            // TODO: error.
        });
    }

    async renderHtml(fileUri: vscode.Uri, baseUri: vscode.Uri, body: string) {
        await this.panel.webview.postMessage({ type: "render", body, fileUri: fileUri.toString(), baseUri: baseUri.toString() });
    }

    dispose() {
        if (!this.isActive) return;
        this.isActive = false;
        this.panel.dispose();
        this.disposables.forEach(d => d.dispose());
    }

    protected getConverter(document: vscode.TextDocument): any | null {
        for (const converter of this.config.converters) {
            // if (converter.regex != null && filePath.match(converter.regex)) {
            //     return converter;
            // }
            if (converter.fileTypes != null && converter.fileTypes.includes(document.languageId)) {
                return converter;
            }
        }
        return null;
    }

    protected makeLocalResourceUri(resourcePath: string): vscode.Uri {
        return this.panel.webview.asWebviewUri(vscode.Uri.file(
            this.context.asAbsolutePath(resourcePath)
        ));
    }

    protected makeNodeModulesResourceUri(resourcePath: string): vscode.Uri {
        return this.makeLocalResourceUri(path.join('node_modules', resourcePath));
    }
}