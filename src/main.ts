import { Notice, Plugin, WorkspaceLeaf, WorkspaceSplit } from "obsidian";

type Direction = "left" | "right" | "up" | "down";

// A tab group. Obsidian does not type these fields in the public API.
interface TabGroup {
	containerEl: HTMLElement;
	children: WorkspaceLeaf[];
}

const DIRECTIONS: Direction[] = ["left", "right", "up", "down"];
const TOLERANCE = 4; // px, for the gap between neighbor panes

export default class MovePanelsPlugin extends Plugin {
	async onload() {
		for (const dir of DIRECTIONS) {
			this.addCommand({
				id: `move-note-${dir}`,
				name: `Move note to ${dir === "up" ? "top" : dir === "down" ? "bottom" : dir} pane`,
				checkCallback: (checking) => {
					const leaf = this.getSourceLeaf();
					if (!leaf) return false;
					if (!checking) void this.moveLeaf(leaf, dir);
					return true;
				},
			});
		}
	}

	private getSourceLeaf(): WorkspaceLeaf | null {
		const ws = this.app.workspace;
		const leaf = ws.getMostRecentLeaf();
		if (!leaf || !leaf.parent) return null;
		// Only notes in the main editor area, not in the sidebars.
		if (leaf.getRoot() === ws.leftSplit || leaf.getRoot() === ws.rightSplit) return null;
		return leaf;
	}

	private async moveLeaf(leaf: WorkspaceLeaf, dir: Direction) {
		const ws = this.app.workspace;
		const source = leaf.parent as unknown as TabGroup;
		const target = this.findNeighbor(leaf, dir);

		let newLeaf: WorkspaceLeaf;
		if (target) {
			newLeaf = ws.createLeafInParent(
				target as unknown as WorkspaceSplit,
				target.children.length,
			);
		} else if (source.children.length > 1) {
			// No pane in that direction: make a new pane with a split.
			const horizontal = dir === "left" || dir === "right";
			newLeaf = ws.createLeafBySplit(
				leaf,
				horizontal ? "vertical" : "horizontal",
				dir === "left" || dir === "up",
			);
		} else {
			new Notice(`No pane to the ${dir === "up" ? "top" : dir === "down" ? "bottom" : dir}.`);
			return;
		}

		const viewState = leaf.getViewState();
		const eState = leaf.getEphemeralState();
		await newLeaf.setViewState({ ...viewState, active: true }, eState);
		// setViewState() does not apply the pinned flag, thus set it here.
		if (viewState.pinned) newLeaf.setPinned(true);
		leaf.detach();
		ws.setActiveLeaf(newLeaf, { focus: true });
	}

	/** Find the closest tab group next to the leaf's group, in the given direction. */
	private findNeighbor(leaf: WorkspaceLeaf, dir: Direction): TabGroup | null {
		const source = leaf.parent as unknown as TabGroup;
		const root = leaf.getRoot();
		const a = source.containerEl.getBoundingClientRect();

		const groups = new Set<TabGroup>();
		this.app.workspace.iterateAllLeaves((l) => {
			const parent = l.parent as unknown as TabGroup | null;
			if (parent && parent !== source && l.getRoot() === root) groups.add(parent);
		});

		let best: TabGroup | null = null;
		let bestDist = Infinity;
		let bestOverlap = -Infinity;

		for (const g of groups) {
			const b = g.containerEl.getBoundingClientRect();
			if (b.width === 0 || b.height === 0) continue;

			let dist: number;
			let overlap: number;
			if (dir === "left" || dir === "right") {
				dist = dir === "left" ? a.left - b.right : b.left - a.right;
				overlap = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
			} else {
				dist = dir === "up" ? a.top - b.bottom : b.top - a.bottom;
				overlap = Math.min(a.right, b.right) - Math.max(a.left, b.left);
			}
			if (dist < -TOLERANCE || overlap <= 0) continue;

			if (dist < bestDist - TOLERANCE || (Math.abs(dist - bestDist) <= TOLERANCE && overlap > bestOverlap)) {
				best = g;
				bestDist = dist;
				bestOverlap = overlap;
			}
		}
		return best;
	}
}
