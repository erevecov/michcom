import Joi from 'joi';

const Users = {
    method: ['GET'],
    path: '/users',
    config: { 
        //auth: false,
        handler: function(request, reply) {
            let session = request.auth.credentials;
            let credentials = {email: session.email, name: session.name, lastname: session.lastname, role: session.role, color: session.color};

            if (credentials.role == 'admin') {
                return reply.view('users', {credentials: credentials, admin:'ok'});    
            }else {
                return reply.view('/', {credentials: credentials});
            }
        }
    }
};

export default Users;
