<?php

if (!defined('IN_GS')) {
    die('You cannot load this page directly.');
}


/*
|--------------------------------------------------------------------------
| INETT ENERGY ANALYTICS QUERIES
|--------------------------------------------------------------------------
|
| This file contains all reusable database queries for the Energy
| analytics website.
|
*/


function getOverviewKpis(PDO $db): array
{
    $stmt = $db->query("
        SELECT *
        FROM vw_overview_kpis
        LIMIT 1
    ");

    return $stmt->fetch() ?: [];
}


function getInitiativesBySubsector(PDO $db): array
{
    $stmt = $db->query("
        SELECT
            subsector,
            initiative_count,
            active_count,
            completed_count,
            pipeline_count,
            known_project_value_usd,
            known_installed_capacity_mw,
            connections_targeted,
            connections_verified
        FROM vw_initiatives_by_subsector
        ORDER BY initiative_count DESC
    ");

    return $stmt->fetchAll();
}


function getInitiativesByStatus(PDO $db): array
{
    $stmt = $db->query("
        SELECT
            status,
            initiative_count,
            known_project_value_usd
        FROM vw_initiatives_by_status
        ORDER BY initiative_count DESC
    ");

    return $stmt->fetchAll();
}


function getTopStates(PDO $db, int $limit = 10): array
{
    $stmt = $db->prepare("
        SELECT
            state_code,
            state_name,
            geopolitical_zone,
            initiative_count,
            active_initiative_count,
            participating_actor_count,
            known_project_value_usd,
            electricity_access_rate
        FROM vw_state_coverage
        ORDER BY initiative_count DESC
        LIMIT :limit
    ");

    $stmt->bindValue(
        ':limit',
        $limit,
        PDO::PARAM_INT
    );

    $stmt->execute();

    return $stmt->fetchAll();
}


function getTopActors(PDO $db, int $limit = 10): array
{
    $stmt = $db->prepare("
        SELECT
            actor_id,
            organisation_name,
            acronym,
            actor_type,
            primary_role,
            subsector_focus,
            initiative_count,
            active_initiative_count,
            states_reached,
            mapped_function_count,
            primary_function_count
        FROM vw_actor_activity
        ORDER BY initiative_count DESC
        LIMIT :limit
    ");

    $stmt->bindValue(
        ':limit',
        $limit,
        PDO::PARAM_INT
    );

    $stmt->execute();

    return $stmt->fetchAll();
}


function getFinanceSummary(PDO $db): array
{
    $stmt = $db->query("
        SELECT *
        FROM vw_finance_summary
        LIMIT 1
    ");

    return $stmt->fetch() ?: [];
}


function getFinanceBySubsector(PDO $db): array
{
    $stmt = $db->query("
        SELECT
            subsector,
            finance_records,
            eligible_records,
            tracked_finance_usd,
            provider_count,
            recipient_count
        FROM vw_finance_by_subsector
        ORDER BY tracked_finance_usd DESC
    ");

    return $stmt->fetchAll();
}


function getMandateSummary(PDO $db): array
{
    $stmt = $db->query("
        SELECT
            function_id,
            function_name,
            primary_subsector,
            mandate_holder_count,
            primary_holder_count,
            mapped_actors,
            mandate_status
        FROM vw_function_mandates
        ORDER BY
            CASE mandate_status
                WHEN 'Potential overlap' THEN 1
                WHEN 'Unmapped' THEN 2
                WHEN 'No primary holder' THEN 3
                ELSE 4
            END,
            function_name
    ");

    return $stmt->fetchAll();
}


function getPolicyCoverage(PDO $db, int $limit = 10): array
{
    $stmt = $db->prepare("
        SELECT
            policy_id,
            instrument_name,
            short_name,
            instrument_type,
            status,
            publication_year,
            primary_subsector,
            function_count,
            subsector_count,
            covered_subsectors
        FROM vw_policy_coverage
        ORDER BY function_count DESC, publication_year DESC
        LIMIT :limit
    ");

    $stmt->bindValue(
        ':limit',
        $limit,
        PDO::PARAM_INT
    );

    $stmt->execute();

    return $stmt->fetchAll();
}


function getTargetSummary(PDO $db, int $limit = 8): array
{
    $stmt = $db->prepare("
        SELECT
            target_id,
            target_statement,
            framework,
            subsector,
            indicator,
            unit,
            baseline_value,
            baseline_year,
            target_value,
            target_year,
            observation_count,
            latest_observation_date,
            latest_actual_value,
            latest_verification_status
        FROM vw_target_summary
        ORDER BY target_year ASC
        LIMIT :limit
    ");

    $stmt->bindValue(
        ':limit',
        $limit,
        PDO::PARAM_INT
    );

    $stmt->execute();

    return $stmt->fetchAll();
}

function getInitiativeRecords(PDO $db): array
{
    $stmt = $db->query("
        SELECT
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
            total_value_usd,
            installed_capacity_mw,
            connections_targeted,
            connections_verified,
            scope_type,
            compact_pillar,
            etp_linkage,
            ndc_linkage
        FROM initiatives
        ORDER BY initiative_name
    ");

    return $stmt->fetchAll();
}


function getInitiativeLocations(PDO $db): array
{
    $stmt = $db->query("
        SELECT
            initiative_id,
            state_code,
            coverage_type,
            scope_type
        FROM initiative_locations
    ");

    return $stmt->fetchAll();
}


function getInitiativeActors(PDO $db): array
{
    $stmt = $db->query("
        SELECT
            ia.initiative_id,
            ia.actor_id,
            ia.actor_role,
            a.organisation_name,
            a.acronym,
            a.actor_type
        FROM initiative_actors ia
        LEFT JOIN actors a
            ON a.actor_id = ia.actor_id
    ");

    return $stmt->fetchAll();
}


function getInitiativeSubsectors(PDO $db): array
{
    $stmt = $db->query("
        SELECT
            initiative_id,
            subsector,
            value_chain_segment,
            technology
        FROM initiative_subsectors
    ");

    return $stmt->fetchAll();
}


function getEnergyDashboardData(PDO $db): array
{
    return [
        'overview' => getOverviewKpis($db),

        'subsectors' =>
            getInitiativesBySubsector($db),

        'statuses' =>
            getInitiativesByStatus($db),

        'states' =>
            getTopStates($db),

        'all_states' =>
            getAllStates($db),

        'actors' =>
            getTopActors($db),

        'finance' =>
            getFinanceSummary($db),

        'finance_by_subsector' =>
            getFinanceBySubsector($db),

        'mandates' =>
            getMandateSummary($db),

        'policies' =>
            getPolicyCoverage($db),

        'targets' =>
            getTargetSummary($db),

        /*
        ------------------------------------------------------
        Client-side analytical relationships
        ------------------------------------------------------
        */

        'initiatives' =>
            getInitiativeRecords($db),

        'initiative_locations' =>
            getInitiativeLocations($db),

        'initiative_actors' =>
            getInitiativeActors($db),

        'initiative_subsectors' =>
            getInitiativeSubsectors($db)
    ];
}

function getAllStates(PDO $db): array
{
    $stmt = $db->query("
        SELECT
            state_code,
            state_name,
            geopolitical_zone,
            initiative_count,
            active_initiative_count,
            completed_initiative_count,
            pipeline_initiative_count,
            lead_actor_count,
            participating_actor_count,
            known_project_value_usd,
            known_installed_capacity_mw,
            electricity_access_rate,
            clean_cooking_access_rate,
            state_electricity_law_enacted,
            electricity_law_year,
            state_regulator,
            current_regulatory_authority
        FROM vw_state_coverage
        ORDER BY state_name
    ");

    return $stmt->fetchAll();
}