const {sdk} = require('../build/app.bundle');

sdk.init({
    appId: 'yourAppId',
    appSecret: 'yourAppSecret'
}).then(() => console.log('SDK Initialized.'))
    .catch(err => console.error('Error in initialization.', err));