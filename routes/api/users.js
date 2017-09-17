import Joi from 'joi';
import cloudant from '../../config/cloudant.js';
import moment from 'moment-timezone';

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
                'type': 'user'
            },
            'fields': [
                
            ]
        }, function(err, result) {
            if (err) {
                throw err;
            }

            console.log(result)
            
            if (result.docs[0]) {
                return reply(result.docs);
            }
        });
    }
}, { // agregar un usuario
    method: 'POST',
    path: '/api/user',
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
}];

export default users;