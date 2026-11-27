class Paragraph {
  constructor(divID) {
    this.container = document.getElementById(divID);
    this.container.classList.add("paragraph-canvas");
    this.animationEnabled = true;
    this.previousPath = [];
    this.previousNodes = [];
    this.segmentElements = [];
    this.frame = null;
    this.remaining = [];
    this.stream = document.createElement("div");
    this.stream.className = "path-stream";
    this.stream.setAttribute("aria-live", "polite");
    this.container.append(this.stream);
  }

  setAnimationEnabled(enabled) {
    this.animationEnabled = enabled;
    if (!enabled) this.finishAnimation();
  }

  finishAnimation() {
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.frame = null;
    while (this.remaining.length) this.appendChunk(this.remaining.shift());
    this.highlightSelection();
  }

  reset() {
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.frame = null;
    this.remaining = [];
    this.previousPath = [];
    this.previousNodes = [];
    this.segmentElements = [];
    this.stream.replaceChildren();
  }

  renderPath(path) {
    const ids = path.map(node => node.id);
    if (ids.length === this.previousPath.length && ids.every((id, i) => id === this.previousPath[i])) return;
    this.finishAnimation();

    let common = 0;
    while (common < ids.length && common < this.previousPath.length && ids[common] === this.previousPath[common]) common++;
    // Remove the previous selection highlight when that segment stays in the path.
    const oldSelectedIndex = this.previousPath.length - 1;
    if (oldSelectedIndex >= 0 && oldSelectedIndex < common) {
      this.segmentElements[oldSelectedIndex].textContent = String(this.previousNodes[oldSelectedIndex].text ?? "");
    }
    this.segmentElements = this.segmentElements.slice(0, common);
    this.stream.replaceChildren(...this.segmentElements);
    this.previousPath = ids;
    this.previousNodes = path;

    const changed = path.slice(common);
    changed.forEach(node => {
      const element = document.createElement("div");
      element.className = "path-segment";
      this.stream.append(element);
      this.segmentElements.push(element);
      this.remaining.push(...this.splitText(String(node.text ?? "")).map(text => ({ element, text })));
    });
    if (!this.remaining.length) {
      this.highlightSelection();
      return;
    }
    if (this.animationEnabled && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const interval = Math.max(16, Math.min(65, 2800 / this.remaining.length));
      let last = 0;
      const tick = now => {
        if (now - last >= interval) {
          this.appendChunk(this.remaining.shift());
          last = now;
        }
        if (this.remaining.length) this.frame = requestAnimationFrame(tick);
        else {
          this.frame = null;
          this.highlightSelection();
        }
      };
      this.frame = requestAnimationFrame(tick);
    } else {
      this.finishAnimation();
    }
  }

  splitText(text) {
    return text.match(/\S+\s*|\s+/g) ?? [];
  }

  appendChunk(chunk) {
    if (!chunk) return;
    chunk.element.textContent += chunk.text;
    this.stream.scrollTop = this.stream.scrollHeight;
  }

  highlightSelection() {
    const selected = this.previousNodes.at(-1);
    const element = this.segmentElements.at(-1);
    const text = String(selected?.text ?? "");
    const word = String(selected?.entry?.token_str ?? "").trim();
    if (!element || !word) return;
    const position = text.indexOf(word);
    if (position < 0) return;

    const before = text.slice(0, position);
    const boundary = Math.max(before.lastIndexOf("."), before.lastIndexOf("?"), before.lastIndexOf("!"),
      before.lastIndexOf("。"), before.lastIndexOf("！"), before.lastIndexOf("？"), before.lastIndexOf("\n"));
    const start = boundary < 0 ? 0 : boundary + 1;
    const after = text.slice(position + word.length);
    const next = after.search(/[.!?。！？\n]/);
    const end = next < 0 ? text.length : position + word.length + next + 1;

    const sentence = document.createElement("span");
    sentence.className = "selected-sentence";
    sentence.append(document.createTextNode(text.slice(start, position)));
    const mark = document.createElement("mark");
    mark.className = "selected-word";
    mark.textContent = word;
    sentence.append(mark, document.createTextNode(text.slice(position + word.length, end)));
    element.replaceChildren(
      document.createTextNode(text.slice(0, start)),
      sentence,
      document.createTextNode(text.slice(end))
    );
    mark.scrollIntoView?.({ block: "center", inline: "nearest" });
  }

  colorHighlights() {
    // Color mode remains active in the tree; path emphasis follows the selected node.
  }
}
