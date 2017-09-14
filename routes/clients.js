import Joi from 'joi';

const Clients = {
    method: ['GET'],
    path: '/clients',
    config: { 
        //auth: false,
        handler: function(request, reply) {
            let session = request.auth.credentials;
            let credentials = {email: session.email, name: session.name, lastname: session.lastname, role: session.role};

            if (credentials.role == 'admin') {
                return reply.view('clients', {credentials: credentials, admin:'ok'});    
            }else {
                return reply.view('/', {credentials: credentials});
            }
        }
    }
};

export default Clients;
