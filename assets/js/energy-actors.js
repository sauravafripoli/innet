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


    function getActorDirectoryRows(
        initiatives
    ) {

        const initiativeIds =
            new Set(
                (initiatives || [])
                    .map(
                        initiative =>
                            String(
                                initiative.initiative_id
                            )
                    )
            );


        const activityByActor = {};


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


                    if (!activityByActor[actorId]) {

                        activityByActor[actorId] = {

                            initiatives:
                                new Set(),

                            states:
                                new Set()

                        };

                    }


                    activityByActor[
                        actorId
                    ]
                    .initiatives
                    .add(
                        initiativeId
                    );


                    const locations =
                        initiativeLocationsById[
                            initiativeId
                        ];


                    if (locations) {

                        locations.forEach(
                            stateCode => {

                                activityByActor[
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


        let actors;


        /*
        ----------------------------------------------------------
        If no dashboard filter is active, show ALL actors.

        If filters are active, show only actors connected to
        matching initiatives.
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


        if (filtersActive) {

            actors =
                Object.keys(
                    activityByActor
                )
                .map(
                    actorId =>
                        actorById[
                            actorId
                        ]
                )
                .filter(Boolean);

        } else {

            actors =
                data.all_actors
                || data.actors
                || [];

        }


        let rows =
            actors.map(
                actor => {

                    const actorId =
                        String(
                            actor.actor_id
                            || ''
                        );


                    const activity =
                        activityByActor[
                            actorId
                        ];


                    return {

                        actor:
                            actor,

                        initiativeCount:
                            activity
                                ? activity
                                    .initiatives
                                    .size
                                : 0,

                        statesReached:
                            activity
                                ? activity
                                    .states
                                    .size
                                : 0

                    };

                }
            );


        /*
        ----------------------------------------------------------
        Directory text search
        ----------------------------------------------------------
        */

        const search =
            normalizeFilterValue(
                actorDirectorySearch
            );


        if (search) {

            rows =
                rows.filter(
                    row => {

                        const actor =
                            row.actor;


                        const haystack =
                            [
                                actor.organisation_name,
                                actor.acronym,
                                actor.actor_type,
                                actor.primary_role,
                                actor.subsector_focus
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


        /*
        ----------------------------------------------------------
        Sort:
        active actors first, then organisation name
        ----------------------------------------------------------
        */

        rows.sort(
            (a, b) => {

                if (
                    b.initiativeCount
                    !== a.initiativeCount
                ) {

                    return (
                        b.initiativeCount
                        - a.initiativeCount
                    );

                }


                return String(
                    a.actor.organisation_name
                    || ''
                )
                .localeCompare(
                    String(
                        b.actor.organisation_name
                        || ''
                    )
                );

            }
        );


        return rows;

    }

    function renderActorDirectory() {

        const body =
            document.getElementById(
                'actor-directory-body'
            );


        const countElement =
            document.getElementById(
                'actor-directory-count'
            );


        const pageInfo =
            document.getElementById(
                'actor-directory-page-info'
            );


        const previousButton =
            document.getElementById(
                'actor-directory-prev'
            );


        const nextButton =
            document.getElementById(
                'actor-directory-next'
            );


        if (!body) {
            return;
        }


        const rows =
            getActorDirectoryRows(
                actorDirectoryInitiatives
            );


        const totalRows =
            rows.length;


        const totalPages =
            Math.max(
                1,
                Math.ceil(
                    totalRows
                    / actorDirectoryPageSize
                )
            );


        if (
            actorDirectoryPage
            > totalPages
        ) {

            actorDirectoryPage =
                totalPages;

        }


        if (
            actorDirectoryPage
            < 1
        ) {

            actorDirectoryPage = 1;

        }


        const start =
            (
                actorDirectoryPage - 1
            )
            * actorDirectoryPageSize;


        const pageRows =
            rows.slice(
                start,
                start
                + actorDirectoryPageSize
            );


        if (countElement) {

            countElement.textContent =
                `${totalRows.toLocaleString()} ${
                    totalRows === 1
                        ? 'actor'
                        : 'actors'
                }`;

        }


        if (!pageRows.length) {

            body.innerHTML = `

                <tr>

                    <td colspan="5">
                        No actors match the current filters.
                    </td>

                </tr>

            `;

        } else {

            body.innerHTML =
                pageRows
                    .map(
                        row => {

                            const actor =
                                row.actor;


                            const displayName =
                                actor.acronym
                                || actor.organisation_name
                                || actor.actor_id;


                            return `

                                <tr
                                    class="energy-actor-directory-row"
                                    data-actor-id="${escapeEnergyHtml(
                                        actor.actor_id
                                    )}"
                                >

                                    <td>

                                        <strong>
                                            ${escapeEnergyHtml(
                                                displayName
                                            )}
                                        </strong>

                                        ${
                                            actor.acronym
                                            && actor.organisation_name
                                            ? `
                                                <small>
                                                    ${escapeEnergyHtml(
                                                        actor.organisation_name
                                                    )}
                                                </small>
                                            `
                                            : ''
                                        }

                                    </td>


                                    <td>
                                        ${escapeEnergyHtml(
                                            actor.actor_type
                                            || '—'
                                        )}
                                    </td>


                                    <td>
                                        ${escapeEnergyHtml(
                                            actor.primary_role
                                            || '—'
                                        )}
                                    </td>


                                    <td>
                                        ${row.initiativeCount.toLocaleString()}
                                    </td>


                                    <td>
                                        ${row.statesReached.toLocaleString()}
                                    </td>

                                </tr>

                            `;

                        }
                    )
                    .join('');

        }


        if (pageInfo) {

            pageInfo.textContent =
                `Page ${actorDirectoryPage} of ${totalPages}`;

        }


        if (previousButton) {

            previousButton.disabled =
                actorDirectoryPage <= 1;

        }


        if (nextButton) {

            nextButton.disabled =
                actorDirectoryPage >= totalPages;

        }

    }

    function initActorDirectory() {

        const search =
            document.getElementById(
                'actor-directory-search'
            );


        const previousButton =
            document.getElementById(
                'actor-directory-prev'
            );


        const nextButton =
            document.getElementById(
                'actor-directory-next'
            );


        const body =
            document.getElementById(
                'actor-directory-body'
            );


        if (search) {

            search.addEventListener(
                'input',
                function () {

                    actorDirectorySearch =
                        this.value || '';


                    actorDirectoryPage = 1;


                    renderActorDirectory();

                }
            );

        }


        if (previousButton) {

            previousButton.addEventListener(
                'click',
                function () {

                    if (
                        actorDirectoryPage
                        <= 1
                    ) {
                        return;
                    }


                    actorDirectoryPage--;


                    renderActorDirectory();

                }
            );

        }


        if (nextButton) {

            nextButton.addEventListener(
                'click',
                function () {

                    actorDirectoryPage++;


                    renderActorDirectory();

                }
            );

        }


        /*
        ----------------------------------------------------------
        Event delegation keeps row clicks working after rerender
        ----------------------------------------------------------
        */

        if (body) {

            body.addEventListener(
                'click',
                function (event) {

                    const row =
                        event.target.closest(
                            '.energy-actor-directory-row'
                        );


                    if (!row) {
                        return;
                    }


                    openActorDrawer(
                        row.dataset.actorId
                    );

                }
            );

        }


        renderActorDirectory();

    }


/* ==========================================================
   INIT EXPLORER
========================================================== */

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


