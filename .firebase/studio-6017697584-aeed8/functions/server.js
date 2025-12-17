const { onRequest } = require('firebase-functions/v2/https');
  const server = import('firebase-frameworks');
  exports.ssrstudio6017697584aeed = onRequest({}, (req, res) => server.then(it => it.handle(req, res)));
  