const {sdk} = require('../build/app.bundle');

sdk.init({
    appId: 'yourAppId',
    appSecret: 'yourAppSecret',
    basePath: 'https://yourcustomdomain.rammer.ai'
}).then(() => console.log('SDK Initialized.'))
    .catch(err => console.error('Error in initialization.', err));
