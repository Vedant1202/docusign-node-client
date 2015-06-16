/**
 * Handles administration of given organization's DocuSign account
 *
 *
 * @type {exports}
 */

var dsUtils = require('./../dsUtils');


exports.init = function(accountId, baseUrl, accessToken) {
  return {
    getOrgAccountInfo: function(callback){
      getOrgAccountInfo(accountId, accessToken, callback);
    },
    getUserList: function(callback){
      getUserList(accessToken, baseUrl, callback);
    },
    addUsers: function(usersToAdd, callback){
      addUsers(accessToken, baseUrl, usersToAdd, callback);
    },
    deleteUsers: function(usersToDelete, callback){
      deleteUsers(accessToken, baseUrl, usersToDelete, callback);
    },
    getTemplates: function(callback){
      getTemplates(accessToken, baseUrl, callback);
    },
    getPlan: function(callback){
      getPlan(accessToken, baseUrl, callback);
    }
  }
}


/**
 * Gets the account info for the given org accountId
 *
 * @param {string} accountId - DocuSign AccountId.
 * @param {string} apiToken - DocuSign API OAuth2 access token.
 * @param {function} callback - Returned in the form of function(response).
 */
function getOrgAccountInfo(accountId, apiToken, callback) {
  var options = {
    method: 'GET',
    url: dsUtils.getApiUrl() + '/accounts/' + accountId,
    headers: dsUtils.getHeaders(apiToken)
  };

  dsUtils.makeRequest('Get DS Org Account Info', options, process.env.dsDebug, function(response) {
    if ('errorCode' in response) {
      return callback(response);
    }
    callback(response);
  });
};

/**
 * Returns a list of users for the organization in the base URL
 *
 * @param {string} apiToken - DocuSign API OAuth2 access token.
 * @param {string} baseUrl - DocuSign API base URL.
 * @param {function} callback - Returned in the form of function(response).
 */
function getUserList(apiToken, baseUrl, callback) {
  var options = {
    method: 'GET',
    url: baseUrl + '/users?additional_info=true',
    headers: dsUtils.getHeaders(apiToken, baseUrl)
  };

  dsUtils.makeRequest('Get DS Account User List', options, process.env.dsDebug, function(response) {
    if ('errorCode' in response) {
      callback(response);
      return;
    }

    callback(response.users);
  });
};

/**
 * Creates a set of new users in DocuSign for the Org associated to the base URL
 *
 * @param {string} apiToken - DocuSign API OAuth2 access token.
 * @param {string} baseUrl - DocuSign API base URL.
 * @param {object[]} usersToAdd - Array of Objects with account creation information.
 *   @param {string} usersToAdd[].first - First Name
 *   @param {string} usersToAdd[].last - Last Name
 *   @param {string} usersToAdd[].email - Email Address
 *   @param {string} usersToAdd[].password - Password
 * @param {function} callback - Returned in the form of function(response).
 */
function addUsers(apiToken, baseUrl, usersToAdd, callback) {
  var users = usersToAdd.map(function(user) {
    return {
      userName: user.first + ' ' + user.last,
      firstName: user.first,
      lastName: user.last,
      email: user.email,
      password: user.password,
      userSettings: [
        { name: 'canSendEnvelope', value: true }
      ]
    };
  });

  var options = {
    method: 'POST',
    url: baseUrl + '/users',
    headers: dsUtils.getHeaders(apiToken, baseUrl),
    json: {
      newUsers: users
    }
  };

  dsUtils.makeRequest('Add Users to DS Account', options, process.env.dsDebug, function(response) {
    callback(response);
  });
};

/**
 * Deletes a set of users from DocuSign
 *
 * @param {string} apiToken - DS API OAuth2 access token.
 * @param {string} baseUrl - DS API base URL.
 * @param {array} usersToDelete - Collection of users in the form of {userId: userId}
 * @param {function} callback - Returned in the form of function(response).
 */
function deleteUsers(apiToken, baseUrl, usersToDelete, callback) {
  var userIds = usersToDelete.map(function(user) {
    return {
      userId: user.userId
    };
  });

  var options = {
    method: 'DELETE',
    url: baseUrl + '/users',
    headers: dsUtils.getHeaders(apiToken, baseUrl),
    json: {
      users: userIds
    }
  };

  dsUtils.makeRequest('Delete Users in DS Account', options, process.env.dsDebug, function(response) {
    callback(response);
  });
};

/**
 * Gets the templates for a given account
 *
 * @param {string} apiToken - DocuSign API OAuth2 access token.
 * @param {string} baseUrl - DocuSign API base URL.
 * @param {function} callback - Returned in the form of function(response).
 */
function getTemplates(apiToken, baseUrl, callback) {
  var options = {
    method: 'GET',
    url: baseUrl + '/templates',
    headers: dsUtils.getHeaders(apiToken)
  };

  dsUtils.makeRequest('Get Templates', options, process.env.dsDebug, function(response) {
    if ('errorCode' in response) {
      callback({ error: response.errorCode + ': ' + response.message });
      return;
    }

    callback(response);
  });
};

/**
 * Get the billing plan info for DS account with the given `apiToken`.
 *
 * Adds custom properties to plan object before sending it to the callback
 * envelopesLeft - calculated
 * name - shortcut for planName which is redundant plan.planName. :)
 *
 *
 * @param {string} apiToken - DocuSign API OAuth2 access token.
 * @param {string} baseUrl - DocuSign API base URL.
 * @param {function} callback - Returned in the form of function(response).
 */
function getPlan(apiToken, baseUrl, callback) {
  var options = {
    method: 'GET',
    url: baseUrl,
    headers: dsUtils.getHeaders(apiToken)
  };

  dsUtils.makeRequest('Get Billing Plan Info', options, process.env.dsDebug, function(plan) {
    var envelopesLeft = plan.billingPeriodEnvelopesAllowed - plan.billingPeriodEnvelopesSent;

    // a negative number signifies unlimited amount
    plan.envelopesLeft = isNaN(envelopesLeft) ? -1 : envelopesLeft;

    plan.name = plan.planName;

    callback(plan);
  });
};