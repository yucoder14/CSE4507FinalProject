# Reasoning tree dashboard

Place `reasoning_trees.jsonl`, `token_stats.jsonl`, and `problem_metadata.jsonl` in `data/`. These large data files are excluded by `.gitignore` and are not included in this archive.

Serve this directory over HTTP (for example, `python -m http.server 8000`) and open `http://localhost:8000/`. Select a level, then a problem. The tree and text update for that problem; the tree's color toggle applies the shared color scale to both views.

The selector reads the problem level from `metadata.level` (also accepting `difficulty` or `problem_level`). It labels problems using `problem`, `question`, `prompt`, or `title` when present, otherwise the problem ID. Verify these fields against the project's actual JSONL data before release.
