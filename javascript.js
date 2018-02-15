import "brace/mode/javascript";

import * as babel from "babel-standalone";
import EventEmitter from "eventemitter3";
import ReplWorker from "webworker!./javascript-worker.es3";

const BABEL = false;

const babelOpts = {
  presets: ["es2015"]
};

function compile(code) {
  try {
    return {
      code: babel.transform(code, babelOpts).code,
      errors: []
    };
  } catch (e) {
    if (e instanceof SyntaxError) {
      return {errors: [{
        message: e.message
      }]};
    }
    throw e;
  }
}

class JSREPL extends EventEmitter {
  constructor() {
    super();
    this.env = new ReplWorker();
    this.env.onmessage = (e) => this.onMessage(e.data);
  }

  cleanup() {
    this.removeAllListeners();
    this.env.terminate();
  }

  onMessage([msg, data]) {
    this.emit(msg, data);
  }

  eval(input) {
    const expand = input[0] === "&";
    const line = expand ? input.slice(1) : input;
    if (BABEL) {
      const res = compile(line);
      if (res.errors.length) {
        this.emit("compileError", res.errors);
      } else {
        this.env.postMessage({eval: res.code, expand});
      }
    } else {
      this.env.postMessage({eval: line, expand});
    }
  }

  load(input) {
    if (BABEL) {
      const res = compile(input);
      if (res.errors.length) {
        this.emit("compileError", res.errors);
      } else {
        this.env.postMessage({load: res.code});
        this.emit("loaded");
      }
    } else {
      this.env.postMessage({load: input});
      this.emit("loaded");
    }
  }
}

export default {
  aceMode: "ace/mode/javascript",
  getContext: () => new JSREPL()
};
