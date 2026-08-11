const { executeHttpRequest } = require("@sap-cloud-sdk/http-client");
const { XMLParser } = require("fast-xml-parser");

const DESTINATION_NAME = "NFA_BTP";
const SOAP_ACTION = "/Process Definition";

function escapeXml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&apos;");
}

function normalizeBase64(contents) {
    if (Buffer.isBuffer(contents)) {
        return contents.toString("base64");
    }

    if (contents && contents.type === "Buffer" && Array.isArray(contents.data)) {
        return Buffer.from(contents.data).toString("base64");
    }

    const value = String(contents || "").trim();
    if (!value) {
        throw new Error("Document contents are required");
    }

    // OData represents LargeBinary values as base64 strings.
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(value) || value.length % 4 !== 0) {
        throw new Error("Document contents must be a valid base64 value");
    }
    return value;
}

function element(name, value, required = false) {
    if (value === undefined || value === null || value === "") {
        if (required) throw new Error(`${name} is required`);
        return "";
    }
    return `<typens:${name}>${escapeXml(value)}</typens:${name}>`;
}

function buildEnvelope(input) {
    const action = input.action || "Create";
    if (!new Set(["Create", "Update"]).has(action)) {
        throw new Error("Action must be either Create or Update");
    }
    if (action === "Create" && !input.documentName) {
        throw new Error("DocumentName is required when Action is Create");
    }
    if (action === "Update" && !input.documentId && !input.documentName) {
        throw new Error("DocumentId or DocumentName is required when Action is Update");
    }

    const contents = normalizeBase64(input.contents);
    const partition = escapeXml(input.partition || "");
    const variant = escapeXml(input.variant || "");

    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:typens="urn:Ariba:Sourcing:vrealm_1983">
  <soapenv:Header>
    <typens:Headers>
      ${element("variant", input.variant)}
      ${element("partition", input.partition)}
    </typens:Headers>
  </soapenv:Header>
  <soapenv:Body>
    <typens:DocumentImportRequest partition="${partition}" variant="${variant}">
      <typens:WSDocumentInputBean_Item>
        <typens:item>
          ${element("Action", action, true)}
          ${element("Contents", contents, true)}
          <typens:DocumentId>${escapeXml(input.documentId || "")}</typens:DocumentId>
          <typens:DocumentName>${escapeXml(input.documentName || "")}</typens:DocumentName>
          ${element("OnBehalfUserId", input.onBehalfUserId, true)}
          ${element("OnBehalfUserPasswordAdapter", input.onBehalfUserPasswordAdapter)}
          ${element("WorkspaceId", input.workspaceId, true)}
        </typens:item>
      </typens:WSDocumentInputBean_Item>
    </typens:DocumentImportRequest>
  </soapenv:Body>
</soapenv:Envelope>`;
}

function findByLocalName(value, localName) {
    if (!value || typeof value !== "object") return undefined;
    for (const [key, child] of Object.entries(value)) {
        if (key.split(":").pop() === localName) return child;
        const nested = findByLocalName(child, localName);
        if (nested !== undefined) return nested;
    }
    return undefined;
}

function parseResponse(xml) {
    const parsed = new XMLParser({ ignoreAttributes: false }).parse(xml);
    const fault = findByLocalName(parsed, "Fault");
    if (fault) {
        const message = findByLocalName(fault, "faultstring") || "Ariba returned a SOAP fault";
        const error = new Error(String(message));
        error.statusCode = 502;
        throw error;
    }

    const item = findByLocalName(parsed, "WSDocumentOutputBean_Item");
    const output = findByLocalName(item, "item") || item;
    if (!output) throw new Error("Ariba returned an invalid DocumentImport response");

    return {
        documentId: String(findByLocalName(output, "DocumentId") || ""),
        status: Number(findByLocalName(output, "Status") || 0),
        errorMessage: String(findByLocalName(output, "ErrorMessage") || "")
    };
}

async function importDocument(input, execute = executeHttpRequest) {
    const response = await execute(
        { destinationName: DESTINATION_NAME },
        {
            method: "POST",
            // The destination URL is the complete WSDL endpoint. An explicit
            // slash changes that URL and is rejected by Ariba.
            url: "",
            headers: {
                "Content-Type": "text/xml; charset=utf-8",
                SOAPAction: SOAP_ACTION
            },
            data: buildEnvelope(input),
            responseType: "text"
        }
    );
    return parseResponse(response.data);
}

module.exports = { buildEnvelope, importDocument, parseResponse };
