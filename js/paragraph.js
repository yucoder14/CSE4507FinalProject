class Paragraph {
	constructor(divID, events, colorScales) { 
		this.divID = divID; 	 
		this.events = events;
		this.colorScales = colorScales;
		this.useEntropy = true;
		this.tokens = [];

		this.init();
	}	

	init() {
		this.container = document.getElementById(this.divID);
		this.container.classList.add("paragraph-canvas");
	}	

	renderText(segments) {
		// The tree sends the selected node first, followed by its ancestors.
		this.tokens = [...segments].reverse().flatMap(segment => Array.isArray(segment) ? segment : []);
		this.container.replaceChildren();
		if (!this.tokens.length) {
			this.container.textContent = "No token text is available for this path.";
			return;
		}

		const fragment = document.createDocumentFragment();
		this.tokens.forEach(token => {
			const span = document.createElement("span");
			span.className = "paragraph-token";
			span.textContent = typeof token === "string"
				? token
				: String(token.token_str ?? token.text ?? token.token ?? "");
			fragment.append(span);
		});
		this.container.append(fragment);
		this.colorHighlights({ use_entropy: this.useEntropy });
	}	

	colorHighlights(colorMode) {
		this.useEntropy = Boolean(colorMode.use_entropy);
		const colorScale = this.colorScales[+this.useEntropy];
		this.container.querySelectorAll(".paragraph-token").forEach((span, index) => {
			const token = this.tokens[index];
			const value = this.useEntropy
				? token?.entropy ?? token?.fork?.entropy
				: token?.prob ?? token?.probability ?? token?.entry?.prob;
			const numericValue = Number(value);
			if (value == null || !Number.isFinite(numericValue)) {
				span.style.backgroundColor = "";
				span.style.color = "";
				return;
			}
			const color = colorScale(numericValue);
			const rgb = d3.color(color).rgb();
			span.style.backgroundColor = color;
			span.style.color = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) < 140
				? "#fff" : "#111";
		});
	}	
}	
