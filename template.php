<?php

if (!defined('IN_GS')) {
    die('You cannot load this page directly.');
}


/* ============================================================
   HEADER
============================================================ */

include('header.inc.php');


/* ============================================================
   DATABASE + ANALYTICS
============================================================ */

require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/queries.php';


$dashboard = getEnergyDashboardData($energyDb);


/* ============================================================
   DASHBOARD DATA
============================================================ */

$overview = $dashboard['overview'] ?? [];

$subsectors = $dashboard['subsectors'] ?? [];

$statuses = $dashboard['statuses'] ?? [];

$states = $dashboard['states'] ?? [];

/*
|--------------------------------------------------------------------------
| Map needs all 37 states.
|--------------------------------------------------------------------------
|
| If all_states is not yet available in queries.php,
| temporarily fall back to states.
|
*/

$allStates =
    $dashboard['all_states']
    ?? $dashboard['states']
    ?? [];

$actors = $dashboard['actors'] ?? [];

$allActors =
    $dashboard['all_actors']
    ?? [];

$allPolicies =
    $dashboard['all_policies']
    ?? [];

$functions =
    $dashboard['functions']
    ?? [];

$actorFunctions =
    $dashboard['actor_functions']
    ?? [];

$policyScopes =
    $dashboard['policy_scopes']
    ?? [];

$finance = $dashboard['finance'] ?? [];

$financeBySubsector =
    $dashboard['finance_by_subsector']
    ?? [];

$mandates = $dashboard['mandates'] ?? [];

$policies = $dashboard['policies'] ?? [];

$targets = $dashboard['targets'] ?? [];


/* ============================================================
   HELPERS
============================================================ */

function formatMoney($value): string
{
    $value = (float) $value;

    if ($value >= 1000000000) {
        return '$'
            . number_format(
                $value / 1000000000,
                2
            )
            . 'bn';
    }

    if ($value >= 1000000) {
        return '$'
            . number_format(
                $value / 1000000,
                1
            )
            . 'm';
    }

    if ($value >= 1000) {
        return '$'
            . number_format(
                $value / 1000,
                1
            )
            . 'k';
    }

    return '$'
        . number_format(
            $value,
            0
        );
}


function safeText($value): string
{
    return htmlspecialchars(
        (string) ($value ?? ''),
        ENT_QUOTES,
        'UTF-8'
    );
}

?>


<!-- =========================================================
     FRONTEND DATA
========================================================= -->

<script>

window.INETTEnergyData = <?= json_encode(
    [
        'overview' => $overview,

        'subsectors' => $subsectors,

        'statuses' => $statuses,

        'states' => $allStates,

        'actors' => $actors,

        'functions' => $functions,

        'all_actors' => $allActors,

        'all_policies' => $allPolicies,

        'actor_functions' => $actorFunctions,

        'policy_scopes' => $policyScopes,

        'finance' => $finance,

        'finance_by_subsector' => $financeBySubsector,

        'mandates' => $mandates,

        'policies' => $policies,

        'targets' => $targets,

        'initiatives' => $dashboard['initiatives'],

        'initiative_locations' => $dashboard['initiative_locations'],

        'initiative_actors' => $dashboard['initiative_actors'],

        'initiative_subsectors' => $dashboard['initiative_subsectors'],
    ],
    JSON_UNESCAPED_UNICODE
    | JSON_UNESCAPED_SLASHES
    | JSON_NUMERIC_CHECK
); ?>;


window.INETTThemeUrl =
    "<?php get_theme_url(); ?>";

</script>


<main class="energy-dashboard">


    <!-- =====================================================
         HERO
    ====================================================== -->

    <section class="energy-hero">

        <div class="energy-container">

            <div class="energy-eyebrow">
                INETT Energy Transition Tracker
            </div>

            <h1>
                Nigeria Energy Transition Intelligence
            </h1>

            <p>
                A coordination and analytics platform mapping
                energy-sector initiatives, institutions,
                finance, policies, targets and geographic
                activity across Nigeria.
            </p>

        </div>

    </section>



    <!-- =====================================================
         INTELLIGENCE NAVIGATION
    ====================================================== -->

    <div class="energy-intelligence-nav">

        <div class="energy-container">

            <nav
                class="energy-tabs"
                aria-label="Energy intelligence sections"
                role="tablist"
            >

                <button
                    type="button"
                    class="energy-tab-button active"
                    data-energy-tab="overview"
                    role="tab"
                    aria-selected="true"
                >
                    Overview
                </button>


                <button
                    type="button"
                    class="energy-tab-button"
                    data-energy-tab="geography"
                    role="tab"
                    aria-selected="false"
                >
                    Geography &amp; Initiatives
                </button>


                <button
                    type="button"
                    class="energy-tab-button"
                    data-energy-tab="actors"
                    role="tab"
                    aria-selected="false"
                >
                    Actors &amp; Mandates
                </button>


                <button
                    type="button"
                    class="energy-tab-button"
                    data-energy-tab="finance"
                    role="tab"
                    aria-selected="false"
                >
                    Finance
                </button>


                <button
                    type="button"
                    class="energy-tab-button"
                    data-energy-tab="policies"
                    role="tab"
                    aria-selected="false"
                >
                    Policies
                </button>


                <button
                    type="button"
                    class="energy-tab-button"
                    data-energy-tab="targets"
                    role="tab"
                    aria-selected="false"
                >
                    Targets
                </button>

            </nav>

        </div>

    </div>



    <!-- =====================================================
         GLOBAL FILTER BAR
         
         UI only for now.
         We wire these into cross-filtering next.
    ====================================================== -->

    <div class="energy-filter-shell">

        <div class="energy-container">

            <div class="energy-global-filters">


                <!-- =========================================================
                    SUBSECTOR MULTISELECT
                ========================================================== -->

                <div class="energy-filter-group">

                    <label>
                        Subsector
                    </label>

                    <div
                        class="energy-multiselect"
                        id="energy-filter-subsector"
                        data-filter-key="subsectors"
                    >

                        <button
                            type="button"
                            class="energy-multiselect-trigger"
                            aria-expanded="false"
                        >
                            <span class="energy-multiselect-label">
                                All subsectors
                            </span>

                            <span class="energy-multiselect-arrow">
                                ▾
                            </span>
                        </button>


                        <div class="energy-multiselect-menu">

                            <button
                                type="button"
                                class="energy-multiselect-select-all"
                            >
                                Select all
                            </button>

                            <div class="energy-multiselect-options">

                                <?php foreach ($subsectors as $item): ?>

                                    <label class="energy-multiselect-option">

                                        <input
                                            type="checkbox"
                                            value="<?= safeText(
                                                $item['subsector']
                                            ); ?>"
                                        >

                                        <span>
                                            <?= safeText(
                                                $item['subsector']
                                            ); ?>
                                        </span>

                                    </label>

                                <?php endforeach; ?>

                            </div>

                        </div>

                    </div>

                </div>


                <!-- =========================================================
                    STATE MULTISELECT
                ========================================================== -->

                <div class="energy-filter-group">

                    <label>
                        State
                    </label>

                    <div
                        class="energy-multiselect"
                        id="energy-filter-state"
                        data-filter-key="states"
                    >

                        <button
                            type="button"
                            class="energy-multiselect-trigger"
                            aria-expanded="false"
                        >
                            <span class="energy-multiselect-label">
                                All Nigeria
                            </span>

                            <span class="energy-multiselect-arrow">
                                ▾
                            </span>
                        </button>


                        <div class="energy-multiselect-menu">

                                    <button
                                        type="button"
                                        class="energy-multiselect-select-all"
                                    >
                                        Select all
                                    </button>

                            <div class="energy-multiselect-options">

                                <?php foreach ($allStates as $state): ?>

                                    <label class="energy-multiselect-option">

                                        <input
                                            type="checkbox"
                                            value="<?= safeText(
                                                $state['state_code']
                                            ); ?>"
                                            data-label="<?= safeText(
                                                $state['state_name']
                                            ); ?>"
                                        >

                                        <span>
                                            <?= safeText(
                                                $state['state_name']
                                            ); ?>
                                        </span>

                                    </label>

                                <?php endforeach; ?>

                            </div>

                        </div>

                    </div>

                </div>


                <!-- =========================================================
                    STATUS MULTISELECT
                ========================================================== -->

                <div class="energy-filter-group">

                    <label>
                        Status
                    </label>

                    <div
                        class="energy-multiselect"
                        id="energy-filter-status"
                        data-filter-key="statuses"
                    >

                        <button
                            type="button"
                            class="energy-multiselect-trigger"
                            aria-expanded="false"
                        >
                            <span class="energy-multiselect-label">
                                All statuses
                            </span>

                            <span class="energy-multiselect-arrow">
                                ▾
                            </span>
                        </button>


                        <div class="energy-multiselect-menu">

                            <button
                                type="button"
                                class="energy-multiselect-select-all"
                            >
                                Select all
                            </button>

                            <div class="energy-multiselect-options">

                                <?php foreach ($statuses as $status): ?>

                                    <label class="energy-multiselect-option">

                                        <input
                                            type="checkbox"
                                            value="<?= safeText(
                                                $status['status']
                                            ); ?>"
                                        >

                                        <span>
                                            <?= safeText(
                                                $status['status']
                                            ); ?>
                                        </span>

                                    </label>

                                <?php endforeach; ?>

                            </div>

                        </div>

                    </div>

                </div>


                <button
                    type="button"
                    class="energy-filter-reset"
                    id="energy-filter-reset"
                >
                    Reset filters
                </button>

            </div>

        </div>

    </div>



    <!-- =====================================================
         TAB CONTENT
    ====================================================== -->

    <div class="energy-intelligence-content">



        <!-- =================================================
             TAB 1 — OVERVIEW
        ================================================== -->

        <div
            class="energy-tab-panel active"
            data-energy-panel="overview"
            role="tabpanel"
        >


            <!-- KPI STRIP -->

            <section class="energy-kpis">

                <div
                    class="
                        energy-container
                        energy-kpi-grid
                    "
                >


                    <article class="energy-kpi-card">

                        <span class="energy-kpi-label">
                            Initiatives
                        </span>

                        <strong
                            class="energy-kpi-value"
                            id="kpi-total-initiatives"
                        >
                            <?= number_format(
                                $overview[
                                    'total_initiatives'
                                ] ?? 0
                            ); ?>
                        </strong>

                        <small>
                            <span
                                id="kpi-active-initiatives"
                            >
                                <?= number_format(
                                    $overview[
                                        'active_initiatives'
                                    ] ?? 0
                                ); ?>
                            </span>
                            active
                        </small>

                    </article>



                    <article class="energy-kpi-card">

                        <span class="energy-kpi-label">
                            Actors
                        </span>

                        <strong
                            class="energy-kpi-value"
                            id="kpi-total-actors"
                        >
                            <?= number_format(
                                $overview[
                                    'total_actors'
                                ] ?? 0
                            ); ?>
                        </strong>

                        <small>
                            institutions and partners
                        </small>

                    </article>



                    <article class="energy-kpi-card">

                        <span class="energy-kpi-label">
                            Policies
                        </span>

                        <strong
                            class="energy-kpi-value"
                        >
                            <?= number_format(
                                $overview[
                                    'total_policies'
                                ] ?? 0
                            ); ?>
                        </strong>

                        <small>
                            policy instruments tracked
                        </small>

                    </article>



                    <article class="energy-kpi-card">

                        <span class="energy-kpi-label">
                            Finance tracked
                        </span>

                        <strong
                            class="energy-kpi-value"
                            id="kpi-finance"
                        >
                            <?= formatMoney(
                                $overview[
                                    'finance_tracked_usd'
                                ] ?? 0
                            ); ?>
                        </strong>

                        <small>
                            <?= number_format(
                                $overview[
                                    'aggregation_eligible_finance_records'
                                ] ?? 0
                            ); ?>
                            eligible records
                        </small>

                    </article>



                    <article class="energy-kpi-card">

                        <span class="energy-kpi-label">
                            Geographic coverage
                        </span>

                        <strong
                            class="energy-kpi-value"
                            id="kpi-state-coverage"
                        >
                            <?= number_format(
                                $overview[
                                    'states_with_initiatives'
                                ] ?? 0
                            ); ?>
                        </strong>

                        <small>
                            of
                            <?= number_format(
                                $overview[
                                    'total_states_fct'
                                ] ?? 0
                            ); ?>
                            states/FCT
                        </small>

                    </article>



                    <article class="energy-kpi-card">

                        <span class="energy-kpi-label">
                            Mandate gaps
                        </span>

                        <strong
                            class="energy-kpi-value"
                        >
                            <?= number_format(
                                $overview[
                                    'functions_without_actor_mapping'
                                ] ?? 0
                            ); ?>
                        </strong>

                        <small>
                            functions without actor mapping
                        </small>

                    </article>


                </div>

            </section>



            <!-- OVERVIEW CHARTS -->

            <section class="energy-section">

                <div class="energy-container">

                    <div class="energy-section-header">

                        <div>

                            <span class="energy-section-eyebrow">
                                Sector landscape
                            </span>

                            <h2>
                                Energy initiative distribution
                            </h2>

                            <p
                                class="
                                    energy-section-description
                                "
                            >
                                Compare tracked initiative
                                activity across Energy Transition
                                Plan subsectors and implementation
                                status.
                            </p>

                        </div>

                    </div>


                    <div class="energy-chart-grid">


                        <div
                            class="
                                energy-chart-panel
                                energy-chart-panel-large
                            "
                        >

                            <div class="energy-chart-header">

                                <div>

                                    <h3>
                                        Initiatives by subsector
                                    </h3>

                                    <p>
                                        Distribution of tracked
                                        initiatives by primary
                                        subsector.
                                    </p>

                                </div>

                            </div>


                            <div
                                id="subsector-chart"
                                class="energy-chart"
                            ></div>

                        </div>



                        <div class="energy-chart-panel">

                            <div class="energy-chart-header">

                                <div>

                                    <h3>
                                        Initiative status
                                    </h3>

                                    <p>
                                        Current implementation
                                        status of tracked
                                        initiatives.
                                    </p>

                                </div>

                            </div>


                            <div
                                id="status-chart"
                                class="energy-chart"
                            ></div>

                        </div>


                    </div>

                </div>

            </section>



            <!-- QUICK SIGNALS -->

            <section
                class="
                    energy-section
                    energy-section-muted
                "
            >

                <div class="energy-container">

                    <div class="energy-two-column">


                        <!-- TOP STATES -->

                        <div class="energy-panel">

                            <div class="energy-section-header">

                                <div>

                                    <span
                                        class="
                                            energy-section-eyebrow
                                        "
                                    >
                                        Geographic concentration
                                    </span>

                                    <h2>
                                        Most active states
                                    </h2>

                                </div>

                            </div>


                            <div class="energy-table-wrap">

                                <table class="energy-table">

                                    <thead>

                                        <tr>

                                            <th>
                                                State
                                            </th>

                                            <th>
                                                Initiatives
                                            </th>

                                            <th>
                                                Active
                                            </th>

                                            <th>
                                                Actors
                                            </th>

                                        </tr>

                                    </thead>


                                    <tbody>

                                        <?php
                                        foreach (
                                            $states
                                            as $state
                                        ):
                                        ?>

                                            <tr>

                                                <td>

                                                    <strong>
                                                        <?= safeText(
                                                            $state[
                                                                'state_name'
                                                            ]
                                                        ); ?>
                                                    </strong>

                                                    <small>
                                                        <?= safeText(
                                                            $state[
                                                                'geopolitical_zone'
                                                            ]
                                                            ?? ''
                                                        ); ?>
                                                    </small>

                                                </td>


                                                <td>
                                                    <?= number_format(
                                                        $state[
                                                            'initiative_count'
                                                        ] ?? 0
                                                    ); ?>
                                                </td>


                                                <td>
                                                    <?= number_format(
                                                        $state[
                                                            'active_initiative_count'
                                                        ] ?? 0
                                                    ); ?>
                                                </td>


                                                <td>
                                                    <?= number_format(
                                                        $state[
                                                            'participating_actor_count'
                                                        ] ?? 0
                                                    ); ?>
                                                </td>

                                            </tr>

                                        <?php endforeach; ?>

                                    </tbody>

                                </table>

                            </div>

                        </div>



                        <!-- MANDATE SIGNALS -->

                        <div class="energy-panel">

                            <div class="energy-section-header">

                                <div>

                                    <span
                                        class="
                                            energy-section-eyebrow
                                        "
                                    >
                                        Coordination intelligence
                                    </span>

                                    <div class="energy-heading-with-help">

                                        <h2>
                                            Mandate signals
                                        </h2>

                                        <button
                                            type="button"
                                            class="energy-help-tooltip"
                                            aria-label="About mandate signals"
                                        >
                                            ?

                                            <span class="energy-help-tooltip-content">

                                                <strong>
                                                    What are mandate signals?
                                                </strong>

                                                <span>
                                                    These signals reflect the current INETT institutional
                                                    mapping of energy-system functions.
                                                </span>


                                            </span>

                                        </button>

                                    </div>

                                </div>

                            </div>


                            <div class="energy-list">

                                <?php

                                $signalCount = 0;

                                foreach (
                                    $mandates
                                    as $mandate
                                ):

                                    if (
                                        !in_array(
                                            $mandate[
                                                'mandate_status'
                                            ],
                                            [
                                                'Potential overlap',
                                                'Unmapped',
                                                'No primary holder'
                                            ],
                                            true
                                        )
                                    ) {
                                        continue;
                                    }

                                    $signalCount++;

                                    if ($signalCount > 8) {
                                        break;
                                    }

                                ?>

                                    <div
                                        class="
                                            energy-list-item
                                        "
                                    >

                                        <div>

                                            <strong>
                                                <?= safeText(
                                                    $mandate[
                                                        'function_name'
                                                    ]
                                                ); ?>
                                            </strong>

                                            <small>
                                                <?= safeText(
                                                    $mandate[
                                                        'primary_subsector'
                                                    ]
                                                    ?? ''
                                                ); ?>
                                            </small>

                                        </div>


                                        

                                    </div>

                                <?php endforeach; ?>

                            </div>

                        </div>


                    </div>

                </div>

            </section>

                        <section
                class="
                    energy-section
                    energy-section-muted
                "
            >

                <div class="energy-container">

                    <div class="energy-panel">

                        <div class="energy-section-header">

                            <div>

                                <span
                                    class="
                                        energy-section-eyebrow
                                    "
                                >
                                    Relationship intelligence
                                </span>

                                <div class="energy-heading-with-help">

                                    <h2>
                                        Institutional network
                                    </h2>

                                    <button
                                        type="button"
                                        class="energy-help-tooltip"
                                        aria-label="About the institutional network"
                                    >
                                        ?

                                        <span class="energy-help-tooltip-content energy-network-help">

                                            <strong>
                                                How to use the network
                                            </strong>

                                            <span>
                                                This network shows recorded relationships between
                                                institutions, energy-system functions and policy instruments.
                                            </span>

                                            <span>
                                                <b>Hover over a node</b> to see more information and highlight
                                                its direct relationships.
                                            </span>

                                            <span>
                                                <b>Drag a node</b> to rearrange the network. The node stays
                                                where you place it.
                                            </span>

                                            <span>
                                                <b>Double-click a node</b> to release it back into the automatic
                                                layout.
                                            </span>

                                            <span>
                                                <b>Zoom and pan</b> to explore dense areas of the network.
                                            </span>

                                            <span>
                                                <b>Actor, Function and Policy controls</b> can be used to show
                                                or hide specific node types.
                                            </span>


                                            <span>
                                                <b>Reset layout</b> releases manually positioned nodes and
                                                restores the network layout.
                                            </span>

                                            <span>
                                                Connections indicate relationships recorded in the INETT
                                                dataset. Distance between nodes does not represent relationship
                                                strength.
                                            </span>

                                        </span>

                                    </button>

                                </div>

                                <p
                                    class="
                                        energy-section-description
                                    "
                                >
                                    Actor → function → policy
                                    relationships.
                                </p>

                            </div>

                        </div>
                        
                        <div class="energy-network-controls">

                            <label class="energy-network-toggle">
                                <input
                                    type="checkbox"
                                    id="network-filter-actors"
                                    checked
                                >
                                <span class="energy-network-filter-dot actor"></span>
                                Actors
                            </label>


                            <label class="energy-network-toggle">
                                <input
                                    type="checkbox"
                                    id="network-filter-functions"
                                    checked
                                >
                                <span class="energy-network-filter-dot function"></span>
                                Functions
                            </label>


                            <label class="energy-network-toggle">
                                <input
                                    type="checkbox"
                                    id="network-filter-policies"
                                    checked
                                >
                                <span class="energy-network-filter-dot policy"></span>
                                Policies
                            </label>

                            <button
                                type="button"
                                id="network-reset-layout"
                                class="energy-network-reset"
                            >
                                Reset layout
                            </button>

                        </div>

                        <div
                            id="actor-network"
                            class="energy-network"
                        >

                            

                        </div>

                    </div>

                </div>

            </section>
            
            <!-- =========================================================
                ACTOR DETAIL DRAWER
            ========================================================== -->

            <div
                id="actor-drawer-backdrop"
                class="energy-drawer-backdrop"
            ></div>

            <aside
                id="actor-drawer"
                class="energy-initiative-drawer"
                aria-hidden="true"
            >

                <div class="energy-drawer-header">

                    <div>

                        <span class="energy-section-eyebrow">
                            Actor profile
                        </span>

                        <h2 id="actor-drawer-title">
                            Actor
                        </h2>

                        <span
                            id="actor-drawer-id"
                            class="energy-drawer-id"
                        ></span>

                    </div>


                    <button
                        type="button"
                        id="actor-drawer-close"
                        class="energy-drawer-close"
                        aria-label="Close actor profile"
                    >
                        &times;
                    </button>

                </div>


                <div
                    id="actor-drawer-content"
                    class="energy-drawer-content"
                >
                    <!-- JS inserts actor profile here -->
                </div>

            </aside>


        </div>



        <!-- =================================================
             TAB 2 — 3W & GEOGRAPHY
        ================================================== -->

        <div
            class="energy-tab-panel"
            data-energy-panel="geography"
            role="tabpanel"
        >

            <section class="energy-section">

                <div class="energy-container">

                    <div class="energy-section-header">

                        <div>

                            <span
                                class="
                                    energy-section-eyebrow
                                "
                            >
                                3W intelligence
                            </span>

                            <h2>
                                Who is doing what, where?
                            </h2>

                            <p
                                class="
                                    energy-section-description
                                "
                            >
                                Explore geographic concentration,
                                implementation activity,
                                participating institutions and
                                state-level energy indicators.
                            </p>

                        </div>

                    </div>



                    <div class="energy-map-layout">


                        <!-- MAP -->

                        <div class="energy-map-panel">

                            <div
                                id="nigeria-energy-map"
                                class="energy-map"
                            ></div>

                        </div>



                        <!-- STATE PROFILE -->

                        <aside
                            class="energy-state-panel"
                            id="energy-state-panel"
                        >

                            <span
                                class="
                                    energy-section-eyebrow
                                "
                            >
                                State profile
                            </span>


                            <h3 id="state-panel-name">
                                Select a state
                            </h3>


                            <p
                                id="state-panel-description"
                                class="state-panel-intro"
                            >
                                Click a state on the map to
                                explore its Energy Transition
                                profile.
                            </p>



                            <div
                                id="state-panel-data"
                                class="state-panel-data"
                                hidden
                            >


                                <div class="state-kpi-grid">


                                    <div class="state-kpi">

                                        <span>
                                            Initiatives
                                        </span>

                                        <strong
                                            id="state-initiatives"
                                        >
                                            —
                                        </strong>

                                    </div>


                                    <div class="state-kpi">

                                        <span>
                                            Active
                                        </span>

                                        <strong
                                            id="state-active"
                                        >
                                            —
                                        </strong>

                                    </div>


                                    <div class="state-kpi">

                                        <span>
                                            Actors
                                        </span>

                                        <strong
                                            id="state-actors"
                                        >
                                            —
                                        </strong>

                                    </div>


                                    <div class="state-kpi">

                                        <span>
                                            Electricity access
                                        </span>

                                        <strong
                                            id="state-access"
                                        >
                                            —
                                        </strong>

                                    </div>


                                </div>



                                <div class="state-detail-list">


                                    <div>

                                        <span>
                                            Geopolitical zone
                                        </span>

                                        <strong
                                            id="state-zone"
                                        >
                                            —
                                        </strong>

                                    </div>


                                    <div>

                                        <span>
                                            State electricity law
                                        </span>

                                        <strong
                                            id="state-law"
                                        >
                                            —
                                        </strong>

                                    </div>


                                    <div>

                                        <span>
                                            State regulator
                                        </span>

                                        <strong
                                            id="state-regulator"
                                        >
                                            —
                                        </strong>

                                    </div>


                                    <div>

                                        <span>
                                            Known project value
                                        </span>

                                        <strong
                                            id="state-value"
                                        >
                                            —
                                        </strong>

                                    </div>


                                </div>


                            </div>

                        </aside>


                    </div>

                </div>

            </section>

            <section class="energy-section energy-section-muted">

                <div class="energy-container">

                    <div class="energy-section-header">

                        <div>
                            <span class="energy-section-eyebrow">
                                Initiative explorer
                            </span>

                            <h2>
                                Filtered initiatives
                            </h2>

                            <p class="energy-section-description">
                                Explore the initiatives behind the current geographic
                                and sector filters.
                            </p>
                        </div>

                        <div class="energy-explorer-actions">

                            <input
                                type="search"
                                id="initiative-search"
                                class="energy-explorer-search"
                                placeholder="Search initiatives..."
                            >

                            <span
                                id="initiative-result-count"
                                class="energy-result-count"
                            >
                                0 initiatives
                            </span>

                        </div>

                    </div>


                    <div class="energy-panel">

                        <div class="energy-table-wrap">

                            <table class="energy-table energy-initiative-table">

                                <thead>
                                    <tr>
                                        <th>Initiative</th>
                                        <th>Subsector</th>
                                        <th>Status</th>
                                        <th>Technology</th>
                                        <th>Lead actor</th>
                                        <th>Value</th>
                                    </tr>
                                </thead>

                                <tbody id="initiative-explorer-body">

                                    <tr>
                                        <td colspan="6">
                                            Loading initiatives...
                                        </td>
                                    </tr>

                                </tbody>

                            </table>

                        </div>
                        <div class="energy-pagination">

                            <button
                                type="button"
                                id="initiative-page-prev"
                                class="energy-pagination-button"
                            >
                                Previous
                            </button>

                            <span
                                id="initiative-page-info"
                                class="energy-pagination-info"
                            >
                                Page 1 of 1
                            </span>

                            <button
                                type="button"
                                id="initiative-page-next"
                                class="energy-pagination-button"
                            >
                                Next
                            </button>

                        </div>

                    </div>

                </div>

            </section>

            <!-- FUTURE 3W VISUALS -->

            <section
                class="
                    energy-section
                    energy-section-muted
                "
            >

                <div class="energy-container">

                    <div class="energy-chart-grid">


                        <div class="energy-chart-panel">

                            <div class="energy-chart-header">

                                <div>

                                    <h3>
                                        Initiatives by state
                                    </h3>

                                    <p>
                                        Geographic concentration
                                        of tracked activity.
                                    </p>

                                </div>

                            </div>


                            <div
                                id="state-ranking-chart"
                                class="energy-chart"
                            ></div>

                        </div>



                        <div class="energy-chart-panel">

                            <div class="energy-chart-header">

                                <div>

                                    <h3>
                                        Technology mix
                                    </h3>

                                    <p>
                                        Technology distribution
                                        across filtered
                                        initiatives.
                                    </p>

                                </div>

                            </div>


                            <div
                                id="technology-chart"
                                class="energy-chart"
                            ></div>

                        </div>


                    </div>

                </div>

            </section>

            <!-- =========================================================
                INITIATIVE DETAIL DRAWER
            ========================================================== -->

            <div
                id="initiative-drawer-backdrop"
                class="energy-drawer-backdrop"
            ></div>

            <aside
                id="initiative-drawer"
                class="energy-initiative-drawer"
                aria-hidden="true"
            >

                <div class="energy-drawer-header">

                    <div>
                        <span class="energy-section-eyebrow">
                            Initiative profile
                        </span>

                        <h2 id="initiative-drawer-title">
                            Initiative
                        </h2>

                        <span
                            id="initiative-drawer-id"
                            class="energy-drawer-id"
                        ></span>
                    </div>

                   <button
                        type="button"
                        class="energy-drawer-close"
                        id="initiative-drawer-close"
                        aria-label="Close initiative profile"
                    >
                        &times;
                    </button>

                </div>


                <div
                    id="initiative-drawer-content"
                    class="energy-drawer-content"
                >
                    <!-- JS inserts initiative details here -->
                </div>

            </aside>

        </div>



        <!-- =================================================
             TAB 3 — ACTORS & MANDATES
        ================================================== -->

        <div
            class="energy-tab-panel"
            data-energy-panel="actors"
            role="tabpanel"
        >

            <section class="energy-section">

                <div class="energy-container">

                    <div class="energy-section-header">

                        <div>

                            <span
                                class="
                                    energy-section-eyebrow
                                "
                            >
                                Institutional intelligence
                            </span>

                            <h2>
                                Actors &amp; mandates
                            </h2>

                            <p
                                class="
                                    energy-section-description
                                "
                            >
                                Examine institutional activity,
                                mandate allocation, coordination
                                gaps and potential overlaps.
                            </p>

                        </div>

                    </div>


                    <div class="energy-chart-panel energy-actor-activity-panel">

                        <div class="energy-chart-header">

                            <div>

                                <h3>
                                    Actor activity
                                </h3>

                                <p>
                                    Institutions ranked by the number of tracked initiatives
                                    they participate in.
                                </p>

                            </div>

                        </div>


                        <div
                            id="actor-activity-chart"
                            class="energy-chart"
                        ></div>

                    </div>


                    <div class="energy-two-column">


                        <!-- ACTIVE ACTORS -->

                        <div class="energy-panel">

                            <div class="energy-section-header">

                                <div>

                                    <span
                                        class="
                                            energy-section-eyebrow
                                        "
                                    >
                                        Activity
                                    </span>

                                    <h2>
                                        Most active actors
                                    </h2>

                                </div>

                            </div>


                            <div class="energy-list">

                                <?php foreach (
                                    $actors
                                    as $actor
                                ): ?>

                                    <button
                                        type="button"
                                        class="
                                            energy-list-item
                                            energy-actor-row
                                        "
                                        data-actor-id="<?= safeText(
                                            $actor[
                                                'actor_id'
                                            ]
                                            ?? ''
                                        ); ?>"
                                    >

                                        <div>

                                            <strong>
                                                <?= safeText(
                                                    $actor[
                                                        'acronym'
                                                    ]
                                                    ?:
                                                    $actor[
                                                        'organisation_name'
                                                    ]
                                                ); ?>
                                            </strong>

                                            <small>
                                                <?= safeText(
                                                    $actor[
                                                        'organisation_name'
                                                    ]
                                                ); ?>
                                            </small>

                                        </div>


                                        <div
                                            class="
                                                energy-list-meta
                                            "
                                        >

                                            <span>
                                                <?= number_format(
                                                    $actor[
                                                        'initiative_count'
                                                    ] ?? 0
                                                ); ?>
                                                initiatives
                                            </span>

                                            <span>
                                                <?= number_format(
                                                    $actor[
                                                        'states_reached'
                                                    ] ?? 0
                                                ); ?>
                                                states
                                            </span>

                                        </div>

                                    </button>

                                <?php endforeach; ?>

                            </div>

                        </div>



                        <!-- MANDATE COVERAGE -->

                        <div class="energy-panel">

                            <div class="energy-section-header">

                                <div>

                                    <span
                                        class="
                                            energy-section-eyebrow
                                        "
                                    >
                                        Governance
                                    </span>

                                    <h2>
                                        Mandate coverage
                                    </h2>

                                </div>

                            </div>


                            <div id="mandate-list"
                                class="energy-list">

                                <?php foreach (
                                    $mandates
                                    as $mandate
                                ): ?>

                                    <div
                                        class="
                                            energy-list-item
                                            energy-mandate-row
                                        "
                                    >

                                        <div>

                                            <strong>
                                                <?= safeText(
                                                    $mandate[
                                                        'function_name'
                                                    ]
                                                ); ?>
                                            </strong>

                                            <small>
                                                <?= safeText(
                                                    $mandate[
                                                        'primary_subsector'
                                                    ]
                                                    ?? ''
                                                ); ?>
                                            </small>

                                        </div>


                                        

                                    </div>

                                <?php endforeach; ?>

                            </div>
                            <div class="energy-pagination">

                                <button
                                    type="button"
                                    id="mandate-page-prev"
                                    class="energy-pagination-button"
                                >
                                    Previous
                                </button>


                                <span
                                    id="mandate-page-info"
                                    class="energy-pagination-info"
                                >
                                    Page 1 of 1
                                </span>


                                <button
                                    type="button"
                                    id="mandate-page-next"
                                    class="energy-pagination-button"
                                >
                                    Next
                                </button>

                            </div>

                        </div>


                    </div>

                </div>

            </section>

            <section class="energy-section">

                <div class="energy-container">


                <div class="energy-section-header">

                    <div>
                        <span class="energy-section-eyebrow">
                            Directory
                        </span>

                        <h2>
                            Actor directory
                        </h2>

                        <p class="energy-section-description">
                            Browse institutions participating in initiatives matching
                            the current dashboard filters.
                        </p>
                    </div>

                </div>


                <div class="energy-panel">

                    <div class="energy-directory-toolbar">

                        <input
                            type="search"
                            id="actor-directory-search"
                            class="energy-directory-search"
                            placeholder="Search organisation or acronym..."
                            autocomplete="off"
                        >


                        <span
                            id="actor-directory-count"
                            class="energy-directory-count"
                        >
                            0 actors
                        </span>

                    </div>


                    <div class="energy-table-wrap">

                        <table class="energy-table">

                            <thead>

                                <tr>
                                    <th>Organisation</th>
                                    <th>Type</th>
                                    <th>Primary role</th>
                                    <th>Initiatives</th>
                                    <th>States reached</th>
                                </tr>

                            </thead>


                            <tbody
                                id="actor-directory-body"
                            ></tbody>

                        </table>

                    </div>


                    <div class="energy-pagination">

                        <button
                            type="button"
                            id="actor-directory-prev"
                            class="energy-pagination-button"
                        >
                            Previous
                        </button>


                        <span
                            id="actor-directory-page-info"
                            class="energy-pagination-info"
                        >
                            Page 1 of 1
                        </span>


                        <button
                            type="button"
                            id="actor-directory-next"
                            class="energy-pagination-button"
                        >
                            Next
                        </button>

                    </div>

                </div>

                </div>

            </section>



            <!-- D3 NETWORK AREA -->



        </div>



        <!-- =================================================
             TAB 4 — FINANCE
        ================================================== -->

        <div
            class="energy-tab-panel"
            data-energy-panel="finance"
            role="tabpanel"
        >

            <section class="energy-section">

                <div class="energy-container">


                    <div class="energy-section-header">

                        <div>

                            <span
                                class="
                                    energy-section-eyebrow
                                "
                            >
                                Finance intelligence
                            </span>

                            <h2>
                                Financing the transition
                            </h2>

                            <p
                                class="
                                    energy-section-description
                                "
                            >
                                Explore tracked finance flows,
                                providers, recipients,
                                instruments and subsector
                                allocation.
                            </p>

                        </div>

                    </div>



                    <!-- FINANCE KPIS -->

                    <div class="energy-kpi-grid finance-kpi-grid">


                        <article class="energy-kpi-card">

                            <span class="energy-kpi-label">
                                Tracked finance
                            </span>

                            <strong class="energy-kpi-value">
                                <?= formatMoney(
                                    $finance[
                                        'tracked_finance_usd'
                                    ] ?? 0
                                ); ?>
                            </strong>

                            <small>
                                aggregation eligible
                            </small>

                        </article>


                        <article class="energy-kpi-card">

                            <span class="energy-kpi-label">
                                Finance records
                            </span>

                            <strong class="energy-kpi-value">
                                <?= number_format(
                                    $finance[
                                        'finance_records'
                                    ] ?? 0
                                ); ?>
                            </strong>

                            <small>
                                total records
                            </small>

                        </article>


                        <article class="energy-kpi-card">

                            <span class="energy-kpi-label">
                                Eligible records
                            </span>

                            <strong class="energy-kpi-value">
                                <?= number_format(
                                    $finance[
                                        'aggregation_eligible_records'
                                    ] ?? 0
                                ); ?>
                            </strong>

                            <small>
                                included in totals
                            </small>

                        </article>


                        <article class="energy-kpi-card">

                            <span class="energy-kpi-label">
                                Providers
                            </span>

                            <strong class="energy-kpi-value">
                                <?= number_format(
                                    $finance[
                                        'tracked_provider_count'
                                    ] ?? 0
                                ); ?>
                            </strong>

                            <small>
                                tracked providers
                            </small>

                        </article>


                        <article class="energy-kpi-card">

                            <span class="energy-kpi-label">
                                Recipients
                            </span>

                            <strong class="energy-kpi-value">
                                <?= number_format(
                                    $finance[
                                        'tracked_recipient_count'
                                    ] ?? 0
                                ); ?>
                            </strong>

                            <small>
                                tracked recipients
                            </small>

                        </article>


                    </div>


                </div>

            </section>



            <section
                class="
                    energy-section
                    energy-section-muted
                "
            >

                <div class="energy-container">

                    <div class="energy-chart-grid">


                        <div class="energy-chart-panel">

                            <div class="energy-chart-header">

                                <div>

                                    <h3>
                                        Finance by subsector
                                    </h3>

                                    <p>
                                        Aggregation-eligible
                                        finance by sector.
                                    </p>

                                </div>

                            </div>


                            <div
                                id="finance-subsector-chart"
                                class="energy-chart"
                            ></div>

                        </div>



                        <div class="energy-chart-panel">

                            <div class="energy-chart-header">

                                <div>

                                    <h3>
                                        Finance flow
                                    </h3>

                                    <p>
                                        Provider → recipient →
                                        initiative relationships.
                                    </p>

                                </div>

                            </div>


                            <div
                                id="finance-sankey-chart"
                                class="energy-chart"
                            ></div>

                        </div>


                    </div>

                </div>

            </section>


        </div>



        <!-- =================================================
             TAB 5 — POLICIES
        ================================================== -->

        <div
            class="energy-tab-panel"
            data-energy-panel="policies"
            role="tabpanel"
        >

            <section class="energy-section">

                <div class="energy-container">

                    <div class="energy-section-header">

                        <div>

                            <span
                                class="
                                    energy-section-eyebrow
                                "
                            >
                                Governance intelligence
                            </span>

                            <h2>
                                Policies &amp; instruments
                            </h2>

                            <p
                                class="
                                    energy-section-description
                                "
                            >
                                Explore the policy landscape,
                                legal instruments, functions
                                covered and institutional
                                responsibilities.
                            </p>

                        </div>

                    </div>



                    <div class="energy-two-column">


                        <!-- POLICY LIST -->

                        <div class="energy-panel">

                            <div class="energy-section-header">

                                <div>

                                    <h2>
                                        Policy library
                                    </h2>

                                </div>

                            </div>


                            <div class="energy-list">

                                <?php foreach (
                                    $policies
                                    as $policy
                                ): ?>

                                    <button
                                        type="button"
                                        class="
                                            energy-list-item
                                            energy-policy-row
                                        "
                                        data-policy-id="<?= safeText(
                                            $policy[
                                                'policy_id'
                                            ]
                                            ?? ''
                                        ); ?>"
                                    >

                                        <div>

                                            <strong>
                                                <?= safeText(
                                                    $policy[
                                                        'short_name'
                                                    ]
                                                    ?:
                                                    $policy[
                                                        'instrument_name'
                                                    ]
                                                ); ?>
                                            </strong>


                                            <small>

                                                <?= safeText(
                                                    $policy[
                                                        'instrument_type'
                                                    ]
                                                    ?? ''
                                                ); ?>


                                                <?php if (
                                                    !empty(
                                                        $policy[
                                                            'publication_year'
                                                        ]
                                                    )
                                                ): ?>

                                                    ·
                                                    <?= safeText(
                                                        $policy[
                                                            'publication_year'
                                                        ]
                                                    ); ?>

                                                <?php endif; ?>

                                            </small>

                                        </div>


                                        <span>

                                            <?= number_format(
                                                $policy[
                                                    'function_count'
                                                ] ?? 0
                                            ); ?>

                                            functions

                                        </span>

                                    </button>

                                <?php endforeach; ?>

                            </div>

                        </div>



                        <!-- POLICY MATRIX -->

                        <div class="energy-panel">

                            <div class="energy-section-header">

                                <div>

                                    <h2>
                                        Policy coverage matrix
                                    </h2>

                                    <p
                                        class="
                                            energy-section-description
                                        "
                                    >
                                        Policy coverage across
                                        functions and subsectors.
                                    </p>

                                </div>

                            </div>


                            <div
                                id="policy-matrix-chart"
                                class="energy-chart"
                            ></div>

                        </div>


                    </div>

                </div>

            </section>


        </div>



        <!-- =================================================
             TAB 6 — TARGETS
        ================================================== -->

        <div
            class="energy-tab-panel"
            data-energy-panel="targets"
            role="tabpanel"
        >

            <section class="energy-section">

                <div class="energy-container">


                    <div class="energy-section-header">

                        <div>

                            <span
                                class="
                                    energy-section-eyebrow
                                "
                            >
                                Monitoring intelligence
                            </span>

                            <h2>
                                Targets &amp; progress
                            </h2>

                            <p
                                class="
                                    energy-section-description
                                "
                            >
                                Track Energy Transition
                                commitments, target dates,
                                monitoring coverage and
                                observation gaps.
                            </p>

                        </div>

                    </div>



                    <div class="energy-two-column">


                        <!-- TARGET VISUAL -->

                        <div class="energy-panel">

                            <div class="energy-section-header">

                                <div>

                                    <h2>
                                        Targets by framework
                                    </h2>

                                </div>

                            </div>


                            <div
                                id="targets-framework-chart"
                                class="energy-chart"
                            ></div>

                        </div>



                        <!-- TARGET LIST -->

                        <div class="energy-panel">

                            <div class="energy-section-header">

                                <div>

                                    <h2>
                                        Monitoring readiness
                                    </h2>

                                </div>

                            </div>


                            <div class="energy-list">

                                <?php foreach (
                                    $targets
                                    as $target
                                ): ?>

                                    <button
                                        type="button"
                                        class="
                                            energy-list-item
                                            energy-target-row
                                        "
                                        data-target-id="<?= safeText(
                                            $target[
                                                'target_id'
                                            ]
                                            ?? ''
                                        ); ?>"
                                    >

                                        <div>

                                            <strong>
                                                <?= safeText(
                                                    $target[
                                                        'indicator'
                                                    ]
                                                    ?:
                                                    $target[
                                                        'target_statement'
                                                    ]
                                                ); ?>
                                            </strong>


                                            <small>

                                                <?= safeText(
                                                    $target[
                                                        'framework'
                                                    ]
                                                    ?? ''
                                                ); ?>


                                                <?php if (
                                                    !empty(
                                                        $target[
                                                            'target_year'
                                                        ]
                                                    )
                                                ): ?>

                                                    · target
                                                    <?= safeText(
                                                        $target[
                                                            'target_year'
                                                        ]
                                                    ); ?>

                                                <?php endif; ?>

                                            </small>

                                        </div>


                                        <span>

                                            <?= number_format(
                                                $target[
                                                    'observation_count'
                                                ] ?? 0
                                            ); ?>

                                            obs.

                                        </span>

                                    </button>

                                <?php endforeach; ?>

                            </div>

                        </div>


                    </div>

                </div>

            </section>


        </div>


    </div>


</main>


<?php include('footer.inc.php'); ?>