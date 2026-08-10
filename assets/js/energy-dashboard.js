(function () {

    'use strict';

    if (
        typeof echarts === 'undefined'
        || typeof window.INETTEnergyData === 'undefined'
    ) {
        return;
    }


    const data = window.INETTEnergyData;


    function initSubsectorChart() {

        const element = document.getElementById(
            'subsector-chart'
        );

        if (!element) {
            return;
        }


        const chart = echarts.init(element);


        const rows = [...data.subsectors]
            .sort(
                (a, b) =>
                    Number(a.initiative_count)
                    - Number(b.initiative_count)
            );


        const labels = rows.map(
            row => row.subsector
        );


        const values = rows.map(
            row => Number(row.initiative_count)
        );


        const active = rows.map(
            row => Number(row.active_count)
        );


        chart.setOption({

            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'
                },

                formatter: function (params) {

                    const index =
                        params[0].dataIndex;

                    const row = rows[index];

                    return `
                        <strong>${row.subsector}</strong>
                        <br>
                        Initiatives:
                        ${Number(row.initiative_count).toLocaleString()}
                        <br>
                        Active:
                        ${Number(row.active_count).toLocaleString()}
                        <br>
                        Completed:
                        ${Number(row.completed_count).toLocaleString()}
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
                axisLine: {
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
                    name: 'Initiatives',
                    type: 'bar',

                    data: values,

                    barWidth: 20,

                    itemStyle: {
                        color: '#0f6e56',
                        borderRadius: [0, 5, 5, 0]
                    },

                    label: {
                        show: true,
                        position: 'right',
                        color: '#37413c',
                        fontWeight: 600
                    }
                }

            ]
        });


        window.addEventListener(
            'resize',
            function () {
                chart.resize();
            }
        );

    }


    function initStatusChart() {

        const element = document.getElementById(
            'status-chart'
        );

        if (!element) {
            return;
        }


        const chart = echarts.init(element);


        const chartData = data.statuses.map(
            row => ({
                name: row.status,
                value: Number(
                    row.initiative_count
                )
            })
        );


        const total = chartData.reduce(
            (sum, item) => sum + item.value,
            0
        );


        chart.setOption({

            tooltip: {
                trigger: 'item',

                formatter:
                    '{b}<br>{c} initiatives ({d}%)'
            },


            legend: {
                bottom: 0,
                left: 'center',

                textStyle: {
                    color: '#5f6863',
                    fontSize: 11
                }
            },


            graphic: [

                {
                    type: 'text',

                    left: 'center',
                    top: '39%',

                    style: {
                        text: total.toLocaleString(),
                        fontSize: 30,
                        fontWeight: 700,
                        fill: '#17211c',
                        textAlign: 'center'
                    }
                },

                {
                    type: 'text',

                    left: 'center',
                    top: '50%',

                    style: {
                        text: 'initiatives',
                        fontSize: 11,
                        fill: '#7c847f',
                        textAlign: 'center'
                    }
                }

            ],


            series: [

                {
                    name: 'Initiative status',

                    type: 'pie',

                    radius: [
                        '52%',
                        '72%'
                    ],

                    center: [
                        '50%',
                        '43%'
                    ],

                    avoidLabelOverlap: true,

                    itemStyle: {
                        borderColor: '#ffffff',
                        borderWidth: 3
                    },

                    label: {
                        show: false
                    },

                    emphasis: {

                        scale: true,

                        scaleSize: 5,

                        label: {
                            show: true,
                            fontSize: 13,
                            fontWeight: 600
                        }
                    },

                    data: chartData
                }

            ]
        });


        window.addEventListener(
            'resize',
            function () {
                chart.resize();
            }
        );

    }

    function initNigeriaMap() {

    /*
    ----------------------------------------------------------
    Prevent duplicate Leaflet initialization
    ----------------------------------------------------------
    */

    if (window.INETTEnergyMap) {
        return;
    }


    const element = document.getElementById(
        'nigeria-energy-map'
    );


    if (
        !element
        || typeof L === 'undefined'
    ) {
        return;
    }


    const stateData =
        data.states || [];


    const stateLookup = {};


    /*
    ----------------------------------------------------------
    State name normalisation
    ----------------------------------------------------------
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
                'federal capital territory'

        };


        return (
            aliases[normalized]
            || normalized
        );
    }


    stateData.forEach(state => {

        stateLookup[
            normalizeStateName(
                state.state_name
            )
        ] = state;

    });


    /*
    ----------------------------------------------------------
    Create map
    ----------------------------------------------------------
    */

    const map = L.map(
        'nigeria-energy-map',
        {
            zoomControl: true,
            scrollWheelZoom: false
        }
    ).setView(
        [9.0820, 8.6753],
        6
    );


    /*
    Make map available to the tab system.
    */

    window.INETTEnergyMap = map;


    /*
    ----------------------------------------------------------
    Base layer
    ----------------------------------------------------------
    */

    L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
            attribution:
                '&copy; OpenStreetMap contributors'
        }
    ).addTo(map);


    /*
    ----------------------------------------------------------
    Colour scale
    ----------------------------------------------------------
    */

    function getStateColor(count) {

        count = Number(count || 0);


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


        return '#e3efea';
    }


    /*
    ----------------------------------------------------------
    GeoJSON polygon styling
    ----------------------------------------------------------
    */

    function styleFeature(feature) {

        const geoStateName =
            normalizeStateName(
                feature.properties.state
            );


        const state =
            stateLookup[geoStateName];


        const initiativeCount =
            state
                ? state.initiative_count
                : 0;


        return {

            fillColor:
                getStateColor(
                    initiativeCount
                ),

            weight: 1,

            opacity: 1,

            color: '#ffffff',

            fillOpacity: 0.88

        };
    }


    /*
    ----------------------------------------------------------
    Money formatter
    ----------------------------------------------------------
    */

    function formatMoney(value) {

        value = Number(value || 0);


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


    /*
    ----------------------------------------------------------
    State profile panel
    ----------------------------------------------------------
    */

    function updateStatePanel(state) {

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


        if (panelName) {

            panelName.textContent =
                state.state_name;

        }


        if (panelDescription) {

            panelDescription.textContent =
                'Energy transition profile and tracked activity.';

        }


        if (panelData) {

            panelData.hidden = false;

        }


        const initiativeElement =
            document.getElementById(
                'state-initiatives'
            );

        const activeElement =
            document.getElementById(
                'state-active'
            );

        const actorElement =
            document.getElementById(
                'state-actors'
            );

        const accessElement =
            document.getElementById(
                'state-access'
            );

        const zoneElement =
            document.getElementById(
                'state-zone'
            );

        const lawElement =
            document.getElementById(
                'state-law'
            );

        const regulatorElement =
            document.getElementById(
                'state-regulator'
            );

        const valueElement =
            document.getElementById(
                'state-value'
            );


        if (initiativeElement) {

            initiativeElement.textContent =
                Number(
                    state.initiative_count
                    || 0
                ).toLocaleString();

        }


        if (activeElement) {

            activeElement.textContent =
                Number(
                    state.active_initiative_count
                    || 0
                ).toLocaleString();

        }


        if (actorElement) {

            actorElement.textContent =
                Number(
                    state.participating_actor_count
                    || 0
                ).toLocaleString();

        }


        if (accessElement) {

            accessElement.textContent =
                state.electricity_access_rate
                    !== null
                && state.electricity_access_rate
                    !== undefined

                    ? (
                        Number(
                            state.electricity_access_rate
                        ).toFixed(1)
                        + '%'
                    )

                    : '—';

        }


        if (zoneElement) {

            zoneElement.textContent =
                state.geopolitical_zone
                || '—';

        }


        if (lawElement) {

            lawElement.textContent =
                state.state_electricity_law_enacted
                || '—';

        }


        if (regulatorElement) {

            regulatorElement.textContent =
                state.state_regulator
                || state.current_regulatory_authority
                || '—';

        }


        if (valueElement) {

            valueElement.textContent =
                formatMoney(
                    state.known_project_value_usd
                );

        }

    }


    /*
    ----------------------------------------------------------
    GeoJSON feature interaction
    ----------------------------------------------------------
    */

    let geoJsonLayer;


    function onEachFeature(
        feature,
        layer
    ) {

        const geoStateName =
            normalizeStateName(
                feature.properties.state
            );


        const state =
            stateLookup[geoStateName];


        const displayName =
            feature.properties.state;


        const initiativeCount =
            state
                ? Number(
                    state.initiative_count
                )
                : 0;


        const activeCount =
            state
                ? Number(
                    state.active_initiative_count
                )
                : 0;


        /*
        Tooltip
        */

        layer.bindTooltip(
            `
                <strong>${displayName}</strong>
                <br>
                ${initiativeCount} initiatives
                <br>
                ${activeCount} active
            `,
            {
                sticky: true
            }
        );


        /*
        Interactions
        */

        layer.on({

            mouseover: function () {

                if (
                    typeof layer.setStyle
                    === 'function'
                ) {

                    layer.setStyle({
                        weight: 2,
                        color: '#183d32',
                        fillOpacity: 1
                    });

                }


                if (
                    typeof layer.bringToFront
                    === 'function'
                ) {

                    layer.bringToFront();

                }

            },


            mouseout: function () {

                if (
                    geoJsonLayer
                    && typeof geoJsonLayer.resetStyle
                    === 'function'
                ) {

                    geoJsonLayer.resetStyle(
                        layer
                    );

                }

            },


            click: function () {

                if (state) {

                    updateStatePanel(
                        state
                    );

                }

            }

        });

    }


    /*
    ----------------------------------------------------------
    Load Nigeria states GeoJSON
    ----------------------------------------------------------
    */

    fetch(
        window.INETTThemeUrl
        + '/assets/geo/nigeria-states.geojson'
    )

        .then(response => {

            if (!response.ok) {

                throw new Error(
                    'GeoJSON could not be loaded.'
                );

            }


            return response.json();

        })

        .then(geojson => {

            geoJsonLayer =
                L.geoJSON(
                    geojson,
                    {
                        style:
                            styleFeature,

                        onEachFeature:
                            onEachFeature
                    }
                )
                .addTo(map);


            /*
            Expose layer to tab system.
            */

            window.INETTEnergyGeoJsonLayer =
                geoJsonLayer;


            /*
            Initial bounds
            */

            map.fitBounds(
                geoJsonLayer.getBounds(),
                {
                    padding: [10, 10]
                }
            );


            /*
            Give browser a moment to finish
            rendering the now-visible tab.
            */

            setTimeout(
                function () {

                    map.invalidateSize(
                        true
                    );


                    map.fitBounds(
                        geoJsonLayer
                            .getBounds(),
                        {
                            padding:
                                [10, 10]
                        }
                    );

                },
                150
            );

        })

        .catch(error => {

            console.error(
                'INETT map error:',
                error
            );

        });

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

document.addEventListener(
    'DOMContentLoaded',
    function () {

        /*
        Application navigation
        */

        initEnergyTabs();


        /*
        Overview charts
        */

        initSubsectorChart();
        initStatusChart();


    }
);


})();