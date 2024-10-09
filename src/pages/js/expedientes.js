var dataUser = localStorage.getItem("userData");
var user = dataUser ? JSON.parse(dataUser) : null;

// Inicializa DataTable
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

    let button = `<button id="addFile" data-bs-toggle="modal" data-bs-target="#fileModal" class="btn btn-primary" style="margin-left:10px;"><b>+</b>&nbsp;Agregar expediente</button>&nbsp;&nbsp;<button class="btn btn-success" id="migrateExpedientes" >Migrar expedientes</button>&nbsp;<div id="loader-small" class="loaderSmall"></div>`;
    $(button).appendTo('.dt-length');
}

createDatatable();

const dataTable = $('#tb-data').DataTable();
const usersCollection = db.collection('files');

usersCollection.where("association", "==", user.ruc).onSnapshot((snapshot) => {
    // Limpia el DataTable antes de añadir nuevos datos
    dataTable.clear();
    
    snapshot.forEach((doc, index) => {
        const fileData = doc.data();
        const details = `<center><button class="btn btn-light" style="background-color:#093e00;color:white;" data-user='${JSON.stringify(fileData)}' onclick="showDetails(this)">Ver</button></center>`;
        let status = getStatus(fileData.status)

        

        // Añadir los datos a DataTable
        dataTable.row.add([
            details,
            fileData.code,
            fileData.name,
            fileData.dni,
            fileData.phone,
            formatoFechaDesdeTimestamp(fileData.dateRegister)+" "+obtenerHoraMinutoDesdeTimestamp(fileData.dateRegister),   
            status
        ]);
    });
       // Dibuja el DataTable con los nuevos datos
        dataTable.draw(false);
          // Muestra el contenedor pero con visibilidad oculta
        document.getElementById("container").style.display = "block";
        document.getElementById("container").style.visibility = "hidden";

        // Ajusta las columnas del DataTable para evitar desalineaciones
        dataTable.columns.adjust().draw(false);
        document.getElementById("container").style.visibility = "visible";
        document.getElementById("loader").style.display = "none";


}, (error) => {
    console.error("Error al obtener documentos: ", error);
});

document.getElementById("createFileForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    // Obtener los valores del formulario
    const email = document.getElementById("email").value;
    const name = document.getElementById("name").value;
    const dni = document.getElementById("dni").value;
    const phone = document.getElementById("phone").value;
    const dniFile = document.getElementById("dniFile").files[0];

    try {
        disable();

        // Verificar si el DNI ya está registrado
        const dniExists = await firebase.firestore().collection("files")
            .where("dni", "==", dni)
            .get();

        if (!dniExists.empty) {
            // Si el DNI ya existe, muestra un mensaje de error y no continúes
            Swal.fire({
                title: "Error",
                text: "El DNI ya está registrado.",
                icon: "error"
            });
            enable();
            return; // Salir del evento submit
        }

        // Subir el archivo a Firebase Storage
        const storageRef = firebase.storage().ref();
        const fileRef = storageRef.child('associations/'+user.ruc+"/files/dni/"+dni+"/"+ dniFile.name);
        await fileRef.put(dniFile);
        const fileURL = await fileRef.getDownloadURL();
        const randomNumber = Math.floor(Math.random() * 10000).toString() + dni;

        // Crear un nuevo documento en Firestore con un ID automático
        const docRef = await firebase.firestore().collection("files").add({
            code: randomNumber,
            association : user.ruc,
            name: name,
            dni: dni,
            email: email,
            phone: phone,
            fileUrlDNI: fileURL,
            status: "registered",
            folder: "",
            idInCharge : "",
            txtNote: "",
            inCharge : "",
            dateRegister : Date.now(),
            timesObserved : 0,
            idUserAssociation : user.id,
            idFolder : ""
        });

        // Opcional: Actualizar el documento con el ID si es necesario
        await firebase.firestore().collection("files").doc(docRef.id).update({
            id: docRef.id
        });

        Swal.fire({
            title: "Muy bien",
            text: "Expediente creado!",
            icon: "success"
        });

        $('#fileModal').modal('hide');
        enable();

    } catch (error) {
        enable();
        Swal.fire({
            title: "Oops",
            text: "Error al crear el expediente -> " + error.message,
            icon: "error"
        });
    }
});

document.getElementById('migrateExpedientes').addEventListener('click', async () => {
    const userData = JSON.parse(localStorage.getItem("userData"));  // Asegúrate de tener esta info almacenada
    const dataTable = $('#tb-data').DataTable();  // Asegúrate de que esta es la instancia correcta de tu DataTable
    const filesCollection = db.collection('files');
    const foldersCollection = db.collection('folders');

    try {
        // Obtener los DNIs visibles en la tabla cuyo estado es "Registrado"
        const visibleDnis = [];
        dataTable.rows({ search: 'applied' }).data().each(function (value, index) {
            if (value[6] === `<b style="color:#048e34;">Registrado</b>`) {  // Asumiendo que el estado está en la sexta columna
                visibleDnis.push(value[3]);  // Asumiendo que el DNI está en la cuarta columna
            }
        });

          // Comprobar si hay DNIs con estado "Registrado"
          if (visibleDnis.length === 0) {
            Swal.fire({
                title: "Oops!",
                text: "No hay expedientes para migrar.",
                icon: "info"
            });
            
            return;  // Salir de la función si no hay registros para procesar
        }
        
        document.getElementById("loader-small").style = "display : inline-block;"
        document.getElementById("addFile").disabled = true
        document.getElementById("migrateExpedientes").disabled = true
        // Contar documentos en la colección 'folders'
        const snapshot = await foldersCollection.get();
        const count = snapshot.size;
        const folderId = `Desk-${userData.ruc}-${count + 1}`;
        // Crear un batch para realizar las actualizaciones
        const batch = db.batch();
        // Agregar las actualizaciones al batch
        for (const dni of visibleDnis) {
            const querySnapshot = await filesCollection.where('dni', '==', dni).get();
            querySnapshot.forEach(doc => {
                batch.update(doc.ref, {
                    status: 'migrated',
                    folder: folderId
                });
            });
        }

        // Ejecutar el batch de actualizaciones
        await batch.commit();

       // Crear un nuevo documento en 'folders' después de migrar expedientes
       const newFolderDoc = await foldersCollection.add({
        codeFolder: folderId,
        association: userData.ruc,
        quantityFiles: visibleDnis.length,
        dateRegister : Date.now(),
        status : "migrated",
        nameAssociation : userData.association
    });

    await firebase.firestore().collection("folders").doc(newFolderDoc.id).update({
        id: newFolderDoc.id
    });

    await firebase.firestore().collection("notifications").add({
        idFolder: newFolderDoc.id,
        nameAssociation:userData.association,
        idUser : "",
        title : "Una nueva carpeta ha sido recibida!",
        type : "folder",
        content : `Se ha enviado ${visibleDnis.length} expedientes`,
        isOpen : false,
        timestamp : Date.now()
    });
    
        document.getElementById("loader-small").style = "display : none;"
        document.getElementById("addFile").disabled = false
        document.getElementById("migrateExpedientes").disabled = false

        Swal.fire({
            title: "Muy bien!",
            text: "Migración completada.",
            icon: "success"
        });

    } catch (error) {
        console.error('Error al migrar expedientes:', error);
        document.getElementById("loader-small").style = "display : none;"
        document.getElementById("addFile").disabled = false
        document.getElementById("migrateExpedientes").disabled = false

        Swal.fire({
            title: "Oops!",
            text: "Ocurrió un error.",
            icon: "error"
        });
    }
});


function showDetails(button) {
    // Recupera el objeto user desde el atributo data-user del botón
    const fileData = JSON.parse(button.getAttribute('data-user'));
    // Aquí puedes manejar la visualización de los detalles del usuario
    console.log(fileData);
}

function enable(){
    document.getElementById("btn-close-modal").style.display = "block"
    document.getElementById("btn-add-user").style.display = "block"
    document.getElementById("loader2").style.display = "none"
}

function disable(){
    document.getElementById("btn-close-modal").style.display = "none"
    document.getElementById("btn-add-user").style.display = "none"
    document.getElementById("loader2").style.display = "block"
}

var modalAddUser = document.getElementById('fileModal');
modalAddUser.addEventListener('hidden.bs.modal', function (event) {
    document.getElementById("createFileForm").reset();
});

function isLetter(event) {
    const charCode = event.which || event.keyCode;
    // Permitir letras y teclas especiales como la barra espaciadora y las teclas de control
    return (charCode >= 65 && charCode <= 90) || // Letras mayúsculas
           (charCode >= 97 && charCode <= 122) || // Letras minúsculas
           charCode === 32 || // Espacio
           charCode === 8 || // Retroceso
           charCode === 46 || // Suprimir
           charCode === 9; // Tabulador
}

function validateLetters(input) {
    // Reemplaza cualquier carácter que no sea una letra o espacio
    input.value = input.value.toUpperCase().replace(/[^a-zA-Z\s]/g, '');
}

function getStatus(status){
    if(status == "registered"){
        status = `<b style="color:#048e34;">Registrado</b>`
    }else if(status == "migrated"){
        status = `<b style="color:#b49600;">Migrado</b>`
    }else if(status == "observed"){
        status = `<b style="color:#fc0000;">Observado</b>`
    }else if(status == "corrected"){
        status = `<b style="color:#009083;">Corregido</b>`
    }else if(status == "acepted"){
        status = `<b style="color:#9bfc00;">Aceptado</b>`
    }else if(status == "aproved"){
        status = `<b style="color:#00356d;">Aprobado</b>`
    }
    return status
}

function formatoFechaDesdeTimestamp(timestamp) {
    const fecha = new Date(timestamp);
    const dia = String(fecha.getDate()).padStart(2, '0'); // Obtiene el día y lo formatea
    const mes = String(fecha.getMonth() + 1).padStart(2, '0'); // Obtiene el mes y lo formatea
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