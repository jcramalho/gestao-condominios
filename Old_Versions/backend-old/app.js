var express = require('express');
var path = require('path');
var logger = require('morgan');
var typeorm = require('')

var usersRouter = require('./routes/users');
var typologiesRouter = require('./routes/typologies');
var servicetypesRouter = require('./routes/service_types');

var app = express();

// Database


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api/users', usersRouter);
app.use('/api/typologies', typologiesRouter);
app.use('/api/service_types', servicetypesRouter);

module.exports = app;