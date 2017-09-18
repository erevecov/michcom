import Joi from 'joi';
import cloudant from '../../config/cloudant.js';
import moment from 'moment-timezone';
import md5 from 'md5';

let db = cloudant.db.use("michcom");

const users = [{ // ver todos
    method: 'GET',
    path: '/api/users',
    handler: function(request, reply) {
        db.find({
            'selector': {
                '_id': {
                    '$gte': null
                },
                'type': 'user',
                'status': 'enabled'
            },
            'fields': [
                
            ]
        }, function(err, result) {
            if (err) {
                throw err;
            }
            
            
            return reply(result.docs);
            
        });
    }
}, {
    method: 'GET',
    path: '/api/disabledUsers',
    handler: function(request, reply) {
        db.find({
            "selector": {
                "_id": {
                    "$gte": null
                },
                "type": "user",
                "status": "disabled"
            },
            "fields": [
            ]
        }, function(err, result) {
            if (err) {
                throw err;
            }

            
            
            return reply(result.docs);
            
        });
    }
}, { // agregar un usuario
    method: 'POST',
    path: '/api/user',
    config: {
        handler: (request, reply) => {
            let email = request.payload.email;
            let name = request.payload.name;
            let lastname = request.payload.lastname;
            let password = md5(request.payload.password);
            let role = request.payload.role;
            let color = request.payload.color;
            let userData = {};

            db.find({
                'selector': {
                    '_id': email,
                    'type': 'user'
                },
                'fields': [
                    
                ],
                'limit':1
            }, function(err, result) {
                if (err) {
                    throw err;
                }
                
                if (result.docs[0]) {
                    return reply({error: 'El usuario del correo '+result.docs[0]._id+' ya existe.'});
                }else {

                    userData = {
                        _id: email,
                        type: 'user',
                        status: 'enabled',
                        password: password,
                        name: name,
                        lastname: lastname,
                        role: role,
                        color: color
                    }

                    db.insert(userData, function(errUpdate, body) {
                        if (errUpdate) {
                            throw errUpdate;
                        }

                        if(body.ok) {
                            return reply({ok: 'El usuario del correo '+email+' creado correctamente!'});
                        }
                        

                    });
                }
            });
        },
        validate: {
            payload: Joi.object().keys({
                email: Joi.string(),
                password: Joi.string(),
                name: Joi.string(),
                lastname: Joi.string(),
                role: Joi.string(),
                color: Joi.string(),
            })
        }
    }
}, { // deshabilitar un usuario
    method: 'POST',
    path: '/api/disableUser',
    config: {
        handler: (request, reply) => {
            let email = request.payload.email;
            let userData = {};

            db.find({ 
                "selector": {
                    "_id": email,
                    "type": "user"
                },
                "fields": [
        
                ],
                "limit":1
            }, function(err, result) {
                if (err) {
                    throw err;
                }

                userData = result.docs[0];

                userData.status = 'disabled';

                db.insert(userData, function(errUpdate, body) {
                    if (errUpdate) {
                        throw errUpdate;
                    }

                    return reply({ok: 'Usuario '+userData._id+' deshabilitado correctamente'}); 
                });
                
                
            }); 
        },
        validate: {
            payload: Joi.object().keys({
                email: Joi.string()
            })
        }
    }
}, { // habilitar un usuario
    method: 'POST',
    path: '/api/enableUser',
    config: {
        handler: (request, reply) => {
            let email = request.payload.email;
            let userData = {};

            db.find({ 
                "selector": {
                    "_id": email,
                    "type": "user"
                },
                "fields": [
        
                ],
                "limit":1
            }, function(err, result) {
                if (err) {
                    throw err;
                }

                userData = result.docs[0];

                userData.status = 'enabled';

                db.insert(userData, function(errUpdate, body) {
                    if (errUpdate) {
                        throw errUpdate;
                    }

                    return reply({ok: 'Usuario '+userData._id+' habilitado correctamente'}); 
                });
                
                
            }); 
        },
        validate: {
            payload: Joi.object().keys({
                email: Joi.string()
            })
        }
    }
}];

export default users;