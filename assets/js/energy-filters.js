    function getFilteredInitiatives() {

        const initiatives =
            data.initiatives || [];


        /*
        ----------------------------------------------------------
        Normalized selections

        Within a group:
        OR

        Between groups:
        AND
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
                STATE

                Match ANY selected state.
                --------------------------------------------------
                */

                if (selectedStates.size) {

                    const locations =
                        initiativeLocationsById[
                            initiative.initiative_id
                        ];


                    if (!locations) {
                        return false;
                    }


                    const hasMatchingState =
                        [...locations]
                            .some(
                                stateCode =>

                                    selectedStates.has(
                                        normalizeFilterValue(
                                            stateCode
                                        )
                                    )
                            );


                    if (!hasMatchingState) {
                        return false;
                    }

                }


                /*
                --------------------------------------------------
                SUBSECTOR

                Match primary OR related subsector against
                ANY selected subsector.
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


                    const primaryMatches =
                        selectedSubsectors.has(
                            primarySubsector
                        );


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
                        !primaryMatches
                        && !relationshipMatches
                    ) {

                        return false;

                    }

                }


                /*
                --------------------------------------------------
                STATUS

                Match ANY selected status.
                --------------------------------------------------
                */

                if (selectedStatuses.size) {

                    const initiativeStatus =
                        normalizeFilterValue(
                            initiative.standard_status
                        );


                    if (
                        !selectedStatuses.has(
                            initiativeStatus
                        )
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

        policyLibraryPage = 1;


        renderPolicyLibrary();
        renderPolicyCoverageMatrix();

        updateTargetKpis();
        updateTargetSubsectorChart();
        updateTargetTimelineChart();
        updateTargetMonitoringCoverage();

        targetLibraryPage = 1;
        renderTargetLibrary();

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

        const resetButton =
            document.getElementById(
                'energy-filter-reset'
            );


        const configs = [

            {
                id:
                    'energy-filter-subsector',

                key:
                    'subsectors',

                emptyLabel:
                    'All subsectors'
            },

            {
                id:
                    'energy-filter-state',

                key:
                    'states',

                emptyLabel:
                    'All Nigeria'
            },

            {
                id:
                    'energy-filter-status',

                key:
                    'statuses',

                emptyLabel:
                    'All statuses'
            }

        ];


        /*
        ----------------------------------------------------------
        Update visible dropdown label
        ----------------------------------------------------------
        */

        function updateMultiselectLabel(
            root,
            emptyLabel
        ) {

            const checked =
                [
                    ...root.querySelectorAll(
                        'input[type="checkbox"]:checked'
                    )
                ];


            const allInputs =
                [
                    ...root.querySelectorAll(
                        'input[type="checkbox"]'
                    )
                ];


            const label =
                root.querySelector(
                    '.energy-multiselect-label'
                );


            if (!label) {
                return;
            }


            root.classList.toggle(
                'has-selection',
                checked.length > 0
            );


            /*
            No selection
            */

            if (!checked.length) {

                label.textContent =
                    emptyLabel;

                return;

            }


            /*
            Everything selected is analytically equivalent
            to showing everything.
            */

            if (
                allInputs.length
                &&
                checked.length === allInputs.length
            ) {

                label.textContent =
                    emptyLabel;

                return;

            }


            /*
            One or two selected values:
            show their names.
            */

            if (checked.length <= 2) {

                label.textContent =
                    checked
                        .map(
                            input =>
                                input.dataset.label
                                || input.value
                        )
                        .join(', ');

                return;

            }


            /*
            Three or more:
            compact count.
            */

            label.textContent =
                `${checked.length} selected`;

        }


        /*
        ----------------------------------------------------------
        Initialize each multiselect
        ----------------------------------------------------------
        */

        configs.forEach(
            config => {

                const root =
                    document.getElementById(
                        config.id
                    );


                if (!root) {
                    return;
                }


                const trigger =
                    root.querySelector(
                        '.energy-multiselect-trigger'
                    );


                const menu =
                    root.querySelector(
                        '.energy-multiselect-menu'
                    );


                const inputs =
                    [
                        ...root.querySelectorAll(
                            'input[type="checkbox"]'
                        )
                    ];


                const selectAllButton =
                    root.querySelector(
                        '.energy-multiselect-select-all'
                    );


                /*
                --------------------------------------------------
                Sync Select all / Clear all label
                --------------------------------------------------
                */

                function syncSelectAllLabel() {

                    if (!selectAllButton) {
                        return;
                    }


                    const total =
                        inputs.length;


                    const checked =
                        inputs.filter(
                            input =>
                                input.checked
                        ).length;


                    selectAllButton.textContent =
                        total > 0
                        && checked === total
                            ? 'Clear all'
                            : 'Select all';

                }


                /*
                --------------------------------------------------
                Open / close dropdown
                --------------------------------------------------
                */

                if (trigger) {

                    trigger.addEventListener(
                        'click',
                        function (event) {

                            event.stopPropagation();


                            /*
                            Close other multiselects first
                            */

                            document
                                .querySelectorAll(
                                    '.energy-multiselect.open'
                                )
                                .forEach(
                                    item => {

                                        if (item === root) {
                                            return;
                                        }


                                        item.classList.remove(
                                            'open'
                                        );


                                        const otherTrigger =
                                            item.querySelector(
                                                '.energy-multiselect-trigger'
                                            );


                                        if (otherTrigger) {

                                            otherTrigger.setAttribute(
                                                'aria-expanded',
                                                'false'
                                            );

                                        }

                                    }
                                );


                            const isOpen =
                                root.classList.toggle(
                                    'open'
                                );


                            trigger.setAttribute(
                                'aria-expanded',
                                isOpen
                                    ? 'true'
                                    : 'false'
                            );

                        }
                    );

                }


                /*
                --------------------------------------------------
                Keep menu open while interacting inside it
                --------------------------------------------------
                */

                if (menu) {

                    menu.addEventListener(
                        'click',
                        function (event) {

                            event.stopPropagation();

                        }
                    );

                }


                /*
                --------------------------------------------------
                Select all / Clear all
                --------------------------------------------------
                */

                if (selectAllButton) {

                    selectAllButton.addEventListener(
                        'click',
                        function (event) {

                            event.preventDefault();
                            event.stopPropagation();


                            const allSelected =
                                inputs.length > 0
                                &&
                                inputs.every(
                                    input =>
                                        input.checked
                                );


                            /*
                            If all are selected:
                            clear everything.

                            Otherwise:
                            select everything.
                            */

                            inputs.forEach(
                                input => {

                                    input.checked =
                                        !allSelected;

                                }
                            );


                            energyFilterState[
                                config.key
                            ] =
                                !allSelected
                                    ? inputs.map(
                                        input =>
                                            input.value
                                    )
                                    : [];


                            updateMultiselectLabel(
                                root,
                                config.emptyLabel
                            );


                            syncSelectAllLabel();


                            applyEnergyFilters();

                        }
                    );

                }


                /*
                --------------------------------------------------
                Individual checkbox changes
                --------------------------------------------------
                */

                inputs.forEach(
                    input => {

                        input.addEventListener(
                            'change',
                            function () {

                                energyFilterState[
                                    config.key
                                ] =
                                    inputs
                                        .filter(
                                            checkbox =>
                                                checkbox.checked
                                        )
                                        .map(
                                            checkbox =>
                                                checkbox.value
                                        );


                                updateMultiselectLabel(
                                    root,
                                    config.emptyLabel
                                );


                                syncSelectAllLabel();


                                applyEnergyFilters();

                            }
                        );

                    }
                );


                /*
                --------------------------------------------------
                Initial appearance
                --------------------------------------------------
                */

                updateMultiselectLabel(
                    root,
                    config.emptyLabel
                );


                syncSelectAllLabel();

            }
        );


        /*
        ----------------------------------------------------------
        Click outside → close all dropdowns
        ----------------------------------------------------------
        */

        document.addEventListener(
            'click',
            function () {

                document
                    .querySelectorAll(
                        '.energy-multiselect.open'
                    )
                    .forEach(
                        root => {

                            root.classList.remove(
                                'open'
                            );


                            const trigger =
                                root.querySelector(
                                    '.energy-multiselect-trigger'
                                );


                            if (trigger) {

                                trigger.setAttribute(
                                    'aria-expanded',
                                    'false'
                                );

                            }

                        }
                    );

            }
        );


        /*
        ----------------------------------------------------------
        RESET ALL GLOBAL FILTERS
        ----------------------------------------------------------
        */

        if (resetButton) {

            resetButton.addEventListener(
                'click',
                function () {

                    energyFilterState.states =
                        [];

                    energyFilterState.subsectors =
                        [];

                    energyFilterState.statuses =
                        [];


                    configs.forEach(
                        config => {

                            const root =
                                document.getElementById(
                                    config.id
                                );


                            if (!root) {
                                return;
                            }


                            const inputs =
                                [
                                    ...root.querySelectorAll(
                                        'input[type="checkbox"]'
                                    )
                                ];


                            inputs.forEach(
                                input => {

                                    input.checked =
                                        false;

                                }
                            );


                            updateMultiselectLabel(
                                root,
                                config.emptyLabel
                            );


                            const selectAllButton =
                                root.querySelector(
                                    '.energy-multiselect-select-all'
                                );


                            if (selectAllButton) {

                                selectAllButton.textContent =
                                    'Select all';

                            }


                            root.classList.remove(
                                'open'
                            );


                            const trigger =
                                root.querySelector(
                                    '.energy-multiselect-trigger'
                                );


                            if (trigger) {

                                trigger.setAttribute(
                                    'aria-expanded',
                                    'false'
                                );

                            }

                        }
                    );


                    applyEnergyFilters();

                }
            );

        }

    }


/* ==========================================================
   PROGRAMMATIC STATE FILTER
========================================================== */

    function setEnergyStateFilter(
        stateCode
    ) {

        stateCode =
            String(
                stateCode || ''
            ).trim();


        if (!stateCode) {
            return;
        }


        const stateFilter =
            document.getElementById(
                'energy-filter-state'
            );


        /*
        Toggle clicked state:
        click once = select
        click again = deselect
        */

        const currentStates =
            new Set(
                energyFilterState.states
                || []
            );


        if (
            currentStates.has(
                stateCode
            )
        ) {

            currentStates.delete(
                stateCode
            );

        } else {

            currentStates.add(
                stateCode
            );

        }


        energyFilterState.states =
            [...currentStates];


        /*
        Synchronize checkbox UI
        */

        if (stateFilter) {

            stateFilter
                .querySelectorAll(
                    'input[type="checkbox"]'
                )
                .forEach(
                    input => {

                        input.checked =
                            currentStates.has(
                                input.value
                            );

                    }
                );


            const label =
                stateFilter.querySelector(
                    '.energy-multiselect-label'
                );


            const checked =
                [
                    ...stateFilter.querySelectorAll(
                        'input[type="checkbox"]:checked'
                    )
                ];


            stateFilter.classList.toggle(
                'has-selection',
                checked.length > 0
            );


            if (label) {

                if (!checked.length) {

                    label.textContent =
                        'All Nigeria';

                } else if (
                    checked.length <= 2
                ) {

                    label.textContent =
                        checked
                            .map(
                                input =>
                                    input.dataset.label
                                    || input.value
                            )
                            .join(', ');

                } else {

                    label.textContent =
                        `${checked.length} selected`;

                }

            }

        }


        applyEnergyFilters();

    }


    /* ==========================================================
   FILTER-RESPONSIVE OVERVIEW
========================================================== */

    /* ==========================================================
   FILTER-RESPONSIVE INTERFACE
========================================================== */
/* ==========================================================
   SHARED ANALYTICAL FILTER STATE
========================================================== */

const energyFilterState = {
    states: [],
    subsectors: [],
    statuses: []
};

