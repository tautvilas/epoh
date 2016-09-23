var Http = {};

Http.request = function(method, url, data) {
  var request = new XMLHttpRequest();
  var promise = new Promise(function(resolve, reject) {
    request.open(method, url, true);
    request.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
    request.onload = function() {
      resolve(JSON.parse(request.responseText));
    };
    request.onerror = function(error) {
      reject(error);
    };
    request.send(JSON.stringify(data));
  });
  return promise;
};

Http.post = function(url, data) {
  return Http.request('POST', url, data);
};

Http.get = function(url) {
  return Http.request('GET', url);
};

Http.delete = function(url) {
  return Http.request('DELETE', url);
};

