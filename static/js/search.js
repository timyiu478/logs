document.addEventListener("DOMContentLoaded", () => {
    const searchTrigger = document.getElementById("search-trigger");
    const searchModal = document.getElementById("search-modal");
    const searchInput = document.getElementById("search-input");
    const searchResults = document.getElementById("search-results");

    if (!searchModal || !searchInput || !searchResults) return;

    let selectedIndex = -1;

    function openSearch() {
        searchModal.style.display = "flex";
        searchInput.value = "";
        searchResults.innerHTML = "";
        selectedIndex = -1;
        setTimeout(() => searchInput.focus(), 50);
    }

    function closeSearch() {
        searchModal.style.display = "none";
    }

    if (searchTrigger) {
        searchTrigger.addEventListener("click", openSearch);
    }

    // Toggle modal via Cmd + K (Mac) or Ctrl + K (Windows/Linux) & ESC
    document.addEventListener("keydown", (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
            e.preventDefault();
            if (searchModal.style.display === "flex") {
                closeSearch();
            } else {
                openSearch();
            }
        }

        if (e.key === "Escape" && searchModal.style.display === "flex") {
            closeSearch();
        }
    });

    // Close when clicking backdrop
    searchModal.addEventListener("click", (e) => {
        if (e.target === searchModal) {
            closeSearch();
        }
    });

    if (!window.searchIndex) return;
    const index = elasticlunr.Index.load(window.searchIndex);

    searchInput.addEventListener("input", function () {
        const query = this.value.trim();
        selectedIndex = -1;
        
        if (query === "") {
            searchResults.innerHTML = "";
            return;
        }

        const results = index.search(query, {
            bool: "OR",
            expand: true
        });

        if (results.length === 0) {
            searchResults.innerHTML = `<div class="search-item"><div class="search-snippet">No matching logs found.</div></div>`;
            return;
        }

        searchResults.innerHTML = results.slice(0, 6).map((r, i) => {
            const doc = index.documentStore.getDoc(r.ref);
            
            // Resolves the 'undefined' URL issue across Zola versions
            const url = doc.permalink || doc.url || doc.id || r.ref;
            const title = doc.title || "Log Entry";
            const cleanBody = (doc.body || "").replace(/(<([^>]+)>)/gi, "").substring(0, 95);

            return `
                <a href="${url}" class="search-item" data-index="${i}">
                    <div class="search-title">${title}</div>
                    <div class="search-snippet">${cleanBody}...</div>
                </a>
            `;
        }).join("");
    });

    // Keyboard navigation (Arrow keys & Enter)
    searchInput.addEventListener("keydown", (e) => {
        const items = searchResults.querySelectorAll(".search-item[href]");
        if (items.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            selectedIndex = (selectedIndex + 1) % items.length;
            updateSelection(items);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            selectedIndex = (selectedIndex - 1 + items.length) % items.length;
            updateSelection(items);
        } else if (e.key === "Enter" && selectedIndex >= 0 && items[selectedIndex]) {
            e.preventDefault();
            items[selectedIndex].click();
        }
    });

    function updateSelection(items) {
        items.forEach((item, idx) => {
            if (idx === selectedIndex) {
                item.classList.add("selected");
                item.scrollIntoView({ block: "nearest" });
            } else {
                item.classList.remove("selected");
            }
        });
    }
});
