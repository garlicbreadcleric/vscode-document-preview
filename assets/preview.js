const vscode = acquireVsCodeApi();

const scrollPositions = {};
let currentUri = null;

document.addEventListener("click", (event) => {
  if (!event?.view?.document) {
    return;
  }

  let node = event?.target;

  while (node) {
    if (node.tagName && node.tagName.toLowerCase() === "a" && node.href) {
      const href = node.getAttribute("href");

      if (href === "#") {
        document.body.scrollTo(0, 0);
      } else if (href.length > 0 && href[0] === "#") {
        const id = href.slice(1);
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView();
        }
      } else {
        vscode.postMessage({ command: "link-click", href, fileUri: currentUri });
      }
      event.preventDefault();
      event.stopPropagation();
      break;
    }
    node = node.parentNode;
  }
});

window.addEventListener("message", (event) => {
  const message = event.data;

  switch (message.command) {
    case "set-file-uri": {
      currentUri = message.fileUri;
      break;
    }
    case "render-body":
      if (currentUri != null) {
        scrollPositions[currentUri] = window.scrollY;
      }
      currentUri = message.fileUri;

      const newBody = document.createElement("body");
      newBody.innerHTML = message.html;
      document.body = newBody;

      setBaseUri(message.baseUri);

      if (scrollPositions[currentUri] != null) {
        window.scroll(0, scrollPositions[currentUri]);
      }
      window.dispatchEvent(new Event("load"));
      break;
  }
});

function setBaseUri(baseUri) {
  let base = document.getElementById("document-preview-base");
  if (base == null) {
    base = document.createElement("base");
    base.id = "document-preview-base";
    document.head.appendChild(base);
  }
  base.setAttribute("href", baseUri);
}
