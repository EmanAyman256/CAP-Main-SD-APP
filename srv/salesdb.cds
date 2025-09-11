// namespace salesdb;

// using { managed } from '@sap/cds/common';
// using { salesdb as db } from '../db/sales-cloud-schema.cds';

// service CurrencyService @(path: '/currencies') {
//   entity Currency as select from db.Currency;
// }

// service LineTypeService @(path: '/linetypes') {
//   entity LineType as select from db.LineType;
//   action createLineType(lineTypeCode: Integer, code: String(225), description: String) returns LineType;
// }

// service MaterialGroupService @(path: '/materialgroups') {
//   entity MaterialGroup as select from db.MaterialGroup;
// }

// service PersonnelNumberService @(path: '/personnelnumbers') {
//   entity PersonnelNumber as select from db.PersonnelNumber;
// }

// service UnitOfMeasurementService @(path: '/measurements') {
//   entity UnitOfMeasurement as select from db.UnitOfMeasurement;
// }

// service ServiceTypeService @(path: '/servicetypes') {
//   entity ServiceType as select from db.ServiceType;
// }