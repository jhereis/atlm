const CSV_PATH = "asset_transfers_final.csv";

let allOperations = [];
let filteredOperations = [];

let slaChart;
let riskChart;
let exceptionChart;

const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

const numberFormatter = new Intl.NumberFormat("en-US");


// ============================================================
// DATA LOADING
// ============================================================

function loadData() {

    Papa.parse(CSV_PATH, {
        download: true,
        header: true,
        skipEmptyLines: true,

        complete: function(results) {

            if (!results.data || results.data.length === 0) {
                console.error("CSV loaded but contains no records.");
                return;
            }

            allOperations = results.data.filter(row => row.transfer_id);
            filteredOperations = [...allOperations];

            console.log(`Loaded ${allOperations.length} asset transfers.`);

            initializeDashboard();
        },

        error: function(error) {

            console.error("Could not load operational CSV:", error);

            alert(
                "Data loading error.\n\n" +
                "Could not load asset_transfers_final.csv.\n\n" +
                "Check the CSV path and GitHub Pages configuration."
            );
        }
    });
}


// ============================================================
// INITIALIZATION
// ============================================================

function initializeDashboard() {

    renderKPIs();
    renderLifecycle();
    renderSLAChart();
    renderRiskChart();
    renderExceptionChart();
    renderCriticalTable();

}


// ============================================================
// KPI CARDS
// ============================================================

function renderKPIs() {

    const total = allOperations.length;

    const pending = allOperations.filter(
        row => row.lifecycle_status !== "Completed"
    ).length;

    const outsideSLA = allOperations.filter(
        row => row.sla_status === "Outside SLA"
    ).length;

    const exceptions = allOperations.filter(
        row => row.exception_flag === "1" ||
               row.exception_flag === 1 ||
               row.exception_flag === "True" ||
               row.exception_flag === "true"
    ).length;

    const critical = allOperations.filter(
        row => row.operational_risk === "Critical"
    ).length;

    const totalValue = allOperations.reduce(
        (sum, row) => sum + parseFloat(row.requested_value || 0),
        0
    );


    document.getElementById("totalTransfers").textContent =
        numberFormatter.format(total);

    document.getElementById("pendingTransfers").textContent =
        numberFormatter.format(pending);

    document.getElementById("outsideSla").textContent =
        numberFormatter.format(outsideSLA);

    document.getElementById("exceptions").textContent =
        numberFormatter.format(exceptions);

    document.getElementById("criticalRisk").textContent =
        numberFormatter.format(critical);

    document.getElementById("assetValue").textContent =
        formatCompactCurrency(totalValue);
}


// ============================================================
// LIFECYCLE
// ============================================================

function renderLifecycle() {

    const container = document.getElementById("lifecycleFlow");

    container.innerHTML = "";


    const stages = [
        {
            name: "Requested",
            values: ["Requested"]
        },
        {
            name: "Validation",
            values: ["Validation"]
        },
        {
            name: "Approval",
            values: ["Approval"]
        },
        {
            name: "Registered",
            values: ["Registered"]
        },
        {
            name: "Sent to Custodian",
            values: ["Sent to Custodian"]
        },
        {
            name: "In Transit",
            values: ["In Transit"]
        },
        {
            name: "Settlement",
            values: ["Settlement"]
        },
        {
            name: "Reconciliation",
            values: ["Reconciliation"]
        },
        {
            name: "Completed",
            values: ["Completed"]
        }
    ];


    stages.forEach(stage => {

        const count = allOperations.filter(row =>
            stage.values.includes(row.current_stage) ||
            stage.values.includes(row.lifecycle_status)
        ).length;


        const stageElement = document.createElement("div");

        stageElement.className = "lifecycle-stage";

        stageElement.innerHTML = `
            <div class="stage-name">
                ${stage.name}
            </div>

            <span class="stage-count">
                ${numberFormatter.format(count)}
            </span>

            <div class="stage-label">
                operations
            </div>
        `;

        container.appendChild(stageElement);
    });
}


// ============================================================
// SLA CHART
// ============================================================

function renderSLAChart() {

    const within = allOperations.filter(
        row => row.sla_status === "Within SLA"
    ).length;

    const outside = allOperations.filter(
        row => row.sla_status === "Outside SLA"
    ).length;


    const ctx = document
        .getElementById("slaChart")
        .getContext("2d");


    if (slaChart) {
        slaChart.destroy();
    }


    slaChart = new Chart(ctx, {

        type: "doughnut",

        data: {
            labels: [
                "Within SLA",
                "Outside SLA"
            ],

            datasets: [{
                data: [
                    within,
                    outside
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
            },

            cutout: "68%"
        }
    });
}


// ============================================================
// RISK CHART
// ============================================================

function renderRiskChart() {

    const levels = [
        "Low",
        "Medium",
        "High",
        "Critical"
    ];


    const values = levels.map(level =>
        allOperations.filter(
            row => row.operational_risk === level
        ).length
    );


    const ctx = document
        .getElementById("riskChart")
        .getContext("2d");


    if (riskChart) {
        riskChart.destroy();
    }


    riskChart = new Chart(ctx, {

        type: "bar",

        data: {

            labels: levels,

            datasets: [{
                label: "Transfers",
                data: values,
                borderRadius: 5
            }]
        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {
                legend: {
                    display: false
                }
            },

            scales: {

                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}


// ============================================================
// EXCEPTION CHART
// ============================================================

function renderExceptionChart() {

    const exceptionMap = {};


    allOperations.forEach(row => {

        const exception = row.exception_type;

        if (
            exception &&
            exception !== "None" &&
            exception !== "nan"
        ) {

            exceptionMap[exception] =
                (exceptionMap[exception] || 0) + 1;
        }
    });


    const sortedExceptions = Object.entries(exceptionMap)
        .sort((a, b) => b[1] - a[1]);


    const labels = sortedExceptions.map(item => item[0]);

    const values = sortedExceptions.map(item => item[1]);


    const ctx = document
        .getElementById("exceptionChart")
        .getContext("2d");


    if (exceptionChart) {
        exceptionChart.destroy();
    }


    exceptionChart = new Chart(ctx, {

        type: "bar",

        data: {

            labels: labels,

            datasets: [{
                label: "Exceptions",
                data: values,
                borderRadius: 5
            }]
        },

        options: {

            indexAxis: "y",

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {
                    display: false
                }
            },

            scales: {

                x: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}


// ============================================================
// CRITICAL OPERATIONS
// ============================================================

function renderCriticalTable() {

    const table = document.getElementById("criticalTable");

    table.innerHTML = "";


    const criticalOperations = allOperations
        .filter(row =>
            row.operational_risk === "Critical"
        )
        .sort((a, b) =>
            parseFloat(b.risk_score || 0) -
            parseFloat(a.risk_score || 0)
        )
        .slice(0, 15);


    criticalOperations.forEach(operation => {

        const row = document.createElement("tr");

        row.addEventListener(
            "click",
            () => showOperationDetails(operation)
        );


        row.innerHTML = `

            <td>
                <strong>
                    ${operation.transfer_id}
                </strong>
            </td>

            <td>
                ${operation.asset_name || "-"}
                <br>
                <small>
                    ${operation.ticker || ""}
                </small>
            </td>

            <td>
                ${formatCurrency(operation.requested_value)}
            </td>

            <td>
                ${operation.current_stage || "-"}
            </td>

            <td>
                <span class="badge badge-sla">
                    ${operation.sla_status || "-"}
                </span>
            </td>

            <td>
                <span class="badge badge-critical">
                    ${operation.operational_risk}
                </span>
            </td>

            <td>
                ${getPrimaryDriver(operation)}
            </td>
        `;


        table.appendChild(row);
    });
}


// ============================================================
// OPERATION DETAILS
// ============================================================

function showOperationDetails(operation) {

    const panel =
        document.getElementById("operationDetails");

    const content =
        document.getElementById("detailsContent");

    const subtitle =
        document.getElementById("detailsSubtitle");


    panel.classList.remove("hidden");


    subtitle.textContent =
        `${operation.transfer_id} · ${operation.asset_name || ""}`;


    const stages = [
        "Requested",
        "Validation",
        "Approval",
        "Registered",
        "Sent to Custodian",
        "In Transit",
        "Settlement",
        "Reconciliation",
        "Completed"
    ];


    const currentStageIndex =
        stages.indexOf(operation.current_stage);


    const lifecycleHTML = stages.map(
        (stage, index) => {

            let className = "lifecycle-stage";

            if (index < currentStageIndex) {
                className += " completed-stage";
            }

            if (index === currentStageIndex) {
                className += " current-stage";
            }


            return `
                <div class="${className}">
                    <div class="stage-name">
                        ${stage}
                    </div>
                </div>
            `;
        }
    ).join("");


    content.innerHTML = `

        <div class="details-grid">

            <div class="detail-item">
                <span>Transfer ID</span>
                <strong>${operation.transfer_id}</strong>
            </div>

            <div class="detail-item">
                <span>Client</span>
                <strong>${operation.client_id || "-"}</strong>
            </div>

            <div class="detail-item">
                <span>Asset</span>
                <strong>${operation.asset_name || "-"}</strong>
            </div>

            <div class="detail-item">
                <span>Ticker</span>
                <strong>${operation.ticker || "-"}</strong>
            </div>

            <div class="detail-item">
                <span>Requested Value</span>
                <strong>
                    ${formatCurrency(operation.requested_value)}
                </strong>
            </div>

            <div class="detail-item">
                <span>Origin Custodian</span>
                <strong>
                    ${operation.origin_custodian || "-"}
                </strong>
            </div>

            <div class="detail-item">
                <span>Destination Custodian</span>
                <strong>
                    ${operation.destination_custodian || "-"}
                </strong>
            </div>

            <div class="detail-item">
                <span>Transfer Type</span>
                <strong>
                    ${operation.transfer_type || "-"}
                </strong>
            </div>

            <div class="detail-item">
                <span>Current Stage</span>
                <strong>
                    ${operation.current_stage || "-"}
                </strong>
            </div>

            <div class="detail-item">
                <span>SLA Status</span>
                <strong>
                    ${operation.sla_status || "-"}
                </strong>
            </div>

            <div class="detail-item">
                <span>Risk</span>
                <strong>
                    ${operation.operational_risk || "-"}
                </strong>
            </div>

            <div class="detail-item">
                <span>Risk Score</span>
                <strong>
                    ${operation.risk_score || "0"}
                </strong>
            </div>

        </div>


        <div class="panel lifecycle-panel">

            <div class="panel-header">

                <div>
                    <h2>Lifecycle Progress</h2>
                    <p>
                        Current position within the transfer workflow
                    </p>
                </div>

            </div>

            <div class="lifecycle-flow">
                ${lifecycleHTML}
            </div>

        </div>


        <div class="panel">

            <div class="panel-header">

                <div>
                    <h2>Risk Drivers</h2>
                    <p>
                        Factors contributing to the operational risk
                    </p>
                </div>

            </div>

            <div class="risk-drivers">
                ${formatRiskDrivers(operation)}
            </div>

        </div>

    `;


    panel.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


// ============================================================
// BUTTONS
// ============================================================

document
    .getElementById("closeDetails")
    .addEventListener("click", () => {

        document
            .getElementById("operationDetails")
            .classList.add("hidden");
    });


document
    .getElementById("showAllBtn")
    .addEventListener("click", () => {

        renderAllHighRiskOperations();
    });


// ============================================================
// SHOW ALL HIGH RISK
// ============================================================

function renderAllHighRiskOperations() {

    const table =
        document.getElementById("criticalTable");

    table.innerHTML = "";


    const operations = allOperations
        .filter(row =>
            ["Critical", "High"].includes(
                row.operational_risk
            )
        )
        .sort((a, b) =>
            parseFloat(b.risk_score || 0) -
            parseFloat(a.risk_score || 0)
        );


    operations.forEach(operation => {

        const row = document.createElement("tr");

        row.addEventListener(
            "click",
            () => showOperationDetails(operation)
        );


        row.innerHTML = `

            <td>
                <strong>${operation.transfer_id}</strong>
            </td>

            <td>
                ${operation.asset_name || "-"}
                <br>
                <small>${operation.ticker || ""}</small>
            </td>

            <td>
                ${formatCurrency(operation.requested_value)}
            </td>

            <td>
                ${operation.current_stage || "-"}
            </td>

            <td>
                <span class="badge ${
                    operation.sla_status === "Outside SLA"
                        ? "badge-sla"
                        : "badge-low"
                }">
                    ${operation.sla_status || "-"}
                </span>
            </td>

            <td>
                <span class="badge ${
                    operation.operational_risk === "Critical"
                        ? "badge-critical"
                        : "badge-high"
                }">
                    ${operation.operational_risk}
                </span>
            </td>

            <td>
                ${getPrimaryDriver(operation)}
            </td>
        `;


        table.appendChild(row);
    });
}


// ============================================================
// HELPERS
// ============================================================

function formatCurrency(value) {

    const number = parseFloat(value || 0);

    return currencyFormatter.format(number);
}


function formatCompactCurrency(value) {

    if (value >= 1000000000) {
        return "$" + (value / 1000000000).toFixed(1) + "B";
    }

    if (value >= 1000000) {
        return "$" + (value / 1000000).toFixed(1) + "M";
    }

    if (value >= 1000) {
        return "$" + (value / 1000).toFixed(1) + "K";
    }

    return currencyFormatter.format(value);
}


function getPrimaryDriver(operation) {

    if (
        operation.risk_drivers &&
        operation.risk_drivers.trim()
    ) {

        return operation.risk_drivers
            .split("|")[0]
            .trim();
    }


    if (
        operation.exception_type &&
        operation.exception_type !== "None"
    ) {

        return operation.exception_type;
    }


    return "-";
}


function formatRiskDrivers(operation) {

    if (    
        !operation.risk_drivers ||
        !operation.risk_drivers.trim()
    ) {

        return "<p>No risk drivers identified.</p>";
    }


    return operation.risk_drivers
        .split("|")
        .map(driver => `
            <span class="badge badge-critical">
                ${driver.trim()}
            </span>
        `)
        .join(" ");
}


// ============================================================
// START
// ============================================================

loadData();
