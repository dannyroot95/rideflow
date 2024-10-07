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
}

createDatatable();

const dataTable = $('#tb-data').DataTable();
const foldersCollection = db.collection('folders');

foldersCollection.where("association", "==", user.ruc).onSnapshot(async (snapshot) => {
    dataTable.clear();

    for (const doc of snapshot.docs) {
        const folderData = doc.data();
        let tableContent = `
                        <table class="table">
                            <thead>
                                <tr>
                                    <th style="color:white;background-color: grey;border-top-left-radius: 8px;"></th>
                                    <th style="color:white;background-color: grey;">Nombres</th>
                                    <th style="color:white;background-color: grey;">DNI</th>
                                    <th style="color:white;background-color: grey;">Telefono</th>
                                    <th style="color:white;background-color: grey; border-top-right-radius: 8px;">Estado</th>
                                </tr>
                            </thead>
                            <tbody>`;

        // Consulta a la colección de archivos que coincidan con el folder
        const filesSnapshot = await db.collection('files')
            .where("folder", "==", folderData.codeFolder)
            .get();

        filesSnapshot.forEach(fileDoc => {
            const fileData = fileDoc.data();
            const details = `<center><button class="btn btn-light" style="background-color:#00b465;color:white;" data-user='${JSON.stringify(fileData)}' onclick="showDetails(this)">Ver</button></center>`;

            // Añade filas a la tabla basado en los datos del archivo
            tableContent += `
            <tr>
            <td>${details}</td>
            <td>${fileData.name}</td>
            <td>${fileData.dni}</td>
            <td>${fileData.phone}</td>
            <td>${getStatus(fileData.status)}</td>
            </tr>`;
        });

        tableContent += '</tbody></table>';

        let content = `
        <div class="accordion accordion-flush">  
            <div class="accordion-item">
                <h2 class="accordion-header" id="heading${doc.id}">
                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${doc.id}" aria-expanded="false" aria-controls="collapse${doc.id}">
                        Código de carpeta: ${folderData.codeFolder} &nbsp;&nbsp; | &nbsp;&nbsp; Cantidad de expedientes : ${folderData.quantityFiles} &nbsp;&nbsp; | &nbsp;&nbsp; Fecha de operación : ${formatoFechaDesdeTimestamp(folderData.dateRegister)} ${obtenerHoraMinutoDesdeTimestamp(folderData.dateRegister)}
                    </button>
                </h2>
                <div id="collapse${doc.id}" class="accordion-collapse collapse" aria-labelledby="heading${doc.id}" data-bs-parent="#accordionFlushExample">
                    <div class="accordion-body">${tableContent}</div>
                </div>
            </div>
        </div>    
        `;

        dataTable.row.add([
            content
        ]);
    };

    dataTable.draw(false);
    document.getElementById("container").style.display = "block";
    document.getElementById("container").style.visibility = "hidden";
    dataTable.columns.adjust().draw(false);
    document.getElementById("container").style.visibility = "visible";
    document.getElementById("loader").style.display = "none";
}, (error) => {
    console.error("Error al obtener documentos: ", error);
});



function showDetails(button) {
    // Recupera el objeto user desde el atributo data-user del botón
    const fileData = JSON.parse(button.getAttribute('data-user'));
    $('#details').modal('show')
    document.getElementById("dni").value = fileData.dni
    document.getElementById("name").value = fileData.name
    document.getElementById("email").value = fileData.email
    document.getElementById("phone").value = fileData.phone

    document.getElementById("status").innerHTML = getStatusFromDetails(fileData.status)

    if(fileData.status != "observed"){
        //addOn-observed btnCorect
        document.getElementById("dni").disabled = true
        document.getElementById("dni-addon-file").style.display = "none"
        document.getElementById("dniFile").style.display = "none"
        document.getElementById("dniFile").disabled = true
        document.getElementById("email").disabled = true
        document.getElementById("phone").disabled = true


        document.getElementById("addOn-observed").style = "display:none;"
        document.getElementById("btnCorrect").style = "display:none;"
        document.getElementById("btnCorrect").innerHTML = ``
    }else{

        document.getElementById("dni").disabled = false
        document.getElementById("dni-addon-file").style = "display : flex;font-weight: 600;font-size: 12px;color: #014c69;"
        document.getElementById("dniFile").style.display = "flex"
        document.getElementById("dniFile").disabled = false
        document.getElementById("email").disabled = false
        document.getElementById("phone").disabled = false

        document.getElementById("addOn-observed").style = "display:flex;width:100%"
        document.getElementById("btnCorrect").style = "display:flex;width:100%"
        document.getElementById("txtObserved").value = fileData.txtNote
        document.getElementById("txtObserved").disabled = true
        document.getElementById("txtObserved").style = "text-transform: uppercase;color:black;"

        document.getElementById("btnCorrect").innerHTML = `
        <button id="btnSendCorrected" class="btn btn-success" onclick="sendOberved('${fileData.id}','${fileData.idFolder}')" >Enviar correción</button>`

    }

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
    }
    return status
}

function getStatusFromDetails(status){
    if(status == "registered"){
        document.getElementById("status").style = "color:#fff;background-color: #048e34;"
        status = `<b>Registrado</b>`
    }else if(status == "migrated"){
        document.getElementById("status").style = "color:#fff;background-color: #b49600;"
        status = `<b>Migrado</b>`
    }else if(status == "observed"){
        document.getElementById("status").style = "color:#fff;background-color: #fc0000;"
        status = `<b>Observado</b>`
    }else if(status == "corrected"){
        document.getElementById("status").style = "color:#fff;background-color: #009083;"
        status = `<b>Corregido</b>`
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

// Función para enviar el archivo DNI escaneado a Firestore
function sendOberved(idFile, idFolder) {
    // Captura los valores de los campos
    const dni = document.getElementById('dni').value.trim();
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();

    // Validación de campos vacíos
    if (!dni || !name || !email || !phone) {
        Swal.fire({
            title: "Campos incompletos",
            text: "Por favor, completa todos los campos antes de continuar.",
            icon: "warning"
        });
        return; // Detiene la ejecución de la función si hay campos vacíos
    }

    // Muestra el loader
    document.getElementById('loader2').style.display = 'block';
    document.getElementById("btn-close-modal").style.display = "none"
    document.getElementById("btnSendCorrected").disabled = true;

    // Captura el archivo seleccionado
    const dniFile = document.getElementById('dniFile').files[0];

    if (dniFile) {
        // Referencia a Firebase Storage con la ruta personalizada
        const storageRef = firebase.storage().ref();
        const fileRef = storageRef.child(`associations/${user.ruc}/files/dni/${dni}/${dniFile.name}`);

        // Subir el archivo a Firebase Storage
        const uploadTask = fileRef.put(dniFile);

        uploadTask.on('state_changed',
            (snapshot) => {
                // Progreso de la subida del archivo (opcional, si deseas mostrar progreso)
                let progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log('Subida de archivo: ' + progress + '%');
            },
            (error) => {
                // Maneja los errores de la subida
                console.error('Error al subir el archivo: ', error);
                document.getElementById('loader2').style.display = 'none';
                document.getElementById("btn-close-modal").style.display = "block";
            },
            () => {
                // Subida exitosa, obtenemos la URL del archivo
                uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                    console.log('Archivo disponible en: ', downloadURL);

                    // Guarda los datos del formulario y la URL del archivo en Firestore
                    const fileRef = firebase.firestore().collection('files').doc(idFile);

                    fileRef.update({
                        dni: dni,
                        name: name,
                        email: email,
                        phone: phone,
                        status: "corrected",
                        dniFileURL: downloadURL, // Guardamos la URL del archivo
                        timestamp: Date.now() // Timestamp opcional
                    });

                    firebase.firestore().collection('folders').doc(idFolder).update({ status: "corrected",dateRegister : Date.now()})
                        .then(() => {
                            Swal.fire({
                                title: "Muy bien",
                                text: "Expediente corregido!",
                                icon: "success"
                            });
                            $('#details').modal('hide');
                            document.getElementById('loader2').style.display = 'none';
                            document.getElementById("btn-close-modal").style.display = "block";
                        })
                        .catch((error) => {
                            Swal.fire({
                                title: "Oops",
                                text: "Ocurrió un error!",
                                icon: "error"
                            });
                            document.getElementById('loader2').style.display = 'none';
                            document.getElementById("btn-close-modal").style.display = "block";
                        });
                });
            }
        );
    } else {
        // Si no se seleccionó ningún archivo, simplemente guarda los demás datos en Firestore
        const fileRef = firebase.firestore().collection('files').doc(idFile);

        fileRef.update({
            dni: dni,
            name: name,
            email: email,
            phone: phone,
            status: "corrected",
            timestamp: Date.now() // Timestamp opcional
        })
        .then(() => {
            firebase.firestore().collection('folders').doc(idFolder).update({ status: "corrected" });

            Swal.fire({
                title: "Muy bien",
                text: "Expediente corregido!",
                icon: "success"
            });
            $('#details').modal('hide');
            document.getElementById("btn-close-modal").style.display = "block";
            document.getElementById('loader2').style.display = 'none';
        })
        .catch((error) => {
            Swal.fire({
                title: "Oops",
                text: "Ocurrió un error!",
                icon: "error"
            });
            document.getElementById("btn-close-modal").style.display = "block";
            document.getElementById('loader2').style.display = 'none';
        });
    }
}

