class ReasoningTree {
	constructor(divID, treeData, events) {
		this.divID = divID;
		this.treeData = treeData;
		this.events = events;
		this.currentNodeID = null;	
		this.nodeLookUp = {};
		this.subTreeEnabled = true;

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

		this.createNodeLookUp();
		this.currentNodeID = this.treeData.segment_id;
		this.drawTree(this.getSubTree('node-0'));

		this.svg.append("rect")
			.attr("id", "full-tree-button")
			.attr("x", this.treeMargin.left)
			.attr("y", 100)
			.attr("width", 100)
			.attr("height", 50)
			.on("click", (event) => {
				this.drawTree(this.treeData);
				this.subTreeEnabled = false;
			})
	}	

	createNodeLookUp() {
		const stack = [this.treeData];

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

		return this.treeData;
	}	

	drawTree(treeData) {
		// laid out data
		const root = d3.hierarchy(treeData, d => d.children_nodes);
		const reasoningTree = this.tree(root);

		// drawing links from laid out data
		this.treeGroup 
			.selectAll(".link")
			.data(reasoningTree.links(), d => `${d.source.data.segment_id}:${d.target.data.segment_id}`)
			.join(
				(enter) => {
					return enter.append("path")
						.attr("class", "link")
						.attr("fill", "none")
						.attr("stroke", "#ccc")
						.attr("nodes", d => {
							const parentID = d.source.data.segment_id;
							const currentID = d.target.data.segment_id;

							return `node-${parentID}:node-${currentID}`
						})
						.attr(
						  "d",
						  d3.linkHorizontal()
							.x(d => d.x)
							.y(d => this.treeHeight/2)
						)
						.transition()
						.attr(
						  "d",
						  d3.linkHorizontal()
							.x(d => d.y)
							.y(d => d.x)
						)
						
				},
				(update) => {
					return update
						.transition()
						.attr(
						  "d",
						  d3.linkHorizontal()
							.x(d => d.y)
							.y(d => d.x)
						)
				},
				(exit) => {
					return exit
						.transition()
						.attr(
						  "d",
						  d3.linkHorizontal()
							.x(d => d.x)
							.y(d => this.treeHeight/2)
						)
						.remove()
				}
			)

		// drawing nodes from laid out data
		this.treeGroup
			.selectAll(".node")
			.data(reasoningTree, d =>{
				return d.data.segment_id;
			})
			.join(
				(enter) => {
					return enter.append("g")
						.attr("class", "node")
						.attr("transform", d => `translate(${d.y}, ${this.treeHeight/2})`)
						.transition()
						.attr("transform", d => `translate(${d.y}, ${d.x})`)
				},
				(update) => {
					return update
						.transition()
						.attr("transform", d => `translate(${d.y}, ${d.x})`)
				},
				(exit) => {
					return exit
						.transition()
						.attr("transform", d => `translate(${d.y}, ${this.treeHeight/2})`)
						.remove();
				}	
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
//	  		.call(g => 
//	  			g.append("text")
//	  				.text(d => {
//					})
//	  		)
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
//			node.style("fill", "#f00");
			node.classed("selected", true)
		});
		this.events.call("RenderText", this, textData);
		paths.forEach((path) => {
			path.style("stroke", "#a00")
			path.classed("selected", true);
		});
	}	
}	
