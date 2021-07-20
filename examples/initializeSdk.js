const {sdk} = require('../build/app.bundle');

const APP_ID = "<insert App ID";
const APP_SECRET = "<insert App Secret>";

sdk.init({
    appId: APP_ID,
    appSecret: APP_SECRET
}).then(() => console.log('SDK Initialized.'))
    .catch(err => console.error('Error in initialization.', err));