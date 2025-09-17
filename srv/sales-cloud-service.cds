using {cuid} from '@sap/cds/common';
using {salesdb} from '../db/sales-cloud-schema';
@title: 'Sales Cloud Service'
@Core.LongDescription: 'This service exposes APIs for managing Sales Cloud objects such as Line Types, Formulas, Materials, and Currencies.'

service SalesCloudService {
  entity Currencies                 as projection on salesdb.Currency;
  entity LineTypes                  as projection on salesdb.LineType;
  entity MaterialGroups             as projection on salesdb.MaterialGroup;
  entity PersonnelNumbers           as projection on salesdb.PersonnelNumber;
  entity UnitOfMeasurements         as projection on salesdb.UnitOfMeasurement;
  entity ServiceTypes               as projection on salesdb.ServiceType;
  entity Formulas                   as projection on salesdb.Formula;
  entity ModelSpecifications        as projection on salesdb.ModelSpecifications;
  entity ExecutionOrderMains        as projection on salesdb.ExecutionOrderMain;
  entity InvoiceMainItems           as projection on salesdb.InvoiceMainItem;
  entity ModelSpecificationsDetails as projection on salesdb.ModelSpecificationsDetails;
  entity ServiceNumbers             as projection on salesdb.ServiceNumber;
  entity ServiceInvoiceMains        as projection on salesdb.ServiceInvoiceMain;
  entity InvoiceSubItems            as projection on salesdb.InvoiceSubItem;

  // Equivalent to /mainitems/{salesQuotation}/{salesQuotationItem}
  function getSalesQuotationItemById(salesQuotation : String, salesQuotationItem : String) returns String;

  // Equivalent to /mainitems/referenceid?referenceId=...
  // function getInvoiceMainItemsByReferenceId(referenceId : String) returns many MainItems;



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

  entity SalesQuotations @readonly {
    key SalesQuotation     : String;
        SalesQuotationType : String;
        SalesOrganization  : String;
        CreatedByUser      : String;
  }

  entity SalesQuotationItem @readonly {
    key SalesQuotation     : String;
    key SalesQuotationItem : String;
        Material           : String;
        RequestedQuantity  : Decimal(13, 3);
  }

  entity SalesQuotationItems @readonly {
    key SalesQuotation     : String;
    key SalesQuotationItem : String;
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
