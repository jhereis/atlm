
import random
from datetime import datetime, timedelta
from pathlib import Path

import numpy as np
import pandas as pd


# ============================================================
# CONFIGURATION
# ============================================================

NUM_TRANSFERS = 500
RANDOM_SEED = 42

random.seed(RANDOM_SEED)
np.random.seed(RANDOM_SEED)


# ============================================================
# REFERENCE DATA
# ============================================================

ASSETS = {
    "Equities": [
        ("Apple Inc.", "AAPL"),
        ("Microsoft Corp.", "MSFT"),
        ("Amazon.com Inc.", "AMZN"),
        ("NVIDIA Corp.", "NVDA"),
        ("Alphabet Inc.", "GOOGL"),
    ],
    "ETFs": [
        ("SPDR S&P 500 ETF", "SPY"),
        ("Invesco QQQ", "QQQ"),
        ("iShares MSCI Brazil ETF", "EWZ"),
    ],
    "Bonds": [
        ("US Treasury 10Y", "UST10Y"),
        ("US Treasury 5Y", "UST5Y"),
        ("Brazilian Government Bond", "BRGOV"),
    ],
    "Funds": [
        ("Global Equity Fund", "GEF"),
        ("Global Fixed Income Fund", "GIF"),
        ("Emerging Markets Fund", "EMF"),
    ],
}

CUSTODIANS = [
    "J.P. Morgan",
    "BNY Mellon",
    "State Street",
    "Northern Trust",
    "Itaú Custódia",
]

TRANSFER_TYPES = [
    "Internal",
    "External",
]

TRANSFER_DIRECTIONS = [
    "Inbound",
    "Outbound",
]

STAGES = [
    "Requested",
    "Validation",
    "Approval",
    "Registered",
    "Sent to Custodian",
    "In Transit",
    "Settlement",
    "Reconciliation",
    "Completed",
]

TEAMS = [
    "Transfers",
    "Settlement",
    "Reconciliation",
    "Custody Operations",
]

PRIORITIES = [
    "Low",
    "Medium",
    "High",
]

EXCEPTION_TYPES = [
    "Missing Documentation",
    "Account Mismatch",
    "Custodian Rejection",
    "Quantity Difference",
    "Value Difference",
    "Settlement Delay",
]


# ============================================================
# HELPERS
# ============================================================

def random_date(start_date, end_date):
    """Generate a random date between two dates."""
    delta = end_date - start_date
    return start_date + timedelta(days=random.randint(0, delta.days))


def choose_asset():
    """Select an asset category and asset."""
    asset_type = random.choice(list(ASSETS.keys()))
    asset_name, ticker = random.choice(ASSETS[asset_type])

    return asset_type, asset_name, ticker


def generate_quantity(asset_type):
    """Generate a realistic synthetic quantity."""
    if asset_type == "Bonds":
        return random.randint(10, 500)

    if asset_type == "Funds":
        return random.randint(50, 5000)

    return random.randint(10, 5000)


def calculate_value(quantity, asset_type):
    """Generate a synthetic asset value."""
    price_ranges = {
        "Equities": (50, 500),
        "ETFs": (50, 600),
        "Bonds": (900, 1100),
        "Funds": (20, 200),
    }

    min_price, max_price = price_ranges[asset_type]
    price = random.uniform(min_price, max_price)

    return round(quantity * price, 2)


# ============================================================
# GENERATE TRANSFERS
# ============================================================

def generate_transfers():
    transfers = []

    start_date = datetime(2026, 8, 1)
    end_date = datetime(2026, 9, 15)

    for i in range(1, NUM_TRANSFERS + 1):

        transfer_id = f"AT{i:05d}"
        client_id = f"CL{random.randint(10000, 99999)}"

        asset_type, asset_name, ticker = choose_asset()

        quantity_requested = generate_quantity(asset_type)
        requested_value = calculate_value(
            quantity_requested,
            asset_type
        )

        origin_custodian = random.choice(CUSTODIANS)

        destination_custodian = random.choice(
            [c for c in CUSTODIANS if c != origin_custodian]
        )

        transfer_type = random.choice(TRANSFER_TYPES)
        transfer_direction = random.choice(TRANSFER_DIRECTIONS)

        request_date = random_date(start_date, end_date)

        expected_settlement_date = (
            request_date + timedelta(days=random.randint(1, 5))
        )

        # Most transfers complete successfully.
        status_probability = random.random()

        if status_probability < 0.70:
            current_stage = "Completed"
            status = "Completed"

            actual_settlement_date = expected_settlement_date + timedelta(
                days=random.choice([0, 0, 0, 1])
            )

            quantity_received = quantity_requested
            settled_value = requested_value

        elif status_probability < 0.90:
            current_stage = random.choice([
                "Validation",
                "Approval",
                "Registered",
                "Sent to Custodian",
                "In Transit",
                "Settlement",
                "Reconciliation",
            ])

            status = "In Progress"

            actual_settlement_date = None

            quantity_received = quantity_requested
            settled_value = requested_value

        else:
            current_stage = random.choice([
                "Validation",
                "Approval",
                "Sent to Custodian",
                "Settlement",
                "Reconciliation",
            ])

            status = "Exception"

            actual_settlement_date = None

            quantity_received = quantity_requested
            settled_value = requested_value

        documentation_complete = random.random() > 0.08

        exception_flag = False
        exception_type = None

        # Introduce operational exceptions.
        if status == "Exception":

            exception_flag = True
            exception_type = random.choice(EXCEPTION_TYPES)

            if exception_type == "Quantity Difference":
                quantity_received = max(
                    0,
                    quantity_requested - random.randint(1, 50)
                )

            elif exception_type == "Value Difference":
                settled_value = round(
                    requested_value * random.uniform(0.90, 0.99),
                    2
                )

            elif exception_type == "Missing Documentation":
                documentation_complete = False

        # Additional documentation exception.
        if not documentation_complete and not exception_flag:
            exception_flag = True
            exception_type = "Missing Documentation"
            status = "Exception"

        # Priority
        if exception_flag:
            priority = random.choice(["High", "High", "Medium"])
        else:
            priority = random.choice(PRIORITIES)

        responsible_team = random.choice(TEAMS)

        transfers.append({
            "transfer_id": transfer_id,
            "client_id": client_id,
            "asset_type": asset_type,
            "asset_name": asset_name,
            "ticker": ticker,
            "quantity_requested": quantity_requested,
            "quantity_received": quantity_received,
            "requested_value": requested_value,
            "settled_value": round(settled_value, 2),
            "origin_custodian": origin_custodian,
            "destination_custodian": destination_custodian,
            "transfer_type": transfer_type,
            "transfer_direction": transfer_direction,
            "request_date": request_date.date(),
            "expected_settlement_date": expected_settlement_date.date(),
            "actual_settlement_date": (
                actual_settlement_date.date()
                if actual_settlement_date
                else None
            ),
            "current_stage": current_stage,
            "status": status,
            "priority": priority,
            "responsible_team": responsible_team,
            "documentation_complete": documentation_complete,
            "exception_flag": exception_flag,
            "exception_type": exception_type,
        })

    return pd.DataFrame(transfers)


# ============================================================
# SAVE DATA
# ============================================================

def main():

    df = generate_transfers()

    output_dir = Path("data/raw")
    output_dir.mkdir(parents=True, exist_ok=True)

    output_file = output_dir / "asset_transfers_raw.csv"

    df.to_csv(output_file, index=False)

    print("=" * 60)
    print("Asset Transfer Lifecycle Management")
    print("=" * 60)
    print(f"Transfers generated: {len(df)}")
    print(f"Output file: {output_file}")
    print()
    print("Status distribution:")
    print(df["status"].value_counts())
    print()
    print("Exception distribution:")
    print(df["exception_type"].value_counts(dropna=False))
    print()
    print("Total requested value:")
    print(f"${df['requested_value'].sum():,.2f}")
    print("=" * 60)


if __name__ == "__main__":
    main()
