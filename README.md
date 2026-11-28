# Reasoning tree dashboard

This archive includes `reasoning_trees.jsonl` and `problem_metadata.jsonl` in `data/`. The path display uses the text stored in tree nodes; `token_stats.jsonl` is not required.

Serve this directory over HTTP (for example, `python -m http.server 8000`) and open `http://localhost:8000/`. Select a level, then a problem. The tree and text update for that problem; the tree's color toggle applies the shared color scale to both views.

Search questions by text or ID, optionally filter by level, then select a problem. The complete question appears above the tree. The question, tree, and path panels fit within one viewport; long question and path content scrolls inside their panels. The tree scales to its canvas and keeps the original node and toggle interactions. The path panel keeps the complete selected path, progressively appends newly selected branch text, and highlights the selected word and its sentence inline. MathJax renders TeX math and requires internet access to load from jsDelivr. Asymptote `[asy]` graph source is shown in an expandable block; rendering Asymptote diagrams requires a separate renderer. Clear “Animate text” to show path changes immediately. Reduced-motion preferences also disable the animation.
