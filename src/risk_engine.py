from pathlib import Path

import pandas as pd


# ============================================================
# CONFIGURATION
# ============================================================

INPUT_FILE = Path(
    "data/processed/asset_transfers_reconciled.csv"
)

OUTPUT_FILE = Path(
    "data/processed/asset_transfers_final.csv"
)


# ============================================================
# LOAD DATA
# ============================================================

def load_data():
    return pd.read_csv(INPUT_FILE)


# ============================================================
# RISK SCORE
# ============================================================

def calculate_risk_score(row):
    score = 0

    # SLA breach
    if row["sla_status"] == "Outside SLA":
        score += 30

    # Operational exception
    if row["exception_flag"]:
        score += 25

    # Reconciliation difference
    if row["reconciliation_result"] != "Matched":
        score += 30

    # Operational priority
    if row["priority"] == "High":
        score += 15

    return score


# ============================================================
# RISK DRIVERS
# ============================================================

def identify_risk_drivers(row):

    drivers = []

    if row["sla_status"] == "Outside SLA":
        drivers.append("SLA Breach")

    if row["exception_flag"]:
        exception = row["exception_type"]

        if pd.notna(exception):
            drivers.append(str(exception))
        else:
            drivers.append("Operational Exception")

    if row["reconciliation_result"] != "Matched":

        reconciliation = row["reconciliation_result"]

        # Avoid duplicating the same reason already
        # identified by the operational exception.
        if reconciliation not in drivers:
            drivers.append(reconciliation)

    if row["priority"] == "High":
        drivers.append("High Priority")

    if not drivers:
        drivers.append("No Active Risk")

    return " | ".join(drivers)

# ============================================================
# RISK LEVEL
# ============================================================

def classify_risk(score):

    if score >= 70:
        return "Critical"

    if score >= 45:
        return "High"

    if score >= 25:
        return "Medium"

    return "Low"


# ============================================================
# RISK ENGINE
# ============================================================

def apply_risk_engine(df):

    df["risk_score"] = df.apply(
        calculate_risk_score,
        axis=1,
    )

    df["risk_drivers"] = df.apply(
        identify_risk_drivers,
        axis=1,
    )

    df["final_risk_level"] = df["risk_score"].apply(
        classify_risk
    )

    return df


# ============================================================
# SAVE
# ============================================================

def main():

    df = load_data()

    df = apply_risk_engine(df)

    OUTPUT_FILE.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    df.to_csv(
        OUTPUT_FILE,
        index=False,
    )

    print("=" * 60)
    print("Risk Engine")
    print("=" * 60)

    print(f"Operations analyzed: {len(df)}")
    print(f"Output file: {OUTPUT_FILE}")

    print()
    print("Risk level:")
    print(
        df["final_risk_level"]
        .value_counts()
    )

    print()
    print("Risk score:")
    print(
        df["risk_score"]
        .describe()
        .round(2)
    )

    print()
    print("Top 10 highest-risk transfers:")

    top_risk = (
        df[
            [
                "transfer_id",
                "risk_score",
                "final_risk_level",
                "risk_drivers",
            ]
        ]
        .sort_values(
            "risk_score",
            ascending=False,
        )
        .head(10)
    )

    print(top_risk.to_string(index=False))

    print("=" * 60)


if __name__ == "__main__":
    main()
