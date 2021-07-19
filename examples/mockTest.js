const {sdk, SpeakerEvent} = require('../build/app.bundle');

sdk.init({                                                                         
    appId: '69396d622d71403778697030762e6678',                                     
    appSecret: 'e472640a54c947d997b65ca1b0182af43a3f8e051c744a2fb250607bc8bd927c', 
    basePath: "https://oob-prod.rammer.ai",                                        
}).then(() => {                                                                    
  console.log("SDK Initialized!")                                                  
}).then(() => {                                                                    
  sdk.startEndpoint({                                                              
    endpoint: {                                                                    
     type: 'sip',                                                                                                                           
     uri: 'sip:camilo@176.121.95.200',
     audioConfig: { // Optionally any audio configuration                         
        encoding: 'LINEAR16',                                                    
        sampleRate: 44100,                                                       
     }                                                                            
    },                                                                             
    actions: [{                                                                    
     "invokeOn": "stop",                                                          
     "name": "sendSummaryEmail",                                                  
       "emails": [ "arjun.chouhan@rammer.ai" ]
     }],                                                                          
    data: {                                                                        
     session: {                                                                   
       name: 'Test meeting'
     },                                                                           
    },                                                                             
    users: [                                                                       
    {                                                                              
     user: {                                                                      
       name: "Eamonn",                                                            
       userId: "eamonn@pexip.com",                                                
       role: "organizer",                                                         
     }                                                                            
    },                                                                             
    {                                                                              
     user: {                                                                      
       name: "Kristen",                                                           
       userId: "Kristen@pexip.com"                                                
     }                                                                            
    }]                                                                             
  }).then(c => {                                                                   
    console.log("SIP call connected! ID:", c.connectionId);                        
  }).catch(err => console.error("Error connecting SIP call", err));                
}).catch(err => console.error("Error initializing SDK", err)); 