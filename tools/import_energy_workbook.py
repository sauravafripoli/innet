from pathlib import Path
import sqlite3
import pandas as pd
import sys


# ============================================================
# INETT ENERGY DATA IMPORTER
# Phase 1 - Energy
#
# Source:
# Google Sheets workbook exported as .xlsx
#
# Destination:
# SQLite energy.db
#
# Behaviour:
# - Core/master-table failures stop the import.
# - Invalid relationship rows are logged and skipped.
# - Database changes occur inside one transaction.
# ============================================================


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

INPUT_DIR = BASE_DIR / "tools" / "input"

DATABASE_PATH = (
    BASE_DIR
    / "energy-data"
    / "energy.db"
)


# ============================================================
# ERROR / WARNING STORAGE
# ============================================================

errors = []


def log_error(category, message):
    """
    Store non-fatal data-quality warnings.

    These are primarily used for relationship rows where
    a referenced master record does not exist.
    """

    errors.append({
        "category": category,
        "message": message
    })


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def clean_value(value):
    """
    Normalise spreadsheet values.

    - Excel blanks / NaN -> None
    - Timestamp -> YYYY-MM-DD
    - Strings -> trimmed
    """

    if pd.isna(value):
        return None

    if isinstance(value, pd.Timestamp):
        return value.strftime("%Y-%m-%d")

    if isinstance(value, str):
        value = value.strip()

        if value == "":
            return None

        return value

    return value


def to_int(value):
    """
    Convert values to integer where possible.

    Examples:
    2025
    2025.0
    "2025"

    become:
    2025
    """

    value = clean_value(value)

    if value is None:
        return None

    try:
        return int(float(value))

    except (ValueError, TypeError):
        return None


def to_float(value):
    """
    Convert spreadsheet values to float.
    """

    value = clean_value(value)

    if value is None:
        return None

    try:
        return float(value)

    except (ValueError, TypeError):
        return None


def to_boolean(value):
    """
    Convert common spreadsheet boolean values to SQLite 1/0.
    """

    value = clean_value(value)

    if value is None:
        return 0

    if isinstance(value, bool):
        return 1 if value else 0

    text = str(value).strip().lower()

    true_values = {
        "yes",
        "y",
        "true",
        "1",
        "eligible"
    }

    return 1 if text in true_values else 0


def get_sheet(workbook, sheet_name):
    """
    Read a worksheet and clean its column headers.
    """

    dataframe = pd.read_excel(
        workbook,
        sheet_name=sheet_name
    )

    dataframe.columns = [
        str(column).strip()
        for column in dataframe.columns
    ]

    return dataframe


def execute_insert(cursor, sql, values):
    """
    Small wrapper around cursor.execute().
    """

    cursor.execute(sql, values)


# ============================================================
# FIND EXCEL WORKBOOK
# ============================================================

excel_files = list(
    INPUT_DIR.glob("*.xlsx")
)


if not excel_files:

    print("ERROR: No .xlsx workbook found.")
    print()
    print("Expected folder:")
    print(INPUT_DIR)

    sys.exit(1)


if len(excel_files) > 1:

    print("ERROR: More than one .xlsx workbook was found.")
    print()
    print(
        "Keep only the workbook that should "
        "be imported:"
    )

    for file in excel_files:
        print(f" - {file.name}")

    sys.exit(1)


WORKBOOK_PATH = excel_files[0]


# ============================================================
# START
# ============================================================

print()
print("=" * 70)
print("INETT ENERGY DATA IMPORT")
print("=" * 70)

print(
    f"Workbook : {WORKBOOK_PATH.name}"
)

print(
    f"Database : {DATABASE_PATH}"
)

print()


# ============================================================
# CHECK DATABASE
# ============================================================

if not DATABASE_PATH.exists():

    print("ERROR: energy.db does not exist.")
    print()

    print(
        "Create the database from "
        "tools/schema.sql first."
    )

    sys.exit(1)


# ============================================================
# OPEN WORKBOOK
# ============================================================

try:

    workbook = pd.ExcelFile(
        WORKBOOK_PATH
    )

except Exception as exc:

    print(
        "ERROR: Could not open workbook."
    )

    print(exc)

    sys.exit(1)


print(
    "Workbook opened successfully."
)

print(
    f"Sheets found: {len(workbook.sheet_names)}"
)

print()


# ============================================================
# LOAD SOURCE SHEETS
# ============================================================

states_df = get_sheet(
    workbook,
    "02 Ref States"
)

functions_df = get_sheet(
    workbook,
    "03 Ref Functions"
)

actors_df = get_sheet(
    workbook,
    "10 Actors"
)

policies_df = get_sheet(
    workbook,
    "11 Policies"
)

initiatives_df = get_sheet(
    workbook,
    "12 Initiatives"
)

finance_df = get_sheet(
    workbook,
    "13 Finance"
)

targets_df = get_sheet(
    workbook,
    "14 Targets"
)

observations_df = get_sheet(
    workbook,
    "15 Target Observations"
)

sources_df = get_sheet(
    workbook,
    "16 Sources"
)

engagement_df = get_sheet(
    workbook,
    "17 Engagement"
)

initiative_locations_df = get_sheet(
    workbook,
    "20 Initiative Location"
)

initiative_actors_df = get_sheet(
    workbook,
    "21 Initiative Actor"
)

initiative_subsectors_df = get_sheet(
    workbook,
    "22 Initiative Subsector"
)

finance_parties_df = get_sheet(
    workbook,
    "23 Finance Party"
)

actor_functions_df = get_sheet(
    workbook,
    "25 Actor Function"
)

policy_scopes_df = get_sheet(
    workbook,
    "26 Policy Scope"
)


# ============================================================
# DATABASE CONNECTION
# ============================================================

connection = sqlite3.connect(
    DATABASE_PATH
)

connection.execute(
    "PRAGMA foreign_keys = ON;"
)

cursor = connection.cursor()


# ============================================================
# IMPORT COUNTERS
# ============================================================

counts = {}


# ============================================================
# START TRANSACTION
# ============================================================

try:

    print(
        "Starting database import..."
    )

    print()

    connection.execute("BEGIN;")


    # ========================================================
    # CLEAR EXISTING DATA
    #
    # Child/relationship tables must be cleared first.
    # ========================================================

    tables_to_clear = [

        "policy_scopes",

        "actor_functions",

        "finance_parties",

        "initiative_subsectors",

        "initiative_actors",

        "initiative_locations",

        "target_observations",

        "engagement",

        "finance",

        "targets",

        "initiatives",

        "policies",

        "actors",

        "functions",

        "states",

        "sources"
    ]


    for table in tables_to_clear:

        cursor.execute(
            f"DELETE FROM {table};"
        )


    # ========================================================
    # 1. SOURCES
    # ========================================================

    source_count = 0


    for _, row in sources_df.iterrows():

        source_id = clean_value(
            row["Source ID"]
        )

        if not source_id:
            continue


        execute_insert(
            cursor,

            """
            INSERT INTO sources (
                source_id,
                title,
                publisher,
                publication_year,
                source_type,
                source_url,
                notes
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,

            (
                source_id,

                clean_value(
                    row["Title / document"]
                ),

                clean_value(
                    row["Publisher"]
                ),

                to_int(
                    row["Year"]
                ),

                clean_value(
                    row["Source type"]
                ),

                clean_value(
                    row["URL"]
                ),

                clean_value(
                    row["Notes"]
                )
            )
        )


        source_count += 1


    counts["Sources"] = source_count


    # ========================================================
    # 2. STATES
    #
    # Spreadsheet-derived coverage counts are intentionally
    # not imported.
    # ========================================================

    state_count = 0


    for _, row in states_df.iterrows():

        state_code = clean_value(
            row["State code"]
        )

        if not state_code:
            continue


        execute_insert(
            cursor,

            """
            INSERT INTO states (
                state_code,
                state_name,
                geopolitical_zone,
                state_electricity_law_enacted,
                electricity_law_year,
                state_regulator,
                nerc_transfer_order_issued,
                current_regulatory_authority,
                integrated_energy_plan,
                serving_discos,
                electricity_access_rate,
                access_rate_year,
                clean_cooking_access_rate,
                coordination_focal_point,
                notes,
                source_citation,
                source_url,
                source_type
            )
            VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?
            )
            """,

            (
                state_code,

                clean_value(
                    row["State"]
                ),

                clean_value(
                    row["Geopolitical zone"]
                ),

                clean_value(
                    row[
                        "State electricity law enacted"
                    ]
                ),

                to_int(
                    row["Law year"]
                ),

                clean_value(
                    row["State regulator"]
                ),

                clean_value(
                    row[
                        "NERC transfer order issued"
                    ]
                ),

                clean_value(
                    row[
                        "Current regulatory authority"
                    ]
                ),

                clean_value(
                    row[
                        "State integrated energy plan"
                    ]
                ),

                clean_value(
                    row["Serving DisCo(s)"]
                ),

                to_float(
                    row[
                        "Electricity access rate (%)"
                    ]
                ),

                to_int(
                    row["Access rate year"]
                ),

                to_float(
                    row["Clean cooking access (%)"]
                ),

                clean_value(
                    row[
                        "Coordination focal point"
                    ]
                ),

                clean_value(
                    row["Notes"]
                ),

                clean_value(
                    row["Source (citation)"]
                ),

                clean_value(
                    row["Source URL"]
                ),

                clean_value(
                    row["Source type"]
                )
            )
        )


        state_count += 1


    counts["States"] = state_count


    # ========================================================
    # 3. FUNCTIONS
    #
    # Derived mandate counts are intentionally ignored.
    # ========================================================

    function_count = 0


    for _, row in functions_df.iterrows():

        function_id = clean_value(
            row["Function ID"]
        )

        if not function_id:
            continue


        execute_insert(
            cursor,

            """
            INSERT INTO functions (
                function_id,
                function_name,
                primary_subsector,
                typical_value_chain_segment,
                contestation_note
            )
            VALUES (?, ?, ?, ?, ?)
            """,

            (
                function_id,

                clean_value(
                    row["Energy sector function"]
                ),

                clean_value(
                    row["Primary sub-sector"]
                ),

                clean_value(
                    row[
                        "Typical value chain segment"
                    ]
                ),

                clean_value(
                    row["Contestation note"]
                )
            )
        )


        function_count += 1


    counts["Functions"] = function_count


    # ========================================================
    # BUILD VALID STATE IDS
    # ========================================================

    valid_state_codes = {
        row[0]
        for row in cursor.execute(
            """
            SELECT state_code
            FROM states
            """
        ).fetchall()
    }


    # ========================================================
    # 4. ACTORS
    # ========================================================

    actor_count = 0


    for _, row in actors_df.iterrows():

        actor_id = clean_value(
            row["Actor ID"]
        )

        if not actor_id:
            continue


        state_code = clean_value(
            row["State code (if sub-national)"]
        )


        # State is optional.
        # If provided, however, it must exist.

        if (
            state_code
            and
            state_code not in valid_state_codes
        ):

            raise Exception(
                f"Actor {actor_id} references "
                f"unknown state {state_code}."
            )


        execute_insert(
            cursor,

            """
            INSERT INTO actors (
                actor_id,
                organisation_name,
                acronym,
                actor_type,
                primary_role,
                subsector_focus,
                mandate_summary,
                governance_tier,
                state_code,
                source_url
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,

            (
                actor_id,

                clean_value(
                    row["Organisation"]
                ),

                clean_value(
                    row["Acronym"]
                ),

                clean_value(
                    row["Actor type"]
                ),

                clean_value(
                    row["Primary role"]
                ),

                clean_value(
                    row["Sub-sector focus"]
                ),

                clean_value(
                    row["Mandate summary"]
                ),

                clean_value(
                    row["Governance tier"]
                ),

                state_code,

                clean_value(
                    row["Source URL"]
                )
            )
        )


        actor_count += 1


    counts["Actors"] = actor_count


    # ========================================================
    # GET VALID ACTOR IDS
    # ========================================================

    valid_actor_ids = {
        row[0]
        for row in cursor.execute(
            """
            SELECT actor_id
            FROM actors
            """
        ).fetchall()
    }


    # ========================================================
    # 5. POLICIES
    # ========================================================

    policy_count = 0


    for _, row in policies_df.iterrows():

        policy_id = clean_value(
            row["Policy ID"]
        )

        if not policy_id:
            continue


        execute_insert(
            cursor,

            """
            INSERT INTO policies (
                policy_id,
                instrument_name,
                short_name,
                instrument_type,
                legal_force,
                governance_tier,
                issuing_institution,
                implementing_institutions,
                status,
                publication_year,
                implementation_mechanism_defined,
                monitoring_evaluation_framework,
                primary_subsector,
                implementation_note,
                source_citation,
                source_url,
                source_type
            )
            VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?
            )
            """,

            (
                policy_id,

                clean_value(
                    row["Instrument name"]
                ),

                clean_value(
                    row["Short name"]
                ),

                clean_value(
                    row["Instrument type"]
                ),

                clean_value(
                    row["Legal force"]
                ),

                clean_value(
                    row["Governance tier"]
                ),

                clean_value(
                    row["Issuing institution"]
                ),

                clean_value(
                    row[
                        "Implementing institution(s)"
                    ]
                ),

                clean_value(
                    row["Status"]
                ),

                to_int(
                    row["Year"]
                ),

                clean_value(
                    row[
                        "Implementation mechanism defined"
                    ]
                ),

                clean_value(
                    row["Has M&E framework"]
                ),

                clean_value(
                    row["Primary sub-sector"]
                ),

                clean_value(
                    row[
                        "Justification note "
                        "(implementation plan / M&E)"
                    ]
                ),

                clean_value(
                    row["Source (citation)"]
                ),

                clean_value(
                    row["Source URL"]
                ),

                clean_value(
                    row["Source type"]
                )
            )
        )


        policy_count += 1


    counts["Policies"] = policy_count


    # ========================================================
    # VALID POLICY IDS
    # ========================================================

    valid_policy_ids = {
        row[0]
        for row in cursor.execute(
            """
            SELECT policy_id
            FROM policies
            """
        ).fetchall()
    }


    # ========================================================
    # VALID FUNCTION IDS
    # ========================================================

    valid_function_ids = {
        row[0]
        for row in cursor.execute(
            """
            SELECT function_id
            FROM functions
            """
        ).fetchall()
    }


    # ========================================================
    # 6. INITIATIVES
    # ========================================================

    initiative_count = 0


    for _, row in initiatives_df.iterrows():

        initiative_id = clean_value(
            row["Initiative ID"]
        )

        if not initiative_id:
            continue


        lead_actor_id = clean_value(
            row["Lead actor ID"]
        )


        if (
            lead_actor_id
            and
            lead_actor_id not in valid_actor_ids
        ):

            raise Exception(
                f"Initiative {initiative_id} "
                f"references unknown lead actor "
                f"{lead_actor_id}."
            )


        execute_insert(
            cursor,

            """
            INSERT INTO initiatives (
                initiative_id,
                initiative_name,
                record_type,
                primary_subsector,
                primary_value_chain_segment,
                primary_technology,
                grid_relationship,
                standard_status,
                status_detail,
                operational_status,
                delivery_modality,
                lead_actor_id,
                start_year,
                end_year,
                year_precision,
                total_value_usd,
                installed_capacity_mw,
                connections_targeted,
                connections_verified,
                scope_type,
                compact_pillar,
                etp_linkage,
                ndc_linkage,
                source_citation,
                source_url,
                source_type
            )
            VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?
            )
            """,

            (
                initiative_id,

                clean_value(
                    row["Name"]
                ),

                clean_value(
                    row["Record type"]
                ),

                clean_value(
                    row["Primary sub-sector"]
                ),

                clean_value(
                    row[
                        "Primary value chain segment"
                    ]
                ),

                clean_value(
                    row["Primary technology"]
                ),

                clean_value(
                    row["Grid relationship"]
                ),

                clean_value(
                    row["Standard status"]
                ),

                clean_value(
                    row["Status detail"]
                ),

                clean_value(
                    row["Operational status"]
                ),

                clean_value(
                    row["Delivery modality"]
                ),

                lead_actor_id,

                to_int(
                    row["Start"]
                ),

                to_int(
                    row["End"]
                ),

                clean_value(
                    row["Year precision"]
                ),

                to_float(
                    row["Total value (USD)"]
                ),

                to_float(
                    row[
                        "Installed capacity (MW/MWp)"
                    ]
                ),

                to_int(
                    row["Connections targeted"]
                ),

                to_int(
                    row["Connections verified"]
                ),

                clean_value(
                    row["Scope type"]
                ),

                clean_value(
                    row["Compact pillar"]
                ),

                clean_value(
                    row["ETP linkage"]
                ),

                clean_value(
                    row["NDC 3.0 linkage"]
                ),

                clean_value(
                    row["Source (citation)"]
                ),

                clean_value(
                    row["Source URL"]
                ),

                clean_value(
                    row["Source type"]
                )
            )
        )


        initiative_count += 1


    counts["Initiatives"] = (
        initiative_count
    )


    # ========================================================
    # VALID INITIATIVE IDS
    # ========================================================

    valid_initiative_ids = {
        row[0]
        for row in cursor.execute(
            """
            SELECT initiative_id
            FROM initiatives
            """
        ).fetchall()
    }


    # ========================================================
    # 7. FINANCE
    #
    # Two-pass import because finance rows may reference
    # other finance rows.
    # ========================================================

    finance_count = 0


    for _, row in finance_df.iterrows():

        finance_id = clean_value(
            row["Finance ID"]
        )

        if not finance_id:
            continue


        provider_actor_id = clean_value(
            row["Provider actor ID"]
        )

        recipient_actor_id = clean_value(
            row["Recipient actor ID"]
        )

        linked_initiative_id = clean_value(
            row["Linked initiative ID"]
        )


        if (
            provider_actor_id
            and
            provider_actor_id not in valid_actor_ids
        ):

            raise Exception(
                f"Finance record {finance_id} "
                f"references unknown provider actor "
                f"{provider_actor_id}."
            )


        if (
            recipient_actor_id
            and
            recipient_actor_id not in valid_actor_ids
        ):

            raise Exception(
                f"Finance record {finance_id} "
                f"references unknown recipient actor "
                f"{recipient_actor_id}."
            )


        if (
            linked_initiative_id
            and
            linked_initiative_id
            not in valid_initiative_ids
        ):

            raise Exception(
                f"Finance record {finance_id} "
                f"references unknown initiative "
                f"{linked_initiative_id}."
            )


        execute_insert(
            cursor,

            """
            INSERT INTO finance (
                finance_id,
                description,
                provider_actor_id,
                funder_type,
                recipient_actor_id,
                finance_instrument,
                value_type,
                commitment_stage,
                amount_original,
                currency,
                amount_usd,
                fx_reference_date,
                aggregation_eligible,
                channel,
                period_start,
                period_end,
                subsector,
                linked_initiative_id,
                component_of_finance_id,
                not_additive_note,
                source_citation,
                source_url,
                source_type
            )
            VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?
            )
            """,

            (
                finance_id,

                clean_value(
                    row["Description"]
                ),

                provider_actor_id,

                clean_value(
                    row["Funder type"]
                ),

                recipient_actor_id,

                clean_value(
                    row["Finance instrument"]
                ),

                clean_value(
                    row["Value type"]
                ),

                clean_value(
                    row["Commitment stage"]
                ),

                to_float(
                    row["Amount (original)"]
                ),

                clean_value(
                    row["Currency"]
                ),

                to_float(
                    row["Amount (USD)"]
                ),

                clean_value(
                    row["FX reference date"]
                ),

                to_boolean(
                    row["Aggregation eligible"]
                ),

                clean_value(
                    row["Channel"]
                ),

                to_int(
                    row["Period start"]
                ),

                to_int(
                    row["Period end"]
                ),

                clean_value(
                    row["Sub-sector"]
                ),

                linked_initiative_id,

                None,

                clean_value(
                    row["Not-additive note"]
                ),

                clean_value(
                    row["Source (citation)"]
                ),

                clean_value(
                    row["Source URL"]
                ),

                clean_value(
                    row["Source type"]
                )
            )
        )


        finance_count += 1


    counts["Finance"] = finance_count


    # ========================================================
    # VALID FINANCE IDS
    # ========================================================

    valid_finance_ids = {
        row[0]
        for row in cursor.execute(
            """
            SELECT finance_id
            FROM finance
            """
        ).fetchall()
    }


    # ========================================================
    # FINANCE SELF-REFERENCE PASS
    # ========================================================

    for _, row in finance_df.iterrows():

        finance_id = clean_value(
            row["Finance ID"]
        )

        component_id = clean_value(
            row["Component of (Finance ID)"]
        )


        if not component_id:
            continue


        if component_id not in valid_finance_ids:

            log_error(
                "Finance",
                (
                    f"{finance_id} references missing "
                    f"parent finance record "
                    f"{component_id}. "
                    f"Component relationship skipped."
                )
            )

            continue


        cursor.execute(
            """
            UPDATE finance
            SET component_of_finance_id = ?
            WHERE finance_id = ?
            """,

            (
                component_id,
                finance_id
            )
        )


    # ========================================================
    # 8. TARGETS
    # ========================================================

    target_count = 0


    for _, row in targets_df.iterrows():

        target_id = clean_value(
            row["Target ID"]
        )

        if not target_id:
            continue


        custodian_id = clean_value(
            row["Data custodian actor ID"]
        )


        if (
            custodian_id
            and
            custodian_id not in valid_actor_ids
        ):

            raise Exception(
                f"Target {target_id} references "
                f"unknown data custodian "
                f"{custodian_id}."
            )


        execute_insert(
            cursor,

            """
            INSERT INTO targets (
                target_id,
                target_statement,
                framework,
                conditionality,
                subsector,
                indicator,
                unit,
                baseline_value,
                baseline_year,
                target_value,
                target_year,
                direction,
                data_custodian_actor_id,
                definitional_dispute,
                dispute_note,
                source_citation,
                source_url,
                source_type
            )
            VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?
            )
            """,

            (
                target_id,

                clean_value(
                    row["Target statement"]
                ),

                clean_value(
                    row["Framework"]
                ),

                clean_value(
                    row["Conditionality"]
                ),

                clean_value(
                    row["Sub-sector"]
                ),

                clean_value(
                    row["Indicator"]
                ),

                clean_value(
                    row["Unit"]
                ),

                to_float(
                    row["Baseline value"]
                ),

                to_int(
                    row["Baseline year"]
                ),

                to_float(
                    row["Target value"]
                ),

                to_int(
                    row["Target year"]
                ),

                clean_value(
                    row["Direction"]
                ),

                custodian_id,

                clean_value(
                    row["Definitional dispute"]
                ),

                clean_value(
                    row["Dispute note"]
                ),

                clean_value(
                    row["Source (citation)"]
                ),

                clean_value(
                    row["Source URL"]
                ),

                clean_value(
                    row["Source type"]
                )
            )
        )


        target_count += 1


    counts["Targets"] = target_count


    # ========================================================
    # VALID TARGET IDS
    # ========================================================

    valid_target_ids = {
        row[0]
        for row in cursor.execute(
            """
            SELECT target_id
            FROM targets
            """
        ).fetchall()
    }


    # ========================================================
    # 9. TARGET OBSERVATIONS
    #
    # Relationship-style records:
    # bad references are skipped and logged.
    # ========================================================

    observation_count = 0

    observation_skipped = 0


    for _, row in observations_df.iterrows():

        target_id = clean_value(
            row["Target ID"]
        )


        if not target_id:

            observation_skipped += 1

            log_error(
                "Target Observation",
                "Observation row has no Target ID."
            )

            continue


        if target_id not in valid_target_ids:

            observation_skipped += 1

            log_error(
                "Target Observation",
                (
                    f"{target_id} does not exist "
                    f"in 14 Targets."
                )
            )

            continue


        execute_insert(
            cursor,

            """
            INSERT INTO target_observations (
                target_id,
                observation_date,
                actual_value,
                unit,
                verification_status,
                observation_note,
                source_citation,
                source_url,
                source_type
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,

            (
                target_id,

                clean_value(
                    row["Observation date"]
                ),

                to_float(
                    row["Actual value"]
                ),

                clean_value(
                    row["Unit"]
                ),

                clean_value(
                    row["Verification status"]
                ),

                clean_value(
                    row["Note"]
                ),

                clean_value(
                    row["Source (citation)"]
                ),

                clean_value(
                    row["Source URL"]
                ),

                clean_value(
                    row["Source type"]
                )
            )
        )


        observation_count += 1


    counts[
        "Target observations"
    ] = observation_count

    counts[
        "Target observations skipped"
    ] = observation_skipped


    # ========================================================
    # 10. ENGAGEMENT
    # ========================================================

    engagement_count = 0

    engagement_skipped = 0


    for _, row in engagement_df.iterrows():

        engagement_id = clean_value(
            row["Engagement ID"]
        )

        if not engagement_id:
            continue


        actor_id = clean_value(
            row["Actor ID"]
        )


        if (
            actor_id
            and
            actor_id not in valid_actor_ids
        ):

            engagement_skipped += 1

            log_error(
                "Engagement",
                (
                    f"{engagement_id} references "
                    f"unknown actor {actor_id}. "
                    f"Row skipped."
                )
            )

            continue


        execute_insert(
            cursor,

            """
            INSERT INTO engagement (
                engagement_id,
                actor_id,
                organisation_name,
                focal_person,
                designation,
                email,
                phone,
                information_needed,
                priority,
                engagement_status,
                next_action,
                due_date,
                notes
            )
            VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
            )
            """,

            (
                engagement_id,

                actor_id,

                clean_value(
                    row["Organisation"]
                ),

                clean_value(
                    row["Focal person"]
                ),

                clean_value(
                    row["Designation"]
                ),

                clean_value(
                    row["Email"]
                ),

                clean_value(
                    row["Phone"]
                ),

                clean_value(
                    row[
                        "Data / information needed"
                    ]
                ),

                clean_value(
                    row["Priority"]
                ),

                clean_value(
                    row["Engagement status"]
                ),

                clean_value(
                    row["Next action"]
                ),

                clean_value(
                    row["Due date"]
                ),

                clean_value(
                    row["Notes"]
                )
            )
        )


        engagement_count += 1


    counts["Engagement"] = engagement_count

    counts[
        "Engagement skipped"
    ] = engagement_skipped


    # ========================================================
    # 11. INITIATIVE LOCATIONS
    # ========================================================

    location_count = 0

    location_skipped = 0


    for _, row in initiative_locations_df.iterrows():

        initiative_id = clean_value(
            row["Initiative ID"]
        )

        state_code = clean_value(
            row["State code"]
        )


        if (
            not initiative_id
            or
            not state_code
        ):

            location_skipped += 1

            log_error(
                "Initiative Location",
                (
                    "Row skipped because "
                    "Initiative ID or State code is blank."
                )
            )

            continue


        if (
            initiative_id
            not in valid_initiative_ids
        ):

            location_skipped += 1

            log_error(
                "Initiative Location",
                (
                    f"{initiative_id} does not exist "
                    f"in 12 Initiatives. "
                    f"State={state_code}"
                )
            )

            continue


        if (
            state_code
            not in valid_state_codes
        ):

            location_skipped += 1

            log_error(
                "Initiative Location",
                (
                    f"{state_code} does not exist "
                    f"in 02 Ref States. "
                    f"Initiative={initiative_id}"
                )
            )

            continue


        execute_insert(
            cursor,

            """
            INSERT INTO initiative_locations (
                initiative_id,
                state_code,
                coverage_type,
                scope_type,
                location_note
            )
            VALUES (?, ?, ?, ?, ?)
            """,

            (
                initiative_id,

                state_code,

                clean_value(
                    row["Coverage type"]
                ),

                clean_value(
                    row["Scope type"]
                ),

                clean_value(
                    row["Note"]
                )
            )
        )


        location_count += 1


    counts[
        "Initiative locations"
    ] = location_count

    counts[
        "Initiative locations skipped"
    ] = location_skipped


    # ========================================================
    # 12. INITIATIVE ACTORS
    # ========================================================

    initiative_actor_count = 0

    initiative_actor_skipped = 0


    for _, row in initiative_actors_df.iterrows():

        initiative_id = clean_value(
            row["Initiative ID"]
        )

        actor_id = clean_value(
            row["Actor ID"]
        )

        role = clean_value(
            row["Role"]
        )


        if (
            not initiative_id
            or
            not actor_id
            or
            not role
        ):

            initiative_actor_skipped += 1

            log_error(
                "Initiative Actor",
                (
                    "Row skipped because Initiative ID, "
                    "Actor ID or Role is blank."
                )
            )

            continue


        if (
            initiative_id
            not in valid_initiative_ids
        ):

            initiative_actor_skipped += 1

            log_error(
                "Initiative Actor",
                (
                    f"{initiative_id} does not exist "
                    f"in 12 Initiatives."
                )
            )

            continue


        if actor_id not in valid_actor_ids:

            initiative_actor_skipped += 1

            log_error(
                "Initiative Actor",
                (
                    f"{actor_id} does not exist "
                    f"in 10 Actors. "
                    f"Initiative={initiative_id}"
                )
            )

            continue


        execute_insert(
            cursor,

            """
            INSERT INTO initiative_actors (
                initiative_id,
                actor_id,
                actor_role,
                relationship_note
            )
            VALUES (?, ?, ?, ?)
            """,

            (
                initiative_id,

                actor_id,

                role,

                clean_value(
                    row["Note"]
                )
            )
        )


        initiative_actor_count += 1


    counts[
        "Initiative actors"
    ] = initiative_actor_count

    counts[
        "Initiative actors skipped"
    ] = initiative_actor_skipped


    # ========================================================
    # 13. INITIATIVE SUBSECTORS
    # ========================================================

    initiative_subsector_count = 0

    initiative_subsector_skipped = 0


    for _, row in initiative_subsectors_df.iterrows():

        initiative_id = clean_value(
            row["Initiative ID"]
        )

        subsector = clean_value(
            row["Sub-sector"]
        )


        if (
            not initiative_id
            or
            not subsector
        ):

            initiative_subsector_skipped += 1

            log_error(
                "Initiative Subsector",
                (
                    "Row skipped because Initiative ID "
                    "or Sub-sector is blank."
                )
            )

            continue


        if (
            initiative_id
            not in valid_initiative_ids
        ):

            initiative_subsector_skipped += 1

            log_error(
                "Initiative Subsector",
                (
                    f"{initiative_id} does not exist "
                    f"in 12 Initiatives."
                )
            )

            continue


        execute_insert(
            cursor,

            """
            INSERT INTO initiative_subsectors (
                initiative_id,
                subsector,
                value_chain_segment,
                technology
            )
            VALUES (?, ?, ?, ?)
            """,

            (
                initiative_id,

                subsector,

                clean_value(
                    row["Value chain segment"]
                ),

                clean_value(
                    row["Technology"]
                )
            )
        )


        initiative_subsector_count += 1


    counts[
        "Initiative subsectors"
    ] = initiative_subsector_count

    counts[
        "Initiative subsectors skipped"
    ] = initiative_subsector_skipped


    # ========================================================
    # 14. FINANCE PARTIES
    # ========================================================

    finance_party_count = 0

    finance_party_skipped = 0


    for _, row in finance_parties_df.iterrows():

        finance_id = clean_value(
            row["Finance ID"]
        )

        actor_id = clean_value(
            row["Actor ID"]
        )

        party_role = clean_value(
            row["Party role"]
        )


        if (
            not finance_id
            or
            not actor_id
            or
            not party_role
        ):

            finance_party_skipped += 1

            log_error(
                "Finance Party",
                (
                    "Row skipped because Finance ID, "
                    "Actor ID or Party role is blank."
                )
            )

            continue


        if finance_id not in valid_finance_ids:

            finance_party_skipped += 1

            log_error(
                "Finance Party",
                (
                    f"{finance_id} does not exist "
                    f"in 13 Finance."
                )
            )

            continue


        if actor_id not in valid_actor_ids:

            finance_party_skipped += 1

            log_error(
                "Finance Party",
                (
                    f"{actor_id} does not exist "
                    f"in 10 Actors. "
                    f"Finance={finance_id}"
                )
            )

            continue


        execute_insert(
            cursor,

            """
            INSERT INTO finance_parties (
                finance_id,
                actor_id,
                party_role,
                relationship_note
            )
            VALUES (?, ?, ?, ?)
            """,

            (
                finance_id,

                actor_id,

                party_role,

                clean_value(
                    row["Note"]
                )
            )
        )


        finance_party_count += 1


    counts[
        "Finance parties"
    ] = finance_party_count

    counts[
        "Finance parties skipped"
    ] = finance_party_skipped


    # ========================================================
    # 15. ACTOR FUNCTIONS
    # ========================================================

    actor_function_count = 0

    actor_function_skipped = 0


    for _, row in actor_functions_df.iterrows():

        actor_id = clean_value(
            row["Actor ID"]
        )

        function_id = clean_value(
            row["Function ID"]
        )

        primacy = clean_value(
            row["Primacy"]
        )

        mandate_policy_id = clean_value(
            row["Mandate basis (Policy ID)"]
        )


        if (
            not actor_id
            or
            not function_id
        ):

            actor_function_skipped += 1

            log_error(
                "Actor Function",
                (
                    "Row skipped because Actor ID "
                    "or Function ID is blank."
                )
            )

            continue


        if actor_id not in valid_actor_ids:

            actor_function_skipped += 1

            log_error(
                "Actor Function",
                (
                    f"{actor_id} does not exist "
                    f"in 10 Actors."
                )
            )

            continue


        if function_id not in valid_function_ids:

            actor_function_skipped += 1

            log_error(
                "Actor Function",
                (
                    f"{function_id} does not exist "
                    f"in 03 Ref Functions. "
                    f"Actor={actor_id}"
                )
            )

            continue


        if (
            mandate_policy_id
            and
            mandate_policy_id
            not in valid_policy_ids
        ):

            actor_function_skipped += 1

            log_error(
                "Actor Function",
                (
                    f"{mandate_policy_id} does not exist "
                    f"in 11 Policies. "
                    f"Actor={actor_id}, "
                    f"Function={function_id}"
                )
            )

            continue


        execute_insert(
            cursor,

            """
            INSERT INTO actor_functions (
                actor_id,
                function_id,
                primacy,
                mandate_policy_id,
                relationship_note
            )
            VALUES (?, ?, ?, ?, ?)
            """,

            (
                actor_id,

                function_id,

                primacy,

                mandate_policy_id,

                clean_value(
                    row["Note"]
                )
            )
        )


        actor_function_count += 1


    counts[
        "Actor functions"
    ] = actor_function_count

    counts[
        "Actor functions skipped"
    ] = actor_function_skipped


    # ========================================================
    # 16. POLICY SCOPES
    #
    # POL-023 / POL-024 are currently expected to be flagged
    # here until the master Policies sheet is corrected.
    # ========================================================

    policy_scope_count = 0

    policy_scope_skipped = 0


    for _, row in policy_scopes_df.iterrows():

        policy_id = clean_value(
            row["Policy ID"]
        )

        subsector = clean_value(
            row["Sub-sector"]
        )

        function_id = clean_value(
            row["Function ID"]
        )

        note = clean_value(
            row["Note"]
        )


        if not policy_id:

            policy_scope_skipped += 1

            log_error(
                "Policy Scope",
                "Row skipped because Policy ID is blank."
            )

            continue


        if policy_id not in valid_policy_ids:

            policy_scope_skipped += 1

            log_error(
                "Policy Scope",
                (
                    f"{policy_id} does not exist "
                    f"in 11 Policies. "
                    f"Sub-sector={subsector}, "
                    f"Function={function_id}"
                )
            )

            continue


        if (
            function_id
            and
            function_id not in valid_function_ids
        ):

            policy_scope_skipped += 1

            log_error(
                "Policy Scope",
                (
                    f"{function_id} does not exist "
                    f"in 03 Ref Functions. "
                    f"Policy={policy_id}"
                )
            )

            continue


        execute_insert(
            cursor,

            """
            INSERT INTO policy_scopes (
                policy_id,
                subsector,
                function_id,
                scope_note
            )
            VALUES (?, ?, ?, ?)
            """,

            (
                policy_id,

                subsector,

                function_id,

                note
            )
        )


        policy_scope_count += 1


    counts[
        "Policy scopes"
    ] = policy_scope_count

    counts[
        "Policy scopes skipped"
    ] = policy_scope_skipped


    # ========================================================
    # FINAL FOREIGN-KEY CHECK
    # ========================================================

    foreign_key_errors = cursor.execute(
        """
        PRAGMA foreign_key_check;
        """
    ).fetchall()


    if foreign_key_errors:

        print()
        print(
            "FOREIGN KEY ERRORS FOUND:"
        )

        print()

        for error in foreign_key_errors:
            print(error)


        raise Exception(
            (
                f"{len(foreign_key_errors)} "
                f"foreign-key error(s) found."
            )
        )


    # ========================================================
    # COMMIT TRANSACTION
    # ========================================================

    connection.commit()


# ============================================================
# SERIOUS FAILURE
# ============================================================

except Exception as exc:

    connection.rollback()

    print()
    print("=" * 70)
    print("IMPORT FAILED")
    print("=" * 70)

    print()
    print(exc)

    print()
    print(
        "No changes were committed to energy.db."
    )

    connection.close()

    sys.exit(1)


# ============================================================
# IMPORT REPORT
# ============================================================

print()
print("=" * 70)
print("IMPORT COMPLETE")
print("=" * 70)

print()


for name, count in counts.items():

    print(
        f"{name:<32} {count:>6}"
    )


print()

print(
    "Foreign-key validation: PASSED"
)


# ============================================================
# DATA QUALITY WARNINGS
# ============================================================

print()


if errors:

    print("=" * 70)
    print("DATA QUALITY WARNINGS")
    print("=" * 70)

    print()


    for number, error in enumerate(
        errors,
        start=1
    ):

        print(
            f"{number}. "
            f"[{error['category']}] "
            f"{error['message']}"
        )


    print()

    print(
        f"Warnings recorded: {len(errors)}"
    )


else:

    print(
        "Data quality warnings: NONE"
    )


# ============================================================
# DATABASE VALIDATION COUNTS
# ============================================================

print()
print("=" * 70)
print("DATABASE VALIDATION")
print("=" * 70)

print()


validation_queries = {

    "Sources":
        "SELECT COUNT(*) FROM sources",

    "States":
        "SELECT COUNT(*) FROM states",

    "Functions":
        "SELECT COUNT(*) FROM functions",

    "Actors":
        "SELECT COUNT(*) FROM actors",

    "Policies":
        "SELECT COUNT(*) FROM policies",

    "Initiatives":
        "SELECT COUNT(*) FROM initiatives",

    "Finance":
        "SELECT COUNT(*) FROM finance",

    "Targets":
        "SELECT COUNT(*) FROM targets",

    "Target observations":
        "SELECT COUNT(*) FROM target_observations",

    "Engagement":
        "SELECT COUNT(*) FROM engagement",

    "Initiative locations":
        "SELECT COUNT(*) FROM initiative_locations",

    "Initiative actors":
        "SELECT COUNT(*) FROM initiative_actors",

    "Initiative subsectors":
        "SELECT COUNT(*) FROM initiative_subsectors",

    "Finance parties":
        "SELECT COUNT(*) FROM finance_parties",

    "Actor functions":
        "SELECT COUNT(*) FROM actor_functions",

    "Policy scopes":
        "SELECT COUNT(*) FROM policy_scopes"
}


for label, query in validation_queries.items():

    result = cursor.execute(
        query
    ).fetchone()[0]

    print(
        f"{label:<32} {result:>6}"
    )


# ============================================================
# FINISH
# ============================================================

connection.close()


print()
print("=" * 70)
print("DATABASE UPDATED SUCCESSFULLY")
print("=" * 70)

print()

print(DATABASE_PATH)

print()