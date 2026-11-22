class Selector {
	constructor(divID, events, problemMetadata) {
		this.divID = divID;
		this.events = events;
		this.data = problemMetadata;
		this.init();
	}

	getLevel(metadata) {
		return String(metadata.level ?? metadata.difficulty ?? metadata.problem_level ?? "Unspecified");
	}

	getProblemLabel(id, metadata) {
		const text = metadata.problem ?? metadata.question ?? metadata.prompt ?? metadata.title;
		return text ? `${id}: ${String(text).replace(/\s+/g, " ").slice(0, 100)}` : `Problem ${id}`;
	}

	init() {
		const container = document.getElementById(this.divID);
		container.replaceChildren();

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
		container.append(levelLabel, problemLabel);

		const levels = [...new Set(Object.values(this.data).map(metadata => this.getLevel(metadata ?? {})))];
		levels.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
		this.levelSelect.add(new Option("Select a level", ""));
		levels.forEach(level => this.levelSelect.add(new Option(level, level)));
		this.updateProblems();

		this.levelSelect.addEventListener("change", () => this.updateProblems());
		this.problemSelect.addEventListener("change", () => {
			if (this.problemSelect.value !== "") {
				this.events.call("ProblemSelection", this, { prob_id: this.problemSelect.value });
			}
		});
	}

	updateProblems() {
		this.problemSelect.replaceChildren(new Option("Select a problem", ""));
		const level = this.levelSelect.value;
		this.problemSelect.disabled = !level;
		if (!level) return;

		Object.entries(this.data)
			.filter(([, metadata]) => this.getLevel(metadata ?? {}) === level)
			.sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
			.forEach(([id, metadata]) => {
				this.problemSelect.add(new Option(this.getProblemLabel(id, metadata ?? {}), id));
			});
	}
}
