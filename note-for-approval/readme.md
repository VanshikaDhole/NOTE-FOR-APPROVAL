# Note For Approval (NFA) — Ariba Procurement Integration

An SAP Cloud Application Programming (CAP) service with a freestyle SAPUI5 (Fiori) front end that
digitizes a procurement "Note for Approval" (NFA) document, pulls live sourcing data from SAP Ariba,
renders a formatted approval PDF, and pushes that PDF back into an Ariba workspace as an official
document via a SOAP integration. The application can run locally (SQLite) or be deployed to SAP BTP
Cloud Foundry as a multi-target application (SAP HANA Cloud, XSUAA, approuter, HTML5 repository).

## Table of contents

1. [What this application does](#1-what-this-application-does)
2. [Technical stack](#2-technical-stack)
3. [High-level architecture](#3-high-level-architecture)
4. [Data model](#4-data-model)
5. [Service API](#5-service-api-srvservicecds)
6. [Ariba integrations](#6-ariba-integrations-two-independent-mechanisms)
7. [PDF generation](#7-pdf-generation-srvpdfservicejs)
8. [Frontend](#8-frontend-appnfa-fiori)
9. [Configuration reference](#9-configuration-reference)
10. [Running locally](#10-running-locally)
11. [Building and deploying to Cloud Foundry](#11-building-and-deploying-to-cloud-foundry)
12. [Security and authentication](#12-security-and-authentication)
13. [Project structure](#13-project-structure)
14. [Troubleshooting](#14-troubleshooting)
15. [Known gaps / things to be aware of](#15-known-gaps--things-to-be-aware-of)

## 1. What this application does

A procurement user creates an NFA covering a single purchasing decision, made up of eight sections
(see [Data Model](#4-data-model)), or looks up an existing one. The app then:

1. **Fetches live sourcing data from Ariba** for a given sourcing event: procurement name, Ariba
   workspace (parent project) ID, strategy, expense category, number of suppliers
   invited/responded/awarded, and total procurement value. It uses this data to pre-fill the form.
2. **Persists the NFA** (all eight sections) to the database when the user submits it for approval,
   then uploads any file attachments.
3. **Generates a formatted PDF** ("Note for Approval") from the NFA data, including clickable links
   to uploaded attachments.
4. **Sends that PDF into SAP Ariba** as a real document attached to the event's Ariba workspace,
   using Ariba's `DocumentImport` SOAP service. This happens **automatically on submit**, and can
   also be triggered **manually** for an existing NFA, to any workspace ID.
5. **Lists all NFAs** with filters (number, title, status, creator, creation date range). Clicking a
   row opens its PDF in a new browser tab.

In short: capture procurement approval data → enrich it with live Ariba data → generate an approval
PDF → file that PDF into the corresponding Ariba workspace, without anyone touching Ariba's UI
directly.

### End-to-end flow (Create NFA)

```
User enters Ariba Sourcing Event ID
        │  (change event)
        ▼
getProcurementDetails ──► Ariba REST: event, supplierInvitations, bidSummary, awards, items
        │
        ▼
Form pre-filled (incl. hidden workspaceId = event.parentProjectId)
        │
User completes remaining sections, adds attachments, clicks "Submit for Approval"
        │
        ▼
submitNFA
  ├─ validate workspaceId (400 if missing)
  ├─ INSERT NFA (status "Submitted", number NFA-<timestamp>) + 8 sections, then commit
  ├─ generatePDF (from submitted payload)
  └─ importDocument ──► Ariba SOAP DocumentImport (Create, "<folder>/<NFA number>.pdf")
        │
        ▼
UI uploads each attachment: POST /attachments → PUT /attachments(...)/content
```

## 2. Technical stack

| Layer                      | Technology |
|----------------------------|------------|
| Backend framework          | [SAP Cloud Application Programming Model (CAP)](https://cap.cloud.sap/) for Node.js, `@sap/cds` v10 |
| Runtime                    | Node.js, CommonJS |
| Database (development)     | SQLite (`@cap-js/sqlite`), file `db.sqlite` |
| Database (production)      | SAP HANA Cloud HDI container (`@cap-js/hana`) |
| OData protocol             | OData V4 (`/odata/v4/nfa`) |
| Frontend                   | Freestyle SAPUI5 app (SAP Fiori tools "basic" template, `minUI5Version` 1.150.0), served in dev by `cds-plugin-ui5` |
| PDF generation             | [`pdfkit`](https://www.npmjs.com/package/pdfkit) |
| File attachments           | [`@cap-js/attachments`](https://www.npmjs.com/package/@cap-js/attachments) plugin |
| Ariba REST calls           | `axios`, OAuth2 client-credentials flow, config from `.env` via `dotenv` |
| Ariba SOAP call            | `@sap-cloud-sdk/http-client` + `@sap-cloud-sdk/connectivity` (BTP Destination service lookup) |
| XML handling               | `fast-xml-parser` (parsing Ariba SOAP responses) |
| Auth (deployed)            | XSUAA (`xs-security.json`), `@sap/approuter` v22, `@sap/xssec` |
| Local↔Cloud hybrid testing | `cds bind` / CAP `hybrid` profile against real BTP service instances |
| Build / deploy             | MTA (`mta.yaml`), Cloud MTA Build Tool (`mbt`), `cf deploy` |
| UI build                   | `@ui5/cli` + `ui5-task-zipper` (`ui5-deploy.yaml`) |
| Tests                      | Node's built-in `node:test` + `node:assert/strict` |

## 3. High-level architecture

### Local / hybrid

```
┌─────────────────────────────┐
│  SAPUI5 app (nfafiori)      │   app/nfa-fiori/webapp
│  NFAview view + controller  │   served by cds-plugin-ui5 at /nfafiori
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
         srv/integration/documentPath.js        (via BTP Destination "NFA_BTP")

┌─────────────────────────────┐
│  SQLite (db.sqlite)         │   db/schema.cds
└─────────────────────────────┘
```

### Deployed (Cloud Foundry)

```
Browser
  │
  ▼
note-for-approval (approuter, app/router)  ── XSUAA login (note-for-approval-auth)
  │                     │
  │ /odata/v4/nfa/*     │ everything else
  ▼                     ▼
srv-api destination     html5-apps-repo-rt (app-runtime) ──► nfafiori.zip in html5-apps-repo (app-host)
  │
  ▼
note-for-approval-srv (CAP, gen/srv)
  ├──► note-for-approval-db (HANA HDI container, deployed by note-for-approval-db-deployer)
  ├──► note-for-approval-destination-service ──► NFA_BTP ──► Ariba DocumentImport SOAP
  └──► Ariba Sourcing Event REST API (env variables)
```

## 4. Data model

Defined in [db/schema.cds](db/schema.cds), namespace `sap.capire.nfa`. The root entity `NFA` is
composed of exactly one row in each of eight child entities. File attachments hang off
`ProcurementOverview`:

| Entity                         | Purpose |
|--------------------------------|---------|
| `NFA`                          | Header: `nfaNumber` (`NFA-<epoch ms>`), `title` (= procurement name), `status` |
| `ProcurementOverview`          | Procurement name, Ariba sourcing event reference, **`workspaceId`** (Ariba parent project), objectives, background, route, strategy, expense category, `attachments` |
| `MaterialHistory`              | Material code/description, quantities, awarded unit price, last PO details, 6/12-month consumption & pricing trends, stock cover, price justification |
| `SourcingVendorEvaluation`     | Vendors invited/responded/shortlisted, evaluation summary, number of vendors selected, selected vendor, award justification |
| `CommercialSummary`            | Total procurement value, currency, secured savings, cost increase, recommendations |
| `FinalisedTermsConditions`     | Payment terms, milestones, performance bond, warranty, terms of delivery, Incoterms, liquidated damages, taxes |
| `OrganisationOther`            | Purchasing group, company code, other conditions, supporting documents |
| `EKKO_PurchaseOrder_Header`    | SAP PO header fields (mirrors SAP table `EKKO`) |
| `EKPO_PurchaseOrder_Item`      | SAP PO item fields (mirrors SAP table `EKPO`) |
| `ProcurementOverview.attachments` | File attachments, managed by `@cap-js/attachments` (`Composition of many Attachments`) |

All entities use CAP's `cuid` (UUID key) and `managed` (`createdAt`/`createdBy`/`modifiedAt`/`modifiedBy`)
aspects. Child entities link back to the header through `nfa_ID`.

**NFA status values.** `submitNFA` always writes `Submitted`. The UI filter also offers `Draft`,
`In Review`, `Approved` and `Rejected`, but no code currently sets these. They are reserved for a
future approval workflow.

**Sample data.** Sample CSV files exist in `db/data1/`. CAP only auto-loads CSVs from `db/data/` (or
`db/csv/`), so these files are **not** loaded. To use them, rename the folder to `db/data`.

## 5. Service API (`srv/service.cds`)

Exposed as OData V4 service `NFAService` at `/odata/v4/nfa`.

**Entities:** plain CRUD projections over every schema entity above, plus `attachments` (projection
on `ProcurementOverview.attachments`, used by the UI to upload and download file contents).

**Actions:**

| Action                  | Input                              | Output | What it does |
|-------------------------|------------------------------------|--------|--------------|
| `getProcurementDetails` | `eventId: String`                  | `ProcurementResponse` | Live-fetches sourcing event data from Ariba's REST APIs (event, supplier invitations, bid summary, awards, items) and merges it into one object. Awards and items are optional: if those calls fail, defaults (`0` / empty) are returned. |
| `submitNFA`             | `data: LargeString` (JSON payload) | `SubmitResponse { message, nfaID, procurementID }` | Validates that `procurement.workspaceId` is present (**400** otherwise). Generates `NFA-<timestamp>` and inserts the header + all eight sections in one transaction. After the commit, it generates the PDF and **imports it into the Ariba workspace**. |
| `searchExistingNFA`     | `nfaNumber: String`                | NFA header + all sections + `procurement.attachments` | Looks up a previously submitted NFA by its human-readable number (**404** if not found). |
| `generatePDF`           | `ID: UUID`                         | `LargeBinary` (PDF bytes) | Loads an NFA's sections + attachments from the DB and renders the approval PDF. |
| `importDocument`        | `ID: UUID`, `workspaceId: String`  | `DocumentImportResponse { documentId, status, errorMessage }` | Manual re-send: loads the NFA, regenerates the PDF and sends it to the given Ariba workspace via SOAP `DocumentImport` (`Create`). **400** if an input is missing, **404** if the NFA is unknown, Ariba errors are surfaced as **502**. |

### `submitNFA` payload shape

```json
{
  "procurement":              { "procurementName": "...", "aribaSourcingEventRef": "Doc123", "workspaceId": "WS456", "...": "..." },
  "materialHistory":          { "...": "..." },
  "sourcingVendorEvaluation": { "...": "..." },
  "commercialSummary":        { "...": "..." },
  "finalisedTermsConditions": { "...": "..." },
  "organisationOther":        { "...": "..." },
  "purchaseOrderHeader":      { "...": "..." },
  "purchaseOrderItem":        { "...": "..." }
}
```

Each section object is spread directly into an `INSERT` for the matching entity, so its keys must be
the entity's element names from `db/schema.cds`.

### Attachment upload (two-step, done by the UI after `submitNFA`)

1. `POST /odata/v4/nfa/attachments` with `{ up__ID: <procurementID>, filename, mimeType }`
2. `PUT /odata/v4/nfa/attachments(up__ID=<procurementID>,ID=<attachmentID>)/content` with the raw file body

Download uses `GET` on the same `/content` URL.

## 6. Ariba integrations (two independent mechanisms)

This project talks to Ariba in **two different ways**, each with its own credentials and transport.

### a) Sourcing Event REST API — `srv/integration/ariba.js`

- Plain `axios` calls to Ariba's Sourcing Event OpenAPI (`ARIBA_EVENT_URL`).
- Auth: OAuth2 client-credentials grant against `ARIBA_TOKEN_URL` using `ARIBA_CLIENT_ID` /
  `ARIBA_CLIENT_SECRET`. Each request also sends the `apikey` header (`ARIBA_API_KEY`) and the query
  parameters `realm`, `user`, `passwordAdapter`.
- A new token is requested for every call (no token caching).

| Function                 | Ariba endpoint                          | Mapped result |
|--------------------------|-----------------------------------------|---------------|
| `getProcurementDetails`  | `GET {events}/{eventId}`                | `title` → procurementName, `internalId` → aribaSourcingEventRef, `parentProjectId` → **workspaceId**, `eventTypeName` → procurementStrategy, first commodity name → expenseCategory, `description` → procurementObjectives, `status` → procurementBackground |
| `getSupplierInvitations` | `GET {events}/{eventId}/supplierInvitations` | `payload.length` → noOfVendorsInvited |
| `getBidSummary`          | `GET {events}/{eventId}/bidSummary`     | `participatedCount` → vendorsResponded |
| `getAwards`              | `GET {events}/{eventId}/awards`         | count of `supplierBids[].isAward === true` → numberOfVendorsSelected |
| `getItems`               | `GET {events}/{eventId}/items?dataFetchMode=DETAIL` | term titled `"Total Cost"` → totalValueOfProcurement + currency |
| `getProcurementEvents`   | `GET {events}`                          | list of events (exported, not used by any action) |

### b) DocumentImport SOAP API — `srv/integration/documentImport.js`

- Builds a raw SOAP envelope for the `DocumentImport` operation (WSDL kept for reference in
  [srv/external/DocumentImport.wsdl](srv/external/DocumentImport.wsdl)). It posts the envelope with
  `@sap-cloud-sdk/http-client`'s `executeHttpRequest`, using the `SOAPAction: /Process Definition` header.
- Auth and routing do **not** come from `.env`. They are resolved at runtime from a **BTP
  Destination** named `NFA_BTP` (type `HTTP`, Basic Authentication) through the SAP Cloud SDK's
  destination lookup.
- The destination comes from the BTP Destination service instance
  `note-for-approval-destination-service`. Locally, the CAP `hybrid` profile binds to that same
  Cloud Foundry service instance. In the cloud, the instance is bound to `note-for-approval-srv`
  through `mta.yaml`.
- The envelope carries a `WSDocumentInputBean_Item` with `Action` (`Create`/`Update`), the PDF as
  Base64 `Contents`, `DocumentId`, `DocumentName`, `OnBehalfUserId` (`ARIBA_USER_DESIGNATION`),
  `OnBehalfUserPasswordAdapter`, and `WorkspaceId`. `partition`/`variant` are sent both as SOAP
  headers and as attributes.
- Input validation: `Action` must be `Create` or `Update`. `Create` requires `DocumentName`. `Update`
  requires `DocumentId` or `DocumentName`. `Contents` must be a Buffer or valid Base64. All values
  are XML-escaped.
- Response parsing: a SOAP `Fault` becomes an error with status **502**. A normal reply is mapped
  from `WSDocumentOutputBean_Item` to `{ documentId, status, errorMessage }`.

### c) Document name / folder — `srv/integration/documentPath.js`

`buildDocumentName(folder, file)` joins the Ariba folder and file name into `"<folder>/<file>"` and
trims stray slashes. The folder comes from `ARIBA_NFA_FOLDER_NAME`, default `"NFA Document"`. The
file name is `<nfaNumber>.pdf`. The document is therefore created inside that folder of the target
workspace.

> Because the two integrations use separate configuration mechanisms, **`getProcurementDetails` works
> locally with just `.env`**. Anything that sends a PDF to Ariba (`submitNFA` and `importDocument`)
> needs the `NFA_BTP` destination to resolve, which means the CAP `hybrid` profile locally (see
> [Running locally](#10-running-locally)). Without it, these calls fail with
> `502 Failed to load destination`.

## 7. PDF generation (`srv/pdfService.js`)

- `generatePDF(data)` builds the document with `pdfkit` in memory and resolves to a `Buffer`.
- Input: the eight section objects (`procurement`, `materialHistory`, `sourcingVendorEvaluation`,
  `commercialSummary`, `finalisedTermsConditions`, `organisationOther`, `purchaseOrderHeader`,
  `purchaseOrderItem`) plus an optional `attachments` array.
- When attachments are passed, each one is rendered as a clickable link to its OData `/content` URL.
- Callers:
  - `generatePDF` action: includes attachments from the DB.
  - `submitNFA`: built from the submitted payload. Attachments are uploaded *after* submit, so they
    are not in this PDF.
  - `importDocument`: built from the DB, currently without attachments.

## 8. Frontend (`app/nfa-fiori`)

- Freestyle SAPUI5 app, generated with the SAP Fiori tools App Generator ("basic" template). The
  app ID / module is `nfafiori`, the root view is `App`, and a single routed view is `NFAview`.
  Custom styling is in `webapp/css/style.css`.
- The default model is the OData V4 `mainService` (`/odata/v4/nfa/`). Form state lives in a JSON
  model `viewModel`, and attachments in a JSON model `attachments`.
- Cross-navigation inbound `NFA_SEMANTIC-Display` is declared in `manifest.json` for Fiori Launchpad
  / SAP Build Work Zone integration.

### Tabs

| Tab              | Contents |
|------------------|----------|
| **List of NFA**  | Table bound to `/NFA` with filters for NFA Number (contains), Title (contains), Status (equals), Created By (contains), and Created On from/to (date range on `createdAt`). Has **Search** and **Reset** buttons. Clicking a row generates and opens that NFA's PDF in a new tab. |
| **Create NFA**   | Eight form sections plus a file uploader. Entering the *Ariba Sourcing Event Ref* triggers the Ariba fetch. **Submit for Approval** saves the NFA, sends the PDF to Ariba, then uploads attachments. A "Save Draft" button exists in the view but is commented out. |
| **Existing NFA** | Search by NFA number. Shows all sections read-only, with attachment links. **Download PDF** and **Import to Ariba** buttons. |

### Controller handlers (`webapp/controller/NFAview.controller.js`)

| Handler                  | What it does |
|--------------------------|--------------|
| `onFetchProcurementData` | Calls `getProcurementDetails` and pre-fills procurement, vendor counts, total value/currency and the workspace ID |
| `onSubmitForApproval`    | Serializes all sections, calls `submitNFA`, then uploads each attachment (create record + `PUT` content) |
| `onFileChange` / `onRemoveAttachment` | Add files to, or remove them from, the local attachment list (deduplicated by name+size+lastModified) |
| `onSearchNFAList` / `onResetNFAFilters` | Apply or clear OData filters on the NFA list table |
| `onNFAListSelect`        | Opens a placeholder tab first (to avoid popup blockers), calls `generatePDF`, and shows the PDF in that tab |
| `onSearchExistingNFA`    | Calls `searchExistingNFA` and fills the read-only view. Remembers the selected NFA ID/number |
| `onOpenAttachment`       | Opens an attachment's `/content` URL in a new tab |
| `onDownloadPDF`          | Calls `generatePDF` and downloads `NFA-<number>.pdf` |
| `onImportDocument`       | Dialog asking for an Ariba Workspace ID, then calls `importDocument` for the selected NFA |

### URLs

- Local: `http://localhost:4004/nfafiori/index.html`
- Deployed: the approuter's URL. Its welcome file is `/nfafiori/index.html`.

## 9. Configuration reference

### Environment variables (`.env`, loaded by `dotenv`)

| Variable                 | Used by | Meaning |
|--------------------------|---------|---------|
| `ARIBA_TOKEN_URL`        | REST    | OAuth2 token endpoint, e.g. `https://api.ariba.com/v2/oauth/token` |
| `ARIBA_EVENT_URL`        | REST    | Sourcing Event API base, e.g. `https://openapi.ariba.com/api/sourcing-event/v2/prod/events` |
| `ARIBA_CLIENT_ID` / `ARIBA_CLIENT_SECRET` | REST | OAuth2 client credentials |
| `ARIBA_API_KEY`          | REST    | Ariba developer portal application key (`apikey` header) |
| `ARIBA_REALM`            | REST    | Ariba realm, e.g. `BrainBoxDSAPP-T` |
| `ARIBA_USER`             | REST    | Ariba user the API acts as |
| `ARIBA_PASSWORD_ADAPTER` | REST + SOAP | Ariba password adapter, e.g. `PasswordAdapter1` |
| `ARIBA_USER_DESIGNATION` | SOAP    | `OnBehalfUserId` for DocumentImport |
| `ARIBA_PARTITION`        | SOAP    | Ariba partition, e.g. `prealm_1983` |
| `ARIBA_VARIANT`          | SOAP    | Ariba variant, e.g. `vrealm_1983` |
| `ARIBA_NFA_FOLDER_NAME`  | SOAP    | Folder in the Ariba workspace for NFA PDFs (default `NFA Document`) |

Example:

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
ARIBA_NFA_FOLDER_NAME=NFA Document
```

> `.env` is **not** a Cloud Foundry mechanism. For a deployed app, set these values as user-provided
> environment variables (`cf set-env note-for-approval-srv ...`, or `properties:` in `mta.yaml`).

### BTP destination `NFA_BTP`

Create it in the subaccount (or at destination-service instance level). It is **not** created by
`mta.yaml`.

| Property       | Value |
|----------------|-------|
| Name           | `NFA_BTP` |
| Type           | `HTTP` |
| URL            | `https://s1.ariba.com/Sourcing/soap/BrainBoxDSAPP-T/DocumentImport` |
| Proxy Type     | `Internet` |
| Authentication | `BasicAuthentication` (Ariba web-service user / password) |

### CAP profiles (`package.json` → `cds.requires`)

| Profile         | Database | Auth |
|-----------------|----------|------|
| `[development]` | SQLite file `db.sqlite` | CAP default (mocked) |
| `[hybrid]`      | as development, plus bound destination service from `.cdsrc-private.json` | CAP default |
| `[production]`  | SAP HANA (`hana`) | `dummy` (see [Security](#12-security-and-authentication)) |

## 10. Running locally

### Prerequisites

- Node.js LTS and `npm`
- `@sap/cds-dk` (installed as a dev dependency. A global install `npm i -g @sap/cds-dk` gives you `cds` on the PATH)
- Ariba credentials for the `BrainBoxDSAPP-T` realm (`.env`)
- For anything that sends a PDF to Ariba (`submitNFA`, `importDocument`): Cloud Foundry CLI logged in
  to org `BrainBox Consulting BV_BrainboxConsultingIG`, space `dev`, API
  `https://api.cf.eu10-005.hana.ondemand.com`. That space hosts the
  `note-for-approval-destination-service` instance.

### Install

```bash
npm install
```

This also installs the `app/*` workspaces (UI app and approuter).

### One-time: bind the hybrid profile

```bash
cf login -a https://api.cf.eu10-005.hana.ondemand.com
cds bind destinations --to note-for-approval-destination-service:note-for-approval-destination-service-key --kind destination --for hybrid
```

This stores binding *references* (not secrets) in `.cdsrc-private.json` (git-ignored). Credentials
are fetched live from Cloud Foundry each time the server starts.

### Start the app

```bash
npm run watch-nfa-fiori
```

This runs `cds watch --profile hybrid` and opens `nfafiori/index.html` in the browser. The
`--profile hybrid` flag is **required** for `NFA_BTP` to resolve. With plain `cds watch`, submitting
an NFA or importing a document fails with `502 Failed to load destination`.

Other scripts:

| Script          | Command |
|-----------------|---------|
| `npm start`     | `cds-serve` (production-style start, used on Cloud Foundry) |
| `npm test`      | `node --test test/*.test.js` |
| `npm run build` | `rimraf resources mta_archives && mbt build --mtar archive` |
| `npm run deploy`   | `cf deploy mta_archives/archive.mtar --retries 0` |
| `npm run undeploy` | `cf undeploy note-for-approval --delete-services --delete-service-keys --delete-service-brokers` |

### Tests

```bash
npm test
```

[test/documentImport.test.js](test/documentImport.test.js) covers the SOAP layer without network
access:

- the envelope maps the WSDL fields and XML-escapes values
- a successful `DocumentImport` reply is parsed into `{ documentId, status, errorMessage }`
- `importDocument` calls the `NFA_BTP` destination with the expected `SOAPAction`

## 11. Building and deploying to Cloud Foundry

### Prerequisites

- Cloud Foundry CLI with the **MultiApps plugin** (`cf install-plugin multiapps`)
- A SAP HANA Cloud instance running in the target space (for the `hdi-shared` container)
- Entitlements for: `xsuaa` (application), `html5-apps-repo` (app-host, app-runtime),
  `destination` (lite), `hana` (hdi-shared)
- The `NFA_BTP` destination created (see [Configuration reference](#btp-destination-nfa_btp))

### Build and deploy

```bash
npm run build     # npm ci + cds build --production, UI build, packs mta_archives/archive.mtar
npm run deploy    # cf deploy mta_archives/archive.mtar
```

After deploying, provide the Ariba REST environment variables to `note-for-approval-srv` (see
[Configuration reference](#9-configuration-reference)) and restage the app.

### MTA modules (`mta.yaml`)

| Module                          | Type | Purpose |
|---------------------------------|------|---------|
| `note-for-approval-srv`         | `nodejs` (`gen/srv`) | CAP backend. Provides `srv-api`. Bound to db, auth, destination |
| `note-for-approval-db-deployer` | `hdb` (`gen/db`) | Deploys the schema into the HDI container |
| `nfafiori`                      | `html5` (`app/nfa-fiori`) | UI built with `npm run build:cf` → `nfafiori.zip` |
| `note-for-approval-app-content` | `com.sap.application.content` | Uploads `nfafiori.zip` to the HTML5 app repository |
| `note-for-approval`             | `approuter.nodejs` (`app/router`) | Entry point. XSUAA login, routes OData to `srv-api` and everything else to the HTML5 repo |

### MTA resources

| Resource                                | Service / plan |
|-----------------------------------------|----------------|
| `note-for-approval-auth`                | `xsuaa` / `application` (config from `xs-security.json`, `xsappname: note-for-approval-${org}-${space}`) |
| `note-for-approval-db`                  | `hana` / `hdi-shared` |
| `note-for-approval-repo-host`           | `html5-apps-repo` / `app-host` |
| `note-for-approval-html5-runtime`       | `html5-apps-repo` / `app-runtime` |
| `note-for-approval-destination-service` | `destination` / `lite`. Creates destinations `ui5` (https://ui5.sap.com) and `srv-api` (`OAuth2UserTokenExchange`) |

### Routing

- [app/router/xs-app.json](app/router/xs-app.json) is the approuter. `^/odata/v4/nfa/(.*)$` goes to
  the `srv-api` destination. Everything else goes to `html5-apps-repo-rt`. The welcome file is
  `/nfafiori/index.html`.
- [app/nfa-fiori/xs-app.json](app/nfa-fiori/xs-app.json) is packed into the UI zip. It routes OData
  to `srv-api` (xsuaa), `/resources` and `/test-resources` to the `ui5` destination, and the rest to
  the HTML5 repo (xsuaa).

### Undeploy

```bash
npm run undeploy
```

This removes the apps **and** their services, service keys and HDI container, including all stored
NFA data.

## 12. Security and authentication

- **XSUAA** ([xs-security.json](xs-security.json)): `tenant-mode: dedicated`, with redirect URIs for
  `*.cfapps.*.hana.ondemand.com`, Launchpad / Work Zone hosts and `localhost`. **No scopes, role
  templates or role collections are defined yet**, so any authenticated user of the subaccount has
  full access.
- **Approuter** enforces XSUAA login on the deployed URL and forwards the user token to the backend
  (`forwardAuthToken: true`).
- **CAP backend** runs with `auth.kind: dummy` in production. This means the CAP service itself does
  not check the JWT, and requests sent straight to the `note-for-approval-srv` URL (bypassing the
  approuter) are not authenticated. Before production use, switch this to `xsuaa` and add
  `@requires` / `@restrict` annotations.
- CSRF protection is disabled on the OData routes (`csrfProtection: false`).
- Secrets: Ariba REST credentials live in `.env`. The SOAP Basic-auth credentials live only in the
  BTP destination. `.cdsrc-private.json` holds binding references only. **Make sure `.env` is never
  committed**: it is not listed in `.gitignore`.

## 13. Project structure

```
note-for-approval/
├── app/
│   ├── services.cds                  Pulls in UI annotations
│   ├── nfa-fiori/                    SAPUI5 app "nfafiori"
│   │   ├── annotations.cds
│   │   ├── ui5.yaml / ui5-deploy.yaml  Dev / CF build config (zipper task)
│   │   ├── xs-app.json               Routes packed with the UI for the HTML5 repo
│   │   └── webapp/
│   │       ├── manifest.json
│   │       ├── Component.js
│   │       ├── controller/App.controller.js, NFAview.controller.js
│   │       ├── view/App.view.xml, NFAview.view.xml
│   │       ├── css/style.css
│   │       ├── i18n/i18n.properties
│   │       └── model/models.js
│   └── router/                       Standalone approuter (@sap/approuter)
│       ├── package.json
│       ├── xs-app.json
│       └── default-env.json          Local approuter env (git-ignored)
├── db/
│   ├── schema.cds                    Data model (NFA + 8 sections + attachments)
│   └── data1/*.csv                   Sample data (not auto-loaded, see §4)
├── srv/
│   ├── service.cds                   OData service definition + actions
│   ├── service.js                    Action implementations
│   ├── pdfService.js                 PDF rendering (pdfkit)
│   ├── external/DocumentImport.wsdl  Ariba DocumentImport WSDL (reference)
│   └── integration/
│       ├── ariba.js                  Ariba Sourcing Event REST client (OAuth2)
│       ├── documentImport.js         Ariba DocumentImport SOAP client (BTP destination)
│       └── documentPath.js           Builds "<folder>/<file>" document names
├── test/
│   └── documentImport.test.js
├── gen/                              `cds build` output (git-ignored)
├── mta.yaml                          MTA deployment descriptor
├── xs-security.json                  XSUAA configuration
├── .cdsrc-private.json               Hybrid-profile service bindings (no secrets, git-ignored)
├── .env                              Ariba REST credentials/config
└── package.json
```

## 14. Troubleshooting

| Symptom | Likely cause / fix |
|---------|--------------------|
| `502 Failed to load destination` on submit or import | Server not started with `--profile hybrid`, `cf` session expired (`cf login`), or `NFA_BTP` missing in the destination service |
| `400 Ariba Workspace ID could not be determined from the sourcing event` | The Ariba event has no `parentProjectId`, or the event ID was not fetched before submitting. Re-enter the Sourcing Event Ref so the form is pre-filled |
| `Unable to generate Ariba OAuth token` | Wrong `ARIBA_CLIENT_ID` / `ARIBA_CLIENT_SECRET` / `ARIBA_TOKEN_URL` in `.env` |
| `Unable to fetch procurement details.` in the UI | Ariba REST call failed. Check the server console, which logs the Ariba status and response body |
| SOAP fault message returned as 502 | Ariba rejected the DocumentImport. Check `ARIBA_USER_DESIGNATION`, partition/variant, the workspace ID, and that the folder `ARIBA_NFA_FOLDER_NAME` exists in the workspace |
| PDF does not open from the NFA list | The browser blocked pop-ups. Allow pop-ups for the app |
| Attachment links in the PDF do not work in the cloud | Links are hardcoded to `http://localhost:4004` (see §15) |

## 15. Known gaps / things to be aware of

- **Duplicate Ariba documents:** `submitNFA` already sends the PDF to Ariba. Pressing **Import to
  Ariba** afterwards for the same NFA and workspace creates another document (`Action: Create` with
  an empty `DocumentId`).
- **Submit is not atomic with Ariba:** the DB transaction is committed *before* the Ariba import. If
  the import fails, the NFA stays saved, the action still returns 500, and the UI then skips
  uploading attachments.
- **Attachments are missing from the Ariba PDF:** they are uploaded after `submitNFA`, and
  `importDocument` does not load them, so the PDF sent to Ariba never lists attachments. Only the
  `generatePDF` action includes them.
- **Attachment links in the PDF** are hardcoded to `http://localhost:4004`
  ([srv/pdfService.js:293](srv/pdfService.js#L293)). A commented-out `BASE_URL` variant shows the
  intended fix.
- **Hardcoded Ariba variant in SOAP namespace:** the envelope namespace is fixed to
  `urn:Ariba:Sourcing:vrealm_1983`, independent of `ARIBA_VARIANT`.
- **Production auth is `dummy`** and **no XSUAA roles** are defined (see §12).
- **Ariba REST env vars on Cloud Foundry:** `mta.yaml` does not supply them. They must be set
  manually after deployment.
- **Attachment storage:** no storage backend is configured explicitly, so `@cap-js/attachments` uses
  its defaults.
- **Status workflow:** only `Submitted` is ever written. Draft saving (`onSaveDraft`) is commented
  out in the view and not implemented in the controller.
- **Sample data** lives in `db/data1/` and is not loaded automatically.
- `NFA_BTP` points at the **live** Ariba endpoint
  `https://s1.ariba.com/Sourcing/soap/BrainBoxDSAPP-T/DocumentImport`, not a sandbox. Every submit or
  import creates a real document in that realm.
