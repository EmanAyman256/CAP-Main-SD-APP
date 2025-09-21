using {salesdb} from '../db/sales-cloud-schema';
@title: 'Sales Cloud Service'
@Core.LongDescription: 'This service exposes APIs for managing Sales Cloud objects such as Line Types, Formulas, Materials, and Currencies.'

service SalesCloudService {
  entity Currencies                 as projection on salesdb.Currency;
  entity LineTypes                  as projection on salesdb.LineType;
  entity MaterialGroups             as projection on salesdb.MaterialGroup;
  entity PersonnelNumbers           as projection on salesdb.PersonnelNumber;
  entity ServiceTypes               as projection on salesdb.ServiceType;
  entity Formulas                   as projection on salesdb.Formula;
  entity ModelSpecifications        as projection on salesdb.ModelSpecifications;
  entity ExecutionOrderMains        as projection on salesdb.ExecutionOrderMain;
  entity InvoiceMainItems           as projection on salesdb.InvoiceMainItem;
  entity ModelSpecificationsDetails as projection on salesdb.ModelSpecificationsDetails;
  entity ServiceNumbers             as projection on salesdb.ServiceNumber;
  entity ServiceInvoiceMains        as projection on salesdb.ServiceInvoiceMain;
  entity InvoiceSubItems            as projection on salesdb.InvoiceSubItem;
entity UnitOfMeasurements @readonly @(path: '/UnitOfMeasurements') {
  key code        : String(8);
      description : String;
}
 


/**
   * External projection of Sales Quotation Header
   */
  entity SalesQuotation {
    key SalesQuotation        : String(20);
        SalesOrganization     : String(10);
        DistributionChannel   : String(10);
        Division              : String(10);
        SalesQuotationType    : String(4);
        SalesQuotationDate    : Date;
        SoldToParty           : String(20);
        TransactionCurrency   : String(5);
        TotalNetAmount        : Decimal(15,2);

        items : Association to many SalesQuotationItem
                  on items.SalesQuotation = $self.SalesQuotation;
  }

  /**
   * External projection of Sales Quotation Item
   */
  entity SalesQuotationItem {
    key SalesQuotation        : String(20);
    key SalesQuotationItem    : String(6);

        Material              : String(40);
        RequestedQuantity     : Decimal(15,3);
        RequestedQuantityUnit : String(3);
        NetAmount             : Decimal(15,2);

        header : Association to SalesQuotation
                   on header.SalesQuotation = $self.SalesQuotation;
  }

 // New action to fetch SalesQuotation by Quotation + Item
  // action getRelatedSalesQuotation(
  //   SalesQuotation    : String(20),
  //   SalesQuotationItem: String(10)
  // ) returns SalesQuotation;





  // === Entities exposed via READ handlers ===
  entity SalesOrders @readonly @(path: '/salesordercloud') {
    key SalesOrder       : String;
        SalesOrderType   : String;
        SalesOrg         : String;
        DistributionChnl : String;
        Division         : String;
        CreatedByUser    : String;
        CreatedAt        : DateTime;
  }

  entity SalesOrderItems @readonly {
    key SalesOrder        : String;
    key SalesOrderItem    : String;
        Material          : String;
        RequestedQuantity : Decimal(13, 3);
  }

  entity SalesOrderItemsById @readonly {
    key SalesOrderID : String;
  }

  entity SalesOrderPricingElement @readonly {
    key SalesOrder         : String;
    key SalesOrderItem     : String;
    key ConditionType      : String;
        ConditionRateValue : Decimal(13, 3);
        Currency           : String;
  }

  entity SalesOrderByItem @readonly {
    key SalesOrder     : String;
    key SalesOrderItem : String;
  }

  entity SalesOrderPricing @readonly {
    key SalesOrder     : String;
    key SalesOrderItem : String;
    key ConditionType  : String;
  }

  
  entity SalesQuotationPricing @readonly {
    key SalesQuotation     : String;
    key SalesQuotationItem : String;
    key ConditionType      : String;
  }

  entity DebitMemo @readonly {
    key DebitMemoRequest : String;
        CompanyCode      : String;
        CreatedByUser    : String;
  }

  entity DebitMemoPricing @readonly {
    key DebitMemoRequest     : String;
    key DebitMemoRequestItem : String;
    key ConditionType        : String;
  }

  entity DebitMemoRequestItems @readonly {
    key DebitMemoRequest     : String;
    key DebitMemoRequestItem : String;
  }

  entity DebitMemoRequestByItem @readonly {
    key DebitMemoRequest     : String;
    key DebitMemoRequestItem : String;
  }

  // === Actions (POST operations) ===
  action postSalesOrder(body: LargeString)                                   returns String;
  action postSalesQuotation(body: LargeString)                               returns String;

  action postSalesOrderItemPricing(SalesOrder: String,
                                   SalesOrderItem: String,
                                   body: LargeString)                        returns String;

  action patchSalesQuotationItemPricing(SalesQuotation: String,
                                        SalesQuotationItem: String,
                                        PricingProcedureStep: String,
                                        PricingProcedureCounter: String,
                                        body: LargeString)                   returns String;

  action patchSalesOrderItemPricing(SalesOrder: String,
                                    SalesOrderItem: String,
                                    PricingProcedureStep: String,
                                    PricingProcedureCounter: String,
                                    body: LargeString)                       returns String;

  action patchDebitMemoItemPricing(DebitMemoRequest: String,
                                   DebitMemoRequestItem: String,
                                   PricingProcedureStep: String,
                                   PricingProcedureCounter: String,
                                   body: LargeString)                        returns String;

  action searchFormulas(keyword: String)                                     returns many Formulas;
  action searchModelSpecifications(keyword: String)                          returns many ModelSpecifications;
  action getExecutionOrderMainById(executionOrderMainCode: Integer)          returns ExecutionOrderMains;

  action saveOrUpdateExecutionOrders(executionOrders: array of ExecutionOrderMains,
                                     salesOrder: String,
                                     salesOrderItem: String,
                                     customerNumber: String)                 returns array of ExecutionOrderMains;

  action findBySalesOrderAndItem(salesOrder: String, salesOrderItem: String) returns String;
  action getInvoiceMainItemsByReferenceId(referenceId: String)               returns array of ExecutionOrderMains;
  action findByLineNumber(lineNumber: String)                                returns array of ExecutionOrderMains;

  @readonly
  action calculateTotal(invoiceMainItemCode: Integer)                        returns Decimal(15, 2);

  @readonly
  action calculateTotalHeader()                                              returns Decimal(15, 2);

  @readonly
  action fetchByReferenceId(referenceId: String)                             returns many InvoiceMainItems;

  @readonly
  action search(keyword: String)                                             returns many InvoiceMainItems;

  action searchServiceNumber(keyword: String)                                returns many ServiceNumbers;

  action calculateTotalHeaderServiceInvoice()                                returns Decimal(15, 2);
  action calculateTotalServiceInvoice(serviceInvoiceCode: Integer)           returns Decimal(15, 2);
  action calculateQuantities(data: ServiceInvoiceMains)                      returns ServiceInvoiceMains;

  action findByReferenceIdServiceInvoice(referenceId: String)                returns many ServiceInvoiceMains;
  action findByLineNumberServiceInvoice(lineNumber: String)                  returns many ServiceInvoiceMains;


  action findBySubItemCode(subItemCode: Integer)                             returns InvoiceSubItems;
  action searchSubItem(keyword: String)                                      returns many InvoiceSubItems;


 
}
