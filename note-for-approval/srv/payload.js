// async function buildCPIPayload({
//     nfa,
//     procurement,
//     pdfBuffer,
//     attachments
// }) {

//     // Convert PDF to Base64
//     const pdfBase64 = pdfBuffer.toString("base64");

//     // Convert attachments to Base64
//     const attachmentList = [];

//     for (const file of attachments) {

//         attachmentList.push({

//             id: file.ID,

//             fileName: file.filename,

//             mimeType: file.mimeType,

//             content: file.content
//                 ? file.content.toString("base64")
//                 : ""

//         });

//     }

//     return {

//         nfa: {

//             id: nfa.ID,

//             nfaNumber: nfa.nfaNumber,

//             title: nfa.title,

//             status: nfa.status

//         },

//         procurement: {

//             id: procurement.ID,

//             procurementName: procurement.procurementName,

//             aribaSourcingEventRef: procurement.aribaSourcingEventRef,

//             procurementStrategy: procurement.procurementStrategy,

//             expenseCategory: procurement.expenseCategory

//         },

//         pdf: {

//             fileName: `${nfa.nfaNumber}.pdf`,

//             mimeType: "application/pdf",

//             content: pdfBase64

//         },

//         attachments: attachmentList

//     };

// }

// module.exports = {

//     buildCPIPayload

// };