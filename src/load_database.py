import sqlite3
from pathlib import Path

import pandas as pd


# ============================================================
# CONFIGURATION
# ============================================================

INPUT_FILE = Path(
    "data/processed/asset_transfers_final.csv"
)

DATABASE_FILE = Path(
    "data/asset_transfer_lifecycle.db"
)

TABLE_NAME = "asset_transfers"


# ============================================================
# LOAD DATA
# ============================================================

def load_data():
    return pd.read_csv(INPUT_FILE)


# ============================================================
# CREATE DATABASE
# ============================================================

def create_database(df):

    DATABASE_FILE.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    connection = sqlite3.connect(
        DATABASE_FILE
    )

    df.to_sql(
        TABLE_NAME,
        connection,
        if_exists="replace",
        index=False,
    )

    connection.close()


# ============================================================
# VALIDATE DATABASE
# ============================================================

def validate_database():

    connection = sqlite3.connect(
        DATABASE_FILE
    )

    query = f"""
        SELECT COUNT(*) AS total_transfers
        FROM {TABLE_NAME}
    """

    result = pd.read_sql_query(
        query,
        connection,
    )

    connection.close()

    return result.iloc[0]["total_transfers"]


# ============================================================
# MAIN
# ============================================================

def main():

    df = load_data()

    create_database(df)

    total = validate_database()

    print("=" * 60)
    print("Asset Transfer Lifecycle Database")
    print("=" * 60)

    print(f"Records loaded: {len(df)}")
    print(f"Database: {DATABASE_FILE}")
    print(f"Table: {TABLE_NAME}")
    print(f"Validated records: {int(total)}")

    print("=" * 60)


if __name__ == "__main__":
    main()


