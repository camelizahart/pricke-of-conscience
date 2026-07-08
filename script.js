// ====== SETTINGS ======
let BASE_WITNESS = "MV27";
const ALL_WITNESSES = ["MV27", "MV1", "MV2", "MV4", "MV5", "MV6", "MV7", "MV8", "MV9", "MV10", "MV11", "MV12", "MV13", "MV14", "MV15", "MV16", "MV17", "MV18", "MV19", "MV20", "MV21", "MV22", "MV23", "MV24", "MV25", "MV26", "MV28", "MV29", "MV30", "MV31", "MV32", "MV33", "MV34", "MV35", "MV36", "MV38", "MV39", "MV40", "MV41", "MV42", "MV43", "MV44", "MV45", "MV46", "MV48", "MV50", "MV51", "MV52", "MV53", "MV55", "MV56", "MV57", "MV58", "MV59", "MV60", "MV61", "MV62", "MV63", "MV64", "MV65", "MV66", "MV67", "MV68", "MV69", "MV70", "MV71", "MV72", "MV73", "MV74", "MV75", "MV77", "MV78", "MV81", "MV82", "MV83", "MV85", "MV86", "MV87", "MV88", "MV89", "MV90", "MV91", "MV93", "MV94", "MV96", "MV97"];

let xmlDoc = null;
let alignment = {};


// ====== CREATE BASE WITNESS SELECTOR ======
function createBaseSelector() {
    const output = document.getElementById("poem");

    const container = document.createElement("div");
    container.className = "base-selector";

    const label = document.createElement("label");
    label.textContent = "Base Witness: ";

    const select = document.createElement("select");

    ALL_WITNESSES.forEach(witness => {
        const option = document.createElement("option");
        option.value = witness;
        option.textContent = witness;

        if (witness === BASE_WITNESS) {
            option.selected = true;
        }

        select.appendChild(option);
    });

    select.addEventListener("change", () => {
        BASE_WITNESS = select.value;
        renderBaseLines();
    });

    container.appendChild(label);
    container.appendChild(select);

    output.appendChild(container);
}


// ====== LOAD XML ======
async function loadTEI() {
    const output = document.getElementById("poem");

    try {
        const res = await fetch("practice.xml");

        if (!res.ok) {
            output.innerHTML = `<p style="color:red;">Could not find practice.xml.</p>`;
            return;
        }

        let xmlText = await res.text();
        xmlText = xmlText.replace(/xmlns="[^"]*"/, "");

        const parser = new DOMParser();
        xmlDoc = parser.parseFromString(xmlText, "text/xml");

       const parseError = xmlDoc.querySelector("parsererror");
        if (parseError) {
            output.innerHTML = `<pre style="color:red; white-space:pre-wrap;">${parseError.textContent}</pre>`;
            return;
        }

        buildAlignmentTable();
        createBaseSelector();
        renderBaseLines();

    } catch (err) {
        output.innerHTML = `<p style="color:red;">${err.message}</p>`;
    }
}


// ====== BUILD ALIGNMENT TABLE ======
function buildAlignmentTable() {
    const links = xmlDoc.getElementsByTagName("link");
    for (const link of links) {
        const targets = link.getAttribute("target").split(" ");
        const canonicalId = targets[0];
        alignment[canonicalId] = targets;
    }
}


// ====== FIND XML LINE ======
function findLineById(id) {
    const allLines = xmlDoc.getElementsByTagName("l");
    for (const line of allLines) {
        if (line.getAttribute("xml:id") === id) {
            return line;
        }
    }
    return null;
}

function getLineText(ref) {
    const id = ref.replace("#", "");
    const el = findLineById(id);
    return el ? el.textContent.trim() : "[not found]";
}

// Returns ALL refs belonging to a witness for this canonical line
// (usually just one, but sometimes two if a witness's poem splits differently)
function getRefsForWitness(variants, witnessId) {
    return variants.filter(v => v.startsWith("#" + witnessId + "-"));
}

// Combines text from multiple lines into one readable block
function getCombinedLineText(refs) {
    return refs.map(ref => getLineText(ref)).join(" / ");
}

// Builds "(Line 1)" or "(Line 1 & 2)" depending on how many lines this witness has here
function getLineNumberLabel(refs) {
    const numbers = refs.map(ref => getLineNumberFromRef(ref));
    return numbers.join(" & ");
}

// Given a ref like "#MV5-L3", returns just "3"
function getLineNumberFromRef(ref) {
    const match = ref.match(/-L(\d+)/);
    return match ? match[1] : "?";
}

function buildVariantLabel(witnessId, refs, baseLineNumber) {
    if (!refs || refs.length === 0) {
        return `${witnessLabel(witnessId)}`;
    }

    const lineText = `(Line ${getLineNumberLabel(refs)})`;

    // Flag as a mismatch if ANY of this witness's lines differ from the base line number
    const hasMismatch = refs.some(ref => getLineNumberFromRef(ref) !== baseLineNumber);

    if (hasMismatch) {
        return `${witnessLabel(witnessId)} <span class="line-mismatch">${lineText}</span>`;
    } else {
        return `${witnessLabel(witnessId)} ${lineText}`;
    }
}



function witnessLabel(id) {
    return id;
}


// ====== RENDER BASE TEXT ======
function renderBaseLines() {
    const output = document.getElementById("poem");
    const selector = output.querySelector(".base-selector");

    output.innerHTML = "";

    if (selector) {
        output.appendChild(selector);
    }

    const heading = document.createElement("h2");
    heading.className = "witness-heading";
    heading.textContent = BASE_WITNESS;
    output.appendChild(heading);

    const allLines = xmlDoc.getElementsByTagName("l");
    const baseLines = [];

    for (const line of allLines) {
        const id = line.getAttribute("xml:id");
        if (id && id.startsWith(BASE_WITNESS + "-L")) {
            baseLines.push(line);
        }
    }

    baseLines.forEach(line => {
        const canonicalId = "#" + line.getAttribute("xml:id");

        const wrapper = document.createElement("div");
        wrapper.className = "line-block";

        const lineDiv = document.createElement("div");
        lineDiv.className = "line";

        const id = line.getAttribute("xml:id");
        const lineNumber = id.match(/-L(\d+)/)?.[1] || "";

        const number = document.createElement("span");
        number.className = "line-number";
        number.textContent = lineNumber;

        const text = document.createElement("span");
        text.className = "line-text";
        text.textContent = line.textContent.trim();

        lineDiv.appendChild(number);
        lineDiv.appendChild(text);

        lineDiv.addEventListener("click", () => {
            toggleCompareMenu(wrapper, canonicalId);
        });

        wrapper.appendChild(lineDiv);
        output.appendChild(wrapper);
    });
}


// ====== COMPARISON MENU ======
function toggleCompareMenu(wrapper, canonicalId) {
    const lineDiv = wrapper.querySelector(".line");

    const existingMenu = wrapper.querySelector(".compare-menu");
    if (existingMenu) {
        existingMenu.remove();
        lineDiv.classList.remove("selected");
        return;
    }

    document.querySelectorAll(".compare-menu").forEach(menu => {
        const otherWrapper = menu.closest(".line-block");
        if (otherWrapper) {
            const otherLine = otherWrapper.querySelector(".line");
            if (otherLine) otherLine.classList.remove("selected");
        }
        menu.remove();
    });

    lineDiv.classList.add("selected");

    const menu = document.createElement("div");
    menu.className = "compare-menu";

    const allBtn = document.createElement("button");
    allBtn.textContent = "Compare to All";
    allBtn.className = "action-button";
    allBtn.onclick = () => {
        showComparison(wrapper, canonicalId, "all");
    };

    // Scrollable list of checkboxes, one per witness
    const checkboxContainer = document.createElement("div");
    checkboxContainer.className = "witness-checkboxes";

    ALL_WITNESSES
        .filter(w => w !== BASE_WITNESS)
        .forEach(w => {
            const label = document.createElement("label");
            label.className = "witness-checkbox-label";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = w;

            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(" " + w));
            checkboxContainer.appendChild(label);
        });

    const compareSelectedBtn = document.createElement("button");
    compareSelectedBtn.textContent = "Compare Selected";
    compareSelectedBtn.className = "action-button";
    compareSelectedBtn.onclick = () => {
        const checked = checkboxContainer.querySelectorAll("input:checked");
        const chosenWitnesses = Array.from(checked).map(cb => cb.value);

        if (chosenWitnesses.length === 0) {
            alert("Please select at least one version.");
            return;
        }

        showComparison(wrapper, canonicalId, "selected", chosenWitnesses);
    };

   menu.appendChild(allBtn);
    menu.appendChild(checkboxContainer);
    menu.appendChild(compareSelectedBtn);

    wrapper.insertBefore(menu, lineDiv);
}


// ====== SHOW COMPARISON ======
function showComparison(wrapper, canonicalId, mode, chosenWitness) {
    const existingOuter = wrapper.querySelector(".comparison-outer");
    if (existingOuter) {
        existingOuter.remove();
    }

    let variants = alignment[canonicalId];

    // Find alignment group if selected witness is not canonical
    if (!variants) {
        for (const key in alignment) {
            if (alignment[key].includes(canonicalId)) {
                variants = alignment[key];
                break;
            }
        }
    }

    if (!variants) return;

    const resultBox = document.createElement("div");
    resultBox.className = "comparison-result";

    const lineNumber = canonicalId.match(/-L(\d+)/)?.[1] || "";

    const title = document.createElement("h3");
    title.className = "comparison-heading";
    title.textContent = witnessLabel(BASE_WITNESS) + ", Line " + lineNumber;
    // Note: title is NOT added to resultBox anymore — it goes above it instead (see below)

    if (mode === "selected") {
        const baseRef = variants.find(v => v.includes(BASE_WITNESS + "-"));

        // Base witness column (always shown first)
        const baseCol = document.createElement("div");
        baseCol.className = "variant-column";
        baseCol.innerHTML = `
            <div class="variant-label">${witnessLabel(BASE_WITNESS)} (Line ${getLineNumberFromRef(baseRef)})</div>
            <div class="variant-text">${getLineText(baseRef)}</div>
        `;
        resultBox.appendChild(baseCol);

chosenWitness.forEach(w => {
            const refs = getRefsForWitness(variants, w);
            const col = document.createElement("div");
            col.className = "variant-column";

            if (refs.length > 0) {
                col.innerHTML = `
                    <div class="variant-label">${buildVariantLabel(w, refs, lineNumber)}</div>
                    <div class="variant-text">${getCombinedLineText(refs)}</div>
                `;
            } else {
                col.innerHTML = `
                    <div class="variant-label">${witnessLabel(w)}</div>
                    <div class="variant-text" style="font-style:italic; color:#888;">No corresponding line</div>
                `;
            }
            resultBox.appendChild(col);
        });

    } else {
   
      ALL_WITNESSES.forEach(witnessId => {
            const refs = getRefsForWitness(variants, witnessId);

            const col = document.createElement("div");
            col.className = "variant-column";

            if (refs.length > 0) {
                col.innerHTML = `
                    <div class="variant-label">${buildVariantLabel(witnessId, refs, lineNumber)}</div>
                    <div class="variant-text">${getCombinedLineText(refs)}</div>
                `;
            } else {
                col.innerHTML = `
                    <div class="variant-label">${witnessLabel(witnessId)}</div>
                    <div class="variant-text" style="font-style:italic; color:#888;">No corresponding line</div>
                `;
            }

            resultBox.appendChild(col);
        });

    const backBtn = document.createElement("button");
    backBtn.textContent = "Go Back";
    backBtn.className = "back-button";
    backBtn.onclick = () => {
        outerWrapper.remove();
        const menu = wrapper.querySelector(".compare-menu");
        if (menu) menu.remove();

        const lineDiv = wrapper.querySelector(".line");
        if (lineDiv) lineDiv.classList.remove("selected");
    };

    // Wrap the title, the scrollable boxes, and the back button together.
    // The title sits above the scrolling row, not inside it.
    const outerWrapper = document.createElement("div");
    outerWrapper.className = "comparison-outer";
    outerWrapper.appendChild(title);
    outerWrapper.appendChild(resultBox);
    outerWrapper.appendChild(backBtn);

    wrapper.appendChild(outerWrapper);
}


// ====== START ======
loadTEI();
