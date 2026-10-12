let allSeeds = [];
let selectedMonth = new Date().getMonth();

const monthNames = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const monthMap = {
  jan:0,
  feb:1,
  mar:2,
  apr:3,
  may:4,
  jun:5,
  jul:6,
  aug:7,
  sep:8,
  sept:8,
  oct:9,
  nov:10,
  dec:11
};

function parseCSV(text) {
  const rows = [];
  let row = [];
  let value = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && insideQuotes && next === '"') {
      value += '"';
      i++;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === ',' && !insideQuotes) {
      row.push(value);
      value = "";
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (char === '\r' && next === '\n') i++;

      row.push(value);

      if (row.some(cell => cell.trim() !== "")) {
        rows.push(row);
      }

      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }

  const headers = rows[0].map(h => h.trim());

  return rows.slice(1).map(values => {
    const object = {};

    headers.forEach((header, index) => {
      object[header] = values[index] ? values[index].trim() : "";
    });

    return object;
  });
}

function clean(value) {
  if (!value) return "";

  const badValues = [
    "not recorded",
    "not uploaded",
    "unspecified",
    "unknown",
    "n/a",
    "not applicable",
    "not usually needed"
  ];

  if (badValues.includes(value.toLowerCase())) {
    return "";
  }

  return value;
}

async function loadSeeds() {
  try {
    const response = await fetch("Seed_inventory_enriched.csv");

    if (!response.ok) {
      throw new Error("Could not find seed inventory.");
    }

    const text = await response.text();

    allSeeds = parseCSV(text);

    allSeeds.sort((a, b) =>
      (a.Item || "").localeCompare(b.Item || "")
    );

    displaySeeds(allSeeds);
    renderMonthButtons();
    displaySowMonth();
    displayGrowing();
  } catch (error) {
    document.getElementById("seedList").innerHTML =
      "<div class='card'><strong>Something went wrong loading the seed inventory.</strong><br><br>" +
      error.message +
      "</div>";
  }
}

/*
  Images now live in the main Seed-App folder.
  Whatever filename is in the Picture column is used directly.
*/
function getImage(seed) {
  const image = clean(seed["Picture"]);

  if (!image) return "";

  return image;
}

function seedKey(seed) {
  return [
    seed["Item"] || "",
    seed["Variety"] || "",
    seed["Brand"] || ""
  ].join("|");
}

function toggleDetails(id) {
  const el = document.getElementById(id);

  if (!el) return;

  el.style.display =
    el.style.display === "block" ? "none" : "block";
}

function seedCard(seed, mode = "") {
  const item = clean(seed["Item"]);
  const variety = clean(seed["Variety"]);
  const type = clean(seed["Type"]);
  const seedBulb = clean(seed["Seed / Bulb"]);
  const count = clean(seed["Seed Count"]);
  const brand = clean(seed["Brand"]);
  const indoor = clean(seed["Sow Indoor"]);
  const outdoor = clean(seed["Sow/Plant Outdoor"]);
  const harvest = clean(seed["Harvest"]);
  const sun = clean(seed["Sun/Shade"]);
  const perennial = clean(seed["Perenial"]);
  const profile = clean(seed["Profile/Specs"]);
  const instructions = clean(seed["Sowing Instructions"]);
  const image = getImage(seed);

  const id = "details-" + Math.random().toString(36).slice(2);

  let sowInfo = "";

  if (mode === "indoor" && indoor) {
    sowInfo = `<p class="detail"><span class="label">🏠 Indoor window:</span> ${indoor}</p>`;
  }

  if ((mode === "outdoor" || mode === "bulb") && outdoor) {
    sowInfo = `<p class="detail"><span class="label">🌱 Outdoor window:</span> ${outdoor}</p>`;
  }

  return `
    <div class="seed-card">

      ${
        image
          ? `<img
              class="seed-image"
              src="${image}"
              alt="${item} ${variety}"
              onerror="this.style.display='none'"
            >`
          : ""
      }

      <h3>${item || "Unnamed Seed"}</h3>

      ${variety ? `<div class="variety">${variety}</div>` : ""}

      <div>
        ${type ? `<span class="tag">${type}</span>` : ""}
        ${seedBulb ? `<span class="tag">${seedBulb}</span>` : ""}
        ${perennial ? `<span class="tag">${perennial}</span>` : ""}
      </div>

      ${sowInfo}

      <div class="card-actions">

        <button
          class="secondary-button"
          onclick="toggleDetails('${id}')"
        >
          View Details
        </button>

        <button
          onclick='openSowForm(${JSON.stringify(seedKey(seed))})'
        >
          Mark as Sown
        </button>

      </div>

      <div class="details" id="${id}">

        ${
          brand
            ? `<p class="detail"><span class="label">Brand:</span> ${brand}</p>`
            : ""
        }

        ${
          count
            ? `<p class="detail"><span class="label">Pack / seed count:</span> ${count}</p>`
            : ""
        }

        ${
          indoor
            ? `<p class="detail"><span class="label">🏠 Sow indoors:</span> ${indoor}</p>`
            : ""
        }

        ${
          outdoor
            ? `<p class="detail"><span class="label">🌱 Sow / plant outside:</span> ${outdoor}</p>`
            : ""
        }

        ${
          harvest
            ? `<p class="detail"><span class="label">🧺 Harvest / flowers:</span> ${harvest}</p>`
            : ""
        }

        ${
          sun
            ? `<p class="detail"><span class="label">☀️ Light:</span> ${sun}</p>`
            : ""
        }

        ${
          profile
            ? `<p class="detail"><span class="label">About:</span> ${profile}</p>`
            : ""
        }

        ${
          instructions
            ? `<p class="detail"><span class="label">Sowing:</span> ${instructions}</p>`
            : ""
        }

      </div>

    </div>
  `;
}

function displaySeeds(seeds) {
  const list = document.getElementById("seedList");

  document.getElementById("seedCount").textContent =
    seeds.length + " varieties shown";

  if (seeds.length === 0) {
    list.innerHTML =
      "<div class='card'>No seeds match your search.</div>";
    return;
  }

  list.innerHTML = seeds.map(seed => seedCard(seed)).join("");
}

function filterSeeds() {
  const search =
    document.getElementById("search").value.toLowerCase();

  const filtered = allSeeds.filter(seed => {
    return Object.values(seed)
      .join(" ")
      .toLowerCase()
      .includes(search);
  });

  displaySeeds(filtered);
}

function textIncludesMonth(text, targetMonth) {
  if (!text) return false;

  const lower = text.toLowerCase();

  if (
    lower.includes("not applicable") ||
    lower.includes("not usually needed")
  ) {
    return false;
  }

  const sections = lower.split("/");

  for (const section of sections) {
    const found = [];

    const regex =
      /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\b/g;

    let match;

    while ((match = regex.exec(section)) !== null) {
      found.push(monthMap[match[1]]);
    }

    if (found.length === 1 && found[0] === targetMonth) {
      return true;
    }

    if (found.length >= 2) {
      const start = found[0];
      const end = found[1];

      if (start <= end) {
        if (targetMonth >= start && targetMonth <= end) {
          return true;
        }
      } else {
        if (targetMonth >= start || targetMonth <= end) {
          return true;
        }
      }
    }
  }

  return false;
}

function getMonthSeeds(month) {
  const indoor = [];
  const outdoor = [];
  const bulbs = [];

  allSeeds.forEach(seed => {
    const isBulb =
      (seed["Seed / Bulb"] || "").toLowerCase() === "bulb";

    if (
      textIncludesMonth(seed["Sow Indoor"], month) &&
      !isBulb
    ) {
      indoor.push(seed);
    }

    if (
      textIncludesMonth(seed["Sow/Plant Outdoor"], month)
    ) {
      if (isBulb) {
        bulbs.push(seed);
      } else {
        outdoor.push(seed);
      }
    }
  });

  return { indoor, outdoor, bulbs };
}

function renderMonthButtons() {
  const container = document.getElementById("monthSelector");

  container.innerHTML = monthNames.map((month, index) => `
    <button
      class="${index === selectedMonth ? "active" : ""}"
      onclick="selectMonth(${index})"
    >
      ${month.slice(0,3)}
    </button>
  `).join("");
}

function selectMonth(index) {
  selectedMonth = index;
  renderMonthButtons();
  displaySowMonth();
}

function displaySowMonth() {
  const result = getMonthSeeds(selectedMonth);

  document.getElementById("monthTitle").textContent =
    "📅 " + monthNames[selectedMonth];

  const unique = new Set();

  [...result.indoor, ...result.outdoor, ...result.bulbs]
    .forEach(seed => {
      unique.add(seedKey(seed));
    });

  document.getElementById("monthCount").textContent =
    unique.size +
    " varieties from your inventory can be sown or planted this month.";

  document.getElementById("indoorList").innerHTML =
    result.indoor.length
      ? result.indoor.map(seed => seedCard(seed, "indoor")).join("")
      : "<div class='empty'>Nothing in your collection is listed for indoor sowing this month.</div>";

  document.getElementById("outdoorList").innerHTML =
    result.outdoor.length
      ? result.outdoor.map(seed => seedCard(seed, "outdoor")).join("")
      : "<div class='empty'>Nothing in your collection is listed for outdoor sowing this month.</div>";

  document.getElementById("bulbList").innerHTML =
    result.bulbs.length
      ? result.bulbs.map(seed => seedCard(seed, "bulb")).join("")
      : "<div class='empty'>No bulbs in your collection are listed for planting this month.</div>";
}

function getGrowingRecords() {
  return JSON.parse(
    localStorage.getItem("growingRecords") || "[]"
  );
}

function saveGrowingRecords(records) {
  localStorage.setItem(
    "growingRecords",
    JSON.stringify(records)
  );
}

function openSowForm(key) {
  const seed = allSeeds.find(s => seedKey(s) === key);

  if (!seed) return;

  document.getElementById("sowSeedKey").value = key;

  document.getElementById("sowSeedName").textContent =
    (seed.Item || "") +
    (seed.Variety ? " — " + seed.Variety : "");

  document.getElementById("sowDate").value =
    new Date().toISOString().slice(0,10);

  document.getElementById("sowQuantity").value = "";
  document.getElementById("sowLocation").value = "";
  document.getElementById("sowNotes").value = "";

  document.getElementById("sowModal").style.display =
    "block";
}

function closeSowForm() {
  document.getElementById("sowModal").style.display =
    "none";
}

function saveSowing() {
  const key =
    document.getElementById("sowSeedKey").value;

  const seed =
    allSeeds.find(s => seedKey(s) === key);

  if (!seed) return;

  const record = {
    id: Date.now(),
    seedKey: key,
    item: seed.Item || "",
    variety: seed.Variety || "",
    dateSown:
      document.getElementById("sowDate").value,
    quantity:
      document.getElementById("sowQuantity").value,
    location:
      document.getElementById("sowLocation").value,
    notes:
      document.getElementById("sowNotes").value,
    status: "Sown"
  };

  const records = getGrowingRecords();

  records.push(record);

  saveGrowingRecords(records);

  closeSowForm();

  displayGrowing();

  alert("Added to Growing Now");
}

function updateStatus(id, newStatus) {
  const records = getGrowingRecords();

  const updated = records.map(record => {
    if (record.id === id) {
      return {
        ...record,
        status: newStatus
      };
    }

    return record;
  });

  saveGrowingRecords(updated);

  displayGrowing();
}

function deleteGrowingRecord(id) {
  const records =
    getGrowingRecords().filter(
      record => record.id !== id
    );

  saveGrowingRecords(records);

  displayGrowing();
}

function displayGrowing() {
  const container =
    document.getElementById("growingList");

  const records = getGrowingRecords();

  if (!container) return;

  if (records.length === 0) {
    container.innerHTML =
      "<div class='empty'>Nothing is currently being tracked.</div>";

    return;
  }

  container.innerHTML =
    records.map(record => `
      <div class="seed-card">

        <h3>${record.item}</h3>

        ${
          record.variety
            ? `<div class="variety">${record.variety}</div>`
            : ""
        }

        <p class="detail">
          <span class="label">Date sown:</span>
          ${record.dateSown || "Not recorded"}
        </p>

        ${
          record.quantity
            ? `<p class="detail"><span class="label">Quantity:</span> ${record.quantity}</p>`
            : ""
        }

        ${
          record.location
            ? `<p class="detail"><span class="label">Location:</span> ${record.location}</p>`
            : ""
        }

        ${
          record.notes
            ? `<p class="detail"><span class="label">Notes:</span> ${record.notes}</p>`
            : ""
        }

        <p class="growing-status">
          Status: ${record.status}
        </p>

        <select
          class="form-select"
          onchange="updateStatus(${record.id}, this.value)"
        >

          ${[
            "Sown",
            "Germinated",
            "Seedling",
            "Potted On",
            "Planted Out",
            "Harvesting",
            "Finished"
          ].map(status => `
            <option
              value="${status}"
              ${status === record.status ? "selected" : ""}
            >
              ${status}
            </option>
          `).join("")}

        </select>

        <button
          class="secondary-button"
          onclick="deleteGrowingRecord(${record.id})"
        >
          Remove Record
        </button>

      </div>
    `).join("");
}

function exportGrowingData() {
  const records = getGrowingRecords();

  const blob =
    new Blob(
      [JSON.stringify(records, null, 2)],
      { type: "application/json" }
    );

  const url =
    URL.createObjectURL(blob);

  const a =
    document.createElement("a");

  a.href = url;

  a.download =
    "seed-growing-backup.json";

  a.click();

  URL.revokeObjectURL(url);
}

function showSeeds() {
  document.getElementById("homePage").style.display =
    "none";

  document.getElementById("sowPage").style.display =
    "none";

  document.getElementById("growingPage").style.display =
    "none";

  document.getElementById("seedPage").style.display =
    "block";

  window.scrollTo(0, 0);
}

function showSowPage() {
  displaySowMonth();

  document.getElementById("homePage").style.display =
    "none";

  document.getElementById("seedPage").style.display =
    "none";

  document.getElementById("growingPage").style.display =
    "none";

  document.getElementById("sowPage").style.display =
    "block";

  window.scrollTo(0, 0);
}

function showGrowing() {
  displayGrowing();

  document.getElementById("homePage").style.display =
    "none";

  document.getElementById("seedPage").style.display =
    "none";

  document.getElementById("sowPage").style.display =
    "none";

  document.getElementById("growingPage").style.display =
    "block";

  window.scrollTo(0, 0);
}

function showHome() {
  document.getElementById("seedPage").style.display =
    "none";

  document.getElementById("sowPage").style.display =
    "none";

  document.getElementById("growingPage").style.display =
    "none";

  document.getElementById("homePage").style.display =
    "block";

  window.scrollTo(0, 0);
}

loadSeeds();
