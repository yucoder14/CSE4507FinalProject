const ROOT_NODE_ID = 'node-0';
class ReasoningTree {
	constructor(divID, events, colorScales) {
		this.divID = divID;
		this.treeData = null;
		this.events = events;
		this.currentNodeID = null;	
		this.nodeLookUp = {};
		this.subTreeEnabled = true;
		this.colorScales = colorScales;

		this.useEntropy = true;

		this.init();
	}	

	initSubtreeToggleButton() {
		const half = this.buttonSize / 2;
		const toggle = this.svg.append("g")
			.attr("id", "toggle-subtree")
			.attr("transform", `translate(${this.treeMargin.left + half}, ${100 + half})`)
			.style("cursor", "pointer")
			.on("click", () => {
				this.subTreeEnabled = !this.subTreeEnabled;
				updateToggle();
				const rootNodeID = this.subTreeEnabled ? this.currentNodeID : ROOT_NODE_ID;
				this.drawTree(this.getSubTree(rootNodeID));
				this.highlightPath();
			});

		const toggleRect = toggle.append("rect")
			.attr("x", -half)
			.attr("y", -half)
			.attr("width", this.buttonSize)
			.attr("height", this.buttonSize);

		const toggleText = toggle.append("text")
			.attr("text-anchor", "middle")
			.attr("dominant-baseline", "central")
			.attr("transform", "rotate(-45)")
			// The diagonal is about 1.41 × buttonSize. "full tree" is about 5.4em wide, so this leaves some padding.
			.style("font-size", `${this.buttonSize * 0.25}px`)
			.style("pointer-events", "none")
			.style("user-select", "none");

		const updateToggle = () => {
			toggleRect.classed("subtree-enabled", this.subTreeEnabled);
			toggleText.text(this.subTreeEnabled ? "subtree" : "full tree");
		};
		updateToggle();
	}	

	initColormodeToggleButton() {
		const cmHalf = this.buttonSize / 2;
		const cmX = this.treeMargin.left + this.buttonSize * 1.1;

		const colorToggle = this.svg.append("g")
			.attr("id", "toggle-colormode")
			.attr("transform", `translate(${cmX + cmHalf}, ${100 + cmHalf})`)
			.style("cursor", "pointer")
			.on("click", () => {
				this.useEntropy = !this.useEntropy;
				updateColorToggle();
				this.colorNodes();
			});

		colorToggle.append("rect")
			.attr("x", -cmHalf)
			.attr("y", -cmHalf)
			.attr("width", this.buttonSize)
			.attr("height", this.buttonSize);

		const colorToggleText = colorToggle.append("text")
			.attr("text-anchor", "middle")
			.attr("dominant-baseline", "central")
			.attr("transform", "rotate(-45)")
			.style("font-size", `${this.buttonSize * 0.22}px`)
			.style("pointer-events", "none")
			.style("user-select", "none");

		const updateColorToggle = () => {
			colorToggleText.text(this.useEntropy ? "entropy" : "prob");
		};
		updateColorToggle();
	}	

	init() {
		this.svgWidth = document.documentElement.clientWidth / 2;
		this.svgHeight = document.documentElement.clientHeight;
		this.svg = d3.select(`#${this.divID}`)
			.append("svg")
			.attr("width", this.svgWidth)
			.attr("height", this.svgHeight)
					
		// tree layout 
		this.treeMargin = {
			top: this.svgHeight * 0.075, left: this.svgWidth * 0.075
		};
		this.treeWidth = this.svgWidth * 0.85;
		this.treeHeight = this.svgHeight * 0.85;
		this.tree = d3.tree().size([this.treeHeight, this.treeWidth]);

		// group for the tree data
		this.treeGroup = this.svg.append("g") 
			.attr("transform", `translate(${this.treeMargin.left},${this.treeMargin.top})`)

		this.buttonSize = 50;

		// button for toggling subtree mode  
		this.initSubtreeToggleButton();

		// button for toggling color mode
		this.initColormodeToggleButton();

		this.circleRadius = 10;
	}	

	seed(problemID, treeData) {
		// "seed" tree module with data
		this.problemID = problemID;
		this.treeData = treeData; 
		this.currentNodeID = ROOT_NODE_ID;
		this.nodeLookUp = {};
		this.treeGroup.selectAll("*").interrupt().remove();

		this.createNodeLookUp();

		this.drawTree(this.getSubTree(this.currentNodeID));
	}	

	createNodeLookUp() {
		const stack = Object.values(this.treeData);

		while (stack.length != 0) {
			const currentNode = stack.pop();		 
			this.nodeLookUp[`node-${currentNode.segment_id}`] = currentNode;
			stack.push(...currentNode.children_nodes);
		}	
	}

	getSubTree(currentNodeID) {
		// the sub tree should consist of parent node, current node, and immediate children	 
		if (this.subTreeEnabled) {
			const currentNode = {...this.nodeLookUp[currentNodeID]};
			if (currentNode.children.length != 0) {
				let childrenCopies = structuredClone(currentNode.children_nodes);
				childrenCopies.forEach((child) => {
					child.children = [];
					child.children_nodes = [];
				}); 
				currentNode.children_nodes = childrenCopies;
			}	

			const parentID = `node-${currentNode.parent_id}`;
			if (parentID != 'node-null') {
				let rootCopy = {...this.nodeLookUp[parentID]};
				rootCopy.children = [currentNodeID];
				rootCopy.children_nodes = [currentNode];
				return rootCopy;
			} else {
				return currentNode; 
			}	
		} 

		return this.nodeLookUp[ROOT_NODE_ID];
	}	

	drawLinks(reasoningTree) {
		this.treeGroup 
			.selectAll(".link")
			.data(reasoningTree.links(), d => `${d.source.data.segment_id}:${d.target.data.segment_id}`)
			.join(
				(enter) => {
					return enter.append("path")
						.attr("class", "link")
						.attr("nodes", d => {
							const parentID = d.source.data.segment_id;
							const currentID = d.target.data.segment_id;

							return `node-${parentID}:node-${currentID}`
						})
						.attr( "d", d3.linkHorizontal() .x(d => d.x) .y(d => this.treeHeight/2))
						.transition()
						.attr( "d", d3.linkHorizontal() .x(d => d.y) .y(d => d.x))
				},
				(update) => {
					return update
						.transition()
						.attr( "d", d3.linkHorizontal() .x(d => d.y) .y(d => d.x))
				},
				(exit) => {
					return exit
						.style("opacity", 0.3)
						.transition()
						.attr( "d", d3.linkHorizontal() .x(d => d.x) .y(d => this.treeHeight/2))
						.remove()
				}
			)
	}	

	drawCircle(g) {
	 	g.append("circle")
			.attr("class", "node-circle")
			.attr("r", this.circleRadius)
			.attr("id", d => `node-${d.data.segment_id}`)
			.attr("segment-id", d => d.data.segment_id)
			.attr("parent-id", d => `node-${d.data.parent_id}`)
			.attr("prob", d => {
				const prob = (d.data.entry) ? d.data.entry.prob : 1;
				return prob;
			})
			.attr("entropy", d => {
				const entropy = (d.data.ends_with_eos) ? 0 : d.data.fork.entropy ;
				return entropy;	 
			})	
			.on("mouseover", (event, d) => { 
				const hovered = d3.select(event.target);
				hovered.classed("hovered", true);
			})
			.on("mouseout", (event, d) => { 
				const hovered = d3.select(event.target);
				hovered.classed("hovered", false);
			})
			.on("click", (event, d) => {
				this.currentNodeID = event.target.id;
				this.events.call("NodeSelection", this, {
					nodeID:  event.target.id
				});
			})
	}	

	drawText(g) {
	 	g.append("text")
			.attr("class", "node-text")
			.text(d => {
				if (d.data.entry) {
					return d.data.entry.token_str;
				}	
			})
			.attr("text-anchor", "middle")
			.attr("y", 25)
			.attr("font-size", 12)
	}	

	drawNodes(reasoningTree) {
		this.treeGroup
			.selectAll(".node")
			.data(reasoningTree, d =>{
				return d.data.segment_id;
			})
			.join(
				(enter) => {
					return enter.append("g")
						.raise()
						.attr("class", "node")
						.attr("transform", d => `translate(${d.y}, ${this.treeHeight/2})`)
						.call(g => this.drawCircle(g))
						.call(g => this.drawText(g))
						.transition()
						.attr("transform", d => `translate(${d.y}, ${d.x})`)
				},
				(update) => {
					return update
						.raise()
						.transition()
						.attr("transform", d => `translate(${d.y}, ${d.x})`)
				},
				(exit) => {
					return exit
						.style("opacity", 0.3)
						.transition()
						.attr("transform", d => `translate(${d.y}, ${this.treeHeight/2})`)
						.remove();
				}	
			)
	}	

	drawColorLegend(colorScale, {
		x = 20,
		y = 20,
		width = 200,
		height = 12,
		title = "",
		tickFormat = d3.format(".2~f"),
		id = "color-legend",
	} = {}) {
		// Remove any previous legend with the same id
		this.svg.select(`#${id}`).remove();
		this.svg.select(`#${id}-gradient`).remove();

		const domain = colorScale.domain();
		const min = d3.min(domain);
		const max = d3.max(domain);

		// Gradient definition
		const defs = this.svg.select("defs").empty()
			? this.svg.append("defs")
			: this.svg.select("defs");

		const gradient = defs.append("linearGradient")
			.attr("id", `${id}-gradient`)
			.attr("x1", "0%").attr("x2", "100%")
			.attr("y1", "0%").attr("y2", "0%");

		const nStops = 20;
		gradient.selectAll("stop")
			.data(d3.range(nStops + 1).map(i => i / nStops))
			.join("stop")
			.attr("offset", t => `${t * 100}%`)
			.attr("stop-color", t => colorScale(min + t * (max - min)));

		// Legend group
		const legend = this.svg.append("g")
			.attr("id", id)
			.attr("transform", `translate(${x}, ${y})`);

		if (title) {
			legend.append("text")
				.attr("x", 0)
				.attr("y", -6)
				.style("font-size", "11px")
				.text(title);
		}

		legend.append("rect")
			.attr("width", width)
			.attr("height", height)
			.style("fill", `url(#${id}-gradient)`)
			.style("stroke", "#999")
			.style("stroke-width", 0.5);

		// Axis with a tick at each domain value
		const axisScale = d3.scaleLinear()
			.domain([min, max])
			.range([0, width]);

		legend.append("g")
			.attr("transform", `translate(0, ${height})`)
			.call(d3.axisBottom(axisScale)
				.tickValues(domain)
				.tickFormat(tickFormat)
				.tickSize(4))
			.call(g => g.select(".domain").remove())
			.selectAll("text")
			.style("font-size", "10px");

		return legend;
	}

	colorNodes() {
		const colorScale = this.colorScales[+this.useEntropy];
		d3.selectAll(".node-circle") 
			.attr("fill", d => {
				const prob = (d.data.entry) ? d.data.entry.prob : 1;
				const entropy = (d.data.ends_with_eos) ? 0 : d.data.fork.entropy ;
				if (this.useEntropy) {
					return colorScale(entropy);	 
				} else {	
					return colorScale(prob); 
				}	
			}) 	
		this.drawColorLegend(colorScale, {
			x: this.treeMargin.left,
			y: this.svgHeight - this.treeMargin.top * 1.5
		});

		this.events.call("ChangeColorMode", this, { use_entropy: this.useEntropy});
	}	

	drawTree(treeData) {
		// laid out data
		const root = d3.hierarchy(treeData, d => d.children_nodes);
		const reasoningTree = this.tree(root);

		// drawing links from laid out data
		this.drawLinks(reasoningTree);

		// drawing nodes from laid out data
		this.drawNodes(reasoningTree);
		this.colorNodes();
	}

	highlightPath() {
		// reset all nodes
		this.treeGroup.selectAll('.node-circle')
			.classed("selected", false)

		this.treeGroup.selectAll('.link')
			.classed("selected", false)

		const segmentData = [];
		let nodeID = this.currentNodeID;
		while (this.nodeLookUp[nodeID]) {
			const node = this.nodeLookUp[nodeID];
			const parentID = node.parent_id == null ? null : `node-${node.parent_id}`;
			segmentData.push({
				problem_id: this.problemID,
				segment_id: node.segment_id,
				node_id: nodeID,
			});
			this.treeGroup.select(`#${nodeID}`).classed("selected", true);
			if (parentID) {
				this.treeGroup.select(`[nodes='${parentID}:${nodeID}']`).classed("selected", true);
			}
			nodeID = parentID;
		}
		this.events.call("RenderText", this, segmentData);
	}	
}	
