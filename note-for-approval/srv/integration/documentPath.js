function buildDocumentName(folderName, fileName) {
    const cleanFolder = String(folderName || "").trim().replace(/\/+$/, "");
    const cleanFile = String(fileName || "").trim().replace(/^\/+/, "");
    if (!cleanFolder) return cleanFile;
    return `${cleanFolder}/${cleanFile}`;
}

module.exports = { buildDocumentName }; 