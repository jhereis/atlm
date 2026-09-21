from pathlib import Path

import pandas as pd


# ============================================================
# CONFIGURATION
# ============================================================

INPUT_FILE = Path("data/raw/asset_transfers_raw.csv")
OUTPUT_FILE = Path("data/processed/asset_transfers_enriched.csv")

REFERENCE_DATE = pd.Timestamp("2026-09-19")


# ============================================================
# SLA RULES
# ============================================================

SLA_BY_TRANSFER_TYPE = {
    "Internal": 2,
    "External": 5,
}


# ============================================================
# LOAD DATA
# ============================================================

def load_data():
    df = pd.read_csv(
        INPUT_FILE,
        parse_dates=[
            "request_date",
            "expected_settlement_date",
            "actual_settlement_date",
        ],
    )

    return df


# ============================================================
# LIFECYCLE STATUS
# ============================================================

def calculate_lifecycle_status(row):

    if row["status"] == "Completed":
        return "Completed"

    if row["exception_flag"]:
        return "Exception"

    if row["current_stage"] in [
        "Validation",
        "Approval",
    ]:
        return "Pending Approval"

    if row["current_stage"] in [
        "Registered",
        "Sent to Custodian",
        "In Transit",
    ]:
        return "In Transit"

    if row["current_stage"] == "Settlement":
        return "Pending Settlement"

    if row["current_stage"] == "Reconciliation":
        return "Pending Reconciliation"

    return "In Progress"


# ============================================================
# SLA
# ============================================================

def calculate_sla(df):

    df["sla_days"] = df["transfer_type"].map(
        SLA_BY_TRANSFER_TYPE
    )

    df["elapsed_days"] = (
        REFERENCE_DATE - df["request_date"]
    ).dt.days

    df["sla_status"] = "Within SLA"

    active_operations = df["status"] != "Completed"

    df.loc[
        active_operations
        & (df["elapsed_days"] > df["sla_days"]),
        "sla_status"
    ] = "Outside SLA"

    return df


# ============================================================
# RECONCILIATION STATUS
# ============================================================

def calculate_reconciliation(row):

    if row["status"] != "Completed":
        return "Pending"

    quantity_match = (
        row["quantity_requested"]
        == row["quantity_received"]
    )

    value_match = (
        abs(
            row["requested_value"]
            - row["settled_value"]
        )
        <= 0.01
    )

    if quantity_match and value_match:
        return "Matched"

    return "Difference"


# ============================================================
# RISK
# ============================================================

def calculate_risk(row):

    if (
        row["sla_status"] == "Outside SLA"
        and row["exception_flag"]
    ):
        return "Critical"

    if row["exception_flag"]:
        return "High"

    if row["sla_status"] == "Outside SLA":
        return "High"

    if row["priority"] == "High":
        return "Medium"

    return "Low"


# ============================================================
# MAIN ENGINE
# ============================================================

def enrich_operations(df):

    df["lifecycle_status"] = df.apply(
        calculate_lifecycle_status,
        axis=1,
    )

    df = calculate_sla(df)

    df["reconciliation_status"] = df.apply(
        calculate_reconciliation,
        axis=1,
    )

    df["operational_risk"] = df.apply(
        calculate_risk,
        axis=1,
    )

    return df


# ============================================================
# SAVE
# ============================================================

def main():

    df = load_data()

    df = enrich_operations(df)

    OUTPUT_FILE.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    df.to_csv(
        OUTPUT_FILE,
        index=False,
    )

    print("=" * 60)
    print("Lifecycle Engine")
    print("=" * 60)

    print(f"Operations processed: {len(df)}")
    print(f"Output file: {OUTPUT_FILE}")

    print()
    print("Lifecycle status:")
    print(
        df["lifecycle_status"]
        .value_counts()
    )

    print()
    print("SLA status:")
    print(
        df["sla_status"]
        .value_counts()
    )

    print()
    print("Reconciliation:")
    print(
        df["reconciliation_status"]
        .value_counts()
    )

    print()
    print("Operational risk:")
    print(
        df["operational_risk"]
        .value_counts()
    )

    print("=" * 60)


if __name__ == "__main__":
    main()
