const {sdk} = require('../build/app.bundle');

const APP_ID = '<your App ID>';
const APP_SECRET = '<your App Secret>';

sdk.init({
    appId: APP_ID,
    appSecret: APP_SECRET,
    basePath: 'https://yourcustomdomain.rammer.ai'
}).then(() => console.log('SDK Initialized.'))
    .catch(err => console.error('Error in initialization.', err));
