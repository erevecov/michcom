import Joi from 'joi';
import cloudant from '../../config/cloudant.js';

let db = cloudant.db.use("michcom");

const clients = [{ // todos los clientes habilitados
    method: 'GET',
    path: '/api/clients',
    handler: function(request, reply) {
        db.find({
            "selector": {
                "_id": {
                    "$gte": null
                },
                "type": "client",
                "status": "enabled"
            },
            "fields": [
            ]
        }, function(err, result) {
            if (err) {
                throw err;
            }
            
            if (result.docs[0]) {
                return reply(result.docs);
            }
        });
    }
}, { // todos los clientes deshabilitados
    method: 'GET',
    path: '/api/disabledClients',
    handler: function(request, reply) {
        db.find({
            "selector": {
                "_id": {
                    "$gte": null
                },
                "type": "client",
                "status": "disabled"
            },
            "fields": [
            ]
        }, function(err, result) {
            if (err) {
                throw err;
            }
            
            if (result.docs[0]) {
                return reply(result.docs);
            }
        });
    }
}, { // traer un cliente
    method: 'POST',
    path: '/api/getClient',
    config: {
        handler: (request, reply) => {
            let rut = request.payload.rut;

            db.find({ 
                "selector": {
                    "_id": rut,
                    "type": "client"
                },
                "fields": [
        
                ],
                "limit":1
            }, function(err, result) {
                if (err) {
                    throw err;
                }


                return reply(result.docs[0]);
            }); 
        },
        validate: {
            payload: Joi.object().keys({
                rut: Joi.string()
            })
        }
    }
}, { // agregar cliente al sistema
    method: 'POST',
    path: '/api/newClient',
    config: {
        handler: (request, reply) => {
            let name = request.payload.name;
            let rut = request.payload.rut;
            let address = request.payload.address;
            let emails = JSON.parse(request.payload.emails);
            let newClientObj = {};

            db.find({ 
                "selector": {
                    "_id": rut,
                    "type": "client"
                },
                "fields": [
        
                ],
                "limit":1
            }, function(err, result) {
                if (err) {
                    throw err;
                }

                if(result.docs[0]) {
                     return reply({error: 'el cliente de rut '+rut+' ya existe'});
                }else{
                    newClientObj._id = rut;
                    newClientObj.type = 'client';
                    newClientObj.status = 'enabled';
                    newClientObj.name = name;
                    newClientObj.address = address;
                    newClientObj.emails = emails;
                    newClientObj.invoiceOwed = [];
                    newClientObj.amountOwed = 0;

                    db.insert(newClientObj, function(errUpdate, body) {
                        if (errUpdate) {
                            throw errUpdate;
                        }

                        return reply({ok: 'Cliente '+newClientObj.name+' agregado correctamente'}); 
                    });
                }
            }); 
        },
        validate: {
            payload: Joi.object().keys({
                name: Joi.string(),
                rut: Joi.string(),
                address: Joi.string().allow(''),
                emails: Joi.string().allow('')
            })
        }
    }
}, { // modificar cliente en el sistema
    method: 'POST',
    path: '/api/modClient',
    config: {
        handler: (request, reply) => {
            let name = request.payload.name;
            let rut = request.payload.rut;
            let address = request.payload.address;
            let emails = JSON.parse(request.payload.emails);
            let modClientObj = {};

            db.find({ 
                "selector": {
                    "_id": rut,
                    "type": "client"
                },
                "fields": [
        
                ],
                "limit":1
            }, function(err, result) {
                if (err) {
                    throw err;
                }

                if(result.docs[0]) {
                    modClientObj = result.docs[0];
                    modClientObj.name = name;
                    modClientObj.address = address;
                    modClientObj.emails = emails;

                    db.insert(modClientObj, function(errUpdate, body) {
                        if (errUpdate) {
                            throw errUpdate;
                        }

                        return reply({ok: 'Cliente '+modClientObj.name+' modificado correctamente'}); 
                    });
                     
                }else{
                    return reply({error: 'el cliente de rut '+rut+' no existe'});
                }
            }); 
        },
        validate: {
            payload: Joi.object().keys({
                name: Joi.string(),
                rut: Joi.string(),
                address: Joi.string().allow(''),
                emails: Joi.string().allow('')
            })
        }
    }
}, { // obtener un cliente junto a todas sus facturas
    method: 'POST',
    path: '/api/client',
    config: {
        handler: (request, reply) => {
            let rut = request.payload.rut;
            let clientData = {};

            db.find({ 
                "selector": {
                    "_id": rut,
                    "type": "client"
                },
                "fields": [
        
                ],
                "limit":1
            }, function(err, result) {
                if (err) {
                    throw err;
                }

                clientData.rut = result.docs[0]._id;
                clientData.name = result.docs[0].name;
                clientData.emails = result.docs[0].emails;
                clientData.address = result.docs[0].address;

                
                db.find({ 
                    "selector": {
                        "_id": {
                            "$gt": 0
                        },
                        "$not": {
                          "status": "disabled"
                        },
                        "type": "invoice",
                        "client": rut
                    },
                    "fields": [
                        "_id",
                        "invoice",
                        "business",
                        "amount",
                        "status",
                        "invoice_type",
                        "description",
                        "date",
                        "iva"
                    ],
                    "sort": [
                        {
                            "_id": "desc"
                        }
                    ]
                }, function(err2, result2) {
                    if (err) {
                        throw err;
                    }

                    console.log(result2)
                    clientData.invoices = result2.docs;
                    return reply(clientData);
                }); 
                
                
            }); 
        },
        validate: {
            payload: Joi.object().keys({
                rut: Joi.string()
            })
        }
    }
}, { // deshabilitar un cliente
    method: 'DELETE',
    path: '/api/disableClient',
    config: {
        handler: (request, reply) => {
            let rut = request.payload.rut;
            let clientData = {};

            db.find({ 
                "selector": {
                    "_id": rut,
                    "type": "client"
                },
                "fields": [
        
                ],
                "limit":1
            }, function(err, result) {
                if (err) {
                    throw err;
                }

                clientData = result.docs[0];

                clientData.status = 'disabled';

                db.insert(clientData, function(errUpdate, body) {
                    if (errUpdate) {
                        throw errUpdate;
                    }

                    return reply({ok: 'Cliente '+clientData.name+' deshabilitado correctamente'}); 
                });
                
                
            }); 
        },
        validate: {
            payload: Joi.object().keys({
                rut: Joi.string()
            })
        }
    }
}, { // habilitar un cliente
    method: 'POST',
    path: '/api/enableClient',
    config: {
        handler: (request, reply) => {
            let rut = request.payload.rut;
            let clientData = {};

            db.find({ 
                "selector": {
                    "_id": rut,
                    "type": "client"
                },
                "fields": [
        
                ],
                "limit":1
            }, function(err, result) {
                if (err) {
                    throw err;
                }

                clientData = result.docs[0];

                clientData.status = 'enabled';

                db.insert(clientData, function(errUpdate, body) {
                    if (errUpdate) {
                        throw errUpdate;
                    }

                    return reply({ok: 'Cliente '+clientData.name+' habilitado correctamente'}); 
                });
                
                
            }); 
        },
        validate: {
            payload: Joi.object().keys({
                rut: Joi.string()
            })
        }
    }
}];

export default clients;
