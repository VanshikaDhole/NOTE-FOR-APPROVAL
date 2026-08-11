require("dotenv").config();
const axios = require("axios");

/**
 * Get OAuth Access Token
 */
async function getAccessToken() {
    try {
        const response = await axios.post(
            process.env.ARIBA_TOKEN_URL,
            new URLSearchParams({
                grant_type: "client_credentials",
                client_id: process.env.ARIBA_CLIENT_ID,
                client_secret: process.env.ARIBA_CLIENT_SECRET
            }),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            }
        );

        return response.data.access_token;

    } catch (error) {

        console.error("OAuth Token Error");

        if (error.response) {
            console.error(error.response.data);
        }

        throw new Error("Unable to generate Ariba OAuth token");
    }
}

async function getProcurementEvents() {
    try {

        const token = await getAccessToken();

        const response = await axios.get(
            process.env.ARIBA_EVENT_URL,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                    apikey: process.env.ARIBA_API_KEY,
                },
                params: {
                    realm: process.env.ARIBA_REALM,
                    user: process.env.ARIBA_USER,
                    passwordAdapter: process.env.ARIBA_PASSWORD_ADAPTER
                }
            }
        );

        const events = Array.isArray(response.data)
            ? response.data
            : [response.data];

        return events.map(event => ({
            internalId: event.internalId,
            title: event.title,
            description: event.description,
            eventTypeName: event.eventTypeName,
            commodity: event.commodities?.[0]?.name || "",
            status: event.status
        }));

    } catch (error) {

    console.log("========== ARIBA ERROR ==========");

    if (error.response) {

        console.log("Status:", error.response.status);

        console.log("Headers:");
        console.dir(error.response.headers);

        console.log("Body:");
        console.dir(error.response.data, { depth: null });

    } else {

        console.log(error);

    }

    throw error;
}
}

async function getProcurementDetails(eventId) {
    eventId = eventId.trim();

    try {

        const token = await getAccessToken();
const url = `${process.env.ARIBA_EVENT_URL}/${eventId}`;

console.log("Calling URL:", url);
        const response = await axios.get(
            `${process.env.ARIBA_EVENT_URL}/${eventId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    apikey: process.env.ARIBA_API_KEY,
                    Accept: "application/json"
                },
                params: {
                    realm: process.env.ARIBA_REALM,
                    user: process.env.ARIBA_USER,
                    passwordAdapter: process.env.ARIBA_PASSWORD_ADAPTER
                }
            }
        );

        const event = response.data;

        return {
            procurementName: event.title,
            aribaSourcingEventRef: event.internalId,
            procurementRoute: "",
            procurementStrategy: event.eventTypeName,
            expenseCategory: event.commodities?.[0]?.name || "",
            procurementObjectives: event.description,
            procurementBackground: event.status
        };

    } catch (error) {

        console.log("========== EVENT ERROR ==========");

        if (error.response) {
            console.log(error.response.status);
            console.dir(error.response.data, { depth: null });
        }

        throw error;
    }
}
async function getSupplierInvitations(eventId) {

    try {

        const token = await getAccessToken();

        const response = await axios.get(
            `${process.env.ARIBA_EVENT_URL}/${eventId}/supplierInvitations`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    apikey: process.env.ARIBA_API_KEY,
                    Accept: "application/json"
                },
                params: {
                    realm: process.env.ARIBA_REALM,
                    user: process.env.ARIBA_USER,
                    passwordAdapter: process.env.ARIBA_PASSWORD_ADAPTER
                }
            }
        );

        return {
            noOfVendorsInvited: response.data.payload.length
        };

    } catch (error) {

        console.log("Supplier Invitation Error");

        if (error.response) {
            console.log(error.response.status);
            console.dir(error.response.data, { depth: null });
        }

        throw error;
    }
}
async function getBidSummary(eventId) {

    try {

        const token = await getAccessToken();

        const response = await axios.get(
            `${process.env.ARIBA_EVENT_URL}/${eventId}/bidSummary`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    apikey: process.env.ARIBA_API_KEY,
                    Accept: "application/json"
                },
                params: {
                    realm: process.env.ARIBA_REALM,
                    user: process.env.ARIBA_USER,
                    passwordAdapter: process.env.ARIBA_PASSWORD_ADAPTER
                }
            }
        );

        return {
            vendorsResponded: response.data.participatedCount
        };

    } catch (error) {

        console.log("Bid Summary Error");

        if (error.response) {
            console.log(error.response.status);
            console.dir(error.response.data, { depth: null });
        }

        throw error;
    }
}
async function getAwards(eventId) {

    try {

        const token = await getAccessToken();

        const response = await axios.get(

            `${process.env.ARIBA_EVENT_URL}/${eventId}/awards`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    apikey: process.env.ARIBA_API_KEY,
                    Accept: "application/json"
                },
                params: {
                    realm: process.env.ARIBA_REALM,
                    user: process.env.ARIBA_USER,
                    passwordAdapter: process.env.ARIBA_PASSWORD_ADAPTER
                }
            }
        );
            //         console.log("===== RAW AWARDS API RESPONSE =====");
            // console.dir(response.data, { depth: null });

       const payload = response.data.payload || [];

let numberOfVendorsSelected = 0;

payload.forEach(record => {

    (record.supplierBids || []).forEach(bid => {

        if (bid.isAward) {
            numberOfVendorsSelected++;
        }

    });

});

return {
    numberOfVendorsSelected
};

    } catch (error) {

        console.log("Awards API Error");

        if (error.response) {
            console.log(error.response.status);
            console.dir(error.response.data, { depth: null });
        }

        throw error;
    }
}
async function getItems(eventId) {

    try {

        const token = await getAccessToken();

        const response = await axios.get(
            `${process.env.ARIBA_EVENT_URL}/${eventId}/items`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    apikey: process.env.ARIBA_API_KEY,
                    Accept: "application/json"
                },
                params: {
                    dataFetchMode: "DETAIL",
                    realm: process.env.ARIBA_REALM,
                    user: process.env.ARIBA_USER,
                    passwordAdapter: process.env.ARIBA_PASSWORD_ADAPTER
                }
            }
        );
//         console.log("===== RAW ITEMS API RESPONSE =====");
// console.dir(response.data, { depth: null });

        const items = response.data.payload || response.data || [];

        let totalValueOfProcurement = 0;
let currency = "";

items.forEach(item => {

    (item.terms || []).forEach(term => {

        if (term.title === "Total Cost") {

            totalValueOfProcurement =
                term.value?.moneyValue?.amount || 0;

            currency =
                term.value?.moneyValue?.currency || "";

        }

    });

});

return {
    totalValueOfProcurement,
    currency
};

    } catch (error) {

        console.log("Items API Error");

        if (error.response) {
            console.log(error.response.status);
            console.dir(error.response.data, { depth: null });
        }

        throw error;
    }
}



module.exports = {
    getProcurementEvents,
    getProcurementDetails,
    getSupplierInvitations,
    getBidSummary,
    getAwards,
    getItems
};