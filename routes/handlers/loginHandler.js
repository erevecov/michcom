import Boom from 'boom';
import Joi from 'joi';
import cloudant from '../../config/cloudant.js';
import md5 from 'md5';

let uuid = 1;
const login = function(request, reply) {

    if (request.auth.isAuthenticated) {
        return reply.redirect('/');
    }

    let message = '';
    let account = {};

    if (request.method === 'post') {
        if (!request.payload.username || !request.payload.password) {
            Boom.expectationFailed('Falta Usuario o Contraseña');
        } else {
            let post_email = request.payload.username;
            let post_password = md5(request.payload.password);

            let db = cloudant.db.use("michcom");

            db.find({  
              "selector": {
                "_id": post_email,
                "password": post_password,
                "status": "enabled"
              },
              "fields": [
                "_id",
                "name",
                "lastname",
                "role",
                "color"
              ]
            }, function(err, result) {
              if (err) {
                throw err;
              }

              if(result.docs[0]) {
                account.name = result.docs[0].name;
                account.lastname = result.docs[0].lastname;
                account.email = result.docs[0]._id;
                account.role = result.docs[0].role;
                account.color = result.docs[0].color;

                const sid = String(++uuid);
                request.server.app.cache.set(sid, { account: account }, 0, (err) => {

                    if (err) {
                        Boom.badImplementation(err);
                    }

                    request.cookieAuth.set({ sid: sid });
                    return reply.redirect('/');
                });

              }else {
                reply.view('login', { error: 'Usuario y/o contraseña no corresponden' }, { layout: false });
              }
            });

        }
    }

    if (request.method === 'get') {
        return reply.view('login', { title: 'test' }, { layout: false });
    }
};
export default login;


