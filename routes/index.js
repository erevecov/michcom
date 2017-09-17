import Joi from 'joi';
import cloudant from '../config/cloudant.js';


/////////////////////////////////////////////////////////// 
import loginHandler      from './handlers/loginHandler';
import logoutHandler     from './handlers/logoutHandler';
import Clients           from './clients';
import Logs              from './logs';

/////////////////////////////////////////////////////////// API

import APIclients        from './api/clients';
import APIinvoices       from './api/invoices';
import APIlogs           from './api/logs';
import APIUsers          from './api/users';

const Login = {
    method: ["GET", "POST"],
    path: "/login",
    config: {
        handler: loginHandler,
        auth: { mode: 'try' },
        plugins: { 'hapi-auth-cookie': { redirectTo: false } }
    }
};

const Logout = {
    method: ["GET", "POST"],
    path: "/logout",
    config: {
        handler: logoutHandler
    }
};


const Index = {
    method: ['GET', 'POST'],
    path: '/',
    config: { 
        //auth: false,
        handler: function(request, reply) {
            let session = request.auth.credentials;
            let credentials = {email: session.email, name: session.name, lastname: session.lastname, role: session.role, color: session.color};

            if (credentials.role == 'admin') {
                return reply.view('index', {credentials: credentials, admin:'ok'});    
            }else {
                return reply.view('index', {credentials: credentials});
            }
        }
    }
};


const Public = {
    method: "GET",
    path: "/public/{path*}",
    config: { auth: false },
        handler: {
            directory: {
                path: "./public",
                listing: false,
                index: false
            }
        }
};

const Routes = [].concat(
    Public,
    Login,
    Logout,
    Index,
    Clients,
    Logs,
    APIclients,
    APIinvoices,
    APIlogs,
    APIUsers
);

export default Routes;
