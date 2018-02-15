/* global document */

/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */

import EventEmitter from "eventemitter3";

/* eslint-disable no-param-reassign */

function stringRepeat(string, count) {
  let result = "";
  while (count > 0) {
    if (count & 1) {
      result += string;
    }
    if (count >>= 1) { // eslint-disable-line no-cond-assign
      string += string;
    }
  }
  return result;
}

let CHAR_COUNT = 0;

export default class FontMetrics extends EventEmitter {
  constructor(parentEl) {
    super();
    this.characterSize = {width: 0, height: 0};

    this.el = document.createElement("div");
    this.setMeasureNodeStyles(this.el.style, true);

    this.main = document.createElement("div");
    this.setMeasureNodeStyles(this.main.style);

    this.measureNode = document.createElement("div");
    this.setMeasureNodeStyles(this.measureNode.style);


    this.el.appendChild(this.main);
    this.el.appendChild(this.measureNode);
    parentEl.appendChild(this.el);

    if (!CHAR_COUNT) {
      this.testFractionalRect();
    }
    this.measureNode.innerHTML = stringRepeat("X", CHAR_COUNT);

    this.characterSize = {width: 0, height: 0};
    this.checkForSizeChanges();
  }

  testFractionalRect() {
    const el = document.createElement("div");
    this.setMeasureNodeStyles(el.style);
    el.style.width = "0.2px";
    document.documentElement.appendChild(el);
    const w = el.getBoundingClientRect().width;
    if (w > 0 && w < 1) {
      CHAR_COUNT = 50;
    } else {
      CHAR_COUNT = 100;
    }
    el.parentNode.removeChild(el);
  }

  setMeasureNodeStyles(style, isRoot) {
    style.width = style.height = "auto";
    style.left = style.top = "0px";
    style.visibility = "hidden";
    style.position = "absolute";
    style.whiteSpace = "pre";

    style.font = "inherit";
    style.overflow = isRoot ? "hidden" : "visible";
  }

  checkForSizeChanges() {
    const size = this.measureSizes();
    if (size && (this.characterSize.width !== size.width || this.characterSize.height !== size.height)) {
      this.measureNode.style.fontWeight = "bold";
      const boldSize = this.measureSizes();
      this.measureNode.style.fontWeight = "";
      this.characterSize = size;
      this.charSizes = Object.create(null);
      this.allowBoldFonts = boldSize && boldSize.width === size.width && boldSize.height === size.height;
      this.emit("changeCharacterSize", {data: size});
    }
  }

  pollSizeChanges() {
    if (this.pollSizeChangesTimer) {
      return this.pollSizeChangesTimer;
    }
    this.pollSizeChangesTimer = setInterval(() => this.checkForSizeChanges(), 500);
    return this.pollSizeChangesTimer;
  }

  setPolling(val) {
    if (val) {
      this.pollSizeChanges();
    } else if (this.pollSizeChangesTimer) {
      clearInterval(this.pollSizeChangesTimer);
      this.pollSizeChangesTimer = 0;
    }
  }

  measureSizes() {
    let size;
    if (CHAR_COUNT === 50) {
      let rect = null;
      try {
        rect = this.measureNode.getBoundingClientRect();
      } catch(e) {
        rect = {width: 0, height: 0};
      }
      size = {
        height: rect.height,
        width: rect.width / CHAR_COUNT
      };
    } else {
      size = {
        height: this.measureNode.clientHeight,
        width: this.measureNode.clientWidth / CHAR_COUNT
      };
    }
    // Size and width can be null if the editor is not visible or
    // detached from the document
    if (size.width === 0 || size.height === 0) {
      return null;
    }
    return size;
  }

  measureCharWidth(ch) {
    this.main.innerHTML = stringRepeat(ch, CHAR_COUNT);
    const rect = this.main.getBoundingClientRect();
    return rect.width / CHAR_COUNT;
  }

  getCharacterWidth(ch) {
    let w = this.charSizes[ch];
    if (w === undefined) {
      w = this.charSizes[ch] = this.measureCharWidth(ch) / this.characterSize.width;
    }
    return w;
  }

  destroy() {
    clearInterval(this.pollSizeChangesTimer);
    if (this.el && this.el.parentNode) {
      this.el.parentNode.removeChild(this.el);
    }
  }
}
