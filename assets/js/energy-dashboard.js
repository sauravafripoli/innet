(function () {

    'use strict';

    if (
        typeof echarts === 'undefined'
        || typeof window.INETTEnergyData === 'undefined'
    ) {
        return;
    }


    const data = window.INETTEnergyData;

        /* ==========================================================
    SHARED ANALYTICAL FILTER STATE
    ========================================================== */

    const energyFilterState = {

        state: '',

        subsector: '',

        status: ''

    };


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



        /* ==========================================================
    OVERVIEW AGGREGATION HELPERS
    ========================================================== */

    function aggregateInitiativesBySubsector(
        initiatives
    ) {

        const groups = {};


        initiatives.forEach(
            initiative => {

                const subsector =
                    initiative.primary_subsector
                    || 'Unspecified';


                if (!groups[subsector]) {

                    groups[subsector] = {
                        subsector: subsector,
                        initiative_count: 0,
                        active_count: 0,
                        completed_count: 0,
                        pipeline_count: 0
                    };

                }


                groups[subsector]
                    .initiative_count++;


                const status =
                    normalizeFilterValue(
                        initiative.standard_status
                    );


                if (status === 'active') {

                    groups[subsector]
                        .active_count++;

                }


                if (status === 'completed') {

                    groups[subsector]
                        .completed_count++;

                }


                if (status === 'pipeline') {

                    groups[subsector]
                        .pipeline_count++;

                }

            }
        );


        return Object
            .values(groups)
            .sort(
                (a, b) =>
                    a.initiative_count
                    - b.initiative_count
            );

    }


    /* ==========================================================
    STATUS AGGREGATION
    ========================================================== */

    function aggregateInitiativesByStatus(
        initiatives
    ) {

        const groups = {};


        initiatives.forEach(
            initiative => {

                const status =
                    initiative.standard_status
                    || 'Unknown';


                if (!groups[status]) {

                    groups[status] = {
                        status: status,
                        initiative_count: 0
                    };

                }


                groups[status]
                    .initiative_count++;

            }
        );


        return Object.values(groups);

    }
    
    /* ==========================================================
        SUBSECTOR CHART
    ========================================================== */

    function initSubsectorChart() {

        const element =
            document.getElementById(
                'subsector-chart'
            );


        if (!element) {
            return;
        }


        /*
        Prevent duplicate ECharts instances
        */

        let chart =
            echarts.getInstanceByDom(
                element
            );


        if (!chart) {

            chart =
                echarts.init(
                    element
                );

        }


        window.INETTSubsectorChart =
            chart;


        /*
        Initial chart:
        all initiatives
        */

        updateSubsectorChart(
            data.initiatives || []
        );


        window.addEventListener(
            'resize',
            function () {

                chart.resize();

            }
        );

    }


    /* ==========================================================
   UPDATE SUBSECTOR CHART
========================================================== */

    function updateSubsectorChart(
        initiatives
    ) {

        const chart =
            window.INETTSubsectorChart;


        if (!chart) {
            return;
        }


        const rows =
            aggregateInitiativesBySubsector(
                initiatives
            );


        const labels =
            rows.map(
                row =>
                    row.subsector
            );


        const values =
            rows.map(
                row =>
                    Number(
                        row.initiative_count
                    )
            );


        /*
        Empty-state handling
        */

        if (!rows.length) {

            chart.clear();


            chart.setOption({

                title: {

                    text:
                        'No initiatives match these filters',

                    left:
                        'center',

                    top:
                        'middle',

                    textStyle: {

                        fontSize: 13,

                        fontWeight: 400,

                        color: '#7a817d'

                    }

                }

            });


            return;
        }


        chart.clear();


        chart.setOption({

            animationDuration: 350,


            tooltip: {

                trigger: 'axis',

                axisPointer: {
                    type: 'shadow'
                },


                formatter: function (
                    params
                ) {

                    const index =
                        params[0]
                            .dataIndex;


                    const row =
                        rows[index];


                    return `
                        <strong>
                            ${row.subsector}
                        </strong>

                        <br>

                        Initiatives:
                        ${Number(
                            row.initiative_count
                        ).toLocaleString()}

                        <br>

                        Active:
                        ${Number(
                            row.active_count
                        ).toLocaleString()}

                        <br>

                        Completed:
                        ${Number(
                            row.completed_count
                        ).toLocaleString()}
                    `;

                }

            },


            grid: {

                left: 20,

                right: 30,

                top: 20,

                bottom: 20,

                containLabel: true

            },


            xAxis: {

                type: 'value',

                minInterval: 1,

                axisLine: {
                    show: false
                },

                axisTick: {
                    show: false
                },

                splitLine: {

                    lineStyle: {
                        color: '#edf0ee'
                    }

                }

            },


            yAxis: {

                type: 'category',

                data: labels,

                axisTick: {
                    show: false
                },

                axisLine: {
                    show: false
                },

                axisLabel: {

                    color: '#39413d',

                    fontSize: 12

                }

            },


            series: [

                {

                    name:
                        'Initiatives',

                    type:
                        'bar',

                    data:
                        values,

                    barWidth:
                        20,

                    itemStyle: {

                        color:
                            '#0f6e56',

                        borderRadius:
                            [0, 5, 5, 0]

                    },

                    label: {

                        show:
                            true,

                        position:
                            'right',

                        color:
                            '#37413c',

                        fontWeight:
                            600

                    }

                }

            ]

        });

    }

    /* ==========================================================
   STATUS CHART
========================================================== */

    function initStatusChart() {

        const element =
            document.getElementById(
                'status-chart'
            );


        if (!element) {
            return;
        }


        let chart =
            echarts.getInstanceByDom(
                element
            );


        if (!chart) {

            chart =
                echarts.init(
                    element
                );

        }


        window.INETTStatusChart =
            chart;


        /*
        Initial chart
        */

        updateStatusChart(
            data.initiatives || []
        );


        window.addEventListener(
            'resize',
            function () {

                chart.resize();

            }
        );

    }

    /* ==========================================================
   UPDATE STATUS CHART
========================================================== */

    function updateStatusChart(
        initiatives
    ) {

        const chart =
            window.INETTStatusChart;


        if (!chart) {
            return;
        }


        const rows =
            aggregateInitiativesByStatus(
                initiatives
            );


        const chartData =
            rows.map(
                row => ({

                    name:
                        row.status,

                    value:
                        Number(
                            row.initiative_count
                        )

                })
            );


        const total =
            chartData.reduce(

                (
                    sum,
                    item
                ) =>

                    sum
                    + item.value,

                0

            );


        /*
        Empty result
        */

        if (!chartData.length) {

            chart.clear();


            chart.setOption({

                title: {

                    text:
                        'No initiatives match these filters',

                    left:
                        'center',

                    top:
                        'middle',

                    textStyle: {

                        fontSize: 13,

                        fontWeight: 400,

                        color: '#7a817d'

                    }

                }

            });


            return;
        }


        chart.clear();


        chart.setOption({

            animationDuration:
                350,


            tooltip: {

                trigger:
                    'item',

                formatter:
                    '{b}<br>{c} initiatives ({d}%)'

            },


            legend: {

                bottom: 0,

                left: 'center',

                textStyle: {

                    color:
                        '#5f6863',

                    fontSize:
                        11

                }

            },


            graphic: [

                {

                    type:
                        'text',

                    left:
                        'center',

                    top:
                        '39%',

                    style: {

                        text:
                            total
                                .toLocaleString(),

                        fontSize:
                            30,

                        fontWeight:
                            700,

                        fill:
                            '#17211c',

                        textAlign:
                            'center'

                    }

                },


                {

                    type:
                        'text',

                    left:
                        'center',

                    top:
                        '50%',

                    style: {

                        text:
                            'initiatives',

                        fontSize:
                            11,

                        fill:
                            '#7c847f',

                        textAlign:
                            'center'

                    }

                }

            ],


            series: [

                {

                    name:
                        'Initiative status',

                    type:
                        'pie',

                    radius: [
                        '52%',
                        '72%'
                    ],

                    center: [
                        '50%',
                        '43%'
                    ],

                    avoidLabelOverlap:
                        true,

                    itemStyle: {

                        borderColor:
                            '#ffffff',

                        borderWidth:
                            3

                    },

                    label: {
                        show: false
                    },

                    emphasis: {

                        scale:
                            true,

                        scaleSize:
                            5,

                        label: {

                            show:
                                true,

                            fontSize:
                                13,

                            fontWeight:
                                600

                        }

                    },

                    data:
                        chartData

                }

            ]

        });

    }

    /* ==========================================================
   UPDATE OVERVIEW KPIs
========================================================== */

    function updateOverviewKpis(
        initiatives
    ) {

        /*
        Total initiatives
        */

        const totalElement =
            document.getElementById(
                'kpi-total-initiatives'
            );


        /*
        Active initiatives
        */

        const activeElement =
            document.getElementById(
                'kpi-active-initiatives'
            );


        const total =
            initiatives.length;


        const active =
            initiatives.filter(
                initiative =>

                    normalizeFilterValue(
                        initiative.standard_status
                    )
                    === 'active'
            ).length;


        if (totalElement) {

            totalElement.textContent =
                total.toLocaleString();

        }


        if (activeElement) {

            activeElement.textContent =
                active.toLocaleString();

        }

    }

    /* ==========================================================
   MAP FILTER DATA
========================================================== */


    /* ==========================================================
   UPDATE FILTERED MAP
========================================================== */

    /* ==========================================================
   UPDATE FILTERED ENERGY MAP
========================================================== */

    function updateEnergyMap() {

        const geoJsonLayer =
            window.INETTEnergyGeoJsonLayer;


        if (!geoJsonLayer) {
            return;
        }


        /*
        Get initiatives filtered by
        subsector + status.

        State is intentionally ignored here
        so the map remains nationally comparative.
        */

        const initiatives =
            getMapFilteredInitiatives();


        /*
        ----------------------------------------------------------
        Create initiative lookup
        ----------------------------------------------------------
        */

        const initiativeIds =
            new Set(
                initiatives.map(
                    initiative =>
                        String(
                            initiative.initiative_id
                        )
                )
            );


        /*
        ----------------------------------------------------------
        Count UNIQUE initiatives by state
        ----------------------------------------------------------
        */

        const initiativesByState = {};


        (data.initiative_locations || [])
            .forEach(
                location => {

                    const initiativeId =
                        String(
                            location.initiative_id
                            || ''
                        );


                    const stateCode =
                        String(
                            location.state_code
                            || ''
                        );


                    if (
                        !initiativeId
                        || !stateCode
                        || !initiativeIds.has(
                            initiativeId
                        )
                    ) {
                        return;
                    }


                    if (
                        !initiativesByState[
                            stateCode
                        ]
                    ) {

                        initiativesByState[
                            stateCode
                        ] =
                            new Set();

                    }


                    initiativesByState[
                        stateCode
                    ].add(
                        initiativeId
                    );

                }
            );


        /*
        ----------------------------------------------------------
        Determine maximum value.

        This makes the choropleth scale dynamic rather
        than using fixed thresholds like 5, 10, 20, 30.
        ----------------------------------------------------------
        */

        let maxCount = 0;


        Object.values(
            initiativesByState
        )
        .forEach(
            initiativeSet => {

                maxCount =
                    Math.max(
                        maxCount,
                        initiativeSet.size
                    );

            }
        );


        /*
        ----------------------------------------------------------
        Choropleth colour scale
        ----------------------------------------------------------
        */

        function getMapColor(
            count
        ) {

            if (!count) {
                return '#edf2ef';
            }


            const ratio =
                maxCount > 0
                    ? count / maxCount
                    : 0;


            if (ratio >= 0.80) {
                return '#0b493b';
            }


            if (ratio >= 0.60) {
                return '#14614d';
            }


            if (ratio >= 0.40) {
                return '#347e68';
            }


            if (ratio >= 0.20) {
                return '#71aa96';
            }


            return '#b8d6ca';

        }


        /*
        ----------------------------------------------------------
        Currently selected state
        ----------------------------------------------------------
        */

        const selectedState =
            normalizeFilterValue(
                energyFilterState.state
            );


        /*
        ----------------------------------------------------------
        Repaint polygons
        ----------------------------------------------------------
        */

        geoJsonLayer.eachLayer(
            layer => {

                const state =
                    layer._inettState;


                const stateCode =
                    String(
                        layer._inettStateCode
                        || ''
                    );


                /*
                This layer has no matching DB state.
                Give it neutral styling so we can
                immediately see a matching problem.
                */

                if (
                    !state
                    || !stateCode
                ) {

                    if (
                        typeof layer.setStyle
                        === 'function'
                    ) {

                        layer.setStyle({

                            fillColor:
                                '#eeeeee',

                            fillOpacity:
                                0.65,

                            color:
                                '#ffffff',

                            weight:
                                1

                        });

                    }


                    return;

                }


                /*
                Number of filtered initiatives
                in this state
                */

                const count =
                    initiativesByState[
                        stateCode
                    ]
                        ? initiativesByState[
                            stateCode
                        ].size
                        : 0;


                const isSelected =
                    selectedState
                    &&
                    normalizeFilterValue(
                        stateCode
                    )
                    === selectedState;


                /*
                Apply choropleth styling
                */

                if (
                    typeof layer.setStyle
                    === 'function'
                ) {

                    layer.setStyle({

                        fillColor:
                            getMapColor(
                                count
                            ),

                        fillOpacity:
                            count > 0
                                ? 0.88
                                : 0.35,

                        color:
                            isSelected
                                ? '#e1ad32'
                                : '#ffffff',

                        weight:
                            isSelected
                                ? 4
                                : 1.2,

                        opacity:
                            1

                    });

                }


                /*
                Update tooltip
                */

                if (
                    typeof layer
                        .setTooltipContent
                    === 'function'
                ) {

                    layer.setTooltipContent(
                        `
                        <strong>
                            ${state.state_name}
                        </strong>

                        <br>

                        ${count.toLocaleString()}
                        ${
                            count === 1
                                ? 'initiative'
                                : 'initiatives'
                        }
                        `
                    );

                }


                /*
                Keep selected state above
                neighbouring polygons
                */

                if (
                    isSelected
                    &&
                    typeof layer
                        .bringToFront
                    === 'function'
                ) {

                    layer.bringToFront();

                }

            }
        );


        console.log(
            'INETT map updated:',
            {
                filteredInitiatives:
                    initiatives.length,

                statesWithActivity:
                    Object.keys(
                        initiativesByState
                    ).length,

                maxStateCount:
                    maxCount
            }
        );

    }


    function getMapFilteredInitiatives() {

        const initiatives =
            data.initiatives || [];


        const selectedSubsector =
            normalizeFilterValue(
                energyFilterState.subsector
            );


        const selectedStatus =
            normalizeFilterValue(
                energyFilterState.status
            );


        return initiatives.filter(
            initiative => {


                /*
                --------------------------------------------------
                SUBSECTOR
                --------------------------------------------------
                */

                if (selectedSubsector) {

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
                                        normalizeFilterValue(
                                            subsector
                                        )
                                        === selectedSubsector
                                );

                    }


                    if (
                        primarySubsector
                        !== selectedSubsector
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

                if (selectedStatus) {

                    if (
                        normalizeFilterValue(
                            initiative.standard_status
                        )
                        !== selectedStatus
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


                        /*
                        Update state profile
                        */

                        updateStatePanel(
                            state
                        );


                        /*
                        Set the global State filter
                        */

                        if (
                            typeof window
                                .INETTSetStateFilter
                            === 'function'
                        ) {

                            window
                                .INETTSetStateFilter(
                                    state.state_code
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

    function getFilteredInitiatives() {

        const initiatives =
            data.initiatives || [];


        const selectedState =
            normalizeFilterValue(
                energyFilterState.state
            );


        const selectedSubsector =
            normalizeFilterValue(
                energyFilterState.subsector
            );


        const selectedStatus =
            normalizeFilterValue(
                energyFilterState.status
            );


        return initiatives.filter(
            initiative => {


                /*
                --------------------------------------------------------------
                STATE
                --------------------------------------------------------------
                */

                if (selectedState) {

                    const locations =
                        initiativeLocationsById[
                            initiative.initiative_id
                        ];


                    if (!locations) {
                        return false;
                    }


                    const hasState =
                        [...locations].some(
                            stateCode =>
                                normalizeFilterValue(
                                    stateCode
                                )
                                === selectedState
                        );


                    if (!hasState) {
                        return false;
                    }

                }


                /*
                --------------------------------------------------------------
                SUBSECTOR
                --------------------------------------------------------------
                */

                if (selectedSubsector) {

                    const primarySubsector =
                        normalizeFilterValue(
                            initiative
                                .primary_subsector
                        );


                    const relatedSubsectors =
                        initiativeSubsectorsById[
                            initiative.initiative_id
                        ];


                    const primaryMatches =
                        primarySubsector
                        === selectedSubsector;


                    let relationshipMatches =
                        false;


                    if (relatedSubsectors) {

                        relationshipMatches =
                            [...relatedSubsectors]
                                .some(
                                    subsector =>
                                        normalizeFilterValue(
                                            subsector
                                        )
                                        === selectedSubsector
                                );

                    }


                    if (
                        !primaryMatches
                        && !relationshipMatches
                    ) {

                        return false;

                    }

                }


                /*
                --------------------------------------------------------------
                STATUS
                --------------------------------------------------------------
                */

                if (selectedStatus) {

                    const initiativeStatus =
                        normalizeFilterValue(
                            initiative
                                .standard_status
                        );


                    if (
                        initiativeStatus
                        !== selectedStatus
                    ) {

                        return false;

                    }

                }


                return true;

            }
        );

    }


    /*
    |--------------------------------------------------------------------------
    | Get filtered initiative IDs
    |--------------------------------------------------------------------------
    */

    function getFilteredInitiativeIds() {

        return new Set(

            getFilteredInitiatives()
                .map(
                    initiative =>
                        initiative.initiative_id
                )

        );

    }



        /* ==========================================================
    FILTER CHANGE HANDLER
    ========================================================== */

    function applyEnergyFilters() {

        const filteredInitiatives =
            getFilteredInitiatives();


        const filteredIds =
            new Set(
                filteredInitiatives.map(
                    initiative =>
                        initiative.initiative_id
                )
            );


        /*
        ----------------------------------------------------------
        Debugging for now
        ----------------------------------------------------------
        */

        console.log(
            'INETT filters:',
            {
                ...energyFilterState
            }
        );


        console.log(
            'Matching initiatives:',
            filteredInitiatives.length
        );


        /*
        ----------------------------------------------------------
        Broadcast an application event
        ----------------------------------------------------------
        |
        | Each chart/map/module can listen to this later.
        |
        */

        document.dispatchEvent(
            new CustomEvent(
                'inett:filtersChanged',
                {
                    detail: {

                        filters: {
                            ...energyFilterState
                        },

                        initiatives:
                            filteredInitiatives,

                        initiativeIds:
                            filteredIds

                    }
                }
            )
        );

    }


    /* ==========================================================
   GLOBAL FILTER CONTROLS
========================================================== */

    function initEnergyFilters() {

        const stateSelect =
            document.getElementById(
                'energy-filter-state'
            );


        const subsectorSelect =
            document.getElementById(
                'energy-filter-subsector'
            );


        const statusSelect =
            document.getElementById(
                'energy-filter-status'
            );


        const resetButton =
            document.getElementById(
                'energy-filter-reset'
            );


        /*
        ----------------------------------------------------------
        State
        ----------------------------------------------------------
        */

        if (stateSelect) {

            stateSelect.addEventListener(
                'change',
                function () {

                    energyFilterState.state =
                        this.value || '';


                    applyEnergyFilters();

                }
            );

        }


        /*
        ----------------------------------------------------------
        Subsector
        ----------------------------------------------------------
        */

        if (subsectorSelect) {

            subsectorSelect.addEventListener(
                'change',
                function () {

                    energyFilterState.subsector =
                        this.value || '';


                    applyEnergyFilters();

                }
            );

        }


        /*
        ----------------------------------------------------------
        Status
        ----------------------------------------------------------
        */

        if (statusSelect) {

            statusSelect.addEventListener(
                'change',
                function () {

                    energyFilterState.status =
                        this.value || '';


                    applyEnergyFilters();

                }
            );

        }


        /*
        ----------------------------------------------------------
        Reset
        ----------------------------------------------------------
        */

        if (resetButton) {

            resetButton.addEventListener(
                'click',
                function () {

                    energyFilterState.state =
                        '';

                    energyFilterState.subsector =
                        '';

                    energyFilterState.status =
                        '';


                    if (stateSelect) {
                        stateSelect.value = '';
                    }


                    if (subsectorSelect) {
                        subsectorSelect.value = '';
                    }


                    if (statusSelect) {
                        statusSelect.value = '';
                    }


                    applyEnergyFilters();

                }
            );

        }

    }
/* ==========================================================
   INTELLIGENCE TABS
========================================================== */

    function initEnergyTabs() {

    const buttons =
        document.querySelectorAll(
            '[data-energy-tab]'
        );


    const panels =
        document.querySelectorAll(
            '[data-energy-panel]'
        );


    if (
        !buttons.length
        || !panels.length
    ) {
        return;
    }


    /*
    ----------------------------------------------------------
    Activate one intelligence tab
    ----------------------------------------------------------
    */

    function activateTab(
        tabName,
        updateUrl = true
    ) {

        const targetPanel =
            document.querySelector(
                `[data-energy-panel="${tabName}"]`
            );


        if (!targetPanel) {
            return;
        }


        /*
        ------------------------------------------------------
        Buttons
        ------------------------------------------------------
        */

        buttons.forEach(
            button => {

                const isActive =
                    button.dataset.energyTab
                    === tabName;


                button.classList.toggle(
                    'active',
                    isActive
                );


                button.setAttribute(
                    'aria-selected',
                    isActive
                        ? 'true'
                        : 'false'
                );

            }
        );


        /*
        ------------------------------------------------------
        Panels
        ------------------------------------------------------
        */

        panels.forEach(
            panel => {

                const isActive =
                    panel.dataset.energyPanel
                    === tabName;


                panel.classList.toggle(
                    'active',
                    isActive
                );

            }
        );


        /*
        ------------------------------------------------------
        URL
        ------------------------------------------------------
        */

        if (updateUrl) {

            history.pushState(
                null,
                '',
                '#' + tabName
            );

        }


        /*
        ------------------------------------------------------
        Visualisation handling
        ------------------------------------------------------
        */

        requestAnimationFrame(
            function () {


                /*
                ==================================================
                GEOGRAPHY / LEAFLET
                ==================================================
                */

                if (
                    tabName
                    === 'geography'
                ) {

                    /*
                    Wait until CSS display:block has
                    actually taken effect.
                    */

                    setTimeout(
                        function () {


                            /*
                            First visit:
                            create map only when visible.
                            */

                            if (
                                !window
                                    .INETTEnergyMap
                            ) {

                                initNigeriaMap();

                                return;
                            }


                            /*
                            Existing map:
                            recalculate dimensions.
                            */

                            window
                                .INETTEnergyMap
                                .invalidateSize(
                                    true
                                );


                            /*
                            Restore Nigeria bounds.
                            */

                            if (
                                window
                                    .INETTEnergyGeoJsonLayer
                            ) {

                                window
                                    .INETTEnergyMap
                                    .fitBounds(

                                        window
                                            .INETTEnergyGeoJsonLayer
                                            .getBounds(),

                                        {
                                            padding:
                                                [10, 10]
                                        }

                                    );

                            }

                        },
                        120
                    );

                }


                /*
                ==================================================
                ECHARTS
                ==================================================
                */

                if (
                    typeof echarts
                    !== 'undefined'
                ) {

                    targetPanel
                        .querySelectorAll(
                            '.energy-chart'
                        )
                        .forEach(
                            element => {

                                const chart =
                                    echarts
                                        .getInstanceByDom(
                                            element
                                        );


                                if (chart) {

                                    chart.resize();

                                }

                            }
                        );

                }

            }
        );

    }


    /*
    ----------------------------------------------------------
    Click handling
    ----------------------------------------------------------
    */

    buttons.forEach(
        button => {

            button.addEventListener(
                'click',
                function () {

                    activateTab(
                        this.dataset
                            .energyTab
                    );

                }
            );

        }
    );


    /*
    ----------------------------------------------------------
    Initial tab from URL hash
    ----------------------------------------------------------
    */

    const requestedTab =
        window.location.hash
            .replace('#', '')
            .trim();


    const validTab =
        [...buttons].some(
            button =>
                button.dataset
                    .energyTab
                === requestedTab
        );


    activateTab(
        validTab
            ? requestedTab
            : 'overview',
        false
    );


    /*
    ----------------------------------------------------------
    Back / forward navigation
    ----------------------------------------------------------
    */

    window.addEventListener(
        'popstate',
        function () {

            const tab =
                window.location.hash
                    .replace('#', '')
                    .trim();


            activateTab(
                tab || 'overview',
                false
            );

        }
    );


    /*
    Hash can also change directly.
    */

    window.addEventListener(
        'hashchange',
        function () {

            const tab =
                window.location.hash
                    .replace('#', '')
                    .trim();


            const exists =
                [...buttons].some(
                    button =>
                        button.dataset
                            .energyTab
                        === tab
                );


            if (exists) {

                activateTab(
                    tab,
                    false
                );

            }

        }
    );

}


/* ==========================================================
   PROGRAMMATIC STATE FILTER
========================================================== */

    function setEnergyStateFilter(
        stateCode
    ) {

        const stateSelect =
            document.getElementById(
                'energy-filter-state'
            );


        energyFilterState.state =
            stateCode || '';


        if (stateSelect) {

            stateSelect.value =
                stateCode || '';

        }


        applyEnergyFilters();

    }


    /* ==========================================================
   FILTER-RESPONSIVE OVERVIEW
========================================================== */

    /* ==========================================================
   FILTER-RESPONSIVE INTERFACE
========================================================== */

    function initOverviewFilterUpdates() {

        document.addEventListener(
            'inett:filtersChanged',
            function (event) {

                const initiatives =
                    event.detail
                        .initiatives
                    || [];


                /*
                Overview KPIs
                */

                updateOverviewKpis(
                    initiatives
                );


                /*
                Overview charts
                */

                updateSubsectorChart(
                    initiatives
                );


                updateStatusChart(
                    initiatives
                );


                /*
                Geographic intelligence
                */

                updateEnergyMap();

            }
        );

    }
/*
|--------------------------------------------------------------------------
| Expose to interactive map
|--------------------------------------------------------------------------
*/

window.INETTSetStateFilter =
    setEnergyStateFilter;



document.addEventListener(
    'DOMContentLoaded',
    function () {

        /*
        Application navigation
        */

        initEnergyTabs();


        /*
        Global filters
        */

        initEnergyFilters();


        /*
        Overview charts
        */

        initSubsectorChart();

        initStatusChart();


        /*
        Connect Overview to filters
        */

        initOverviewFilterUpdates();

    }
);


})();