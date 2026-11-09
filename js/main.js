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
	const events = d3.dispatch("NodeSelection");

	const tree = new ReasoningTree("tree-canvas", demoTree, events);

	events.on("NodeSelection.dashboard", nodeInfo => {
		tree.highlightPath(nodeInfo);
	})
});

