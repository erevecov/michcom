import Hapi from 'hapi';
import Routes from './routes/';
import Handlebars from 'handlebars';
import Extend from 'handlebars-extend-block';
import Inert from 'inert';
import hapiAuthCookie from 'hapi-auth-cookie';
import cookiePassword from './config/config';

require('dotenv').load();

const server = new Hapi.Server();

server.connection({
    host: process.env.IP || '0.0.0.0',
    port: process.env.PORT || '3003'
});

server.register([
    require('vision'),
    { register: hapiAuthCookie },
    { register: Inert }
], (err) => {
    if (err) {
        console.log("Failed to load module. ", err);
    }

    const cache = server.cache({ segment: 'sessions', expiresIn: (3 * 60 * 60 * 1000)*10 }); //una hora de inactividad
    server.app.cache = cache;

    server.auth.strategy('session', 'cookie', true, {
        password: cookiePassword,
        cookie: 'sid-blackbox',
        redirectTo: '/login',
        isSecure: false, //sin SSL
        validateFunc: function(request, session, callback) {
            cache.get(session.sid, (err, cached) => {
                if (err) {
                    return callback(err, false);
                }
                if (!cached) {
                    return callback(null, false);
                }
                return callback(null, true, cached.account);
            });
        }

    });

    server.route(Routes);
});


server.views({
	engines: {
		html: {
			module:Extend(Handlebars),
			isCached: false,
		},
	},
	path: 'views',
	layoutPath: 'views/layout',
	layout: 'default'
	//partialsPath: 'views/partials'
});

server.start((err) => {
	if(err) {
		throw err;
	}
	console.log(`Server running at: ${server.info.uri}`);
});