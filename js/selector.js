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
  getType(metadata) {
	return String(metadata.type); 
  }	

  init(divID) {
    const container = document.getElementById(divID);
    container.replaceChildren();

    const heading = document.createElement("h1");
    heading.textContent = "Reasoning tree dashboard";

    const controls = document.createElement("div");
    controls.className = "selector-controls";

	// search bar
    const searchLabel = document.createElement("label");
    searchLabel.textContent = "Search questions";
    this.searchInput = document.createElement("input");
    this.searchInput.type = "search";
    this.searchInput.placeholder = "Search by question or ID";
    searchLabel.append(this.searchInput);

	// problem level drop down
    const levelLabel = document.createElement("label");
    levelLabel.textContent = "Problem Level";
    this.levelSelect = document.createElement("select");
    this.levelSelect.setAttribute("aria-label", "Filter by problem level");
    levelLabel.append(this.levelSelect);

	// problem type drop down
	const typeLabel = document.createElement("label");
	typeLabel.textContent = "Problem Type";
	this.typeSelect = document.createElement("select");
	this.typeSelect.setAttribute("aria-label", "Filter by problem type");
	typeLabel.append(this.typeSelect);

	// problem question drop down
    const problemLabel = document.createElement("label");
    problemLabel.textContent = "Problem";
    this.problemSelect = document.createElement("select");
    this.problemSelect.setAttribute("aria-label", "Select a problem");
    problemLabel.append(this.problemSelect);

    controls.append(searchLabel, typeLabel, levelLabel, problemLabel);

    this.resultCount = document.createElement("p");
    this.resultCount.className = "result-count";
    container.append(heading, controls, this.resultCount);

	
    const levels = [...new Set(Object.values(this.data).map(metadata => this.getLevel(metadata ?? {})))];
    levels.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    this.levelSelect.add(new Option("All levels", ""));
    levels.forEach(level => this.levelSelect.add(new Option(level, level)));
    this.updateProblems();

	const types = [...new Set(Object.values(this.data).map(metadata => this.getType(metadata ?? {})))];
	types.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
	this.typeSelect.add(new Option("Select a type", ""));
	types.forEach(type => this.typeSelect.add(new Option(type, type)));

    this.searchInput.addEventListener("input", () => this.updateProblems());
    this.levelSelect.addEventListener("change", () => this.updateProblems());
    this.typeSelect.addEventListener("change", () => this.updateProblems());
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
	const type = this.typeSelect.value;
    const matches = Object.entries(this.data)
      .filter(([id, metadata]) => 
		  (!level || this.getLevel(metadata ?? {}) === level) && 
		  (!type || this.getType(metadata ?? {}) === type) && 
		  (!query || (`${id} ${this.getQuestion(metadata ?? {})}`).toLocaleLowerCase().includes(query))
	  )
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
