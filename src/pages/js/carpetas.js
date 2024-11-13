var dataUser = localStorage.getItem("userData");
var user = dataUser ? JSON.parse(dataUser) : null;
var dataExcel = []

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

    let button = `<button style="height:40px;margin-left:10px;" class="btn btn-dark" onclick="exportToExcel()"><i class="bi bi-printer-fill"></i></button>`;
    $(button).appendTo('.dt-length');

}

createDatatable();

const dataTable = $('#tb-data').DataTable();
const foldersCollection = db.collection('folders');

foldersCollection.where("association", "==", user.ruc).onSnapshot(async (snapshot) => {
    dataTable.clear();
    dataExcel = []

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
        let inCharge = folderData.nameInCharge || "Ninguno";

        let content = `
        <div class="accordion accordion-flush">  
            <div class="accordion-item">
                <h2 class="accordion-header" id="heading${doc.id}">
                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${doc.id}" aria-expanded="false" aria-controls="collapse${doc.id}">
                        Código de carpeta: ${folderData.codeFolder} &nbsp;&nbsp; | 
                        &nbsp;&nbsp; Cantidad de expedientes : ${folderData.quantityFiles} &nbsp;&nbsp; | 
                        &nbsp;&nbsp; A cargo de : ${inCharge} &nbsp;&nbsp; |
                        &nbsp;&nbsp; Fecha de operación : ${formatoFechaDesdeTimestamp(folderData.dateRegister)} ${obtenerHoraMinutoDesdeTimestamp(folderData.dateRegister)}
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

        dataExcel.push({
            'Código': folderData.codeFolder,
            'Cantidad': folderData.quantityFiles,
            'Encargado': inCharge,
            'Fecha de operación' : formatoFechaDesdeTimestamp(folderData.dateRegister)+' '+obtenerHoraMinutoDesdeTimestamp(folderData.dateRegister),
            'Estado' : folderData.status
        })

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

    document.getElementById("brand").value = fileData.brand
    document.getElementById("model").value = fileData.model
    document.getElementById("plate").value = fileData.plate
    document.getElementById("yearBuild").value = fileData.yearBuild
    document.getElementById("category").value = fileData.category
    document.getElementById("numSerieVehicle").value = fileData.numSerieVehicle
    document.getElementById("numEngine").value = fileData.numEngine
    document.getElementById("color").value = fileData.color
    document.getElementById("codeVest").value = fileData.codeVest

    document.getElementById("status").innerHTML = getStatusFromDetails(fileData.status)

    if(fileData.status != "observed"){
        //addOn-observed btnCorect
        document.getElementById("dni").disabled = true
        document.getElementById("dni-addon-file").style.display = "none"
        document.getElementById("dniFile").style.display = "none"
        document.getElementById("dniFile").disabled = true
        document.getElementById("email").disabled = true
        document.getElementById("phone").disabled = true

        document.getElementById("brand").disabled = true
        document.getElementById("model").disabled = true
        document.getElementById("plate").disabled = true
        document.getElementById("yearBuild").disabled = true
        document.getElementById("category").disabled = true
        document.getElementById("numSerieVehicle").disabled = true
        document.getElementById("numEngine").disabled = true
        document.getElementById("color").disabled = true
        document.getElementById("codeVest").disabled = true


        document.getElementById("addOn-observed").style = "display:none;"
        document.getElementById("btnCorrect").style = "display:none;"
        document.getElementById("btnCorrect").innerHTML = ``

    }else if(fileData.status == "certificated"){

        document.getElementById("dni").disabled = true
        document.getElementById("dni-addon-file").style.display = "none"
        document.getElementById("dniFile").style.display = "none"
        document.getElementById("dniFile").disabled = true
        document.getElementById("email").disabled = true
        document.getElementById("phone").disabled = true
        document.getElementById("brand").disabled = true
        document.getElementById("model").disabled = true
        document.getElementById("plate").disabled = true
        document.getElementById("yearBuild").disabled = true
        document.getElementById("category").disabled = true
        document.getElementById("numSerieVehicle").disabled = true
        document.getElementById("numEngine").disabled = true
        document.getElementById("color").disabled = true
        document.getElementById("codeVest").disabled = true



        document.getElementById("addOn-observed").style = "display:none;"
        document.getElementById("btnCorrect").style = "display:none;"
        document.getElementById("btnCorrect").innerHTML = ``
        document.getElementById("div-content-certificated").innerHTML = `<span class="input-group-text">Certificado de capacitación</span>
                            <span style="background-color: #00a822;color: #ffffff;" class="input-group-text">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-download" viewBox="0 0 16 16">
                                    <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"/>
                                    <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708z"/>
                                  </svg>
                                &nbsp;  
                                <a id="linkDownloadCertificated" style="color: #ffffff;text-decoration: none;" href="" target="_blank">Descargar</a></span>`
    }else{

        document.getElementById("dni").disabled = false
        document.getElementById("dni-addon-file").style = "display : flex;font-weight: 600;font-size: 12px;color: #014c69;"
        document.getElementById("dniFile").style.display = "flex"
        document.getElementById("dniFile").disabled = false
        document.getElementById("email").disabled = false
        document.getElementById("phone").disabled = false

        document.getElementById("brand").disabled = false
        document.getElementById("model").disabled = false
        document.getElementById("plate").disabled = false
        document.getElementById("yearBuild").disabled = false
        document.getElementById("category").disabled = false
        document.getElementById("numSerieVehicle").disabled = false
        document.getElementById("numEngine").disabled = false
        document.getElementById("color").disabled = false
        document.getElementById("codeVest").disabled = false

        document.getElementById("addOn-observed").style = "display:flex;width:100%"
        document.getElementById("btnCorrect").style = "display:flex;width:100%"
        document.getElementById("txtObserved").value = fileData.txtNote
        document.getElementById("txtObserved").disabled = true
        document.getElementById("txtObserved").style = "text-transform: uppercase;color:black;"

        document.getElementById("btnCorrect").innerHTML = `
        <button id="btnSendCorrected" class="btn btn-success" onclick="sendOberved('${fileData.id}','${fileData.idFolder}','${fileData.idInCharge}','${fileData.folder}','${fileData.code}','${fileData.nameAssociation}')" >Enviar correción</button>`

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
    }else if(status == "acepted"){
        status = `<b style="color:#900C3F;">Aceptado</b>`
    }else if(status == "aproved"){
        status = `<b style="color:#00356d;">Aprobado</b>`
    }else if(status == "denied"){
        status = `<b style="color:#fc0000;">Rechazado</b>`
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
    }else if(status == "acepted"){
        document.getElementById("status").style = "color:#fff;background-color: #900C3F;"
        status = `<b>Aceptado</b>`
    }else if(status == "aproved"){
        document.getElementById("status").style = "color:#fff;background-color: #00356d;"
        status = `<b>Aprobado</b>`
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
function sendOberved(idFile, idFolder, idInCharge, desk, code,nameAssociation) {
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

                            firebase.firestore().collection("notifications").add({
                                idFolder: idFolder,
                                name:user.name,
                                idUser : idInCharge,
                                title : `El expediente #${code} ha sido corregido`,
                                type : "file",
                                content : `La Asociacion ${nameAssociation} con el expediente #${code} ha sido corregido en la carpeta : ${desk}`,
                                isOpen : false,
                                timestamp : Date.now()
                            });

                            firebase.firestore().collection("logs").add({
                                idUser: user.id,
                                nameUser:user.name,
                                type : "update",
                                content : `El usuario ha actualizado un estado a : corregido`,
                                timestamp : Date.now()
                            });

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

            firebase.firestore().collection("notifications").add({
                idFolder: idFolder,
                name:user.name,
                idUser : idInCharge,
                title : `El expediente #${code} ha sido corregido`,
                type : "file",
                content : `La Asociacion ${nameAssociation} con el expediente #${code} ha sido corregido en la carpeta : ${desk}`,
                isOpen : false,
                timestamp : Date.now()
            });

            
            firebase.firestore().collection("logs").add({
                idUser: user.id,
                nameUser:user.name,
                type : "update",
                content : `El usuario ha actualizado un estado a : corregido`,
                timestamp : Date.now()
            });

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

function exportToExcel(){

    Swal.fire({
        title: 'En breves se descargará el archivo!',
        timer: 2000,
        timerProgressBar: true,
        didOpen: () => {
          Swal.showLoading()
        },
      })
  

    let xls = new XlsExport(dataExcel, 'carpetas');
    xls.exportToXLS('carpetas.xls')
  }
