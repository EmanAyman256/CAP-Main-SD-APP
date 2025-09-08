const cds = require('@sap/cds');
const axios = require('axios');
const { Buffer } = require('buffer');

module.exports = cds.service.impl(async function () {
  const user = 'BTP_USER1'; // Verify this user
  const password = '#yiVfheJbFolFxgkEwCBFcWvYkPzrQDENEArAXn5'; // Verify or update
  const auth = Buffer.from(`${user}:${password}`).toString('base64');
  const authHeader = `Basic ${auth}`;

  console.log('Handler initialized for SalesOrderCloudService');

  async function fetchCsrfToken(tokenUrl, cookies = '') {
    console.log(`Fetching CSRF token from ${tokenUrl}`);
    try {
      const res = await axios.get(tokenUrl, {
        headers: { 'Authorization': authHeader, 'x-csrf-token': 'Fetch', 'Accept': 'application/json', 'Cookie': cookies },
        timeout: 10000
      });
      return { token: res.headers['x-csrf-token'], cookies: res.headers['set-cookie']?.join('; ') };
    } catch (error) {
      console.error(`CSRF fetch error: ${error.message}, Status: ${error.response?.status}, Data: ${JSON.stringify(error.response?.data)}`);
      throw error;
    }
  }

  // Custom READ handler for /salesordercloud/SalesOrders (mimics Java getAllSalesOrders GET)
  this.on('READ', 'SalesOrders', async (req) => {
    console.log('Executing READ for SalesOrders');
    const url = 'https://my418629.s4hana.cloud.sap/sap/opu/odata/sap/API_SALES_ORDER_SRV/A_SalesOrder?$inlinecount=allpages&$';
    try {
      console.log(`Calling S/4HANA: ${url}`);
      const res = await axios.get(url, {
        headers: { 'Authorization': authHeader, 'Accept': 'application/json' },
        timeout: 10000
      });
      console.log('S/4HANA response:', JSON.stringify(res.data));
      return res.data.d?.results || []; // Return array for entity response
    } catch (error) {
      console.error('Error in READ SalesOrders:', error.message, 'Status:', error.response?.status, 'Data:', JSON.stringify(error.response?.data));
      throw new cds.Error(`S/4HANA call failed: ${error.message} (Status: ${error.response?.status})`, 401);
    }
  });

  // Custom READ handler for /salesorderitemscloud/SalesOrderItems (mimics Java getAllSalesOrderItems GET)
  this.on('READ', 'SalesOrderItems', async (req) => {
    console.log('Executing READ for SalesOrderItems');
    const url = 'https://my418629.s4hana.cloud.sap/sap/opu/odata/sap/API_SALES_ORDER_SRV/A_SalesOrderItem?$inlinecount=allpages&$';
    try {
      console.log(`Calling S/4HANA: ${url}`);
      const res = await axios.get(url, {
        headers: { 'Authorization': authHeader, 'Accept': 'application/json' },
        timeout: 10000
      });
      console.log('S/4HANA response:', JSON.stringify(res.data));
      return res.data.d?.results || []; // Return array for entity response
    } catch (error) {
      console.error('Error in READ SalesOrderItems:', error.message, 'Status:', error.response?.status, 'Data:', JSON.stringify(error.response?.data));
      throw new cds.Error(`S/4HANA call failed: ${error.message} (Status: ${error.response?.status})`, 401);
    }
  });

  // Custom READ handler for /salesorderitemcloud/SalesOrderItemsById (mimics Java getSalesOrderItems GET with SalesOrderID)
  this.on('READ', 'SalesOrderItemsById', async (req) => {
    console.log('Executing READ for SalesOrderItemsById');
    // Extract SalesOrderID from OData query (e.g., $filter=SalesOrder eq 'ID')
    const salesOrderID = req.query.SELECT.where?.find(w => w.ref?.[0] === 'SalesOrderID')?.val || req.query.SELECT.where?.find(w => w.val)?.val || 'defaultID';
    const url = `https://my418629.s4hana.cloud.sap/sap/opu/odata/sap/API_SALES_ORDER_SRV/A_SalesOrder('${salesOrderID}')/to_Item?$inlinecount=allpages&$`;
    try {
      console.log(`Calling S/4HANA: ${url}`);
      const res = await axios.get(url, {
        headers: { 'Authorization': authHeader, 'Accept': 'application/json' },
        timeout: 10000
      });
      console.log('S/4HANA response:', JSON.stringify(res.data));
      return res.data.d?.results || []; // Return array for entity response
    } catch (error) {
      console.error('Error in READ SalesOrderItemsById:', error.message, 'Status:', error.response?.status, 'Data:', JSON.stringify(error.response?.data));
      throw new cds.Error(`S/4HANA call failed: ${error.message} (Status: ${error.response?.status})`, 401);
    }
  });

  // Custom READ handler for /salesorderallpricingcloud/SalesOrderPricingElement (mimics Java getSalesOrderPricingElement GET)
  this.on('READ', 'SalesOrderPricingElement', async (req) => {
    console.log('Executing READ for SalesOrderPricingElement');
    const url = 'https://my418629.s4hana.cloud.sap/sap/opu/odata/sap/API_SALES_ORDER_SRV/A_SalesOrderItemPrElement?$inlinecount=allpages&$';
    try {
      console.log(`Calling S/4HANA: ${url}`);
      const res = await axios.get(url, {
        headers: { 'Authorization': authHeader, 'Accept': 'application/json' },
        timeout: 10000
      });
      console.log('S/4HANA response:', JSON.stringify(res.data));
      return res.data.d?.results || []; // Return array for entity response
    } catch (error) {
      console.error('Error in READ SalesOrderPricingElement:', error.message, 'Status:', error.response?.status, 'Data:', JSON.stringify(error.response?.data));
      throw new cds.Error(`S/4HANA call failed: ${error.message} (Status: ${error.response?.status})`, 401);
    }
  });

  // Custom READ handler for /salesorderitempricingcloud/SalesOrderByItem (mimics Java getSalesOrderByItem GET)
  this.on('READ', 'SalesOrderByItem', async (req) => {
    console.log('Executing READ for SalesOrderByItem');
    // Extract SalesOrder and SalesOrderItem from OData query (e.g., $filter=SalesOrder eq 'ID' and SalesOrderItem eq 'Item')
    const salesOrder = req.query.SELECT.where?.find(w => w.ref?.[0] === 'SalesOrder')?.val || 'defaultSalesOrder';
    const salesOrderItem = req.query.SELECT.where?.find(w => w.ref?.[0] === 'SalesOrderItem')?.val || 'defaultItem';
    const url = `https://my418629.s4hana.cloud.sap/sap/opu/odata/sap/API_SALES_ORDER_SRV/A_SalesOrderItem(SalesOrder='${salesOrder}',SalesOrderItem='${salesOrderItem}')`;
    try {
      console.log(`Calling S/4HANA: ${url}`);
      const res = await axios.get(url, {
        headers: { 'Authorization': authHeader, 'Accept': 'application/json' },
        timeout: 10000
      });
      console.log('S/4HANA response:', JSON.stringify(res.data));
      return res.data.d?.results || []; // Return array for entity response
    } catch (error) {
      console.error('Error in READ SalesOrderByItem:', error.message, 'Status:', error.response?.status, 'Data:', JSON.stringify(error.response?.data));
      throw new cds.Error(`S/4HANA call failed: ${error.message} (Status: ${error.response?.status})`, 401);
    }
  });

  // Custom READ handler for /salesorderpricingcloud/SalesOrderPricing (mimics Java getSalesOrderPricing GET)
  this.on('READ', 'SalesOrderPricing', async (req) => {
    console.log('Executing READ for SalesOrderPricing');
    // Extract SalesOrder and SalesOrderItem from OData query
    const salesOrder = req.query.SELECT.where?.find(w => w.ref?.[0] === 'SalesOrder')?.val || 'defaultSalesOrder';
    const salesOrderItem = req.query.SELECT.where?.find(w => w.ref?.[0] === 'SalesOrderItem')?.val || 'defaultItem';
    const url = `https://my418629.s4hana.cloud.sap/sap/opu/odata/sap/API_SALES_ORDER_SRV/A_SalesOrderItem(SalesOrder='${salesOrder}',SalesOrderItem='${salesOrderItem}')/to_PricingElement?$inlinecount=allpages&$`;
    try {
      console.log(`Calling S/4HANA: ${url}`);
      const res = await axios.get(url, {
        headers: { 'Authorization': authHeader, 'Accept': 'application/json' },
        timeout: 10000
      });
      console.log('S/4HANA response:', JSON.stringify(res.data));
      return res.data.d?.results || []; // Return array for entity response
    } catch (error) {
      console.error('Error in READ SalesOrderPricing:', error.message, 'Status:', error.response?.status, 'Data:', JSON.stringify(error.response?.data));
      throw new cds.Error(`S/4HANA call failed: ${error.message} (Status: ${error.response?.status})`, 401);
    }
  });

  // Custom READ handler for /salesquotationcloud/SalesQuotation (mimics Java getSalesQuotation GET)
  this.on('READ', 'SalesQuotation', async (req) => {
    console.log('Executing READ for SalesQuotation');
    const url = 'https://my418629.s4hana.cloud.sap/sap/opu/odata/sap/API_SALES_QUOTATION_SRV/A_SalesQuotation?$inlinecount=allpages&$';
    try {
      console.log(`Calling S/4HANA: ${url}`);
      const res = await axios.get(url, {
        headers: { 'Authorization': authHeader, 'Accept': 'application/json' },
        timeout: 10000
      });
      console.log('S/4HANA response:', JSON.stringify(res.data));
      return res.data.d?.results || []; // Return array for entity response
    } catch (error) {
      console.error('Error in READ SalesQuotation:', error.message, 'Status:', error.response?.status, 'Data:', JSON.stringify(error.response?.data));
      throw new cds.Error(`S/4HANA call failed: ${error.message} (Status: ${error.response?.status})`, 401);
    }
  });

  // Custom READ handler for /salesquotationitemcloud/SalesQuotationItem (mimics Java getSalesQuotationItem GET)
  this.on('READ', 'SalesQuotationItem', async (req) => {
    console.log('Executing READ for SalesQuotationItem');
    // Extract SalesQuotationID from OData query
    const salesQuotationID = req.query.SELECT.where?.find(w => w.ref?.[0] === 'SalesQuotationID')?.val || 'defaultID';
    const url = `https://my418629.s4hana.cloud.sap/sap/opu/odata/sap/API_SALES_QUOTATION_SRV/A_SalesQuotation('${salesQuotationID}')/to_Item?$inlinecount=allpages&$`;
    try {
      console.log(`Calling S/4HANA: ${url}`);
      const res = await axios.get(url, {
        headers: { 'Authorization': authHeader, 'Accept': 'application/json' },
        timeout: 10000
      });
      console.log('S/4HANA response:', JSON.stringify(res.data));
      return res.data.d?.results || []; // Return array for entity response
    } catch (error) {
      console.error('Error in READ SalesQuotationItem:', error.message, 'Status:', error.response?.status, 'Data:', JSON.stringify(error.response?.data));
      throw new cds.Error(`S/4HANA call failed: ${error.message} (Status: ${error.response?.status})`, 401);
    }
  });

  // Custom READ handler for /salesquotationitemscloud/SalesQuotationItems (mimics Java getSalesQuotationItems GET)
  this.on('READ', 'SalesQuotationItems', async (req) => {
    console.log('Executing READ for SalesQuotationItems');
    const url = 'https://my418629.s4hana.cloud.sap/sap/opu/odata/sap/API_SALES_QUOTATION_SRV/A_SalesQuotationItem?$inlinecount=allpages&$';
    try {
      console.log(`Calling S/4HANA: ${url}`);
      const res = await axios.get(url, {
        headers: { 'Authorization': authHeader, 'Accept': 'application/json' },
        timeout: 10000
      });
      console.log('S/4HANA response:', JSON.stringify(res.data));
      return res.data.d?.results || []; // Return array for entity response
    } catch (error) {
      console.error('Error in READ SalesQuotationItems:', error.message, 'Status:', error.response?.status, 'Data:', JSON.stringify(error.response?.data));
      throw new cds.Error(`S/4HANA call failed: ${error.message} (Status: ${error.response?.status})`, 401);
    }
  });

  // Custom READ handler for /salesquotationpricingcloud/SalesQuotationPricing (mimics Java getSalesQuotationPricing GET)
  this.on('READ', 'SalesQuotationPricing', async (req) => {
    console.log('Executing READ for SalesQuotationPricing');
    // Extract SalesQuotation and SalesQuotationItem from OData query
    const salesQuotation = req.query.SELECT.where?.find(w => w.ref?.[0] === 'SalesQuotation')?.val || 'defaultSalesQuotation';
    const salesQuotationItem = req.query.SELECT.where?.find(w => w.ref?.[0] === 'SalesQuotationItem')?.val || 'defaultItem';
    const url = `https://my418629.s4hana.cloud.sap/sap/opu/odata/sap/API_SALES_QUOTATION_SRV/A_SalesQuotationItem(SalesQuotation='${salesQuotation}',SalesQuotationItem='${salesQuotationItem}')/to_PricingElement?$inlinecount=allpages&$`;
    try {
      console.log(`Calling S/4HANA: ${url}`);
      const res = await axios.get(url, {
        headers: { 'Authorization': authHeader, 'Accept': 'application/json' },
        timeout: 10000
      });
      console.log('S/4HANA response:', JSON.stringify(res.data));
      return res.data.d?.results || []; // Return array for entity response
    } catch (error) {
      console.error('Error in READ SalesQuotationPricing:', error.message, 'Status:', error.response?.status, 'Data:', JSON.stringify(error.response?.data));
      throw new cds.Error(`S/4HANA call failed: ${error.message} (Status: ${error.response?.status})`, 401);
    }
  });

  // Custom READ handler for /debitmemocloud/DebitMemo (mimics Java getDebitMemo GET)
  this.on('READ', 'DebitMemo', async (req) => {
    console.log('Executing READ for DebitMemo');
    const url = 'https://my418629.s4hana.cloud.sap/sap/opu/odata/sap/API_DEBIT_MEMO_REQUEST_SRV/A_DebitMemoRequest?$inlinecount=allpages&$';
    try {
      console.log(`Calling S/4HANA: ${url}`);
      const res = await axios.get(url, {
        headers: { 'Authorization': authHeader, 'Accept': 'application/json' },
        timeout: 10000
      });
      console.log('S/4HANA response:', JSON.stringify(res.data));
      return res.data.d?.results || []; // Return array for entity response
    } catch (error) {
      console.error('Error in READ DebitMemo:', error.message, 'Status:', error.response?.status, 'Data:', JSON.stringify(error.response?.data));
      throw new cds.Error(`S/4HANA call failed: ${error.message} (Status: ${error.response?.status})`, 401);
    }
  });

  // Custom READ handler for /debitmemoitemscloud/DebitMemoPricing (mimics Java getDebitMemoPricing GET)
  this.on('READ', 'DebitMemoPricing', async (req) => {
    console.log('Executing READ for DebitMemoPricing');
    const url = 'https://my418629.s4hana.cloud.sap/sap/opu/odata/sap/API_DEBIT_MEMO_REQUEST_SRV/A_DebitMemoReqItemPrcgElmnt?$inlinecount=allpages&$';
    try {
      console.log(`Calling S/4HANA: ${url}`);
      const res = await axios.get(url, {
        headers: { 'Authorization': authHeader, 'Accept': 'application/json' },
        timeout: 10000
      });
      console.log('S/4HANA response:', JSON.stringify(res.data));
      return res.data.d?.results || []; // Return array for entity response
    } catch (error) {
      console.error('Error in READ DebitMemoPricing:', error.message, 'Status:', error.response?.status, 'Data:', JSON.stringify(error.response?.data));
      throw new cds.Error(`S/4HANA call failed: ${error.message} (Status: ${error.response?.status})`, 401);
    }
  });

  // Custom READ handler for /debitmemorequestitemcloud/DebitMemoRequestItems (mimics Java getDebitMemoRequestItems GET)
  this.on('READ', 'DebitMemoRequestItems', async (req) => {
    console.log('Executing READ for DebitMemoRequestItems');
    // Extract DebitMemoRequest from OData query
    const debitMemoRequest = req.query.SELECT.where?.find(w => w.ref?.[0] === 'DebitMemoRequest')?.val || 'defaultID';
    const url = `https://my418629.s4hana.cloud.sap/sap/opu/odata/sap/API_DEBIT_MEMO_REQUEST_SRV/A_DebitMemoRequest('${debitMemoRequest}')/to_Item?$inlinecount=allpages&$`;
    try {
      console.log(`Calling S/4HANA: ${url}`);
      const res = await axios.get(url, {
        headers: { 'Authorization': authHeader, 'Accept': 'application/json' },
        timeout: 10000
      });
      console.log('S/4HANA response:', JSON.stringify(res.data));
      return res.data.d?.results || []; // Return array for entity response
    } catch (error) {
      console.error('Error in READ DebitMemoRequestItems:', error.message, 'Status:', error.response?.status, 'Data:', JSON.stringify(error.response?.data));
      throw new cds.Error(`S/4HANA call failed: ${error.message} (Status: ${error.response?.status})`, 401);
    }
  });

  // Custom READ handler for /debitmemorequestitemcloud/DebitMemoRequestByItem (mimics Java getDebitMemoRequestByItem GET)
  this.on('READ', 'DebitMemoRequestByItem', async (req) => {
    console.log('Executing READ for DebitMemoRequestByItem');
    // Extract DebitMemoRequest and DebitMemoRequestItem from OData query
    const debitMemoRequest = req.query.SELECT.where?.find(w => w.ref?.[0] === 'DebitMemoRequest')?.val || 'defaultDebitMemoRequest';
    const debitMemoRequestItem = req.query.SELECT.where?.find(w => w.ref?.[0] === 'DebitMemoRequestItem')?.val || 'defaultItem';
    const url = `https://my418629.s4hana.cloud.sap/sap/opu/odata/sap/API_DEBIT_MEMO_REQUEST_SRV/A_DebitMemoRequestItem(DebitMemoRequest='${debitMemoRequest}',DebitMemoRequestItem='${debitMemoRequestItem}')`;
    try {
      console.log(`Calling S/4HANA: ${url}`);
      const res = await axios.get(url, {
        headers: { 'Authorization': authHeader, 'Accept': 'application/json' },
        timeout: 10000
      });
      console.log('S/4HANA response:', JSON.stringify(res.data));
      return res.data.d?.results || []; // Return array for entity response
    } catch (error) {
      console.error('Error in READ DebitMemoRequestByItem:', error.message, 'Status:', error.response?.status, 'Data:', JSON.stringify(error.response?.data));
      throw new cds.Error(`S/4HANA call failed: ${error.message} (Status: ${error.response?.status})`, 401);
    }
  });
});