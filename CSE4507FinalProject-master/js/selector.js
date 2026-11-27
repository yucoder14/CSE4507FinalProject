class Selector {
  constructor(divID, events, problemMetadata) {
    this.events = events;
    this.data = problemMetadata;
    this.init(divID);
  }

  getLevel(metadata) {
    return String(metadata.level ?? metadata.difficulty ?? metadata.problem_level ?? "Unspecified");
  }

  getQuestion(metadata) {
    return String(metadata.problem ?? metadata.question ?? metadata.prompt ?? metadata.title ?? "");
  }

  init(divID) {
    const container = document.getElementById(divID);
    container.replaceChildren();
    const heading = document.createElement("h1");
    heading.textContent = "Reasoning tree dashboard";
    const controls = document.createElement("div");
    controls.className = "selector-controls";
    const searchLabel = document.createElement("label");
    searchLabel.textContent = "Search questions";
    this.searchInput = document.createElement("input");
    this.searchInput.type = "search";
    this.searchInput.placeholder = "Search by question or ID";
    searchLabel.append(this.searchInput);
    const levelLabel = document.createElement("label");
    levelLabel.textContent = "Level";
    this.levelSelect = document.createElement("select");
    this.levelSelect.setAttribute("aria-label", "Filter by level");
    levelLabel.append(this.levelSelect);
    const problemLabel = document.createElement("label");
    problemLabel.textContent = "Problem";
    this.problemSelect = document.createElement("select");
    this.problemSelect.setAttribute("aria-label", "Select a problem");
    problemLabel.append(this.problemSelect);
    controls.append(searchLabel, levelLabel, problemLabel);
    this.resultCount = document.createElement("p");
    this.resultCount.className = "result-count";
    container.append(heading, controls, this.resultCount);

    const levels = [...new Set(Object.values(this.data).map(metadata => this.getLevel(metadata ?? {})))];
    levels.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    this.levelSelect.add(new Option("All levels", ""));
    levels.forEach(level => this.levelSelect.add(new Option(level, level)));
    this.updateProblems();

    this.searchInput.addEventListener("input", () => this.updateProblems());
    this.levelSelect.addEventListener("change", () => this.updateProblems());
    this.problemSelect.addEventListener("change", () => {
      if (this.problemSelect.value !== "") {
        this.events.call("ProblemSelection", this, { prob_id: this.problemSelect.value });
      }
    });
  }

  updateProblems() {
    const previous = this.problemSelect.value;
    const query = this.searchInput.value.trim().toLocaleLowerCase();
    const level = this.levelSelect.value;
    const matches = Object.entries(this.data)
      .filter(([id, metadata]) => (!level || this.getLevel(metadata ?? {}) === level)
        && (!query || (`${id} ${this.getQuestion(metadata ?? {})}`).toLocaleLowerCase().includes(query)))
      .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));
    this.problemSelect.replaceChildren(new Option(matches.length ? "Select a problem" : "No matching problems", ""));
    matches.forEach(([id, metadata]) => {
      const question = this.getQuestion(metadata ?? {});
      const option = new Option(`${id}: ${question.replace(/\s+/g, " ") || "Untitled problem"}`, id);
      option.title = question;
      this.problemSelect.add(option);
    });
    this.problemSelect.disabled = matches.length === 0;
    this.problemSelect.value = matches.some(([id]) => id === previous) ? previous : "";
    this.resultCount.textContent = `${matches.length} matching problem${matches.length === 1 ? "" : "s"}`;
  }
}
