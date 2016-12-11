(function() {

  var buttons = document.querySelectorAll('.toggleOutlet');
  
  Array.from(buttons).forEach(link => {
    link.addEventListener('click', toggleOutlet.bind(link, link.getAttribute('data-outletId'), link.getAttribute('data-outletStatus')));
  });

  function toggleOutlet(outletId, outletStatus) {
    var data = 'outletId=' + outletId + '&outletStatus=' + outletStatus;

    var http = new XMLHttpRequest();
    http.open('POST', '/toggle', true);
    http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    http.onreadystatechange = function() {
      if (http.readyState == 4 && http.status == 200) {
        console.log(http.responseText);
      }
    }
    http.send(data);
  }

}());