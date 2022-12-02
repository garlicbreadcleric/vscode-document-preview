const vscode = acquireVsCodeApi();

function addLinkClasses() {
    const links = document.querySelectorAll('a');
    for (const link of links) {
        const href = link.getAttribute('href');

        if (/^https?:\/\/([a-z0-9]+\.)?wikipedia\.org/.exec(href)) {
            link.classList.add('documentPreview-link-wikipedia');
        }
        
        else if (/^https?:\/\/([a-zA-Z0-9]+\.)?github\.com/.exec(href)) {
            link.classList.add('documentPreview-link-github');
        }

        else if (/^https?:\/\//.exec(href)) {
            link.classList.add('documentPreview-link-web');
        }

        else if (/^[.0-9a-zA-Z\-_\/]+\.md$/.exec(href)) {
            link.classList.add('documentPreview-link-note');
        }
    }
}

function decodeLinkURIs() {
    const links = document.querySelectorAll('a.uri,.csl-entry>a');

    for (const link of links) {
        link.innerText = decodeURI(link.getAttribute('href'));
    }
}

function setupMermaid() {
    const codes = document.querySelectorAll('pre > code');
    for (const code of codes) {
        const pre = code.parentElement;
        if (pre.classList.contains('mermaid')) {
            const div = document.createElement('div');
            div.className = 'mermaid';
            div.innerHTML = code.innerText;
            pre.parentElement.insertBefore(div, pre);
            pre.parentElement.removeChild(pre);
        }
    }

    mermaid.init();
}

function setupHighlight() {
    const codes = document.querySelectorAll('pre > code');
    for (const code of codes) {
        const pre = code.parentElement;
        if (pre.classList.length === 1) {
            const l = pre.classList[0];
            pre.className = `language-${pre.classList[0]}`;
        }
    }
    hljs.highlightAll();
}

function setupKatex() {
    const mathElements = document.getElementsByClassName("math");
    const macros = [];
    for (let i = 0; i < mathElements.length; i++) {
        const texText = mathElements[i].firstChild;
        if (mathElements[i].tagName == "SPAN") {
            katex.render(texText.data, mathElements[i], {
                displayMode: mathElements[i].classList.contains('display'),
                throwOnError: false,
                macros: macros,
                fleqn: false
            });
        }
    }
}

function setupGlightbox() {
    const imgs = document.querySelectorAll('figure>img,.gallery img');
    for (const img of imgs) {
        const elements = [
            {
                href: img.getAttribute('src'),
                type: 'image',
                // title: img.getAttribute('alt')
            }
        ];
        const gallery = GLightbox({ elements });
        img.addEventListener("click", () => {
            gallery.open();
        });
    }
}

function replaceCheckboxes() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    for (const checkbox of checkboxes) {
        const parent = checkbox.parentElement;

        const icon = document.createElement("i");
        if (checkbox.hasAttribute("checked")) {
            // <i class="fa-regular fa-square"></i>
            icon.className = "documentPreview-checkbox documentPreview-checkbox-checked fa-regular fa-square-check";
        }
        else {
            // <i class="fa-regular fa-square-check"></i>
            icon.className = "documentPreview-checkbox fa-regular fa-square";
        }

        parent.insertBefore(icon, checkbox);
        parent.removeChild(checkbox);
    }
}

function setup() {
    const metaElement = document.querySelector('meta[name="documentPreview-input"]');
    let _meta = null;
    if (metaElement) {
        _meta = JSON.parse(atob(metaElement.getAttribute("content")));
        window._meta = _meta;
    }

    console.log(_meta);
    
    decodeLinkURIs();
    if (_meta?.features?.fontAwesome) {
        addLinkClasses();
        replaceCheckboxes();
    }
    if (_meta?.features?.glightbox) {
        setupGlightbox();
    }
    if (_meta?.features?.mermaid) {
        setupMermaid();
    }
    if (_meta?.features?.katex) {
        setupKatex();
    }
}

document.addEventListener("click", (event) => {
    if (!event?.view?.document) {
        return;
    }

    let node = event?.target;
    
    while (node) {
        if (node.tagName && node.tagName.toLowerCase() === 'a' && node.href) {
            const href = node.getAttribute('href');

            if (href === '#') {
                document.body.scrollTo(0, 0);
            } else if (href.length > 0 && href[0] === '#') {
                const id = href.slice(1);
                const el = document.getElementById(id);
                if (el) {
                    el.scrollIntoView();
                }
            } else {
                vscode.postMessage({ command: 'click-link', href, fileUri: currentUri });
            }
            event.preventDefault();
            event.stopPropagation();
            break;
        }
        node = node.parentNode;
    }
});

const scrollPositions = {};
let currentUri = null;

window.addEventListener("message", (event) => {
    const message = event.data;

    switch (message.type) {
        case "render": {
            if (currentUri != null) {
                scrollPositions[currentUri] = window.scrollY;
            }
            currentUri = message.fileUri;

            const base = document.getElementById('documentPreview-base');
            base.setAttribute('href', message.baseUri);
            const newBody = document.createElement('body');
            newBody.innerHTML = message.body;
            document.body = newBody;
            setup();

            if (scrollPositions[currentUri] != null) {
                window.scroll(0, scrollPositions[currentUri]);
            }

            break;
        }
    }
});
