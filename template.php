<?php

if (!defined('IN_GS')) {
    die('You cannot load this page directly.');
}

include('header.inc.php');

require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/queries.php';

$dashboard = getEnergyDashboardData($energyDb);

$overview = $dashboard['overview'];
$subsectors = $dashboard['subsectors'];
$states = $dashboard['states'];
$actors = $dashboard['actors'];
$finance = $dashboard['finance'];
$mandates = $dashboard['mandates'];
$policies = $dashboard['policies'];
$targets = $dashboard['targets'];




/*
|--------------------------------------------------------------------------
| Helper formatter
|--------------------------------------------------------------------------
*/

function formatMoney($value): string
{
    $value = (float) $value;

    if ($value >= 1000000000) {
        return '$' . number_format($value / 1000000000, 2) . 'bn';
    }

    if ($value >= 1000000) {
        return '$' . number_format($value / 1000000, 1) . 'm';
    }

    if ($value >= 1000) {
        return '$' . number_format($value / 1000, 1) . 'k';
    }

    return '$' . number_format($value, 0);
}

?>

<script>

window.INETTEnergyData = <?= json_encode(
    [
        'subsectors' =>
            $dashboard['subsectors'],

        'statuses' =>
            $dashboard['statuses'],

        'states' =>
            $dashboard['all_states']
    ],
    JSON_UNESCAPED_UNICODE
    | JSON_UNESCAPED_SLASHES
    | JSON_NUMERIC_CHECK
); ?>;


window.INETTThemeUrl =
    "<?php get_theme_url(); ?>";

</script>

<main class="energy-dashboard">

    <section class="energy-hero">

        <div class="energy-container">

            <div class="energy-eyebrow">
                INETT Energy Transition Tracker
            </div>

            <h1>
                Nigeria Energy Transition Intelligence
            </h1>

            <p>
                A coordination and analytics platform mapping energy-sector
                initiatives, institutions, finance, policies, targets and
                geographic coverage across Nigeria.
            </p>

        </div>

    </section>


    <section class="energy-kpis">

        <div class="energy-container energy-kpi-grid">

            <article class="energy-kpi-card">
                <span class="energy-kpi-label">
                    Initiatives
                </span>

                <strong class="energy-kpi-value">
                    <?= number_format(
                        $overview['total_initiatives'] ?? 0
                    ); ?>
                </strong>

                <small>
                    <?= number_format(
                        $overview['active_initiatives'] ?? 0
                    ); ?>
                    active
                </small>
            </article>


            <article class="energy-kpi-card">
                <span class="energy-kpi-label">
                    Actors
                </span>

                <strong class="energy-kpi-value">
                    <?= number_format(
                        $overview['total_actors'] ?? 0
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

                <strong class="energy-kpi-value">
                    <?= number_format(
                        $overview['total_policies'] ?? 0
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

                <strong class="energy-kpi-value">
                    <?= formatMoney(
                        $overview['finance_tracked_usd'] ?? 0
                    ); ?>
                </strong>

                <small>
                    <?= number_format(
                        $overview[
                            'aggregation_eligible_finance_records'
                        ] ?? 0
                    ); ?>
                    aggregation-eligible records
                </small>
            </article>


            <article class="energy-kpi-card">
                <span class="energy-kpi-label">
                    Geographic coverage
                </span>

                <strong class="energy-kpi-value">
                    <?= number_format(
                        $overview['states_with_initiatives'] ?? 0
                    ); ?>
                </strong>

                <small>
                    of
                    <?= number_format(
                        $overview['total_states_fct'] ?? 0
                    ); ?>
                    states/FCT represented
                </small>
            </article>


            <article class="energy-kpi-card">
                <span class="energy-kpi-label">
                    Mandate gaps
                </span>

                <strong class="energy-kpi-value">
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

                    <p class="energy-section-description">
                        Compare initiative volume across energy-transition subsectors
                        and current implementation status.
                    </p>
                </div>
            </div>

            <div class="energy-chart-grid">

                <div class="energy-chart-panel energy-chart-panel-large">

                    <div class="energy-chart-header">
                        <div>
                            <h3>Initiatives by subsector</h3>
                            <p>
                                Number of tracked initiatives by primary subsector.
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
                            <h3>Initiative status</h3>
                            <p>
                                Current status of tracked initiatives.
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

    <!-- =========================================================
     GEOGRAPHIC INTELLIGENCE
========================================================= -->

    <section class="energy-section energy-section-muted">

        <div class="energy-container">

            <div class="energy-section-header">

                <div>

                    <span class="energy-section-eyebrow">
                        Geographic intelligence
                    </span>

                    <h2>
                        Energy activity across Nigeria
                    </h2>

                    <p class="energy-section-description">
                        Explore initiative concentration,
                        institutional activity and energy-transition
                        indicators across Nigeria's 36 states and FCT.
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


                <!-- STATE DETAILS -->
                <aside
                    class="energy-state-panel"
                    id="energy-state-panel"
                >

                    <span class="energy-section-eyebrow">
                        State profile
                    </span>


                    <h3 id="state-panel-name">
                        Select a state
                    </h3>


                    <p
                        id="state-panel-description"
                        class="state-panel-intro"
                    >
                        Click any state on the map to explore
                        its energy-transition profile.
                    </p>


                    <div
                        id="state-panel-data"
                        class="state-panel-data"
                        hidden
                    >


                        <!-- STATE KPIs -->

                        <div class="state-kpi-grid">


                            <div class="state-kpi">

                                <span>
                                    Initiatives
                                </span>

                                <strong id="state-initiatives">
                                    —
                                </strong>

                            </div>


                            <div class="state-kpi">

                                <span>
                                    Active
                                </span>

                                <strong id="state-active">
                                    —
                                </strong>

                            </div>


                            <div class="state-kpi">

                                <span>
                                    Actors
                                </span>

                                <strong id="state-actors">
                                    —
                                </strong>

                            </div>


                            <div class="state-kpi">

                                <span>
                                    Electricity access
                                </span>

                                <strong id="state-access">
                                    —
                                </strong>

                            </div>


                        </div>


                        <!-- STATE DETAILS -->

                        <div class="state-detail-list">


                            <div>

                                <span>
                                    Geopolitical zone
                                </span>

                                <strong id="state-zone">
                                    —
                                </strong>

                            </div>


                            <div>

                                <span>
                                    State electricity law
                                </span>

                                <strong id="state-law">
                                    —
                                </strong>

                            </div>


                            <div>

                                <span>
                                    State regulator
                                </span>

                                <strong id="state-regulator">
                                    —
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Known project value
                                </span>

                                <strong id="state-value">
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

            <div class="energy-two-column">

                <div class="energy-panel">

                    <div class="energy-section-header">

                        <div>
                            <span class="energy-section-eyebrow">
                                Geographic activity
                            </span>

                            <h2>
                                States with highest initiative presence
                            </h2>
                        </div>

                    </div>


                    <div class="energy-table-wrap">

                        <table class="energy-table">

                            <thead>
                                <tr>
                                    <th>State</th>
                                    <th>Initiatives</th>
                                    <th>Active</th>
                                    <th>Actors</th>
                                </tr>
                            </thead>

                            <tbody>

                                <?php foreach ($states as $state): ?>

                                    <tr>

                                        <td>
                                            <strong>
                                                <?= htmlspecialchars(
                                                    $state['state_name']
                                                ); ?>
                                            </strong>

                                            <small>
                                                <?= htmlspecialchars(
                                                    $state[
                                                        'geopolitical_zone'
                                                    ] ?? ''
                                                ); ?>
                                            </small>
                                        </td>

                                        <td>
                                            <?= number_format(
                                                $state[
                                                    'initiative_count'
                                                ]
                                            ); ?>
                                        </td>

                                        <td>
                                            <?= number_format(
                                                $state[
                                                    'active_initiative_count'
                                                ]
                                            ); ?>
                                        </td>

                                        <td>
                                            <?= number_format(
                                                $state[
                                                    'participating_actor_count'
                                                ]
                                            ); ?>
                                        </td>

                                    </tr>

                                <?php endforeach; ?>

                            </tbody>

                        </table>

                    </div>

                </div>


                <div class="energy-panel">

                    <div class="energy-section-header">

                        <div>
                            <span class="energy-section-eyebrow">
                                Institutional landscape
                            </span>

                            <h2>
                                Most active actors
                            </h2>
                        </div>

                    </div>


                    <div class="energy-list">

                        <?php foreach ($actors as $actor): ?>

                            <div class="energy-list-item">

                                <div>

                                    <strong>
                                        <?= htmlspecialchars(
                                            $actor[
                                                'acronym'
                                            ]
                                            ?: $actor[
                                                'organisation_name'
                                            ]
                                        ); ?>
                                    </strong>

                                    <small>
                                        <?= htmlspecialchars(
                                            $actor[
                                                'organisation_name'
                                            ]
                                        ); ?>
                                    </small>

                                </div>

                                <div class="energy-list-meta">

                                    <span>
                                        <?= number_format(
                                            $actor[
                                                'initiative_count'
                                            ]
                                        ); ?>
                                        initiatives
                                    </span>

                                    <span>
                                        <?= number_format(
                                            $actor[
                                                'states_reached'
                                            ]
                                        ); ?>
                                        states
                                    </span>

                                </div>

                            </div>

                        <?php endforeach; ?>

                    </div>

                </div>

            </div>

        </div>

    </section>


    <section class="energy-section">

        <div class="energy-container">

            <div class="energy-two-column">

                <div class="energy-panel">

                    <div class="energy-section-header">

                        <div>
                            <span class="energy-section-eyebrow">
                                Finance
                            </span>

                            <h2>
                                Finance snapshot
                            </h2>
                        </div>

                    </div>


                    <div class="energy-big-stat">

                        <?= formatMoney(
                            $finance['tracked_finance_usd'] ?? 0
                        ); ?>

                    </div>

                    <p>
                        Aggregated from
                        <?= number_format(
                            $finance[
                                'aggregation_eligible_records'
                            ] ?? 0
                        ); ?>
                        finance records marked eligible for aggregation.
                    </p>

                    <div class="energy-stat-row">
                        <span>Total finance records</span>
                        <strong>
                            <?= number_format(
                                $finance[
                                    'finance_records'
                                ] ?? 0
                            ); ?>
                        </strong>
                    </div>

                    <div class="energy-stat-row">
                        <span>Providers</span>
                        <strong>
                            <?= number_format(
                                $finance[
                                    'tracked_provider_count'
                                ] ?? 0
                            ); ?>
                        </strong>
                    </div>

                    <div class="energy-stat-row">
                        <span>Recipients</span>
                        <strong>
                            <?= number_format(
                                $finance[
                                    'tracked_recipient_count'
                                ] ?? 0
                            ); ?>
                        </strong>
                    </div>

                </div>


                <div class="energy-panel">

                    <div class="energy-section-header">

                        <div>
                            <span class="energy-section-eyebrow">
                                Coordination
                            </span>

                            <h2>
                                Mandate signals
                            </h2>
                        </div>

                    </div>


                    <div class="energy-list">

                        <?php
                        $signalCount = 0;

                        foreach ($mandates as $mandate):

                            if (
                                !in_array(
                                    $mandate['mandate_status'],
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

                            <div class="energy-list-item">

                                <div>

                                    <strong>
                                        <?= htmlspecialchars(
                                            $mandate[
                                                'function_name'
                                            ]
                                        ); ?>
                                    </strong>

                                    <small>
                                        <?= htmlspecialchars(
                                            $mandate[
                                                'primary_subsector'
                                            ] ?? ''
                                        ); ?>
                                    </small>

                                </div>

                                <span class="energy-status-badge">
                                    <?= htmlspecialchars(
                                        $mandate[
                                            'mandate_status'
                                        ]
                                    ); ?>
                                </span>

                            </div>

                        <?php endforeach; ?>

                    </div>

                </div>

            </div>

        </div>

    </section>


    <section class="energy-section energy-section-muted">

        <div class="energy-container">

            <div class="energy-two-column">

                <div class="energy-panel">

                    <div class="energy-section-header">

                        <div>
                            <span class="energy-section-eyebrow">
                                Policy
                            </span>

                            <h2>
                                Policy coverage
                            </h2>
                        </div>

                    </div>


                    <div class="energy-list">

                        <?php foreach ($policies as $policy): ?>

                            <div class="energy-list-item">

                                <div>

                                    <strong>
                                        <?= htmlspecialchars(
                                            $policy[
                                                'short_name'
                                            ]
                                            ?: $policy[
                                                'instrument_name'
                                            ]
                                        ); ?>
                                    </strong>

                                    <small>
                                        <?= htmlspecialchars(
                                            $policy[
                                                'instrument_type'
                                            ] ?? ''
                                        ); ?>

                                        <?php if (
                                            !empty(
                                                $policy[
                                                    'publication_year'
                                                ]
                                            )
                                        ): ?>

                                            ·
                                            <?= htmlspecialchars(
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
                                        ]
                                    ); ?>
                                    functions
                                </span>

                            </div>

                        <?php endforeach; ?>

                    </div>

                </div>


                <div class="energy-panel">

                    <div class="energy-section-header">

                        <div>
                            <span class="energy-section-eyebrow">
                                Targets
                            </span>

                            <h2>
                                Target monitoring
                            </h2>
                        </div>

                    </div>


                    <div class="energy-list">

                        <?php foreach ($targets as $target): ?>

                            <div class="energy-list-item">

                                <div>

                                    <strong>
                                        <?= htmlspecialchars(
                                            $target[
                                                'indicator'
                                            ]
                                            ?: $target[
                                                'target_statement'
                                            ]
                                        ); ?>
                                    </strong>

                                    <small>
                                        <?= htmlspecialchars(
                                            $target[
                                                'framework'
                                            ] ?? ''
                                        ); ?>

                                        <?php if (
                                            !empty(
                                                $target[
                                                    'target_year'
                                                ]
                                            )
                                        ): ?>

                                            ·
                                            target
                                            <?= htmlspecialchars(
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
                                        ]
                                    ); ?>
                                    obs.
                                </span>

                            </div>

                        <?php endforeach; ?>

                    </div>

                </div>

            </div>

        </div>

    </section>

</main>


<?php include('footer.inc.php'); ?>