// import * as path from 'path';

// import * as vscode from 'vscode';
// import * as sanitizeHtml from 'sanitize-html';
// import { exec, ExecOptions } from 'child_process';

// export interface ConverterConfig {
//     name: string | undefined;
//     tags: string[] | undefined;
//     type: "html" | "text" | undefined;
//     fileTypes: string[],
//     command: string | undefined;
//     standalone: boolean | undefined;
// }

// export interface ConverterInput {
//     source: string;
//     fileType: string;

//     fileUri: vscode.Uri;
//     jsUri: vscode.Uri;
//     themeCssUri: vscode.Uri;
//     customCssUri: vscode.Uri | null;
//     highlightThemeCssUri: vscode.Uri;
//     baseUri: vscode.Uri;

//     fontAwesomeUri: vscode.Uri;
//     katexUri: vscode.Uri;
//     glightboxUri: vscode.Uri;
//     hljsUri: vscode.Uri;
//     mermaidUri: vscode.Uri;

//     features: {
//         mermaid: boolean;
//         katex: boolean;
//         glightbox: boolean;
//         fontAwesome: boolean;
//     };
// }

// /**
//  * Interface for CLI programs that convert documents to HTML.
//  */
// export class Converter implements vscode.Disposable {
//     constructor(protected converters: ConverterConfig[]) {
//     }
        
//     async render(input: ConverterInput): Promise<string | null> {
//         const converter = this.getConverter(input.fileType);
//         if (!converter || !converter.command) return null;

//         let html = await this.execCmd(<string>converter.command, input.source, { cwd: path.dirname(input.fileUri.path) });

//         if (converter.type === "html") {
//             html = sanitizeHtml(html, {
//                 allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'video', 'audio', 'source', 'input', 'del']),
//                 allowedAttributes: {
//                     a: ['href', 'name', 'target'],
//                     img: ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading'],
//                     audio: ['controls', 'src'],
//                     video: ['controls', 'src', 'muted', 'loop'],
//                     source: ['src', 'type'],
//                     input: ['type', 'value', 'disabled', 'checked'],
//                     '*': ['id', 'class', 'style']
//                 },
//             });
//         } else if (converter.type === "text") {
//             html = sanitizeHtml(html, {
//                 allowedTags: [],
//                 allowedAttributes: {},
//                 allowedClasses: {},
//                 allowedSchemes: [],
//                 disallowedTagsMode: 'recursiveEscape'
//             });
//         } else {
//             return null; // todo error?
//         }

//         if (!converter.standalone) {
//             if (converter.type === 'text') {
//                 html = `<pre>${html}</pre>`;
//             }

//             const tagList = (converter.tags || []).map(t => `documentPreview-${t}`).join(' ');
//             const baseUriHtml = input.baseUri == null ? '' : `<base href="${input.baseUri.toString()}" />`;
//             const customCssHtml = input.customCssUri == null ? '' : `c`;

//             html = `
// <!DOCTYPE html>
// <html>
//     <head>
//         ${baseUriHtml}
//         <meta name="documentPreview-input" content="${Buffer.from(JSON.stringify(input)).toString('base64')}" />

//         <script src="${input.mermaidUri.toString()}/mermaid.min.js"></script>
//         <script type="text/javascript">mermaid.mermaidAPI.initialize({ startOnLoad:false, theme:'dark' });</script>
        
//         <link rel="stylesheet" type="text/css" href="${input.katexUri.toString()}/katex.min.css" />
//         <script src="${input.katexUri.toString()}/katex.min.js" defer=""></script>

//         <link rel="stylesheet" type="text/css" href="${input.glightboxUri.toString()}/css/glightbox.min.css" />
//         <script src="${input.glightboxUri.toString()}/js/glightbox.min.js" defer=""></script>

//         <link rel="stylesheet" type="text/css" href="${input.hljsUri.toString()}/styles/github-dark.min.css" />
//         <script src="${input.hljsUri.toString()}/highlight.min.js" defer=""></script>
//         <script src="${input.hljsUri.toString()}/languages/scheme.min.js" defer=""></script>
//         <script src="${input.hljsUri.toString()}/languages/haskell.min.js" defer=""></script>
        
//         <link rel="stylesheet" type="text/css" href="${input.fontAwesomeUri.toString()}/css/fontawesome.min.css" />
//         <link rel="stylesheet" type="text/css" href="${input.fontAwesomeUri.toString()}/css/regular.min.css" />
//         <link rel="stylesheet" type="text/css" href="${input.fontAwesomeUri.toString()}/css/solid.min.css" />
//         <link rel="stylesheet" type="text/css" href="${input.fontAwesomeUri.toString()}/css/brands.min.css" />

//         ${customCssHtml}
//         <link rel="stylesheet" type="text/css" href="${input.themeCssUri.toString()}" />
//         <link rel="stylesheet" type="text/css" href="${input.highlightThemeCssUri.toString()}" />
//         <script src="${input.jsUri}" defer=""></script>
//     </head>

//     <body class="documentPreview ${tagList}">
//         ${html}
//     </body>
// </html>
//                             `;
//         }

//         return html;
//     }

//     async execCmd(cmd: string, input: string, options: ExecOptions): Promise<string> {
//         return await new Promise((resolve, reject) => {
//             const p = exec(
//                 cmd,
//                 options,
//                 (err, stdout, stderr) => {
//                     if (err) {
//                         console.error(stderr);
//                         reject(err);
//                     }
//                     resolve(stdout);
//                 }
//             );
//             p.stdin?.setDefaultEncoding("utf-8");
//             p.stdin?.write(input);
//             p.stdin?.end();
//         });
//     }

//     getConverter(fileType: string) {
//         for (const converter of this.converters) {
//             // if (converter.regex != null && filePath.match(converter.regex)) {
//             //     return converter;
//             // }
//             if (converter.fileTypes != null && converter.fileTypes.includes(fileType)) {
//                 return converter;
//             }
//         }
//         return null;
//     }

//     dispose() {
//     }
// }
