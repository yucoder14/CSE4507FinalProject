//const demo_data = "./data/tree_0.json";

class ReasoningTree {
	constructor(divID, treeData, events) {
		this.divID = divID;
		this.treeData = treeData;
		this.events = events;

		this.init();
	}	

	init() {
		this.svg = d3.select(`#${this.divID}`).append("svg")
			.attr("width", 1000)
			.attr("height", 1000);

		// tree layout 
		this.tree = d3.tree().size([700, 700]);

		// group for the tree data
		this.treeGroup = this.svg.append("g") 
			.attr("transform", "translate(150, 70)")


		this.update();
	}	

	update() {
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
	//		.call(g => 
	//			g.append("text")
	//				.text(d => {return d.data.text})
	//		)
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
				entropy: node.attr("entropy")
			});
			node.style("fill", "#f00");
			node.classed("selected", true)
		});
//		let foo = "";	
//		for (let i = textData.length - 1; i > -1; i -=1) {
//			foo = foo + textData[i].text; 
//		}	
//		console.log(foo);
		paths.forEach((path) => {
			path.style("stroke", "#a00")
			path.classed("selected", true);
		});
	}	
}	
