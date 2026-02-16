const SHEET_URLS = {
  pts: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSvpAu03MGDKwS7JrZuuKK04Bg98MYgZp4OQDHl3K-IpD7K5LrxgXuBfy2SQe9aXkS3n2gp9kW322KZ/pub?gid=0&single=true&output=csv",
  zips: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSvpAu03MGDKwS7JrZuuKK04Bg98MYgZp4OQDHl3K-IpD7K5LrxgXuBfy2SQe9aXkS3n2gp9kW322KZ/pub?gid=809966184&single=true&output=csv",
  insurance: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSvpAu03MGDKwS7JrZuuKK04Bg98MYgZp4OQDHl3K-IpD7K5LrxgXuBfy2SQe9aXkS3n2gp9kW322KZ/pub?gid=982993273&single=true&output=csv",
  availability: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSvpAu03MGDKwS7JrZuuKK04Bg98MYgZp4OQDHl3K-IpD7K5LrxgXuBfy2SQe9aXkS3n2gp9kW322KZ/pub?gid=525964875&single=true&output=csv",
  unavailability: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSvpAu03MGDKwS7JrZuuKK04Bg98MYgZp4OQDHl3K-IpD7K5LrxgXuBfy2SQe9aXkS3n2gp9kW322KZ/pub?gid=462324149&single=true&output=csv",
  bookings: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSvpAu03MGDKwS7JrZuuKK04Bg98MYgZp4OQDHl3K-IpD7K5LrxgXuBfy2SQe9aXkS3n2gp9kW322KZ/pub?gid=607312598&single=true&output=csv",
};

const FIELD_ALIASES = {
  ptId: ["pt_id", "pt id", "id"],
  ptName: ["pt_name", "pt name", "name"],
  role: ["role", "title"],
  phone: ["phone", "phone number"],
  email: ["email"],
  active: ["active", "is active"],
  notes: ["notes", "note"],
  ptRate: ["pt_rate", "pt rate", "rate"],
  maxWeeklyVisits: ["max_weekly_visits", "max weekly visits", "weekly capacity"],
  zip: ["zip_code", "zip", "postal code"],
  zipDay: ["day_of_week", "day", "weekday", "coverage_day"],
  zipArea: ["area", "zone", "territory"],
  insurance: ["insurance_name", "insurance", "payer"],
  insuranceRate: ["insurance_rate", "insurance rate", "rate"],
  dayOfWeek: ["day_of_week", "day", "weekday"],
  startTime: ["start_time", "start"],
  endTime: ["end_time", "end"],
  visitType: ["visit_type", "visit type", "appointment type", "type"],
  bookingDate: ["visit_date", "visit date", "date"],
  bookingTime: ["visit_time", "visit time", "time"],
  bookingStatus: ["status", "visit status", "booking status"],
  bookingArea: ["area", "visit_area", "booking_area", "region", "borough"],
  unavailStartDate: ["start_date", "start date", "from", "begin date"],
  unavailEndDate: ["end_date", "end date", "to", "until"],
  unavailStartTime: ["start_time", "start time", "from time"],
  unavailEndTime: ["end_time", "end time", "to time"],
  unavailReason: ["reason", "notes", "note", "comment"],
  timezone: ["timezone", "tz"],
  effectiveFrom: ["effective_from", "effective start", "start date"],
  effectiveTo: ["effective_to", "effective end", "end date"],
};

const DAY_MAP = {
  mon: "Mon",
  monday: "Mon",
  tue: "Tue",
  tues: "Tue",
  tuesday: "Tue",
  wed: "Wed",
  weds: "Wed",
  wednesday: "Wed",
  thu: "Thu",
  thur: "Thu",
  thurs: "Thu",
  thursday: "Thu",
  fri: "Fri",
  friday: "Fri",
  sat: "Sat",
  saturday: "Sat",
  sun: "Sun",
  sunday: "Sun",
};

const DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_LABELS = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};
const TRAVEL_BUFFER_MINUTES = 60;

const CORS_PROXIES = ["https://corsproxy.io/?", "https://cors.isomorphic-git.org/"];
const SHOULD_PREFER_PROXY =
  typeof window !== "undefined" && window.location?.protocol === "file:";

const state = {
  pts: [],
  insuranceOptions: [],
  zipAreas: new Map(),
  lastUpdated: null,
  renderMetaById: new Map(),
  renderMode: "exact",
  filters: {
    zip: "",
    insuranceQuery: "",
    visitType: "",
    nextAvailableDays: null,
    days: [],
    time: "",
  },
};

const elements = {
  status: document.getElementById("dataStatus"),
  meta: document.getElementById("dataMeta"),
  results: document.getElementById("results"),
  resultsCount: document.getElementById("resultsCount"),
  resultsSubtext: document.getElementById("resultsSubtext"),
  emptyState: document.getElementById("emptyState"),
  form: document.getElementById("searchForm"),
  zipInput: document.getElementById("zipInput"),
  zipAreaBox: document.getElementById("zipAreaBox"),
  insuranceInput: document.getElementById("insuranceInput"),
  insuranceOptions: document.getElementById("insuranceOptions"),
  visitTypeSelect: document.getElementById("visitTypeSelect"),
  dayOptions: document.getElementById("dayOptions"),
  timeInput: document.getElementById("timeInput"),
  nextAvailableSelect: document.getElementById("nextAvailableSelect"),
  resetButton: document.getElementById("resetButton"),
};

async function bootstrap() {
  attachHandlers();
  await loadAllData();
}

function attachHandlers() {
  elements.form?.addEventListener("submit", (event) => {
    event.preventDefault();
    updateFiltersFromForm();
    renderResults();
  });

  const inputs = [
    elements.zipInput,
    elements.insuranceInput,
    elements.visitTypeSelect,
    elements.timeInput,
    elements.nextAvailableSelect,
  ];

  inputs.forEach((input) => {
    input?.addEventListener("input", () => {
      updateFiltersFromForm();
      renderResults();
    });
  });

  elements.dayOptions?.addEventListener("change", () => {
    updateFiltersFromForm();
    renderResults();
  });

  elements.results?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-copy]");
    if (!button) return;
    const ptId = button.dataset.copy;
    if (!ptId) return;
    const pt = state.pts.find((item) => item.id === ptId);
    if (!pt) return;
    const meta = state.renderMetaById.get(ptId);
    const summary = buildCopySummary(pt, meta);
    copyToClipboard(summary, button);
  });

  elements.resetButton?.addEventListener("click", () => {
    elements.form?.reset();
    state.filters = {
      zip: "",
      insuranceQuery: "",
      visitType: "",
      nextAvailableDays: null,
      days: [],
      time: "",
    };
    if (elements.nextAvailableSelect) {
      elements.nextAvailableSelect.value = "";
    }
    if (elements.visitTypeSelect) {
      elements.visitTypeSelect.value = "";
    }
    if (elements.insuranceInput) {
      elements.insuranceInput.value = "";
    }
    if (elements.dayOptions) {
      const inputs = elements.dayOptions.querySelectorAll("input[name=\"day\"]");
      inputs.forEach((input) => {
        input.checked = false;
      });
    }
    renderResults();
  });
}

async function loadAllData() {
  setStatus("Loading sheet data...");
  try {
    const [
      ptsText,
      zipsText,
      insuranceText,
      availabilityText,
      unavailabilityText,
      bookingsText,
    ] =
      await Promise.all([
        fetchCsv(SHEET_URLS.pts),
        fetchCsv(SHEET_URLS.zips),
        fetchCsv(SHEET_URLS.insurance),
        fetchCsv(SHEET_URLS.availability),
        fetchCsvOptional(SHEET_URLS.unavailability),
        fetchCsvOptional(SHEET_URLS.bookings),
      ]);

    const ptsRows = parseCsv(ptsText);
    const zipRows = parseCsv(zipsText);
    const insuranceRows = parseCsv(insuranceText);
    const availabilityRows = parseCsv(availabilityText);
    const unavailabilityRows = parseCsv(unavailabilityText);
    const bookingRows = parseCsv(bookingsText);

    state.pts = buildPts(
      ptsRows,
      zipRows,
      insuranceRows,
      availabilityRows,
      unavailabilityRows,
      bookingRows
    );
    state.insuranceOptions = buildInsuranceOptions(state.pts);
    state.zipAreas = buildZipAreas(zipRows);
    state.lastUpdated = new Date();

    populateInsuranceDatalist();
    updateZipAreaDisplay();
    updateMeta();
    setStatus(`Loaded ${state.pts.length} PTs`);
    renderResults();
  } catch (error) {
    console.error(error);
    setStatus("Unable to load data from the sheet.");
    if (elements.meta) {
      elements.meta.textContent = "Check that all sheets are published to the web.";
    }
  }
}

async function fetchCsv(url) {
  const attempt = async (targetUrl) => {
    const response = await fetch(targetUrl, {
      cache: "no-store",
      credentials: "omit",
      mode: "cors",
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch ${targetUrl}: ${response.status}`);
    }
    return response.text();
  };

  const attemptViaProxies = async () => {
    let lastError;
    for (const proxy of CORS_PROXIES) {
      if (!proxy) continue;
      try {
        return await attempt(`${proxy}${url}`);
      } catch (error) {
        lastError = error;
      }
    }
    if (lastError) throw lastError;
    throw new Error("No CORS proxy available.");
  };

  if (SHOULD_PREFER_PROXY) {
    try {
      return await attemptViaProxies();
    } catch (proxyError) {
      return attempt(url);
    }
  }

  try {
    return await attempt(url);
  } catch (error) {
    if (!shouldRetryWithProxy(error)) {
      throw error;
    }
    return attemptViaProxies();
  }
}

async function fetchCsvOptional(url) {
  if (!url) return "";
  try {
    return await fetchCsv(url);
  } catch (error) {
    console.warn("Optional sheet failed to load.", error);
    return "";
  }
}

function shouldRetryWithProxy(error) {
  const message = String(error?.message || "").toLowerCase();
  return (
    error instanceof TypeError ||
    message.includes("failed to fetch") ||
    message.includes("cors") ||
    message.includes("network")
  );
}

function parseCsv(text) {
  if (!text || !text.trim()) return [];
  const parsed = Papa.parse(text, {
    header: true,
    skipEmptyLines: "greedy",
    dynamicTyping: false,
    transformHeader: (header) => header.trim(),
    transform: (value) => (typeof value === "string" ? value.trim() : value),
  });
  return parsed.data || [];
}

function buildPts(
  ptsRows,
  zipRows,
  insuranceRows,
  availabilityRows,
  unavailabilityRows,
  bookingRows
) {
  const ptsById = new Map();
  const pts = [];

  ptsRows.forEach((row) => {
    const id = normalizeId(getField(row, "ptId"));
    if (!id) return;
    const pt = {
      id,
      name: getField(row, "ptName") || id,
      role: getField(row, "role"),
      phone: getField(row, "phone"),
      email: getField(row, "email"),
      notes: getField(row, "notes"),
      active: parseBoolean(getField(row, "active"), true),
      ptRate: parseNumber(getField(row, "ptRate")),
      maxWeeklyVisits: parseNumber(getField(row, "maxWeeklyVisits")),
      zips: new Set(),
      zipsAnyDay: new Set(),
      zipsByDay: new Map(),
      insurances: [],
      availability: [],
      unavailability: [],
      bookingBlocks: [],
      bookings: [],
      weeklyBooked: 0,
      maxInsuranceRate: null,
    };
    ptsById.set(id, pt);
    pts.push(pt);
  });

  zipRows.forEach((row) => {
    const id = normalizeId(getField(row, "ptId"));
    const zip = normalizeZip(getField(row, "zip"));
    if (!id || !zip) return;
    const pt = ptsById.get(id);
    if (pt) {
      const day = normalizeDay(getField(row, "zipDay"));
      pt.zips.add(zip);
      if (day) {
        const daySet = pt.zipsByDay.get(day) || new Set();
        daySet.add(zip);
        pt.zipsByDay.set(day, daySet);
      } else {
        pt.zipsAnyDay.add(zip);
      }
    }
  });

  insuranceRows.forEach((row) => {
    const id = normalizeId(getField(row, "ptId"));
    const name = getField(row, "insurance");
    if (!id || !name) return;
    const pt = ptsById.get(id);
    if (!pt) return;
    pt.insurances.push({
      name,
      rate: parseNumber(getField(row, "insuranceRate")),
    });
  });

  availabilityRows.forEach((row) => {
    const id = normalizeId(getField(row, "ptId"));
    const pt = ptsById.get(id);
    if (!pt) return;
    const day = normalizeDay(getField(row, "dayOfWeek"));
    const startRaw = getField(row, "startTime");
    const endRaw = getField(row, "endTime");
    const startMinutes = parseTimeToMinutes(startRaw);
    const endMinutes = parseTimeToMinutes(endRaw);

    if (!day || startMinutes === null || endMinutes === null) return;

    pt.availability.push({
      day,
      startMinutes,
      endMinutes,
      startTime: minutesToTime(startMinutes),
      endTime: minutesToTime(endMinutes),
      visitType: normalizeVisitType(getField(row, "visitType")),
      timezone: getField(row, "timezone") || "",
      effectiveFrom: getField(row, "effectiveFrom") || "",
      effectiveTo: getField(row, "effectiveTo") || "",
    });
  });

  (unavailabilityRows || []).forEach((row) => {
    const id = normalizeId(getField(row, "ptId"));
    const pt = ptsById.get(id);
    if (!pt) return;
    const startDate = parseDateOnly(getField(row, "unavailStartDate"));
    if (!startDate) return;
    const endDateRaw = parseDateOnly(getField(row, "unavailEndDate"));
    const endDate = endDateRaw || startDate;
    let startMinutes = parseTimeToMinutes(getField(row, "unavailStartTime"));
    let endMinutes = parseTimeToMinutes(getField(row, "unavailEndTime"));
    if (startMinutes !== null && endMinutes !== null && endMinutes < startMinutes) {
      const temp = startMinutes;
      startMinutes = endMinutes;
      endMinutes = temp;
    }

    pt.unavailability.push({
      startDate,
      endDate,
      startMinutes,
      endMinutes,
      reason: getField(row, "unavailReason") || "",
    });
  });

  const weekBounds = getWeekBounds(new Date());

  (bookingRows || []).forEach((row) => {
    const id = normalizeId(getField(row, "ptId"));
    const pt = ptsById.get(id);
    if (!pt) return;
    const visitDate = parseDateOnly(getField(row, "bookingDate"));
    if (!visitDate) return;
    const status = normalizeText(getField(row, "bookingStatus"));
    if (!isCountedBookingStatus(status)) return;

    const timeMinutes = parseTimeToMinutes(getField(row, "bookingTime"));
    const area = String(getField(row, "bookingArea") || "").trim();
    const dayCode = getDayCode(visitDate);
    pt.bookingBlocks.push({
      startDate: visitDate,
      endDate: visitDate,
      startMinutes: timeMinutes,
      endMinutes: timeMinutes,
      reason: status || "booked",
      area,
    });
    pt.bookings.push({
      date: visitDate,
      day: dayCode,
      timeMinutes,
      area,
      status,
    });

    if (visitDate >= weekBounds.start && visitDate < weekBounds.end) {
      pt.weeklyBooked += 1;
    }
  });

  pts.forEach((pt) => {
    pt.maxInsuranceRate = getMaxInsuranceRate(pt);
  });

  return pts;
}

function buildInsuranceOptions(pts) {
  const options = new Set();
  pts.forEach((pt) => {
    pt.insurances.forEach((insurance) => {
      if (insurance.name) {
        options.add(insurance.name);
      }
    });
  });
  return Array.from(options).sort((a, b) => a.localeCompare(b));
}

function buildZipAreas(zipRows) {
  const map = new Map();
  zipRows.forEach((row) => {
    const zip = normalizeZip(getField(row, "zip"));
    if (!zip) return;
    const area = String(getField(row, "zipArea") || "").trim();
    if (!area) return;
    if (!map.has(zip)) {
      map.set(zip, new Set());
    }
    map.get(zip).add(area);
  });
  return map;
}

function populateInsuranceDatalist() {
  if (!elements.insuranceOptions) return;
  const optionsHtml = state.insuranceOptions
    .map((name) => `<option value="${escapeHtml(name)}"></option>`)
    .join("");
  elements.insuranceOptions.innerHTML = optionsHtml;
}

function updateZipAreaDisplay() {
  if (!elements.zipAreaBox) return;
  const zip = normalizeZip(elements.zipInput?.value || "");
  if (!zip) {
    elements.zipAreaBox.textContent = "—";
    return;
  }
  const areas = state.zipAreas.get(zip);
  if (!areas || !areas.size) {
    elements.zipAreaBox.textContent = "Area not found";
    return;
  }
  elements.zipAreaBox.textContent = Array.from(areas).sort().join(", ");
}

function updateMeta() {
  if (!elements.meta) return;
  const timestamp = state.lastUpdated
    ? state.lastUpdated.toLocaleString()
    : "";
  elements.meta.textContent = `Last updated ${timestamp}. ${state.pts.length} PTs loaded.`;
}

function setStatus(message) {
  if (elements.status) {
    elements.status.textContent = message;
  }
}

function updateFiltersFromForm() {
  state.filters = {
    zip: normalizeZip(elements.zipInput?.value || ""),
    insuranceQuery: (elements.insuranceInput?.value || "").trim(),
    visitType: normalizeVisitType(elements.visitTypeSelect?.value || ""),
    nextAvailableDays: parseMaxDays(elements.nextAvailableSelect?.value),
    days: getSelectedDays(),
    time: elements.timeInput?.value || "",
  };
  updateZipAreaDisplay();
}

function renderResults() {
  const exactResults = filterPts(state.pts, state.filters);
  let results = exactResults;
  let metaById = new Map();
  let mode = "exact";
  let suggestionSummary = "";

  if (!exactResults.length && state.filters.days.length === 1) {
    const suggestion = findNearestMatches(state.pts, state.filters);
    if (suggestion.matches.length) {
      results = suggestion.matches;
      metaById = suggestion.metaById;
      mode = "suggested";
      suggestionSummary = suggestion.summary;
    }
  }

  if (elements.resultsCount) {
    const label = mode === "suggested" ? "suggested" : "match";
    elements.resultsCount.textContent = `${results.length} ${label}${
      results.length === 1 ? "" : "es"
    }`;
  }

  state.renderMetaById = metaById;
  state.renderMode = mode;

  if (elements.resultsSubtext) {
    if (mode === "suggested" && suggestionSummary) {
      elements.resultsSubtext.textContent = suggestionSummary;
    } else if (state.filters.days.length) {
      elements.resultsSubtext.textContent =
        "Showing PTs who match zip, insurance, and requested timing.";
    } else {
      elements.resultsSubtext.textContent =
        "Showing PTs who match zip, insurance, and requested timing.";
    }
  }

  if (elements.results) {
    const ranked = results
      .map((pt) => {
        const meta = metaById.get(pt.id);
        const score = computeMatchScore(pt, state.filters, meta, mode);
        const profit = getProfitEstimate(pt);
        return { pt, meta, score, profit };
      })
      .sort((a, b) => {
        if (state.filters.zip) {
          const profitA = Number.isFinite(a.profit) ? a.profit : -Infinity;
          const profitB = Number.isFinite(b.profit) ? b.profit : -Infinity;
          if (profitB !== profitA) return profitB - profitA;
          const rateA = Number.isFinite(a.pt.ptRate) ? a.pt.ptRate : Infinity;
          const rateB = Number.isFinite(b.pt.ptRate) ? b.pt.ptRate : Infinity;
          if (rateA !== rateB) return rateA - rateB;
        }
        if (b.score !== a.score) return b.score - a.score;
        const offsetA = a.meta?.offset ?? 0;
        const offsetB = b.meta?.offset ?? 0;
        if (offsetA !== offsetB) return offsetA - offsetB;
        const nameA = String(a.pt.name || a.pt.id || "");
        const nameB = String(b.pt.name || b.pt.id || "");
        return nameA.localeCompare(nameB);
      });

    elements.results.innerHTML = ranked
      .map(({ pt, meta }, index) => renderPtCard(pt, index, meta))
      .join("");
  }

  if (elements.emptyState) {
    elements.emptyState.hidden = results.length > 0;
  }
}

function filterPts(pts, filters) {
  const timeMinutes = filters.time ? parseTimeToMinutes(filters.time) : null;
  const requireAvailability = Boolean(
    filters.days.length || filters.time || filters.visitType || filters.nextAvailableDays
  );
  const insuranceCriteria = getInsuranceCriteria(filters);
  const shouldFilterInsurance = Boolean(insuranceCriteria.query);

  return pts.filter((pt) => {
    if (!pt.active) return false;
    if (!isEligibleRole(pt.role)) return false;
    if (!matchesZipForFilters(pt, filters)) return false;

    if (shouldFilterInsurance) {
      const matches = pt.insurances.some((insurance) => {
        const queryMatch =
          !insuranceCriteria.query ||
          normalizeText(insurance.name).includes(insuranceCriteria.query);
        return queryMatch;
      });
      if (!matches) return false;
    }

    if (requireAvailability) {
      const matches = matchesAvailability(
        pt.availability,
        filters.days,
        timeMinutes,
        filters.visitType,
        getAllBlocks(pt),
        new Date(),
        filters.nextAvailableDays
      );
      if (!matches) return false;
    }

    return true;
  });
}

function matchesZipForFilters(pt, filters) {
  if (!filters.zip) return true;
  if (!pt.zips || !pt.zips.has(filters.zip)) return false;
  const dayFilters = sortDays(filters.days || []);
  if (!dayFilters.length) return true;
  if (pt.zipsAnyDay?.has(filters.zip)) return true;
  const dayMap = pt.zipsByDay;
  if (!dayMap || dayMap.size === 0) return true;
  return dayFilters.some((day) => dayMap.get(day)?.has(filters.zip));
}

function computeMatchScore(pt, filters, meta, mode) {
  let score = 0;

  if (filters.zip && matchesZipForFilters(pt, filters)) {
    score += 3;
  }

  if (filters.insuranceQuery) {
    const insuranceMatch = getInsuranceMatchForScore(pt, filters);
    if (insuranceMatch.matched) score += 2;
  }

  if (filters.visitType && hasVisitTypeMatch(pt.availability, filters.visitType)) {
    score += 2;
  }

  if (filters.days.length) {
    if (mode === "suggested") {
      const offset = meta?.offset ?? null;
      if (offset !== null && offset <= 2) {
        score += 1;
      }
    } else {
      score += 1;
    }
  }

  return score;
}

function getInsuranceMatchForScore(pt, filters) {
  const criteria = getInsuranceCriteria(filters);
  let matched = false;

  pt.insurances.forEach((insurance) => {
    const queryMatch =
      !criteria.query || normalizeText(insurance.name).includes(criteria.query);
    if (!queryMatch) return;
    matched = true;
  });

  return { matched };
}

function hasVisitTypeMatch(slots, visitType) {
  if (!visitType) return false;
  return slots.some(
    (slot) =>
      isWithinEffectiveRange(slot) &&
      (!slot.visitType || slot.visitType === visitType)
  );
}

function buildCopySummary(pt, meta) {
  const lines = [];
  const name = pt.name || pt.id;
  lines.push(`PT: ${name}`);
  if (pt.role) lines.push(`Role: ${pt.role}`);
  lines.push(`Status: ${pt.active ? "Active" : "Inactive"}`);
  if (pt.phone) lines.push(`Phone: ${pt.phone}`);
  if (pt.email) lines.push(`Email: ${pt.email}`);
  if (state.filters.zip) lines.push(`Requested Zip: ${state.filters.zip}`);
  if (state.filters.insuranceQuery) {
    lines.push(`Requested Insurance: ${state.filters.insuranceQuery}`);
  }
  if (pt.zips?.size) {
    lines.push(`Coverage Zips: ${Array.from(pt.zips).sort().join(", ")}`);
  }

  const insuranceList = formatList(getInsuranceList(pt), 12) || "None listed";
  lines.push(`Insurance accepted: ${insuranceList}`);
  lines.push(`PT rate: ${formatRateValue(pt.ptRate)}`);
  lines.push(`Highest insurance rate: ${formatRateValue(pt.maxInsuranceRate)}`);
  lines.push(`Profit estimate: ${formatRateValue(getProfitEstimate(pt))}`);
  lines.push(`Weekly capacity: ${formatCapacityLabel(pt)}`);

  const availability = formatAvailability(pt, meta?.nextDay);
  lines.push(`Availability: ${availability}`);
  const nextSlot = getNextAvailableSlot(pt, state.filters, new Date());
  if (nextSlot) {
    lines.push(`Next available: ${formatNextSlot(nextSlot)}`);
  }
  const bookingSummary = getBookingSummary(pt, state.filters, TRAVEL_BUFFER_MINUTES);
  if (bookingSummary.lines.length) {
    lines.push(`Bookings on selected days: ${bookingSummary.lines.join(" | ")}`);
  }

  if (meta?.nextDay) {
    const offsetText = meta.offset
      ? ` (+${meta.offset} day${meta.offset === 1 ? "" : "s"})`
      : "";
    lines.push(`Next available day: ${formatDayLabel(meta.nextDay)}${offsetText}`);
  }

  if (pt.notes) lines.push(`Notes: ${pt.notes}`);

  return lines.join("\n");
}

function copyToClipboard(text, buttonEl) {
  const restore = () => {
    if (!buttonEl) return;
    buttonEl.textContent = buttonEl.dataset.label || "Copy summary";
    buttonEl.disabled = false;
  };

  if (buttonEl) {
    if (!buttonEl.dataset.label) {
      buttonEl.dataset.label = buttonEl.textContent || "Copy summary";
    }
    buttonEl.textContent = "Copying...";
    buttonEl.disabled = true;
  }

  const onSuccess = () => {
    if (buttonEl) {
      buttonEl.textContent = "Copied";
      setTimeout(restore, 1600);
    }
  };

  const onFailure = () => {
    if (buttonEl) {
      buttonEl.textContent = "Copy failed";
      setTimeout(restore, 1800);
    }
  };

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(onSuccess).catch(onFailure);
    return;
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textarea);
    if (success) onSuccess();
    else onFailure();
  } catch (error) {
    console.error(error);
    onFailure();
  }
}

function findNearestMatches(pts, filters) {
  if (!filters.days || filters.days.length !== 1) {
    return { matches: [], metaById: new Map(), summary: "", dayLabel: "" };
  }
  const requestedDay = filters.days[0];
  const requestedIndex = DAY_ORDER.indexOf(requestedDay);
  if (requestedIndex < 0) {
    return { matches: [], metaById: new Map(), summary: "", dayLabel: "" };
  }

  const timeMinutes = filters.time ? parseTimeToMinutes(filters.time) : null;
  const insuranceCriteria = getInsuranceCriteria(filters);
  const shouldFilterInsurance = Boolean(insuranceCriteria.query);

  let bestOffset = null;
  let bestDay = "";
  const matches = [];
  const metaById = new Map();

  pts.forEach((pt) => {
    if (!pt.active) return;
    if (!isEligibleRole(pt.role)) return;
    if (!matchesZipForFilters(pt, filters)) return;

    if (shouldFilterInsurance) {
      const matchesInsurance = pt.insurances.some((insurance) => {
        const queryMatch =
          !insuranceCriteria.query ||
          normalizeText(insurance.name).includes(insuranceCriteria.query);
        return queryMatch;
      });
      if (!matchesInsurance) return;
    }

    const slotMatch = findNearestSlot(
      pt.availability,
      requestedIndex,
      timeMinutes,
      filters.visitType,
      getAllBlocks(pt),
      new Date(),
      filters.nextAvailableDays
    );
    if (!slotMatch) return;

    if (bestOffset === null || slotMatch.offset < bestOffset) {
      bestOffset = slotMatch.offset;
      bestDay = slotMatch.day;
      matches.length = 0;
      metaById.clear();
    }

    if (slotMatch.offset === bestOffset) {
      matches.push(pt);
      metaById.set(pt.id, { nextDay: slotMatch.day, offset: slotMatch.offset });
    }
  });

  const summary = matches.length
    ? `No exact matches for ${formatDayLabel(requestedDay)}. Showing next available on ${formatDayLabel(
        bestDay
      )}${bestOffset ? ` (+${bestOffset} day${bestOffset === 1 ? "" : "s"})` : ""}.`
    : "";

  return {
    matches,
    metaById,
    summary,
    dayLabel: bestDay ? formatDayLabel(bestDay) : "",
  };
}

function findNearestSlot(
  slots,
  requestedIndex,
  timeMinutes,
  visitType,
  unavailability,
  baseDate,
  maxDays
) {
  const anchorDate = baseDate || new Date();
  const requestedDay = DAY_ORDER[requestedIndex];
  const requestedDate = getNextDateForDay(requestedDay, anchorDate);
  if (!requestedDate) return null;
  const horizonDate = maxDays ? addDays(anchorDate, maxDays) : null;
  if (horizonDate && requestedDate > horizonDate) return null;
  let bestOffset = null;
  let bestDay = "";

  slots.forEach((slot) => {
    if (!isWithinEffectiveRange(slot)) return;
    if (visitType && slot.visitType && slot.visitType !== visitType) return;
    if (
      timeMinutes !== null &&
      (timeMinutes < slot.startMinutes || timeMinutes > slot.endMinutes)
    ) {
      return;
    }

    const slotIndex = DAY_ORDER.indexOf(slot.day);
    if (slotIndex < 0) return;
    const offset = (slotIndex - requestedIndex + 7) % 7;
    if (!offset) return;
    const candidateDate = addDays(requestedDate, offset);
    if (horizonDate && candidateDate > horizonDate) return;
    if (isSlotBlocked(slot, candidateDate, unavailability)) return;
    if (bestOffset === null || offset < bestOffset) {
      bestOffset = offset;
      bestDay = slot.day;
    }
  });

  if (bestOffset === null) return null;
  return { offset: bestOffset, day: bestDay };
}

function renderPtCard(pt, index, meta) {
  const bookingSummary = getBookingSummary(pt, state.filters, TRAVEL_BUFFER_MINUTES);
  const tags = [];
  if (pt.active) {
    tags.push({ label: "Active", className: "tag alt" });
  } else {
    tags.push({ label: "Inactive", className: "tag muted" });
  }

  if (state.filters.zip) {
    tags.push({ label: `Zip ${state.filters.zip}`, className: "tag" });
  }

  if (state.filters.insuranceQuery) {
    tags.push({
      label: `Insurance: ${state.filters.insuranceQuery}`,
      className: "tag alt",
    });
  }

  if (state.filters.days.length || state.filters.time) {
    tags.push({ label: "Time ok", className: "tag alt" });
  }

  if (state.filters.visitType) {
    tags.push({
      label: `Visit: ${formatVisitLabel(state.filters.visitType)}`,
      className: "tag alt",
    });
  }

  if (bookingSummary.count) {
    tags.push({
      label: `Booked: ${bookingSummary.count}`,
      className: "tag muted",
    });
  }

  if (meta?.nextDay) {
    const offsetText = meta.offset ? ` (+${meta.offset} day${meta.offset === 1 ? "" : "s"})` : "";
    tags.push({
      label: `Next available: ${formatDayLabel(meta.nextDay)}${offsetText}`,
      className: "tag alt",
    });
  }

  const contactLines = [
    pt.phone
      ? `<a href="tel:${escapeHtml(pt.phone)}">${escapeHtml(pt.phone)}</a>`
      : "No phone listed",
    pt.email
      ? `<a href="mailto:${escapeHtml(pt.email)}">${escapeHtml(pt.email)}</a>`
      : "No email listed",
  ];

  const zipList = formatList(Array.from(pt.zips).sort(), 8);
  const insuranceList = formatList(getInsuranceList(pt), 8) || "None listed";
  const availability = formatAvailability(pt, meta?.nextDay);
  const capacityLabel = formatCapacityLabel(pt);
  const ptRateLabel = formatRateValue(pt.ptRate);
  const maxInsuranceRateLabel = formatRateValue(pt.maxInsuranceRate);
  const profitLabel = formatRateValue(getProfitEstimate(pt));
  const nextSlot = getNextAvailableSlot(pt, state.filters, new Date());

  const bodyItems = [
    {
      label: "Contact",
      value: contactLines.join("<br />"),
    },
    {
      label: "Coverage",
      value: escapeHtml(zipList || "No zips listed"),
    },
    {
      label: "Insurance accepted",
      value: escapeHtml(insuranceList),
    },
    {
      label: "PT rate",
      value: escapeHtml(ptRateLabel),
    },
    {
      label: "Highest insurance rate",
      value: escapeHtml(maxInsuranceRateLabel),
    },
    {
      label: "Profit estimate",
      value: escapeHtml(profitLabel),
    },
    {
      label: "Weekly capacity",
      value: escapeHtml(capacityLabel),
    },
  ];

  if (nextSlot) {
    bodyItems.splice(7, 0, {
      label: "Next available",
      value: escapeHtml(formatNextSlot(nextSlot)),
    });
  }

  if (bookingSummary.lines.length) {
    bodyItems.splice(8, 0, {
      label: "Bookings on selected days",
      value: escapeHtml(bookingSummary.lines.join(" | ")),
    });
  }

  bodyItems.push({
    label: "Availability",
    value: escapeHtml(availability),
  });

  if (pt.notes) {
    bodyItems.push({
      label: "Notes",
      value: escapeHtml(pt.notes),
    });
  }

  return `
    <article class="result-card" style="animation-delay:${index * 40}ms">
      <div class="result-header">
        <div class="result-title">
          <h3>${escapeHtml(pt.name || pt.id)}</h3>
          <span>${escapeHtml(pt.role || "PT")}</span>
        </div>
        <div class="result-actions">
          <div class="result-tags">
            ${tags
              .map(
                (tag) =>
                  `<span class="${tag.className}">${escapeHtml(tag.label)}</span>`
              )
              .join("")}
          </div>
          <button class="copy-button" type="button" data-copy="${escapeHtml(pt.id)}">
            Copy summary
          </button>
        </div>
      </div>
      <div class="result-body">
        ${bodyItems
          .map(
            (item) => `
              <div>
                <strong>${escapeHtml(item.label)}</strong>
                ${item.value}
              </div>
            `
          )
          .join("")}
      </div>
    </article>
  `;
}

function getInsuranceList(pt) {
  const items = [];
  pt.insurances.forEach((insurance) => {
    if (!insurance.name) return;
    const label = String(insurance.name).trim();
    if (label) items.push(label);
  });
  return Array.from(new Set(items));
}

function getMaxInsuranceRate(pt) {
  let maxRate = null;
  pt.insurances.forEach((insurance) => {
    if (insurance.rate === null || insurance.rate === undefined) return;
    if (maxRate === null || insurance.rate > maxRate) {
      maxRate = insurance.rate;
    }
  });
  return maxRate;
}

function getProfitEstimate(pt) {
  if (pt.ptRate === null || pt.ptRate === undefined) return null;
  if (pt.maxInsuranceRate === null || pt.maxInsuranceRate === undefined) return null;
  return pt.maxInsuranceRate - pt.ptRate;
}

function getAllBlocks(pt) {
  const blocks = [];
  if (pt.unavailability?.length) {
    blocks.push(...pt.unavailability);
  }
  if (pt.bookingBlocks?.length) {
    blocks.push(...pt.bookingBlocks);
  }
  return blocks;
}

function formatCapacityLabel(pt) {
  const max = Number.isFinite(pt.maxWeeklyVisits) ? pt.maxWeeklyVisits : null;
  if (max === null) return "Not set";
  const booked = pt.weeklyBooked || 0;
  const remaining = Math.max(0, max - booked);
  return `${remaining} open / ${max} weekly`;
}

function formatRateValue(value) {
  if (!Number.isFinite(value)) return "Not set";
  const rounded = Math.round(value * 100) / 100;
  const text = rounded.toFixed(2);
  return text.replace(/\.?0+$/, "");
}

function getNextAvailableSlot(pt, filters, baseDate) {
  const horizon = Number.isFinite(filters.nextAvailableDays)
    ? filters.nextAvailableDays
    : 30;
  const timeMinutes = filters.time ? parseTimeToMinutes(filters.time) : null;
  const dayFilters = sortDays(filters.days || []);
  const useDayFilters = dayFilters.length > 0;
  const visitType = filters.visitType;
  const blocks = getAllBlocks(pt);
  const anchorDate = toDateOnly(baseDate || new Date());

  for (let offset = 0; offset <= horizon; offset += 1) {
    const targetDate = addDays(anchorDate, offset);
    const dayCode = getDayCode(targetDate);
    if (useDayFilters && !dayFilters.includes(dayCode)) continue;
    const slots = pt.availability
      .filter((slot) => slot.day === dayCode)
      .filter((slot) => isWithinEffectiveRange(slot))
      .filter((slot) => !visitType || !slot.visitType || slot.visitType === visitType)
      .filter((slot) => {
        if (timeMinutes === null) return true;
        return timeMinutes >= slot.startMinutes && timeMinutes <= slot.endMinutes;
      })
      .sort((a, b) => a.startMinutes - b.startMinutes);
    for (const slot of slots) {
      if (!isSlotBlocked(slot, targetDate, blocks)) {
        return { date: targetDate, day: dayCode, slot };
      }
    }
  }

  return null;
}

function formatNextSlot(nextSlot) {
  if (!nextSlot) return "";
  const dayLabel = formatDayLabel(nextSlot.day);
  const dateLabel = nextSlot.date.toLocaleDateString();
  const timeLabel = `${nextSlot.slot.startTime}-${nextSlot.slot.endTime}`;
  return `${dayLabel} ${dateLabel} (${timeLabel})`;
}

function getBookingSummary(pt, filters, bufferMinutes) {
  const selectedDays = sortDays(filters?.days || []);
  if (!selectedDays.length) return { count: 0, lines: [] };

  const bookings = Array.isArray(pt.bookings) ? pt.bookings : [];
  if (!bookings.length) return { count: 0, lines: [] };

  const timeMinutes = filters?.time ? parseTimeToMinutes(filters.time) : null;
  const buffer = Number.isFinite(bufferMinutes) ? bufferMinutes : 60;
  const bookingsByDay = new Map();

  bookings.forEach((booking) => {
    if (!booking || !booking.day) return;
    if (!selectedDays.includes(booking.day)) return;
    const list = bookingsByDay.get(booking.day) || [];
    list.push(booking);
    bookingsByDay.set(booking.day, list);
  });

  const lines = [];
  let count = 0;

  selectedDays.forEach((day) => {
    const list = bookingsByDay.get(day);
    if (!list || !list.length) return;
    list.sort((a, b) => {
      const timeA = Number.isFinite(a.timeMinutes) ? a.timeMinutes : Infinity;
      const timeB = Number.isFinite(b.timeMinutes) ? b.timeMinutes : Infinity;
      if (timeA !== timeB) return timeA - timeB;
      const areaA = String(a.area || "");
      const areaB = String(b.area || "");
      return areaA.localeCompare(areaB);
    });
    count += list.length;
    const entries = list.map((booking) => {
      const areaLabel = booking.area ? booking.area : "Area unknown";
      const timeLabel = Number.isFinite(booking.timeMinutes)
        ? minutesToTime(booking.timeMinutes)
        : "time TBD";
      let entry = `${areaLabel} @ ${timeLabel}`;
      if (timeMinutes !== null) {
        if (Number.isFinite(booking.timeMinutes)) {
          const diff = Math.abs(timeMinutes - booking.timeMinutes);
          if (diff < buffer) {
            entry += ` (buffer < ${buffer}m)`;
          }
        } else {
          entry += " (time unknown)";
        }
      }
      return entry;
    });
    lines.push(`${formatDayLabel(day)}: ${entries.join(", ")}`);
  });

  return { count, lines };
}

function formatAvailability(pt, dayOverride) {
  let valid = pt.availability.filter((slot) => isWithinEffectiveRange(slot));
  if (state.filters.visitType) {
    valid = valid.filter(
      (slot) => !slot.visitType || slot.visitType === state.filters.visitType
    );
  }
  if (!valid.length) return "No availability listed";

  const grouped = new Map();
  valid.forEach((slot) => {
    const list = grouped.get(slot.day) || [];
    list.push(slot);
    grouped.set(slot.day, list);
  });

  const selectedDays = sortDays(state.filters.days || []);
  const dayFocus = dayOverride
    ? [dayOverride]
    : selectedDays.length
    ? selectedDays
    : DAY_ORDER;
  const lines = [];
  const shouldApplyBlocks = Boolean(dayOverride || selectedDays.length);
  const anchorDate = new Date();
  const blocks = getAllBlocks(pt);

  dayFocus.forEach((day) => {
    const slots = grouped.get(day);
    if (!slots || !slots.length) return;
    let visibleSlots = slots;
    if (shouldApplyBlocks) {
      const targetDate = getNextDateForDay(day, anchorDate);
      if (!targetDate) return;
      visibleSlots = slots.filter(
        (slot) => !isSlotBlocked(slot, targetDate, blocks)
      );
    }
    if (!visibleSlots.length) return;
    visibleSlots.sort((a, b) => a.startMinutes - b.startMinutes);
    const times = visibleSlots.map((slot) => {
      const visitLabel = slot.visitType
        ? ` (${formatVisitLabel(slot.visitType)})`
        : "";
      return `${slot.startTime}-${slot.endTime}${visitLabel}`;
    });
    lines.push(`${day} ${times.join(", ")}`);
  });

  if (!lines.length) return "No availability listed";
  const timezone = getPrimaryTimezone(valid);
  return timezone ? `${lines.join(" | ")} (TZ: ${timezone})` : lines.join(" | ");
}

function getPrimaryTimezone(slots) {
  for (const slot of slots) {
    if (slot.timezone) return slot.timezone;
  }
  return "";
}

function matchesAvailability(
  slots,
  days,
  timeMinutes,
  visitType,
  unavailability,
  baseDate,
  maxDays
) {
  let valid = slots.filter((slot) => isWithinEffectiveRange(slot));
  if (!valid.length) return false;

  const dayFilters = sortDays(days || []);
  let subset = valid;
  if (dayFilters.length) {
    subset = valid.filter((slot) => dayFilters.includes(slot.day));
  }
  if (!subset.length) return false;

  if (visitType) {
    subset = subset.filter(
      (slot) => !slot.visitType || slot.visitType === visitType
    );
  }
  if (!subset.length) return false;

  let timeFiltered = subset;
  if (timeMinutes !== null) {
    timeFiltered = subset.filter(
      (slot) =>
        timeMinutes >= slot.startMinutes && timeMinutes <= slot.endMinutes
    );
  }
  if (!timeFiltered.length) return false;

  const anchorDate = baseDate || new Date();
  const horizonDate = maxDays ? addDays(anchorDate, maxDays) : null;

  if (dayFilters.length) {
    for (const day of dayFilters) {
      const daySlots = timeFiltered.filter((slot) => slot.day === day);
      if (!daySlots.length) continue;
      let targetDate = getNextDateForDay(day, anchorDate);
      if (!targetDate) continue;
      if (horizonDate && targetDate > horizonDate) continue;
      while (true) {
        const availableSlots = daySlots.filter(
          (slot) => !isSlotBlocked(slot, targetDate, unavailability)
        );
        if (availableSlots.length) return true;
        if (!horizonDate) break;
        targetDate = addDays(targetDate, 7);
        if (targetDate > horizonDate) break;
      }
    }
    return false;
  }

  for (const slot of timeFiltered) {
    let targetDate = getNextDateForDay(slot.day, anchorDate);
    if (!targetDate) continue;
    if (!horizonDate) {
      if (!isSlotBlocked(slot, targetDate, unavailability)) return true;
      continue;
    }
    while (targetDate <= horizonDate) {
      if (!isSlotBlocked(slot, targetDate, unavailability)) return true;
      targetDate = addDays(targetDate, 7);
    }
  }

  return false;
}

function isWithinEffectiveRange(slot) {
  const today = new Date();
  const start = parseDateOnly(slot.effectiveFrom);
  const end = parseDateOnly(slot.effectiveTo);

  if (start && today < start) return false;
  if (end && today > end) return false;
  return true;
}

function parseDateOnly(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function normalizeDay(value) {
  if (!value) return "";
  const key = String(value).trim().toLowerCase();
  return DAY_MAP[key] || "";
}

function normalizeId(value) {
  return String(value || "").trim();
}

function normalizeZip(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length ? digits.slice(0, 5) : "";
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function getInsuranceCriteria(filters) {
  return {
    query: normalizeText(filters.insuranceQuery || ""),
  };
}

function getSelectedDays() {
  if (!elements.dayOptions) return [];
  const selected = Array.from(
    elements.dayOptions.querySelectorAll('input[name="day"]:checked')
  ).map((input) => input.value);
  return sortDays(selected);
}

function sortDays(days) {
  const daySet = new Set(days);
  return DAY_ORDER.filter((day) => daySet.has(day));
}

function isEligibleRole(role) {
  const normalized = normalizeText(role);
  if (!normalized) return true;
  const cleaned = normalized.replace(/[^a-z]/g, " ").replace(/\s+/g, " ").trim();
  if (cleaned.includes("physical therapist")) return true;
  if (cleaned.includes("phys therapist")) return true;
  return /(^|\s)(pt|pta)(\s|$)/.test(cleaned);
}

function normalizeVisitType(value) {
  const normalized = normalizeText(value);
  if (!normalized) return "";
  if (normalized === "any type" || normalized === "any" || normalized === "all") {
    return "";
  }
  if (normalized.includes("any visit") || normalized.includes("both")) {
    return "";
  }
  if (normalized.includes("initial")) return "initial evaluation";
  if (normalized.includes("follow")) return "follow up";
  return normalized;
}

function formatVisitLabel(value) {
  if (!value) return "";
  return value
    .split(/[\s_/]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDayLabel(day) {
  return DAY_LABELS[day] || day || "";
}

function toDateOnly(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return toDateOnly(next);
}

function getNextDateForDay(day, fromDate) {
  const targetIndex = DAY_ORDER.indexOf(day);
  if (targetIndex < 0) return null;
  const base = fromDate ? new Date(fromDate) : new Date();
  const currentIndex = (base.getDay() + 6) % 7;
  let offset = targetIndex - currentIndex;
  if (offset < 0) offset += 7;
  return addDays(toDateOnly(base), offset);
}

function getDayCode(date) {
  if (!date) return "";
  const index = (date.getDay() + 6) % 7;
  return DAY_ORDER[index] || "";
}

function getWeekBounds(date) {
  const anchor = toDateOnly(date);
  const index = (anchor.getDay() + 6) % 7;
  const start = addDays(anchor, -index);
  const end = addDays(start, 7);
  return { start, end };
}

function isSlotBlocked(slot, date, unavailability) {
  if (!unavailability || !unavailability.length || !date) return false;
  const target = toDateOnly(date);
  return unavailability.some((block) => {
    if (!block.startDate || !block.endDate) return false;
    if (target < block.startDate || target > block.endDate) return false;
    if (block.startMinutes === null || block.endMinutes === null) return true;
    if (slot.startMinutes === null || slot.endMinutes === null) return true;
    return (
      block.startMinutes <= slot.endMinutes &&
      block.endMinutes >= slot.startMinutes
    );
  });
}

function parseBoolean(value, defaultValue) {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }
  const normalized = String(value).trim().toLowerCase();
  return ["true", "yes", "1", "y"].includes(normalized);
}

function parseNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseTimeToMinutes(value) {
  if (!value) return null;
  const text = String(value).trim().toLowerCase();
  const match = text.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2] || "0", 10);
  const meridiem = match[3];
  if (meridiem === "pm" && hours < 12) hours += 12;
  if (meridiem === "am" && hours === 12) hours = 0;
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function parseMaxDays(value) {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function isCountedBookingStatus(status) {
  const normalized = normalizeText(status);
  if (!normalized) return true;
  return !/(cancel|no\s*show|resched)/.test(normalized);
}

function minutesToTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const hoursText = String(hours).padStart(2, "0");
  const minutesText = String(minutes).padStart(2, "0");
  return `${hoursText}:${minutesText}`;
}

function formatList(items, limit) {
  if (!items || !items.length) return "";
  if (!limit || items.length <= limit) return items.join(", ");
  const remaining = items.length - limit;
  return `${items.slice(0, limit).join(", ")} +${remaining} more`;
}

function normalizeHeader(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function getField(row, aliasKey) {
  const aliases = FIELD_ALIASES[aliasKey] || [];
  if (!row || !aliases.length) return "";
  const keys = Object.keys(row);
  for (const alias of aliases) {
    const normalizedAlias = normalizeHeader(alias);
    for (const key of keys) {
      if (normalizeHeader(key) === normalizedAlias) {
        return row[key];
      }
    }
  }
  return "";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

bootstrap();
