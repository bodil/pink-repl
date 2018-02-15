/* global window */

import events from "pink/lib/events";
import Editor from "./editor";
import REPL from "./repl";
import Frame from "./frame";

import "./screen.less";

const REPL_STYLE = "repl";

const componentTypes = {
  repl: REPL,
  editor: Editor,
  frame: Frame
};

export default function(languages) {
  return class Desktop {
    constructor(slide) {
      this.slide = slide;
      this.target = slide.querySelector(".slideContainer");
      this.windows = {};

      if (!this.slide.classList.contains(REPL_STYLE)) {
        this.slide.classList.add(REPL_STYLE);
      }

      for (const i of this.target.querySelectorAll("div[data-id]")) {
        const data = i.dataset;
        const Item = componentTypes[data.type];
        const component = new Item(i, languages[data.lang], this);
        this.windows[data.id] = component;
        i.classList.add(`type-${data.type}`);
        i.classList.add(`lang-${data.lang}`);
        i.classList.add("repl-window");
        if (!this.firstWindow) {
          this.firstWindow = component;
        }
      }
    }

    activate() {
      Object.values(this.windows).forEach((i) => i.activate());
    }

    stabilise() {
      Object.values(this.windows).forEach((i) => i.stabilise());

      this.focusKeyHandler = events.on(window, "keydown", (e) => {
        if (e.keyCode === 79 && e.ctrlKey) {
          this.firstWindow.focus();
          e.stopPropagation();
          e.preventDefault();
        }
      }, this);
    }

    cleanup() {
      if (this.focusKeyHandler) {
        events.off(window, "keydown", this.focusKeyHandler);
        this.focusKeyHandler = null;
      }
      Object.values(this.windows).forEach((i) => i.cleanup());
    }

    send(source, target, message) {
      this.windows[target].onMessage(source, message);
    }
  };
}
