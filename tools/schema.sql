/* ============================================================
   INETT ENERGY DATA REPOSITORY
   Phase 1 - Energy

   Database: SQLite
   Purpose:
   Published relational repository used by the INETT Energy
   website and analytics layer.

   Source:
   INETT Energy Google Sheets / Excel workbook
   ============================================================ */

PRAGMA foreign_keys = ON;


/* ============================================================
   1. SOURCES
   Workbook: 16 Sources
   ============================================================ */

CREATE TABLE IF NOT EXISTS sources (
    source_id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    publisher TEXT,
    publication_year INTEGER,
    source_type TEXT,
    source_url TEXT,
    notes TEXT
);


/* ============================================================
   2. STATES
   Workbook: 02 Ref States

   Canonical geographic reference table.
   Includes the 36 states + FCT.
   ============================================================ */

CREATE TABLE IF NOT EXISTS states (
    state_code TEXT PRIMARY KEY,
    state_name TEXT NOT NULL UNIQUE,
    geopolitical_zone TEXT,

    state_electricity_law_enacted TEXT,
    electricity_law_year INTEGER,

    state_regulator TEXT,
    nerc_transfer_order_issued TEXT,
    current_regulatory_authority TEXT,

    integrated_energy_plan TEXT,
    serving_discos TEXT,

    electricity_access_rate REAL,
    access_rate_year INTEGER,

    clean_cooking_access_rate REAL,

    coordination_focal_point TEXT,

    notes TEXT,

    source_citation TEXT,
    source_url TEXT,
    source_type TEXT
);


/* ============================================================
   3. ENERGY FUNCTIONS
   Workbook: 03 Ref Functions

   Used for mandate / institutional responsibility analysis.
   ============================================================ */

CREATE TABLE IF NOT EXISTS functions (
    function_id TEXT PRIMARY KEY,

    function_name TEXT NOT NULL,

    primary_subsector TEXT,
    typical_value_chain_segment TEXT,

    contestation_note TEXT
);


/* ============================================================
   4. ACTORS
   Workbook: 10 Actors

   Master organisation / stakeholder registry.
   ============================================================ */

CREATE TABLE IF NOT EXISTS actors (
    actor_id TEXT PRIMARY KEY,

    organisation_name TEXT NOT NULL,
    acronym TEXT,

    actor_type TEXT,
    primary_role TEXT,

    subsector_focus TEXT,

    mandate_summary TEXT,

    governance_tier TEXT,

    state_code TEXT,

    website_url TEXT,

    source_citation TEXT,
    source_url TEXT,
    source_type TEXT,

    FOREIGN KEY (state_code)
        REFERENCES states(state_code)
);


/* ============================================================
   5. POLICIES
   Workbook: 11 Policies
   ============================================================ */

CREATE TABLE IF NOT EXISTS policies (
    policy_id TEXT PRIMARY KEY,

    instrument_name TEXT NOT NULL,
    short_name TEXT,

    instrument_type TEXT,

    legal_force TEXT,

    governance_tier TEXT,

    issuing_institution TEXT,

    implementing_institutions TEXT,

    status TEXT,

    publication_year INTEGER,

    implementation_mechanism_defined TEXT,

    monitoring_evaluation_framework TEXT,

    primary_subsector TEXT,

    implementation_note TEXT,

    source_citation TEXT,
    source_url TEXT,
    source_type TEXT
);


/* ============================================================
   6. INITIATIVES / PROJECTS
   Workbook: 12 Initiatives

   Main programme/project repository.
   ============================================================ */

CREATE TABLE IF NOT EXISTS initiatives (
    initiative_id TEXT PRIMARY KEY,

    initiative_name TEXT NOT NULL,

    record_type TEXT,

    primary_subsector TEXT,

    primary_value_chain_segment TEXT,

    primary_technology TEXT,

    grid_relationship TEXT,

    standard_status TEXT,

    status_detail TEXT,

    operational_status TEXT,

    delivery_modality TEXT,

    lead_actor_id TEXT,

    start_year INTEGER,

    end_year INTEGER,

    year_precision TEXT,

    total_value_usd REAL,

    installed_capacity_mw REAL,

    connections_targeted INTEGER,

    connections_verified INTEGER,

    scope_type TEXT,

    compact_pillar TEXT,

    etp_linkage TEXT,

    ndc_linkage TEXT,

    source_citation TEXT,
    source_url TEXT,
    source_type TEXT,

    FOREIGN KEY (lead_actor_id)
        REFERENCES actors(actor_id)
);


/* ============================================================
   7. FINANCE
   Workbook: 13 Finance

   IMPORTANT:
   Finance records are not automatically additive.

   aggregation_eligible determines whether a record may be
   included in aggregate financial totals.
   ============================================================ */

CREATE TABLE IF NOT EXISTS finance (
    finance_id TEXT PRIMARY KEY,

    description TEXT NOT NULL,

    provider_actor_id TEXT,

    funder_type TEXT,

    recipient_actor_id TEXT,

    finance_instrument TEXT,

    value_type TEXT,

    commitment_stage TEXT,

    amount_original REAL,

    currency TEXT,

    amount_usd REAL,

    fx_reference_date TEXT,

    aggregation_eligible INTEGER DEFAULT 0,

    channel TEXT,

    period_start INTEGER,

    period_end INTEGER,

    subsector TEXT,

    linked_initiative_id TEXT,

    component_of_finance_id TEXT,

    not_additive_note TEXT,

    source_citation TEXT,
    source_url TEXT,
    source_type TEXT,

    FOREIGN KEY (provider_actor_id)
        REFERENCES actors(actor_id),

    FOREIGN KEY (recipient_actor_id)
        REFERENCES actors(actor_id),

    FOREIGN KEY (linked_initiative_id)
        REFERENCES initiatives(initiative_id),

    FOREIGN KEY (component_of_finance_id)
        REFERENCES finance(finance_id)
);


/* ============================================================
   8. TARGETS
   Workbook: 14 Targets
   ============================================================ */

CREATE TABLE IF NOT EXISTS targets (
    target_id TEXT PRIMARY KEY,

    target_statement TEXT NOT NULL,

    framework TEXT,

    conditionality TEXT,

    subsector TEXT,

    indicator TEXT,

    unit TEXT,

    baseline_value REAL,

    baseline_year INTEGER,

    target_value REAL,

    target_year INTEGER,

    direction TEXT,

    data_custodian_actor_id TEXT,

    definitional_dispute TEXT,

    dispute_note TEXT,

    source_citation TEXT,
    source_url TEXT,
    source_type TEXT,

    FOREIGN KEY (data_custodian_actor_id)
        REFERENCES actors(actor_id)
);


/* ============================================================
   9. TARGET OBSERVATIONS
   Workbook: 15 Target Observations

   IMPORTANT:
   Targets define what should happen.
   Observations record what actually happened.

   Keeping these separate allows time-series analytics.
   ============================================================ */

CREATE TABLE IF NOT EXISTS target_observations (
    observation_id INTEGER PRIMARY KEY AUTOINCREMENT,

    target_id TEXT NOT NULL,

    observation_date TEXT,

    actual_value REAL,

    unit TEXT,

    verification_status TEXT,

    observation_note TEXT,

    source_citation TEXT,
    source_url TEXT,
    source_type TEXT,

    FOREIGN KEY (target_id)
        REFERENCES targets(target_id)
        ON DELETE CASCADE
);


/* ============================================================
   10. ENGAGEMENT
   Workbook: 17 Engagement
   ============================================================ */

CREATE TABLE IF NOT EXISTS engagement (
    engagement_id TEXT PRIMARY KEY,

    actor_id TEXT,

    organisation_name TEXT,

    focal_person TEXT,

    designation TEXT,

    email TEXT,

    phone TEXT,

    information_needed TEXT,

    priority TEXT,

    engagement_status TEXT,

    next_action TEXT,

    due_date TEXT,

    notes TEXT,

    FOREIGN KEY (actor_id)
        REFERENCES actors(actor_id)
);


/* ============================================================
   RELATIONSHIP TABLES
   ============================================================ */


/* ============================================================
   11. INITIATIVE LOCATION
   Workbook: 20 Initiative Location

   One initiative can operate in many states.
   One state can contain many initiatives.
   ============================================================ */

CREATE TABLE IF NOT EXISTS initiative_locations (
    initiative_id TEXT NOT NULL,

    state_code TEXT NOT NULL,

    coverage_type TEXT,

    scope_type TEXT,

    location_note TEXT,

    PRIMARY KEY (
        initiative_id,
        state_code,
        coverage_type,
        scope_type
    ),

    FOREIGN KEY (initiative_id)
        REFERENCES initiatives(initiative_id)
        ON DELETE CASCADE,

    FOREIGN KEY (state_code)
        REFERENCES states(state_code)
);


/* ============================================================
   12. INITIATIVE ACTORS
   Workbook: 21 Initiative Actor

   Represents many-to-many relationships between initiatives
   and organisations.
   ============================================================ */

CREATE TABLE IF NOT EXISTS initiative_actors (
    initiative_id TEXT NOT NULL,

    actor_id TEXT NOT NULL,

    actor_role TEXT NOT NULL,

    relationship_note TEXT,

    PRIMARY KEY (
        initiative_id,
        actor_id,
        actor_role
    ),

    FOREIGN KEY (initiative_id)
        REFERENCES initiatives(initiative_id)
        ON DELETE CASCADE,

    FOREIGN KEY (actor_id)
        REFERENCES actors(actor_id)
);


/* ============================================================
   13. INITIATIVE SUBSECTORS
   Workbook: 22 Initiative Subsector

   Allows an initiative to cover more than one subsector,
   technology or value-chain segment.
   ============================================================ */

CREATE TABLE IF NOT EXISTS initiative_subsectors (
    initiative_id TEXT NOT NULL,

    subsector TEXT NOT NULL,

    value_chain_segment TEXT,

    technology TEXT,

    PRIMARY KEY (
        initiative_id,
        subsector,
        value_chain_segment,
        technology
    ),

    FOREIGN KEY (initiative_id)
        REFERENCES initiatives(initiative_id)
        ON DELETE CASCADE
);


/* ============================================================
   14. FINANCE PARTIES
   Workbook: 23 Finance Party

   Allows a finance record to involve multiple organisations.
   ============================================================ */

CREATE TABLE IF NOT EXISTS finance_parties (
    finance_id TEXT NOT NULL,

    actor_id TEXT NOT NULL,

    party_role TEXT NOT NULL,

    relationship_note TEXT,

    PRIMARY KEY (
        finance_id,
        actor_id,
        party_role
    ),

    FOREIGN KEY (finance_id)
        REFERENCES finance(finance_id)
        ON DELETE CASCADE,

    FOREIGN KEY (actor_id)
        REFERENCES actors(actor_id)
);


/* ============================================================
   15. ACTOR FUNCTIONS
   Workbook: 25 Actor Function

   Critical table for mandate and institutional-overlap
   analytics.
   ============================================================ */

CREATE TABLE IF NOT EXISTS actor_functions (
    actor_id TEXT NOT NULL,

    function_id TEXT NOT NULL,

    primacy TEXT,

    mandate_policy_id TEXT,

    relationship_note TEXT,

    PRIMARY KEY (
        actor_id,
        function_id,
        primacy
    ),

    FOREIGN KEY (actor_id)
        REFERENCES actors(actor_id),

    FOREIGN KEY (function_id)
        REFERENCES functions(function_id),

    FOREIGN KEY (mandate_policy_id)
        REFERENCES policies(policy_id)
);


/* ============================================================
   16. POLICY SCOPE
   Workbook: 26 Policy Scope

   Connects policy instruments to energy subsectors/functions.
   ============================================================ */

CREATE TABLE IF NOT EXISTS policy_scopes (
    policy_id TEXT NOT NULL,

    subsector TEXT,

    function_id TEXT,

    scope_note TEXT,

    PRIMARY KEY (
        policy_id,
        subsector,
        function_id
    ),

    FOREIGN KEY (policy_id)
        REFERENCES policies(policy_id)
        ON DELETE CASCADE,

    FOREIGN KEY (function_id)
        REFERENCES functions(function_id)
);


/* ============================================================
   INDEXES

   These improve filtering and analytics performance.
   ============================================================ */


/* Initiatives */

CREATE INDEX IF NOT EXISTS idx_initiatives_status
ON initiatives(standard_status);

CREATE INDEX IF NOT EXISTS idx_initiatives_subsector
ON initiatives(primary_subsector);

CREATE INDEX IF NOT EXISTS idx_initiatives_actor
ON initiatives(lead_actor_id);

CREATE INDEX IF NOT EXISTS idx_initiatives_years
ON initiatives(start_year, end_year);


/* Geography */

CREATE INDEX IF NOT EXISTS idx_locations_state
ON initiative_locations(state_code);

CREATE INDEX IF NOT EXISTS idx_locations_initiative
ON initiative_locations(initiative_id);


/* Initiative Actors */

CREATE INDEX IF NOT EXISTS idx_initiative_actor_actor
ON initiative_actors(actor_id);

CREATE INDEX IF NOT EXISTS idx_initiative_actor_initiative
ON initiative_actors(initiative_id);


/* Initiative subsectors */

CREATE INDEX IF NOT EXISTS idx_initiative_subsector_name
ON initiative_subsectors(subsector);


/* Finance */

CREATE INDEX IF NOT EXISTS idx_finance_subsector
ON finance(subsector);

CREATE INDEX IF NOT EXISTS idx_finance_provider
ON finance(provider_actor_id);

CREATE INDEX IF NOT EXISTS idx_finance_recipient
ON finance(recipient_actor_id);

CREATE INDEX IF NOT EXISTS idx_finance_initiative
ON finance(linked_initiative_id);

CREATE INDEX IF NOT EXISTS idx_finance_aggregation
ON finance(aggregation_eligible);


/* Targets */

CREATE INDEX IF NOT EXISTS idx_targets_framework
ON targets(framework);

CREATE INDEX IF NOT EXISTS idx_targets_subsector
ON targets(subsector);

CREATE INDEX IF NOT EXISTS idx_target_observation_target
ON target_observations(target_id);


/* Actor Functions */

CREATE INDEX IF NOT EXISTS idx_actor_function_actor
ON actor_functions(actor_id);

CREATE INDEX IF NOT EXISTS idx_actor_function_function
ON actor_functions(function_id);


/* Policies */

CREATE INDEX IF NOT EXISTS idx_policy_status
ON policies(status);

CREATE INDEX IF NOT EXISTS idx_policy_subsector
ON policies(primary_subsector);