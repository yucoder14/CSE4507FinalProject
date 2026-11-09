class Paragraph {
	constructor(divID, events) { 
		this.divID = divID; 	 
		this.events = events

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
		console.log(segments); 
		this.svg.selectAll(".segment") 
			.data(segments, d => {
				console.log(d.node_id);
				return d.node_id;
			})
			.join(
				(enter) => {
					return enter
						.append("text")
						.attr("x", this.textMargin.left) 			
				},
				(update) => {
					return update
				},
				(exit) => {
					return exit
						.remove()
				}
			)
			.attr("class", "segment")
			.text(d => d.text)
			.attr("y", (d, i) => {
				return this.textMargin.top + i * this.textHeight / segments.length;
			})
	}	
}	
