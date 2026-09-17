document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("calendar-container");
    const streamContainer = document.getElementById("log-stream") || document.querySelector(".log-stream");
    
    // Only exit if the calendar container element itself is missing
    if (!container) return;

    let currentDate = new Date();

    // If on a single log page, auto-detect date from badge or URL to display the right month
    const badgeDateEl = document.querySelector(".badge-date");
    if (badgeDateEl && badgeDateEl.textContent.trim().match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [y, m, d] = badgeDateEl.textContent.trim().split("-").map(Number);
        currentDate = new Date(y, m - 1, d);
    }

    const cardCache = new Map(); // In-memory cache: "YYYY-MM-DD" -> HTML string of <article>
    let activeMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

    // 1. Cache initial SSR-rendered cards from DOM on page load
    document.querySelectorAll(".log-card[id^='log-']").forEach(card => {
        const dateKey = card.id.replace("log-", "");
        cardCache.set(dateKey, card.outerHTML);
    });

    // 2. Async fetcher for individual log permalinks
    async function fetchLogCard(dateStr, url) {
        if (cardCache.has(dateStr)) {
            return cardCache.get(dateStr);
        }

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const htmlText = await response.text();
            const doc = new DOMParser().parseFromString(htmlText, "text/html");

            let card = doc.querySelector(".log-card") || doc.querySelector("article");

            if (!card) {
                const mainContent = doc.querySelector(".content-area") || doc.querySelector("main") || doc.body;
                card = document.createElement("article");
                card.className = "log-card";
                card.innerHTML = `
                    <div class="log-meta"><span class="badge-date">${dateStr}</span></div>
                    <div class="log-body">${mainContent.innerHTML}</div>
                `;
            }

            card.id = `log-${dateStr}`;
            const cardHTML = card.outerHTML;
            cardCache.set(dateStr, cardHTML);
            return cardHTML;
        } catch (err) {
            console.error(`Failed to fetch log for ${dateStr} at ${url}:`, err);
            return null;
        }
    }

    // 3. Render / Update stream container with logs for selected month
    async function displayMonthLogs(year, month, targetDateStr = null) {
        if (!streamContainer) return; // Ignore stream rendering if on a single log page

        const formattedMonth = String(month + 1).padStart(2, '0');
        const monthPrefix = `${year}-${formattedMonth}`;
        activeMonth = monthPrefix;

        const matchingDates = typeof logMap !== 'undefined'
            ? Object.keys(logMap).filter(date => date.startsWith(monthPrefix)).sort().reverse()
            : [];

        if (matchingDates.length === 0) {
            streamContainer.innerHTML = `
                <div class="log-card" id="no-logs-msg">
                    <p>No logs found for this month. Click a date on the calendar to view past archives.</p>
                </div>`;
            return;
        }

        const uncached = matchingDates.filter(d => !cardCache.has(d));
        if (uncached.length > 0) {
            streamContainer.style.opacity = "0.5";
        }

        const cardHTMLs = await Promise.all(
            matchingDates.map(dateStr => fetchLogCard(dateStr, logMap[dateStr]))
        );

        if (activeMonth !== monthPrefix) return;

        streamContainer.style.opacity = "1";
        const validCards = cardHTMLs.filter(Boolean);

        if (validCards.length === 0) {
            streamContainer.innerHTML = `
                <div class="log-card" id="no-logs-msg">
                    <p>Failed to load logs for ${monthPrefix}. Check developer console for details.</p>
                </div>`;
            return;
        }

        streamContainer.innerHTML = validCards.join("");

        // Rerender Mermaid diagrams for dynamically inserted log cards
        if (typeof window.renderMermaid === "function") {
            window.renderMermaid();
        }

        if (targetDateStr) {
            const targetElement = document.getElementById(`log-${targetDateStr}`);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
                targetElement.classList.add("highlight-log");
                setTimeout(() => targetElement.classList.remove("highlight-log"), 2000);
            }
        }
    }

    // 4. Render Calendar Grid & Header
    function renderCalendar(year, month) {
        container.innerHTML = "";

        const header = document.createElement("div");
        header.className = "calendar-header";

        const prevBtn = document.createElement("button");
        prevBtn.textContent = "←";
        prevBtn.onclick = () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            update();
        };

        const title = document.createElement("span");
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        title.textContent = `${monthNames[month]} ${year}`;

        const nextBtn = document.createElement("button");
        nextBtn.textContent = "→";
        nextBtn.onclick = () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            update();
        };

        header.append(prevBtn, title, nextBtn);
        container.appendChild(header);

        const grid = document.createElement("div");
        grid.className = "calendar-grid";

        ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].forEach(day => {
            const dayHeader = document.createElement("div");
            dayHeader.className = "day-header";
            dayHeader.textContent = day;
            grid.appendChild(dayHeader);
        });

        const firstDayIndex = new Date(year, month, 1).getDay();
        const totalDays = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < firstDayIndex; i++) {
            const emptyCell = document.createElement("div");
            emptyCell.className = "calendar-cell empty";
            grid.appendChild(emptyCell);
        }

        for (let day = 1; day <= totalDays; day++) {
            const cell = document.createElement("div");
            cell.className = "calendar-cell";
            cell.textContent = day;

            const formattedMonth = String(month + 1).padStart(2, '0');
            const formattedDay = String(day).padStart(2, '0');
            const dateStr = `${year}-${formattedMonth}-${formattedDay}`;

            if (typeof logMap !== 'undefined' && logMap[dateStr]) {
                cell.classList.add("has-log");
                cell.title = `View log for ${dateStr}`;
                cell.onclick = () => {
                    if (streamContainer) {
                        displayMonthLogs(year, month, dateStr);
                    } else {
                        // Direct page navigation when on single log view
                        window.location.href = logMap[dateStr];
                    }
                };
            } else {
                cell.classList.add("no-log");
            }

            grid.appendChild(cell);
        }

        container.appendChild(grid);
    }

    // 5. Update UI state when changing months
    function update() {
        const yr = currentDate.getFullYear();
        const mo = currentDate.getMonth();
        renderCalendar(yr, mo);
        displayMonthLogs(yr, mo);
    }

    renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
});
