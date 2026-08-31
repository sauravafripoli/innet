/* ==========================================================
   POLICY DETAIL DRAWER
========================================================== */

    function openPolicyDrawer(
        policyId
    ) {

        const policy =
            policyById[
                String(
                    policyId || ''
                )
            ];


        if (!policy) {

            console.warn(
                'Policy not found:',
                policyId
            );

            return;

        }


        const drawer =
            document.getElementById(
                'policy-drawer'
            );


        const backdrop =
            document.getElementById(
                'policy-drawer-backdrop'
            );


        const title =
            document.getElementById(
                'policy-drawer-title'
            );


        const idElement =
            document.getElementById(
                'policy-drawer-id'
            );


        const content =
            document.getElementById(
                'policy-drawer-content'
            );


        if (
            !drawer
            ||
            !content
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
                policy.short_name
                || policy.instrument_name
                || policy.policy_id
                || 'Policy';

        }


        if (idElement) {

            idElement.textContent =
                policy.policy_id
                || '';

        }


        /*
        ----------------------------------------------------------
        Small reusable field helper
        ----------------------------------------------------------
        */

        function policyField(
            label,
            value
        ) {

            if (
                value === null
                ||
                value === undefined
                ||
                String(
                    value
                ).trim() === ''
            ) {
                return '';
            }


            return `
                <div class="energy-drawer-field">

                    <span>
                        ${escapeEnergyHtml(
                            label
                        )}
                    </span>

                    <strong>
                        ${escapeEnergyHtml(
                            String(
                                value
                            )
                        )}
                    </strong>

                </div>
            `;

        }


        /*
        ----------------------------------------------------------
        Policy → function coverage
        ----------------------------------------------------------
        */

        const scopes =
            (data.policy_scopes || [])
                .filter(
                    scope =>
                        String(
                            scope.policy_id
                            || ''
                        )
                        ===
                        String(
                            policy.policy_id
                            || ''
                        )
                );


        const functionIds =
            [
                ...new Set(
                    scopes
                        .map(
                            scope =>
                                String(
                                    scope.function_id
                                    || ''
                                )
                        )
                        .filter(Boolean)
                )
            ];


        const functionNames =
            functionIds
                .map(
                    functionId => {

                        const fn =
                            (data.functions || [])
                                .find(
                                    item =>
                                        String(
                                            item.function_id
                                            || ''
                                        )
                                        ===
                                        functionId
                                );


                        return fn
                            ? (
                                fn.function_name
                                || functionId
                            )
                            : functionId;

                    }
                );


        const coveredSubsectors =
            [
                ...new Set(
                    scopes
                        .map(
                            scope =>
                                String(
                                    scope.subsector
                                    || ''
                                ).trim()
                        )
                        .filter(Boolean)
                )
            ];


        /*
        ----------------------------------------------------------
        Drawer HTML
        ----------------------------------------------------------
        */

        content.innerHTML = `

            <section class="energy-drawer-section">

                <h3>
                    Policy overview
                </h3>


                <div class="energy-drawer-grid">

                    ${policyField(
                        'Instrument type',
                        policy.instrument_type
                    )}

                    ${policyField(
                        'Status',
                        policy.status
                    )}

                    ${policyField(
                        'Publication year',
                        policy.publication_year
                    )}

                    ${policyField(
                        'Legal force',
                        policy.legal_force
                    )}

                    ${policyField(
                        'Governance tier',
                        policy.governance_tier
                    )}

                    ${policyField(
                        'Primary subsector',
                        policy.primary_subsector
                    )}

                </div>

            </section>


            <section class="energy-drawer-section">

                <h3>
                    Institutional responsibility
                </h3>


                <div class="energy-drawer-grid">

                    ${policyField(
                        'Issuing institution',
                        policy.issuing_institution
                    )}

                    ${policyField(
                        'Implementing institutions',
                        policy.implementing_institutions
                    )}

                </div>

            </section>


            ${
                policy.implementation_mechanism_defined
                ||
                policy.monitoring_evaluation_framework
                ||
                policy.implementation_note
                    ? `

                        <section class="energy-drawer-section">

                            <h3>
                                Implementation
                            </h3>


                            ${
                                policy.implementation_mechanism_defined
                                    ? `

                                        <div class="energy-drawer-text-block">

                                            <span>
                                                Implementation mechanism
                                            </span>

                                            <p>
                                                ${escapeEnergyHtml(
                                                    policy
                                                        .implementation_mechanism_defined
                                                )}
                                            </p>

                                        </div>

                                    `
                                    : ''
                            }


                            ${
                                policy.monitoring_evaluation_framework
                                    ? `

                                        <div class="energy-drawer-text-block">

                                            <span>
                                                Monitoring &amp; evaluation
                                            </span>

                                            <p>
                                                ${escapeEnergyHtml(
                                                    policy
                                                        .monitoring_evaluation_framework
                                                )}
                                            </p>

                                        </div>

                                    `
                                    : ''
                            }


                            ${
                                policy.implementation_note
                                    ? `

                                        <div class="energy-drawer-text-block">

                                            <span>
                                                Implementation note
                                            </span>

                                            <p>
                                                ${escapeEnergyHtml(
                                                    policy
                                                        .implementation_note
                                                )}
                                            </p>

                                        </div>

                                    `
                                    : ''
                            }

                        </section>

                    `
                    : ''
            }


            ${
                coveredSubsectors.length
                ||
                functionNames.length
                    ? `

                        <section class="energy-drawer-section">

                            <h3>
                                Coverage
                            </h3>


                            ${
                                coveredSubsectors.length
                                    ? `

                                        <div class="energy-drawer-text-block">

                                            <span>
                                                Covered subsectors
                                            </span>

                                            <p>
                                                ${coveredSubsectors
                                                    .map(
                                                        escapeEnergyHtml
                                                    )
                                                    .join(
                                                        ', '
                                                    )}
                                            </p>

                                        </div>

                                    `
                                    : ''
                            }


                            ${
                                functionNames.length
                                    ? `

                                        <div class="energy-drawer-text-block">

                                            <span>
                                                Covered functions
                                            </span>

                                            <div class="energy-drawer-list">

                                                ${functionNames
                                                    .map(
                                                        functionName => `

                                                            <div>
                                                                ${escapeEnergyHtml(
                                                                    functionName
                                                                )}
                                                            </div>

                                                        `
                                                    )
                                                    .join('')}

                                            </div>

                                        </div>

                                    `
                                    : ''
                            }

                        </section>

                    `
                    : ''
            }


            ${
                policy.source_citation
                ||
                policy.source_url
                    ? `

                        <section class="energy-drawer-section">

                            <h3>
                                Source
                            </h3>


                            ${
                                policy.source_citation
                                    ? `

                                        <p>
                                            ${escapeEnergyHtml(
                                                policy.source_citation
                                            )}
                                        </p>

                                    `
                                    : ''
                            }


                            ${
                                policy.source_url
                                    ? `

                                        <a
                                            href="${escapeEnergyHtml(
                                                policy.source_url
                                            )}"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            class="energy-source-link"
                                        >
                                            View source ↗
                                        </a>

                                    `
                                    : ''
                            }

                        </section>

                    `
                    : ''
            }

        `;


        /*
        ----------------------------------------------------------
        Open drawer
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
   CLOSE POLICY DRAWER
========================================================== */

    function closePolicyDrawer() {

        const drawer =
            document.getElementById(
                'policy-drawer'
            );


        const backdrop =
            document.getElementById(
                'policy-drawer-backdrop'
            );


        if (
            drawer
            &&
            document.activeElement
            &&
            drawer.contains(
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


/* ==========================================================
   POLICY DRAWER EVENTS
========================================================== */

    function initPolicyDrawer() {

        const closeButton =
            document.getElementById(
                'policy-drawer-close'
            );


        const backdrop =
            document.getElementById(
                'policy-drawer-backdrop'
            );


        if (closeButton) {

            closeButton.addEventListener(
                'click',
                closePolicyDrawer
            );

        }


        if (backdrop) {

            backdrop.addEventListener(
                'click',
                closePolicyDrawer
            );

        }


        /*
        ----------------------------------------------------------
        Existing policy rows
        ----------------------------------------------------------
        */

        document.addEventListener(
            'click',
            function (
                event
            ) {

                const row =
                    event.target.closest(
                        `
                            .energy-policy-row[data-policy-id],
                            .energy-policy-matrix-row[data-policy-id]
                        `
                    );


                if (!row) {
                    return;
                }


                openPolicyDrawer(
                    row.dataset.policyId
                );

            }
        );

    }


    let policyLibraryPage = 1;


    const policyLibraryPageSize = 10;


    let policyLibrarySearch ='';

/* ==========================================================
   POLICY LIBRARY
========================================================== */

    function getFilteredPolicies() {

        let policies =
            Object.values(
                policyById
            );


        /*
        ----------------------------------------------------------
        Global SUBSECTOR filter

        State/status do not currently have a defensible direct
        relationship to policies, so they are intentionally ignored.
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

            /*
            ------------------------------------------------------
            Find policy IDs whose scopes match selected subsectors
            ------------------------------------------------------
            */

            const matchingPolicyIds =
                new Set();


            (data.policy_scopes || [])
                .forEach(
                    scope => {

                        const policyId =
                            String(
                                scope.policy_id
                                || ''
                            );


                        if (!policyId) {
                            return;
                        }


                        const scopeSubsector =
                            normalizeFilterValue(
                                scope.subsector
                            );


                        /*
                        ------------------------------------------
                        Direct scope subsector match
                        ------------------------------------------
                        */

                        if (
                            scopeSubsector
                            &&
                            selectedSubsectors.has(
                                scopeSubsector
                            )
                        ) {

                            matchingPolicyIds.add(
                                policyId
                            );


                            return;

                        }


                        /*
                        ------------------------------------------
                        Fallback:
                        use the linked function's primary subsector
                        ------------------------------------------
                        */

                        const functionId =
                            String(
                                scope.function_id
                                || ''
                            );


                        if (!functionId) {
                            return;
                        }


                        const fn =
                            (data.functions || [])
                                .find(
                                    item =>
                                        String(
                                            item.function_id
                                            || ''
                                        )
                                        ===
                                        functionId
                                );


                        if (
                            fn
                            &&
                            selectedSubsectors.has(
                                normalizeFilterValue(
                                    fn.primary_subsector
                                )
                            )
                        ) {

                            matchingPolicyIds.add(
                                policyId
                            );

                        }

                    }
                );


            policies =
                policies.filter(
                    policy =>
                        matchingPolicyIds.has(
                            String(
                                policy.policy_id
                            )
                        )
                );

        }


        /*
        ----------------------------------------------------------
        Local search
        ----------------------------------------------------------
        */

        const search =
            normalizeFilterValue(
                policyLibrarySearch
            );


        if (search) {

            policies =
                policies.filter(
                    policy => {

                        const haystack =
                            [
                                policy.policy_id,
                                policy.instrument_name,
                                policy.short_name,
                                policy.instrument_type,
                                policy.status,
                                policy.primary_subsector,
                                policy.issuing_institution
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
        Sort newest first, then alphabetically
        ----------------------------------------------------------
        */

        policies.sort(
            (a, b) => {

                const yearDifference =
                    Number(
                        b.publication_year || 0
                    )
                    -
                    Number(
                        a.publication_year || 0
                    );


                if (yearDifference !== 0) {
                    return yearDifference;
                }


                return String(
                    a.short_name
                    || a.instrument_name
                    || ''
                )
                .localeCompare(
                    String(
                        b.short_name
                        || b.instrument_name
                        || ''
                    )
                );

            }
        );


        return policies;

    }


/* ==========================================================
   RENDER POLICY LIBRARY
========================================================== */

    function renderPolicyLibrary() {

        const list =
            document.getElementById(
                'policy-library-list'
            );


        const count =
            document.getElementById(
                'policy-library-count'
            );


        const pageInfo =
            document.getElementById(
                'policy-library-page-info'
            );


        const previousButton =
            document.getElementById(
                'policy-library-prev'
            );


        const nextButton =
            document.getElementById(
                'policy-library-next'
            );


        if (!list) {
            return;
        }


        const policies =
            getFilteredPolicies();


        /*
        ----------------------------------------------------------
        Pagination
        ----------------------------------------------------------
        */

        const totalRows =
            policies.length;


        const totalPages =
            Math.max(
                1,
                Math.ceil(
                    totalRows
                    / policyLibraryPageSize
                )
            );


        if (
            policyLibraryPage
            > totalPages
        ) {

            policyLibraryPage =
                totalPages;

        }


        if (
            policyLibraryPage
            < 1
        ) {

            policyLibraryPage =
                1;

        }


        const startIndex =
            (
                policyLibraryPage
                - 1
            )
            * policyLibraryPageSize;


        const visiblePolicies =
            policies.slice(
                startIndex,
                startIndex
                + policyLibraryPageSize
            );


        /*
        ----------------------------------------------------------
        Result count
        ----------------------------------------------------------
        */

        if (count) {

            count.textContent =
                totalRows.toLocaleString()
                + (
                    totalRows === 1
                        ? ' policy'
                        : ' policies'
                );

        }


        /*
        ----------------------------------------------------------
        Empty state
        ----------------------------------------------------------
        */

        if (!visiblePolicies.length) {

            list.innerHTML = `

                <div class="energy-table-empty">
                    No policies match the current filters.
                </div>

            `;

        } else {

            /*
            ------------------------------------------------------
            Render
            ------------------------------------------------------
            */

            list.innerHTML =
                visiblePolicies
                    .map(
                        policy => {

                            const policyId =
                                String(
                                    policy.policy_id
                                    || ''
                                );


                            const name =
                                policy.short_name
                                || policy.instrument_name
                                || policyId;


                            const fullName =
                                policy.instrument_name
                                || '';


                            /*
                            ------------------------------------------
                            Coverage count
                            ------------------------------------------
                            */

                            const scopes =
                                (data.policy_scopes || [])
                                    .filter(
                                        scope =>
                                            String(
                                                scope.policy_id
                                                || ''
                                            )
                                            ===
                                            policyId
                                    );


                            const functionCount =
                                new Set(
                                    scopes
                                        .map(
                                            scope =>
                                                String(
                                                    scope.function_id
                                                    || ''
                                                )
                                        )
                                        .filter(Boolean)
                                )
                                .size;


                            const subsectorCount =
                                new Set(
                                    scopes
                                        .map(
                                            scope =>
                                                String(
                                                    scope.subsector
                                                    || ''
                                                )
                                                .trim()
                                        )
                                        .filter(Boolean)
                                )
                                .size;


                            return `

                                <button
                                    type="button"
                                    class="
                                        energy-list-item
                                        energy-policy-row
                                    "
                                    data-policy-id="${escapeEnergyHtml(
                                        policyId
                                    )}"
                                >

                                    <div>

                                        <strong>
                                            ${escapeEnergyHtml(
                                                name
                                            )}
                                        </strong>


                                        ${
                                            fullName
                                            &&
                                            fullName !== name
                                                ? `
                                                    <small>
                                                        ${escapeEnergyHtml(
                                                            fullName
                                                        )}
                                                    </small>
                                                `
                                                : ''
                                        }


                                        <small>

                                            ${escapeEnergyHtml(
                                                policy.instrument_type
                                                || 'Policy instrument'
                                            )}

                                            ${
                                                policy.publication_year
                                                    ? `
                                                        ·
                                                        ${escapeEnergyHtml(
                                                            policy.publication_year
                                                        )}
                                                    `
                                                    : ''
                                            }

                                        </small>

                                    </div>


                                    <div class="energy-list-meta">

                                        <span>
                                            ${functionCount}
                                            ${
                                                functionCount === 1
                                                    ? 'function'
                                                    : 'functions'
                                            }
                                        </span>

                                        <span>
                                            ${subsectorCount}
                                            ${
                                                subsectorCount === 1
                                                    ? 'subsector'
                                                    : 'subsectors'
                                            }
                                        </span>

                                    </div>

                                </button>

                            `;

                        }
                    )
                    .join('');

        }


        /*
        ----------------------------------------------------------
        Pagination controls
        ----------------------------------------------------------
        */

        if (pageInfo) {

            pageInfo.textContent =
                totalRows
                    ? `Page ${policyLibraryPage} of ${totalPages}`
                    : 'Page 0 of 0';

        }


        if (previousButton) {

            previousButton.disabled =
                (
                    !totalRows
                    ||
                    policyLibraryPage <= 1
                );

        }


        if (nextButton) {

            nextButton.disabled =
                (
                    !totalRows
                    ||
                    policyLibraryPage >= totalPages
                );

        }

    }


    function initPolicyLibrary() {

        const search =
            document.getElementById(
                'policy-library-search'
            );


        const previousButton =
            document.getElementById(
                'policy-library-prev'
            );


        const nextButton =
            document.getElementById(
                'policy-library-next'
            );


        if (search) {

            search.addEventListener(
                'input',
                function () {

                    policyLibrarySearch =
                        this.value
                        || '';


                    policyLibraryPage =
                        1;


                    renderPolicyLibrary();

                }
            );

        }


        if (previousButton) {

            previousButton.addEventListener(
                'click',
                function () {

                    if (
                        policyLibraryPage
                        <= 1
                    ) {
                        return;
                    }


                    policyLibraryPage--;


                    renderPolicyLibrary();

                }
            );

        }


        if (nextButton) {

            nextButton.addEventListener(
                'click',
                function () {

                    policyLibraryPage++;


                    renderPolicyLibrary();

                }
            );

        }


        renderPolicyLibrary();

    }


    function renderPolicyCoverageMatrix() {

        const container =
            document.getElementById(
                'policy-coverage-matrix'
            );


        if (!container) {
            return;
        }


        const selectedSubsectors =
            new Set(
                (energyFilterState.subsectors || [])
                    .map(
                        normalizeFilterValue
                    )
                    .filter(Boolean)
            );


        const policies =
            Object.values(
                policyById
            );


        const scopes =
            data.policy_scopes
            || [];


        const subsectorSet =
            new Set();


        scopes.forEach(
            scope => {

                const subsector =
                    String(
                        scope.subsector
                        || ''
                    ).trim();


                if (subsector) {

                    subsectorSet.add(
                        subsector
                    );

                }

            }
        );


        let subsectors =
            [...subsectorSet]
                .sort();


        if (selectedSubsectors.size) {

            subsectors =
                subsectors.filter(
                    subsector =>
                        selectedSubsectors.has(
                            normalizeFilterValue(
                                subsector
                            )
                        )
                );

        }


        /*
        ----------------------------------------------------------
        Build policy → subsector → functions lookup
        ----------------------------------------------------------
        */

        const coverage = {};


        scopes.forEach(
            scope => {

                const policyId =
                    String(
                        scope.policy_id
                        || ''
                    );


                const subsector =
                    String(
                        scope.subsector
                        || ''
                    ).trim();


                const functionId =
                    String(
                        scope.function_id
                        || ''
                    );


                if (
                    !policyId
                    ||
                    !subsector
                ) {
                    return;
                }


                if (!coverage[policyId]) {

                    coverage[policyId] =
                        {};

                }


                if (
                    !coverage[
                        policyId
                    ][
                        subsector
                    ]
                ) {

                    coverage[
                        policyId
                    ][
                        subsector
                    ] =
                        [];

                }


                if (functionId) {

                    coverage[
                        policyId
                    ][
                        subsector
                    ].push(
                        functionId
                    );

                }

            }
        );


        const visiblePolicies =
            policies
                .filter(
                    policy => {

                        const policyCoverage =
                            coverage[
                                policy.policy_id
                            ];


                        if (!policyCoverage) {
                            return false;
                        }


                        if (!selectedSubsectors.size) {
                            return true;
                        }


                        return subsectors.some(
                            subsector =>
                                Array.isArray(
                                    policyCoverage[
                                        subsector
                                    ]
                                )
                        );

                    }
                )
                .sort(
                    (a, b) =>
                        String(
                            a.short_name
                            || a.instrument_name
                            || ''
                        )
                        .localeCompare(
                            String(
                                b.short_name
                                || b.instrument_name
                                || ''
                            )
                        )
                );


        if (
            !visiblePolicies.length
            ||
            !subsectors.length
        ) {

            container.innerHTML = `
                <div class="energy-table-empty">
                    No policy coverage matches the current filters.
                </div>
            `;

            return;
        }


        const functionById =
            Object.fromEntries(
                (data.functions || [])
                    .map(
                        fn => [
                            String(
                                fn.function_id
                                || ''
                            ),
                            fn
                        ]
                    )
            );


        container.innerHTML = `

            <div class="energy-policy-matrix-scroll">

                <table class="energy-policy-matrix-table">

                    <thead>

                        <tr>

                            <th>
                                Policy
                            </th>

                            ${subsectors
                                .map(
                                    subsector => `
                                        <th>
                                            ${escapeEnergyHtml(
                                                subsector
                                            )}
                                        </th>
                                    `
                                )
                                .join('')}

                        </tr>

                    </thead>


                    <tbody>

                        ${visiblePolicies
                            .map(
                                policy => {

                                    const policyId =
                                        String(
                                            policy.policy_id
                                            || ''
                                        );


                                    const name =
                                        policy.short_name
                                        || policy.instrument_name
                                        || policyId;


                                    return `

                                        <tr
                                            class="energy-policy-matrix-row"
                                            data-policy-id="${escapeEnergyHtml(
                                                policyId
                                            )}"
                                        >

                                            <td>

                                                <strong>
                                                    ${escapeEnergyHtml(
                                                        name
                                                    )}
                                                </strong>

                                                <small>
                                                    ${escapeEnergyHtml(
                                                        policyId
                                                    )}
                                                </small>

                                            </td>


                                            ${subsectors
                                                .map(
                                                    subsector => {

                                                        const ids =
                                                            coverage[
                                                                policyId
                                                            ]?.[
                                                                subsector
                                                            ]
                                                            || [];


                                                        const functions =
                                                            ids
                                                                .map(
                                                                    id => {

                                                                        const fn =
                                                                            functionById[
                                                                                id
                                                                            ];


                                                                        return fn
                                                                            ? (
                                                                                fn.function_name
                                                                                || id
                                                                            )
                                                                            : id;

                                                                    }
                                                                );


                                                        const title =
                                                            functions.length
                                                                ? functions.join(
                                                                    ' • '
                                                                )
                                                                : 'No mapped function coverage';


                                                        return `

                                                            <td
                                                                class="
                                                                    energy-policy-matrix-cell
                                                                    ${
                                                                        functions.length
                                                                            ? 'has-coverage'
                                                                            : ''
                                                                    }
                                                                "
                                                                title="${escapeEnergyHtml(
                                                                    title
                                                                )}"
                                                            >

                                                                ${
                                                                    functions.length
                                                                        ? `
                                                                            <span
                                                                                class="
                                                                                    energy-policy-coverage-dot
                                                                                "
                                                                            ></span>

                                                                            <small>
                                                                                ${functions.length}
                                                                            </small>
                                                                        `
                                                                        : `
                                                                            <span
                                                                                class="
                                                                                    energy-policy-coverage-empty
                                                                                "
                                                                            >
                                                                                —
                                                                            </span>
                                                                        `
                                                                }

                                                            </td>

                                                        `;

                                                    }
                                                )
                                                .join('')}

                                        </tr>

                                    `;

                                }
                            )
                            .join('')}

                    </tbody>

                </table>

            </div>

        `;

    }


