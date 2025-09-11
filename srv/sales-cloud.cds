// service SalesOrderCloudService @(path: '/salesordercloud') {
//   @cds.persistence.skip
//   entity SalesOrders {
//     key virtualKey : String;  
//   };
// }

// service SalesOrderItemsCloudService @(path: '/salesorderitemscloud') {
//   @cds.persistence.skip
//   entity SalesOrderItems {
//     key virtualKey : String; 
//   };
// }

// service SalesOrderItemCloudService @(path: '/salesorderitemcloud') {
//   @cds.persistence.skip
//   entity SalesOrderItemsById {
//     key virtualKey : String;  
//     SalesOrderID  : String;
//   };
// }

// service SalesOrderAllPricingCloudService @(path: '/salesorderallpricingcloud') {
//   @cds.persistence.skip
//   entity SalesOrderPricingElement {
//     key virtualKey : String; 
//   };
// }

// service SalesOrderItemPricingCloudService @(path: '/salesorderitempricingcloud') {
//   @cds.persistence.skip
//   entity SalesOrderByItem {
//     key virtualKey : String;  
//     SalesOrder    : String;
//     SalesOrderItem : String;
//   };
// }

// service SalesOrderPricingCloudService @(path: '/salesorderpricingcloud') {
//   @cds.persistence.skip
//   entity SalesOrderPricing {
//     key virtualKey : String; 
//     SalesOrder    : String;
//     SalesOrderItem : String;
//   };
// }

// service SalesQuotationCloudService @(path: '/salesquotationcloud') {
//   @cds.persistence.skip
//   entity SalesQuotation {
//     key virtualKey : String;  
//   };
// }

// service SalesQuotationItemCloudService @(path: '/salesquotationitemcloud') {
//   @cds.persistence.skip
//   entity SalesQuotationItem {
//     key virtualKey : String;  
//     SalesQuotationID : String;
//   };
// }

// service SalesQuotationItemsCloudService @(path: '/salesquotationitemscloud') {
//   @cds.persistence.skip
//   entity SalesQuotationItems {
//     key virtualKey : String;  
//   };
// }

// service SalesQuotationPricingCloudService @(path: '/salesquotationpricingcloud') {
//   @cds.persistence.skip
//   entity SalesQuotationPricing {
//     key virtualKey : String;  
//     SalesQuotation    : String;
//     SalesQuotationItem : String;
//   };
// }

// service DebitMemoCloudService @(path: '/debitmemocloud') {
//   @cds.persistence.skip
//   entity DebitMemo {
//     key virtualKey : String;   
//   };
// }

// service DebitMemoItemsCloudService @(path: '/debitmemoitemscloud') {
//   @cds.persistence.skip
//   entity DebitMemoPricing {
//     key virtualKey : String;  
//   };
// }

// service DebitMemoRequestItemCloudService @(path: '/debitmemorequestitemcloud') {
//   @cds.persistence.skip
//   entity DebitMemoRequestItems {
//     key virtualKey : String;  
//     DebitMemoRequest : String;
//   };
// }

// service DebitMemoRequestItemByItemCloudService @(path: '/debitmemorequestitemcloud') {
//   @cds.persistence.skip
//   entity DebitMemoRequestByItem {
//     key virtualKey : String;  
//     DebitMemoRequest    : String;
//     DebitMemoRequestItem : String;
//   };
// }

// service SalesQuotationPostCloudService @(path: '/salesquotationpricingcloudpatch') {
//   action patchSalesQuotationItemPricing(SalesQuotation: String, SalesQuotationItem: String, PricingProcedureStep: Integer, PricingProcedureCounter: Integer, body: String) returns String;
// }

// service SalesOrderPostCloudService @(path: '/salesorderitempricingcloudpost') {
//   action patchSalesOrderItemPricing(SalesOrder: String, SalesOrderItem: String, PricingProcedureStep: Integer, PricingProcedureCounter: Integer, body: String) returns String;
// }

// service DebitMemoPostCloudService @(path: '/debitmemopostcloudpatch') {
//   action patchDebitMemoItemPricing(DebitMemoRequest: String, DebitMemoRequestItem: String, PricingProcedureStep: Integer, PricingProcedureCounter: Integer, body: String) returns String;
// }