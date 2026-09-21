const CSV_PATH = "data/processed/asset_transfers_final.csv";

let allOperations = [];
let showingAll = false;

let slaChart = null;
let riskChart = null;
let exceptionChart = null;


// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    loadCSV();

    const showAllBtn = document.getElementById("showAllBtn");
    const closeDetails = document.getElementById("closeDetails");

    if (showAllBtn) {
        showAllBtn.addEventListener("click", () => {
            showingAll = !showingAll;
            renderCriticalOperations();

            showAllBtn.textContent = showingAll
                ? "Show Critical"
                : "View All";
        });
    }

    if (closeDetails) {
        closeDetails.addEventListener("click", closeOperationDetails);
    }
});


// ============================================================
// CSV LOADING
// ============================================================

function loadCSV() {
    Papa.parse(CSV_PATH, {
        download: true,
        header: true,
        skipEmptyLines: true,

        transformHeader: function(header) {
            return header.trim();
        },

        complete: function(results) {
            console.log("CSV loaded:", results);

            if (results.errors && results.errors.length > 0) {
                console.warn("CSV parsing warnings:", results.errors);
            }

            allOperations = results.data.filter(row => {
                return row.transfer_id &&
                       String(row.transfer_id).trim() !== "";
            });

            console.log("Valid operations:", allOperations.length);

            if (allOperations.length === 0) {
                showError(
                    "CSV loaded successfully, but no valid transfer records were found."
                );
                return;
            }

            initializeDashboard();
        },

        error: function(error) {
            console.error("CSV loading error:", error);

            showError(
                "Could not load asset_transfers_final.csv. " +
                "Check the CSV path and GitHub Pages configuration."
            );
        }
    });
}


// ============================================================
// DASHBOARD
// ============================================================

function initializeDashboard() {
    updateKPIs();
    renderLifecycle();
    renderSLAChart();
    renderRiskChart();
    renderExceptionChart();
    renderCriticalOperations();

    console.log("Dashboard initialized successfully.");
}


// ============================================================
// KPI
// ============================================================

function updateKPIs() {

    const totalTransfers = allOperations.length;

    const pendingTransfers = allOperations.filter(row => {
        const lifecycle = normalize(row.lifecycle_status);
        const status = normalize(row.status);

        return !isCompleted(lifecycle) &&
               !isCompleted(status);
    }).length;

    const outsideSLA = allOperations.filter(row => {
        return isOutsideSLA(row.sla_status);
    }).length;

    const exceptions = allOperations.filter(row => {
        return isTrue(row.exception_flag);
    }).length;

    const criticalRisk = allOperations.filter(row => {
        const risk = normalize(row.final_risk_level);
        const operationalRisk = normalize(row.operational_risk);

        return risk === "critical" ||
               operationalRisk === "critical";
    }).length;

    const assetValue = allOperations.reduce((total, row) => {
        return total + numberValue(row.requested_value);
    }, 0);


    setText("totalTransfers", formatNumber(totalTransfers));
    setText("pendingTransfers", formatNumber(pendingTransfers));
    setText("outsideSla", formatNumber(outsideSLA));
    setText("exceptions", formatNumber(exceptions));
    setText("criticalRisk", formatNumber(criticalRisk));
    setText("assetValue", formatCurrency(assetValue));
}


// ============================================================
// TRANSFER LIFECYCLE
// ============================================================

function renderLifecycle() {

    const container = document.getElementById("lifecycleFlow");

    if (!container) return;

    const stages = {};

    allOperations.forEach(row => {

        const stage =
            cleanValue(row.current_stage) ||
            cleanValue(row.lifecycle_status) ||
            "Unknown";

        stages[stage] = (stages[stage] || 0) + 1;
    });

    const sortedStages = Object.entries(stages)
        .sort((a, b) => b[1] - a[1]);


    container.innerHTML = sortedStages.map(([stage, count]) => {

        const percentage =
            ((count / allOperations.length) * 100).toFixed(1);

        return `
            <div class="lifecycle-step">

                <div class="lifecycle-step-title">
                    ${escapeHTML(stage)}
                </div>

                <strong>
                    ${formatNumber(count)}
                </strong>

                <small>
                    ${percentage}% of transfers
                </small>

            </div>
        `;

    }).join("");
}


// ============================================================
// SLA CHART
// ============================================================

function renderSLAChart() {

    const canvas = document.getElementById("slaChart");

    if (!canvas) return;

    const counts = {
        within: 0,
        outside: 0,
        unknown: 0
    };

    allOperations.forEach(row => {

        const value = normalize(row.sla_status);

        if (
            value.includes("outside") ||
            value.includes("breach") ||
            value.includes("overdue") ||
            value.includes("fora")
        ) {
            counts.outside++;

        } else if (
            value.includes("within") ||
            value.includes("on time") ||
            value.includes("ontime") ||
            value.includes("within sla") ||
            value.includes("dentro")
        ) {
            counts.within++;

        } else {
            counts.unknown++;
        }
    });


    if (slaChart) {
        slaChart.destroy();
    }

    slaChart = new Chart(canvas, {

        type: "doughnut",

        data: {
            labels: [
                "Within SLA",
                "Outside SLA",
                "Unknown"
            ],

            datasets: [{
                data: [
                    counts.within,
                    counts.outside,
                    counts.unknown
                ]
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    position: "bottom"
                }
            }
        }
    });
}


// ============================================================
// RISK CHART
// ============================================================

function renderRiskChart() {

    const canvas = document.getElementById("riskChart");

    if (!canvas) return;

    const riskCounts = {
        Low: 0,
        Medium: 0,
        High: 0,
        Critical: 0,
        Unknown: 0
    };


    allOperations.forEach(row => {

        const risk =
            cleanValue(row.final_risk_level) ||
            cleanValue(row.operational_risk);

        const normalized = normalize(risk);

        if (normalized === "low") {
            riskCounts.Low++;

        } else if (
            normalized === "medium" ||
            normalized === "moderate"
        ) {
            riskCounts.Medium++;

        } else if (normalized === "high") {
            riskCounts.High++;

        } else if (normalized === "critical") {
            riskCounts.Critical++;

        } else {
            riskCounts.Unknown++;
        }
    });


    if (riskChart) {
        riskChart.destroy();
    }


    riskChart = new Chart(canvas, {

        type: "doughnut",

        data: {
            labels: [
                "Low",
                "Medium",
                "High",
                "Critical",
                "Unknown"
            ],

            datasets: [{
                data: [
                    riskCounts.Low,
                    riskCounts.Medium,
                    riskCounts.High,
                    riskCounts.Critical,
                    riskCounts.Unknown
                ]
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    position: "bottom"
                }
            }
        }
    });
}


// ============================================================
// EXCEPTION CHART
// ============================================================

function renderExceptionChart() {

    const canvas = document.getElementById("exceptionChart");

    if (!canvas) return;

    const exceptionCounts = {};

    allOperations
        .filter(row => isTrue(row.exception_flag))
        .forEach(row => {

            const type =
                cleanValue(row.exception_type) ||
                "Unknown";

            exceptionCounts[type] =
                (exceptionCounts[type] || 0) + 1;
        });


    const entries = Object.entries(exceptionCounts)
        .sort((a, b) => b[1] - a[1]);


    if (exceptionChart) {
        exceptionChart.destroy();
    }


    exceptionChart = new Chart(canvas, {

        type: "bar",

        data: {

            labels: entries.map(item => item[0]),

            datasets: [{
                label: "Exceptions",
                data: entries.map(item => item[1])
            }]
        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            indexAxis: "y",

            plugins: {
                legend: {
                    display: false
                }
            },

            scales: {
                x: {
                    beginAtZero: true
                }
            }
        }
    });
}


// ============================================================
// CRITICAL OPERATIONS TABLE
// ============================================================

function renderCriticalOperations() {

    const tbody = document.getElementById("criticalTable");

    if (!tbody) return;


    let operations;


    if (showingAll) {

        operations = [...allOperations]
            .sort(sortByRiskAndSLA);

    } else {

        operations = allOperations
            .filter(isCriticalOperation)
            .sort(sortByRiskAndSLA);

    }


    if (operations.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;">
                    No critical operations found.
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML = operations
        .slice(0, 20)
        .map(row => {

            const risk =
                cleanValue(row.final_risk_level) ||
                cleanValue(row.operational_risk) ||
                "Unknown";

            const stage =
                cleanValue(row.current_stage) ||
                cleanValue(row.lifecycle_status) ||
                "Unknown";

            const sla =
                cleanValue(row.sla_status) ||
                "Unknown";

            const driver =
                cleanValue(row.risk_drivers) ||
                cleanValue(row.exception_type) ||
                "—";


            return `
                <tr
                    class="operation-row"
                    data-transfer-id="${escapeHTML(row.transfer_id)}"
                >

                    <td>
                        <strong>
                            ${escapeHTML(row.transfer_id)}
                        </strong>
                    </td>

                    <td>
                        ${escapeHTML(
                            cleanValue(row.asset_name) ||
                            cleanValue(row.ticker) ||
                            "—"
                        )}
                    </td>

                    <td>
                        ${formatCurrency(
                            numberValue(row.requested_value)
                        )}
                    </td>

                    <td>
                        ${escapeHTML(stage)}
                    </td>

                    <td>
                        ${escapeHTML(sla)}
                    </td>

                    <td>
                        ${escapeHTML(risk)}
                    </td>

                    <td>
                        ${escapeHTML(driver)}
                    </td>

                </tr>
            `;
        })
        .join("");


    document
        .querySelectorAll(".operation-row")
        .forEach(row => {

            row.addEventListener("click", () => {

                const transferId =
                    row.dataset.transferId;

                showOperationDetails(transferId);
            });
        });
}


// ============================================================
// OPERATION DETAILS
// ============================================================

function showOperationDetails(transferId) {

    const operation = allOperations.find(
        row => String(row.transfer_id) === String(transferId)
    );

    if (!operation) return;


    const panel =
        document.getElementById("operationDetails");

    const subtitle =
        document.getElementById("detailsSubtitle");

    const content =
        document.getElementById("detailsContent");


    if (!panel || !content) return;


    subtitle.textContent =
        `Transfer ${operation.transfer_id}`;


    const fields = [

        ["Transfer ID", operation.transfer_id],
        ["Client ID", operation.client_id],
        ["Asset Type", operation.asset_type],
        ["Asset Name", operation.asset_name],
        ["Ticker", operation.ticker],

        ["Quantity Requested", operation.quantity_requested],
        ["Quantity Received", operation.quantity_received],

        ["Requested Value",
            formatCurrency(numberValue(operation.requested_value))
        ],

        ["Settled Value",
            formatCurrency(numberValue(operation.settled_value))
        ],

        ["Origin Custodian", operation.origin_custodian],
        ["Destination Custodian", operation.destination_custodian],

        ["Transfer Type", operation.transfer_type],
        ["Transfer Direction", operation.transfer_direction],

        ["Request Date", operation.request_date],
        ["Expected Settlement",
            operation.expected_settlement_date
        ],

        ["Actual Settlement",
            operation.actual_settlement_date
        ],

        ["Current Stage", operation.current_stage],
        ["Status", operation.status],
        ["Lifecycle Status", operation.lifecycle_status],
        ["Priority", operation.priority],
        ["Responsible Team", operation.responsible_team],

        ["Documentation Complete",
            operation.documentation_complete
        ],

        ["Exception Flag", operation.exception_flag],
        ["Exception Type", operation.exception_type],

        ["SLA Days", operation.sla_days],
        ["Elapsed Days", operation.elapsed_days],
        ["SLA Status", operation.sla_status],

        ["Reconciliation Status",
            operation.reconciliation_status
        ],

        ["Operational Risk",
            operation.operational_risk
        ],

        ["Quantity Difference",
            operation.quantity_difference
        ],

        ["Value Difference",
            formatCurrency(
                numberValue(operation.value_difference)
            )
        ],

        ["Reconciliation Result",
            operation.reconciliation_result
        ],

        ["Reconciliation Severity",
            operation.reconciliation_severity
        ],

        ["Risk Score",
            operation.risk_score
        ],

        ["Risk Drivers",
            operation.risk_drivers
        ],

        ["Final Risk Level",
            operation.final_risk_level
        ]
    ];


    content.innerHTML = fields.map(([label, value]) => {

        return `
            <div class="detail-item">

                <span class="detail-label">
                    ${escapeHTML(label)}
                </span>

                <strong>
                    ${escapeHTML(
                        cleanValue(value) || "—"
                    )}
                </strong>

            </div>
        `;

    }).join("");


    panel.classList.remove("hidden");

    panel.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


function closeOperationDetails() {

    const panel =
        document.getElementById("operationDetails");

    if (panel) {
        panel.classList.add("hidden");
    }
}


// ============================================================
// HELPERS
// ============================================================

function isCriticalOperation(row) {

    const risk =
        normalize(row.final_risk_level);

    const operationalRisk =
        normalize(row.operational_risk);

    const priority =
        normalize(row.priority);

    const exception =
        isTrue(row.exception_flag);

    const sla =
        normalize(row.sla_status);


    return (
        risk === "critical" ||
        operationalRisk === "critical" ||
        priority === "critical" ||
        exception ||
        sla.includes("outside") ||
        sla.includes("breach") ||
        sla.includes("overdue") ||
        sla.includes("fora")
    );
}


function sortByRiskAndSLA(a, b) {

    const riskWeight = {
        critical: 4,
        high: 3,
        medium: 2,
        moderate: 2,
        low: 1
    };


    const aRisk =
        riskWeight[
            normalize(
                a.final_risk_level ||
                a.operational_risk
            )
        ] || 0;

    const bRisk =
        riskWeight[
            normalize(
                b.final_risk_level ||
                b.operational_risk
            )
        ] || 0;


    if (bRisk !== aRisk) {
        return bRisk - aRisk;
    }


    const aElapsed =
        numberValue(a.elapsed_days);

    const bElapsed =
        numberValue(b.elapsed_days);


    return bElapsed - aElapsed;
}


function isOutsideSLA(value) {

    const normalized = normalize(value);

    return (
        normalized.includes("outside") ||
        normalized.includes("breach") ||
        normalized.includes("overdue") ||
        normalized.includes("fora")
    );
}


function isCompleted(value) {

    const normalized = normalize(value);

    return (
        normalized === "completed" ||
        normalized === "complete" ||
        normalized === "settled" ||
        normalized === "settlement completed" ||
        normalized === "concluido" ||
        normalized === "concluida"
    );
}


function isTrue(value) {

    const normalized = normalize(value);

    return (
        normalized === "true" ||
        normalized === "1" ||
        normalized === "yes" ||
        normalized === "y" ||
        normalized === "sim"
    );
}


function normalize(value) {

    return String(value ?? "")
        .trim()
        .toLowerCase();
}


function cleanValue(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value).trim();
}


function numberValue(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return 0;
    }


    let stringValue =
        String(value)
            .trim()
            .replace(/\s/g, "");


    /*
     * Supports:
     * 493984607.46
     * 493,984,607.46
     * 493984607,46
     * 493.984.607,46
     */

    if (
        stringValue.includes(",") &&
        stringValue.includes(".")
    ) {

        if (
            stringValue.lastIndexOf(",") >
            stringValue.lastIndexOf(".")
        ) {

            stringValue =
                stringValue
                    .replace(/\./g, "")
                    .replace(",", ".");

        } else {

            stringValue =
                stringValue.replace(/,/g, "");
        }

    } else if (stringValue.includes(",")) {

        stringValue =
            stringValue.replace(",", ".");

    }


    const result =
        parseFloat(
            stringValue.replace(/[^\d.-]/g, "")
        );


    return Number.isFinite(result)
        ? result
        : 0;
}


function formatNumber(value) {

    return new Intl.NumberFormat("en-US")
        .format(value);
}


function formatCurrency(value) {

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}


function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ============================================================
// ERROR MESSAGE
// ============================================================

function showError(message) {

    let errorBox =
        document.getElementById("dashboardError");


    if (!errorBox) {

        errorBox =
            document.createElement("div");

        errorBox.id =
            "dashboardError";

        errorBox.style.cssText = `
            margin: 20px auto;
            max-width: 1200px;
            padding: 16px 20px;
            border: 1px solid #7f1d1d;
            background: #2a1111;
            color: #fecaca;
            border-radius: 8px;
            font-family: Arial, sans-serif;
        `;

        document.body.prepend(errorBox);
    }


    errorBox.textContent = message;
}
