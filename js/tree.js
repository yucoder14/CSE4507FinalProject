const demo_data = "./data/reasoning_tree.json";

let reasoningTree = null;
d3.json(demo_data).then((json) => {
	const prompts = Object.keys(json);

	prompts.forEach((prompt) => {
		console.log(prompt);
		reasoningTree = json[prompt];
	});

	const events = d3.dispatch("NodeSelection");


	const svg = d3.select("#canvas").append("svg")
		.attr("width", 1000)
		.attr("height", 1000);

	// tree layout 
	const tree = d3.tree().size([700, 700]);

	// laid out data
	const root = d3.hierarchy(reasoningTree, d => d.children_nodes);
	const familyTree = tree(root);

	// group for the tree data
	const treeGroup = svg.append("g") 
		.attr("transform", "translate(150, 70)")

	// drawing links from laid out data
	treeGroup 
		.selectAll(".link")
		.data(familyTree.links())
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
			const parentData = d.source.data.node_id;
			const currentData = d.target.data.node_id;

			return `node-${parentData}:node-${currentData}`
		});

	// drawing nodes from laid out data
	treeGroup
		.selectAll(".node")
		.data(familyTree)
		.join("g")
		.attr("class", "node")
		.attr("transform", d => `translate(${d.y}, ${d.x})`)
		.call(g => 
			g.append("text")
				.text(d => {return d.data.token_str})
		)
		.call(g =>
		  g.append("circle")
			.attr("r", 5)
			.attr("fill", "#333")
			.attr("id", d => `node-${d.data.node_id}`)
			.attr("parent-id", d => `node-${d.data.parent_id}`)
			// these should probably be stored separately and not as attributes
			.attr("text", d => d.data.token_str)
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
				events.call("NodeSelection", this, {
					nodeID: event.target.id
				});
			})
		);

//	events.on("NodeMouseOut.dashboard", nodeInfo => {});
//	events.on("NodeMouseOver.dashboard", nodeInfo => {});

	events.on("NodeSelection.dashboard", nodeInfo => {
		// reset all nodes
		d3.selectAll('circle')
			.style("fill", "#333")
			.classed("selected", false)

		d3.selectAll('.link')
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
		console.log("asdf", textData);
		paths.forEach((path) => {
			console.log(path);
			path.style("stroke", "#a00");
			path.classed("selected", true)
		});
	});
	console.log(familyTree);
	console.log(familyTree.links());
});
