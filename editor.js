import text from "pink/lib/text";

import ace from "brace";
import "brace/theme/iplastic";

const bindKey = (win, mac) => ({win, mac});

export default class Editor {
  constructor(target, language, controller) {
    this.id = target.dataset.id;
    this.replId = target.dataset.target;
    this.target = target;
    this.initialCode = text.cleanText(target.innerHTML, "html");
    this.language = language;
    this.controller = controller;
  }

  focus() {
    this.ace.focus();
  }

  blur() {
    this.ace.blur();
  }

  focusTarget() {
    this.blur();
    this.controller.send(this.id, this.replId, {command: "focus"});
  }

  activate() {
    this.target.innerHTML = "";
    this.ace = ace.edit(this.target);
    this.ace.getSession().setMode(this.language.aceMode);
    this.ace.setTheme("ace/theme/iplastic");
    this.ace.getSession().setValue(this.initialCode);
    this.ace.getSession().setUseWrapMode(false);
    this.ace.getSession().setUseSoftTabs(true);
    this.ace.getSession().setTabSize(2);
    this.ace.setShowPrintMargin(false);
    this.ace.setBehavioursEnabled(true);
    this.ace.setWrapBehavioursEnabled(true);
    this.ace.setDisplayIndentGuides(true);
    this.ace.setHighlightSelectedWord(true);
    this.ace.setShowFoldWidgets(false);
    this.ace.setShowInvisibles(false);
    this.ace.renderer.setShowGutter(true);
    this.ace.renderer.setOption("showLineNumbers", false);

    this.defineCommands(this.ace.commands);
    this.defineKeymap(this.ace.commands);
  }

  defineCommands(cmd) {
    cmd.addCommand({
      name: "send-to-repl",
      readOnly: true,
      exec: () => this.save()
    });
    cmd.addCommand({
      name: "blur",
      readOnly: true,
      exec: () => this.blur()
    });
    cmd.addCommand({
      name: "focus-target",
      readOnly: true,
      exec: () => this.focusTarget()
    });
  }

  defineKeymap(cmd) {
    cmd.bindKey("Ctrl-P", "golineup");
    cmd.bindKey("Ctrl-A", "gotolinestart");
    cmd.bindKey("Ctrl-E", "gotolineend");
    cmd.bindKey(bindKey("Ctrl-S", "Command-S"), "send-to-repl");
    cmd.bindKey(bindKey("Ctrl-O", "Command-O"), "focus-target");
    cmd.bindKey("Escape", "blur");
  }

  stabilise() {
  }

  cleanup() {
    this.ace.destroy();
    this.ace = null;
    this.target.innerHTML = this.initialCode;
  }

  save() {
    this.controller.send(this.id, this.replId, {
      command: "load",
      data: this.ace.getSession().getValue()
    });
  }

  onMessage(source, {command, data}) {
    switch (command) {
      case "focus":
        this.focus();
        break;
      case "blur":
        this.blur();
        break;
      case "save":
        this.save();
        break;
      default:
        console.error("REPL: received unknown message", command, data);
        break;
    }
  }
}
