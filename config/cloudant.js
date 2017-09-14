import Cloudant from 'cloudant';

require('dotenv').load();

const me = process.env.CLOUDANT_USER; 
const password = process.env.CLOUDANT_PASSWORD;
const cloudant = Cloudant({account:me, password:password});

export default cloudant;