    let targetLibraryPage = 1;


    const targetLibraryPageSize = 10;

    let targetLibrarySearch = '';


/* ==========================================================
   TARGET KPIS
========================================================== */

    function getFilteredTargets() {

        let targets =
            data.all_targets
            || data.targets
            || [];


        const selectedSubsectors =
            new Set(
                (energyFilterState.subsectors || [])
                    .map(
                        normalizeFilterValue
                    )
                    .filter(Boolean)
            );


        if (selectedSubsectors.size) {

            targets =
                targets.filter(
                    target =>
                        selectedSubsectors.has(
                            normalizeFilterValue(
                                target.subsector
                            )
                        )
                );

        }


        return targets;

    }


    function updateTargetKpis() {

        const targets =
            getFilteredTargets();


        const observations =
            data.target_observations
            || [];


        const targetIds =
            new Set(
                targets.map(
                    target =>
                        String(
                            target.target_id
                            || ''
                        )
                )
            );


        const matchingObservations =
            observations.filter(
                observation =>
                    targetIds.has(
                        String(
                            observation.target_id
                            || ''
                        )
                    )
            );


        const observedTargetIds =
            new Set(
                matchingObservations.map(
                    observation =>
                        String(
                            observation.target_id
                        )
                )
            );


        const verifiedTargetIds =
            new Set(
                matchingObservations
                    .filter(
                        observation => {

                            const status =
                                normalizeFilterValue(
                                    observation.verification_status
                                );


                            return (
                                status === 'verified'
                                ||
                                status === 'partially verified'
                            );

                        }
                    )
                    .map(
                        observation =>
                            String(
                                observation.target_id
                            )
                    )
            );


        const totalElement =
            document.getElementById(
                'target-kpi-total'
            );


        const year2030Element =
            document.getElementById(
                'target-kpi-2030'
            );


        const observedElement =
            document.getElementById(
                'target-kpi-observed'
            );


        const verifiedElement =
            document.getElementById(
                'target-kpi-verified'
            );


        if (totalElement) {

            totalElement.textContent =
                targets.length
                    .toLocaleString();

        }


        if (year2030Element) {

            year2030Element.textContent =
                targets
                    .filter(
                        target =>
                            Number(
                                target.target_year
                            ) === 2030
                    )
                    .length
                    .toLocaleString();

        }


        if (observedElement) {

            observedElement.textContent =
                observedTargetIds.size
                    .toLocaleString();

        }


        if (verifiedElement) {

            verifiedElement.textContent =
                verifiedTargetIds.size
                    .toLocaleString();

        }

    }


/* ==========================================================
   TARGET TIMELINE
========================================================== */

    function initTargetTimelineChart() {

        const element =
            document.getElementById(
                'target-timeline-chart'
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


        window.INETTTargetTimelineChart =
            chart;


        updateTargetTimelineChart();


        window.addEventListener(
            'resize',
            function () {

                chart.resize();

            }
        );

    }


    function updateTargetTimelineChart() {

        const chart =
            window.INETTTargetTimelineChart;


        if (!chart) {
            return;
        }


        const targets =
            getFilteredTargets();


        const counts = {};


        targets.forEach(
            target => {

                const year =
                    Number(
                        target.target_year
                    );


                if (!year) {
                    return;
                }


                if (!counts[year]) {

                    counts[year] =
                        0;

                }


                counts[year]++;

            }
        );


        const rows =
            Object.entries(
                counts
            )
            .map(
                ([year, count]) => ({

                    year:
                        Number(
                            year
                        ),

                    count:
                        count

                })
            )
            .sort(
                (a, b) =>
                    a.year - b.year
            );


        chart.clear();


        if (!rows.length) {

            chart.setOption({

                title: {

                    text:
                        'No target milestones match these filters',

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
                                ${row.year}
                            </strong>

                            <br>

                            ${row.count.toLocaleString()}
                            ${
                                row.count === 1
                                    ? ' target'
                                    : ' targets'
                            }
                        `;

                    }

            },


            grid: {

                left:
                    20,

                right:
                    25,

                top:
                    20,

                bottom:
                    30,

                containLabel:
                    true

            },


            xAxis: {

                type:
                    'category',

                data:
                    rows.map(
                        row =>
                            row.year
                    ),

                axisLine: {

                    lineStyle: {

                        color:
                            '#dfe5e1'

                    }

                },

                axisTick: {

                    show:
                        false

                },

                axisLabel: {

                    color:
                        '#5f6863',

                    fontSize:
                        11

                }

            },


            yAxis: {

                type:
                    'value',

                minInterval:
                    1,

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

                }

            },


            series: [

                {

                    name:
                        'Targets',

                    type:
                        'bar',

                    data:
                        rows.map(
                            row =>
                                row.count
                        ),

                    barWidth:
                        28,

                    itemStyle: {

                        color:
                            '#0f6e56',

                        borderRadius:
                            [5, 5, 0, 0]

                    },

                    label: {

                        show:
                            true,

                        position:
                            'top',

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
   TARGETS BY SUBSECTOR
========================================================== */

    function initTargetSubsectorChart() {

        const element =
            document.getElementById(
                'target-subsector-chart'
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


        window.INETTTargetSubsectorChart =
            chart;


        updateTargetSubsectorChart();


        window.addEventListener(
            'resize',
            function () {

                chart.resize();

            }
        );

    }


    function updateTargetSubsectorChart() {

        const chart =
            window.INETTTargetSubsectorChart;


        if (!chart) {
            return;
        }


        const targets =
            getFilteredTargets();


        const counts = {};


        targets.forEach(
            target => {

                const subsector =
                    String(
                        target.subsector
                        || 'Unspecified'
                    ).trim();


                if (!counts[subsector]) {

                    counts[subsector] =
                        0;

                }


                counts[subsector]++;

            }
        );


        const rows =
            Object.entries(
                counts
            )
            .map(
                ([subsector, count]) => ({

                    subsector:
                        subsector,

                    count:
                        count

                })
            )
            .sort(
                (a, b) =>
                    b.count - a.count
            );


        chart.clear();


        if (!rows.length) {

            chart.setOption({

                title: {

                    text:
                        'No targets match these filters',

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
                                ${row.subsector}
                            </strong>

                            <br>

                            ${row.count.toLocaleString()}
                            ${
                                row.count === 1
                                    ? ' target'
                                    : ' targets'
                            }
                        `;

                    }

            },


            grid: {

                left:
                    20,

                right:
                    55,

                top:
                    10,

                bottom:
                    20,

                containLabel:
                    true

            },


            xAxis: {

                type:
                    'value',

                minInterval:
                    1,

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
                        '#69716d',

                    fontSize:
                        11

                },

                splitLine: {

                    lineStyle: {

                        color:
                            '#edf0ee'

                    }

                }

            },


            yAxis: {

                type:
                    'category',

                inverse:
                    true,

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
                        12,

                    margin:
                        14

                }

            },


            series: [

                {

                    name:
                        'Targets',

                    type:
                        'bar',

                    data:
                        rows.map(
                            row =>
                                row.count
                        ),

                    barWidth:
                        24,

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
                            700,

                        formatter:
                            function (
                                params
                            ) {

                                return params.value;

                            }

                    }

                }

            ]

        });

    }

    function updateTargetMonitoringCoverage() {

        const targets =
            getFilteredTargets();


        const observations =
            data.target_observations
            || [];


        const targetIds =
            new Set(
                targets.map(
                    target =>
                        String(
                            target.target_id
                            || ''
                        )
                )
            );


        const matchingObservations =
            observations.filter(
                observation =>
                    targetIds.has(
                        String(
                            observation.target_id
                            || ''
                        )
                    )
            );


        const observedIds =
            new Set(
                matchingObservations.map(
                    observation =>
                        String(
                            observation.target_id
                        )
                )
            );


        const verifiedIds =
            new Set();


        const unverifiedIds =
            new Set();


        matchingObservations.forEach(
            observation => {

                const targetId =
                    String(
                        observation.target_id
                        || ''
                    );


                const status =
                    normalizeFilterValue(
                        observation.verification_status
                    );


                if (
                    status === 'verified'
                    ||
                    status === 'partially verified'
                ) {

                    verifiedIds.add(
                        targetId
                    );

                } else {

                    unverifiedIds.add(
                        targetId
                    );

                }

            }
        );


        const total =
            targets.length;


        const observed =
            observedIds.size;


        const unobserved =
            Math.max(
                0,
                total - observed
            );


        const percentage =
            total
                ? (
                    observed
                    / total
                    * 100
                )
                : 0;


        const observedElement =
            document.getElementById(
                'target-monitoring-observed'
            );


        const unobservedElement =
            document.getElementById(
                'target-monitoring-unobserved'
            );


        const percentElement =
            document.getElementById(
                'target-monitoring-percent'
            );


        const progressBar =
            document.getElementById(
                'target-monitoring-progress-bar'
            );


        const verifiedElement =
            document.getElementById(
                'target-monitoring-verified'
            );


        const unverifiedElement =
            document.getElementById(
                'target-monitoring-unverified'
            );


        if (observedElement) {
            observedElement.textContent = observed;
        }


        if (unobservedElement) {
            unobservedElement.textContent = unobserved;
        }


        if (percentElement) {

            percentElement.textContent =
                percentage.toFixed(1)
                + '%';

        }


        if (progressBar) {

            progressBar.style.width =
                percentage
                + '%';

        }


        if (verifiedElement) {
            verifiedElement.textContent = verifiedIds.size;
        }


        if (unverifiedElement) {
            unverifiedElement.textContent = unverifiedIds.size;
        }

    }

    /* ==========================================================
        TARGET LIBRARY
    ========================================================== */

    function renderTargetLibrary() {

        const body =
            document.getElementById(
                'target-library-body'
            );


        const count =
            document.getElementById(
                'target-library-count'
            );


        const pageInfo =
            document.getElementById(
                'target-library-page-info'
            );


        const previousButton =
            document.getElementById(
                'target-library-prev'
            );


        const nextButton =
            document.getElementById(
                'target-library-next'
            );


        if (!body) {
            return;
        }


        let targets =
            getFilteredTargets();


        const search =
            normalizeFilterValue(
                targetLibrarySearch
            );


        if (search) {

            targets =
                targets.filter(
                    target => {

                        const haystack =
                            [
                                target.target_id,
                                target.target_statement,
                                target.framework,
                                target.subsector,
                                target.indicator,
                                target.unit,
                                target.conditionality,
                                target.target_year
                            ]
                            .filter(Boolean)
                            .join(' ')
                            .toLowerCase();


                        return haystack.includes(
                            search
                        );

                    }
                );

        }


        targets =
            [...targets]
                .sort(
                    (a, b) => {

                        const yearDifference =
                            Number(
                                a.target_year || 9999
                            )
                            -
                            Number(
                                b.target_year || 9999
                            );


                        if (yearDifference !== 0) {
                            return yearDifference;
                        }


                        return String(
                            a.target_statement
                            || ''
                        )
                        .localeCompare(
                            String(
                                b.target_statement
                                || ''
                            )
                        );

                    }
                );


        const totalRows =
            targets.length;


        const totalPages =
            Math.max(
                1,
                Math.ceil(
                    totalRows
                    / targetLibraryPageSize
                )
            );


        if (
            targetLibraryPage
            > totalPages
        ) {

            targetLibraryPage =
                totalPages;

        }


        const startIndex =
            (
                targetLibraryPage
                - 1
            )
            * targetLibraryPageSize;


        const visibleTargets =
            targets.slice(
                startIndex,
                startIndex
                + targetLibraryPageSize
            );


        if (count) {

            count.textContent =
                totalRows.toLocaleString()
                + (
                    totalRows === 1
                        ? ' target'
                        : ' targets'
                );

        }


        if (!visibleTargets.length) {

            body.innerHTML = `

                <tr>

                    <td colspan="4">
                        No targets match the current filters.
                    </td>

                </tr>

            `;

        } else {

            body.innerHTML =
                visibleTargets
                    .map(
                        target => {

                            return `

                                <tr
                                    class="energy-target-row"
                                    data-target-id="${escapeEnergyHtml(
                                        target.target_id
                                    )}"
                                >

                                    <td>

                                        <strong>
                                            ${escapeEnergyHtml(
                                                target.target_statement
                                                || target.target_id
                                            )}
                                        </strong>

                                        <small>
                                            ${escapeEnergyHtml(
                                                target.indicator
                                                || ''
                                            )}
                                        </small>

                                    </td>


                                    <td>
                                        ${escapeEnergyHtml(
                                            target.framework
                                            || '—'
                                        )}
                                    </td>


                                    <td>
                                        ${escapeEnergyHtml(
                                            target.subsector
                                            || '—'
                                        )}
                                    </td>


                                    <td>
                                        ${escapeEnergyHtml(
                                            target.target_year
                                            || '—'
                                        )}
                                    </td>

                                </tr>

                            `;

                        }
                    )
                    .join('');

        }


        if (pageInfo) {

            pageInfo.textContent =
                totalRows
                    ? `Page ${targetLibraryPage} of ${totalPages}`
                    : 'Page 0 of 0';

        }


        if (previousButton) {

            previousButton.disabled =
                (
                    !totalRows
                    ||
                    targetLibraryPage <= 1
                );

        }


        if (nextButton) {

            nextButton.disabled =
                (
                    !totalRows
                    ||
                    targetLibraryPage >= totalPages
                );

        }

    }

    function initTargetLibrary() {

        const search =
            document.getElementById(
                'target-library-search'
            );


        const previousButton =
            document.getElementById(
                'target-library-prev'
            );


        const nextButton =
            document.getElementById(
                'target-library-next'
            );


        if (search) {

            search.addEventListener(
                'input',
                function () {

                    targetLibrarySearch =
                        this.value
                        || '';


                    targetLibraryPage =
                        1;


                    renderTargetLibrary();

                }
            );

        }


        if (previousButton) {

            previousButton.addEventListener(
                'click',
                function () {

                    if (
                        targetLibraryPage
                        <= 1
                    ) {
                        return;
                    }


                    targetLibraryPage--;


                    renderTargetLibrary();

                }
            );

        }


        if (nextButton) {

            nextButton.addEventListener(
                'click',
                function () {

                    targetLibraryPage++;


                    renderTargetLibrary();

                }
            );

        }

        const body =
            document.getElementById(
                'target-library-body'
            );


        if (body) {

            body.addEventListener(
                'click',
                function (event) {

                    const row =
                        event.target.closest(
                            '.energy-target-row'
                        );


                    if (!row) {
                        return;
                    }


                    openTargetDrawer(
                        row.dataset.targetId
                    );

                }
            );

        }

        renderTargetLibrary();

    }

    /* ==========================================================
    TARGET DRAWER EVENTS
    ========================================================== */

        function initTargetDrawer() {

            const closeButton =
                document.getElementById(
                    'target-drawer-close'
                );


            const backdrop =
                document.getElementById(
                    'target-drawer-backdrop'
                );


            if (closeButton) {

                closeButton.addEventListener(
                    'click',
                    closeTargetDrawer
                );

            }


            if (backdrop) {

                backdrop.addEventListener(
                    'click',
                    closeTargetDrawer
                );

            }

        }

/* ==========================================================
   TARGET PROFILE DRAWER
========================================================== */

    function openTargetDrawer(
        targetId
    ) {

        const drawer =
            document.getElementById(
                'target-drawer'
            );


        const backdrop =
            document.getElementById(
                'target-drawer-backdrop'
            );


        const title =
            document.getElementById(
                'target-drawer-title'
            );


        const idElement =
            document.getElementById(
                'target-drawer-id'
            );


        const content =
            document.getElementById(
                'target-drawer-content'
            );


        if (
            !drawer
            ||
            !backdrop
            ||
            !content
        ) {
            return;
        }


        const targets =
            data.all_targets
            || [];


        const target =
            targets.find(
                item =>
                    String(
                        item.target_id
                    )
                    ===
                    String(
                        targetId
                    )
            );


        if (!target) {
            return;
        }


        const observations =
            (
                data.target_observations
                || []
            )
            .filter(
                observation =>
                    String(
                        observation.target_id
                    )
                    ===
                    String(
                        target.target_id
                    )
            )
            .sort(
                (a, b) =>
                    String(
                        b.observation_date
                        || ''
                    )
                    .localeCompare(
                        String(
                            a.observation_date
                            || ''
                        )
                    )
            );


        const latestObservation =
            observations[0]
            || null;


        if (title) {

            title.textContent =
                target.target_statement
                || 'Target';

        }


        if (idElement) {

            idElement.textContent =
                target.target_id
                || '—';

        }


        const formatTargetValue =
            function (
                value,
                unit
            ) {

                if (
                    value === null
                    ||
                    value === undefined
                    ||
                    value === ''
                ) {
                    return '—';
                }


                return (
                    Number(value)
                        .toLocaleString()
                    +
                    (
                        unit
                            ? ' ' + unit
                            : ''
                    )
                );

            };


        const sourceLink =
            target.source_url
                ? `
                    <a
                        href="${escapeEnergyHtml(
                            target.source_url
                        )}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="energy-drawer-source-link"
                    >
                        View source ↗
                    </a>
                `
                : '';


        content.innerHTML = `

            <section class="energy-target-profile-summary">

                <div class="energy-target-profile-tags">

                    ${
                        target.subsector
                            ? `
                                <span class="energy-target-tag">
                                    ${escapeEnergyHtml(
                                        target.subsector
                                    )}
                                </span>
                            `
                            : ''
                    }

                    ${
                        target.framework
                            ? `
                                <span class="energy-target-tag">
                                    ${escapeEnergyHtml(
                                        target.framework
                                    )}
                                </span>
                            `
                            : ''
                    }

                    ${
                        target.target_year
                            ? `
                                <span class="energy-target-tag is-year">
                                    ${escapeEnergyHtml(
                                        target.target_year
                                    )}
                                </span>
                            `
                            : ''
                    }

                </div>


                ${
                    target.indicator
                        ? `
                            <div class="energy-target-profile-block">

                                <span class="energy-target-profile-label">
                                    Indicator
                                </span>

                                <p>
                                    ${escapeEnergyHtml(
                                        target.indicator
                                    )}
                                </p>

                            </div>
                        `
                        : ''
                }

            </section>


            <section class="energy-target-profile-section">

                <h3>
                    Target
                </h3>


                <div class="energy-target-value-grid">

                    <div>

                        <span>
                            Baseline
                        </span>

                        <strong>
                            ${formatTargetValue(
                                target.baseline_value,
                                target.unit
                            )}
                        </strong>

                        ${
                            target.baseline_year
                                ? `
                                    <small>
                                        ${escapeEnergyHtml(
                                            target.baseline_year
                                        )}
                                    </small>
                                `
                                : ''
                        }

                    </div>


                    <div>

                        <span>
                            Target
                        </span>

                        <strong>
                            ${formatTargetValue(
                                target.target_value,
                                target.unit
                            )}
                        </strong>

                        ${
                            target.target_year
                                ? `
                                    <small>
                                        by ${escapeEnergyHtml(
                                            target.target_year
                                        )}
                                    </small>
                                `
                                : ''
                        }

                    </div>

                </div>


                ${
                    target.conditionality
                        ? `
                            <div class="energy-target-profile-block">

                                <span class="energy-target-profile-label">
                                    Conditionality
                                </span>

                                <p>
                                    ${escapeEnergyHtml(
                                        target.conditionality
                                    )}
                                </p>

                            </div>
                        `
                        : ''
                }

            </section>


            <section class="energy-target-profile-section">

                <h3>
                    Monitoring
                </h3>


                ${
                    latestObservation
                        ? `

                            <div class="energy-target-latest-observation">

                                <div class="energy-target-observation-heading">

                                    <span>
                                        Latest observation
                                    </span>

                                    <strong>
                                        ${escapeEnergyHtml(
                                            latestObservation.observation_date
                                            || 'Date unavailable'
                                        )}
                                    </strong>

                                </div>


                                <div class="energy-target-observation-value">

                                    ${formatTargetValue(
                                        latestObservation.actual_value,
                                        latestObservation.unit
                                        || target.unit
                                    )}

                                </div>


                                ${
                                    latestObservation.verification_status
                                        ? `
                                            <div class="energy-target-verification">

                                                <span>
                                                    Evidence status
                                                </span>

                                                <strong>
                                                    ${escapeEnergyHtml(
                                                        latestObservation.verification_status
                                                    )}
                                                </strong>

                                            </div>
                                        `
                                        : ''
                                }


                                ${
                                    latestObservation.observation_note
                                        ? `
                                            <p class="energy-target-observation-note">
                                                ${escapeEnergyHtml(
                                                    latestObservation.observation_note
                                                )}
                                            </p>
                                        `
                                        : ''
                                }

                            </div>

                        `
                        : `

                            <div class="energy-target-no-evidence">

                                <strong>
                                    No recorded observation
                                </strong>

                                <p>
                                    No monitoring evidence is currently
                                    recorded for this target in the dataset.
                                </p>

                            </div>

                        `
                }

            </section>


            ${
                observations.length > 1
                    ? `

                        <section class="energy-target-profile-section">

                            <h3>
                                Observation history
                            </h3>


                            <div class="energy-target-observation-history">

                                ${observations
                                    .map(
                                        observation => `

                                            <div class="energy-target-history-row">

                                                <div>

                                                    <strong>
                                                        ${escapeEnergyHtml(
                                                            observation.observation_date
                                                            || '—'
                                                        )}
                                                    </strong>

                                                    <span>
                                                        ${escapeEnergyHtml(
                                                            observation.verification_status
                                                            || 'Status unavailable'
                                                        )}
                                                    </span>

                                                </div>


                                                <strong>

                                                    ${formatTargetValue(
                                                        observation.actual_value,
                                                        observation.unit
                                                        || target.unit
                                                    )}

                                                </strong>

                                            </div>

                                        `
                                    )
                                    .join('')
                                }

                            </div>

                        </section>

                    `
                    : ''
            }


            <section class="energy-target-profile-section">

                <h3>
                    Source
                </h3>


                ${
                    target.source_citation
                        ? `
                            <p>
                                ${escapeEnergyHtml(
                                    target.source_citation
                                )}
                            </p>
                        `
                        : `
                            <p>
                                Source citation unavailable.
                            </p>
                        `
                }


                ${sourceLink}

            </section>

        `;


        drawer.classList.add(
            'active'
        );


        backdrop.classList.add(
            'active'
        );


        drawer.setAttribute(
            'aria-hidden',
            'false'
        );


        document.body.classList.add(
            'energy-drawer-open'
        );

    }


    function closeTargetDrawer() {

        const drawer =
            document.getElementById(
                'target-drawer'
            );


        const backdrop =
            document.getElementById(
                'target-drawer-backdrop'
            );


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


        document.body.classList.remove(
            'energy-drawer-open'
        );

    }




