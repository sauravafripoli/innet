    function updateFinanceKpis(
        initiatives
    ) {

        const records =
            getFilteredFinanceRecords(
                initiatives
            );


        const eligibleRecords =
            records.filter(
                record =>
                    Number(
                        record.aggregation_eligible
                    ) === 1
            );


        const trackedFinance =
            eligibleRecords.reduce(
                (
                    total,
                    record
                ) =>
                    total
                    + Number(
                        record.amount_usd
                        || 0
                    ),
                0
            );


        const providers =
            new Set(
                records
                    .map(
                        record =>
                            String(
                                record.provider_actor_id
                                || ''
                            )
                    )
                    .filter(Boolean)
            );


        const recipients =
            new Set(
                records
                    .map(
                        record =>
                            String(
                                record.recipient_actor_id
                                || ''
                            )
                    )
                    .filter(Boolean)
            );


        const financeValueElement =
            document.getElementById(
                'finance-kpi-value'
            );


        const financeRecordsElement =
            document.getElementById(
                'finance-kpi-records'
            );


        const eligibleElement =
            document.getElementById(
                'finance-kpi-eligible'
            );


        const providersElement =
            document.getElementById(
                'finance-kpi-providers'
            );


        const recipientsElement =
            document.getElementById(
                'finance-kpi-recipients'
            );


        if (financeValueElement) {

            financeValueElement.textContent =
                formatMoney(
                    trackedFinance
                );

        }


        if (financeRecordsElement) {

            financeRecordsElement.textContent =
                records.length
                    .toLocaleString();

        }


        if (eligibleElement) {

            eligibleElement.textContent =
                eligibleRecords.length
                    .toLocaleString();

        }


        if (providersElement) {

            providersElement.textContent =
                providers.size
                    .toLocaleString();

        }


        if (recipientsElement) {

            recipientsElement.textContent =
                recipients.size
                    .toLocaleString();

        }

    }


    function getFilteredFinanceRecords(
        initiatives
    ) {

        const financeRecords =
            data.finance_records || [];


        initiatives =
            initiatives
            || getFilteredInitiatives();


        /*
        ----------------------------------------------------------
        Current globally filtered initiative IDs
        ----------------------------------------------------------
        */

        const initiativeIds =
            new Set(
                initiatives.map(
                    initiative =>
                        String(
                            initiative.initiative_id
                            || ''
                        )
                )
            );


        /*
        ----------------------------------------------------------
        If no global filters are active,
        return every finance record.
        ----------------------------------------------------------
        */

        const filtersActive =
            Boolean(
                (energyFilterState.states || []).length
                ||
                (energyFilterState.subsectors || []).length
                ||
                (energyFilterState.statuses || []).length
            );


        if (!filtersActive) {

            return financeRecords;

        }


        /*
        ----------------------------------------------------------
        When filters are active, finance follows its
        linked initiative.

        Records with no linked initiative cannot be reliably
        assigned to State / initiative Status filters.
        ----------------------------------------------------------
        */

        return financeRecords.filter(
            record => {

                const initiativeId =
                    String(
                        record.linked_initiative_id
                        || ''
                    );


                if (!initiativeId) {
                    return false;
                }


                return initiativeIds.has(
                    initiativeId
                );

            }
        );

    }

    function updateFinanceSubsectorChart(
        initiatives
    ) {

        const chart =
            window.INETTFinanceSubsectorChart;


        if (!chart) {
            return;
        }


        const records =
            getFilteredFinanceRecords(
                initiatives
            );


        /*
        ----------------------------------------------------------
        Only aggregation-eligible finance belongs in totals
        ----------------------------------------------------------
        */

        const eligibleRecords =
            records.filter(
                record =>
                    Number(
                        record.aggregation_eligible
                    ) === 1
            );


        /*
        ----------------------------------------------------------
        Group USD by finance subsector
        ----------------------------------------------------------
        */

        const grouped = {};


        eligibleRecords.forEach(
            record => {

                const subsector =
                    String(
                        record.subsector
                        || 'Unspecified'
                    ).trim();


                if (!grouped[subsector]) {

                    grouped[subsector] = {

                        subsector:
                            subsector,

                        amount:
                            0,

                        records:
                            0

                    };

                }


                grouped[subsector].amount +=
                    Number(
                        record.amount_usd
                        || 0
                    );


                grouped[subsector].records++;

            }
        );


        let rows =
            Object.values(
                grouped
            )
            .sort(
                (a, b) =>
                    a.amount
                    - b.amount
            );


        /*
        ----------------------------------------------------------
        If subsector filters are active,
        only show explicitly selected subsectors
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


        /*
        ----------------------------------------------------------
        Calculate total eligible finance in current result
        ----------------------------------------------------------
        */

        const totalFinance =
            rows.reduce(
                (
                    total,
                    row
                ) =>
                    total
                    + Number(
                        row.amount || 0
                    ),
                0
            );


        /*
        ----------------------------------------------------------
        Add percentage share to each subsector
        ----------------------------------------------------------
        */

        rows.forEach(
            row => {

                row.percent =
                    totalFinance > 0
                        ? (
                            row.amount
                            / totalFinance
                        ) * 100
                        : 0;

            }
        );


        /*
        ----------------------------------------------------------
        Empty state
        ----------------------------------------------------------
        */

        if (!rows.length) {

            chart.clear();


            chart.setOption({

                title: {

                    text:
                        'No eligible finance matches these filters',

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
        ----------------------------------------------------------
        Render chart
        ----------------------------------------------------------
        */

        chart.clear();


        chart.setOption({

            animationDuration:
                350,


            tooltip: {

                trigger:
                    'axis',

                axisPointer: {

                    type:
                        'shadow'

                },

                formatter:
                    function (
                        params
                    ) {

                        const row =
                            rows[
                                params[0]
                                    .dataIndex
                            ];


                        return `
                            <strong>
                                ${escapeEnergyHtml(
                                    row.subsector
                                )}
                            </strong>

                            <br><br>

                            Finance:
                            <strong>
                                ${formatMoney(
                                    row.amount
                                )}
                            </strong>

                            <br>

                            Share of eligible finance:
                            <strong>
                                ${row.percent.toFixed(1)}%
                            </strong>

                            <br>

                            Eligible records:
                            <strong>
                                ${row.records.toLocaleString()}
                            </strong>
                        `;

                    }

            },


            grid: {

                left:
                    20,

                right:
                    190,

                top:
                    20,

                bottom:
                    20,

                containLabel:
                    true

            },


            xAxis: {

                type:
                    'value',

                axisLine: {

                    show:
                        false

                },

                axisTick: {

                    show:
                        false

                },

                splitLine: {

                    lineStyle: {

                        color:
                            '#edf0ee'

                    }

                },

                axisLabel: {

                    formatter:
                        function (
                            value
                        ) {

                            return formatMoney(
                                value
                            );

                        }

                }

            },


            yAxis: {

                type:
                    'category',

                data:
                    rows.map(
                        row =>
                            row.subsector
                    ),

                axisLine: {

                    show:
                        false

                },

                axisTick: {

                    show:
                        false

                },

                axisLabel: {

                    color:
                        '#39413d',

                    fontSize:
                        12

                }

            },


            series: [

                {

                    name:
                        'Eligible finance',

                    type:
                        'bar',

                    data:
                        rows.map(
                            row =>
                                row.amount
                        ),

                    barWidth:
                        22,

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

                        distance:
                            10,

                        formatter:
                            function (
                                params
                            ) {

                                const row =
                                    rows[
                                        params.dataIndex
                                    ];


                                return (
                                    formatMoney(
                                        row.amount
                                    )
                                    + '\n'
                                    + row.percent.toFixed(1)
                                    + '% · '
                                    + row.records
                                    + (
                                        row.records === 1
                                            ? ' eligible record'
                                            : ' eligible records'
                                    )
                                );

                            },

                        color:
                            '#39413d',

                        fontSize:
                            11,

                        lineHeight:
                            17,

                        fontWeight:
                            600

                    }

                }

            ]

        });

    }

    function initFinanceSubsectorChart() {

        const element =
            document.getElementById(
                'finance-subsector-chart'
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


        window.INETTFinanceSubsectorChart =
            chart;


        updateFinanceSubsectorChart(
            getFilteredInitiatives()
        );


        window.addEventListener(
            'resize',
            function () {

                chart.resize();

            }
        );

    }

    function updateFinanceFlowChart(
        initiatives
    ) {

        const chart =
            window.INETTFinanceFlowChart;


        if (!chart) {
            return;
        }


        /*
        ----------------------------------------------------------
        Eligible finance only
        ----------------------------------------------------------
        */

        const records =
            getFilteredFinanceRecords(
                initiatives
            )
            .filter(
                record =>
                    Number(
                        record.aggregation_eligible
                    ) === 1
                    &&
                    Number(
                        record.amount_usd
                    ) > 0
            );


        const nodes =
            new Map();


        const links =
            new Map();


        /*
        ----------------------------------------------------------
        Statistics for richer node tooltips
        ----------------------------------------------------------
        */

        const providerStats = {};
        const recipientStats = {};
        const initiativeStats = {};


        /*
        ----------------------------------------------------------
        Add node
        ----------------------------------------------------------
        */

        function addNode(
            id,
            name,
            type,
            entityId
        ) {

            if (!id) {
                return;
            }


            if (nodes.has(id)) {
                return;
            }


            let color =
                '#7564a8';


            if (type === 'Provider') {

                color =
                    '#0f6e56';

            } else if (type === 'Recipient') {

                color =
                    '#3e7f96';

            }


            nodes.set(
                id,
                {

                    name:
                        id,

                    displayName:
                        name,

                    nodeType:
                        type,

                    entityId:
                        entityId || '',

                    itemStyle: {

                        color:
                            color,

                        borderColor:
                            '#ffffff',

                        borderWidth:
                            1

                    }

                }
            );

        }


        /*
        ----------------------------------------------------------
        Add finance link

        actualValue = true USD amount
        value       = later converted to visual scale
        ----------------------------------------------------------
        */

        function addLink(
            source,
            target,
            value
        ) {

            if (
                !source
                ||
                !target
                ||
                !value
            ) {
                return;
            }


            const key =
                source
                + '|||'
                + target;


            if (!links.has(key)) {

                links.set(
                    key,
                    {

                        source:
                            source,

                        target:
                            target,

                        actualValue:
                            0,

                        value:
                            0

                    }
                );

            }


            links.get(
                key
            ).actualValue +=
                Number(
                    value
                );

        }


        /*
        ----------------------------------------------------------
        Build network
        ----------------------------------------------------------
        */

        records.forEach(
            record => {

                const amount =
                    Number(
                        record.amount_usd
                        || 0
                    );


                const providerActorId =
                    String(
                        record.provider_actor_id
                        || ''
                    );


                const recipientActorId =
                    String(
                        record.recipient_actor_id
                        || ''
                    );


                const linkedInitiativeId =
                    String(
                        record.linked_initiative_id
                        || ''
                    );


                const providerId =
                    'provider:'
                    + (
                        providerActorId
                        || 'unknown'
                    );


                const recipientId =
                    'recipient:'
                    + (
                        recipientActorId
                        || 'unknown'
                    );


                const initiativeId =
                    'initiative:'
                    + (
                        linkedInitiativeId
                        || record.finance_id
                    );


                const providerName =
                    record.provider_acronym
                    || record.provider_name
                    || 'Unspecified provider';


                const recipientName =
                    record.recipient_acronym
                    || record.recipient_name
                    || 'Unspecified recipient';


                const initiativeName =
                    record.initiative_name
                    || linkedInitiativeId
                    || 'Unlinked finance';


                /*
                --------------------------------------------------
                Provider statistics
                --------------------------------------------------
                */

                if (!providerStats[providerId]) {

                    providerStats[providerId] = {

                        total:
                            0,

                        recipients:
                            new Set(),

                        records:
                            0

                    };

                }


                providerStats[
                    providerId
                ].total +=
                    amount;


                providerStats[
                    providerId
                ].recipients.add(
                    recipientId
                );


                providerStats[
                    providerId
                ].records++;


                /*
                --------------------------------------------------
                Recipient statistics
                --------------------------------------------------
                */

                if (!recipientStats[recipientId]) {

                    recipientStats[recipientId] = {

                        total:
                            0,

                        providers:
                            new Set(),

                        initiatives:
                            new Set(),

                        records:
                            0

                    };

                }


                recipientStats[
                    recipientId
                ].total +=
                    amount;


                recipientStats[
                    recipientId
                ].providers.add(
                    providerId
                );


                recipientStats[
                    recipientId
                ].initiatives.add(
                    initiativeId
                );


                recipientStats[
                    recipientId
                ].records++;


                /*
                --------------------------------------------------
                Initiative statistics
                --------------------------------------------------
                */

                if (!initiativeStats[initiativeId]) {

                    initiativeStats[initiativeId] = {

                        total:
                            0,

                        providers:
                            new Set(),

                        recipients:
                            new Set(),

                        records:
                            0

                    };

                }


                initiativeStats[
                    initiativeId
                ].total +=
                    amount;


                initiativeStats[
                    initiativeId
                ].providers.add(
                    providerId
                );


                initiativeStats[
                    initiativeId
                ].recipients.add(
                    recipientId
                );


                initiativeStats[
                    initiativeId
                ].records++;


                /*
                --------------------------------------------------
                Nodes
                --------------------------------------------------
                */

                addNode(
                    providerId,
                    providerName,
                    'Provider',
                    providerActorId
                );


                addNode(
                    recipientId,
                    recipientName,
                    'Recipient',
                    recipientActorId
                );


                addNode(
                    initiativeId,
                    initiativeName,
                    'Initiative',
                    linkedInitiativeId
                );


                /*
                --------------------------------------------------
                Links
                --------------------------------------------------
                */

                addLink(
                    providerId,
                    recipientId,
                    amount
                );


                addLink(
                    recipientId,
                    initiativeId,
                    amount
                );

            }
        );


        const nodeData =
            [...nodes.values()];


        const linkData =
            [...links.values()];


        /*
        ----------------------------------------------------------
        Compressed visual scale

        Real USD remains in actualValue.
        ----------------------------------------------------------
        */

        linkData.forEach(
            link => {

                link.value =
                    Math.sqrt(
                        link.actualValue
                        / 1000000
                    );

            }
        );


        /*
        ----------------------------------------------------------
        Empty state
        ----------------------------------------------------------
        */

        chart.clear();


        if (!linkData.length) {

            chart.setOption({

                title: {

                    text:
                        'No eligible finance flows match these filters',

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
        ----------------------------------------------------------
        Render
        ----------------------------------------------------------
        */

        chart.setOption({

            animationDuration:
                400,


            /*
            ------------------------------------------------------
            Column headings
            ------------------------------------------------------
            */

            graphic: [

                {

                    type:
                        'text',

                    left:
                        45,

                    top:
                        7,

                    style: {

                        text:
                            'PROVIDERS',

                        fontSize:
                            11,

                        fontWeight:
                            700,

                        fill:
                            '#53615a'

                    }

                },


                {

                    type:
                        'text',

                    left:
                        '47%',

                    top:
                        7,

                    style: {

                        text:
                            'RECIPIENTS',

                        fontSize:
                            11,

                        fontWeight:
                            700,

                        fill:
                            '#53615a'

                    }

                },


                {

                    type:
                        'text',

                    right:
                        95,

                    top:
                        7,

                    style: {

                        text:
                            'INITIATIVES',

                        fontSize:
                            11,

                        fontWeight:
                            700,

                        fill:
                            '#53615a'

                    }

                }

            ],


            /*
            ------------------------------------------------------
            Tooltip
            ------------------------------------------------------
            */

            tooltip: {

                trigger:
                    'item',

                confine:
                    true,

                formatter:
                    function (
                        params
                    ) {

                        /*
                        ------------------------------------------
                        Flow tooltip
                        ------------------------------------------
                        */

                        if (
                            params.dataType
                            === 'edge'
                        ) {

                            const sourceNode =
                                nodes.get(
                                    params.data.source
                                );


                            const targetNode =
                                nodes.get(
                                    params.data.target
                                );


                            return `
                                <strong>
                                    Finance flow
                                </strong>

                                <br><br>

                                ${
                                    escapeEnergyHtml(
                                        sourceNode
                                            ?.displayName
                                        || params.data.source
                                    )
                                }

                                &nbsp;→&nbsp;

                                ${
                                    escapeEnergyHtml(
                                        targetNode
                                            ?.displayName
                                        || params.data.target
                                    )
                                }

                                <br><br>

                                <strong>
                                    ${formatMoney(
                                        params.data.actualValue
                                    )}
                                </strong>

                                <br>

                                <span style="color:#78817c;">
                                    Aggregation-eligible finance
                                </span>
                            `;

                        }


                        /*
                        ------------------------------------------
                        Node tooltip
                        ------------------------------------------
                        */

                        const node =
                            params.data;


                        if (
                            node.nodeType
                            === 'Provider'
                        ) {

                            const stats =
                                providerStats[
                                    node.name
                                ];


                            return `
                                <strong>
                                    ${escapeEnergyHtml(
                                        node.displayName
                                    )}
                                </strong>

                                <br>

                                Provider

                                <br><br>

                                Finance supplied:
                                <strong>
                                    ${formatMoney(
                                        stats?.total || 0
                                    )}
                                </strong>

                                <br>

                                Recipients:
                                <strong>
                                    ${
                                        stats
                                            ?.recipients
                                            ?.size
                                        || 0
                                    }
                                </strong>

                                <br>

                                Finance records:
                                <strong>
                                    ${
                                        stats
                                            ?.records
                                        || 0
                                    }
                                </strong>

                                ${
                                    node.entityId
                                        ? `
                                            <br><br>
                                            <span style="color:#66716b;">
                                                Click to view actor profile
                                            </span>
                                        `
                                        : ''
                                }
                            `;

                        }


                        if (
                            node.nodeType
                            === 'Recipient'
                        ) {

                            const stats =
                                recipientStats[
                                    node.name
                                ];


                            return `
                                <strong>
                                    ${escapeEnergyHtml(
                                        node.displayName
                                    )}
                                </strong>

                                <br>

                                Recipient

                                <br><br>

                                Finance received:
                                <strong>
                                    ${formatMoney(
                                        stats?.total || 0
                                    )}
                                </strong>

                                <br>

                                Providers:
                                <strong>
                                    ${
                                        stats
                                            ?.providers
                                            ?.size
                                        || 0
                                    }
                                </strong>

                                <br>

                                Linked initiatives:
                                <strong>
                                    ${
                                        stats
                                            ?.initiatives
                                            ?.size
                                        || 0
                                    }
                                </strong>

                                ${
                                    node.entityId
                                        ? `
                                            <br><br>
                                            <span style="color:#66716b;">
                                                Click to view actor profile
                                            </span>
                                        `
                                        : ''
                                }
                            `;

                        }


                        /*
                        ------------------------------------------
                        Initiative tooltip
                        ------------------------------------------
                        */

                        const stats =
                            initiativeStats[
                                node.name
                            ];


                        const initiative =
                            node.entityId
                                ? initiativeById[
                                    node.entityId
                                ]
                                : null;


                        return `
                            <strong>
                                ${escapeEnergyHtml(
                                    node.displayName
                                )}
                            </strong>

                            <br>

                            Initiative

                            <br><br>

                            Linked finance:
                            <strong>
                                ${formatMoney(
                                    stats?.total || 0
                                )}
                            </strong>

                            ${
                                initiative
                                    ?.primary_subsector
                                    ? `
                                        <br>

                                        Subsector:
                                        <strong>
                                            ${escapeEnergyHtml(
                                                initiative
                                                    .primary_subsector
                                            )}
                                        </strong>
                                    `
                                    : ''
                            }

                            ${
                                initiative
                                    ?.standard_status
                                    ? `
                                        <br>

                                        Status:
                                        <strong>
                                            ${escapeEnergyHtml(
                                                initiative
                                                    .standard_status
                                            )}
                                        </strong>
                                    `
                                    : ''
                            }

                            ${
                                node.entityId
                                    ? `
                                        <br><br>

                                        <span style="color:#66716b;">
                                            Click to view initiative profile
                                        </span>
                                    `
                                    : ''
                            }
                        `;

                    }

            },


            series: [

                {

                    type:
                        'sankey',

                    data:
                        nodeData,

                    links:
                        linkData,


                    left:
                        45,

                    right:
                        235,

                    top:
                        48,

                    bottom:
                        25,


                    nodeWidth:
                        18,

                    nodeGap:
                        19,


                    draggable:
                        true,


                    emphasis: {

                        focus:
                            'adjacency'

                    },


                    lineStyle: {

                        color:
                            'gradient',

                        curveness:
                            0.5,

                        opacity:
                            0.3

                    },


                    label: {

                        color:
                            '#34403a',

                        fontSize:
                            11,

                        lineHeight:
                            15,

                        distance:
                            9,

                        width:
                            205,

                        overflow:
                            'truncate',

                        ellipsis:
                            '…',

                        formatter:
                            function (
                                params
                            ) {

                                return (
                                    params.data
                                        .displayName
                                    || params.name
                                );

                            }

                    }

                }

            ]

        });


        /*
        ----------------------------------------------------------
        Click interactions

        Provider / recipient → Actor drawer
        Initiative           → Initiative drawer
        ----------------------------------------------------------
        */

        chart.off(
            'click'
        );


        chart.on(
            'click',
            function (
                params
            ) {

                if (
                    params.dataType
                    !== 'node'
                ) {
                    return;
                }


                const node =
                    params.data;


                if (
                    node.nodeType
                    === 'Initiative'
                    &&
                    node.entityId
                    &&
                    typeof openInitiativeDrawer
                        === 'function'
                ) {

                    openInitiativeDrawer(
                        node.entityId
                    );


                    return;

                }


                if (
                    (
                        node.nodeType
                        === 'Provider'
                        ||
                        node.nodeType
                        === 'Recipient'
                    )
                    &&
                    node.entityId
                    &&
                    typeof openActorDrawer
                        === 'function'
                ) {

                    openActorDrawer(
                        node.entityId
                    );

                }

            }
        );

    }

    function initFinanceFlowChart() {

        const element =
            document.getElementById(
                'finance-flow-chart'
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


        window.INETTFinanceFlowChart =
            chart;


        updateFinanceFlowChart(
            getFilteredInitiatives()
        );


        window.addEventListener(
            'resize',
            function () {

                chart.resize();

            }
        );

    }


