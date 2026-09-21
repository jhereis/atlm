from pathlib import Path

import pandas as pd


# ============================================================
# CONFIGURATION
# ============================================================

INPUT_FILE = Path(
    "data/processed/asset_transfers_enriched.csv"
)

OUTPUT_FILE = Path(
    "data/processed/asset_transfers_reconciled.csv"
)

VALUE_TOLERANCE = 10.00


# ============================================================
# LOAD DATA
# ============================================================

def load_data():
    return pd.read_csv(
        INPUT_FILE,
        parse_dates=[
            "request_date",
            "expected_settlement_date",
            "actual_settlement_date",
        ],
    )


# ============================================================
# QUANTITY RECONCILIATION
# ============================================================

def calculate_quantity_difference(df):

    df["quantity_difference"] = (
        df["quantity_requested"]
        - df["quantity_received"]
    ).abs()

    df["quantity_reconciliation"] = "Matched"

    df.loc[
        df["quantity_difference"] > 0,
        "quantity_reconciliation"
    ] = "Difference"

    return df


# ============================================================
# VALUE RECONCILIATION
# ============================================================

def calculate_value_difference(df):

    df["value_difference"] = (
        df["requested_value"]
        - df["settled_value"]
    ).abs()

    df["value_reconciliation"] = "Matched"

    df.loc[
        df["value_difference"] > VALUE_TOLERANCE,
        "value_reconciliation"
    ] = "Difference"

    return df


# ============================================================
# OVERALL RECONCILIATION
# ============================================================

def calculate_overall_reconciliation(df):

    df["reconciliation_result"] = "Matched"

    quantity_difference = (
        df["quantity_reconciliation"] == "Difference"
    )

    value_difference = (
        df["value_reconciliation"] == "Difference"
    )

    df.loc[
        quantity_difference & value_difference,
        "reconciliation_result"
    ] = "Quantity + Value Difference"

    df.loc[
        quantity_difference & ~value_difference,
        "reconciliation_result"
    ] = "Quantity Difference"

    df.loc[
        ~quantity_difference & value_difference,
        "reconciliation_result"
    ] = "Value Difference"

    return df


# ============================================================
# RECONCILIATION SEVERITY
# ============================================================

def calculate_reconciliation_severity(row):

    result = row["reconciliation_result"]

    if result == "Quantity + Value Difference":
        return "High"

    if result == "Quantity Difference":
        return "High"

    if result == "Value Difference":
        return "Medium"

    return "None"


# ============================================================
# MAIN ENGINE
# ============================================================

def reconcile_operations(df):

    df = calculate_quantity_difference(df)

    df = calculate_value_difference(df)

    df = calculate_overall_reconciliation(df)

    df["reconciliation_severity"] = df.apply(
        calculate_reconciliation_severity,
        axis=1,
    )

    return df


# ============================================================
# SAVE
# ============================================================

def main():

    df = load_data()

    df = reconcile_operations(df)

    OUTPUT_FILE.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    df.to_csv(
        OUTPUT_FILE,
        index=False,
    )

    print("=" * 60)
    print("Reconciliation Engine")
    print("=" * 60)

    print(f"Operations analyzed: {len(df)}")
    print(f"Output file: {OUTPUT_FILE}")

    print()
    print("Quantity reconciliation:")
    print(
        df["quantity_reconciliation"]
        .value_counts()
    )

    print()
    print("Value reconciliation:")
    print(
        df["value_reconciliation"]
        .value_counts()
    )

    print()
    print("Overall reconciliation:")
    print(
        df["reconciliation_result"]
        .value_counts()
    )

    print()
    print("Reconciliation severity:")
    print(
        df["reconciliation_severity"]
        .value_counts()
    )

    print()
    print("Total quantity difference:")
    print(
        f"{df['quantity_difference'].sum():,.0f}"
    )

    print()
    print("Total value difference:")
    print(
        f"${df['value_difference'].sum():,.2f}"
    )

    print("=" * 60)


if __name__ == "__main__":
    main()
