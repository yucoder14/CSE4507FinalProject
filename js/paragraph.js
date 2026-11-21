class Paragraph {
	constructor(divID, events, colorScales) { 
		this.divID = divID; 	 
		this.events = events;
		this.colorScales = colorScales;

		this.init();
	}	

	init() {
		this.svgWidth = document.documentElement.clientWidth / 2;
		this.svgHeight = document.documentElement.clientHeight;
		this.svg = d3.select(`#${this.divID}`)
			.append("svg")
			.attr("width", this.svgWidth)
			.attr("height", this.svgHeight)

		this.textMargin = {
			top: this.svgHeight * 0.05, left: this.svgWidth * 0.05
		};
		this.textWidth = this.svgWidth * 0.9;
		this.textHeight = this.svgHeight * 0.9;
	}	

	renderText(segments) {
		const reversed = segments.reverse();
		console.log(reversed);
		// should render tokens 
	}	

	colorHighlights(colorMode) {
		const colorScale = this.colorScales[+colorMode.use_entropy];
		// should recolor the highlights using the colorScale 
	}	
}	
