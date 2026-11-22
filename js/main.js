const tree_data_path = "./data/reasoning_trees.jsonl";
const token_data_path = "./data/token_stats.jsonl";
const problem_metadata_path = "./data/problem_metadata.jsonl";

async function loadJsonl(url) {
	const rawText = await d3.text(url);

	const data = rawText
		.trim()                 		// Remove trailing newlines/whitespace
		.split('\n')            		// Split into individual lines
		.filter(line => line)   		// Skip any empty lines
		.map(line => JSON.parse(line)); // Parse each line as JSON

	return data;
}

Promise.all([
	loadJsonl(tree_data_path),
	loadJsonl(token_data_path),
	loadJsonl(problem_metadata_path),
]).then(([tree_data, token_data, problem_metadata]) => {
	// Wrangle data
	const treeData = Object.fromEntries(
		tree_data.map((row, i) => [i, row]) 
	);
	const tokenData = Object.fromEntries(
		token_data.map(row => [`${row.example_id}:${row.segment_id}`, row.tokens])
	);
	const problemMetadata = Object.fromEntries(
		problem_metadata.map(row => [row.example_id, row.metadata])
	);

	// initialize event dashboard
	const events = d3.dispatch(
		// events from selector 
		"ProblemSelection", 
		// events for tree and paragraph interaction
		"NodeSelection", 
		"RenderText", 
		"ChangeColorMode"
	);

	// color scales
	const probColorScale = d3.scaleLinear()
		.domain([0, 1]) 
		.range(["#fff", "#f00"]);

	const entropyColorScale = d3.scaleDiverging()
		.domain([0, 1, 2])  
		.interpolator(d3.piecewise(d3.interpolateRgb, ["#00a", "#fff", "#a00"]));

	const colorScales = [ probColorScale, entropyColorScale ];

	// initialize filter and selection modules
	const selector = new Selector("selector", events, problemMetadata);

	// initialize tree and paragraph modules
	const tree = new ReasoningTree("tree-canvas", events, colorScales);
	const paragraph = new Paragraph("text-canvas", events, colorScales);

	// Handle events
	events.on("ProblemSelection.dashboard", probInfo => {
		const problemID = probInfo.prob_id;
		if (!Object.hasOwn(treeData, problemID)) {
			console.warn(`No tree data for problem ${problemID}`);
			return;
		}
		tree.seed(problemID, treeData[problemID]);
		tree.highlightPath();
	});	

	events.on("NodeSelection.dashboard", nodeInfo => {
		tree.drawTree(tree.getSubTree(nodeInfo.nodeID));
		tree.highlightPath();
	})

	events.on("ChangeColorMode.dashboard", colorMode => {
		paragraph.colorHighlights(colorMode);
	})	

	events.on("RenderText.dashboard", segmentsInfo => {
		let tokensSegmentKeys = segmentsInfo.map(
			segmentInfo => {
				return `${segmentInfo.problem_id}:${segmentInfo.segment_id}`;
			}
		);	
		let tokensSegment = tokensSegmentKeys.map(key => tokenData[key] ?? []);
		paragraph.renderText(tokensSegment);
	})
}).catch(error => {
	console.error("Could not load dashboard data", error);
	document.getElementById("selector").textContent =
		"Could not load data. Place the three JSONL files in ./data and serve this folder over HTTP.";
});
