/* --------------------------------------------------------------------------------- */
angular.module('coverage').controller('coverage_controller', ['$scope', '$http', '$timeout', function ($scope, $http, $timeout) {
  $scope.loading = false;
  $scope.locations = [];
  $scope.admin_realms = realms;
  $scope.url_regex = /^http(s)?:\/\/.+\/.*$/;
  $scope.phone_regex = /^\+420 \d{3} \d{3} \d{3}$/;

  $scope.contact_type = [
    "osoba",
    "oddělení"
  ];

  $scope.contact_privacy = [
    "privátní",
    "veřejný"
  ];

  $scope.bool_options = [
    { key : "ano", value : true },
    { key : "ne", value : false }
  ];

  $scope.add_contact = function() {
    if($scope.json_data)
      $scope.json_data.contact.push({ type : 0, privacy : 0 });
  }

  $scope.remove_contact = function(index) {
    if($scope.json_data)
      $scope.json_data.contact.splice(index, 1);
  }
 
  $scope.add_location = function() {
    if($scope.json_data) {
      $scope.json_data.location.push({ info_URL : [], address : [] });
      add_empty_loc($scope);
    }
  }

  $scope.remove_location = function(index) {
    if($scope.json_data) {
      $scope.json_data.location.splice(index, 1);
      $scope.locations.splice(index, 1);
    }
  }
 
  $scope.save_data = function() {
    save_json_to_api($scope, $http);
  }

  $scope.get_json = function() {
    $scope.loading = true;

    // wait 500 ms before displaying the form
    // when switching realms, this seems usefull in the way the user knows that the form really changed
    $timeout(function () {
      $scope.loading = false;
    }, 500);

    get_json_from_api($scope, $http);
  }
}]);
/* --------------------------------------------------------------------------------- */
// add lang for info url
/* --------------------------------------------------------------------------------- */
function add_info_url_lang($scope)
{
  $scope.json_data.info_URL[0].lang = "cs";
  $scope.json_data.info_URL[1].lang = "en";

  for(var i in $scope.json_data.location) {
    $scope.json_data.location[i].info_URL[0].lang = "cs";
    $scope.json_data.location[i].info_URL[1].lang = "en";
  }
}
/* --------------------------------------------------------------------------------- */
// set tag for all locations based on seperate variables from form
/* --------------------------------------------------------------------------------- */
function set_location_tags($scope)
{
  var tag;

  for(var i in $scope.locations) {
    tag = "";

    if($scope.locations[i].port_restrict)
      tag = "port_restrict";

    if($scope.locations[i].transp_proxy) {
      if(tag != "")
        tag = tag + ",transp_proxy";
      else
        tag = "transp_proxy";
    }

    if($scope.locations[i].ipv6) {
      if(tag != "")
        tag = tag + ",IPv6";
      else
        tag = "IPv6";
    }

    if($scope.locations[i].nat) {
      if(tag != "")
        tag = tag + ",NAT";
      else
        tag = "NAT";
    }

    if(tag != "")
      $scope.json_data.location[i].tag = tag;

    if($scope.locations[i].wired)
      $scope.json_data.location[i].wired_no = $scope.locations[i].wired_count;
  }
}
/* --------------------------------------------------------------------------------- */
// add english addresses based on czech ones
// also set lang info
/* --------------------------------------------------------------------------------- */
function add_addresses($scope)
{
  if($scope.json_data.address.length == 1) {        // english address not available, create it
    $scope.json_data.address.push({ city : {}, street : {} });
    $scope.json_data.address[1].city.data = $scope.json_data.address[0].city.data;
    $scope.json_data.address[1].city.lang = "en";
    $scope.json_data.address[1].street.data = $scope.json_data.address[0].street.data;
    $scope.json_data.address[1].street.lang = "en";
  }
  else {        // data may have changed, rewrite them
    $scope.json_data.address[1].city.data = $scope.json_data.address[0].city.data;
    $scope.json_data.address[1].city.lang = "en";
    $scope.json_data.address[1].street.data = $scope.json_data.address[0].street.data;
    $scope.json_data.address[1].street.lang = "en";
  }

  for(var i in $scope.json_data.location) {
    console.log($scope.json_data.location[i]);
    console.log($scope.json_data.location[i].address.length);
    console.log($scope.json_data.location[i].address);

    if($scope.json_data.location[i].address.length == 1) {        // english address not available, create it
      $scope.json_data.location[i].address.push({ city : {}, street : {} });
      $scope.json_data.location[i].address[1].city.data = $scope.json_data.location[i].address[0].city.data;
      $scope.json_data.location[i].address[1].city.lang = "en";
      $scope.json_data.location[i].address[1].street.data = $scope.json_data.location[i].address[0].street.data;
      $scope.json_data.location[i].address[1].street.lang = "en";
    }
    else {        // data may have changed, rewrite them
      $scope.json_data.location[i].address[1].city.data = $scope.json_data.location[i].address[0].city.data;
      $scope.json_data.location[i].address[1].city.lang = "en";
      $scope.json_data.location[i].address[1].street.data = $scope.json_data.location[i].address[0].street.data;
      $scope.json_data.location[i].address[1].street.lang = "en";
    }

    // rewrite language info, just in case there is none
    $scope.json_data.location[i].address[0].city.lang = "cs";
    $scope.json_data.location[i].address[0].street.lang = "cs";
  }

  // rewrite language info, just in case there is none
  $scope.json_data.address[0].city.lang = "cs";
  $scope.json_data.address[0].street.lang = "cs";
}
/* --------------------------------------------------------------------------------- */
// fill additional properties to json structure
/* --------------------------------------------------------------------------------- */
function fill_form($scope)
{
  add_addresses($scope);
  set_location_tags($scope);
  add_info_url_lang($scope);
  $scope.json_data.ts = new Date(); // TODO
}
/* --------------------------------------------------------------------------------- */
// save filled form as json to api
/* --------------------------------------------------------------------------------- */
function save_json_to_api($scope, $http)
{
  fill_form($scope);

  $http({
    method  : 'POST',
    url     : 'https://pokryti.eduroam.cz/api/' + $scope.selected_realm,
    data    : $scope.json_data
  })
  .then(function(response) {
    if(response.status == 200)
        ;       // TODO - saved popup
    console.log($scope.locations);
  }, function(err) {
    // TODO
    //if (err.status == 404)
    //  $scope.realm_validated = false;
  });
}
/* --------------------------------------------------------------------------------- */
/* --------------------------------------------------------------------------------- */
function add_empty_loc($scope)
{
  $scope.locations.push({ port_restrict : false, ipv6 : false, transp_proxy : false,
                          nat : false, wired : false, heading : "Nová lokalita" });
}
/* --------------------------------------------------------------------------------- */
// parse tag attributes from all locations to separate variables
/* --------------------------------------------------------------------------------- */
function parse_location_data($scope, locations)
{
  $scope.locations.splice(0);   // delete array before adding new elements

  for(var i in locations) {
    var loc = {};

    if(locations[i].tag && locations[i].tag.indexOf("port_restrict") != -1)
      loc.port_restrict = true;
    else
      loc.port_restrict = false;

    if(locations[i].tag && locations[i].tag.indexOf("IPv6") != -1)
      loc.ipv6 = true;
    else
      loc.ipv6 = false;

    if(locations[i].tag && locations[i].tag.indexOf("transp_proxy") != -1)
      loc.transp_proxy = true;
    else
      loc.transp_proxy = false;

    if(locations[i].tag && locations[i].tag.indexOf("NAT") != -1)
      loc.nat = true;
    else
      loc.nat = false;

    if("wired_no" in locations[i])     // wired eduroam is available
      loc.wired = true;
    else
      loc.wired = false;

    // accordion
    loc.heading = locations[i].address[0].street.data + " " + locations[i].address[0].city.data;

    $scope.locations.push(loc);
  }
}
/* --------------------------------------------------------------------------------- */
// retrieve json structure from backend api
/* --------------------------------------------------------------------------------- */
function get_json_from_api($scope, $http)
{
  $http({
    method  : 'GET',
    url     : 'https://pokryti.eduroam.cz/api/' + $scope.selected_realm
  })
  .then(function(response) {
    if(response.status == 200) {
      parse_location_data($scope, response.data.location);
      $scope.json_data = response.data;
      $scope.debug = JSON.stringify($scope.json_data, undefined, 4);
    }

  }, function(err) {
    if (err.status == 404)      // TODO?
      ;
  });
}
/* --------------------------------------------------------------------------------- */
