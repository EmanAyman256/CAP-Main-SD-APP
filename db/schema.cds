namespace my.costplan;

using {
    cuid,
    managed
} from '@sap/cds/common';


// E and D Category
entity EngineeringDesignEntry {
    key ID            : UUID;
        ShortText     : String(100); // 👈 Add this line
        item          : Association to CostItem;

        Salesdocument : String(20);
        ItemNumber    : String(10);
        description   : String(30);
        Salary        : Decimal(13, 2);
        Months        : Integer;
        NoOfPersons   : Integer;
        Amount        : Decimal(10, 2);
        CreatedAt     : Timestamp;
}

// // Indirect Cost Category
entity IndirectCostEntry {
    key ID            : UUID;
        ShortText     : String(100); // 👈 Add this line
        item          : Association to CostItem;

        Salesdocument : String(20);
        ItemNumber    : String(10);
        Description   : String(100);
        Unit          : String(10);
        Qty           : Decimal(10, 2);
        Cost          : Decimal(10, 2);
        Labour        : String(50);
        Total         : Decimal(4, 2);
        CreatedAt     : Timestamp;
}

// // Material Category
entity MaterialEntry {
    key ID                      : UUID;
        ShortText               : String(100); // 👈 Add this
        item                    : Association to CostItem;
        Salesdocument           : String(20);
        ItemNumber              : String(10);
        Description             : String(100);
        VendorDetails           : String(100);
        QuotationDate           : Date;
        QuotationPrice          : Decimal(13, 2);
        PaymentTerms            : String(20);
        FreightClearanceCharges : Decimal(13, 2);
        TransportationCharges   : Decimal(13, 2);
        Saber                   : Decimal(13, 2);
        TotalSubCharges         : Decimal(13, 2);
        TotalPrice              : Decimal(15, 2);
        CreatedAt               : Timestamp;
}

// // Cables Category
entity CablesEntry {
    key ID               : UUID;
        ShortText        : String(100); // 👈 Add this line
        item             : Association to CostItem;

        Salesdocument    : String(20);
        ItemNumber       : String(10);
        Description      : String(100);
        Circuit          : Integer;
        Runs             : Integer;
        NoOfPh           : Integer;
        ApproximateMeter : Decimal(13, 2);
        Total            : Decimal(13, 2);
        UnitPrice        : Decimal(13, 2);
        TotalPrice       : Decimal(15, 2);
        CreatedAt        : Timestamp;
}

entity CostItem : cuid, managed {
    Salesdocument    : String(20);
    ItemNumber       : String(10);
    ShortText        : String(100);

    // Shared fields
    CostingModelType : String(50); // Material, Indirect Cost, etc.
    TotalSurcharge   : Decimal(15, 2); // Calculated or entered
    Category         : String(50); // e.g., "E and D", "Material"

    // Associations to category-specific details
    engDesignDetails : Composition of one EngineeringDesignEntry
                           on engDesignDetails.item = $self;

    indirectDetails  : Composition of one IndirectCostEntry
                           on indirectDetails.item = $self;

    materialDetails  : Composition of one MaterialEntry
                           on materialDetails.item = $self;

    cablesDetails    : Composition of one CablesEntry
                           on cablesDetails.item = $self;
}


// ------------------- Simple DTO-like classes -------------------

type CalculatedQuantitiesResponse : {
  actualQuantity     : Decimal;
  remainingQuantity  : Decimal;
  total              : Decimal;
  actualPercentage   : Decimal;
  totalHeader        : Decimal;
}

type TempExecutionOrderData : {
  actualQuantity       : Decimal;
  remainingQuantity    : Decimal;
  actualPercentage     : Decimal;
  totalHeader          : Decimal;
  total                : Decimal;
  amountPerUnit        : Decimal;
  quantities           : array of Decimal;
  processed            : array of Boolean;
  currentQuantityIndex : Integer;
}

type TotalResult : {
  totalWithProfit : Decimal;
  amountPerUnit   : Decimal;
}

// ------------------- Master Data -------------------

entity Currency {
  key currencyCode : Integer;
  code             : String(225);
  description      : String;
}

entity LineType {
  key lineTypeCode : Integer;
  code             : String(225);
  description      : String;
}

entity MaterialGroup {
  key materialGroupCode : Integer;
  code                  : String(225);
  description           : String;
}

entity PersonnelNumber {
  key personnelNumberCode : Integer;
  code                    : String(225);
  description             : String;
}

entity UnitOfMeasurement {
  key unitOfMeasurementCode : Integer;
  code                      : String(8);
  description               : String;
}

entity ServiceType {
  key serviceTypeCode : Integer;
  serviceId           : String(225);
  description         : String;
  lastChangeDate      : Date;
}

// ------------------- Service Number -------------------

entity ServiceNumber {
  key serviceNumberCode       : Integer;
  serviceNumberCodeString     : String;
  noServiceNumber             : Integer;
  searchTerm                  : String;
  serviceTypeCode             : String;
  materialGroupCode           : String;
  unitOfMeasurementCode       : String;
  description                 : String;
  shortTextChangeAllowed      : Boolean;
  deletionIndicator           : Boolean;
  mainItem                    : Boolean;
  numberToBeConverted         : Integer;
  convertedNumber             : Integer;
  lastChangeDate              : Date;
  serviceText                 : String;
  baseUnitOfMeasurement       : String;
  toBeConvertedUnitOfMeasurement : String;
  defaultUnitOfMeasurement    : String;

  modelSpecificationsDetails : Composition of many ModelSpecificationsDetails on modelSpecificationsDetails.serviceNumber = $self;
  mainItemSet                : Composition of many InvoiceMainItem         on mainItemSet.serviceNumber = $self;
  subItemSet                 : Composition of many InvoiceSubItem          on subItemSet.serviceNumber = $self;
  serviceInvoiceMainSet      : Composition of many ServiceInvoiceMain      on serviceInvoiceMainSet.serviceNumber = $self;
  executionOrderMainSet      : Composition of many ExecutionOrderMain      on executionOrderMainSet.serviceNumber = $self;
}

// ------------------- Formulas -------------------

entity Formula {
  key formulaCode       : Integer;
  formula              : String(4);
  description          : String;
  numberOfParameters   : Integer;
  parameterIds         : array of String;
  parameterDescriptions: array of String;
  testParameters       : array of Decimal;
  formulaLogic         : String;
  expression           : String;
  result               : Decimal;
}

// ------------------- Execution Orders & Invoices -------------------

entity ExecutionOrderMain {
  key executionOrderMainCode : Integer;

  referenceSDDocument   : String;
  salesOrderItem        : String;
  debitMemoRequestItem  : String;
  salesOrderItemText    : String;
  referenceId           : String;
  serviceNumberCode     : Integer;
  description           : String;
  unitOfMeasurementCode : String;
  currencyCode          : String;
  materialGroupCode     : String;
  personnelNumberCode   : String;
  lineTypeCode          : String;
  serviceTypeCode       : String;

  totalQuantity          : Decimal;
  remainingQuantity      : Decimal;
  amountPerUnit          : Decimal;
  total                  : Decimal;
  totalHeader            : Decimal;
  actualQuantity         : Decimal;
  previousQuantity       : Decimal;
  actualPercentage       : Decimal;
  overFulfillmentPercent : Decimal;

  unlimitedOverFulfillment   : Boolean;
  manualPriceEntryAllowed    : Boolean;
  externalServiceNumber      : String;
  serviceText                : String;
  lineText                   : String;
  lineNumber                 : String(225);
  biddersLine                : Boolean;
  supplementaryLine          : Boolean;
  lotCostOne                 : Boolean;
  doNotPrint                 : Boolean;
  deletionIndicator          : Boolean;

  serviceNumber     : Association to ServiceNumber;
  serviceInvoiceMain: Composition of ServiceInvoiceMain;
}

entity ServiceInvoiceMain {
  key serviceInvoiceCode : Integer;

  executionOrderMainCode : Integer;
  referenceSDDocument    : String;
  debitMemoRequestItem   : String;
  debitMemoRequestItemText: String;
  referenceId            : String;
  serviceNumberCode      : Integer;
  description            : String;
  unitOfMeasurementCode  : String;
  currencyCode           : String;
  materialGroupCode      : String;
  personnelNumberCode    : String;
  lineTypeCode           : String;
  serviceTypeCode        : String;

  remainingQuantity      : Decimal;
  quantity               : Decimal;
  currentPercentage      : Decimal;
  totalQuantity          : Decimal;
  amountPerUnit          : Decimal;
  total                  : Decimal;
  actualQuantity         : Decimal;
  actualPercentage       : Decimal;
  overFulfillmentPercent : Decimal;

  unlimitedOverFulfillment : Boolean;
  externalServiceNumber    : String;
  serviceText              : String;
  lineText                 : String;
  lineNumber               : String(225);
  biddersLine              : Boolean;
  supplementaryLine        : Boolean;
  lotCostOne               : Boolean;
  doNotPrint               : Boolean;
  alternatives             : String;
  totalHeader              : Decimal;
  temporaryDeletion        : String(9);

  serviceNumber     : Association to ServiceNumber;
  executionOrderMain: Association to ExecutionOrderMain;
}

entity InvoiceMainItem {
  key invoiceMainItemCode : Integer;

  uniqueId              : String;
  referenceSDDocument   : String;
  salesQuotationItem    : String;
  salesOrderItem        : String;
  salesQuotationItemText: String;
  referenceId           : String;
  serviceNumberCode     : Integer;
  unitOfMeasurementCode : String;
  currencyCode          : String;
  formulaCode           : String;
  description           : String;

  quantity              : Decimal;
  amountPerUnit         : Decimal;
  total                 : Decimal;
  totalHeader           : Decimal;
  profitMargin          : Decimal;
  totalWithProfit       : Decimal;
  amountPerUnitWithProfit : Decimal;
  doNotPrint            : Boolean;
  lineNumber            : String(225);

  subItemList  : Composition of many InvoiceSubItem on subItemList.mainItem = $self;
  serviceNumber: Association to ServiceNumber;
}

entity InvoiceSubItem {
  key invoiceSubItemCode : Integer;

  invoiceMainItemCode : Integer;
  serviceNumberCode   : Integer;
  unitOfMeasurementCode : String;
  currencyCode        : String;
  formulaCode         : String;
  description         : String;
  quantity            : Decimal;
  amountPerUnit       : Decimal;
  total               : Decimal;

  mainItem     : Association to InvoiceMainItem;
  serviceNumber: Association to ServiceNumber;
}

// ------------------- Model Specifications -------------------

entity ModelSpecifications {
  key modelSpecCode        : Integer;
  modelSpecDetailsCode     : array of Integer;
  currencyCode             : String;
  modelServSpec            : String(225);
  blockingIndicator        : Boolean;
  serviceSelection         : Boolean;
  description              : String;
  searchTerm               : String;
  lastChangeDate           : Date;

  modelSpecificationsDetails : Association to ModelSpecificationsDetails;
}

entity ModelSpecificationsDetails {
  key modelSpecDetailsCode : Integer;

  serviceNumberCode        : Integer;
  noServiceNumber          : Integer;
  serviceTypeCode          : String;
  materialGroupCode        : String;
  personnelNumberCode      : String;
  unitOfMeasurementCode    : String;
  currencyCode             : String;
  formulaCode              : String;
  lineTypeCode             : String;

  selectionCheckBox        : Boolean;
  lineIndex                : String(225);
  shortText                : String;
  quantity                 : Integer;
  grossPrice               : Integer;
  overFulfilmentPercentage : Integer;
  priceChangedAllowed      : Boolean;
  unlimitedOverFulfillment : Boolean;
  pricePerUnitOfMeasurement: Integer;
  externalServiceNumber    : String(225);
  netValue                 : Integer;
  serviceText              : String;
  lineText                 : String;
  lineNumber               : String(225);
  alternatives             : String;
  biddersLine              : Boolean;
  supplementaryLine        : Boolean;
  lotSizeForCostingIsOne   : Boolean;
  lastChangeDate           : Date;

  modelSpecifications : Composition of many ModelSpecifications on modelSpecifications.modelSpecificationsDetails = $self;
  serviceNumber       : Association to ServiceNumber;
}
