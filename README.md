# Document Preview

[VSCode Marketplace](https://marketplace.visualstudio.com/items?itemName=garlicbreadcleric.document-preview) |
[Open VSX](https://open-vsx.org/extension/garlicbreadcleric/document-preview) |
[GitHub](https://github.com/garlicbreadcleric/vscode-document-preview)

Configurable VS Code preview extension for HTML, Markdown, reStructuredText and more.

## Motivation

This extension is intended as a replacement for any document type preview extensions, as long as these document types can be converted into HTML. This extension doesn't do any conversions itself — instead, it allows you to configure which CLI program to call to convert different file types. Pandoc is recommended for file types it supports (Markdown, reStructuredText, Org, etc.), but you can use anything else. Currently standalone converters are not supported – meaning that the CLI program that converts document source into HTML should just return the contents of `<body>` without `<body>`, `<html>`, `<head>` tags themselves (these are added by the extension).

## Usage

After you've [configured converters](#configuration), you can press `ctrl+shift+p` (`cmd+shift+p` on macOS), type `Open Document Preview` and hit `enter`. That will open a panel on the right with preview of currently opened document. If you open another document that has a matching converter, the preview panel will update accordingly.

## Configuration

You can specify your list of converters via `documentPreview.converters` setting, which is an array of objects with the following fields:

- `name`
- `fileTypes` — a list of VS Code language ID's that the converter can be used for
- `command` — command that accepts document source via stdin and returns HTML via stdout

Additionally, some options are provided to customize the appearance of the output:

- `documentPreview.theme` — a general CSS theme
- `documentPreview.highlightTheme` — a highlight theme for code blocks
- `documentPreview.customCssPath` — absolute path to your custom CSS file
- `documentPreview.previewFeatures.mermaid` — a flag that turns Mermaid diagram rendering on/off
- `documentPreview.previewFeatures.katex` — a flag that turns KaTeX math rendering on/off
- `documentPreview.previewFeatures.glightbox` — a flag that turns image lightbox preview on/off
  - Currently this applies to images matching the following selectors: `figure>img`, `.gallery img`; I plan to make this customizable
- `documentPreview.previewFeatures.fontAwesome` — a flag that turns Font Awesome decorations on/off
  - The decorations include: adding icons to links, prettier checkboxes

### Example: Pandoc Markdown converter

```json
"documentPreview.converters": [
    {
        "name": "Pandoc Markdown",
        "fileTypes": ["markdown"],
        "command": "pandoc -C --from markdown+autolink_bare_uris --to html --katex"
    }
]
```

## Caveats

- There's no scroll sync and I don't really plan to implement it. I might reconsider if there's enough interest in this feature, so if you need it don't hesitate to open an issue or like/comment an existing one.

## Similar projects

- [Markdown Preview Enhanced](https://github.com/shd101wyy/vscode-markdown-preview-enhanced) — a preview extension that supports two methods of Markdown parsing: Markdown-It and Pandoc (although some features like wiki-links are only supported with Markdown-It). Also unlike my extension it does provide scroll synchronization, so check it out if you need that.

## Contributing

If you happen to find this extension useful enough and want to help improve it, these are some of the ways you can do that:

- Report bugs
- Propose features
- Contribute general themes and code highlighting themes

## See also

- Markane ([language server](https://github.com/garlicbreadcleric/markane) and [VSCode extension](https://github.com/garlicbreadcleric/vscode-markane)) for link completion, document templates, querying documents and more
- [Pandoc Markdown Syntax] for VS Code
