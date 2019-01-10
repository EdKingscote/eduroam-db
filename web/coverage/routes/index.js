const express = require('express');
const router = express.Router();
const ldap = require('./ldap.js')
const ini = require('ini')
const fs = require('fs')
const admin_mapping = require('../config/realm_to_admin.js')
const inst_mapping = require('../config/realm_to_inst.js')
const token_mapping = require('../config/tokens.js')
const jsonschema = require('jsonschema')
const schema = require('../config/schema.json')
const admins = require('../config/admins.js')
const realms = require('../config/realms.js')
// --------------------------------------------------------------------------------------
// get the name of the user logged in the application
// --------------------------------------------------------------------------------------
function get_user(req)
{
  return req.headers["remote_user"];
}
// --------------------------------------------------------------------------------------
// get title page
// --------------------------------------------------------------------------------------
router.get('/', function(req, res, next) {
  respond(res, get_user(req));
});
// --------------------------------------------------------------------------------------
// check if user is super admin
// --------------------------------------------------------------------------------------
function is_super_admin(user)
{
  if(admins.admins.indexOf(user) != -1)
    return true;        // super admin

  return false;         // NOT super admin
}
// --------------------------------------------------------------------------------------
// check permissions mapping of user to realms
// --------------------------------------------------------------------------------------
function get_administered_realms(user)
{
  var ret;

  if(is_super_admin(user))                     // super admin - can choose any realm
    ret = realms;

  else if(user in admin_mapping)               // regular user, can choose only own realm
    ret = admin_mapping[user];
  else
    ret = [];  // empty array

  return ret;
}
// --------------------------------------------------------------------------------------
// respond to user
// --------------------------------------------------------------------------------------
function respond(res, user) {
  res.render('index', { title: 'Správa informací o pokrytí', realms : get_administered_realms(user), admin : is_super_admin(user) });
}
// --------------------------------------------------------------------------------------
// get institution by realm
// --------------------------------------------------------------------------------------
router.get('/api/:inst_id', function(req, res, next)
{
  // check that inst_id has correct form - dns domain
  if(/^([a-zA-z0-9-]+\.){1,}[a-zA-z0-9-]+$/.test(req.params.inst_id)) {

    // check that the user has permission to read requested realm
    if(req.headers["remote_user"] && (get_administered_realms(get_user(req)).indexOf(req.params.inst_id) != -1 || is_super_admin(user))) {

      // check that requested realm exists in inst_mapping and correspoding JSON file exists
      if(req.params.inst_id in inst_mapping && fs.existsSync('./coverage_files/' + inst_mapping[req.params.inst_id] + '.json')) {
        var file = JSON.parse(fs.readFileSync('./coverage_files/' + inst_mapping[req.params.inst_id] + '.json'), 'utf8');
        res.send(file);
      }
      else  // no data available, query ldap
        ldap.get_inst(req.params.inst_id, res)
    }
    else {        // no permission to read requested realm
      res.status(401);    // unathorized
      res.send("");
    }
  }
  else {        // incorrect inst_id form
    res.status(404);    // no such thing
    res.send("");
  }
});
// --------------------------------------------------------------------------------------
// validate input against schema
// --------------------------------------------------------------------------------------
function validate_json_input(input)
{
  var data = { "schema_version": 2, "institutions": { "institution": [ input ] } };
  var v = new jsonschema.Validator();
  var ret = v.validate(data, schema);
  return ret
}
// --------------------------------------------------------------------------------------
// check if string is in JSON format
// --------------------------------------------------------------------------------------
function is_json(data)
{
  if(typeof(data) === 'object') {       // got object, try to stringify it
    try {
      JSON.stringify(data);
    } catch (e) {
      return false;
    }
    return true;
  }
  else if(typeof(data) === 'string') {        // got string, try to parse it
    try {
      JSON.parse(data);
    } catch (e) {
      return false;
    }
    return true;
  }

  return false;
}
// --------------------------------------------------------------------------------------
// save data if have correct structure and validate against schema
// --------------------------------------------------------------------------------------
function save_data(req, res)
{
  // check that data in JSON format
  if(is_json(req.body)) {
    json = JSON.stringify(req.body, 'utf8');
    var result = validate_json_input(req.body);     // validate input against schema

    if(result.errors.length != 0) {     // check for validation errors
      res.status(400);
      var errors = [];

      for(var i = 0; i < result.errors.length; i++)       // iterate all errors
        errors.push({ property : result.errors[i].property, message : result.errors[i].message });      //  send only error property and message

      res.send(errors);          // send errors to user
    }
    else {
      fs.writeFileSync('./coverage_files/' + inst_mapping[req.params.inst_id] + ".json", json);
      res.send("");
    }
  }
  else {        // is it even possible to get here? malfored data dies with code 400 at body-parser
    res.status(400);
    res.send("received malformed data: " + req.body);
  }
}
// --------------------------------------------------------------------------------------
// update JSON file by realm
// --------------------------------------------------------------------------------------
router.post('/api/:inst_id', function(req, res, next)
{
  // check that inst_id has correct form - dns domain
  if(/^([a-zA-z0-9-]+\.){1,}[a-zA-z0-9-]+$/.test(req.params.inst_id)) {

    // check that the user has permission to edit requested realm
    if(req.headers["remote_user"] && (get_administered_realms(get_user(req)).indexOf(req.params.inst_id) != -1 || is_super_admin(user))) {
      save_data(req, res);
    }
    else {        // no permission to edit requested realm
      res.status(401);    // unathorized
      res.send("");
    }
  }
  else {        // incorrect inst_id form
    res.status(404);    // no such thing
    res.send("");
  }
});
// --------------------------------------------------------------------------------------
// automated update of JSON file by realm
// --------------------------------------------------------------------------------------
router.post('/api/automation/:inst_id', function(req, res, next)
{
  // check that inst_id has correct form - dns domain
  if(/^([a-zA-z0-9-]+\.){1,}[a-zA-z0-9-]+$/.test(req.params.inst_id)) {

    // token is present in request, is present in config and requested realm is accessible
    if(req.headers["authorization"] && req.headers["authorization"] in token_mapping && token_mapping[req.headers['authorization']].indexOf(req.params.inst_id) != -1) {
      save_data(req, res);
    }
    else {        // no permission to edit requested realm
      res.status(401);    // unathorized
      res.send("");
    }
  }
  else {        // incorrect inst_id form
    res.status(404);    // no such thing
    res.send("");
  }
});
// --------------------------------------------------------------------------------------
module.exports = router;
