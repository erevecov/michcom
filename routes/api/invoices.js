import Joi from 'joi';
import cloudant from '../../config/cloudant.js';
import moment from 'moment-timezone';

let db = cloudant.db.use("michcom");

const invoices = [{ // Crear una factura
    method: 'POST',
    path: '/api/invoice',
    config: {
        handler: (request, reply) => { 
            let rut = request.payload.rut;
            let invoice = request.payload.invoice;
            let business = request.payload.business;
            let amount = request.payload.amount;
            let invoice_type = request.payload.invoice_type;
            let description = request.payload.description;
            let date = request.payload.date;
            let iva = request.payload.iva;

            let filter1 = rut.split('.').join('');
            let filter2 = filter1.replace('-', ''); // limpiar rut


            db.find({
                "selector": {
                    "_id": {
                        "$gt": 0
                    },
                    "$not": {
                      "status": "disabled"
                    },
                    "type": "invoice",
                    "invoice": invoice
                },
                "fields": [
                    "_id"
                ],
                "limit":1
            }, function(err, result) {
                if (err) {
                    throw err;
                }
                
                if (result.docs[0]) {
                    return reply({error: 'La factura '+invoice+ ' ya existe en el sistema'});
                }else {
                     let newInvoice = {
                        '_id': moment.tz('America/Santiago').format('YYYY-MM-DDTHH:mm:ss.SSSSS'),
                        'type':"invoice",
                        'invoice': invoice,
                        'date': date,
                        'client' : filter2,
                        'business': business,
                        'amount': amount,
                        'status': 'PENDIENTE',
                        "invoice_type": invoice_type,
                        "description": description,
                        "iva": iva
                    };


                    db.insert(newInvoice, function(err, body) {
                        if(err) {
                            throw err;
                        }

                        if(body.ok) {
                            db.find({ 
                                "selector": {
                                    "_id": filter2,
                                    "type": "client"
                                },
                                "limit":1
                            }, function(err, result) {
                                if (err) {
                                    throw err;
                                }

                                let addInvoice = result.docs[0].invoiceOwed;
                                addInvoice.push(invoice);

                                let addAmount = result.docs[0].amountOwed;

                                addAmount += amount;

                                let updateClient = {
                                    "_id": result.docs[0]._id,
                                    "_rev": result.docs[0]._rev,
                                    "name": result.docs[0].name,
                                    "type": result.docs[0].type,
                                    "status": result.docs[0].status,
                                    "emails": result.docs[0].emails,
                                    "address": result.docs[0].address,
                                    "invoiceOwed": addInvoice,
                                    "amountOwed": addAmount
                                };

                                db.insert(updateClient, function(err2, body2) {
                                    if (err2) {
                                        throw err2;
                                    }

                                    return reply({ok: 'factura de numero '+invoice+' creada correctamente', id: body.id});
                                });

               
                            });
                            
                        }  
                    });
                }

                             
            }); 
        },
        validate: {
            payload: Joi.object().keys({
                invoice: Joi.number(),
                amount: Joi.number(),
                id: Joi.string(),
                rut: Joi.string(),
                business: Joi.string(),
                invoice_type: Joi.string(),
                description: Joi.string(),
                date: Joi.string(),
                iva: Joi.string()
            })
        }
    }
}, {
    method: 'POST',
    path: '/api/changeInvoiceState',
    config: {
        handler: (request, reply) => { 
            let invoice = request.payload.invoice;
            let date = request.payload.date;
            let reason = request.payload.reason;

            db.find({ 
                "selector": {
                    "_id": {
                        "$gt": 0
                    },
                    "$not": {
                      "status": "disabled"
                    },
                    "type": "invoice",
                    "invoice": invoice
                },
                "limit":1
            }, function(err, result) {
                if (err) {
                    throw err;
                }

                let getInvoice = result.docs[0];


                if (getInvoice.status === 'PENDIENTE') {
                    getInvoice.status = 'PAGADO';
                    getInvoice.date = date;
                }else if (getInvoice.status === 'PAGADO') {
                    getInvoice.status = 'PENDIENTE';
                    getInvoice.reason = reason;
                }

                db.insert(getInvoice, function(err2, body) {
                    if (err2) {
                        throw err2;
                    }

                    if (body.ok) {
                        if(getInvoice.status === 'PENDIENTE') {

                            db.find({ 
                                "selector": {
                                    "_id": result.docs[0].client,
                                    "type": "client"
                                },
                                "limit":1
                            }, function(err3, result3) {
                                if (err3) {
                                    throw err3;
                                }

                                let addInvoice = result3.docs[0].invoiceOwed;
                                addInvoice.push(getInvoice.invoice);

                                let addAmount = result3.docs[0].amountOwed;

                                addAmount += result.docs[0].amount;

                                let updateClient = {
                                    "_id": result3.docs[0]._id,
                                    "_rev": result3.docs[0]._rev,
                                    "name": result3.docs[0].name,
                                    "type": result3.docs[0].type,
                                    "status": result3.docs[0].status,
                                    "emails": result3.docs[0].emails,
                                    "address": result3.docs[0].address,
                                    "invoiceOwed": addInvoice,
                                    "amountOwed": addAmount
                                };

                                db.insert(updateClient, function(err4, body4) {
                                    if (err2) {
                                        throw err2;
                                    }

                                    return reply({ok: 'factura de numero '+getInvoice.invoice+' anulada correctamente', status: getInvoice.status }); 

                                });

                            });                        

                               
                        }else if (getInvoice.status === 'PAGADO') {

                            db.find({ 
                                "selector": {
                                    "_id": result.docs[0].client,
                                    "type": "client"
                                },
                                "limit":1
                            }, function(err3, result3) {
                                if (err3) {
                                    throw err3;
                                }

                                let clientInvoices = result3.docs[0].invoiceOwed;
                                let clientOwedAmount = result3.docs[0].amountOwed;

                                let indexOf = clientInvoices.indexOf(result.docs[0].invoice);

                                if (indexOf > -1) {
                                    clientInvoices.splice(indexOf, 1);
                                    clientOwedAmount = clientOwedAmount - result.docs[0].amount;

                                    let updateClient = {
                                        "_id": result3.docs[0]._id,
                                        "_rev": result3.docs[0]._rev,
                                        "name": result3.docs[0].name,
                                        "type": result3.docs[0].type,
                                        "status": result3.docs[0].status,
                                        "emails": result3.docs[0].emails,
                                        "address": result3.docs[0].address,
                                        "invoiceOwed": clientInvoices,
                                        "amountOwed": clientOwedAmount
                                    };

                                    db.insert(updateClient, function(err4, body4) {
                                        if (err2) {
                                            throw err2;
                                        }

                                        return reply({ok: 'factura de numero '+getInvoice.invoice+' pagada correctamente', status: getInvoice.status});
                                    });
                                }
                                    
                            
                            });
                        }
                    }
                });

            }); 
        },
        validate: {
            payload: Joi.object().keys({
                invoice: Joi.number(),
                date: Joi.string(),
                reason: Joi.string()
            })
        }
    }
}, { // Cambiar es status de una factura a disabled
    method: 'POST',
    path: '/api/deleteInvoice',
    config: {
        handler: (request, reply) => {
            let invoice = request.payload.invoice;
            let beforeStatus = '';

            db.find({ 
                "selector": {
                    "_id": {
                        "$gt": 0
                    },
                    "type": "invoice",
                    "invoice": invoice
                },
                "limit":1,
                "sort": [
                    {
                        "_id": "desc" // debe encontrar la factura con la fecha mas alta
                    }
                ]
            }, function(err, result) {
                if (err) {
                    throw err;
                }

                let getInvoice = result.docs[0];
                beforeStatus = getInvoice.status;

                getInvoice.status = 'disabled';

                db.insert(getInvoice, function(err2, body) {
                    if (err2) {
                        throw err2;
                    }

                    if(beforeStatus === 'PENDIENTE') {
                        db.find({ 
                        "selector": {
                            "_id": getInvoice.client,
                            "type": "client"
                        },
                        "limit":1
                        }, function(err3, result2) {
                            if (err3) {
                                throw err3;
                            }

                            let client = result2.docs[0];

                            let indexOf = client.invoiceOwed.indexOf(invoice);

                            if (indexOf > -1) {
                                client.invoiceOwed.splice(indexOf, 1);
                                client.amountOwed = client.amountOwed - getInvoice.amount; 

                                console.log(client);
                                
                                db.insert(client, function(err4, body2) {
                                    if (err4) {
                                        throw err4;
                                    }

                                    return reply({ok: 'factura de numero '+invoice+' eliminada correctamente', beforeStatus: beforeStatus});
                                });
                                
                            } 
                        }); 

                    }   else if (beforeStatus === 'PAGADO'){
                            return reply({ok: 'factura de numero '+invoice+' eliminada correctamente', beforeStatus: beforeStatus});
                        }
                });
            });
        },
        validate: {
            payload: Joi.object().keys({
                invoice: Joi.number()
            })
        }
    }
}, { 
    method: 'GET',
    path: '/api/invoiceAmount',
    config: {
        handler: (request, reply) => {
            db.find({
                "selector": {
                  "_id": {
                    "$gt": 0
                  },
                  "$not": {
                    "status": "disabled"
                  },
                  "type": "invoice"
                },
                "fields": [
                  "amount",
                  "status",
                  "invoice_type"
                ]
              }, function(err, result) { 
                if (err) {
                    throw err;
                }

                let amountTronit = 0;
                let amountMichcom = 0;

                result.docs.forEach(function(el) {
                    if(el.invoice_type === 'service' && el.status === 'PENDIENTE') {
                        amountTronit += el.amount;
                    }else if(el.invoice_type === 'product' && el.status === 'PENDIENTE') {
                        amountMichcom += el.amount;
                    }
                }, this);

                return reply({tronit: amountTronit, michcom: amountMichcom});
            });
        }
    }
}, { // Cambiar es status de una factura a disabled
    method: 'POST',
    path: '/api/getInvoicesByType',
    config: {
        handler: (request, reply) => {
            let invoice_type = request.payload.type;

            db.find({ 
                "selector": {
                    "_id": {
                        "$gt": 0
                    },
                    "status": "PENDIENTE",
                    "type": "invoice",
                    "invoice_type": invoice_type
                },
                "fields": [
                  "invoice",
                  "amount",
                  "client"
                ],
                "sort": [
                    {
                        "_id": "desc"
                    }
                ]
            }, function(err, result) {
                if (err) {
                    throw err;
                }

                return reply(result.docs);
            });
        },
        validate: {
            payload: Joi.object().keys({
                type: Joi.string()
            })
        }
    }
}];

export default invoices;
