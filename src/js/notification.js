var firebaseConfig = {
    apiKey: "AIzaSyC6v_DfUTYRpLzetgGEhn1BTVOj8s92w_o",
    authDomain: "rideflow-142ee.firebaseapp.com",
    projectId: "rideflow-142ee",
    storageBucket: "rideflow-142ee.appspot.com",
    messagingSenderId: "856679515547",
    appId: "1:856679515547:web:e9538fb38c6cee051c0d3e"
  };
  
  firebase.initializeApp(firebaseConfig);
  let db = firebase.firestore()

document.querySelector('.notification-icon').addEventListener('click', function() {
    $('#notificationModal').modal('show');
});


function listenToNotifications(userData) {
    // Realiza la consulta usando tu referencia de colección `notification`
    const q = db.collection("notifications")
            .where("idUser", "in", ["", userData])
            .where("isOpen", "==", false); 
    // Escucha los cambios en tiempo real
    const unsubscribe = q.onSnapshot((querySnapshot) => {
      let count = 0;
      querySnapshot.forEach((doc) => {
        console.log(doc.id, " => ", doc.data());
        count++;
      });
       document.getElementById("count").innerHTML = count
    }, (error) => {
      console.error("Error al obtener documentos en tiempo real:", error);
    });
  
    // Puedes llamar a `unsubscribe()` para dejar de escuchar los cambios
  }


listenToNotifications(user.id);