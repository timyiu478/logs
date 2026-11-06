document.addEventListener("DOMContentLoaded", () => {
    const tagList = document.getElementById("tag-list");
    const status = document.getElementById("tag-filter-status");
    const activeTag = document.getElementById("active-tag");
    const matchCount = document.getElementById("tag-match-count");
    const resetButton = document.getElementById("tag-reset");
    const tagPanel = document.getElementById("tag-panel");

    if (!tagList || !status || !activeTag || !matchCount || !resetButton) return;

    const cards = Array.from(document.querySelectorAll(".log-card"));
    let selectedTag = null;

    function updateFilter(tag) {
        selectedTag = tag;
        let matches = 0;

        cards.forEach((card) => {
            const tags = Array.from(card.querySelectorAll("[data-tag].entry-tag"))
                .map((button) => button.dataset.tag);
            const visible = !selectedTag || tags.includes(selectedTag);
            card.hidden = !visible;
            if (visible) matches += 1;
        });

        tagList.querySelectorAll(".tag-chip").forEach((button) => {
            const isActive = button.dataset.tag === selectedTag;
            button.classList.toggle("is-active", isActive);
            button.setAttribute("aria-pressed", String(isActive));
        });

        status.hidden = !selectedTag;
        resetButton.hidden = !selectedTag;
        if (selectedTag) {
            activeTag.textContent = `[${selectedTag}] ×`;
            matchCount.textContent = `${matches} ${matches === 1 ? "entry" : "entries"} on this page`;
        }
    }

    function handleTagClick(event) {
        const button = event.target.closest("[data-tag]");
        if (!button) return;
        updateFilter(selectedTag === button.dataset.tag ? null : button.dataset.tag);
    }

    tagList.addEventListener("click", handleTagClick);
    document.querySelectorAll(".log-tags").forEach((group) => group.addEventListener("click", handleTagClick));
    resetButton.addEventListener("click", () => updateFilter(null));
    activeTag.addEventListener("click", () => updateFilter(null));

    // Keep the tag cloud out of the way while scrolling down; reveal it again
    // when the reader scrolls upward or returns to the top.
    if (tagPanel) {
        let previousY = window.scrollY;
        let ticking = false;

        window.addEventListener("scroll", () => {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(() => {
                const currentY = window.scrollY;
                const scrollingDown = currentY > previousY;
                tagPanel.classList.toggle("is-scrolled-away", currentY > 80 && scrollingDown);
                if (currentY <= 80 || !scrollingDown) tagPanel.classList.remove("is-scrolled-away");
                previousY = currentY;
                ticking = false;
            });
        }, { passive: true });
    }
});
