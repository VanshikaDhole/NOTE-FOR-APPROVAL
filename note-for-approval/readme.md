# Note For Approval (NFA) — Ariba Procurement Integration

An SAP Cloud Application Programming (CAP) service with a Fiori Elements-based UI5 front end that
digitizes a procurement "Note for Approval" (NFA) document, pulls live sourcing data from SAP Ariba,
renders a formatted approval PDF, and pushes that PDF back into an Ariba workspace as an official
document via a SOAP integration.

## 1. What this application does

A procurement user searches for or creates an NFA covering a single purchasing decision, made up of
eight sections (see [Data Model](#4-data-model)). The app then:

1. **Fetches live sourcing data from Ariba** for a given sourcing event (procurement name, strategy,
   expense category, number of suppliers invited/responded/awarded, total procurement value) and
   pre-fills the form.
2. **Persists the NFA** (all eight sections + file attachments) to a local database when the user
   submits it for approval.
3. **Generates a formatted PDF** ("Note for Approval") from the stored NFA data, including clickable
   links to any uploaded attachments.
4. **Sends that PDF into SAP Ariba** as a real document, using Ariba's `DocumentImport` SOAP service,
   attached to a specific Ariba workspace.

In short: capture procurement approval data → enrich it with live Ariba data → generate an approval
PDF → file that PDF into the corresponding Ariba workspace, without anyone touching Ariba's UI
directly.

## 2. Technical stack

| Layer            | Technology                                                                 |
|-------------------|-----------------------------------------------------------------------------|
| Backend framework | [SAP Cloud Application Programming Model (CAP)](https://cap.cloud.sap/) for Node.js, `@sap/cds` v10 |
| Runtime           | Node.js, CommonJS                                                          |
| Database          | SQLite (`@cap-js/sqlite`) — file-based, local dev/test database (`db.sqlite`) |
| OData protocol    | OData V4 (`/odata/v4/nfa`)                                                 |
| Frontend          | SAP Fiori Elements (Basic V4 template) + SAPUI5 1.150.0, generated with SAP Fiori tools App Generator |
| PDF generation    | [`pdfkit`](https://www.npmjs.com/package/pdfkit)                          |
| File attachments  | [`@cap-js/attachments`](https://www.npmjs.com/package/@cap-js/attachments) plugin, backed by AWS S3 |
| Ariba REST calls  | `axios`, OAuth2 client-credentials flow                                   |
| Ariba SOAP call   | `@sap-cloud-sdk/http-client` + `@sap-cloud-sdk/connectivity` (BTP Destination service lookup) |
| Auth (deployed)   | `@sap/xssec` / XSUAA                                                      |
| Local↔Cloud hybrid testing | `cds bind` / CAP `hybrid` profile against real BTP service instances |
| XML handling      | `fast-xml-parser` (parsing Ariba SOAP responses)                          |
| Tests             | Node's built-in `node:test` + `node:assert/strict`                        |

## 3. High-level architecture

```
┌─────────────────────────────┐
│  SAPUI5 / Fiori Elements    │   app/nfa-fiori
│  (webapp/controller/view)   │
└───────────────┬─────────────┘
                │ OData V4 (/odata/v4/nfa)
┌───────────────▼─────────────┐
│  CAP Service (NFAService)   │   srv/service.cds, srv/service.js
│  - CRUD on NFA + sections   │
│  - custom actions           │
└───┬───────────┬─────────────┘
    │           │
    │           └──────────────► srv/pdfService.js  (pdfkit → PDF Buffer)
    │
    ├──► srv/integration/ariba.js          ──► Ariba Sourcing Event REST API (OAuth2, axios)
    │
    └──► srv/integration/documentImport.js ──► Ariba DocumentImport SOAP API
                                                (via BTP Destination "NFA_BTP")

┌─────────────────────────────┐
│  SQLite (db.sqlite)         │   db/schema.cds, db/data/*.csv
└─────────────────────────────┘
```

## 4. Data model

Defined in [`db/schema.cds`](db/schema.cds), namespace `sap.capire.nfa`. The root entity `NFA` is
composed of one row in each of seven child entities plus attachments:

| Entity                         | Purpose                                                                 |
|--------------------------------|--------------------------------------------------------------------------|
| `NFA`                          | Header: NFA number, title, status                                       |
| `ProcurementOverview`          | Procurement name, Ariba sourcing event reference, objectives, background, route, strategy, expense category, file attachments |
| `MaterialHistory`              | Material code/description, quantities, last PO details, 6/12-month consumption & pricing trends |
| `SourcingVendorEvaluation`     | Vendors invited/responded/shortlisted, selected vendor, award justification |
| `CommercialSummary`            | Total procurement value, currency, secured savings, cost increase, recommendations |
| `FinalisedTermsConditions`     | Payment terms, milestones, performance bond, warranty, Incoterms, taxes  |
| `OrganisationOther`            | Purchasing group, company code, other conditions, supporting documents   |
| `EKKO_PurchaseOrder_Header`    | SAP PO header fields (mirrors SAP `EKKO`)                                |
| `EKPO_PurchaseOrder_Item`      | SAP PO item fields (mirrors SAP `EKPO`)                                  |
| `attachments`                  | File attachments on `ProcurementOverview`, managed by `@cap-js/attachments` |

All entities use CAP's `cuid` (UUID key) and `managed` (createdAt/modifiedAt/By) aspects.

## 5. Service API (`srv/service.cds`)

Exposed as OData service `NFAService` at `/odata/v4/nfa`.

**Entities** — plain CRUD projections over every schema entity above.

**Actions:**

| Action                  | Input                              | Output                    | What it does |
|--------------------------|-------------------------------------|----------------------------|---------------|
| `submitNFA`              | `data: LargeString` (JSON payload)  | `{ message, nfaID, procurementID }` | Parses the JSON, generates an `NFA-<timestamp>` number, and inserts all eight sections in one transaction |
| `searchExistingNFA`      | `nfaNumber: String`                 | Full NFA + all sections + attachments | Looks up a previously submitted NFA by its human-readable number |
| `getProcurementDetails`  | `eventId: String`                   | `ProcurementResponse` (name, strategy, expense category, vendor counts, total value, currency) | Live-fetches sourcing event data directly from Ariba's REST APIs |
| `generatePDF`            | `ID: UUID`                          | `LargeBinary` (PDF bytes)  | Loads an NFA's sections + attachments from the DB and renders the approval PDF |
| `importDocument`         | `ID: UUID`, `workspaceId: String`   | `DocumentImportResponse` (`documentId`, `status`, `errorMessage`) | Regenerates the PDF and sends it to the given Ariba workspace via SOAP `DocumentImport` |

## 6. Ariba integrations (two independent mechanisms)

This project talks to Ariba in **two different ways**, each with its own credentials and transport:

### a) Sourcing Event REST API — `srv/integration/ariba.js`

- Plain `axios` calls to Ariba's Sourcing Event OpenAPI (`ARIBA_EVENT_URL`).
- Auth: OAuth2 client-credentials grant against `ARIBA_TOKEN_URL` using `ARIBA_CLIENT_ID` /
  `ARIBA_CLIENT_SECRET` from `.env`.
- Used by `getProcurementDetails` to pull: event details, supplier invitations, bid summary, awards,
  and item/cost totals — all merged into one response for the UI to pre-fill the form.
- Configuration lives entirely in environment variables (`.env`): `ARIBA_TOKEN_URL`,
  `ARIBA_EVENT_URL`, `ARIBA_CLIENT_ID`, `ARIBA_CLIENT_SECRET`, `ARIBA_API_KEY`, `ARIBA_REALM`,
  `ARIBA_USER`, `ARIBA_PASSWORD_ADAPTER`.

### b) DocumentImport SOAP API — `srv/integration/documentImport.js`

- Builds a raw SOAP envelope (WSDL operation `DocumentImport`) and posts it with
  `@sap-cloud-sdk/http-client`'s `executeHttpRequest`.
- Auth/routing is **not** taken from `.env` — it is resolved at runtime from a named **BTP
  Destination** called `NFA_BTP` (kind `HTTP`, Basic Authentication), via the SAP Cloud SDK's
  destination lookup.
- The destination is provided by a BTP **Destination service** instance (`nfa_destination`) and, for
  local development, an SAP CAP **`hybrid` profile** binds to that same real Cloud Foundry service
  instance so destination resolution works outside of a full Cloud Foundry deployment.
- Used by `importDocument` to actually create/update a document on an Ariba workspace
  (`WSDocumentInputBean_Item`), carrying the generated PDF as Base64 `Contents`.

> Because this uses two separate configuration mechanisms, **the REST calls (`getProcurementDetails`)
> can work locally with just `.env`, while `importDocument` requires the CAP `hybrid` profile to be
> active** (see [Running locally](#8-running-locally) below) — otherwise it fails with
> `502 Failed to load destination`.

## 7. Frontend (`app/nfa-fiori`)

- SAP Fiori Elements app (Basic V4 template), generated with the SAP Fiori tools App Generator,
  module name `nfa-fiori`, title "NFA-APP", theme `sap_horizon`.
- Custom logic lives in `webapp/controller/NFAview.controller.js`:
  - `onFetchProcurementData` — calls `getProcurementDetails` to pull live Ariba data into the form.
  - `onSearchExistingNFA` — looks up a previously submitted NFA by number.
  - `onSubmitForApproval` — serializes the whole form and calls `submitNFA`.
  - `onFileChange` / `onRemoveAttachment` — manage file attachments on the Procurement Overview
    section.
  - `onImportDocument` — prompts for an Ariba Workspace ID in a dialog, then calls the `importDocument`
    OData action to send the generated PDF to that workspace.
  - PDF download handler — calls `generatePDF` and downloads the resulting file client-side.
- Served at `http://localhost:4004/nfa-fiori/webapp/index.html` when running locally.

## 8. Running locally

### Prerequisites
- Node.js LTS
- Access to the `BrainBoxDSAPP-T` Ariba realm credentials (`.env`)
- For the "send to Ariba" (`importDocument`) feature only: Cloud Foundry CLI logged in to the
  `9df0cc77trial` org / `dev` space (`cf login`), since that's where the `nfa_destination` and
  `nfa_auth` service instances live.

### Install
```bash
npm install
```

### Environment variables (`.env`)
```
ARIBA_CLIENT_ID=...
ARIBA_CLIENT_SECRET=...
ARIBA_REALM=BrainBoxDSAPP-T
ARIBA_USER=...
ARIBA_PASSWORD_ADAPTER=PasswordAdapter1
ARIBA_TOKEN_URL=https://api.ariba.com/v2/oauth/token
ARIBA_EVENT_URL=https://openapi.ariba.com/api/sourcing-event/v2/prod/events
ARIBA_API_KEY=...
ARIBA_USER_DESIGNATION=...
ARIBA_PARTITION=prealm_1983
ARIBA_VARIANT=vrealm_1983
```

### One-time: bind the hybrid profile (only needed for `importDocument` / send-to-Ariba)
```bash
cds bind destinations --to nfa_destination:nfa_destination-key --kind destination --for hybrid
cds bind auth --to nfa_auth:nfa_auth_key --kind xsuaa --for hybrid
```
This stores binding *references* (not secrets) in `.cdsrc-private.json`; credentials are fetched
live from Cloud Foundry each time the server starts.

### Start the app
```bash
npm run watch-nfa-fiori
```
This runs `cds watch --profile hybrid` and opens the Fiori app in the browser. The `--profile hybrid`
flag is **required** for the `importDocument` action to resolve the `NFA_BTP` destination — running
plain `cds watch` will cause that action to fail with `502 Failed to load destination`.

### Tests
```bash
npm test
```
Runs `node --test test/*.test.js` (currently covers the SOAP envelope building/parsing logic in
`srv/integration/documentImport.js`).

## 9. Project structure

```
note-for-approval/
├── app/
│   └── nfa-fiori/                  Fiori Elements UI5 app
│       └── webapp/
│           ├── controller/NFAview.controller.js
│           └── view/NFAview.view.xml
├── db/
│   ├── schema.cds                  Data model (NFA + 7 sections + attachments)
│   └── data/*.csv                  Seed data for local SQLite
├── srv/
│   ├── service.cds                 OData service definition + actions
│   ├── service.js                  Action implementations
│   ├── pdfService.js               PDF rendering (pdfkit)
│   ├── payload.js                  (currently unused/commented out)
│   ├── emailService.js             (currently unused/commented out)
│   └── integration/
│       ├── ariba.js                Ariba Sourcing Event REST client (OAuth2)
│       └── documentImport.js       Ariba DocumentImport SOAP client (BTP destination)
├── test/
│   └── documentImport.test.js
├── .cdsrc-private.json             hybrid-profile service bindings (no secrets)
├── .env                             Ariba REST credentials/config
└── package.json
```

## 10. Known gaps / things to be aware of

- `srv/payload.js` and `srv/emailService.js` are fully commented out — a CPI payload builder and a
  test-mail sender that aren't currently wired into any service action.
- Attachment download links generated in the PDF are hardcoded to `http://localhost:4004`
  ([`srv/pdfService.js`](srv/pdfService.js#L292-L295)) — needs to become environment-driven before a
  real cloud deployment.
- No `mta.yaml`/deployment descriptor is present yet; deploying to Cloud Foundry will additionally
  require binding the `nfa_destination` and `nfa_auth` service instances to the deployed application
  (not just the local `hybrid` profile).
- `NFA_BTP` destination (BTP Destination service) points at
  `https://s1.ariba.com/Sourcing/soap/BrainBoxDSAPP-T/DocumentImport` using Basic Authentication —
  this is a live Ariba endpoint, not a sandbox, so `importDocument` calls have real effects in that
  Ariba realm/workspace.
