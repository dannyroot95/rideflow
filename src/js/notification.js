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

$('#notificationModal').on('shown.bs.modal', function () {
  // Asegúrate de que dataTable está definido correctamente y está apuntando a tu instancia de DataTables
  const dataTable = $('#tb-data').DataTable();
  dataTable.columns.adjust().draw();
});

function listenUnreadNotifications(userData) {
  // Consulta de notificaciones donde isOpen es false
  const q = db.collection("notifications")
          .where("idUser", "in", ["", userData])
          .where("isOpen", "==", false);

  // Escucha los cambios en tiempo real
  const unsubscribe = q.onSnapshot((querySnapshot) => {
    let count = 0;

    querySnapshot.forEach((doc) => {
      count++;
    });

    // Actualizar el contador de notificaciones no leídas
    let previousCount = parseInt(document.getElementById("count").innerHTML)
    document.getElementById("count").innerHTML = count;

      
    if (count > previousCount && previousCount != null) {
      previousCount = count;
      const audio = new Audio('/images/notify.mp3');
      audio.play();
    }

 
  }, (error) => {
    console.error("Error al obtener documentos en tiempo real:", error);
  });

  // Puedes llamar a `unsubscribe()` para dejar de escuchar los cambios
}


function listenAllNotifications(userData) {
  const q = db.collection("notifications").where("idUser", "in", ["", userData])
  .orderBy("timestamp", "desc"); // Asegúrate de que el campo "timestamp" está indexado en Firestore

  q.onSnapshot((snapshot) => {
    const dataTable = $('#tb-data').DataTable();
    dataTable.clear();
    let count = 0;

    snapshot.forEach((doc) => {
      count++;
      const notificationData = doc.data();
      const details = `<center><button class="btn btn-primary" data-notification='${JSON.stringify(notificationData)}' onclick="showNotificationDetails('${doc.id}', this)">Ver</button></center>`;

      let row = dataTable.row.add([
        details,
        count,
        notificationData.title || "Sin título"
      ]).draw(false).node();

      // Resaltar filas donde isOpen es false
      if (!notificationData.isOpen) {
        $(row).css('background-color', '#f1fbff');
      }
    });

    dataTable.draw();
    dataTable.columns.adjust().draw();
 
  }, (error) => {
    console.error("Error al obtener documentos: ", error);
  });
}



// Función para mostrar detalles de la notificación y actualizar su estado
function showNotificationDetails(notificationId, notificationData) {
  // Aquí puedes personalizar cómo mostrar los detalles de la notificación
  // Por ejemplo, puedes usar otro modal o actualizar un área específica del DOM
  alert(`Detalles de la notificación: ${notificationData.title}\n${notificationData.body || "Sin contenido adicional."}`);

  // Actualizar el estado de la notificación a isOpen: true
  db.collection("notifications").doc(notificationId).update({
    isOpen: true
  })
  .then(() => {
    console.log("Notificación actualizada correctamente.");
  })
  .catch((error) => {
    console.error("Error al actualizar la notificación:", error);
  });
}

function createDatatable() {
  $('#tb-data').DataTable({
      language: {
          "decimal": "",
          "emptyTable": "No hay información",
          "info": "Mostrando _TOTAL_ datos",
          "infoEmpty": "<b>No existen datos</b>",
          "infoFiltered": "(Filtrado de _MAX_ total datos)",
          "infoPostFix": "",
          "thousands": ",",
          "lengthMenu": "Mostrar _MENU_ datos",
          "loadingRecords": "Cargando...",
          "processing": "Procesando...",
          "search": "Buscar : ",
          "zeroRecords": "Sin resultados encontrados",
          "paginate": {
              "first": "Primero",
              "last": "Último",
              "next": "Siguiente",
              "previous": "Anterior"
          }
      },
      scrollY: '50vh',
      scrollX: true,
      sScrollXInner: "100%",
      scrollCollapse: true,
      destroy: true, // Permite destruir la tabla para reinicializarla
  });
}

createDatatable();

Swal.fire({
  title: '¿Quieres recibir notificaciones?',
  text: "Puedes activar o desactivar las notificaciones en cualquier momento.",
  icon: 'question',
  showCancelButton: true,
  confirmButtonColor: '#3085d6',
  cancelButtonColor: '#d33',
  confirmButtonText: 'Sí, activar',
  cancelButtonText: 'No, gracias'
}).then((result) => {
  if (result.isConfirmed) {
    // Usuario acepta recibir notificaciones
    if(user.typeUser != "association"){
      // Escuchar solo notificaciones no leídas y actualizar el contador
      listenUnreadNotifications(user.id);
      // Escuchar todas las notificaciones y llenar la tabla
      listenAllNotifications(user.id);
    } else {
      document.getElementById("count").innerHTML = "0";
    }
  } else {
    // Usuario rechaza recibir notificaciones, gestionar adecuadamente
    document.getElementById("count").innerHTML = "0";
    console.log("El usuario no desea recibir notificaciones.");
    // Opcional: realizar alguna acción adicional
  }
});
