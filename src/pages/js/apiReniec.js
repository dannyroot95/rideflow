var dni = document.getElementById('dni')
var fullname = document.getElementById('name')


dni.addEventListener('input', updateValue);
function updateValue(e) {
    e.target.value = e.target.value.replace(/[^0-9]/g, '').toLowerCase()
    var value = e.srcElement.value
    if(value.length == 8){
	    dni.disabled = true
        fetch('https://secure-escarpment-09449-7f155548382f.herokuapp.com/api/dni/' + value)
        .then(response => {responseClone = response.clone(); // 2
      return response.json();})
      .then(data => {
      
        dni.disabled = false
        fullname.value = data.nombre

      }, function (rejectionReason) { // 3
        console.log('Error parsing JSON from response: '+rejectionReason); // 4
        responseClone.text() // 5
        .then(function (bodyText) {
            if(bodyText == "Not found"){
            dni.disabled = false
            fullname.value = ""
            console.log('Received the following instead of valid JSON:', bodyText); // 6
            Swal.fire(
                      'Oops!',
                      'Sin resultados!',
                      'info'
                    )
            }else{
            dni.disabled = false
            fullname.value = ""
            console.log('Received the following instead of valid JSON:', bodyText); // 6
            Swal.fire(
                      'Oops!',
                      'Intentelo nuevamente!',
                      'info'
                    )
            }
        });
    });
       
    }else{
       fullname.value = ""
    }
}