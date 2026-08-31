    'use strict';

    const data = window.INETTEnergyData || {};


    function formatMoney(
        value
    ) {

        value =
            Number(
                value || 0
            );


        if (
            value >=
            1000000000
        ) {

            return (
                '$'
                + (
                    value
                    / 1000000000
                ).toFixed(2)
                + 'bn'
            );

        }


        if (
            value >=
            1000000
        ) {

            return (
                '$'
                + (
                    value
                    / 1000000
                ).toFixed(1)
                + 'm'
            );

        }


        if (
            value >=
            1000
        ) {

            return (
                '$'
                + (
                    value
                    / 1000
                ).toFixed(1)
                + 'k'
            );

        }


        return (
            '$'
            + value
                .toLocaleString()
        );

    }

    /*
    |--------------------------------------------------------------------------
    | Fast relationship indexes
    |--------------------------------------------------------------------------
    |
    | Instead of repeatedly searching all 867 location rows and all
    | relationship records every time a filter changes, we build
    | lookup structures once.
    |
    */

    const initiativeLocationsById = {};

    const initiativeSubsectorsById = {};

    const actorById = {};

    const policyById = {};

    const initiativeById = {};


    (data.all_actors || data.actors || [])
    .forEach(actor => {


        const actorId =
            String(
                actor.actor_id || ''
            ).trim();

        if (!actorId) {
            return;
        }

        actorById[actorId] = actor;

    });

    (data.all_policies || data.policies || [])
    .forEach(policy => {

        const policyId =
            String(
                policy.policy_id || ''
            ).trim();


        if (!policyId) {
            return;
        }


        policyById[policyId] =
            policy;

    });

    
    (data.initiatives || []).forEach(
        initiative => {

            const id =
                String(
                    initiative.initiative_id || ''
                ).trim();


            if (!id) {
                return;
            }


            initiativeById[id] =
                initiative;

        }
    );

    const stateByCode = {};

    (data.states || []).forEach(state => {

        const code =
            String(
                state.state_code || ''
            ).trim();

        if (!code) {
            return;
        }

        stateByCode[code] = state;

    });


    /*
    |--------------------------------------------------------------------------
    | Initiative locations
    |--------------------------------------------------------------------------
    */

    (data.initiative_locations || [])
        .forEach(row => {

            const initiativeId =
                row.initiative_id;

            if (
                !initiativeLocationsById[
                    initiativeId
                ]
            ) {

                initiativeLocationsById[
                    initiativeId
                ] = new Set();

            }


            initiativeLocationsById[
                initiativeId
            ].add(
                String(row.state_code)
            );

        });


    /*
    |--------------------------------------------------------------------------
    | Initiative subsectors
    |--------------------------------------------------------------------------
    */

    (data.initiative_subsectors || [])
        .forEach(row => {

            const initiativeId =
                row.initiative_id;

            if (
                !initiativeSubsectorsById[
                    initiativeId
                ]
            ) {

                initiativeSubsectorsById[
                    initiativeId
                ] = new Set();

            }


            if (row.subsector) {

                initiativeSubsectorsById[
                    initiativeId
                ].add(
                    String(
                        row.subsector
                    ).trim()
                );

            }

        });


        function getStateNameByCode(code) {

            const state =
                stateByCode[
                    String(code || '')
                ];

            return (
                state
                    ? state.state_name
                    : code
            );

        }

        /* ==========================================================
    OVERVIEW AGGREGATION HELPERS
    ========================================================== */

    function normalizeFilterValue(value) {

        return String(
            value || ''
        )
            .trim()
            .toLowerCase();

    }


    /*
    |--------------------------------------------------------------------------
    | Return initiatives matching current filters
    |--------------------------------------------------------------------------
    */

    function formatExplorerMoney(value) {

        value =
            Number(value || 0);


        if (!value) {
            return '—';
        }


        if (value >= 1000000000) {

            return (
                '$'
                + (
                    value / 1000000000
                ).toFixed(2)
                + 'bn'
            );

        }


        if (value >= 1000000) {

            return (
                '$'
                + (
                    value / 1000000
                ).toFixed(1)
                + 'm'
            );

        }


        if (value >= 1000) {

            return (
                '$'
                + (
                    value / 1000
                ).toFixed(1)
                + 'k'
            );

        }


        return (
            '$'
            + value.toLocaleString()
        );

    }


    function getInitiativeLeadActor(
        initiative
    ) {

        if (!initiative.lead_actor_id) {
            return '—';
        }


        const actor =
            actorById[
                String(
                    initiative.lead_actor_id
                )
            ];


        if (!actor) {
            return initiative.lead_actor_id;
        }


        return (
            actor.acronym
            || actor.organisation_name
            || initiative.lead_actor_id
        );

    }



/* ==========================================================
   BASIC HTML ESCAPING
========================================================== */

    function escapeEnergyHtml(value) {

        return String(
            value == null
                ? ''
                : value
        )
        .replace(
            /&/g,
            '&amp;'
        )
        .replace(
            /</g,
            '&lt;'
        )
        .replace(
            />/g,
            '&gt;'
        )
        .replace(
            /"/g,
            '&quot;'
        )
        .replace(
            /'/g,
            '&#039;'
        );

    }

    /* ==========================================================
   INITIATIVE DETAIL DRAWER
========================================================== */
