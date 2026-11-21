class Paragraph {
	constructor(divID, events) {
		this.container = document.getElementById(divID);
		this.events = events;
	}

	renderText(segments) {
		this.container.replaceChildren();
		const ordered = [...segments].reverse();
		const values = ordered.map(d => d.entropy).filter(Number.isFinite);
		const min = Math.min(...values);
		const max = Math.max(...values);
		const color = d3.scaleLinear()
			.domain(values.length > 1 && max > min
				? [min, (min + max) / 2, max]
				: [0, 1, 2])
			.range(["#82bff1", "#f2e5e9", "#f28e95"])
			.clamp(true);

		ordered.forEach(segment => {
			const span = document.createElement("span");
			span.className = "highlighted-segment";
			span.textContent = segment.text || "";
			if (Number.isFinite(segment.entropy)) {
				span.style.backgroundColor = color(segment.entropy);
				span.title = `Entry entropy: ${segment.entropy.toFixed(2)}`;
			}
			this.container.append(span, document.createTextNode("\n\n"));
		});
	}
}
