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
            localStorage.setItem('userData', JSON.stringify(userData));
            // Redirigir a la página deseada
            window.location.href = `http://${window.location.host}/src/index.html#`;
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

