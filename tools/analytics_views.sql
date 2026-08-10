/* ============================================================
   INETT ENERGY ANALYTICS VIEWS
   Phase 1 - Energy
   Database: SQLite

   Purpose:
   Derived analytics layer for the INETT Energy website.
   These views sit between the raw repository tables and PHP.

   Flow:
   Raw tables
      ↓
   Analytics views
      ↓
   PHP / GetSimple
      ↓
   Dashboard
   ============================================================ */

PRAGMA foreign_keys = ON;


/* ============================================================
   DROP EXISTING VIEWS
   ============================================================ */

DROP VIEW IF EXISTS vw_overview_kpis;
DROP VIEW IF EXISTS vw_initiatives_by_subsector;
DROP VIEW IF EXISTS vw_initiatives_by_status;
DROP VIEW IF EXISTS vw_state_coverage;
DROP VIEW IF EXISTS vw_actor_activity;
DROP VIEW IF EXISTS vw_finance_summary;
DROP VIEW IF EXISTS vw_finance_by_subsector;
DROP VIEW IF EXISTS vw_function_mandates;
DROP VIEW IF EXISTS vw_policy_coverage;
DROP VIEW IF EXISTS vw_target_summary;


/* ============================================================
   1. OVERVIEW KPIs
   ============================================================ */

CREATE VIEW vw_overview_kpis AS

SELECT

    (
        SELECT COUNT(*)
        FROM initiatives
    ) AS total_initiatives,

    (
        SELECT COUNT(*)
        FROM initiatives
        WHERE LOWER(TRIM(standard_status)) = 'active'
    ) AS active_initiatives,

    (
        SELECT COUNT(*)
        FROM actors
    ) AS total_actors,

    (
        SELECT COUNT(*)
        FROM policies
    ) AS total_policies,

    (
        SELECT COUNT(*)
        FROM targets
    ) AS total_targets,

    (
        SELECT COUNT(*)
        FROM states
    ) AS total_states_fct,

    (
        SELECT COUNT(DISTINCT state_code)
        FROM initiative_locations
    ) AS states_with_initiatives,

    (
        SELECT COUNT(*)
        FROM finance
    ) AS finance_records,

    (
        SELECT COUNT(*)
        FROM finance
        WHERE aggregation_eligible = 1
    ) AS aggregation_eligible_finance_records,

    (
        SELECT COALESCE(
            SUM(amount_usd),
            0
        )
        FROM finance
        WHERE aggregation_eligible = 1
    ) AS finance_tracked_usd,

    (
        SELECT COUNT(*)
        FROM functions
    ) AS total_functions,

    (
        SELECT COUNT(*)
        FROM functions f
        WHERE NOT EXISTS (
            SELECT 1
            FROM actor_functions af
            WHERE af.function_id = f.function_id
        )
    ) AS functions_without_actor_mapping;


/* ============================================================
   2. INITIATIVES BY SUBSECTOR
   ============================================================ */

CREATE VIEW vw_initiatives_by_subsector AS

SELECT

    COALESCE(
        NULLIF(TRIM(primary_subsector), ''),
        'Unspecified'
    ) AS subsector,

    COUNT(*) AS initiative_count,

    SUM(
        CASE
            WHEN LOWER(TRIM(standard_status)) = 'active'
            THEN 1
            ELSE 0
        END
    ) AS active_count,

    SUM(
        CASE
            WHEN LOWER(TRIM(standard_status)) = 'completed'
            THEN 1
            ELSE 0
        END
    ) AS completed_count,

    SUM(
        CASE
            WHEN LOWER(TRIM(standard_status)) = 'pipeline'
            THEN 1
            ELSE 0
        END
    ) AS pipeline_count,

    COALESCE(
        SUM(total_value_usd),
        0
    ) AS known_project_value_usd,

    COALESCE(
        SUM(installed_capacity_mw),
        0
    ) AS known_installed_capacity_mw,

    COALESCE(
        SUM(connections_targeted),
        0
    ) AS connections_targeted,

    COALESCE(
        SUM(connections_verified),
        0
    ) AS connections_verified

FROM initiatives

GROUP BY
    COALESCE(
        NULLIF(TRIM(primary_subsector), ''),
        'Unspecified'
    );


/* ============================================================
   3. INITIATIVES BY STATUS
   ============================================================ */

CREATE VIEW vw_initiatives_by_status AS

SELECT

    COALESCE(
        NULLIF(TRIM(standard_status), ''),
        'Unknown'
    ) AS status,

    COUNT(*) AS initiative_count,

    COALESCE(
        SUM(total_value_usd),
        0
    ) AS known_project_value_usd

FROM initiatives

GROUP BY
    COALESCE(
        NULLIF(TRIM(standard_status), ''),
        'Unknown'
    );


/* ============================================================
   4. STATE COVERAGE
   ============================================================

   Important:
   Project value is calculated using a correlated subquery
   rather than summing directly across joined location rows.
   This avoids multiplying values through other joins.
   ============================================================ */

CREATE VIEW vw_state_coverage AS

SELECT

    s.state_code,

    s.state_name,

    s.geopolitical_zone,

    s.state_electricity_law_enacted,

    s.electricity_law_year,

    s.state_regulator,

    s.nerc_transfer_order_issued,

    s.current_regulatory_authority,

    s.integrated_energy_plan,

    s.serving_discos,

    s.electricity_access_rate,

    s.access_rate_year,

    s.clean_cooking_access_rate,

    s.coordination_focal_point,

    COUNT(
        DISTINCT il.initiative_id
    ) AS initiative_count,

    COUNT(
        DISTINCT CASE
            WHEN LOWER(TRIM(i.standard_status)) = 'active'
            THEN i.initiative_id
        END
    ) AS active_initiative_count,

    COUNT(
        DISTINCT CASE
            WHEN LOWER(TRIM(i.standard_status)) = 'completed'
            THEN i.initiative_id
        END
    ) AS completed_initiative_count,

    COUNT(
        DISTINCT CASE
            WHEN LOWER(TRIM(i.standard_status)) = 'pipeline'
            THEN i.initiative_id
        END
    ) AS pipeline_initiative_count,

    COUNT(
        DISTINCT i.lead_actor_id
    ) AS lead_actor_count,

    (
        SELECT COUNT(
            DISTINCT ia.actor_id
        )
        FROM initiative_locations il2

        JOIN initiative_actors ia
            ON ia.initiative_id = il2.initiative_id

        WHERE il2.state_code = s.state_code
    ) AS participating_actor_count,

    (
        SELECT COALESCE(
            SUM(i2.total_value_usd),
            0
        )
        FROM initiatives i2

        WHERE i2.initiative_id IN (

            SELECT DISTINCT il3.initiative_id
            FROM initiative_locations il3
            WHERE il3.state_code = s.state_code
        )
    ) AS known_project_value_usd,

    (
        SELECT COALESCE(
            SUM(i3.installed_capacity_mw),
            0
        )
        FROM initiatives i3

        WHERE i3.initiative_id IN (

            SELECT DISTINCT il4.initiative_id
            FROM initiative_locations il4
            WHERE il4.state_code = s.state_code
        )
    ) AS known_installed_capacity_mw

FROM states s

LEFT JOIN initiative_locations il
    ON s.state_code = il.state_code

LEFT JOIN initiatives i
    ON il.initiative_id = i.initiative_id

GROUP BY

    s.state_code,
    s.state_name,
    s.geopolitical_zone,
    s.state_electricity_law_enacted,
    s.electricity_law_year,
    s.state_regulator,
    s.nerc_transfer_order_issued,
    s.current_regulatory_authority,
    s.integrated_energy_plan,
    s.serving_discos,
    s.electricity_access_rate,
    s.access_rate_year,
    s.clean_cooking_access_rate,
    s.coordination_focal_point;


/* ============================================================
   5. ACTOR ACTIVITY
   ============================================================ */

CREATE VIEW vw_actor_activity AS

SELECT

    a.actor_id,

    a.organisation_name,

    a.acronym,

    a.actor_type,

    a.primary_role,

    a.subsector_focus,

    a.governance_tier,

    a.state_code,

    COUNT(
        DISTINCT ia.initiative_id
    ) AS initiative_count,

    COUNT(
        DISTINCT CASE
            WHEN LOWER(TRIM(i.standard_status)) = 'active'
            THEN ia.initiative_id
        END
    ) AS active_initiative_count,

    COUNT(
        DISTINCT CASE
            WHEN LOWER(TRIM(i.standard_status)) = 'completed'
            THEN ia.initiative_id
        END
    ) AS completed_initiative_count,

    COUNT(
        DISTINCT il.state_code
    ) AS states_reached,

    COUNT(
        DISTINCT af.function_id
    ) AS mapped_function_count,

    COUNT(
        DISTINCT CASE
            WHEN LOWER(TRIM(af.primacy)) = 'primary'
            THEN af.function_id
        END
    ) AS primary_function_count

FROM actors a

LEFT JOIN initiative_actors ia
    ON a.actor_id = ia.actor_id

LEFT JOIN initiatives i
    ON ia.initiative_id = i.initiative_id

LEFT JOIN initiative_locations il
    ON ia.initiative_id = il.initiative_id

LEFT JOIN actor_functions af
    ON a.actor_id = af.actor_id

GROUP BY

    a.actor_id,
    a.organisation_name,
    a.acronym,
    a.actor_type,
    a.primary_role,
    a.subsector_focus,
    a.governance_tier,
    a.state_code;


/* ============================================================
   6. FINANCE SUMMARY
   ============================================================ */

CREATE VIEW vw_finance_summary AS

SELECT

    COUNT(*) AS finance_records,

    SUM(
        CASE
            WHEN aggregation_eligible = 1
            THEN 1
            ELSE 0
        END
    ) AS aggregation_eligible_records,

    SUM(
        CASE
            WHEN aggregation_eligible = 0
            THEN 1
            ELSE 0
        END
    ) AS non_additive_records,

    COALESCE(
        SUM(
            CASE
                WHEN aggregation_eligible = 1
                THEN amount_usd
                ELSE 0
            END
        ),
        0
    ) AS tracked_finance_usd,

    COALESCE(
        AVG(
            CASE
                WHEN aggregation_eligible = 1
                THEN amount_usd
                ELSE NULL
            END
        ),
        0
    ) AS average_finance_record_usd,

    COUNT(
        DISTINCT CASE
            WHEN aggregation_eligible = 1
            THEN provider_actor_id
        END
    ) AS tracked_provider_count,

    COUNT(
        DISTINCT CASE
            WHEN aggregation_eligible = 1
            THEN recipient_actor_id
        END
    ) AS tracked_recipient_count,

    COUNT(
        DISTINCT CASE
            WHEN aggregation_eligible = 1
            THEN linked_initiative_id
        END
    ) AS linked_initiative_count

FROM finance;


/* ============================================================
   7. FINANCE BY SUBSECTOR
   ============================================================ */

CREATE VIEW vw_finance_by_subsector AS

SELECT

    COALESCE(
        NULLIF(TRIM(subsector), ''),
        'Unspecified'
    ) AS subsector,

    COUNT(*) AS finance_records,

    SUM(
        CASE
            WHEN aggregation_eligible = 1
            THEN 1
            ELSE 0
        END
    ) AS eligible_records,

    COALESCE(
        SUM(
            CASE
                WHEN aggregation_eligible = 1
                THEN amount_usd
                ELSE 0
            END
        ),
        0
    ) AS tracked_finance_usd,

    COUNT(
        DISTINCT CASE
            WHEN aggregation_eligible = 1
            THEN provider_actor_id
        END
    ) AS provider_count,

    COUNT(
        DISTINCT CASE
            WHEN aggregation_eligible = 1
            THEN recipient_actor_id
        END
    ) AS recipient_count

FROM finance

GROUP BY
    COALESCE(
        NULLIF(TRIM(subsector), ''),
        'Unspecified'
    );


/* ============================================================
   8. FUNCTION / MANDATE ANALYSIS
   ============================================================ */

CREATE VIEW vw_function_mandates AS

SELECT

    f.function_id,

    f.function_name,

    f.primary_subsector,

    f.typical_value_chain_segment,

    f.contestation_note,

    COUNT(
        DISTINCT af.actor_id
    ) AS mandate_holder_count,

    COUNT(
        DISTINCT CASE
            WHEN LOWER(TRIM(af.primacy)) = 'primary'
            THEN af.actor_id
        END
    ) AS primary_holder_count,

    COUNT(
        DISTINCT CASE
            WHEN LOWER(TRIM(af.primacy)) <> 'primary'
            THEN af.actor_id
        END
    ) AS non_primary_holder_count,

    GROUP_CONCAT(
        DISTINCT a.organisation_name
    ) AS mapped_actors,

    CASE

        WHEN COUNT(
            DISTINCT af.actor_id
        ) = 0
        THEN 'Unmapped'

        WHEN COUNT(
            DISTINCT CASE
                WHEN LOWER(TRIM(af.primacy)) = 'primary'
                THEN af.actor_id
            END
        ) = 0
        THEN 'No primary holder'

        WHEN COUNT(
            DISTINCT CASE
                WHEN LOWER(TRIM(af.primacy)) = 'primary'
                THEN af.actor_id
            END
        ) = 1
        THEN 'Single primary holder'

        ELSE 'Potential overlap'

    END AS mandate_status

FROM functions f

LEFT JOIN actor_functions af
    ON f.function_id = af.function_id

LEFT JOIN actors a
    ON af.actor_id = a.actor_id

GROUP BY

    f.function_id,
    f.function_name,
    f.primary_subsector,
    f.typical_value_chain_segment,
    f.contestation_note;


/* ============================================================
   9. POLICY COVERAGE
   ============================================================ */

CREATE VIEW vw_policy_coverage AS

SELECT

    p.policy_id,

    p.instrument_name,

    p.short_name,

    p.instrument_type,

    p.legal_force,

    p.governance_tier,

    p.status,

    p.publication_year,

    p.primary_subsector,

    COUNT(
        DISTINCT ps.function_id
    ) AS function_count,

    COUNT(
        DISTINCT ps.subsector
    ) AS subsector_count,

    GROUP_CONCAT(
        DISTINCT ps.subsector
    ) AS covered_subsectors,

    GROUP_CONCAT(
        DISTINCT ps.function_id
    ) AS covered_function_ids

FROM policies p

LEFT JOIN policy_scopes ps
    ON p.policy_id = ps.policy_id

GROUP BY

    p.policy_id,
    p.instrument_name,
    p.short_name,
    p.instrument_type,
    p.legal_force,
    p.governance_tier,
    p.status,
    p.publication_year,
    p.primary_subsector;


/* ============================================================
   10. TARGET SUMMARY
   ============================================================ */

CREATE VIEW vw_target_summary AS

SELECT

    t.target_id,

    t.target_statement,

    t.framework,

    t.conditionality,

    t.subsector,

    t.indicator,

    t.unit,

    t.baseline_value,

    t.baseline_year,

    t.target_value,

    t.target_year,

    t.direction,

    t.data_custodian_actor_id,

    t.definitional_dispute,

    t.dispute_note,

    COUNT(
        o.observation_id
    ) AS observation_count,

    MAX(
        o.observation_date
    ) AS latest_observation_date,

    (
        SELECT o2.actual_value

        FROM target_observations o2

        WHERE o2.target_id = t.target_id

        ORDER BY
            o2.observation_date DESC,
            o2.observation_id DESC

        LIMIT 1
    ) AS latest_actual_value,

    (
        SELECT o3.verification_status

        FROM target_observations o3

        WHERE o3.target_id = t.target_id

        ORDER BY
            o3.observation_date DESC,
            o3.observation_id DESC

        LIMIT 1
    ) AS latest_verification_status

FROM targets t

LEFT JOIN target_observations o
    ON t.target_id = o.target_id

GROUP BY

    t.target_id,
    t.target_statement,
    t.framework,
    t.conditionality,
    t.subsector,
    t.indicator,
    t.unit,
    t.baseline_value,
    t.baseline_year,
    t.target_value,
    t.target_year,
    t.direction,
    t.data_custodian_actor_id,
    t.definitional_dispute,
    t.dispute_note;