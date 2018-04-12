var messages = require('./messages');

/**
 * The UserFilter object transforms user objects into objects suitable to be sent as JSON to
 * the server, hiding any private user attributes.
 *
 * @param {Object} the LaunchDarkly client configuration object
 **/
function UserFilter(config) {
  var filter = {};
  const allAttributesPrivate =
    config.allAttributesPrivate !== undefined ? config.allAttributesPrivate : config.all_attributes_private;
  const privateAttributeNames =
    (config.privateAttributeNames !== undefined ? config.privateAttributeNames : config.private_attribute_names) || [];
  var ignoreAttrs = { key: true, custom: true, anonymous: true };
  var allowedTopLevelAttrs = { key: true, secondary: true, ip: true, country: true, email: true,
        firstName: true, lastName: true, avatar: true, name: true, anonymous: true, custom: true };

  if (config.all_attributes_private !== undefined) {
    console && console.warn && console.warn(messages.deprecated('all_attributes_private', 'allAttributesPrivate'));
  }
  if (config.private_attribute_names !== undefined) {
    console && console.warn && console.warn(messages.deprecated('private_attribute_names', 'privateAttributeNames'));
  }
      
  filter.filterUser = function(user) {
    var allPrivateAttrs = {};
    var userPrivateAttrs = user.privateAttributeNames || [];
    
    var isPrivateAttr = function(name) {
      return !ignoreAttrs[name] && (
        allAttributesPrivate || userPrivateAttrs.indexOf(name) !== -1 ||
        privateAttributeNames.indexOf(name) !== -1);
    }
    var filterAttrs = function(props, isAttributeAllowed) {
      return Object.keys(props).reduce(function(acc, name) {
        if (isAttributeAllowed(name)) {
          if (isPrivateAttr(name)) {
            // add to hidden list
            acc[1][name] = true;
          } else {
            acc[0][name] = props[name];
          }
        }
        return acc;
      }, [{}, {}]);
    }
    var result = filterAttrs(user, function(key) { return allowedTopLevelAttrs[key]; });
    var filteredProps = result[0];
    var removedAttrs = result[1];
    if (user.custom) {
      var customResult = filterAttrs(user.custom, function(key) { return true; });
      filteredProps.custom = customResult[0];
      Object.assign(removedAttrs, customResult[1]);
    }
    var removedAttrNames = Object.keys(removedAttrs);
    if (removedAttrNames.length) {
      removedAttrNames.sort();
      filteredProps.privateAttrs = removedAttrNames;
    }
    return filteredProps;
  }

  return filter;
}

module.exports = UserFilter;
