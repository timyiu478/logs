// Turn topic headings into filterable log entries. For example, a heading like
// "Dynamic Programming: LC-464..." is grouped with its content and tagged
// "Dynamic Programming". This uses the existing Markdown format, so no content
// migration or new front matter is required.
document.addEventListener("DOMContentLoaded", () => {
    const tagList = document.getElementById("tag-list");
    const status = document.getElementById("tag-filter-status");
    const activeTagButton = document.getElementById("active-tag");
    const matchCount = document.getElementById("tag-match-count");
    const resetButton = document.getElementById("tag-reset");
    const emptyMessage = document.getElementById("tag-empty");

    if (!tagList || !status || !activeTagButton || !matchCount || !resetButton) return;

    const entries = [];
    const headingPattern = /^H[1-6]$/;

    document.querySelectorAll(".log-body").forEach((body) => {
        const originalChildren = Array.from(body.children);
        const taggedHeadings = originalChildren
            .map((element, index) => {
                const text = element.textContent.trim();
                const colonIndex = text.indexOf(":");
                if (!headingPattern.test(element.tagName) || colonIndex < 1) return null;
                return { element, index, tag: text.slice(0, colonIndex).trim() };
            })
            .filter(Boolean);

        taggedHeadings.forEach((heading, headingIndex) => {
            const nextHeading = taggedHeadings[headingIndex + 1];
            const endIndex = nextHeading ? nextHeading.index : originalChildren.length;
            const entry = document.createElement("section");
            entry.className = "log-entry";
            entry.dataset.tag = heading.tag;

            for (let index = heading.index; index < endIndex; index += 1) {
                entry.appendChild(originalChildren[index]);
            }

            const chip = document.createElement("button");
            chip.type = "button";
            chip.className = "entry-tag";
            chip.dataset.tag = heading.tag;
            chip.textContent = `[${heading.tag}]`;
            chip.setAttribute("aria-label", `Filter entries tagged ${heading.tag}`);
            entry.insertBefore(chip, entry.firstChild);
            body.insertBefore(entry, nextHeading ? originalChildren[nextHeading.index] : null);
            entries.push({ element: entry, tag: heading.tag });
        });
    });

    const counts = new Map();
    entries.forEach(({ tag }) => counts.set(tag, (counts.get(tag) || 0) + 1));
    if (emptyMessage) emptyMessage.hidden = counts.size > 0;

    [...counts.entries()]
        .sort(([tagA], [tagB]) => tagA.localeCompare(tagB))
        .forEach(([tag, count]) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "tag-chip";
            button.dataset.tag = tag;
            button.setAttribute("aria-pressed", "false");

            const label = document.createElement("span");
            label.textContent = tag;
            const total = document.createElement("span");
            total.className = "tag-count";
            total.textContent = count;
            button.append(label, total);
            tagList.appendChild(button);
        });

    let selectedTag = null;

    function updateFilter(tag) {
        selectedTag = tag;
        let matches = 0;

        entries.forEach((entry) => {
            const visible = !selectedTag || entry.tag === selectedTag;
            entry.element.hidden = !visible;
            if (visible) matches += 1;
        });

        document.querySelectorAll(".log-card").forEach((card) => {
            const cardEntries = card.querySelectorAll(".log-entry");
            card.hidden = Boolean(selectedTag) && !Array.from(cardEntries).some((entry) => !entry.hidden);
        });

        tagList.querySelectorAll(".tag-chip").forEach((button) => {
            const isActive = button.dataset.tag === selectedTag;
            button.classList.toggle("is-active", isActive);
            button.setAttribute("aria-pressed", String(isActive));
        });

        status.hidden = !selectedTag;
        resetButton.hidden = !selectedTag;
        if (selectedTag) {
            activeTagButton.textContent = `[${selectedTag}] ×`;
            matchCount.textContent = `${matches} ${matches === 1 ? "entry" : "entries"}`;
        }
    }

    tagList.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-tag]");
        if (button) updateFilter(selectedTag === button.dataset.tag ? null : button.dataset.tag);
    });

    document.querySelectorAll(".log-body").forEach((body) => {
        body.addEventListener("click", (event) => {
            const button = event.target.closest(".entry-tag");
            if (button) updateFilter(selectedTag === button.dataset.tag ? null : button.dataset.tag);
        });
    });

    const clearFilter = () => updateFilter(null);
    resetButton.addEventListener("click", clearFilter);
    activeTagButton.addEventListener("click", clearFilter);
});
