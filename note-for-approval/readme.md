# Getting Started

Welcome to your new CAP project.

It contains these folders and files, following our recommended project layout:

File or Folder | Purpose
---------|----------
`app/` | content for UI frontends goes here
`db/` | your domain models and data go here
`srv/` | your service models and code go here
`readme.md` | this getting started guide

## Next Steps

- Open a new terminal and run `cds watch`
- (in VS Code simply choose _**Terminal** > Run Task > cds watch_)
- Start with your domain model, in a CDS file in `db/`

## UI Integration Update

The NFA UI form has been connected to the CAP OData service so that selected fields now display values from the backend data model instead of remaining as static placeholders.

### What was implemented
- Bound the first procurement section fields in the UI to the ProcurementOverview entity from the OData service.
- Added view-model logic in the controller to load the first procurement record and populate the form fields.
- Verified that the app renders the values in the browser from the running service.

### Files updated
- app/nfa-fiori/webapp/view/NFAview.view.xml
- app/nfa-fiori/webapp/controller/NFAview.controller.js

## Learn More

Learn more at <https://cap.cloud.sap>.
