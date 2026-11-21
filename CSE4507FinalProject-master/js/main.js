const typeFilter = document.getElementById("type-filter");
const levelFilter = document.getElementById("level-filter");
const problemList = document.getElementById("problem-list");
const treeCanvas = document.getElementById("tree-canvas");
const textCanvas = document.getElementById("text-canvas");
const entries = new Map();
let tree = null;

// A type is one distinct question. Its level comes from problem_metadata.jsonl.
function filterParams() {
	return {type: typeFilter.value, level: levelFilter.value};
}

const events = d3.dispatch("NodeSelection", "RenderText");
const paragraph = new Paragraph("text-canvas", events);

events.on("RenderText.dashboard", segments => {
	const enriched = segments.map(segment => {
		const node = tree?.nodeLookUp[segment.node_id];
		return {...segment, entropy: node?.entry?.entropy ?? null};
	});
	paragraph.renderText(enriched);
});

events.on("NodeSelection.dashboard", nodeInfo => {
	if (!tree) return;
	tree.drawTree(tree.getSubTree(nodeInfo.nodeID));
	// Build the text path from the data, including ancestors outside the visible subtree.
	const path = [];
	const seen = new Set();
	let nodeID = nodeInfo.nodeID;
	while (tree.nodeLookUp[nodeID] && !seen.has(nodeID)) {
		seen.add(nodeID);
		const node = tree.nodeLookUp[nodeID];
		path.push({node_id: nodeID, text: node.text});
		nodeID = `node-${node.parent_id}`;
	}
	tree.treeGroup.selectAll(".node-circle")
		.style("fill", null)
		.classed("selected", function() { return seen.has(this.id); });
	tree.treeGroup.selectAll(".link")
		.style("stroke", null)
		.classed("selected", function() {
			const [parent, child] = (this.getAttribute("nodes") || "").split(":");
			return seen.has(parent) && seen.has(child);
		});
	events.call("RenderText", tree, path);
});

function showSelection() {
	const {type, level} = filterParams();
	treeCanvas.replaceChildren();
	textCanvas.replaceChildren();
	problemList.replaceChildren();
	tree = null;
	const entry = entries.get(type);
	if (!entry || entry.level !== level) return;

	const button = document.createElement("button");
	button.textContent = entry.question;
	button.addEventListener("click", () => tree?.highlightPath({nodeID: `node-${entry.root.segment_id}`}));
	problemList.append(button);

	tree = new ReasoningTree("tree-canvas", entry.root, events);
	tree.highlightPath({nodeID: `node-${entry.root.segment_id}`});
}

typeFilter.addEventListener("change", () => {
	const entry = entries.get(typeFilter.value);
	levelFilter.replaceChildren(new Option(entry ? "Select level" : "Select problem first", ""));
	if (entry) levelFilter.append(new Option(entry.level, entry.level));
	levelFilter.disabled = !entry;
	showSelection();
});
levelFilter.addEventListener("change", showSelection);

async function loadData() {
	try {
		const [metadataText, treesText] = await Promise.all([
			d3.text("./data/problem_metadata.jsonl"),
			d3.text("./data/reasoning_trees.jsonl")
		]);
		const metadata = metadataText.trim().split(/\r?\n/).map(JSON.parse);
		const roots = new Map();
		for (const line of treesText.trim().split(/\r?\n/)) {
			const treeObject = JSON.parse(line);
			const question = Object.keys(treeObject)[0];
			roots.set(question, treeObject[question]);
		}
		for (const item of metadata) {
			const question = item.raw_question;
			const root = roots.get(question);
			if (!root) continue;
			const id = String(item.example_id);
			entries.set(id, {question, level: item.metadata.level, root});
			typeFilter.append(new Option(`#${id}: ${question}`, id));
		}
		if (!entries.size) throw new Error("No matching questions and trees found.");
	} catch (error) {
		problemList.textContent = `Could not load data: ${error.message}`;
	}
}

loadData();
