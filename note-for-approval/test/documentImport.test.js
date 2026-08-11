const assert = require("node:assert/strict");
const test = require("node:test");
const { buildEnvelope, importDocument, parseResponse } = require("../srv/integration/documentImport");

const validInput = {
    action: "Create",
    contents: Buffer.from("PDF"),
    documentName: "NFA-1.pdf",
    onBehalfUserId: "buyer@example.com",
    workspaceId: "WS123",
    partition: "realm",
    variant: "vrealm"
};

test("buildEnvelope maps the DocumentImport WSDL request and escapes values", () => {
    const xml = buildEnvelope({ ...validInput, documentName: "A&B.pdf" });
    assert.match(xml, /<typens:Action>Create<\/typens:Action>/);
    assert.match(xml, /<typens:Contents>UERG<\/typens:Contents>/);
    assert.match(xml, /<typens:DocumentName>A&amp;B.pdf<\/typens:DocumentName>/);
    assert.match(xml, /<typens:DocumentId><\/typens:DocumentId>/);
    assert.match(xml, /<typens:WorkspaceId>WS123<\/typens:WorkspaceId>/);
});

test("parseResponse maps a successful DocumentImport reply", () => {
    const result = parseResponse(`
      <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
        <soap:Body><DocumentImportReply><WSDocumentOutputBean_Item><item>
          <DocumentId>DOC42</DocumentId><ErrorMessage></ErrorMessage><Status>0</Status>
        </item></WSDocumentOutputBean_Item></DocumentImportReply></soap:Body>
      </soap:Envelope>`);
    assert.deepEqual(result, { documentId: "DOC42", status: 0, errorMessage: "" });
});

test("importDocument uses the NFA_BTP destination", async () => {
    let request;
    const execute = async (destination, config) => {
        request = { destination, config };
        return { data: "<Envelope><Body><WSDocumentOutputBean_Item><item><DocumentId>D1</DocumentId><Status>0</Status></item></WSDocumentOutputBean_Item></Body></Envelope>" };
    };
    await importDocument(validInput, execute);
    assert.deepEqual(request.destination, { destinationName: "NFA_BTP" });
    assert.equal(request.config.url, "");
    assert.equal(request.config.headers.SOAPAction, "/Process Definition");
});
