const {sdk} = require('../build/app.bundle');

const APP_ID = '6a6b7a773669724d316147547a586273376a677774446579474e50534a4c514d';
const APP_SECRET = '6632556e7653324a6d324e5977326b584c4266326557375f50695337764c76394c3531456636437a397a2d5f7059696e5a4831535048554e7a5a785130493357';

sdk.init({
    appId: APP_ID,
    appSecret: APP_SECRET
}).then(() => console.log('SDK Initialized.'))
    .catch(err => console.error('Error in initialization.', err));