// const cds = require('@sap/cds');
// const axios = require('axios');
// const { Buffer } = require('buffer');

// module.exports = cds.service.impl(async function () {
//   const user = 'BTP_USER1';
//   const password = '#yiVfheJbFolFxgkEwCBFcWvYkPzrQDENEArAXn5'; 
//   const auth = Buffer.from(`${user}:${password}`).toString('base64');
//   const authHeader = `Basic ${auth}`;

//   console.log('Handler initialized for SalesOrderCloudService');

//   async function fetchCsrfToken(tokenUrl, cookies = '') {
//     console.log(`Fetching CSRF token from ${tokenUrl}`);
//     try {
//       const res = await axios.get(tokenUrl, {
//         headers: { 'Authorization': authHeader, 'x-csrf-token': 'Fetch', 'Accept': 'application/json', 'Cookie': cookies },
//         timeout: 10000
//       });
//       return { token: res.headers['x-csrf-token'], cookies: res.headers['set-cookie']?.join('; ') || cookies };
//     } catch (error) {
//       console.error(`CSRF fetch error: ${error.message}, Status: ${error.response?.status}, Data: ${JSON.stringify(error.response?.data)}`);
//       throw new Error(`Failed to fetch CSRF token: ${error.message}`);
//     }
//   }

 
//   this.on('READ', 'SalesOrders', async (req) => {
//     console.log('Executing READ for SalesOrders');
//     const url = 'https://my418629.s4hana.cloud.sap/sap/opu/odata/sap/API_SALES_ORDER_SRV/A_SalesOrder?$inlinecount=allpages';
//     try {
//       console.log(`Calling S/4HANA: ${url}`);
//       const res = await axios.get(url, {
//         headers: { 'Authorization': authHeader, 'Accept': 'application/json' },
//         timeout: 10000
//       });
//       console.log('S/4HANA response:', JSON.stringify(res.data));
//       return res.data.d?.results || [];
//     } catch (error) {
//       console.error('Error in READ SalesOrders:', error.message, 'Status:', error.response?.status, 'Data:', JSON.stringify(error.response?.data));
//       throw new Error(`S/4HANA call failed: ${error.message} (Status: ${error.response?.status || 500})`);
//     }
//   });

  
//   this.on('READ', 'SalesOrderItems', async (req) => {
//     console.log('Executing READ for SalesOrderItems');
//     const url = 'https://my418629.s4hana.cloud.sap/sap/opu/odata/sap/API_SALES_ORDER_SRV/A_SalesOrderItem?$inlinecount=allpages&$';
//     try {
//       console.log(`Calling S/4HANA: ${url}`);
//       const res = await axios.get(url, {
//         headers: { 'Authorization': authHeader, 'Accept': 'application/json' },
//         timeout: 10000
//       });
//       console.log('S/4HANA response:', JSON.stringify(res.data));
//       return res.data.d?.results || [];
//     } catch (error) {
//       console.error('Error in READ SalesOrderItems:', error.message, 'Status:', error.response?.status, 'Data:', JSON.stringify(error.response?.data));
//       throw new Error(`S/4HANA call failed: ${error.message} (Status: ${error.response?.status || 500})`);
//     }
//   });

  
//   this.on('READ', 'SalesOrderItemsById', async (req) => {
//     console.log('Executing READ for SalesOrderItemsById');
//     const salesOrderID = req.query.SELECT.where?.find(w => w.ref?.[0] === 'SalesOrderID')?.val || req.query.SELECT.where?.find(w => w.val)?.val || 'defaultID';
//     const url = `https://my418629.s4hana.cloud.sap/sap/opu/odata/sap/API_SALES_ORDER_SRV/A_SalesOrder('${salesOrderID}')/to_Item?$inlinecount=allpages&$`;
//     try {
//       console.log(`Calling S/4HANA: ${url}`);
//       const res = await axios.get(url, {
//         headers: { 'Authorization': authHeader, 'Accept': 'application/json' },
//         timeout: 10000
//       });
//       console.log('S/4HANA response:', JSON.stringify(res.data));
//       return res.data.d?.results || [];
//     } catch (error) {
//       console.error('Error in READ SalesOrderItemsById:', error.message, 'Status:', error.response?.status, 'Data:', JSON.stringify(error.response?.data));
//       throw new Error(`S/4HANA call failed: ${error.message} (Status: ${error.response?.status || 500})`);
//     }
//   });

  
//   this.on('READ', 'SalesOrderPricingElement', async (req) => {
//     console.log('Executing READ for SalesOrderPricingElement');
//     const url = 'https://my418629.s4hana.cloud.sap/sap/opu/odata/sap/API_SALES_ORDER_SRV/A_SalesOrderItemPrElement?$inlinecount=allpages&$';
//     try {
//       console.log(`Calling S/4HANA: ${url}`);
//       const res = await axios.get(url, {
//         headers: { 'Authorization': authHeader, 'Accept': 'application/json' },
//         timeout: 10000
//       });
//       console.log('S/4HANA response:', JSON.stringify(res.data));
//       return res.data.d?.results || [];
//     } catch (error) {
//       console.error('Error in READ SalesOrderPricingElement:', error.message, 'Status:', error.response?.status, 'Data:', JSON.stringify(error.response?.data));
//       throw new Error(`S/4HANA call failed: ${error.message} (Status: ${error.response?.status || 500})`);
//     }
//   });

  
//   this.on('READ', 'SalesOrderByItem', async (req) => {
//     console.log('Executing READ for SalesOrderByItem');
//     const salesOrder = req.query.SELECT.where?.find(w => w.ref?.[0] === 'SalesOrder')?.val || 'defaultSalesOrder';
//     const salesOrderItem = req.query.SELECT.where?.find(w => w.ref?.[0] === 'SalesOrderItem')?.val || 'defaultItem';
//     const url = `https://my418629.s4hana.cloud.sap/sap/opu/odata/sap/API_SALES_ORDER_SRV/A_SalesOrderItem(SalesOrder='${salesOrder}',SalesOrderItem='${salesOrderItem}')`;
//     try {
//       console.log(`Calling S/4HANA: ${url}`);
//       const res = await axios.get(url, {
//         headers: { 'Authorization': authHeader, 'Accept': 'application/json' },
//         timeout: 10000
//       });
//       console.log('S/4HANA response:', JSON.stringify(res.data));
//       return res.data.d?.results || [];
//     } catch (error) {
//       console.error('Error in READ SalesOrderByItem:', error.message, 'Status:', error.response?.status, 'Data:', JSON.stringify(error.response?.data));
//       throw new Error(`S/4HANA call failed: ${error.message} (Status: ${error.response?.status || 500})`);
//     }
//   });

  
//   this.on('READ', 'SalesOrderPricing', async (req) => {
//     console.log('Executing READ for SalesOrderPricing');
//     const salesOrder = req.query.SELECT.where?.find(w => w.ref?.[0] === 'SalesOrder')?.val || 'defaultSalesOrder';
//     const salesOrderItem = req.query.SELECT.where?.find(w => w.ref?.[0] === 'SalesOrderItem')?.val || 'defaultItem';
//     const url = `https://my418629.s4hana.cloud.sap/sap/opu/odata/sap/API_SALES_ORDER_SRV/A_SalesOrderItem(SalesOrder='${salesOrder}',SalesOrderItem='${salesOrderItem}')/to_PricingElement?$inlinecount=allpages&$`;
//     try {
//       console.log(`Calling S/4HANA: ${url}`);
//       const res = await axios.get(url, {
//         headers: { 'Authorization': authHeader, 'Accept': 'application/json' },
//         timeout: 10000
//       });
//       console.log('S/4HANA response:', JSON.stringify(res.data));
//       return res.data.d?.results || [];
//     } catch (error) {
//       console.error('Error in READ SalesOrderPricing:', error.message, 'Status:', error.response?.status, 'Data:', JSON.stringify(error.response?.data));
//       throw new Error(`S/4HANA call failed: ${error.message} (Status: ${error.response?.status || 500})`);
//     }
//   });

  
//   this.on('READ', 'SalesQuotation', async (req) => {
//     console.log('Executing READ for SalesQuotation');
//     const url = 'https://my418629.s4hana.cloud.sap/sap/opu/odata/sap/API_SALES_QUOTATION_SRV/A_SalesQuotation?$inlinecount=allpages&$';
//     try {
//       console.log(`Calling S/4HANA: ${url}`);
//       const res = await axios.get(url, {
//         headers: { 'Authorization': authHeader, 'Accept': 'application/json' },
//         timeout: 10000
//       });
//       console.log('S/4HANA response:', JSON.stringify(res.data));
//       return res.data.d?.results || [];
//     } catch (error) {
//       console.error('Error in READ SalesQuotation:', error.message, 'Status:', error.response?.status, 'Data:', JSON.stringify(error.response?.data));
//       throw new Error(`S/4HANA call failed: ${error.message} (Status: ${error.response?.status || 500})`);
//     }
//   });

 
//   this.on('READ', 'SalesQuotationItem', async (req) => {
//     console.log('Executing READ for SalesQuotationItem');
//     const salesQuotationID = req.query.SELECT.where?.find(w => w.ref?.[0] === 'SalesQuotationID')?.val || 'defaultID';
//     const url = `https://my418629.s4hana.cloud.sap/sap/opu/odata/sap/API_SALES_QUOTATION_SRV/A_SalesQuotation('${salesQuotationID}')/to_Item?$inlinecount=allpages&$`;
//     try {
//       console.log(`Calling S/4HANA: ${url}`);
//       const res = await axios.get(url, {
//         headers: { 'Authorization': authHeader, 'Accept': 'application/json' },
//         timeout: 10000
//       });
//       console.log('S/4HANA response:', JSON.stringify(res.data));
//       return res.data.d?.results || [];
//     } catch (error) {
//       console.error('Error in READ SalesQuotationItem:', error.message, 'Status:', error.response?.status, 'Data:', JSON.stringify(error.response?.data));
//       throw new Error(`S/4HANA call failed: ${error.message} (Status: ${error.response?.status || 500})`);
//     }
//   });


//   this.on('READ', 'SalesQuotationItems', async (req) => {
//     console.log('Executing READ for SalesQuotationItems');
//     const url = 'https://my418629.s4hana.cloud.sap/sap/opu/odata/sap/API_SALES_QUOTATION_SRV/A_SalesQuotationItem?$inlinecount=allpages&$';
//     try {
//       console.log(`Calling S/4HANA: ${url}`);
//       const res = await axios.get(url, {
//         headers: { 'Authorization': authHeader, 'Accept': 'application/json' },
//         timeout: 10000
//       });
//       console.log('S/4HANA response:', JSON.stringify(res.data));
//       return res.data.d?.results || [];
//     } catch (error) {
//       console.error('Error in READ SalesQuotationItems:', error.message, 'Status:', error.response?.status, 'Data:', JSON.stringify(error.response?.data));
//       throw new Error(`S/4HANA call failed: ${error.message} (Status: ${error.response?.status || 500})`);
//     }
//   });

 
//   this.on('READ', 'SalesQuotationPricing', async (req) => {
//     console.log('Executing READ for SalesQuotationPricing');
//     const salesQuotation = req.query.SELECT.where?.find(w => w.ref?.[0] === 'SalesQuotation')?.val || 'defaultSalesQuotation';
//     const salesQuotationItem = req.query.SELECT.where?.find(w => w.ref?.[0] === 'SalesQuotationItem')?.val || 'defaultItem';
//     const url = `https://my418629.s4hana.cloud.sap/sap/opu/odata/sap/API_SALES_QUOTATION_SRV/A_SalesQuotationItem(SalesQuotation='${salesQuotation}',SalesQuotationItem='${salesQuotationItem}')/to_PricingElement?$inlinecount=allpages&$`;
//     try {
//       console.log(`Calling S/4HANA: ${url}`);
//       const res = await axios.get(url, {
//         headers: { 'Authorization': authHeader, 'Accept': 'application/json' },
//         timeout: 10000
//       });
//       console.log('S/4HANA response:', JSON.stringify(res.data));
//       return res.data.d?.results || [];
//     } catch (error) {
//       console.error('Error in READ SalesQuotationPricing:', error.message, 'Status:', error.response?.status, 'Data:', JSON.stringify(error.response?.data));
//       throw new Error(`S/4HANA call failed: ${error.message} (Status: ${error.response?.status || 500})`);
//     }
//   });

 
//   this.on('READ', 'DebitMemo', async (req) => {
//     console.log('Executing READ for DebitMemo');
//     const url = 'https://my418629.s4hana.cloud.sap/sap/opu/odata/sap/API_DEBIT_MEMO_REQUEST_SRV/A_DebitMemoRequest?$inlinecount=allpages&$';
//     try {
//       console.log(`Calling S/4HANA: ${url}`);
//       const res = await axios.get(url, {
//         headers: { 'Authorization': authHeader, 'Accept': 'application/json' },
//         timeout: 10000
//       });
//       console.log('S/4HANA response:', JSON.stringify(res.data));
//       return res.data.d?.results || [];
//     } catch (error) {
//       console.error('Error in READ DebitMemo:', error.message, 'Status:', error.response?.status, 'Data:', JSON.stringify(error.response?.data));
//       throw new Error(`S/4HANA call failed: ${error.message} (Status: ${error.response?.status || 500})`);
//     }
//   });

  
//   this.on('READ', 'DebitMemoPricing', async (req) => {
//     console.log('Executing READ for DebitMemoPricing');
//     const url = 'https://my418629.s4hana.cloud.sap/sap/opu/odata/sap/API_DEBIT_MEMO_REQUEST_SRV/A_DebitMemoReqItemPrcgElmnt?$inlinecount=allpages&$';
//     try {
//       console.log(`Calling S/4HANA: ${url}`);
//       const res = await axios.get(url, {
//         headers: { 'Authorization': authHeader, 'Accept': 'application/json' },
//         timeout: 10000
//       });
//       console.log('S/4HANA response:', JSON.stringify(res.data));
//       return res.data.d?.results || [];
//     } catch (error) {
//       console.error('Error in READ DebitMemoPricing:', error.message, 'Status:', error.response?.status, 'Data:', JSON.stringify(error.response?.data));
//       throw new Error(`S/4HANA call failed: ${error.message} (Status: ${error.response?.status || 500})`);
//     }
//   });

  
//   this.on('READ', 'DebitMemoRequestItems', async (req) => {
//     console.log('Executing READ for DebitMemoRequestItems');
//     const debitMemoRequest = req.query.SELECT.where?.find(w => w.ref?.[0] === 'DebitMemoRequest')?.val || 'defaultID';
//     const url = `https://my418629.s4hana.cloud.sap/sap/opu/odata/sap/API_DEBIT_MEMO_REQUEST_SRV/A_DebitMemoRequest('${debitMemoRequest}')/to_Item?$inlinecount=allpages&$`;
//     try {
//       console.log(`Calling S/4HANA: ${url}`);
//       const res = await axios.get(url, {
//         headers: { 'Authorization': authHeader, 'Accept': 'application/json' },
//         timeout: 10000
//       });
//       console.log('S/4HANA response:', JSON.stringify(res.data));
//       return res.data.d?.results || [];
//     } catch (error) {
//       console.error('Error in READ DebitMemoRequestItems:', error.message, 'Status:', error.response?.status, 'Data:', JSON.stringify(error.response?.data));
//       throw new Error(`S/4HANA call failed: ${error.message} (Status: ${error.response?.status || 500})`);
//     }
//   });

  
//   this.on('READ', 'DebitMemoRequestByItem', async (req) => {
//     console.log('Executing READ for DebitMemoRequestByItem');
//     const debitMemoRequest = req.query.SELECT.where?.find(w => w.ref?.[0] === 'DebitMemoRequest')?.val || 'defaultDebitMemoRequest';
//     const debitMemoRequestItem = req.query.SELECT.where?.find(w => w.ref?.[0] === 'DebitMemoRequestItem')?.val || 'defaultItem';
//     const url = `https://my418629.s4hana.cloud.sap/sap/opu/odata/sap/API_DEBIT_MEMO_REQUEST_SRV/A_DebitMemoRequestItem(DebitMemoRequest='${debitMemoRequest}',DebitMemoRequestItem='${debitMemoRequestItem}')`;
//     try {
//       console.log(`Calling S/4HANA: ${url}`);
//       const res = await axios.get(url, {
//         headers: { 'Authorization': authHeader, 'Accept': 'application/json' },
//         timeout: 10000
//       });
//       console.log('S/4HANA response:', JSON.stringify(res.data));
//       return res.data.d?.results || [];
//     } catch (error) {
//       console.error('Error in READ DebitMemoRequestByItem:', error.message, 'Status:', error.response?.status, 'Data:', JSON.stringify(error.response?.data));
//       throw new Error(`S/4HANA call failed: ${error.message} (Status: ${error.response?.status || 500})`);
//     }
//   });

  
//   this.on('postSalesOrder', async (req) => {
//     console.log('Executing postSalesOrder');
//     const { body } = req.data;
//     const url = 'https://my418629.s4hana.cloud.sap/sap/opu/odata4/sap/api_salesorder/srvd_a2x/sap/salesorder/0001/SalesOrder';
//     const tokenUrl = 'https://my418629.s4hana.cloud.sap/sap/opu/odata/sap/API_SALES_ORDER_SRV/A_SalesOrder?';
//     try {
//       const { token, cookies } = await fetchCsrfToken(tokenUrl);
//       if (!token) throw new Error('Failed to fetch CSRF token');
//       const res = await axios.post(url, body, {
//         headers: {
//           'Authorization': authHeader,
//           'x-csrf-token': token,
//           'Content-Type': 'application/json',
//           'Cookie': cookies
//         },
//         timeout: 10000
//       });
//       console.log('S/4HANA response:', JSON.stringify(res.data));
//       return res.data || 'Success';
//     } catch (error) {
//       console.error('Error in postSalesOrder:', error.message, 'Status:', error.response?.status, 'Data:', JSON.stringify(error.response?.data));
//       throw new Error(`S/4HANA call failed: ${error.message} (Status: ${error.response?.status || 500})`);
//     }
//   });

 
//   this.on('postSalesQuotation', async (req) => {
//     console.log('Executing postSalesQuotation');
//     const { body } = req.data;
//     const url = 'https://my418629.s4hana.cloud.sap/sap/opu/odata/sap/API_SALES_QUOTATION_SRV/A_SalesQuotation';
//     const tokenUrl = 'https://my418629.s4hana.cloud.sap/sap/opu/odata/sap/API_SALES_QUOTATION_SRV/A_SalesQuotation?$inlinecount=allpages&$';
//     try {
//       const { token, cookies } = await fetchCsrfToken(tokenUrl);
//       if (!token) throw new Error('Failed to fetch CSRF token');
//       const res = await axios.post(url, body, {
//         headers: {
//           'Authorization': authHeader,
//           'x-csrf-token': token,
//           'Content-Type': 'application/json',
//           'Cookie': cookies
//         },
//         timeout: 10000
//       });
//       console.log('S/4HANA response:', JSON.stringify(res.data));
//       return res.data || 'Success';
//     } catch (error) {
//       console.error('Error in postSalesQuotation:', error.message, 'Status:', error.response?.status, 'Data:', JSON.stringify(error.response?.data));
//       throw new Error(`S/4HANA call failed: ${error.message} (Status: ${error.response?.status || 500})`);
//     }
//   });


//   this.on('postSalesOrderItemPricing', async (req) => {
//     console.log('Executing postSalesOrderItemPricing');
//     const { SalesOrder, SalesOrderItem, body } = req.data;
//     const tokenUrl = `https://my418629.s4hana.cloud.sap/sap/opu/odata/sap/API_SALES_ORDER_SRV/A_SalesOrderItem(SalesOrder='${SalesOrder}',SalesOrderItem='${SalesOrderItem}')/to_PricingElement`;
//     const postUrl = `https://my418629.s4hana.cloud.sap/sap/opu/odata4/sap/api_salesorder/srvd_a2x/sap/salesorder/0001/SalesOrderItem/${SalesOrder}/${SalesOrderItem}/_ItemPricingElement`;
//     try {
//       // Step 1: Fetch totalHeader (simulated, replace with actual logic)
//       const totalHeader = 100.0; // Placeholder; replace with actual getExcOrderWithTotalHeader logic
//       let modifiedBody = body;
//       if (totalHeader) {
//         // Simulate JSON modification (requires a JSON parser, e.g., 'json-parse' or 'fast-json-parse')
//         const bodyJson = JSON.parse(body);
//         bodyJson.ConditionRateValue = totalHeader; // Adjust based on API field name
//         modifiedBody = JSON.stringify(bodyJson);
//       }
//       // Step 2: Fetch CSRF token
//       const { token, cookies } = await fetchCsrfToken(tokenUrl);
//       if (!token) throw new Error('Failed to fetch CSRF token');
//       // Step 3: Send POST request
//       const res = await axios.post(postUrl, modifiedBody, {
//         headers: {
//           'Authorization': authHeader,
//           'x-csrf-token': token,
//           'Content-Type': 'application/json',
//           'Cookie': cookies
//         },
//         timeout: 10000
//       });
//       console.log('S/4HANA response:', JSON.stringify(res.data));
//       return res.data || 'Success';
//     } catch (error) {
//       console.error('Error in postSalesOrderItemPricing:', error.message, 'Status:', error.response?.status, 'Data:', JSON.stringify(error.response?.data));
//       throw new Error(`S/4HANA call failed: ${error.message} (Status: ${error.response?.status || 500})`);
//     }
//   });


//   this.on('patchSalesQuotationItemPricing', async (req) => {
//     console.log('Executing patchSalesQuotationItemPricing');
//     const { SalesQuotation, SalesQuotationItem, PricingProcedureStep, PricingProcedureCounter, body } = req.data;
//     const tokenUrl = `https://my418629.s4hana.cloud.sap/sap/opu/odata/sap/API_SALES_QUOTATION_SRV/A_SalesQuotationItem(SalesQuotation='${SalesQuotation}',SalesQuotationItem='${SalesQuotationItem}')/to_PricingElement?%24inlinecount=allpages&%24top=50`;
//     const patchUrl = `https://my418629.s4hana.cloud.sap/sap/opu/odata/sap/API_SALES_QUOTATION_SRV/A_SalesQuotationItemPrcgElmnt(SalesQuotation='${SalesQuotation}',SalesQuotationItem='${SalesQuotationItem}',PricingProcedureStep='${PricingProcedureStep}',PricingProcedureCounter='${PricingProcedureCounter}')`;
//     try {
//       const { token, cookies } = await fetchCsrfToken(tokenUrl);
//       if (!token) throw new Error('Failed to fetch CSRF token');
//       const res = await axios.post(patchUrl, body, {
//         headers: {
//           'Authorization': authHeader,
//           'x-csrf-token': token,
//           'X-HTTP-Method-Override': 'PATCH',
//           'If-Match': '*',
//           'Content-Type': 'application/json',
//           'Cookie': cookies
//         },
//         timeout: 10000
//       });
//       console.log('S/4HANA response:', JSON.stringify(res.data));
//       return res.data || 'Success';
//     } catch (error) {
//       console.error('Error in patchSalesQuotationItemPricing:', error.message, 'Status:', error.response?.status, 'Data:', JSON.stringify(error.response?.data));
//       throw new Error(`S/4HANA call failed: ${error.message} (Status: ${error.response?.status || 500})`);
//     }
//   });

  
//   this.on('patchSalesOrderItemPricing', async (req) => {
//     console.log('Executing patchSalesOrderItemPricing');
//     const { SalesOrder, SalesOrderItem, PricingProcedureStep, PricingProcedureCounter, body } = req.data;
//     const tokenUrl = `https://my418629.s4hana.cloud.sap/sap/opu/odata/sap/API_SALES_ORDER_SRV/A_SalesOrderItem(SalesOrder='${SalesOrder}',SalesOrderItem='${SalesOrderItem}')/to_PricingElement?%24inlinecount=allpages&%24top=50`;
//     const patchUrl = `https://my418629.s4hana.cloud.sap/sap/opu/odata/sap/API_SALES_ORDER_SRV/A_SalesOrderItemPrElement(SalesOrder='${SalesOrder}',SalesOrderItem='${SalesOrderItem}',PricingProcedureStep='${PricingProcedureStep}',PricingProcedureCounter='${PricingProcedureCounter}')`;
//     try {
//       const { token, cookies } = await fetchCsrfToken(tokenUrl);
//       if (!token) throw new Error('Failed to fetch CSRF token');
//       const res = await axios.post(patchUrl, body, {
//         headers: {
//           'Authorization': authHeader,
//           'x-csrf-token': token,
//           'X-HTTP-Method-Override': 'PATCH',
//           'If-Match': '*',
//           'Content-Type': 'application/json',
//           'Cookie': cookies
//         },
//         timeout: 10000
//       });
//       console.log('S/4HANA response:', JSON.stringify(res.data));
//       return res.data || 'Success';
//     } catch (error) {
//       console.error('Error in patchSalesOrderItemPricing:', error.message, 'Status:', error.response?.status, 'Data:', JSON.stringify(error.response?.data));
//       throw new Error(`S/4HANA call failed: ${error.message} (Status: ${error.response?.status || 500})`);
//     }
//   });

  
//   this.on('patchDebitMemoItemPricing', async (req) => {
//     console.log('Executing patchDebitMemoItemPricing');
//     const { DebitMemoRequest, DebitMemoRequestItem, PricingProcedureStep, PricingProcedureCounter, body } = req.data;
//     const tokenUrl = `https://my418629.s4hana.cloud.sap/sap/opu/odata/sap/API_DEBIT_MEMO_REQUEST_SRV/A_DebitMemoRequest`;
//     const patchUrl = `https://my418629.s4hana.cloud.sap/sap/opu/odata/sap/API_DEBIT_MEMO_REQUEST_SRV/A_DebitMemoReqItemPrcgElmnt(DebitMemoRequest='${DebitMemoRequest}',DebitMemoRequestItem='${DebitMemoRequestItem}',PricingProcedureStep='${PricingProcedureStep}',PricingProcedureCounter='${PricingProcedureCounter}')`;
//     try {
//       const { token, cookies } = await fetchCsrfToken(tokenUrl);
//       if (!token) throw new Error('Failed to fetch CSRF token');
//       const res = await axios.post(patchUrl, body, {
//         headers: {
//           'Authorization': authHeader,
//           'x-csrf-token': token,
//           'X-HTTP-Method-Override': 'PATCH',
//           'If-Match': '*',
//           'Content-Type': 'application/json',
//           'Cookie': cookies
//         },
//         timeout: 10000
//       });
//       console.log('S/4HANA response:', JSON.stringify(res.data));
//       return res.data || 'Success';
//     } catch (error) {
//       console.error('Error in patchDebitMemoItemPricing:', error.message, 'Status:', error.response?.status, 'Data:', JSON.stringify(error.response?.data));
//       throw new Error(`S/4HANA call failed: ${error.message} (Status: ${error.response?.status || 500})`);
//     }
//   });
// });