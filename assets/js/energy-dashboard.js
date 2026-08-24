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

    const actorById = {};

    const initiativeById = {};


    (data.actors || []).forEach(actor => {

        const actorId =
            String(
                actor.actor_id || ''
            ).trim();

        if (!actorId) {
            return;
        }

        actorById[actorId] = actor;

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
   3W — INITIATIVES BY STATE
========================================================== */

    function initStateRankingChart() {

        const element =
            document.getElementById(
                'state-ranking-chart'
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


        window.INETTStateRankingChart =
            chart;


        updateStateRankingChart(
            data.initiatives || []
        );


        window.addEventListener(
            'resize',
            function () {

                chart.resize();

            }
        );

    }



    function updateStateRankingChart(
        initiatives
    ) {

        const chart =
            window.INETTStateRankingChart;


        if (!chart) {
            return;
        }


        /*
        ----------------------------------------------------------
        Get IDs for currently filtered initiatives
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
        Count UNIQUE initiatives in each state
        ----------------------------------------------------------
        */

        const stateCounts = {};


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
                        !initiativeIds.has(
                            initiativeId
                        )
                        || !stateCode
                    ) {
                        return;
                    }


                    if (!stateCounts[stateCode]) {

                        stateCounts[stateCode] =
                            new Set();

                    }


                    stateCounts[stateCode]
                        .add(
                            initiativeId
                        );

                }
            );


        /*
        ----------------------------------------------------------
        Convert to chart rows
        ----------------------------------------------------------
        */

        let rows =
            Object.entries(
                stateCounts
            )
            .map(
                ([stateCode, ids]) => ({

                    stateCode:
                        stateCode,

                    stateName:
                        getStateNameByCode(
                            stateCode
                        ),

                    count:
                        ids.size

                })
            )
            .sort(
                (a, b) =>
                    b.count
                    - a.count
            );


        /*
        Show top 10 states only.
        */

        rows =
            rows.slice(
                0,
                10
            );


        if (!rows.length) {

            chart.clear();


            chart.setOption({

                title: {

                    text:
                        'No state activity matches these filters',

                    left:
                        'center',

                    top:
                        'middle',

                    textStyle: {

                        fontSize:
                            13,

                        fontWeight:
                            400,

                        color:
                            '#7a817d'

                    }

                }

            });


            return;

        }


        /*
        Horizontal chart reads better for state names.
        Lowest first because ECharts category axis renders
        from bottom to top.
        */

        rows.reverse();


        chart.clear();


        chart.setOption({

            animationDuration:
                350,


            tooltip: {

                trigger:
                    'axis',

                axisPointer: {
                    type: 'shadow'
                },

                formatter:
                    function (params) {

                        const row =
                            rows[
                                params[0]
                                    .dataIndex
                            ];


                        return `
                            <strong>
                                ${escapeEnergyHtml(
                                    row.stateName
                                )}
                            </strong>

                            <br>

                            ${row.count.toLocaleString()}
                            ${
                                row.count === 1
                                    ? 'initiative'
                                    : 'initiatives'
                            }
                        `;

                    }

            },


            grid: {

                left:
                    20,

                right:
                    35,

                top:
                    10,

                bottom:
                    10,

                containLabel:
                    true

            },


            xAxis: {

                type:
                    'value',

                minInterval:
                    1,

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

                type:
                    'category',

                data:
                    rows.map(
                        row =>
                            row.stateName
                    ),

                axisLine: {
                    show: false
                },

                axisTick: {
                    show: false
                },

                axisLabel: {

                    color:
                        '#39413d',

                    fontSize:
                        11

                }

            },


            series: [

                {

                    name:
                        'Initiatives',

                    type:
                        'bar',

                    data:
                        rows.map(
                            row =>
                                row.count
                        ),

                    barWidth:
                        18,

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

                        fontSize:
                            11,

                        fontWeight:
                            600,

                        color:
                            '#39413d'

                    }

                }

            ]

        });

    }

    /* ==========================================================
   3W — TECHNOLOGY MIX
========================================================== */

    function initTechnologyChart() {

        const element =
            document.getElementById(
                'technology-chart'
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


        window.INETTTechnologyChart =
            chart;


        updateTechnologyChart(
            data.initiatives || []
        );


        window.addEventListener(
            'resize',
            function () {

                chart.resize();

            }
        );

    }



    function updateTechnologyChart(
        initiatives
    ) {

        const chart =
            window.INETTTechnologyChart;


        if (!chart) {
            return;
        }


        const technologyCounts = {};


        initiatives.forEach(
            initiative => {

                const technology =
                    String(
                        initiative.primary_technology
                        || 'Unspecified'
                    )
                    .trim();


                if (!technologyCounts[technology]) {

                    technologyCounts[
                        technology
                    ] = 0;

                }


                technologyCounts[
                    technology
                ]++;

            }
        );


        let rows =
            Object.entries(
                technologyCounts
            )
            .map(
                ([technology, count]) => ({

                    technology:
                        technology,

                    count:
                        count

                })
            )
            .sort(
                (a, b) =>
                    b.count
                    - a.count
            );


        /*
        ----------------------------------------------------------
        Keep chart readable.

        Top 7 technologies remain separate.
        Everything else becomes "Other".
        ----------------------------------------------------------
        */

        const topRows =
            rows.slice(
                0,
                7
            );


        const remainingRows =
            rows.slice(
                7
            );


        if (remainingRows.length) {

            const otherCount =
                remainingRows.reduce(
                    (
                        total,
                        row
                    ) =>
                        total + row.count,
                    0
                );


            topRows.push({

                technology:
                    'Other',

                count:
                    otherCount

            });

        }


        rows =
            topRows;


        if (!rows.length) {

            chart.clear();


            chart.setOption({

                title: {

                    text:
                        'No technology data matches these filters',

                    left:
                        'center',

                    top:
                        'middle',

                    textStyle: {

                        fontSize:
                            13,

                        fontWeight:
                            400,

                        color:
                            '#7a817d'

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
                    function (params) {

                        return `
                            <strong>
                                ${escapeEnergyHtml(
                                    params.name
                                )}
                            </strong>

                            <br>

                            ${Number(
                                params.value
                            ).toLocaleString()}
                            initiatives

                            <br>

                            ${params.percent}%
                            of filtered initiatives
                        `;

                    }

            },


            legend: {

                type: 'scroll',

                orient: 'vertical',

                right: 12,

                top: 'middle',

                itemWidth: 18,

                itemHeight: 10,

                itemGap: 12,

                width: 175,

                textStyle: {
                    color: '#5f6863',
                    fontSize: 11
                },

                formatter: function (name) {

                    /*
                    Shorten very long legend labels only.
                    Tooltip still retains the full technology name.
                    */

                    const maxLength = 24;

                    if (name.length > maxLength) {
                        return name.substring(0, maxLength) + '…';
                    }

                    return name;
                }

            },


            series: [

                {

                    name:
                        'Technology mix',

                    type:
                        'pie',

                    radius:
                        [
                            '38%',
                            '64%'
                        ],

                    center:
                        [
                            '31%',
                            '50%'
                        ],

                    itemStyle: {

                        borderColor:
                            '#ffffff',

                        borderWidth:
                            2

                    },

                    label: {
                        show: false
                    },

                    emphasis: {

                        scale:
                            true,

                        scaleSize:
                            5

                    },

                    data:
                        rows.map(
                            row => ({

                                name:
                                    row.technology,

                                value:
                                    row.count

                            })
                        )

                }

            ]

        });

    }


    /* ==========================================================
   ACTORS — ACTIVITY CHART
========================================================== */

    function initActorActivityChart() {

        const element =
            document.getElementById(
                'actor-activity-chart'
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


        window.INETTActorActivityChart =
            chart;


        updateActorActivityChart();


        window.addEventListener(
            'resize',
            function () {

                chart.resize();

            }
        );

    }



    function updateActorActivityChart() {

        const chart =
            window.INETTActorActivityChart;


        if (!chart) {
            return;
        }


        /*
        ----------------------------------------------------------
        Top actors by initiative participation
        ----------------------------------------------------------
        */

        let rows =
            (data.actors || [])
                .map(
                    actor => ({

                        name:
                            actor.acronym
                            || actor.organisation_name
                            || actor.actor_id,

                        organisation:
                            actor.organisation_name
                            || '',

                        count:
                            Number(
                                actor.initiative_count
                                || 0
                            ),

                        states:
                            Number(
                                actor.states_reached
                                || 0
                            )

                    })
                )
                .filter(
                    actor =>
                        actor.count > 0
                )
                .sort(
                    (a, b) =>
                        b.count - a.count
                )
                .slice(
                    0,
                    10
                );


        if (!rows.length) {

            chart.clear();


            chart.setOption({

                title: {

                    text:
                        'No actor activity data available',

                    left:
                        'center',

                    top:
                        'middle',

                    textStyle: {

                        fontSize:
                            13,

                        fontWeight:
                            400,

                        color:
                            '#7a817d'

                    }

                }

            });


            return;

        }


        /*
        ECharts horizontal categories render bottom-up,
        so reverse for highest actor at the top.
        */

        rows.reverse();


        chart.clear();


        chart.setOption({

            animationDuration:
                350,


            tooltip: {

                trigger:
                    'axis',

                axisPointer: {
                    type: 'shadow'
                },

                formatter:
                    function (params) {

                        const row =
                            rows[
                                params[0]
                                    .dataIndex
                            ];


                        return `
                            <strong>
                                ${escapeEnergyHtml(
                                    row.name
                                )}
                            </strong>

                            ${
                                row.organisation
                                && row.organisation
                                    !== row.name
                                    ? `
                                        <br>
                                        ${escapeEnergyHtml(
                                            row.organisation
                                        )}
                                    `
                                    : ''
                            }

                            <br><br>

                            ${row.count.toLocaleString()}
                            initiatives

                            <br>

                            ${row.states.toLocaleString()}
                            states reached
                        `;

                    }

            },


            grid: {

                left:
                    20,

                right:
                    40,

                top:
                    10,

                bottom:
                    15,

                containLabel:
                    true

            },


            xAxis: {

                type:
                    'value',

                minInterval:
                    1,

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

                type:
                    'category',

                data:
                    rows.map(
                        row =>
                            row.name
                    ),

                axisTick: {
                    show: false
                },

                axisLine: {
                    show: false
                },

                axisLabel: {

                    color:
                        '#39413d',

                    fontSize:
                        11

                }

            },


            series: [

                {

                    name:
                        'Initiatives',

                    type:
                        'bar',

                    data:
                        rows.map(
                            row =>
                                row.count
                        ),

                    barWidth:
                        18,

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
                            '#39413d',

                        fontSize:
                            11,

                        fontWeight:
                            600

                    }

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
/* ==========================================================
   3W INITIATIVE EXPLORER
========================================================== */

    let initiativeExplorerData = [];

    let initiativeExplorerPage = 1;
    let initiativeExplorerPageSize = 10;


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


/* ==========================================================
   INIT EXPLORER
========================================================== */

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

                updateStateRankingChart(
                    initiatives
                );


                updateTechnologyChart(
                    initiatives
                );

                initiativeExplorerPage = 1;

                renderInitiativeExplorer(
                    initiatives
                );

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
        3W Geography charts
        */

        initStateRankingChart();

        initTechnologyChart();

                /*
        Actors & Mandates
        */

        initActorActivityChart();


        /*
        Connect Overview to filters
        */

        initOverviewFilterUpdates();

        initInitiativeExplorer();

    }
);


})();