const data = "./data/tree_0.json";
const entries = {};
let demoTree = null;

d3.json(data).then((json) => {
	const prompts = Object.keys(json);

	prompts.forEach((prompt) => {
		entries[prompt] = json[prompt];
		demoTree = json[prompt];
	});

	// event handlers
	const events = d3.dispatch("NodeSelection", "RenderText");

	const tree = new ReasoningTree("tree-canvas", demoTree, events);
	const paragraph = new Paragraph("text-canvas", events);

	events.on("NodeSelection.dashboard", nodeInfo => {
		// draw sub trees
		console.log(tree.getSubTree(nodeInfo.nodeID));
		tree.drawTree(tree.getSubTree(nodeInfo.nodeID));
		tree.highlightPath(nodeInfo);
	})

	events.on("RenderText.dashboard", segments => {
		paragraph.renderText(segments);
	})
});

