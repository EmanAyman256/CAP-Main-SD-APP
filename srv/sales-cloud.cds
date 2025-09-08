service SalesOrderCloudService @(path: '/salesordercloud') {
  @cds.persistence.skip
  entity SalesOrders {
    key virtualKey : String;  // Minimal key to satisfy CDS syntax
  };
}

service SalesOrderItemsCloudService @(path: '/salesorderitemscloud') {
  @cds.persistence.skip
  entity SalesOrderItems {
    key virtualKey : String;  // Minimal key to satisfy CDS syntax
  };
}

service SalesOrderItemCloudService @(path: '/salesorderitemcloud') {
  @cds.persistence.skip
  entity SalesOrderItemsById {
    key virtualKey : String;  // Minimal key to satisfy CDS syntax
    SalesOrderID  : String;
  };
}

service SalesOrderAllPricingCloudService @(path: '/salesorderallpricingcloud') {
  @cds.persistence.skip
  entity SalesOrderPricingElement {
    key virtualKey : String;  // Minimal key to satisfy CDS syntax
  };
}

service SalesOrderItemPricingCloudService @(path: '/salesorderitempricingcloud') {
  @cds.persistence.skip
  entity SalesOrderByItem {
    key virtualKey : String;  // Minimal key to satisfy CDS syntax
    SalesOrder    : String;
    SalesOrderItem : String;
  };
}

service SalesOrderPricingCloudService @(path: '/salesorderpricingcloud') {
  @cds.persistence.skip
  entity SalesOrderPricing {
    key virtualKey : String;  // Minimal key to satisfy CDS syntax
    SalesOrder    : String;
    SalesOrderItem : String;
  };
}

service SalesQuotationCloudService @(path: '/salesquotationcloud') {
  @cds.persistence.skip
  entity SalesQuotation {
    key virtualKey : String;  // Minimal key to satisfy CDS syntax
  };
}

service SalesQuotationItemCloudService @(path: '/salesquotationitemcloud') {
  @cds.persistence.skip
  entity SalesQuotationItem {
    key virtualKey : String;  // Minimal key to satisfy CDS syntax
    SalesQuotationID : String;
  };
}

service SalesQuotationItemsCloudService @(path: '/salesquotationitemscloud') {
  @cds.persistence.skip
  entity SalesQuotationItems {
    key virtualKey : String;  // Minimal key to satisfy CDS syntax
  };
}

service SalesQuotationPricingCloudService @(path: '/salesquotationpricingcloud') {
  @cds.persistence.skip
  entity SalesQuotationPricing {
    key virtualKey : String;  // Minimal key to satisfy CDS syntax
    SalesQuotation    : String;
    SalesQuotationItem : String;
  };
}

service DebitMemoCloudService @(path: '/debitmemocloud') {
  @cds.persistence.skip
  entity DebitMemo {
    key virtualKey : String;  // Minimal key to satisfy CDS syntax
  };
}

service DebitMemoItemsCloudService @(path: '/debitmemoitemscloud') {
  @cds.persistence.skip
  entity DebitMemoPricing {
    key virtualKey : String;  // Minimal key to satisfy CDS syntax
  };
}

service DebitMemoRequestItemCloudService @(path: '/debitmemorequestitemcloud') {
  @cds.persistence.skip
  entity DebitMemoRequestItems {
    key virtualKey : String;  // Minimal key to satisfy CDS syntax
    DebitMemoRequest : String;
  };
}

service DebitMemoRequestItemByItemCloudService @(path: '/debitmemorequestitemcloud') {
  @cds.persistence.skip
  entity DebitMemoRequestByItem {
    key virtualKey : String;  // Minimal key to satisfy CDS syntax
    DebitMemoRequest    : String;
    DebitMemoRequestItem : String;
  };
}