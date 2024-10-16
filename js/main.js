function checkEnter(event) {
  if (event.key === "Enter") {
      validateForm();
  }
}

function validateForm() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!email) {
        alert("El campo de correo es obligatorio.");
        return false;
    } else if (!emailPattern.test(email)) {
        alert("Por favor, introduce una dirección de correo válida.");
        return false;
    }

    if (!password) {
        alert("El campo de contraseña es obligatorio.");
        return false;
    } else if (password.length < 6) {
        alert("La contraseña debe tener al menos 6 caracteres.");
        return false;
    }

    document.getElementById("loader").style = "display:block;margin-top:20px;"
    document.getElementById("btnAccess").style = "display:none"
    document.getElementById("email").disabled = true
    document.getElementById("password").disabled = true
    document.getElementById("lostPassword").style = "display:none"

    firebase.auth().signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // El inicio de sesión fue exitoso
      var user = userCredential.user;
      var uid = user.uid;

      // Acceder a Firestore y obtener los datos del usuario
      firebase.firestore().collection('users').doc(uid).get()
        .then((doc) => {
          if (doc.exists) {

            // Guardar los datos del usuario en localStorage
            const userData = doc.data();

            firebase.firestore().collection("logs").add({
              idUser: userData.id,
              nameUser:userData.name,
              type : "read",
              content : `El usuario ha iniciado sesión a las ${obtenerHoraMinutoDesdeTimestamp(Date.now())} con fecha -> ${formatDateToDDMMYYYY(Date.now())}`,
              timestamp : Date.now()
          }).then((doc) => {
            localStorage.setItem('userData', JSON.stringify(userData));
            // Redirigir a la página deseada
            window.location.href = `http://${window.location.host}/src/index.html#`;
          })
            
          } else {
            // Si no se encuentra el documento en Firestore
            alert("No se encontraron datos para este usuario.");
          }
        })
        .catch((error) => {
          console.error("Error al obtener los datos del usuario:", error);
          alert("Ocurrió un error al acceder a los datos del usuario.");
        });
    })
    .catch((error) => {
      // Manejar errores
      var errorCode = error.code;
      var errorMessage = error.message;

      firebase.firestore().collection("logs").add({
        idUser: "unknown",
        nameUser:"unknown",
        type : "read",
        content : `Se ha detectado una autenticacion inválida -> ${errorMessage} 
        correo :${email} , contraseña : ${password}`,
        timestamp : Date.now()
    });

       document.getElementById("loader").style = "display:none"
       document.getElementById("btnAccess").style = "display:block"
       document.getElementById("email").disabled = false
       document.getElementById("password").disabled = false
       document.getElementById("lostPassword").style = "display:block"

      if (errorCode === 'auth/wrong-password') {
        alert("Contraseña incorrecta.");
      } else if (errorCode === 'auth/user-not-found') {
        alert("Usuario no encontrado.");
      } else {
        alert(errorMessage);
      }
    });
    // Aquí puedes añadir el código para enviar el formulario
    return true;
}


function formatDateToDDMMYYYY(timestamp) {
  const fecha = new Date(timestamp);
  const dia = String(fecha.getDate()).padStart(2, '0'); // Obtiene el día y lo formatea con dos dígitos
  const mes = String(fecha.getMonth() + 1).padStart(2, '0'); // Obtiene el mes (se suma 1 porque los meses empiezan en 0)
  const anio = fecha.getFullYear(); // Obtiene el año

  return `${dia}/${mes}/${anio}`; // Devuelve la fecha en formato dd/mm/yyyy
}


// Función para obtener la hora y minutos desde un timestamp
function obtenerHoraMinutoDesdeTimestamp(timestamp) {
  const fecha = new Date(timestamp);
  const horas = String(fecha.getHours()).padStart(2, '0'); // Obtiene las horas y las formatea
  const minutos = String(fecha.getMinutes()).padStart(2, '0'); // Obtiene los minutos y los formatea

  return `${horas}:${minutos}`; // Devuelve la hora en formato HH:mm
}

