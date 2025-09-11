// const cds = require('@sap/cds');

// module.exports = cds.service.impl(async function () {
//   const { Currency, LineType, MaterialGroup, PersonnelNumber, UnitOfMeasurement, ServiceType } = this.entities;

//   console.log('Entities loaded:', Object.keys(this.entities)); // Debug entity binding

//   // --- Currency Handlers ---
//   if (Currency) {
//     this.on('READ', Currency, async (req) => {
//       console.log('Executing READ for all Currencies');
//       try {
//         const tx = cds.tx(req);
//         const currencies = await tx.run(SELECT.from(Currency));
//         console.log('Currency response:', JSON.stringify(currencies));
//         return currencies;
//       } catch (error) {
//         console.error('Error in READ Currency:', error.message);
//         throw new Error(`Database query failed: ${error.message}`);
//       }
//     });

//     this.on('READ', Currency, async (req) => {
//       console.log('Executing READ for Currency by ID');
//       const currencyCode = req.params[0]?.currencyCode || req.query.SELECT.where?.find(w => w.ref?.[0] === 'currencyCode')?.val;
//       if (!currencyCode) {
//         throw new Error('Currency code is required');
//       }
//       try {
//         const tx = cds.tx(req);
//         const currency = await tx.run(SELECT.one.from(Currency).where({ currencyCode: currencyCode }));
//         console.log('Currency response by ID:', JSON.stringify(currency));
//         return currency;
//       } catch (error) {
//         console.error('Error in READ Currency by ID:', error.message);
//         throw new Error(`Database query failed: ${error.message}`);
//       }
//     });

//     this.on('CREATE', Currency, async (req) => {
//       console.log('Executing CREATE for new Currency');
//       const newCurrency = req.data;
//       try {
//         const tx = cds.tx(req);
//         const created = await tx.run(INSERT.into(Currency).entries(newCurrency));
//         console.log('Created Currency:', JSON.stringify(created));
//         await tx.commit();
//         return created;
//       } catch (error) {
//         console.error('Error in CREATE Currency:', error.message);
//         await tx.rollback();
//         throw new Error(`Database insert failed: ${error.message}`);
//       }
//     });

//     this.on('DELETE', Currency, async (req) => {
//       console.log('Executing DELETE for Currency');
//       const currencyCode = req.params[0]?.currencyCode || req.query.SELECT.where?.find(w => w.ref?.[0] === 'currencyCode')?.val;
//       if (!currencyCode) {
//         throw new Error('Currency code is required');
//       }
//       try {
//         const tx = cds.tx(req);
//         const deleted = await tx.run(DELETE.from(Currency).where({ currencyCode: currencyCode }));
//         console.log('Deleted Currency:', JSON.stringify(deleted));
//         await tx.commit();
//         return { success: true };
//       } catch (error) {
//         console.error('Error in DELETE Currency:', error.message);
//         await tx.rollback();
//         throw new Error(`Database delete failed: ${error.message}`);
//       }
//     });

//     this.on('UPDATE', Currency, async (req) => {
//       console.log('Executing UPDATE for Currency');
//       const currencyCode = req.params[0]?.currencyCode || req.query.SELECT.where?.find(w => w.ref?.[0] === 'currencyCode')?.val;
//       if (!currencyCode) {
//         throw new Error('Currency code is required');
//       }
//       try {
//         const tx = cds.tx(req);
//         const updated = await tx.run(UPDATE(Currency).with(req.data).where({ currencyCode: currencyCode }));
//         console.log('Updated Currency:', JSON.stringify(updated));
//         await tx.commit();
//         return updated;
//       } catch (error) {
//         console.error('Error in UPDATE Currency:', error.message);
//         await tx.rollback();
//         throw new Error(`Database update failed: ${error.message}`);
//       }
//     });
//   }

//   // --- LineType Handlers ---
//   if (LineType) {
//     this.on('READ', LineType, async (req) => {
//       console.log('Executing READ for all LineTypes');
//       try {
//         const tx = cds.tx(req);
//         const lineTypes = await tx.run(SELECT.from(LineType));
//         console.log('LineType response:', JSON.stringify(lineTypes));
//         return lineTypes;
//       } catch (error) {
//         console.error('Error in READ LineType:', error.message);
//         throw new Error(`Database query failed: ${error.message}`);
//       }
//     });

//     this.on('READ', LineType, async (req) => {
//       console.log('Executing READ for LineType by ID');
//       const lineTypeCode = req.params[0]?.lineTypeCode || req.query.SELECT.where?.find(w => w.ref?.[0] === 'lineTypeCode')?.val;
//       if (!lineTypeCode) {
//         throw new Error('LineType code is required');
//       }
//       try {
//         const tx = cds.tx(req);
//         const lineType = await tx.run(SELECT.one.from(LineType).where({ lineTypeCode: lineTypeCode }));
//         console.log('LineType response by ID:', JSON.stringify(lineType));
//         return lineType;
//       } catch (error) {
//         console.error('Error in READ LineType by ID:', error.message);
//         throw new Error(`Database query failed: ${error.message}`);
//       }
//     });

//     this.on('CREATE', LineType, async (req) => {
//       console.log('Executing CREATE for new LineType');
//       const newLineType = req.data;
//       try {
//         const tx = cds.tx(req);
//         const created = await tx.run(INSERT.into(LineType).entries(newLineType));
//         console.log('Created LineType:', JSON.stringify(created));
//         await tx.commit();
//         return created;
//       } catch (error) {
//         console.error('Error in CREATE LineType:', error.message);
//         await tx.rollback();
//         throw new Error(`Database insert failed: ${error.message}`);
//       }
//     });

//     this.on('createLineType', LineType, async (req) => {
//       console.log('Executing createLineType action for new LineType', JSON.stringify(req.data));
//       const { lineTypeCode, code, description } = req.data;
//       if (!lineTypeCode || !code || !description) {
//         throw new Error('lineTypeCode, code, and description are required');
//       }
//       try {
//         const tx = cds.tx(req);
//         const insertData = { lineTypeCode, code, description };
//         console.log('Inserting data:', JSON.stringify(insertData));
//         const created = await tx.run(INSERT.into(LineType).entries(insertData));
//         console.log('Inserted LineType result:', JSON.stringify(created));
//         await tx.commit();
//         if (!created || created.length === 0) {
//           throw new Error('No record created');
//         }
//         const result = await tx.run(SELECT.one.from(LineType).where({ lineTypeCode }));
//         console.log('Fetched created LineType:', JSON.stringify(result));
//         return result;
//       } catch (error) {
//         console.error('Error in createLineType:', error.message);
//         await tx.rollback();
//         throw new Error(`Database insert failed: ${error.message}`);
//       }
//     });

//     this.on('DELETE', LineType, async (req) => {
//       console.log('Executing DELETE for LineType');
//       const lineTypeCode = req.params[0]?.lineTypeCode || req.query.SELECT.where?.find(w => w.ref?.[0] === 'lineTypeCode')?.val;
//       if (!lineTypeCode) {
//         throw new Error('LineType code is required');
//       }
//       try {
//         const tx = cds.tx(req);
//         const deleted = await tx.run(DELETE.from(LineType).where({ lineTypeCode: lineTypeCode }));
//         console.log('Deleted LineType:', JSON.stringify(deleted));
//         await tx.commit();
//         return { success: true };
//       } catch (error) {
//         console.error('Error in DELETE LineType:', error.message);
//         await tx.rollback();
//         throw new Error(`Database delete failed: ${error.message}`);
//       }
//     });

//     this.on('UPDATE', LineType, async (req) => {
//       console.log('Executing UPDATE for LineType');
//       const lineTypeCode = req.params[0]?.lineTypeCode || req.query.SELECT.where?.find(w => w.ref?.[0] === 'lineTypeCode')?.val;
//       if (!lineTypeCode) {
//         throw new Error('LineType code is required');
//       }
//       try {
//         const tx = cds.tx(req);
//         const updated = await tx.run(UPDATE(LineType).with(req.data).where({ lineTypeCode: lineTypeCode }));
//         console.log('Updated LineType:', JSON.stringify(updated));
//         await tx.commit();
//         return updated;
//       } catch (error) {
//         console.error('Error in UPDATE LineType:', error.message);
//         await tx.rollback();
//         throw new Error(`Database update failed: ${error.message}`);
//       }
//     });
//   }

//   // --- MaterialGroup Handlers ---
//   if (MaterialGroup) {
//     this.on('READ', MaterialGroup, async (req) => {
//       console.log('Executing READ for all MaterialGroups');
//       try {
//         const tx = cds.tx(req);
//         const materialGroups = await tx.run(SELECT.from(MaterialGroup));
//         console.log('MaterialGroup response:', JSON.stringify(materialGroups));
//         return materialGroups;
//       } catch (error) {
//         console.error('Error in READ MaterialGroup:', error.message);
//         throw new Error(`Database query failed: ${error.message}`);
//       }
//     });

//     this.on('READ', MaterialGroup, async (req) => {
//       console.log('Executing READ for MaterialGroup by ID');
//       const materialGroupCode = req.params[0]?.materialGroupCode || req.query.SELECT.where?.find(w => w.ref?.[0] === 'materialGroupCode')?.val;
//       if (!materialGroupCode) {
//         throw new Error('MaterialGroup code is required');
//       }
//       try {
//         const tx = cds.tx(req);
//         const materialGroup = await tx.run(SELECT.one.from(MaterialGroup).where({ materialGroupCode: materialGroupCode }));
//         console.log('MaterialGroup response by ID:', JSON.stringify(materialGroup));
//         return materialGroup;
//       } catch (error) {
//         console.error('Error in READ MaterialGroup by ID:', error.message);
//         throw new Error(`Database query failed: ${error.message}`);
//       }
//     });

//     this.on('CREATE', MaterialGroup, async (req) => {
//       console.log('Executing CREATE for new MaterialGroup');
//       const newMaterialGroup = req.data;
//       try {
//         const tx = cds.tx(req);
//         const created = await tx.run(INSERT.into(MaterialGroup).entries(newMaterialGroup));
//         console.log('Created MaterialGroup:', JSON.stringify(created));
//         await tx.commit();
//         return created;
//       } catch (error) {
//         console.error('Error in CREATE MaterialGroup:', error.message);
//         await tx.rollback();
//         throw new Error(`Database insert failed: ${error.message}`);
//       }
//     });

//     this.on('DELETE', MaterialGroup, async (req) => {
//       console.log('Executing DELETE for MaterialGroup');
//       const materialGroupCode = req.params[0]?.materialGroupCode || req.query.SELECT.where?.find(w => w.ref?.[0] === 'materialGroupCode')?.val;
//       if (!materialGroupCode) {
//         throw new Error('MaterialGroup code is required');
//       }
//       try {
//         const tx = cds.tx(req);
//         const deleted = await tx.run(DELETE.from(MaterialGroup).where({ materialGroupCode: materialGroupCode }));
//         console.log('Deleted MaterialGroup:', JSON.stringify(deleted));
//         await tx.commit();
//         return { success: true };
//       } catch (error) {
//         console.error('Error in DELETE MaterialGroup:', error.message);
//         await tx.rollback();
//         throw new Error(`Database delete failed: ${error.message}`);
//       }
//     });

//     this.on('UPDATE', MaterialGroup, async (req) => {
//       console.log('Executing UPDATE for MaterialGroup');
//       const materialGroupCode = req.params[0]?.materialGroupCode || req.query.SELECT.where?.find(w => w.ref?.[0] === 'materialGroupCode')?.val;
//       if (!materialGroupCode) {
//         throw new Error('MaterialGroup code is required');
//       }
//       try {
//         const tx = cds.tx(req);
//         const updated = await tx.run(UPDATE(MaterialGroup).with(req.data).where({ materialGroupCode: materialGroupCode }));
//         console.log('Updated MaterialGroup:', JSON.stringify(updated));
//         await tx.commit();
//         return updated;
//       } catch (error) {
//         console.error('Error in UPDATE MaterialGroup:', error.message);
//         await tx.rollback();
//         throw new Error(`Database update failed: ${error.message}`);
//       }
//     });
//   }

//   // --- PersonnelNumber Handlers ---
//   if (PersonnelNumber) {
//     this.on('READ', PersonnelNumber, async (req) => {
//       console.log('Executing READ for all PersonnelNumbers');
//       try {
//         const tx = cds.tx(req);
//         const personnelNumbers = await tx.run(SELECT.from(PersonnelNumber));
//         console.log('PersonnelNumber response:', JSON.stringify(personnelNumbers));
//         return personnelNumbers;
//       } catch (error) {
//         console.error('Error in READ PersonnelNumber:', error.message);
//         throw new Error(`Database query failed: ${error.message}`);
//       }
//     });

//     this.on('READ', PersonnelNumber, async (req) => {
//       console.log('Executing READ for PersonnelNumber by ID');
//       const personnelNumberCode = req.params[0]?.personnelNumberCode || req.query.SELECT.where?.find(w => w.ref?.[0] === 'personnelNumberCode')?.val;
//       if (!personnelNumberCode) {
//         throw new Error('PersonnelNumber code is required');
//       }
//       try {
//         const tx = cds.tx(req);
//         const personnelNumber = await tx.run(SELECT.one.from(PersonnelNumber).where({ personnelNumberCode: personnelNumberCode }));
//         console.log('PersonnelNumber response by ID:', JSON.stringify(personnelNumber));
//         return personnelNumber;
//       } catch (error) {
//         console.error('Error in READ PersonnelNumber by ID:', error.message);
//         throw new Error(`Database query failed: ${error.message}`);
//       }
//     });

//     this.on('CREATE', PersonnelNumber, async (req) => {
//       console.log('Executing CREATE for new PersonnelNumber');
//       const newPersonnelNumber = req.data;
//       try {
//         const tx = cds.tx(req);
//         const created = await tx.run(INSERT.into(PersonnelNumber).entries(newPersonnelNumber));
//         console.log('Created PersonnelNumber:', JSON.stringify(created));
//         await tx.commit();
//         return created;
//       } catch (error) {
//         console.error('Error in CREATE PersonnelNumber:', error.message);
//         await tx.rollback();
//         throw new Error(`Database insert failed: ${error.message}`);
//       }
//     });

//     this.on('DELETE', PersonnelNumber, async (req) => {
//       console.log('Executing DELETE for PersonnelNumber');
//       const personnelNumberCode = req.params[0]?.personnelNumberCode || req.query.SELECT.where?.find(w => w.ref?.[0] === 'personnelNumberCode')?.val;
//       if (!personnelNumberCode) {
//         throw new Error('PersonnelNumber code is required');
//       }
//       try {
//         const tx = cds.tx(req);
//         const deleted = await tx.run(DELETE.from(PersonnelNumber).where({ personnelNumberCode: personnelNumberCode }));
//         console.log('Deleted PersonnelNumber:', JSON.stringify(deleted));
//         await tx.commit();
//         return { success: true };
//       } catch (error) {
//         console.error('Error in DELETE PersonnelNumber:', error.message);
//         await tx.rollback();
//         throw new Error(`Database delete failed: ${error.message}`);
//       }
//     });

//     this.on('UPDATE', PersonnelNumber, async (req) => {
//       console.log('Executing UPDATE for PersonnelNumber');
//       const personnelNumberCode = req.params[0]?.personnelNumberCode || req.query.SELECT.where?.find(w => w.ref?.[0] === 'personnelNumberCode')?.val;
//       if (!personnelNumberCode) {
//         throw new Error('PersonnelNumber code is required');
//       }
//       try {
//         const tx = cds.tx(req);
//         const updated = await tx.run(UPDATE(PersonnelNumber).with(req.data).where({ personnelNumberCode: personnelNumberCode }));
//         console.log('Updated PersonnelNumber:', JSON.stringify(updated));
//         await tx.commit();
//         return updated;
//       } catch (error) {
//         console.error('Error in UPDATE PersonnelNumber:', error.message);
//         await tx.rollback();
//         throw new Error(`Database update failed: ${error.message}`);
//       }
//     });
//   }

//   // --- UnitOfMeasurement Handlers ---
//   if (UnitOfMeasurement) {
//     this.on('READ', UnitOfMeasurement, async (req) => {
//       console.log('Executing READ for all UnitOfMeasurements');
//       try {
//         const tx = cds.tx(req);
//         const units = await tx.run(SELECT.from(UnitOfMeasurement));
//         console.log('UnitOfMeasurement response:', JSON.stringify(units));
//         return units;
//       } catch (error) {
//         console.error('Error in READ UnitOfMeasurement:', error.message);
//         throw new Error(`Database query failed: ${error.message}`);
//       }
//     });

//     this.on('READ', UnitOfMeasurement, async (req) => {
//       console.log('Executing READ for UnitOfMeasurement by ID');
//       const unitOfMeasurementCode = req.params[0]?.unitOfMeasurementCode || req.query.SELECT.where?.find(w => w.ref?.[0] === 'unitOfMeasurementCode')?.val;
//       if (!unitOfMeasurementCode) {
//         throw new Error('UnitOfMeasurement code is required');
//       }
//       try {
//         const tx = cds.tx(req);
//         const unit = await tx.run(SELECT.one.from(UnitOfMeasurement).where({ unitOfMeasurementCode: unitOfMeasurementCode }));
//         console.log('UnitOfMeasurement response by ID:', JSON.stringify(unit));
//         return unit;
//       } catch (error) {
//         console.error('Error in READ UnitOfMeasurement by ID:', error.message);
//         throw new Error(`Database query failed: ${error.message}`);
//       }
//     });

//     this.on('CREATE', UnitOfMeasurement, async (req) => {
//       console.log('Executing CREATE for new UnitOfMeasurement');
//       const newUnit = req.data;
//       try {
//         const tx = cds.tx(req);
//         const created = await tx.run(INSERT.into(UnitOfMeasurement).entries(newUnit));
//         console.log('Created UnitOfMeasurement:', JSON.stringify(created));
//         await tx.commit();
//         return created;
//       } catch (error) {
//         console.error('Error in CREATE UnitOfMeasurement:', error.message);
//         await tx.rollback();
//         throw new Error(`Database insert failed: ${error.message}`);
//       }
//     });

//     this.on('DELETE', UnitOfMeasurement, async (req) => {
//       console.log('Executing DELETE for UnitOfMeasurement');
//       const unitOfMeasurementCode = req.params[0]?.unitOfMeasurementCode || req.query.SELECT.where?.find(w => w.ref?.[0] === 'unitOfMeasurementCode')?.val;
//       if (!unitOfMeasurementCode) {
//         throw new Error('UnitOfMeasurement code is required');
//       }
//       try {
//         const tx = cds.tx(req);
//         const deleted = await tx.run(DELETE.from(UnitOfMeasurement).where({ unitOfMeasurementCode: unitOfMeasurementCode }));
//         console.log('Deleted UnitOfMeasurement:', JSON.stringify(deleted));
//         await tx.commit();
//         return { success: true };
//       } catch (error) {
//         console.error('Error in DELETE UnitOfMeasurement:', error.message);
//         await tx.rollback();
//         throw new Error(`Database delete failed: ${error.message}`);
//       }
//     });

//     this.on('UPDATE', UnitOfMeasurement, async (req) => {
//       console.log('Executing UPDATE for UnitOfMeasurement');
//       const unitOfMeasurementCode = req.params[0]?.unitOfMeasurementCode || req.query.SELECT.where?.find(w => w.ref?.[0] === 'unitOfMeasurementCode')?.val;
//       if (!unitOfMeasurementCode) {
//         throw new Error('UnitOfMeasurement code is required');
//       }
//       try {
//         const tx = cds.tx(req);
//         const updated = await tx.run(UPDATE(UnitOfMeasurement).with(req.data).where({ unitOfMeasurementCode: unitOfMeasurementCode }));
//         console.log('Updated UnitOfMeasurement:', JSON.stringify(updated));
//         await tx.commit();
//         return updated;
//       } catch (error) {
//         console.error('Error in UPDATE UnitOfMeasurement:', error.message);
//         await tx.rollback();
//         throw new Error(`Database update failed: ${error.message}`);
//       }
//     });
//   }

//   // --- ServiceType Handlers ---
//   if (ServiceType) {
//     this.on('READ', ServiceType, async (req) => {
//       console.log('Executing READ for all ServiceTypes');
//       try {
//         const tx = cds.tx(req);
//         const serviceTypes = await tx.run(SELECT.from(ServiceType));
//         console.log('ServiceType response:', JSON.stringify(serviceTypes));
//         return serviceTypes;
//       } catch (error) {
//         console.error('Error in READ ServiceType:', error.message);
//         throw new Error(`Database query failed: ${error.message}`);
//       }
//     });

//     this.on('READ', ServiceType, async (req) => {
//       console.log('Executing READ for ServiceType by ID');
//       const serviceTypeCode = req.params[0]?.serviceTypeCode || req.query.SELECT.where?.find(w => w.ref?.[0] === 'serviceTypeCode')?.val;
//       if (!serviceTypeCode) {
//         throw new Error('ServiceType code is required');
//       }
//       try {
//         const tx = cds.tx(req);
//         const serviceType = await tx.run(SELECT.one.from(ServiceType).where({ serviceTypeCode: serviceTypeCode }));
//         console.log('ServiceType response by ID:', JSON.stringify(serviceType));
//         return serviceType;
//       } catch (error) {
//         console.error('Error in READ ServiceType by ID:', error.message);
//         throw new Error(`Database query failed: ${error.message}`);
//       }
//     });

//     this.on('CREATE', ServiceType, async (req) => {
//       console.log('Executing CREATE for new ServiceType');
//       const newServiceType = req.data;
//       try {
//         const tx = cds.tx(req);
//         const created = await tx.run(INSERT.into(ServiceType).entries(newServiceType));
//         console.log('Created ServiceType:', JSON.stringify(created));
//         await tx.commit();
//         return created;
//       } catch (error) {
//         console.error('Error in CREATE ServiceType:', error.message);
//         await tx.rollback();
//         throw new Error(`Database insert failed: ${error.message}`);
//       }
//     });

//     this.on('DELETE', ServiceType, async (req) => {
//       console.log('Executing DELETE for ServiceType');
//       const serviceTypeCode = req.params[0]?.serviceTypeCode || req.query.SELECT.where?.find(w => w.ref?.[0] === 'serviceTypeCode')?.val;
//       if (!serviceTypeCode) {
//         throw new Error('ServiceType code is required');
//       }
//       try {
//         const tx = cds.tx(req);
//         const deleted = await tx.run(DELETE.from(ServiceType).where({ serviceTypeCode: serviceTypeCode }));
//         console.log('Deleted ServiceType:', JSON.stringify(deleted));
//         await tx.commit();
//         return { success: true };
//       } catch (error) {
//         console.error('Error in DELETE ServiceType:', error.message);
//         await tx.rollback();
//         throw new Error(`Database delete failed: ${error.message}`);
//       }
//     });

//     this.on('UPDATE', ServiceType, async (req) => {
//       console.log('Executing UPDATE for ServiceType');
//       const serviceTypeCode = req.params[0]?.serviceTypeCode || req.query.SELECT.where?.find(w => w.ref?.[0] === 'serviceTypeCode')?.val;
//       if (!serviceTypeCode) {
//         throw new Error('ServiceType code is required');
//       }
//       try {
//         const tx = cds.tx(req);
//         const updated = await tx.run(UPDATE(ServiceType).with(req.data).where({ serviceTypeCode: serviceTypeCode }));
//         console.log('Updated ServiceType:', JSON.stringify(updated));
//         await tx.commit();
//         return updated;
//       } catch (error) {
//         console.error('Error in UPDATE ServiceType:', error.message);
//         await tx.rollback();
//         throw new Error(`Database update failed: ${error.message}`);
//       }
//     });
//   }
// });