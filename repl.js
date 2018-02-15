/* global window */

import asap from "asap";
import ansi from "ansi-256-colors";
import ReadLine from "./readline"; // eslint-disable-line import/default
import {colors} from "./term"; // eslint-disable-line import/named
import FontMetrics from "./font-metrics";
import * as string from "./string";

const termColours = colors;
termColours[256] = "white";
termColours[257] = "black";

/* eslint-disable prefer-template */
const resetC = ansi.reset;
const errorC = resetC + "\x1b[1m" + ansi.fg.standard[1];
const successC = resetC + "\x1b[1m" + ansi.fg.getRgb(1, 0, 1);
const valueC = resetC + ansi.fg.getRgb(0, 1, 0);
const logC = resetC + ansi.fg.getRgb(0, 0, 0);
const prompt = resetC + ansi.fg.grayscale[15] + "λ \x1b[1m" + ansi.fg.getRgb(0, 0, 0);

export default class REPL {
  constructor(target, language, controller) {
    this.id = target.dataset.id;
    this.editorId = target.dataset.target;
    this.target = target;
    this.language = language;
    this.controller = controller;
  }

  next(method) {
    const context = this;
    return (...args) => asap(() => method.apply(context, args)); // eslint-disable-line prefer-reflect
  }

  focus() {
    this.console.focus();
  }

  blur() {
    this.console.blur();
  }

  focusTarget() {
    this.blur();
    this.controller.send(this.id, this.editorId, {command: "focus"});
  }

  activate() {
    this.env = this.language.getContext();
    this.env.on("compileError", this.next(this.onCompileError));
    this.env.on("error", this.next(this.onError));
    this.env.on("result", this.next(this.onResult));
    this.env.on("log", this.next(this.onLog));
    this.env.on("loaded", this.next(this.onLoaded));
  }

  stabilise() {
    this.metrics = new FontMetrics(this.target);
    const font = this.metrics.characterSize;
    const computed = window.getComputedStyle(this.target);
    const cw = parseInt(computed.width, 10);
    const ch = parseInt(computed.height, 10);
    this.width = Math.floor(cw / font.width);
    this.height = Math.floor(ch / font.height);
    this.console = new ReadLine({
      cols: this.width,
      rows: this.height,
      useStyle: true,
      cursorBlink: true,
      prompt,
      parent: this.target,
      colors: termColours
    });
    this.console.on("command", (cmd) => this.onCommand(cmd));
    this.console.on("loadBuffer", () =>
      this.controller.send(this.id, this.editorId, {command: "save"}));
    this.console.on("focusOut", () => this.focusTarget());
    this.console.on("escape", () => this.blur());
  }

  cleanup() {
    if (this.console) {
      this.console.cleanup();
      this.console = null;
    }
    if (this.metrics) {
      this.metrics.destroy();
      this.metrics = null;
    }
    if (this.env) {
      this.env.cleanup();
      this.env = null;
    }
  }

  onCompileError(errs) {
    this.controller.send(this.id, this.editorId, {
      command: "errors", data: errs
    });
    for (const err of errs) {
      if (err.cursor !== undefined || err.loc !== undefined) {
        this.onError(string.formatError(err, this.width));
      } else {
        this.onError(err.message);
      }
    }
  }

  onError(err) {
    this.console.writeln(errorC + err + resetC);
  }

  onResult(v) {
    if (v !== undefined) {
      this.console.writeln(valueC + v + resetC);
    }
  }

  onLog(msg) {
    this.console.writeln(logC + msg + resetC);
  }

  onLoaded() {
    this.console.writeln(successC + "Buffer loaded." + resetC);
  }

  onCommand(cmd) {
    this.env.eval(cmd);
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
        this.env.load(data);
        break;
      case "eval":
        this.env.eval(data);
        break;
      default:
        console.error("REPL: received unknown message", command, data);
        break;
    }
  }
}
