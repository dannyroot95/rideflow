
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

function listenUnreadNotificationsForAssociation(userData) {
  // Consulta de notificaciones donde isOpen es false
  const q = db.collection("notifications")
          .where("idUser" ,"==", userData)
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
      const details = `
          <!-- Botón con icono de ojo (ver) -->
      <button class="btn btn-primary" data-notification='${JSON.stringify(notificationData)}'
        onclick="showNotificationDetails('${doc.id}', this)">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="white" class="bi bi-eye" viewBox="0 0 16 16">
          <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8a13.133 13.133 0 0 1-1.66 2.043C11.879 11.332 10.12 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.133 13.133 0 0 1 1.172 8z"/>
          <path d="M8 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/>
          <path d="M8 6.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z"/>
        </svg>
      </button>

      <!-- Botón con icono de eliminar -->
      <button class="btn btn-danger" data-notification='${JSON.stringify(notificationData)}' 
        onclick="deleteNotification('${doc.id}', this)">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="white" class="bi bi-trash" viewBox="0 0 16 16">
          <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 0A.5.5 0 0 1 9 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
          <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1 0-2h3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1h3a1 1 0 0 1 1 1zM4.118 4l.447 9.032A1 1 0 0 0 5.563 14h4.875a1 1 0 0 0 .998-.968L11.882 4H4.118zM2.5 3a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 .5.5H2.5z"/>
        </svg>
      </button>
    </center>
      `;

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

function listenAllNotificationsForAssociations(userData) {
  const q = db.collection("notifications").where("idUser", "==", userData)
  .orderBy("timestamp", "desc"); // Asegúrate de que el campo "timestamp" está indexado en Firestore

  q.onSnapshot((snapshot) => {
    const dataTable = $('#tb-data').DataTable();
    dataTable.clear();
    let count = 0;

    snapshot.forEach((doc) => {
      count++;
      const notificationData = doc.data();
      const details = `<center>
      <!-- Botón con icono de ojo (ver) -->
      <button class="btn btn-primary" data-notification='${JSON.stringify(notificationData)}'
        onclick="showNotificationDetails('${doc.id}', this)">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="white" class="bi bi-eye" viewBox="0 0 16 16">
          <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8a13.133 13.133 0 0 1-1.66 2.043C11.879 11.332 10.12 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.133 13.133 0 0 1 1.172 8z"/>
          <path d="M8 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/>
          <path d="M8 6.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z"/>
        </svg>
      </button>

      <!-- Botón con icono de eliminar -->
      <button class="btn btn-danger" data-notification='${JSON.stringify(notificationData)}' 
        onclick="deleteNotification('${doc.id}', this)">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="white" class="bi bi-trash" viewBox="0 0 16 16">
          <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 0A.5.5 0 0 1 9 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
          <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1 0-2h3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1h3a1 1 0 0 1 1 1zM4.118 4l.447 9.032A1 1 0 0 0 5.563 14h4.875a1 1 0 0 0 .998-.968L11.882 4H4.118zM2.5 3a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 .5.5H2.5z"/>
        </svg>
      </button>
    </center>
    `;

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
  $('#notificationModalDetail').modal('show');
  const data = JSON.parse(notificationData.getAttribute('data-notification'));
  db.collection("notifications").doc(notificationId).update({isOpen: true})
  document.getElementById("title").innerHTML = data.title
  document.getElementById("association").value = data.name
  document.getElementById("content").value = data.content
}

function deleteNotification(id){
  firebase.firestore().collection("notifications").doc(id).delete()
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


if(user.typeUser == "operator" || user.typeUser == "association"){
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
      if(user.typeUser == "association"){
        listenUnreadNotificationsForAssociation(user.id);
        // Escuchar todas las notificaciones y llenar la tabla
        listenAllNotificationsForAssociations(user.id);
  
      }else {
        // Escuchar solo notificaciones no leídas y actualizar el contador
        listenUnreadNotifications(user.id);
        // Escuchar todas las notificaciones y llenar la tabla
        listenAllNotifications(user.id);
      }
    } else {
      // Usuario rechaza recibir notificaciones, gestionar adecuadamente
      document.getElementById("count").innerHTML = "0";
      console.log("El usuario no desea recibir notificaciones.");
      // Opcional: realizar alguna acción adicional
    }
  });
}else{
  document.getElementById("notification-icon").remove();
}


