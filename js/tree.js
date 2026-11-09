//const demo_data = "./data/tree_0.json";

class ReasoningTree {
	constructor(divID, treeData, events) {
		this.divID = divID;
		this.treeData = treeData;
		this.events = events;
		this.currentNode = null;	
		this.nodeLookUp = {};

		this.init();
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
			top: this.svgHeight * 0.05, left: this.svgWidth * 0.05
		};
		this.treeWidth = this.svgWidth * 0.9;
		this.treeHeight = this.svgHeight * 0.9;
		this.tree = d3.tree().size([this.treeHeight, this.treeWidth]);

		// group for the tree data
		this.treeGroup = this.svg.append("g") 
			.attr("transform", `translate(${this.treeMargin.left},${this.treeMargin.top})`)

		this.drawFullTree();
	}	

	getSubTree() {
		// the sub tree should consist of parent node, current node, and immediate children	 
	}	

	drawFullTree() {
		// laid out data
		const root = d3.hierarchy(this.treeData, d => d.children_nodes);
		const reasoningTree = this.tree(root);

		// drawing links from laid out data
		this.treeGroup 
			.selectAll(".link")
			.data(reasoningTree.links())
			.join("path")
			.attr("class", "link")
			.attr(
			  "d",
			  d3.linkHorizontal()
				.x(d => d.y)
				.y(d => d.x)
			)
			.attr("fill", "none")
			.attr("stroke", "#ccc")
			.attr("nodes", d => {
				const parentID = d.source.data.segment_id;
				const currentID = d.target.data.segment_id;

				return `node-${parentID}:node-${currentID}`
			});

		// drawing nodes from laid out data
		this.treeGroup
			.selectAll(".node")
			.data(reasoningTree)
			.join("g")
			.attr("class", "node")
			.attr("transform", d => `translate(${d.y}, ${d.x})`)
	  		.call(g => 
	  			g.append("text")
	  				.text(d => {
						console.log(d.data.fork);
					})
	  		)
			.call(g =>
			  g.append("circle")
				.attr("r", 5)
				.attr("fill", "#333")
				.attr("class", "node-circle")
				.attr("id", d => `node-${d.data.segment_id}`)
				.attr("parent-id", d => `node-${d.data.parent_id}`)
				// these should probably be stored separately and not as attributes
				.attr("text", d => d.data.text)
				.attr("entropy", d => d.data.entropy)
				.on("mouseover", (event, d) => { 
					const hovered = d3.select(event.target);
					if (!hovered.classed("selected")) {  
						hovered.style("fill", "#f00");
					}	
				})
				.on("mouseout", (event, d) => { 
					const hovered = d3.select(event.target);
					if (!hovered.classed("selected")) {  
						hovered.style("fill", "#333");
					}	
				})
				.on("click", (event, d) => {
					this.events.call("NodeSelection", this, {
						nodeID: event.target.id
					});
				})
			);
	}

	highlightPath(nodeInfo) {
		// reset all nodes
		this.treeGroup.selectAll('.node-circle')
			.style("fill", "#333")
			.classed("selected", false)

		this.treeGroup.selectAll('.link')
			.style("stroke", "#ccc")
			.classed("selected", false)

		let nodeID = nodeInfo.nodeID;

		let nodes = [];
		let paths = [];
		while (nodeID != 'node-null') {
			const currentNode = d3.select(`#${nodeID}`); 
			const parentID = currentNode.attr("parent-id");
			const currentPath = d3.select(`[nodes='${parentID}:${nodeID}']`);
			nodes.push(currentNode);
			paths.push(currentPath);
			nodeID = parentID; 
		}	
		let textData = [];

		nodes.forEach((node) => {
			textData.push({
				text: node.attr("text"),
				node_id: node.attr("id")
			});
			node.style("fill", "#f00");
			node.classed("selected", true)
		});
		this.events.call("RenderText", this, textData);
		paths.forEach((path) => {
			path.style("stroke", "#a00")
			path.classed("selected", true);
		});
	}	
}	
