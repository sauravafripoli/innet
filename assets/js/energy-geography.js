    function getMapFilteredInitiatives() {

        const initiatives =
            data.initiatives || [];


        const selectedSubsectors =
            new Set(
                (energyFilterState.subsectors || [])
                    .map(
                        normalizeFilterValue
                    )
                    .filter(Boolean)
            );


        const selectedStatuses =
            new Set(
                (energyFilterState.statuses || [])
                    .map(
                        normalizeFilterValue
                    )
                    .filter(Boolean)
            );


        return initiatives.filter(
            initiative => {

                /*
                --------------------------------------------------
                SUBSECTOR
                --------------------------------------------------
                */

                if (selectedSubsectors.size) {

                    const primarySubsector =
                        normalizeFilterValue(
                            initiative.primary_subsector
                        );


                    const relatedSubsectors =
                        initiativeSubsectorsById[
                            initiative.initiative_id
                        ];


                    let relationshipMatches =
                        false;


                    if (relatedSubsectors) {

                        relationshipMatches =
                            [...relatedSubsectors]
                                .some(
                                    subsector =>

                                        selectedSubsectors.has(
                                            normalizeFilterValue(
                                                subsector
                                            )
                                        )
                                );

                    }


                    if (
                        !selectedSubsectors.has(
                            primarySubsector
                        )
                        && !relationshipMatches
                    ) {

                        return false;

                    }

                }


                /*
                --------------------------------------------------
                STATUS
                --------------------------------------------------
                */

                if (selectedStatuses.size) {

                    if (
                        !selectedStatuses.has(
                            normalizeFilterValue(
                                initiative.standard_status
                            )
                        )
                    ) {

                        return false;

                    }

                }


                return true;

            }
        );

    }


    /* ==========================================================
   NIGERIA ENERGY MAP
========================================================== */

    function initNigeriaMap() {

        /*
        ----------------------------------------------------------
        Prevent duplicate Leaflet initialization
        ----------------------------------------------------------
        */

        if (window.INETTEnergyMap) {
            return;
        }


        const element =
            document.getElementById(
                'nigeria-energy-map'
            );


        if (
            !element
            || typeof L === 'undefined'
        ) {

            return;

        }


        /*
        ----------------------------------------------------------
        State analytics coming from PHP / SQLite
        ----------------------------------------------------------
        */

        const stateData =
            data.states || [];


        const stateLookup = {};


        /*
        ----------------------------------------------------------
        Normalize state names
        ----------------------------------------------------------
        |
        | GeoJSON names and database names may differ slightly.
        |
        */

        function normalizeStateName(name) {

            if (!name) {
                return '';
            }


            const normalized =
                String(name)
                    .trim()
                    .toLowerCase();


            const aliases = {

                'fct abuja':
                    'federal capital territory',

                'abuja':
                    'federal capital territory',

                'federal capital territory abuja':
                    'federal capital territory',

                'fct':
                    'federal capital territory'

            };


            return (
                aliases[normalized]
                || normalized
            );

        }


        /*
        ----------------------------------------------------------
        Build state-name lookup
        ----------------------------------------------------------
        */

        stateData.forEach(
            state => {

                const name =
                    normalizeStateName(
                        state.state_name
                    );


                stateLookup[name] =
                    state;

            }
        );


        /*
        ----------------------------------------------------------
        Create Leaflet map
        ----------------------------------------------------------
        */

        const map =
            L.map(
                'nigeria-energy-map',
                {

                    zoomControl:
                        true,

                    scrollWheelZoom:
                        false,

                    preferCanvas:
                        true

                }
            )
            .setView(
                [
                    9.0820,
                    8.6753
                ],
                6
            );


        /*
        Make map globally available.

        The tab system uses this for
        invalidateSize() when switching tabs.
        */

        window.INETTEnergyMap =
            map;


        /*
        ----------------------------------------------------------
        Base map
        ----------------------------------------------------------
        */

        L.tileLayer(
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            {

                maxZoom:
                    18,

                attribution:
                    '&copy; OpenStreetMap contributors'

            }
        ).addTo(map);


        /*
        ----------------------------------------------------------
        Initial state colour scale
        ----------------------------------------------------------
        |
        | This is only the initial appearance.
        |
        | updateEnergyMap() later recalculates these colours
        | using the currently selected Subsector + Status.
        |
        */

        function getInitialStateColor(
            count
        ) {

            count =
                Number(
                    count || 0
                );


            if (count >= 30) {
                return '#0b4b3c';
            }


            if (count >= 25) {
                return '#12634f';
            }


            if (count >= 20) {
                return '#1a7a60';
            }


            if (count >= 15) {
                return '#3b967a';
            }


            if (count >= 10) {
                return '#70b49c';
            }


            if (count >= 5) {
                return '#acd3c4';
            }


            if (count >= 1) {
                return '#d8e9e2';
            }


            return '#edf2ef';

        }


        /*
        ----------------------------------------------------------
        Find the database record for a GeoJSON feature
        ----------------------------------------------------------
        */

        function getStateForFeature(
            feature
        ) {

            if (
                !feature
                || !feature.properties
            ) {

                return null;

            }


            /*
            Your current GeoJSON uses "state".
            These fallbacks make the loader safer if
            you later use a different Nigeria file.
            */

            const geoName =

                feature.properties.state
                || feature.properties.State
                || feature.properties.STATE
                || feature.properties.name
                || feature.properties.NAME_1
                || feature.properties.admin1Name
                || '';


            const normalized =
                normalizeStateName(
                    geoName
                );


            return (
                stateLookup[
                    normalized
                ]
                || null
            );

        }


        /*
        ----------------------------------------------------------
        Polygon style
        ----------------------------------------------------------
        */

        function styleFeature(
            feature
        ) {

            const state =
                getStateForFeature(
                    feature
                );


            const count =
                state
                    ? Number(
                        state.initiative_count
                        || 0
                    )
                    : 0;


            return {

                fillColor:
                    getInitialStateColor(
                        count
                    ),

                fillOpacity:
                    count > 0
                        ? 0.88
                        : 0.35,

                color:
                    '#ffffff',

                weight:
                    1.2,

                opacity:
                    1

            };

        }


        /*
        ----------------------------------------------------------
        Finance formatter
        ----------------------------------------------------------
        */

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
        ----------------------------------------------------------
        Update state profile panel
        ----------------------------------------------------------
        */

        function updateStatePanel(
            state
        ) {

            if (!state) {
                return;
            }


            const panelName =
                document.getElementById(
                    'state-panel-name'
                );


            const panelDescription =
                document.getElementById(
                    'state-panel-description'
                );


            const panelData =
                document.getElementById(
                    'state-panel-data'
                );


            /*
            State heading
            */

            if (panelName) {

                panelName.textContent =
                    state.state_name
                    || 'State';

            }


            /*
            Description
            */

            if (panelDescription) {

                panelDescription.textContent =
                    'Energy transition profile and tracked activity.';

            }


            /*
            Reveal details
            */

            if (panelData) {

                panelData.hidden =
                    false;

            }


            /*
            Initiatives
            */

            const initiativeElement =
                document.getElementById(
                    'state-initiatives'
                );


            if (initiativeElement) {

                initiativeElement.textContent =
                    Number(
                        state.initiative_count
                        || 0
                    ).toLocaleString();

            }


            /*
            Active initiatives
            */

            const activeElement =
                document.getElementById(
                    'state-active'
                );


            if (activeElement) {

                activeElement.textContent =
                    Number(
                        state.active_initiative_count
                        || 0
                    ).toLocaleString();

            }


            /*
            Participating actors
            */

            const actorElement =
                document.getElementById(
                    'state-actors'
                );


            if (actorElement) {

                actorElement.textContent =
                    Number(
                        state.participating_actor_count
                        || 0
                    ).toLocaleString();

            }


            /*
            Electricity access
            */

            const accessElement =
                document.getElementById(
                    'state-access'
                );


            if (accessElement) {

                if (
                    state.electricity_access_rate
                        !== null
                    &&
                    state.electricity_access_rate
                        !== undefined
                    &&
                    state.electricity_access_rate
                        !== ''
                ) {

                    accessElement.textContent =
                        Number(
                            state.electricity_access_rate
                        ).toFixed(1)
                        + '%';

                } else {

                    accessElement.textContent =
                        '—';

                }

            }


            /*
            Zone
            */

            const zoneElement =
                document.getElementById(
                    'state-zone'
                );


            if (zoneElement) {

                zoneElement.textContent =
                    state.geopolitical_zone
                    || '—';

            }


            /*
            Electricity law
            */

            const lawElement =
                document.getElementById(
                    'state-law'
                );


            if (lawElement) {

                lawElement.textContent =
                    state.state_electricity_law_enacted
                    || '—';

            }


            /*
            Regulator
            */

            const regulatorElement =
                document.getElementById(
                    'state-regulator'
                );


            if (regulatorElement) {

                regulatorElement.textContent =

                    state.state_regulator

                    || state.current_regulatory_authority

                    || '—';

            }


            /*
            Known project value
            */

            const valueElement =
                document.getElementById(
                    'state-value'
                );


            if (valueElement) {

                valueElement.textContent =
                    formatMoney(
                        state.known_project_value_usd
                    );

            }

        }

        function clearStatePanel() {

            const panelName =
                document.getElementById(
                    'state-panel-name'
                );


            const panelDescription =
                document.getElementById(
                    'state-panel-description'
                );


            const panelData =
                document.getElementById(
                    'state-panel-data'
                );


            if (panelName) {

                panelName.textContent =
                    'Select a state';

            }


            if (panelDescription) {

                panelDescription.textContent =
                    'Click a state on the map to explore its Energy Transition profile.';

            }


            if (panelData) {

                panelData.hidden =
                    true;

            }

        }


        /*
        ----------------------------------------------------------
        GeoJSON layer reference
        ----------------------------------------------------------
        */

        let geoJsonLayer;


        /*
        ----------------------------------------------------------
        Attach behaviour to each state
        ----------------------------------------------------------
        */

        function onEachFeature(
            feature,
            layer
        ) {

            const state =
                getStateForFeature(
                    feature
                );


            /*
            IMPORTANT

            Attach the database state directly to the
            Leaflet layer.

            updateEnergyMap() uses these properties,
            so it does NOT need to redo state-name
            matching every time filters change.
            */

            layer._inettState =
                state;


            layer._inettStateCode =
                state
                    ? String(
                        state.state_code
                        || ''
                    )
                    : '';


            /*
            ------------------------------------------------------
            Display name
            ------------------------------------------------------
            */

            const displayName =

                state
                    ? state.state_name
                    : (
                        feature.properties.state
                        || feature.properties.State
                        || feature.properties.name
                        || feature.properties.NAME_1
                        || 'Unknown state'
                    );


            /*
            ------------------------------------------------------
            Initial tooltip counts
            ------------------------------------------------------
            */

            const initiativeCount =
                state
                    ? Number(
                        state.initiative_count
                        || 0
                    )
                    : 0;


            const activeCount =
                state
                    ? Number(
                        state.active_initiative_count
                        || 0
                    )
                    : 0;


            /*
            ------------------------------------------------------
            Tooltip
            ------------------------------------------------------
            */

            layer.bindTooltip(
                `
                    <strong>
                        ${displayName}
                    </strong>

                    <br>

                    ${initiativeCount.toLocaleString()}
                    initiatives

                    <br>

                    ${activeCount.toLocaleString()}
                    active
                `,
                {

                    sticky:
                        true

                }
            );


            /*
            ------------------------------------------------------
            Interactions
            ------------------------------------------------------
            */

            layer.on({

                /*
                Hover
                */

                mouseover:
                    function () {

                        if (
                            typeof layer.setStyle
                            === 'function'
                        ) {

                            layer.setStyle({

                                weight:
                                    3,

                                color:
                                    '#183d32',

                                fillOpacity:
                                    1

                            });

                        }


                        if (
                            typeof layer.bringToFront
                            === 'function'
                        ) {

                            layer.bringToFront();

                        }

                    },


                /*
                Mouse out
                */

                mouseout:
                    function () {

                        /*
                        Don't use resetStyle here.

                        The map may currently be showing
                        filtered analytical colours.

                        Reapply the current filter-aware
                        choropleth instead.
                        */

                        if (
                            typeof updateEnergyMap
                            === 'function'
                        ) {

                            updateEnergyMap();

                        }

                    },


                /*
                State click
                */

                click:
                function () {

                    if (!state) {
                        return;
                    }


                    const stateCode =
                        String(
                            state.state_code || ''
                        );


                    const alreadySelected =
                        (energyFilterState.states || [])
                            .some(
                                selectedState =>
                                    normalizeFilterValue(
                                        selectedState
                                    )
                                    ===
                                    normalizeFilterValue(
                                        stateCode
                                    )
                            );


                    /*
                    If this click is removing the state,
                    clear the State Profile.
                    Otherwise show the clicked state.
                    */

                    if (alreadySelected) {

                        clearStatePanel();

                    } else {

                        updateStatePanel(
                            state
                        );

                    }


                    /*
                    Toggle the global State filter
                    */

                    if (
                        typeof window
                            .INETTSetStateFilter
                        === 'function'
                    ) {

                        window
                            .INETTSetStateFilter(
                                stateCode
                            );

                    }

                }

            });

        }


        /*
        ----------------------------------------------------------
        GeoJSON point fallback
        ----------------------------------------------------------
        |
        | IMPORTANT:
        |
        | If your file contains Point features instead of
        | Polygon/MultiPolygon state boundaries, Leaflet normally
        | renders blue marker pins.
        |
        | This converts those points into circle markers instead.
        |
        | A point file still cannot produce a state choropleth.
        | For filled states we need Polygon or MultiPolygon geometry.
        |
        */

        function pointToLayer(
            feature,
            latlng
        ) {

            return L.circleMarker(
                latlng,
                {

                    radius:
                        7,

                    fillColor:
                        '#0f6e56',

                    color:
                        '#ffffff',

                    weight:
                        2,

                    opacity:
                        1,

                    fillOpacity:
                        0.85

                }
            );

        }


        /*
        ----------------------------------------------------------
        Load Nigeria GeoJSON
        ----------------------------------------------------------
        */

        fetch(
            window.INETTThemeUrl
            + '/assets/geo/nigeria-states.geojson'
        )

            .then(
                response => {

                    if (
                        !response.ok
                    ) {

                        throw new Error(
                            'Nigeria GeoJSON could not be loaded.'
                        );

                    }


                    return response.json();

                }
            )

            .then(
                geojson => {

                    /*
                    --------------------------------------------------
                    Inspect geometry
                    --------------------------------------------------
                    */

                    if (
                        geojson.features
                        &&
                        geojson.features.length
                    ) {

                        const geometryTypes =
                            [
                                ...new Set(
                                    geojson.features
                                        .map(
                                            feature =>
                                                feature.geometry
                                                    ? feature.geometry.type
                                                    : 'Unknown'
                                        )
                                )
                            ];


                        console.log(
                            'INETT GeoJSON geometry:',
                            geometryTypes
                        );


                        /*
                        Helpful warning if this is the
                        wrong type of GeoJSON.
                        */

                        if (
                            !geometryTypes.includes(
                                'Polygon'
                            )
                            &&
                            !geometryTypes.includes(
                                'MultiPolygon'
                            )
                        ) {

                            console.warn(
                                'INETT map: GeoJSON contains no Polygon/MultiPolygon state boundaries. A choropleth requires state boundary polygons.'
                            );

                        }

                    }


                    /*
                    --------------------------------------------------
                    Create GeoJSON layer
                    --------------------------------------------------
                    */

                    geoJsonLayer =
                        L.geoJSON(
                            geojson,
                            {

                                style:
                                    styleFeature,

                                onEachFeature:
                                    onEachFeature,

                                pointToLayer:
                                    pointToLayer

                            }
                        )
                        .addTo(
                            map
                        );


                    /*
                    Expose globally
                    */

                    window
                        .INETTEnergyGeoJsonLayer =
                        geoJsonLayer;


                    /*
                    --------------------------------------------------
                    Apply current analytical filter styling
                    --------------------------------------------------
                    */

                    if (
                        typeof updateEnergyMap
                        === 'function'
                    ) {

                        updateEnergyMap();

                    }


                    /*
                    --------------------------------------------------
                    Fit Nigeria geometry
                    --------------------------------------------------
                    */

                    const bounds =
                        geoJsonLayer
                            .getBounds();


                    if (
                        bounds
                        &&
                        bounds.isValid()
                    ) {

                        map.fitBounds(
                            bounds,
                            {

                                padding:
                                    [10, 10]

                            }
                        );

                    }


                    /*
                    --------------------------------------------------
                    Final resize after visible tab rendering
                    --------------------------------------------------
                    */

                    setTimeout(
                        function () {

                            map.invalidateSize(
                                true
                            );


                            const currentBounds =
                                geoJsonLayer
                                    .getBounds();


                            if (
                                currentBounds
                                &&
                                currentBounds
                                    .isValid()
                            ) {

                                map.fitBounds(
                                    currentBounds,
                                    {

                                        padding:
                                            [10, 10]

                                    }
                                );

                            }


                            /*
                            Reapply current filter colours
                            once sizing has settled.
                            */

                            if (
                                typeof updateEnergyMap
                                === 'function'
                            ) {

                                updateEnergyMap();

                            }

                        },
                        150
                    );

                }
            )

            .catch(
                error => {

                    console.error(
                        'INETT map error:',
                        error
                    );

                }
            );

    }

    /* ==========================================================
    FILTER ENGINE
    ========================================================== */

    let initiativeExplorerData = [];

    let initiativeExplorerPage = 1;
    let initiativeExplorerPageSize = 10;

    let actorDirectoryPage = 1;

    const actorDirectoryPageSize = 10;

    let actorDirectorySearch = '';

    let actorDirectoryInitiatives =
        data.initiatives || [];


    function openInitiativeDrawer(
        initiativeId
    ) {

        const initiative =
            initiativeById[
                String(initiativeId)
            ];


        if (!initiative) {

            console.warn(
                'Initiative not found:',
                initiativeId
            );

            return;

        }


        const drawer =
            document.getElementById(
                'initiative-drawer'
            );


        const backdrop =
            document.getElementById(
                'initiative-drawer-backdrop'
            );


        const title =
            document.getElementById(
                'initiative-drawer-title'
            );


        const idElement =
            document.getElementById(
                'initiative-drawer-id'
            );


        const content =
            document.getElementById(
                'initiative-drawer-content'
            );


        if (
            !drawer
            || !content
        ) {
            return;
        }


        /*
        ----------------------------------------------------------
        Heading
        ----------------------------------------------------------
        */

        if (title) {

            title.textContent =
                initiative.initiative_name
                || initiative.name
                || initiative.initiative_id;

        }


        if (idElement) {

            idElement.textContent =
                initiative.initiative_id
                || '';

        }


        /*
        ----------------------------------------------------------
        Related geography
        ----------------------------------------------------------
        */

        const locations =
            (
                data.initiative_locations
                || []
            )
            .filter(
                location =>

                    String(
                        location.initiative_id
                    )
                    ===
                    String(
                        initiative.initiative_id
                    )
            );


        const stateCodes =
            [
                ...new Set(
                    locations
                        .map(
                            location =>
                                location.state_code
                        )
                        .filter(Boolean)
                )
            ];


        /*
        ----------------------------------------------------------
        Related actors
        ----------------------------------------------------------
        */

        const relationships =
            (
                data.initiative_actors
                || []
            )
            .filter(
                relationship =>

                    String(
                        relationship.initiative_id
                    )
                    ===
                    String(
                        initiative.initiative_id
                    )
            );


        /*
        ----------------------------------------------------------
        Display values
        ----------------------------------------------------------
        */

        const leadActor =
            getInitiativeLeadActor(
                initiative
            );


        const projectValue =
            formatExplorerMoney(
                initiative.total_value_usd
            );


        /*
        ----------------------------------------------------------
        Render
        ----------------------------------------------------------
        */

        content.innerHTML = `

            <div class="energy-drawer-badges">

                <span class="energy-drawer-badge">
                    ${escapeEnergyHtml(
                        initiative.standard_status || 'Unknown status'
                    )}
                </span>

                <span class="energy-drawer-badge">
                    ${escapeEnergyHtml(
                        initiative.primary_subsector || 'Unclassified'
                    )}
                </span>

            </div>


            <section class="energy-drawer-section">

                <h3 class="energy-drawer-section-title">
                    Overview
                </h3>


                <div class="energy-drawer-fields">

                    <div class="energy-drawer-field">
                        <span>Technology</span>
                        <strong>
                            ${escapeEnergyHtml(
                                initiative.primary_technology || '—'
                            )}
                        </strong>
                    </div>


                    <div class="energy-drawer-field">
                        <span>Value chain</span>
                        <strong>
                            ${escapeEnergyHtml(
                                initiative.primary_value_chain_segment || '—'
                            )}
                        </strong>
                    </div>


                    <div class="energy-drawer-field">
                        <span>Grid relationship</span>
                        <strong>
                            ${escapeEnergyHtml(
                                initiative.grid_relationship || '—'
                            )}
                        </strong>
                    </div>


                    <div class="energy-drawer-field">
                        <span>Delivery modality</span>
                        <strong>
                            ${escapeEnergyHtml(
                                initiative.delivery_modality || '—'
                            )}
                        </strong>
                    </div>


                    <div class="energy-drawer-field">
                        <span>Lead actor</span>
                        <strong>
                            ${escapeEnergyHtml(
                                leadActor
                            )}
                        </strong>
                    </div>


                    <div class="energy-drawer-field">
                        <span>Period</span>
                        <strong>
                            ${escapeEnergyHtml(
                                initiative.start_year
                                || initiative.start
                                || '—'
                            )}
                            —
                            ${escapeEnergyHtml(
                                initiative.end_year
                                || initiative.end
                                || 'Ongoing'
                            )}
                        </strong>
                    </div>

                </div>

            </section>


            <section class="energy-drawer-section">

                <h3 class="energy-drawer-section-title">
                    Scale
                </h3>


                <div class="energy-drawer-metrics">

                    <div class="energy-drawer-metric">
                        <span>Project value</span>
                        <strong>
                            ${escapeEnergyHtml(
                                projectValue
                            )}
                        </strong>
                    </div>


                    <div class="energy-drawer-metric">
                        <span>Installed capacity</span>
                        <strong>
                            ${
                                initiative.installed_capacity_mw
                                    ? escapeEnergyHtml(
                                        initiative.installed_capacity_mw
                                    ) + ' MW'
                                    : '—'
                            }
                        </strong>
                    </div>


                    <div class="energy-drawer-metric">
                        <span>Connections targeted</span>
                        <strong>
                            ${
                                Number(
                                    initiative.connections_targeted || 0
                                )
                                .toLocaleString()
                            }
                        </strong>
                    </div>


                    <div class="energy-drawer-metric">
                        <span>Connections verified</span>
                        <strong>
                            ${
                                Number(
                                    initiative.connections_verified || 0
                                )
                                .toLocaleString()
                            }
                        </strong>
                    </div>

                </div>

            </section>


            <section class="energy-drawer-section">

                <h3 class="energy-drawer-section-title">
                    Geography
                </h3>


                <div class="energy-drawer-tags">

                    ${
                        stateCodes.length
                            ? stateCodes
                                .map(
                                    code => `
                                        <span class="energy-drawer-tag">
                                            ${escapeEnergyHtml(
                                                getStateNameByCode(code)
                                            )}
                                        </span>
                                    `
                                )
                                .join('')
                            : `
                                <span class="energy-drawer-tag">
                                    No state-level locations recorded
                                </span>
                            `
                    }

                </div>

            </section>


            <section class="energy-drawer-section">

            <h3 class="energy-drawer-section-title">
                Participation
            </h3>


            <div class="energy-drawer-tags">

                ${
                    relationships.length
                        ? relationships
                            .map(
                                relationship => {

                                    const actor =
                                        actorById[
                                            String(
                                                relationship.actor_id
                                            )
                                        ];


                                    const actorName =
                                        actor
                                            ? (
                                                actor.acronym
                                                || actor.organisation_name
                                                || relationship.actor_id
                                            )
                                            : relationship.actor_id;


                                    return `
                                        <span class="energy-drawer-tag">

                                            ${escapeEnergyHtml(
                                                actorName
                                            )}

                                            ${
                                                relationship.role
                                                    ? ' · '
                                                    + escapeEnergyHtml(
                                                        relationship.role
                                                    )
                                                    : ''
                                            }

                                        </span>
                                    `;

                                }
                            )
                            .join('')
                        : `
                            <span class="energy-drawer-tag">
                                ${escapeEnergyHtml(leadActor)}
                            </span>
                        `
                }

            </div>

        </section>


        <section class="energy-drawer-section">

            <h3 class="energy-drawer-section-title">
                Transition alignment
            </h3>


            <div class="energy-drawer-fields">

                <div class="energy-drawer-field">

                    <span>
                        Compact pillar
                    </span>

                    <strong>
                        ${escapeEnergyHtml(
                            initiative.compact_pillar
                            || '—'
                        )}
                    </strong>

                </div>


                <div class="energy-drawer-field">

                    <span>
                        ETP linkage
                    </span>

                    <strong>
                        ${escapeEnergyHtml(
                            initiative.etp_linkage
                            || '—'
                        )}
                    </strong>

                </div>


                <div class="energy-drawer-field">

                    <span>
                        NDC linkage
                    </span>

                    <strong>
                        ${escapeEnergyHtml(
                            initiative.ndc_linkage
                            || '—'
                        )}
                    </strong>

                </div>

            </div>

        </section>

        `;


        /*
        ----------------------------------------------------------
        Open
        ----------------------------------------------------------
        */

        drawer.classList.add(
            'active'
        );


        drawer.setAttribute(
            'aria-hidden',
            'false'
        );


        if (backdrop) {

            backdrop.classList.add(
                'active'
            );

        }

    }


/* ==========================================================
   CLOSE DRAWER
========================================================== */

    function closeInitiativeDrawer() {

    const drawer =
        document.getElementById(
            'initiative-drawer'
        );


    const backdrop =
        document.getElementById(
            'initiative-drawer-backdrop'
        );


    /*
    ----------------------------------------------------------
    Remove focus from anything inside the drawer first
    ----------------------------------------------------------
    */

    if (
        drawer
        && document.activeElement
        && drawer.contains(
            document.activeElement
        )
    ) {

        document.activeElement.blur();

    }


    /*
    ----------------------------------------------------------
    Close drawer
    ----------------------------------------------------------
    */

    if (drawer) {

        drawer.classList.remove(
            'active'
        );


        drawer.setAttribute(
            'aria-hidden',
            'true'
        );

    }


    /*
    ----------------------------------------------------------
    Close backdrop
    ----------------------------------------------------------
    */

    if (backdrop) {

        backdrop.classList.remove(
            'active'
        );

    }

    }

    /* ==========================================================
   ACTOR DETAIL DRAWER
========================================================== */

    function renderInitiativeExplorer(
        initiatives
    ) {

        const body =
            document.getElementById(
                'initiative-explorer-body'
            );


        const count =
            document.getElementById(
                'initiative-result-count'
            );


        if (!body) {
            return;
        }


        initiativeExplorerData =
            initiatives || [];


        const searchInput =
            document.getElementById(
                'initiative-search'
            );


        const searchTerm =
            normalizeFilterValue(
                searchInput
                    ? searchInput.value
                    : ''
            );


        let rows =
            [...initiativeExplorerData];


        /*
        ----------------------------------------------------------
        Search
        ----------------------------------------------------------
        */

        if (searchTerm) {

            rows =
                rows.filter(
                    initiative => {

                        const searchable =
                            [
                                initiative.initiative_name,
                                initiative.primary_subsector,
                                initiative.standard_status,
                                initiative.primary_technology,
                                getInitiativeLeadActor(
                                    initiative
                                )
                            ]
                            .join(' ')
                            .toLowerCase();


                        return searchable.includes(
                            searchTerm
                        );

                    }
                );

        }


        /*
        ----------------------------------------------------------
        Sort alphabetically
        ----------------------------------------------------------
        */

        rows.sort(
            (a, b) =>
                String(
                    a.initiative_name || ''
                )
                .localeCompare(
                    String(
                        b.initiative_name || ''
                    )
                )
        );

                /*
        ----------------------------------------------------------
        Pagination
        ----------------------------------------------------------
        */

        const totalRows =
            rows.length;


        const totalPages =
            Math.max(
                1,
                Math.ceil(
                    totalRows / initiativeExplorerPageSize
                )
            );


        if (
            initiativeExplorerPage > totalPages
        ) {
            initiativeExplorerPage = totalPages;
        }


        const startIndex =
            (
                initiativeExplorerPage - 1
            )
            * initiativeExplorerPageSize;


        const visibleRows =
            rows.slice(
                startIndex,
                startIndex + initiativeExplorerPageSize
            );


        /*
        ----------------------------------------------------------
        Count
        ----------------------------------------------------------
        */

        if (count) {

            count.textContent =
                rows.length
                + (
                    rows.length === 1
                        ? ' initiative'
                        : ' initiatives'
                );

        }


        /*
        ----------------------------------------------------------
        Empty state
        ----------------------------------------------------------
        */

        if (!rows.length) {

            body.innerHTML = `
                <tr>
                    <td
                        colspan="6"
                        class="energy-table-empty"
                    >
                        No initiatives match the current filters.
                    </td>
                </tr>
            `;


            return;

        }


        /*
        ----------------------------------------------------------
        Render rows
        ----------------------------------------------------------
        */

        body.innerHTML =
            visibleRows.map(
                initiative => {

                    const name =
                        initiative.initiative_name
                        || initiative.name
                        || initiative.initiative_id;


                    const subsector =
                        initiative.primary_subsector
                        || '—';


                    const status =
                        initiative.standard_status
                        || '—';


                    const technology =
                        initiative.primary_technology
                        || '—';


                    const actor =
                        getInitiativeLeadActor(
                            initiative
                        );


                    const value =
                        formatExplorerMoney(
                            initiative.total_value_usd
                        );


                    return `
                        <tr
                            data-initiative-id="${initiative.initiative_id}"
                        >

                            <td>
                                <span class="energy-initiative-name">
                                    ${escapeEnergyHtml(name)}
                                </span>

                                <small>
                                    ${escapeEnergyHtml(
                                        initiative.initiative_id
                                    )}
                                </small>
                            </td>

                            <td>
                                ${escapeEnergyHtml(subsector)}
                            </td>

                            <td>
                                <span class="energy-table-tag">
                                    ${escapeEnergyHtml(status)}
                                </span>
                            </td>

                            <td>
                                ${escapeEnergyHtml(technology)}
                            </td>

                            <td>
                                ${escapeEnergyHtml(actor)}
                            </td>

                            <td>
                                ${escapeEnergyHtml(value)}
                            </td>

                        </tr>
                    `;

                }
            )
            .join('');

            /*
            ----------------------------------------------------------
            Update pagination controls
            ----------------------------------------------------------
            */

            const pageInfo =
                document.getElementById(
                    'initiative-page-info'
                );


            const previousButton =
                document.getElementById(
                    'initiative-page-prev'
                );


            const nextButton =
                document.getElementById(
                    'initiative-page-next'
                );


            if (pageInfo) {

                pageInfo.textContent =
                    totalRows
                        ? `Page ${initiativeExplorerPage} of ${totalPages}`
                        : 'Page 0 of 0';

            }


            if (previousButton) {

                previousButton.disabled =
                    initiativeExplorerPage <= 1;

            }


            if (nextButton) {

                nextButton.disabled =
                    initiativeExplorerPage >= totalPages;

            }

    }

    function initInitiativeExplorer() {

        const search =
            document.getElementById(
                'initiative-search'
            );


        if (search) {

            search.addEventListener(
                'input',
                function () {
                    initiativeExplorerPage = 1;
                    renderInitiativeExplorer(
                        initiativeExplorerData
                    );

                }
            );

        }

        const previousButton =
        document.getElementById(
            'initiative-page-prev'
        );


        const nextButton =
            document.getElementById(
                'initiative-page-next'
            );


        if (previousButton) {

            previousButton.addEventListener(
                'click',
                function () {

                    if (
                        initiativeExplorerPage <= 1
                    ) {
                        return;
                    }


                    initiativeExplorerPage--;


                    renderInitiativeExplorer(
                        initiativeExplorerData
                    );

                }
            );

        }


        if (nextButton) {

            nextButton.addEventListener(
                'click',
                function () {

                    initiativeExplorerPage++;


                    renderInitiativeExplorer(
                        initiativeExplorerData
                    );

                }
            );

        }

        const tableBody =
            document.getElementById(
                'initiative-explorer-body'
            );


        if (tableBody) {

            tableBody.addEventListener(
                'click',
                function (event) {

                    const row =
                        event.target.closest(
                            'tr[data-initiative-id]'
                        );


                    if (!row) {
                        return;
                    }


                    openInitiativeDrawer(
                        row.dataset.initiativeId
                    );

                }
            );

        }

        /*
        Initial full dataset
        */

        renderInitiativeExplorer(
            data.initiatives || []
        );

        const drawerClose =
            document.getElementById(
                'initiative-drawer-close'
            );


        const drawerBackdrop =
            document.getElementById(
                'initiative-drawer-backdrop'
            );


        if (drawerClose) {

            drawerClose.addEventListener(
                'click',
                closeInitiativeDrawer
            );

        }


        if (drawerBackdrop) {

            drawerBackdrop.addEventListener(
                'click',
                closeInitiativeDrawer
            );

        }

        document.addEventListener(
            'keydown',
            function (event) {

                if (event.key === 'Escape') {

                    closeInitiativeDrawer();

                }

            }
        );

    }



