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


        let rows =
            aggregateInitiativesBySubsector(
                initiatives
            );


        /*
        ----------------------------------------------------------
        If subsector filters are active, only display the
        subsectors explicitly selected by the user.

        An initiative may enter the filtered dataset because one
        of its related subsectors matches. That should not cause
        its different primary subsector to appear as an
        unselected chart category.
        ----------------------------------------------------------
        */

        const selectedSubsectors =
            new Set(
                (energyFilterState.subsectors || [])
                    .map(
                        normalizeFilterValue
                    )
                    .filter(Boolean)
            );


        if (selectedSubsectors.size) {

            rows =
                rows.filter(
                    row =>
                        selectedSubsectors.has(
                            normalizeFilterValue(
                                row.subsector
                            )
                        )
                );

        }


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

        const selectedStates =
            new Set(
                (energyFilterState.states || [])
                    .map(
                        normalizeFilterValue
                    )
                    .filter(Boolean)
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
                    selectedStates.has(
                        normalizeFilterValue(
                            stateCode
                        )
                    );


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

                /*
                Actor directory
                */

                actorDirectoryInitiatives =
                    initiatives;


                actorDirectoryPage =
                    1;


                renderActorDirectory();

                initiativeExplorerPage = 1;

                renderInitiativeExplorer(
                    initiatives
                );

                updateFinanceKpis(
                    initiatives
                );

                updateFinanceSubsectorChart(
                    initiatives
                );

                updateFinanceFlowChart(
                    initiatives
                );

            }
        );

    }


