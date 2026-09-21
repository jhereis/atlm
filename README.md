# Asset Transfer Lifecycle Management

## Overview

**Asset Transfer Lifecycle Management** is a financial operations
control solution designed to monitor asset transfers from request
initiation through settlement and reconciliation.

The project was developed to simulate a real-world operational
environment where teams need visibility into:

-   Where each transfer is in its lifecycle
-   Which operations are pending or delayed
-   Which transfers are outside their SLA
-   Which operations have exceptions
-   Which transfers present higher operational risk
-   Whether the quantity and financial value received match the expected
    values
-   Which operations require immediate intervention

The solution combines **Python, Pandas, SQL, SQLite, JavaScript and
Chart.js** to transform operational data into an actionable control
layer.

------------------------------------------------------------------------

## Business Problem

Asset transfers involve several operational stages and can depend on
multiple teams, custodians, validations and settlement processes.

Without centralized monitoring, an operations team may have difficulty
answering questions such as:

> Where is the transfer currently stuck?

> Is the operation still within its expected SLA?

> Is there an exception preventing completion?

> Is there a reconciliation difference?

> Which operations should be prioritized?

This project addresses that problem by creating a centralized lifecycle
view with operational controls, SLA monitoring, reconciliation checks
and risk prioritization.

------------------------------------------------------------------------

## Solution

The solution follows the transfer lifecycle:

``` text
REQUESTED
    ↓
VALIDATION
    ↓
APPROVAL
    ↓
REGISTERED
    ↓
SENT TO CUSTODIAN
    ↓
IN TRANSIT
    ↓
SETTLEMENT
    ↓
RECONCILIATION
    ↓
COMPLETED
```

Exceptions can occur throughout the process, including:

-   Missing Documentation
-   Account Mismatch
-   Custodian Rejection
-   Quantity Difference
-   Value Difference
-   Settlement Delay

The system identifies these conditions and incorporates them into the
operational risk assessment.

------------------------------------------------------------------------

## Project Architecture

``` text
Synthetic Operational Data
          │
          ▼
    Data Generation
       Python
          │
          ▼
     Lifecycle Engine
          │
          ├── SLA calculation
          ├── Lifecycle status
          ├── Reconciliation status
          └── Operational risk
          │
          ▼
    Reconciliation Engine
          │
          ├── Quantity differences
          ├── Value differences
          └── Reconciliation result
          │
          ▼
       Risk Engine
          │
          ├── Risk score
          ├── Risk level
          └── Risk drivers
          │
          ▼
      SQLite Database
          │
          ▼
     SQL KPI Layer
          │
          ▼
   Operational Dashboard
     JavaScript + Chart.js
```

------------------------------------------------------------------------

## Technology Stack

  Technology   Purpose
  ------------ --------------------------------------------
  Python       Data generation and operational processing
  Pandas       Data transformation and analysis
  NumPy        Synthetic data generation
  SQLite       Operational data storage
  SQL          KPI and operational analysis
  JavaScript   Dashboard logic
  Chart.js     Data visualization
  PapaParse    CSV data ingestion
  HTML/CSS     Dashboard interface
  Git/GitHub   Version control and portfolio delivery

------------------------------------------------------------------------

## Data Pipeline

### 1. Synthetic Data Generation

The project generates a dataset containing **500 synthetic asset
transfer operations**.

Each transfer includes operational information such as:

-   Transfer ID
-   Client ID
-   Asset
-   Ticker
-   Quantity requested
-   Quantity received
-   Requested value
-   Settled value
-   Origin custodian
-   Destination custodian
-   Transfer type
-   Transfer direction
-   Request date
-   Expected settlement date
-   Actual settlement date
-   Current lifecycle stage
-   Status
-   Priority
-   Responsible team
-   Documentation status
-   Exception type

The dataset is synthetic and does not contain real client or operational
information.

------------------------------------------------------------------------

### 2. Lifecycle Engine

The lifecycle engine enriches the raw operational data with control
fields.

It calculates:

-   `lifecycle_status`
-   `sla_days`
-   `elapsed_days`
-   `sla_status`
-   `reconciliation_status`
-   `operational_risk`

SLA rules currently use:

``` text
Internal Transfer → 2 days
External Transfer → 5 days
```

The reference date used by the project is:

``` text
2026-09-19
```

------------------------------------------------------------------------

### 3. Reconciliation Engine

The reconciliation layer independently checks whether the expected and
received values are aligned.

It identifies:

-   Quantity differences
-   Value differences
-   Overall reconciliation result
-   Reconciliation severity

A value tolerance of:

``` text
$10.00
```

is currently applied to value reconciliation.

------------------------------------------------------------------------

### 4. Risk Engine

The risk engine assigns a score to each transfer based on operational
conditions.

Current scoring rules:

  Risk Driver                   Score
  --------------------------- -------
  SLA breach                      +30
  Operational exception           +25
  Reconciliation difference       +30
  High priority                   +15

Risk levels:

``` text
70+  → Critical
45+  → High
25+  → Medium
<25  → Low
```

The system also records the factors contributing to each risk
classification through the `risk_drivers` field.

------------------------------------------------------------------------

## Current Dataset Results

The current synthetic dataset contains:

  Indicator                    Result
  ----------------------- -----------
  Total transfers                 500
  Completed                       322
  In Progress                      93
  Exceptions                       85
  Within SLA                      327
  Outside SLA                     173
  Critical Risk                    81
  High Risk                        96
  Medium Risk                     124
  Low Risk                        199
  Total requested value     \$256.64M

### Exception Distribution

  Exception                 Operations
  ----------------------- ------------
  Missing Documentation             39
  Custodian Rejection               11
  Quantity Difference               10
  Value Difference                   9
  Settlement Delay                   8
  Account Mismatch                   8

### Reconciliation Results

The reconciliation engine identified:

-   **10 quantity differences**
-   **9 value differences**
-   **\$458,346.45** in total value differences

------------------------------------------------------------------------

## Operational Dashboard

The dashboard is designed around the operational lifecycle rather than
only displaying generic financial KPIs.

### Main KPIs

-   Total Transfers
-   Pending Transfers
-   Outside SLA
-   Exceptions
-   Critical Risk
-   Total Asset Value

### Lifecycle Monitoring

The dashboard visualizes the current distribution of transfers across:

``` text
Requested
Validation
Approval
Registered
Sent to Custodian
In Transit
Settlement
Reconciliation
Completed
```

This helps an operations user quickly identify where transfers are
accumulating.

### SLA Monitoring

The dashboard separates:

-   Transfers within SLA
-   Transfers outside SLA

This provides a direct view of operations requiring attention.

### Risk Monitoring

Transfers are classified as:

-   Low
-   Medium
-   High
-   Critical

The dashboard also displays the primary drivers behind the risk
classification.

### Critical Operations

The dashboard provides a table of high-priority operations containing:

-   Transfer ID
-   Asset
-   Financial value
-   Current stage
-   SLA status
-   Risk level
-   Risk driver

Selecting an operation opens its detailed lifecycle and operational
information.

------------------------------------------------------------------------

## SQL Control Layer

The project also includes an SQL KPI layer with queries covering:

-   Total transfers
-   Lifecycle distribution
-   SLA performance
-   Exception distribution
-   Risk distribution
-   Critical operations
-   Total financial value
-   Value outside SLA
-   Financial value associated with exceptions
-   Reconciliation differences
-   Differences by destination custodian
-   Lifecycle bottlenecks
-   Custodian volumes
-   Team performance
-   High-risk operations
-   Risk by lifecycle stage
-   Average processing time
-   Pending reconciliations

This allows the same operational dataset to be analyzed independently
from the dashboard.

------------------------------------------------------------------------

## Project Structure

``` text
asset-transfer-lifecycle/
│
├── data/
│   ├── raw/
│   │   └── asset_transfers_raw.csv
│   │
│   └── processed/
│       ├── asset_transfers_enriched.csv
│       ├── asset_transfers_reconciled.csv
│       └── asset_transfers_final.csv
│
├── src/
│   ├── generate_data.py
│   ├── lifecycle_engine.py
│   ├── reconciliation.py
│   ├── risk_engine.py
│   └── load_database.py
│
├── sql/
│   └── kpi_queries.sql
│
├── dashboard/
│   ├── index.html
│   ├── dashboard.js
│   └── style.css
│
├── data/
│   └── asset_transfer_lifecycle.db
│
├── requirements.txt
├── .gitignore
└── README.md
```

------------------------------------------------------------------------

## How to Run

### 1. Clone the repository

``` bash
git clone <repository-url>
cd asset-transfer-lifecycle
```

### 2. Create the virtual environment

``` bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install dependencies

``` bash
pip install -r requirements.txt
```

### 4. Generate the operational dataset

``` bash
python src/generate_data.py
```

### 5. Run the lifecycle engine

``` bash
python src/lifecycle_engine.py
```

### 6. Run reconciliation

``` bash
python src/reconciliation.py
```

### 7. Run the risk engine

``` bash
python src/risk_engine.py
```

### 8. Load the SQLite database

``` bash
python src/load_database.py
```

### 9. Run the SQL KPI layer

``` bash
sqlite3 data/asset_transfer_lifecycle.db < sql/kpi_queries.sql
```

### 10. Start the dashboard locally

Because the dashboard loads the CSV through JavaScript, use a local HTTP
server instead of opening the HTML file directly.

From the project root:

``` bash
python -m http.server 8000
```

Then open:

``` text
http://localhost:8000/dashboard/
```

------------------------------------------------------------------------

## Operational Use Case

The main purpose of the solution is to provide an operational control
layer for asset transfers.

Instead of relying on multiple spreadsheets or manually checking
individual operations, an operations analyst can use the solution to
identify:

1.  **Where the operation is in the lifecycle**
2.  **Whether it is within SLA**
3.  **Whether an exception exists**
4.  **Whether reconciliation has been completed**
5.  **What the operational risk level is**
6.  **Why the operation was classified as high risk**
7.  **Which operations should receive attention first**

The project therefore connects **data processing with operational
decision support**.

------------------------------------------------------------------------

## Why I Built This Project

I developed this project based on an operational perspective: problems
in financial operations are not always caused by the execution of a
transaction itself. A significant challenge can be the lack of
visibility into the current stage of an operation, the next required
action, the SLA status and the exceptions preventing completion.

The objective was to transform this operational challenge into a
practical data solution.

The project demonstrates how I can combine:

**Operational knowledge + Data Engineering + SQL + Automation + Control
Frameworks**

to create a solution focused on transparency, exception management and
process reliability.

------------------------------------------------------------------------

## Interview Discussion

A concise way to explain the project during an interview is:

> **"I developed a solution to monitor the full lifecycle of asset
> transfers, from request initiation to settlement and reconciliation.
> The system uses Python and SQL to process operational data, calculate
> SLA status, identify reconciliation differences and classify
> operational risk. I then built a dashboard that provides visibility
> into where each operation is in the lifecycle, which transfers require
> attention and what the main risk drivers are."**

A second point I would highlight is the operational rationale:

> **"I wanted the project to go beyond a dashboard. The goal was to
> reproduce an operational control process, where the analyst can
> identify pending steps, SLA breaches, exceptions and reconciliation
> differences, and use that information to prioritize intervention."**

------------------------------------------------------------------------

## Key Takeaways

This project demonstrates practical experience with:

-   Financial operations workflows
-   Asset transfer lifecycle management
-   Post-trade operational controls
-   SLA monitoring
-   Exception management
-   Reconciliation
-   Operational risk scoring
-   Data transformation
-   SQL analytics
-   SQLite
-   Dashboard development
-   Process automation concepts

------------------------------------------------------------------------

## Disclaimer

This project uses entirely synthetic data created for educational and
portfolio purposes.

No real client information, proprietary operational data or confidential
financial information is used.
