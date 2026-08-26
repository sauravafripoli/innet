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



    /* ==========================================================
   MANDATE COVERAGE PAGINATION
========================================================== */

    let mandatePage = 1;

    const mandatePageSize = 10;


    function renderMandatePage() {

        const rows =
            [
                ...document.querySelectorAll(
                    '.energy-mandate-row'
                )
            ];


        const pageInfo =
            document.getElementById(
                'mandate-page-info'
            );


        const previousButton =
            document.getElementById(
                'mandate-page-prev'
            );


        const nextButton =
            document.getElementById(
                'mandate-page-next'
            );


        if (!rows.length) {
            return;
        }


        const totalPages =
            Math.max(
                1,
                Math.ceil(
                    rows.length
                    / mandatePageSize
                )
            );


        if (mandatePage > totalPages) {
            mandatePage = totalPages;
        }


        if (mandatePage < 1) {
            mandatePage = 1;
        }


        const start =
            (
                mandatePage - 1
            )
            * mandatePageSize;


        const end =
            start
            + mandatePageSize;


        rows.forEach(
            (
                row,
                index
            ) => {

                row.style.display =
                    (
                        index >= start
                        && index < end
                    )
                        ? ''
                        : 'none';

            }
        );


        if (pageInfo) {

            pageInfo.textContent =
                `Page ${mandatePage} of ${totalPages}`;

        }


        if (previousButton) {

            previousButton.disabled =
                mandatePage <= 1;

        }


        if (nextButton) {

            nextButton.disabled =
                mandatePage >= totalPages;

        }

    }



    function initMandatePagination() {

        const previousButton =
            document.getElementById(
                'mandate-page-prev'
            );


        const nextButton =
            document.getElementById(
                'mandate-page-next'
            );


        if (previousButton) {

            previousButton.addEventListener(
                'click',
                function () {

                    if (mandatePage <= 1) {
                        return;
                    }


                    mandatePage--;


                    renderMandatePage();

                }
            );

        }


        if (nextButton) {

            nextButton.addEventListener(
                'click',
                function () {

                    mandatePage++;


                    renderMandatePage();

                }
            );

        }


        renderMandatePage();

    }


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


        updateActorActivityChart(
            data.initiatives || []
        );


        window.addEventListener(
            'resize',
            function () {

                chart.resize();

            }
        );

    }



    function updateActorActivityChart(
    initiatives
) {

    const chart =
        window.INETTActorActivityChart;


    if (!chart) {
        return;
    }


    initiatives =
        initiatives
        || data.initiatives
        || [];


    /*
    ----------------------------------------------------------
    Filtered initiative IDs
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
    Count initiative participation by actor
    ----------------------------------------------------------
    */

    const actorActivity = {};


    (data.initiative_actors || [])
        .forEach(
            relationship => {

                const initiativeId =
                    String(
                        relationship.initiative_id
                        || ''
                    );


                const actorId =
                    String(
                        relationship.actor_id
                        || ''
                    );


                if (
                    !initiativeIds.has(
                        initiativeId
                    )
                    || !actorId
                ) {
                    return;
                }


                if (!actorActivity[actorId]) {

                    actorActivity[actorId] = {
                        initiatives: new Set(),
                        states: new Set()
                    };

                }


                actorActivity[
                    actorId
                ]
                .initiatives
                .add(
                    initiativeId
                );


                /*
                States reached by this actor's
                currently matching initiatives
                */

                const locations =
                    initiativeLocationsById[
                        initiativeId
                    ];


                if (locations) {

                    locations.forEach(
                        stateCode => {

                            actorActivity[
                                actorId
                            ]
                            .states
                            .add(
                                stateCode
                            );

                        }
                    );

                }

            }
        );


    /*
    ----------------------------------------------------------
    Build chart rows
    ----------------------------------------------------------
    */

    let rows =
        Object.entries(
            actorActivity
        )
        .map(
            ([actorId, activity]) => {

                const actor =
                    actorById[
                        actorId
                    ];


                return {

                    actorId:
                        actorId,

                    name:
                        actor
                            ? (
                                actor.acronym
                                || actor.organisation_name
                                || actorId
                            )
                            : actorId,

                    organisation:
                        actor
                            ? (
                                actor.organisation_name
                                || ''
                            )
                            : '',

                    count:
                        activity
                            .initiatives
                            .size,

                    states:
                        activity
                            .states
                            .size

                };

            }
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
                    'No actor activity matches these filters',

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
                            params[0].dataIndex
                        ];


                    return `
                        <strong>
                            ${escapeEnergyHtml(
                                row.name
                            )}
                        </strong>

                        ${
                            row.organisation
                            && row.organisation !== row.name
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
                        ${
                            row.count === 1
                                ? 'initiative'
                                : 'initiatives'
                        }

                        <br>

                        ${row.states.toLocaleString()}
                        ${
                            row.states === 1
                                ? 'state reached'
                                : 'states reached'
                        }
                    `;

                }

        },


        grid: {

            left: 20,
            right: 40,
            top: 10,
            bottom: 15,

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
                color: '#39413d',
                fontSize: 11
            }

        },


        series: [

            {

                name: 'Initiatives',

                type: 'bar',

                data:
                    rows.map(
                        row =>
                            row.count
                    ),

                barWidth: 18,

                itemStyle: {

                    color: '#0f6e56',

                    borderRadius:
                        [0, 5, 5, 0]

                },

                label: {

                    show: true,

                    position: 'right',

                    color: '#39413d',

                    fontSize: 11,

                    fontWeight: 600

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

    /* ==========================================================
   ACTOR DETAIL DRAWER
========================================================== */

    function openActorDrawer(
        actorId
    ) {

        const actor =
            actorById[
                String(actorId)
            ];


        if (!actor) {

            console.warn(
                'Actor not found:',
                actorId
            );

            return;

        }


        const drawer =
            document.getElementById(
                'actor-drawer'
            );


        const backdrop =
            document.getElementById(
                'actor-drawer-backdrop'
            );


        const title =
            document.getElementById(
                'actor-drawer-title'
            );


        const idElement =
            document.getElementById(
                'actor-drawer-id'
            );


        const content =
            document.getElementById(
                'actor-drawer-content'
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
                actor.acronym
                || actor.organisation_name
                || actor.actor_id;

        }


        if (idElement) {

            idElement.textContent =
                actor.actor_id
                || '';

        }


        /*
        ----------------------------------------------------------
        Related initiatives
        ----------------------------------------------------------
        */

        const relationships =
            (data.initiative_actors || [])
                .filter(
                    relationship =>

                        String(
                            relationship.actor_id
                        )
                        ===
                        String(
                            actor.actor_id
                        )
                );


        const initiativeIds =
            [
                ...new Set(
                    relationships
                        .map(
                            relationship =>
                                String(
                                    relationship.initiative_id
                                )
                        )
                        .filter(Boolean)
                )
            ];


        const relatedInitiatives =
            initiativeIds
                .map(
                    initiativeId =>
                        initiativeById[
                            initiativeId
                        ]
                )
                .filter(Boolean);


        /*
        ----------------------------------------------------------
        States reached
        ----------------------------------------------------------
        */

        const statesReached =
            new Set();


        relatedInitiatives.forEach(
            initiative => {

                const locations =
                    initiativeLocationsById[
                        initiative.initiative_id
                    ];


                if (!locations) {
                    return;
                }


                locations.forEach(
                    stateCode => {

                        statesReached.add(
                            stateCode
                        );

                    }
                );

            }
        );


        /*
        ----------------------------------------------------------
        Subsector coverage
        ----------------------------------------------------------
        */

        const subsectors =
            [
                ...new Set(
                    relatedInitiatives
                        .map(
                            initiative =>
                                initiative.primary_subsector
                        )
                        .filter(Boolean)
                )
            ];


        /*
        ----------------------------------------------------------
        Render profile
        ----------------------------------------------------------
        */

        content.innerHTML = `

            <div class="energy-drawer-badges">

                <span class="energy-drawer-badge">
                    ${escapeEnergyHtml(
                        actor.actor_type || 'Actor'
                    )}
                </span>

                ${
                    actor.governance_tier
                        ? `
                            <span class="energy-drawer-badge">
                                ${escapeEnergyHtml(
                                    actor.governance_tier
                                )}
                            </span>
                        `
                        : ''
                }

            </div>


            <section class="energy-drawer-section">

                <h3 class="energy-drawer-section-title">
                    Institution
                </h3>


                <div class="energy-drawer-fields">

                    <div class="energy-drawer-field">

                        <span>
                            Organisation
                        </span>

                        <strong>
                            ${escapeEnergyHtml(
                                actor.organisation_name
                                || '—'
                            )}
                        </strong>

                    </div>


                    <div class="energy-drawer-field">

                        <span>
                            Acronym
                        </span>

                        <strong>
                            ${escapeEnergyHtml(
                                actor.acronym
                                || '—'
                            )}
                        </strong>

                    </div>


                    <div class="energy-drawer-field">

                        <span>
                            Primary role
                        </span>

                        <strong>
                            ${escapeEnergyHtml(
                                actor.primary_role
                                || '—'
                            )}
                        </strong>

                    </div>


                    <div class="energy-drawer-field">

                        <span>
                            Sub-sector focus
                        </span>

                        <strong>
                            ${escapeEnergyHtml(
                                actor.subsector_focus
                                || '—'
                            )}
                        </strong>

                    </div>

                </div>

            </section>


            <section class="energy-drawer-section">

                <h3 class="energy-drawer-section-title">
                    Mandate
                </h3>

                <div class="energy-drawer-field">

                    <span>
                        Mandate summary
                    </span>

                    <strong>
                        ${escapeEnergyHtml(
                            actor.mandate_summary
                            || '—'
                        )}
                    </strong>

                </div>

            </section>


            <section class="energy-drawer-section">

                <h3 class="energy-drawer-section-title">
                    Activity
                </h3>


                <div class="energy-drawer-metrics">

                    <div class="energy-drawer-metric">

                        <span>
                            Initiatives
                        </span>

                        <strong>
                            ${relatedInitiatives.length.toLocaleString()}
                        </strong>

                    </div>


                    <div class="energy-drawer-metric">

                        <span>
                            States reached
                        </span>

                        <strong>
                            ${statesReached.size.toLocaleString()}
                        </strong>

                    </div>

                </div>

            </section>


            <section class="energy-drawer-section">

                <h3 class="energy-drawer-section-title">
                    Subsector coverage
                </h3>


                <div class="energy-drawer-tags">

                    ${
                        subsectors.length
                            ? subsectors
                                .map(
                                    subsector => `
                                        <span class="energy-drawer-tag">
                                            ${escapeEnergyHtml(
                                                subsector
                                            )}
                                        </span>
                                    `
                                )
                                .join('')
                            : `
                                <span class="energy-drawer-tag">
                                    No subsector activity recorded
                                </span>
                            `
                    }

                </div>

            </section>


            <section class="energy-drawer-section">

                <h3 class="energy-drawer-section-title">
                    Initiative participation
                </h3>


                <div class="energy-drawer-tags">

                    ${
                        relationships.length
                            ? relationships
                                .slice(0, 12)
                                .map(
                                    relationship => {

                                        const initiative =
                                            initiativeById[
                                                String(
                                                    relationship.initiative_id
                                                )
                                            ];


                                        const initiativeName =
                                            initiative
                                                ? (
                                                    initiative.initiative_name
                                                    || initiative.name
                                                    || relationship.initiative_id
                                                )
                                                : relationship.initiative_id;


                                        return `
                                            <span class="energy-drawer-tag">

                                                ${escapeEnergyHtml(
                                                    initiativeName
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
                                    No initiative relationships recorded
                                </span>
                            `
                    }

                </div>

            </section>

        `;


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
   CLOSE ACTOR DRAWER
========================================================== */

    function closeActorDrawer() {

        const drawer =
            document.getElementById(
                'actor-drawer'
            );


        const backdrop =
            document.getElementById(
                'actor-drawer-backdrop'
            );


        if (
            drawer
            && document.activeElement
            && drawer.contains(
                document.activeElement
            )
        ) {

            document.activeElement.blur();

        }


        if (drawer) {

            drawer.classList.remove(
                'active'
            );


            drawer.setAttribute(
                'aria-hidden',
                'true'
            );

        }


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
                    ACTORS / INSTITUTIONAL NETWORK
                    ==================================================
                    */

                    if (
                        tabName === 'actors'
                    ) {

                        setTimeout(
                            function () {

                                if (
                                    !window
                                        .INETTInstitutionalNetwork
                                ) {

                                    initInstitutionalNetwork();

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
   INIT ACTOR DRAWER
========================================================== */

    function initActorDrawer() {

        const actorRows =
            document.querySelectorAll(
                '.energy-actor-row'
            );


        const closeButton =
            document.getElementById(
                'actor-drawer-close'
            );


        const backdrop =
            document.getElementById(
                'actor-drawer-backdrop'
            );


        actorRows.forEach(
            row => {

                row.addEventListener(
                    'click',
                    function () {

                        openActorDrawer(
                            this.dataset.actorId
                        );

                    }
                );

            }
        );


        if (closeButton) {

            closeButton.addEventListener(
                'click',
                closeActorDrawer
            );

        }


        if (backdrop) {

            backdrop.addEventListener(
                'click',
                closeActorDrawer
            );

        }


        document.addEventListener(
            'keydown',
            function (event) {

                if (event.key === 'Escape') {

                    closeActorDrawer();

                }

            }
        );

    }

    /* ==========================================================
   INSTITUTIONAL NETWORK — D3
========================================================== */

    function initInstitutionalNetwork() {

        const container =
            document.getElementById(
                'actor-network'
            );


        if (
            !container
            || typeof d3 === 'undefined'
        ) {
            return;
        }


        /*
        ----------------------------------------------------------
        Clear previous network
        ----------------------------------------------------------
        */

        container.innerHTML = '';


        /*
        ----------------------------------------------------------
        Build lookup tables
        ----------------------------------------------------------
        */

        const functionsById = {};


        (data.functions || [])
            .forEach(
                func => {

                    functionsById[
                        String(
                            func.function_id
                        )
                    ] = func;

                }
            );


        /*
        ----------------------------------------------------------
        Nodes and links
        ----------------------------------------------------------
        */

        const nodeMap =
            new Map();


        const links = [];


        function addNode(
            id,
            type,
            label,
            raw
        ) {

            if (!nodeMap.has(id)) {

                nodeMap.set(
                    id,
                    {
                        id: id,
                        type: type,
                        label: label,
                        raw: raw || null
                    }
                );

            }

        }


        /*
        ----------------------------------------------------------
        Actor → Function
        ----------------------------------------------------------
        */

        (data.actor_functions || [])
            .forEach(
                relationship => {

                    const actorId =
                        String(
                            relationship.actor_id
                            || ''
                        );


                    const functionId =
                        String(
                            relationship.function_id
                            || ''
                        );


                    if (
                        !actorId
                        || !functionId
                    ) {
                        return;
                    }


                    const actor =
                        actorById[
                            actorId
                        ];


                    const func =
                        functionsById[
                            functionId
                        ];


                    const actorLabel =
                        actor
                            ? (
                                actor.acronym
                                || actor.organisation_name
                                || actorId
                            )
                            : actorId;


                    const functionLabel =
                        func
                            ? (
                                func.function_name
                                || functionId
                            )
                            : functionId;


                    addNode(
                        'actor:' + actorId,
                        'actor',
                        actorLabel,
                        actor
                    );


                    addNode(
                        'function:' + functionId,
                        'function',
                        functionLabel,
                        func
                    );


                    links.push({

                        source:
                            'actor:' + actorId,

                        target:
                            'function:' + functionId,

                        type:
                            'actor-function',

                        primacy:
                            relationship.primacy
                            || '',

                        policyId:
                            relationship.mandate_policy_id
                            || ''

                    });

                }
            );


        /*
        ----------------------------------------------------------
        Policy → Function
        ----------------------------------------------------------
        */

        (data.policy_scopes || [])
            .forEach(
                scope => {

                    const policyId =
                        String(
                            scope.policy_id
                            || ''
                        );


                    const functionId =
                        String(
                            scope.function_id
                            || ''
                        );


                    if (
                        !policyId
                        || !functionId
                    ) {
                        return;
                    }


                    const func =
                        functionsById[
                            functionId
                        ];


                    const policy =
                        policyById[
                            policyId
                        ];


                    const policyLabel =
                        policy
                            ? (
                                policy.short_name
                                || policy.instrument_name
                                || policyId
                            )
                            : policyId;


                    const functionLabel =
                        func
                            ? (
                                func.function_name
                                || functionId
                            )
                            : functionId;


                    addNode(
                        'policy:' + policyId,
                        'policy',
                        policyLabel,
                        policy
                    );


                    addNode(
                        'function:' + functionId,
                        'function',
                        functionLabel,
                        func
                    );


                    links.push({

                        source:
                            'policy:' + policyId,

                        target:
                            'function:' + functionId,

                        type:
                            'policy-function',

                        subsector:
                            scope.subsector
                            || ''

                    });

                }
            );


        const nodes =
            Array.from(
                nodeMap.values()
            );


        /*
        ----------------------------------------------------------
        Empty state
        ----------------------------------------------------------
        */

        if (!nodes.length) {

            container.innerHTML = `
                <div class="energy-visual-placeholder">
                    No institutional relationships available.
                </div>
            `;

            return;

        }


        /*
        ----------------------------------------------------------
        Dimensions
        ----------------------------------------------------------
        */

        const width =
            container.clientWidth
            || 1000;


        const height =
            container.clientHeight
            || 620;


        /*
        ----------------------------------------------------------
        SVG
        ----------------------------------------------------------
        */

        const svg =
            d3.select(
                container
            )
            .append(
                'svg'
            )
            .attr(
                'viewBox',
                `0 0 ${width} ${height}`
            );


        /*
        ----------------------------------------------------------
        Zoomable canvas
        ----------------------------------------------------------
        */

        const canvas =
            svg.append(
                'g'
            );


        svg.call(

            d3.zoom()
                .scaleExtent(
                    [0.5, 3]
                )
                .on(
                    'zoom',
                    event => {

                        canvas.attr(
                            'transform',
                            event.transform
                        );

                    }
                )

        );


        /*
        ----------------------------------------------------------
        Tooltip
        ----------------------------------------------------------
        */

        const tooltip =
            document.createElement(
                'div'
            );


        tooltip.className =
            'energy-network-tooltip';


        container.appendChild(
            tooltip
        );


        /*
        ----------------------------------------------------------
        Links
        ----------------------------------------------------------
        */

        const link =
            canvas
                .append(
                    'g'
                )
                .selectAll(
                    'line'
                )
                .data(
                    links
                )
                .join(
                    'line'
                )
                .attr(
                    'class',
                    d =>
                        d.type
                        === 'policy-function'
                            ? 'energy-network-link policy-link'
                            : 'energy-network-link'
                );


        /*
        ----------------------------------------------------------
        Nodes
        ----------------------------------------------------------
        */

        const node =
            canvas
                .append(
                    'g'
                )
                .selectAll(
                    'g'
                )
                .data(
                    nodes
                )
                .join(
                    'g'
                )
                .attr(
                    'class',
                    'energy-network-node'
                );


                /* ----------------------------------------------------------
   Node-type visibility filter
---------------------------------------------------------- */

        function updateNetworkTypeVisibility() {

            const actorToggle =
                document.getElementById(
                    'network-filter-actors'
                );


            const functionToggle =
                document.getElementById(
                    'network-filter-functions'
                );


            const policyToggle =
                document.getElementById(
                    'network-filter-policies'
                );


            const visibleTypes =
                new Set();


            if (
                !actorToggle
                || actorToggle.checked
            ) {
                visibleTypes.add(
                    'actor'
                );
            }


            if (
                !functionToggle
                || functionToggle.checked
            ) {
                visibleTypes.add(
                    'function'
                );
            }


            if (
                !policyToggle
                || policyToggle.checked
            ) {
                visibleTypes.add(
                    'policy'
                );
            }


            /*
            ----------------------------------------------------------
            Nodes
            ----------------------------------------------------------
            */

            node.style(
                'display',
                d =>
                    visibleTypes.has(
                        d.type
                    )
                        ? null
                        : 'none'
            );


            /*
            ----------------------------------------------------------
            Links

            Show a link only when BOTH connected node types
            are currently visible.
            ----------------------------------------------------------
            */

            link.style(
                'display',
                relationship => {

                    const source =
                        typeof relationship.source
                        === 'object'
                            ? relationship.source
                            : nodeMap.get(
                                relationship.source
                            );


                    const target =
                        typeof relationship.target
                        === 'object'
                            ? relationship.target
                            : nodeMap.get(
                                relationship.target
                            );


                    if (
                        !source
                        || !target
                    ) {
                        return 'none';
                    }


                    return (
                        visibleTypes.has(
                            source.type
                        )
                        &&
                        visibleTypes.has(
                            target.type
                        )
                    )
                        ? null
                        : 'none';

                }
            );

        }

        [
            'network-filter-actors',
            'network-filter-functions',
            'network-filter-policies'
        ]
        .forEach(
            id => {

                const control =
                    document.getElementById(
                        id
                    );


                if (!control) {
                    return;
                }


                control.addEventListener(
                    'change',
                    function () {

                        updateNetworkTypeVisibility();

                    }
                );

            }
        );

        updateNetworkTypeVisibility();

        const resetButton =
            document.getElementById(
                'network-reset-layout'
            );


        if (resetButton) {

            resetButton.addEventListener(
                'click',
                function () {

                    /*
                    Release every manually pinned node
                    */

                    nodes.forEach(
                        d => {

                            d.fx = null;
                            d.fy = null;

                        }
                    );


                    /*
                    Remove pinned visual state
                    */

                    node.classed(
                        'pinned',
                        false
                    );


                    /*
                    Restore all node-type filters
                    */

                    const actorToggle =
                        document.getElementById(
                            'network-filter-actors'
                        );

                    const functionToggle =
                        document.getElementById(
                            'network-filter-functions'
                        );

                    const policyToggle =
                        document.getElementById(
                            'network-filter-policies'
                        );


                    if (actorToggle) {
                        actorToggle.checked = true;
                    }

                    if (functionToggle) {
                        functionToggle.checked = true;
                    }

                    if (policyToggle) {
                        policyToggle.checked = true;
                    }


                    updateNetworkTypeVisibility();


                    /*
                    Restart force simulation
                    */

                    simulation
                        .alpha(0.8)
                        .restart();

                }
            );

        }


        /*
        ----------------------------------------------------------
        Node circles
        ----------------------------------------------------------
        */

        node.append(
            'circle'
        )
        .attr(
            'r',
            d => {

                if (
                    d.type === 'function'
                ) {
                    return 12;
                }


                if (
                    d.type === 'policy'
                ) {
                    return 8;
                }


                return 10;

            }
        )
        .attr(
            'fill',
            d => {

                if (
                    d.type === 'actor'
                ) {
                    return '#0f6e56';
                }


                if (
                    d.type === 'function'
                ) {
                    return '#d79d2a';
                }


                return '#64748b';

            }
        );


        /*
        ----------------------------------------------------------
        Labels
        ----------------------------------------------------------
        */

        node.append(
            'text'
        )
        .attr(
            'class',
            'energy-network-label'
        )
        .attr(
            'x',
            15
        )
        .attr(
            'y',
            4
        )
        .text(
            d => {

                const max =
                    d.type === 'function'
                        ? 28
                        : 20;


                if (
                    d.label.length
                    > max
                ) {

                    return (
                        d.label.slice(
                            0,
                            max
                        )
                        + '…'
                    );

                }


                return d.label;

            }
        );


        /*
        ----------------------------------------------------------
        Force simulation
        ----------------------------------------------------------
        */

        const simulation =
            d3.forceSimulation(
                nodes
            )
            .force(
                'link',

                d3.forceLink(
                    links
                )
                .id(
                    d => d.id
                )
                .distance(
                    d =>
                        d.type === 'actor-function'
                            ? 105
                            : 85
                )
                .strength(
                    0.45
                )
            )
            .force(
                'charge',

                d3.forceManyBody()
                    .strength(
                        -280
                    )
            )
            .force(
                'center',

                d3.forceCenter(
                    width / 2,
                    height / 2
                )
            )
            .force(
                'collision',

                d3.forceCollide()
                    .radius(
                        d =>
                            d.type === 'function'
                                ? 45
                                : 34
                    )
            );


        simulation.on(
            'tick',
            function () {

                link
                    .attr(
                        'x1',
                        d => d.source.x
                    )
                    .attr(
                        'y1',
                        d => d.source.y
                    )
                    .attr(
                        'x2',
                        d => d.target.x
                    )
                    .attr(
                        'y2',
                        d => d.target.y
                    );


                node.attr(
                    'transform',
                    d =>
                        `translate(${d.x},${d.y})`
                );

            }
        );


        /*
        ----------------------------------------------------------
        Drag
        ----------------------------------------------------------
        */

        /* ----------------------------------------------------------
   Drag — pin nodes where the user drops them
---------------------------------------------------------- */

        node.call(

            d3.drag()

                .on(
                    'start',
                    function (
                        event,
                        d
                    ) {

                        if (
                            !event.active
                        ) {

                            simulation
                                .alphaTarget(0.15)
                                .restart();

                        }


                        /*
                        Pin immediately at current position.
                        */

                        d.fx = d.x;
                        d.fy = d.y;

                    }
                )

                .on(
                    'drag',
                    function (
                        event,
                        d
                    ) {

                        /*
                        Move the pinned position with the pointer.
                        */

                        d.fx = event.x;
                        d.fy = event.y;

                    }
                )

                .on(
                    'end',
                    function (
                        event,
                        d
                    ) {

                        if (
                            !event.active
                        ) {

                            simulation
                                .alphaTarget(0);

                        }


                        /*
                        IMPORTANT:
                        Do NOT clear fx / fy here.

                        This means the node remains exactly
                        where the user dropped it.
                        */

                        d.fx = event.x;
                        d.fy = event.y;

                    }
                )

        );

        /* ----------------------------------------------------------
   Double-click node → release back into simulation
---------------------------------------------------------- */

        node.on(
            'dblclick',
            function (
                event,
                d
            ) {

                event.stopPropagation();


                /*
                Remove manual pin.
                */

                d.fx = null;
                d.fy = null;


                /*
                Give the network a little energy so
                the released node settles naturally.
                */

                simulation
                    .alpha(0.35)
                    .restart();

            }
        );

        /*
        ----------------------------------------------------------
        Connected-node highlighting
        ----------------------------------------------------------
        */

        function connectedIds(
            selectedNode
        ) {

            const ids =
                new Set(
                    [
                        selectedNode.id
                    ]
                );


            links.forEach(
                relationship => {

                    const sourceId =
                        typeof relationship.source
                        === 'object'
                            ? relationship.source.id
                            : relationship.source;


                    const targetId =
                        typeof relationship.target
                        === 'object'
                            ? relationship.target.id
                            : relationship.target;


                    if (
                        sourceId
                        === selectedNode.id
                    ) {

                        ids.add(
                            targetId
                        );

                    }


                    if (
                        targetId
                        === selectedNode.id
                    ) {

                        ids.add(
                            sourceId
                        );

                    }

                }
            );


            return ids;

        }


        /*
        ----------------------------------------------------------
        Hover
        ----------------------------------------------------------
        */

        node.on(
            'mouseenter',
            function (
                event,
                d
            ) {

                const connected =
                    connectedIds(
                        d
                    );


                node
                    .classed(
                        'dimmed',
                        item =>
                            !connected.has(
                                item.id
                            )
                    )
                    .classed(
                        'highlighted',
                        item =>
                            item.id
                            === d.id
                    );


                link.classed(
                    'dimmed',
                    relationship => {

                        const sourceId =
                            relationship
                                .source.id;


                        const targetId =
                            relationship
                                .target.id;


                        return (
                            sourceId !== d.id
                            && targetId !== d.id
                        );

                    }
                );


                                /*
                ----------------------------------------------------------
                Build richer tooltip content
                ----------------------------------------------------------
                */

                const connectedLinks =
                    links.filter(
                        relationship => {

                            const sourceId =
                                typeof relationship.source === 'object'
                                    ? relationship.source.id
                                    : relationship.source;

                            const targetId =
                                typeof relationship.target === 'object'
                                    ? relationship.target.id
                                    : relationship.target;

                            return (
                                sourceId === d.id
                                || targetId === d.id
                            );

                        }
                    );


                let tooltipContent = '';


                /*
                ----------------------------------------------------------
                ACTOR TOOLTIP
                ----------------------------------------------------------
                */

                if (d.type === 'actor') {

                    const actor =
                        d.raw || {};


                    const primaryFunctions =
                        connectedLinks.filter(
                            relationship =>
                                relationship.type === 'actor-function'
                                && String(
                                    relationship.primacy
                                    || ''
                                ).toLowerCase() === 'primary'
                        ).length;


                    tooltipContent = `

                        <div class="energy-network-tooltip-type">
                            Institution
                        </div>

                        <strong class="energy-network-tooltip-title">
                            ${escapeEnergyHtml(d.label)}
                        </strong>

                        ${
                            actor.organisation_name
                            && actor.organisation_name !== d.label
                                ? `
                                    <div class="energy-network-tooltip-subtitle">
                                        ${escapeEnergyHtml(
                                            actor.organisation_name
                                        )}
                                    </div>
                                `
                                : ''
                        }

                        <div class="energy-network-tooltip-grid">

                            <div>
                                <span>Actor type</span>

                                <strong>
                                    ${escapeEnergyHtml(
                                        actor.actor_type
                                        || '—'
                                    )}
                                </strong>
                            </div>

                            <div>
                                <span>Primary role</span>

                                <strong>
                                    ${escapeEnergyHtml(
                                        actor.primary_role
                                        || '—'
                                    )}
                                </strong>
                            </div>

                            <div>
                                <span>Mapped functions</span>

                                <strong>
                                    ${connectedLinks.length}
                                </strong>
                            </div>

                            <div>
                                <span>Primary mandates</span>

                                <strong>
                                    ${primaryFunctions}
                                </strong>
                            </div>

                        </div>

                        ${
                            actor.subsector_focus
                                ? `
                                    <div class="energy-network-tooltip-detail">

                                        <span>
                                            Subsector focus
                                        </span>

                                        <strong>
                                            ${escapeEnergyHtml(
                                                actor.subsector_focus
                                            )}
                                        </strong>

                                    </div>
                                `
                                : ''
                        }

                        <div class="energy-network-tooltip-hint">
                            Click to open actor profile
                        </div>

                    `;

                }


                /*
                ----------------------------------------------------------
                FUNCTION TOOLTIP
                ----------------------------------------------------------
                */

                else if (d.type === 'function') {

                    const func =
                        d.raw || {};


                    const actorLinks =
                        connectedLinks.filter(
                            relationship =>
                                relationship.type
                                === 'actor-function'
                        );


                    const policyLinks =
                        connectedLinks.filter(
                            relationship =>
                                relationship.type
                                === 'policy-function'
                        );


                    const primaryActors =
                        actorLinks.filter(
                            relationship =>
                                String(
                                    relationship.primacy
                                    || ''
                                ).toLowerCase() === 'primary'
                        ).length;


                    tooltipContent = `

                        <div class="energy-network-tooltip-type">
                            Energy-system function
                        </div>

                        <strong class="energy-network-tooltip-title">
                            ${escapeEnergyHtml(d.label)}
                        </strong>

                        <div class="energy-network-tooltip-grid">

                            <div>
                                <span>Subsector</span>

                                <strong>
                                    ${escapeEnergyHtml(
                                        func.primary_subsector
                                        || '—'
                                    )}
                                </strong>
                            </div>

                            <div>
                                <span>Value chain</span>

                                <strong>
                                    ${escapeEnergyHtml(
                                        func.typical_value_chain_segment
                                        || '—'
                                    )}
                                </strong>
                            </div>

                            <div>
                                <span>Institutions</span>

                                <strong>
                                    ${actorLinks.length}
                                </strong>
                            </div>

                            <div>
                                <span>Policies</span>

                                <strong>
                                    ${policyLinks.length}
                                </strong>
                            </div>

                        </div>

                        <div class="energy-network-tooltip-detail">

                            <span>
                                Primary mandate holders
                            </span>

                            <strong>
                                ${primaryActors}
                            </strong>

                        </div>

                        ${
                            func.contestation_note
                                ? `
                                    <div class="energy-network-tooltip-note">

                                        <span>
                                            Governance note
                                        </span>

                                        <p>
                                            ${escapeEnergyHtml(
                                                func.contestation_note
                                            )}
                                        </p>

                                    </div>
                                `
                                : ''
                        }

                    `;

                }


                /*
                ----------------------------------------------------------
                POLICY TOOLTIP
                ----------------------------------------------------------
                */

                else {

                    const policy =
                        d.raw || {};


                    const functionLinks =
                        connectedLinks.filter(
                            relationship =>
                                relationship.type
                                === 'policy-function'
                        );


                    const subsectors =
                        [
                            ...new Set(
                                functionLinks
                                    .map(
                                        relationship =>
                                            relationship.subsector
                                    )
                                    .filter(Boolean)
                            )
                        ];


                    tooltipContent = `

                        <div class="energy-network-tooltip-type">
                            Policy / framework
                        </div>

                        <strong class="energy-network-tooltip-title">
                            ${escapeEnergyHtml(d.label)}
                        </strong>

                        ${
                            policy.instrument_name
                            && policy.instrument_name !== d.label
                                ? `
                                    <div class="energy-network-tooltip-subtitle">
                                        ${escapeEnergyHtml(
                                            policy.instrument_name
                                        )}
                                    </div>
                                `
                                : ''
                        }

                        <div class="energy-network-tooltip-grid">

                            <div>
                                <span>Type</span>

                                <strong>
                                    ${escapeEnergyHtml(
                                        policy.instrument_type
                                        || '—'
                                    )}
                                </strong>
                            </div>

                            <div>
                                <span>Status</span>

                                <strong>
                                    ${escapeEnergyHtml(
                                        policy.status
                                        || '—'
                                    )}
                                </strong>
                            </div>

                            <div>
                                <span>Year</span>

                                <strong>
                                    ${escapeEnergyHtml(
                                        policy.publication_year
                                        || '—'
                                    )}
                                </strong>
                            </div>

                            <div>
                                <span>Functions covered</span>

                                <strong>
                                    ${functionLinks.length}
                                </strong>
                            </div>

                        </div>

                        ${
                            subsectors.length
                                ? `
                                    <div class="energy-network-tooltip-detail">

                                        <span>
                                            Network subsectors
                                        </span>

                                        <strong>
                                            ${escapeEnergyHtml(
                                                subsectors.join(', ')
                                            )}
                                        </strong>

                                    </div>
                                `
                                : ''
                        }

                    `;

                }


                tooltip.innerHTML =
                    tooltipContent;


                tooltip.style.left =
                    (
                        event.offsetX
                        + 15
                    )
                    + 'px';


                tooltip.style.top =
                    (
                        event.offsetY
                        + 15
                    )
                    + 'px';


                tooltip.classList.add(
                    'visible'
                );

            }
        );


        node.on(
            'mouseleave',
            function () {

                node
                    .classed(
                        'dimmed',
                        false
                    )
                    .classed(
                        'highlighted',
                        false
                    );


                link.classed(
                    'dimmed',
                    false
                );


                tooltip.classList.remove(
                    'visible'
                );

            }
        );


        /*
        ----------------------------------------------------------
        Click actor → open Actor Drawer
        ----------------------------------------------------------
        */

        node.on(
            'click',
            function (
                event,
                d
            ) {

                event.stopPropagation();


                if (
                    d.type !== 'actor'
                ) {
                    return;
                }


                const actorId =
                    d.id.replace(
                        'actor:',
                        ''
                    );


                if (
                    typeof openActorDrawer
                    === 'function'
                ) {

                    openActorDrawer(
                        actorId
                    );

                }

            }
        );


        /*
        ----------------------------------------------------------
        Legend
        ----------------------------------------------------------
        */

        const legend =
            document.createElement(
                'div'
            );


        legend.className =
            'energy-network-legend';


        legend.innerHTML = `

            <span class="energy-network-legend-item">

                <span
                    class="
                        energy-network-legend-dot
                        actor
                    "
                ></span>

                Actor

            </span>


            <span class="energy-network-legend-item">

                <span
                    class="
                        energy-network-legend-dot
                        function
                    "
                ></span>

                Function

            </span>


            <span class="energy-network-legend-item">

                <span
                    class="
                        energy-network-legend-dot
                        policy
                    "
                ></span>

                Policy

            </span>

        `;


        container
            .parentElement
            .appendChild(
                legend
            );


        /*
        ----------------------------------------------------------
        Store network references
        ----------------------------------------------------------
        */

        window.INETTInstitutionalNetwork = {

            simulation:
                simulation,

            svg:
                svg,

            nodes:
                nodes,

            links:
                links

        };

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

                                /*
                Actor intelligence
                */

                updateActorActivityChart(
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

        initMandatePagination();

        initActorDrawer();


        /*
        Connect Overview to filters
        */

        initOverviewFilterUpdates();

        initInitiativeExplorer();

    }
);


})();