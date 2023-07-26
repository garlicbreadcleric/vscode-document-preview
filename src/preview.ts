import * as path from "path";
import * as url from "url";

import { Mutex } from "async-mutex";
import { JSDOM } from "jsdom";
import * as open from "open";
import * as vscode from "vscode";

import { convert } from "./convert";

export class PreviewPanel implements vscode.Disposable {
  protected isActive: boolean = true;
  protected isRendered: boolean = false;

  protected config: vscode.WorkspaceConfiguration;
  protected panel: vscode.WebviewPanel;

  protected jsUri: vscode.Uri;

  protected disposables: vscode.Disposable[] = [];

  protected converterMutex: Mutex = new Mutex();
  protected isDirty: boolean = false;
  protected lastConvertedAt: number = Date.now();

  constructor(protected editor: vscode.TextEditor, protected context: vscode.ExtensionContext) {
    this.config = vscode.workspace.getConfiguration("documentPreview");

    const localResourceRoots: vscode.Uri[] = []; // TODO.
    localResourceRoots.push(vscode.Uri.file(context.extensionPath));
    vscode.workspace.workspaceFolders?.forEach((f) => localResourceRoots.push(f.uri));

    this.panel = vscode.window.createWebviewPanel("documentPreview", "Document Preview", vscode.ViewColumn.Beside, {
      enableScripts: true,
      localResourceRoots,
    });

    this.jsUri = this.makeLocalResourceUri("assets/preview.js");

    vscode.window.onDidChangeActiveTextEditor((ev) => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        this.render(editor.document);
      }
    });

    vscode.workspace.onDidChangeTextDocument(
      (ev) => {
        this.render(ev.document);
      },
      null,
      this.disposables
    );

    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
      this.render(activeEditor.document);
    }

    this.panel.webview.onDidReceiveMessage((message) => {
      switch (message.command) {
        case "link-click": {
          const { href, fileUri } = message;
          if (href.match(/^[a-z]+:\/\//)) {
            open(href);
          } else {
            const previousEditor = vscode.window.visibleTextEditors.find((e) => e.document.uri.toString() === fileUri);
            const viewColumn = previousEditor?.viewColumn || vscode.ViewColumn.Beside;

            vscode.window.showTextDocument(vscode.Uri.parse(path.join(path.dirname(fileUri), href)), { viewColumn });
          }
          return;
        }
      }
    });
  }

  async init() {
    if (!this.isActive) return;
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
      if (converter == null || converter.command == null || converter.command.length === 0) return;
      const baseUri = this.panel.webview.asWebviewUri(document.uri);
      if (this.isRendered && converter.command.length > 1) {
        const result = await convert({
          command: converter.command[1],
          filePath: document.uri.fsPath,
          source: document.getText(),
        });
        if (result.status === "ok") {
          this.renderHtmlBody(document.uri, baseUri, result.body);
        } else {
          console.error(result.message);
        }
      } else {
        const result = await convert({
          command: converter.command[0],
          filePath: document.uri.fsPath,
          source: document.getText(),
        });
        if (result.status === "ok") {
          this.renderHtml(document.uri, baseUri, result.body);
          this.isRendered = true;
        } else {
          console.error(result.message);
        }
      }
      // TODO: error.
    });
  }

  async renderHtml(fileUri: vscode.Uri, baseUri: vscode.Uri, html: string) {
    const dom = new JSDOM(html);
    const scriptElement = dom.window.document.createElement("script");
    scriptElement.setAttribute("src", this.jsUri.toString());
    scriptElement.setAttribute("defer", "true");

    const baseElement = dom.window.document.createElement("base");
    baseElement.id = "document-preview-base";
    baseElement.setAttribute("href", baseUri.toString());

    dom.window.document.head.appendChild(scriptElement);
    dom.window.document.head.appendChild(baseElement);

    this.panel.webview.html = dom.serialize();

    await this.panel.webview.postMessage({
      command: "set-file-uri",
      fileUri: fileUri.toString(),
    });
  }

  async renderHtmlBody(fileUri: vscode.Uri, baseUri: vscode.Uri, html: string) {
    await this.panel.webview.postMessage({
      command: "render-body",
      html,
      fileUri: fileUri.toString(),
      baseUri: baseUri.toString(),
    });
  }

  dispose() {
    if (!this.isActive) return;
    this.isActive = false;
    this.panel.dispose();
    this.disposables.forEach((d) => d.dispose());
  }

  protected getConverter(document: vscode.TextDocument): any | null {
    for (const converter of this.config.converters) {
      if (converter.regex != null && !document.fileName.match(converter.regex)) {
        continue;
      }
      if (converter.fileTypes != null && !converter.fileTypes.includes(document.languageId)) {
        continue;
      }
      return converter;
    }
    return null;
  }

  protected makeLocalResourceUri(resourcePath: string): vscode.Uri {
    return this.panel.webview.asWebviewUri(vscode.Uri.file(this.context.asAbsolutePath(resourcePath)));
  }

  protected makeNodeModulesResourceUri(resourcePath: string): vscode.Uri {
    return this.makeLocalResourceUri(path.join("node_modules", resourcePath));
  }
}
