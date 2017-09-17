import Joi from 'joi';
import cloudant from '../../config/cloudant.js';
import moment from 'moment-timezone';

let db = cloudant.db.use("michcom_logs");

const logs = [{ // ver todos
    method: 'GET',
    path: '/api/logs',
    handler: function(request, reply) {
        db.find({
            'selector': {
                '_id': {
                    '$gte': null
                }
            },
            'fields': [
                '_id',
                'userName',
                'userEmail',
                'role',
                'form',
                'description'
            ],
            'limit': 100,
            'sort': [
                {
                  '_id': 'desc'
                }
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
}, { // agregar un log
    method: 'POST',
    path: '/api/log',
    config: {
        handler: (request, reply) => {
            let session = request.auth.credentials;
            let credentials = {email: session.email, name: session.name, lastname: session.lastname, role: session.role};
            let description = request.payload.description;
            let form = request.payload.form;
          
            let logData = {
                '_id': moment.tz('America/Santiago').format('YYYY-MM-DDTHH:mm:ss.SSSSS'),
                'userEmail': credentials.email,
                'userName': credentials.name+' '+credentials.lastname,
                'role': credentials.role,
                'form': form,
                'description': description
            };
         
            db.insert(logData, function(errUpdate, body) {
                if (errUpdate) {
                    throw errUpdate;
                }
            });

        },
        validate: {
            payload: Joi.object().keys({
                description: Joi.string(),
                form: Joi.string(),
            })
        }
    }
}, { // ver logs personalizados
    method: 'POST',
    path: '/api/getLogs',
    config: {
        handler: (request, reply) => {
            let user = request.payload.user;
            let startDate = request.payload.startDate;
            let endDate = request.payload.endDate;

            console.log(user, startDate, endDate)

            let query = {
                selector: {
                    _id: {
                        $gte: null
                    }
                },
                fields: [
                ],
                sort: [{
                    "_id": "desc"
                }]
            }

            if(user) {
                query.selector.userEmail = user
            }

            if(startDate && endDate) {
                query.selector._id.$gte = startDate
                query.selector._id.$lte = endDate
            }

            db.find(query, function(err, result) {
                if (err) {
                    throw err;
                }

                return reply(result.docs);
            });
        },
        validate: {
            payload: Joi.object().keys({
                user: Joi.string().allow(''),
                startDate: Joi.string().allow(''),
                endDate: Joi.string().allow('')
            })
        }
    }
}];

export default logs;
