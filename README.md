# Document Preview

[VSCode Marketplace](https://marketplace.visualstudio.com/items?itemName=garlicbreadcleric.document-preview) |
[Open VSX](https://open-vsx.org/extension/garlicbreadcleric/document-preview) |
[GitHub](https://github.com/garlicbreadcleric/vscode-document-preview)

Configurable VS Code preview extension for HTML, Markdown, reStructuredText and more.

## Motivation

This extension is intended as a replacement for any document type preview extensions, as long as these document types can be converted into HTML. This extension doesn't do any conversions itself — instead, it allows you to configure which CLI program to call to convert different file types. Pandoc is recommended for file types it supports (Markdown, reStructuredText, Org, etc.), but you can use anything else.

## Usage

After you've [configured converters](#configuration), you can press `ctrl+shift+p` (`cmd+shift+p` on macOS), type `Open Document Preview` and hit `enter`. That will open a panel on the right with preview of currently opened document. If you open another document that has a matching converter, the preview panel will update accordingly.

## Configuration

You can specify your list of converters via `documentPreview.converters` setting, which is an array of objects with the following fields:

- `name`
- `fileTypes` — a list of VS Code language ID's that the converter can be used for
- `command` — command that accepts document source via stdin and returns HTML via stdout

Note that `command` argument actually accepts a list of commands. If that list contains only one command, it will be called on each update. If there are two commands, the first one will be called once on first render, and the second will be called on each following update. The first command must return a "standalone" HTML document (i.e. it mustc contain `<html>`, `<head>` and `<body>` tags), while the second command must return only `<body>` contents (without `<body>` tag itsef). This feature allows to bundle a lot of resources (JS, CSS etc.) into the standalone version once and then do smaller incremental updates.

### Example: Pandoc Markdown converter

```json
"documentPreview.converters": [
  {
    "name": "Pandoc Markdown",
    "fileTypes": ["markdown"],
    "command": ["pandoc -C --from markdown+autolink_bare_uris --to html --katex --standalone"]
  }
]
```

### Example: Incremental Pandoc Markdown converter

```json
"documentPreview.converters": [
  {
    "name": "Pandoc Markdown",
    "fileTypes": ["markdown"],
    "command": [
      "pandoc -C --from markdown+autolink_bare_uris --to html --katex --standalone",
      "pandoc -C --from markdown+autolink_bare_uris --to html --katex"
    ]
  }
]
```

## Caveats

- There's no scroll sync and I don't really plan to implement it.
- There's no support for loading external resources (CSS, JS). The intended use-case assumes that these resources are bundled into the HTML by the converter (which is the reason for allowing a second "incremental" converter). However, feel free to open an issue if you need to load resources without bundling — I might consider implementing that if there's any interest.

## Similar projects

- [Markdown Preview Enhanced](https://github.com/shd101wyy/vscode-markdown-preview-enhanced) — a preview extension that supports two methods of Markdown parsing: Markdown-It and Pandoc (although some features like wiki-links are only supported with Markdown-It). Also unlike my extension it does provide scroll synchronization, so check it out if you need that.

## See also

- [Pandoc Toolbox](https://github.com/garlicbreadcleric/pandoc-toolbox) contains Pandoc filters and templates made with this extension in mind. Some features like FontAwesome icons for links were initially part of this extension but I re-implemented them as Pandoc filters so that they could be used not just for preview.
- Markane ([language server](https://github.com/garlicbreadcleric/markane) and [VSCode extension](https://github.com/garlicbreadcleric/vscode-markane)) for templates, snippets, completion, citations and more.
- [Pandoc Markdown Syntax](https://github.com/garlicbreadcleric/vscode-pandoc-markdown) for VS Code.
