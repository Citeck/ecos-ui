const app = require('./app');

const PORT = process.env.PORT || 3000;

app
  .listen(PORT, () => {
    console.log(`App listening on port ${PORT}!`);
  })
  .on('error', onError);

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = 'Port ' + PORT;

  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}
