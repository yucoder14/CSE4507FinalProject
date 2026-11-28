const tree_data_path = "./data/reasoning_trees.jsonl";
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
	loadJsonl(problem_metadata_path),
]).then(([tree_data, problem_metadata]) => {
	// Wrangle data
	const treeData = Object.fromEntries(
		tree_data.map((row, i) => [i, row]) 
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
	const paragraph = new Paragraph("text-canvas");
	const questionContent = document.getElementById("question-content");
	const questionID = document.getElementById("question-id");
	const animateText = document.getElementById("animate-text");
	animateText.addEventListener("change", () => paragraph.setAnimationEnabled(animateText.checked));

	function showQuestion(problemID) {
		const metadata = problemMetadata[problemID] ?? {};
		const question = String(metadata.problem ?? metadata.question ?? metadata.prompt ?? metadata.title ?? "No question available.");
		const parts = question.split(/(\[asy\][\s\S]*?\[\/asy\])/gi);
		questionContent.replaceChildren();
		parts.forEach(part => {
			if (/^\[asy\]/i.test(part)) {
				const details = document.createElement("details");
				details.className = "asy-source";
				const summary = document.createElement("summary");
				summary.textContent = "Graph source (Asymptote)";
				const code = document.createElement("pre");
				code.textContent = part.slice(5, -6).trim();
				details.append(summary, code);
				questionContent.append(details);
			} else {
				questionContent.append(document.createTextNode(part));
			}
		});
		questionID.textContent = `Problem ${problemID}`;
		if (window.MathJax?.typesetPromise) {
			window.MathJax.typesetClear?.([questionContent]);
			window.MathJax.typesetPromise([questionContent]).catch(console.error);
		}
	}
	document.querySelector("#mathjax-script").addEventListener("load", () => {
		if (questionID.textContent) window.MathJax?.typesetPromise?.([questionContent]).catch(console.error);
	});

	// Handle events
	events.on("ProblemSelection.dashboard", probInfo => {
		const problemID = probInfo.prob_id;
		if (!Object.hasOwn(treeData, problemID)) {
			console.warn(`No tree data for problem ${problemID}`);
			return;
		}
		showQuestion(problemID);
		paragraph.reset();
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
		const path = [...segmentsInfo].reverse().map(info => {
			const node = tree.nodeLookUp[info.node_id];
			return { id: info.node_id, text: node?.text ?? "", entry: node?.entry };
		});
		paragraph.renderPath(path);
	})
}).catch(error => {
	console.error("Could not load dashboard data", error);
	document.getElementById("selector").textContent =
		"Could not load the tree or problem metadata. Serve this folder over HTTP and check the JSONL files in ./data.";
});
