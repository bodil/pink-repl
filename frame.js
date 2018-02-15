/* global window */

export default class Frame {
  constructor(target, language, controller) {
    this.id = target.dataset.id;
    this.editorId = target.dataset.target;
    this.target = target;
    this.language = language;
    this.controller = controller;
    this.prelude = this.language.getPrelude();
  }

  activate() {
  }

  stabilise() {
    this.frame = document.createElement("iframe");
    this.frame.setAttribute("src", require("./frame.html"));
    this.target.appendChild(this.frame);
    this.preludeReady = false;
  }

  cleanup() {
    if (this.frame) {
      this.target.removeChild(this.frame);
      this.frame = null;
    }
  }

  onMessage(source, {command, data}) {
    switch (command) {
      case "focus":
        this.focus();
        break;
      case "blur":
        this.blur();
        break;
      case "load":
        if (!this.preludeReady) {
          this.preludeReady = true;
          this.frame.contentWindow.postMessage({command: "prelude", data: this.prelude}, "*");
        }
        this.frame.contentWindow.postMessage({command, data}, "*");
        break;
      default:
        console.error("REPL: received unknown message", command, data);
        break;
    }
  }
}
