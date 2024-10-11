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

document.getElementById("inputGroupSelectOperation").addEventListener("change", function() {
    var selectedOption = this.value;
    var observedElement = document.getElementById("addOn-observed");

    if (selectedOption === "observed") {
        // Mostrar el elemento si se selecciona "Observar"
        observedElement.style.display = "flex";
    } else {
        // Ocultar el elemento si se selecciona cualquier otra opción
        observedElement.style.display = "none";
    }
});


const dataTable = $('#tb-data').DataTable();
const foldersCollection = db.collection('folders');

foldersCollection.onSnapshot(async (snapshot) => {
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
            const details = `<center><button class="btn btn-light" style="background-color:#00b465;color:white;" data-user='${JSON.stringify(fileData)}' onclick="showDetails(this,'${folderData.id}')">Ver</button></center>`;

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
                      Asociación : ${folderData.nameAssociation} &nbsp;&nbsp; | &nbsp;&nbsp; Código de carpeta: ${folderData.codeFolder} &nbsp;&nbsp; | &nbsp;&nbsp; Cantidad de expedientes : ${folderData.quantityFiles} &nbsp;&nbsp; | &nbsp;&nbsp; Fecha de operación : ${formatoFechaDesdeTimestamp(folderData.dateRegister)} ${obtenerHoraMinutoDesdeTimestamp(folderData.dateRegister)}
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



function showDetails(button,idFolder) {
    // Recupera el objeto user desde el atributo data-user del botón
    const fileData = JSON.parse(button.getAttribute('data-user'));
    $('#details').modal('show')
    document.getElementById("inputGroupSelectOperation").disabled = false
    document.getElementById("inputGroupSelectOperation").selectedIndex = 0;
    document.getElementById("txtObserved").value = ""
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

    document.getElementById("linkDownloadDNI").href = fileData.fileUrlDNI

    document.getElementById("timesObserved").innerHTML = fileData.timesObserved
    document.getElementById("status").innerHTML = getStatus(fileData.status)

    document.getElementById("btnCorrect").innerHTML = `
        <button id="btn-add-user" onclick="send('${fileData.id}','${idFolder}','${fileData.idUserAssociation}','${fileData.timesObserved}',
        '${fileData.timestamp}','${fileData.dni}','${fileData.folder}','${fileData.code}')" class="btn btn-success">Enviar</button>
    `

    if(fileData.status == 'migrated' || fileData.status == 'corrected'){
        optionsNormal()
        //addOn-observed btnCorect
        document.getElementById("inputGroupSelectOperation").disabled = false
        document.getElementById("addOn-observed").style = "display:none;"
        document.getElementById("btnCorrect").style = "display:flex;width:100%"
        document.getElementById("txtObserved").disabled = false
        document.getElementById("div-content-certificated").innerHTML = ``

    }else if (fileData.status == 'observed'){
        optionsNormal()
        document.getElementById("addOn-observed").style = "display:flex;width:100%"
        document.getElementById("btnCorrect").style = "display:none;"
        document.getElementById("txtObserved").disabled = true
        document.getElementById("txtObserved").value = fileData.txtNote
        document.getElementById("inputGroupSelectOperation").disabled = true
        document.getElementById("div-content-certificated").innerHTML = ``

    }else if(fileData.status == 'acepted'){
        agregarOpcion()
        document.getElementById("inputGroupSelectOperation").disabled = false
        document.getElementById("addOn-observed").style = "display:none;"
        document.getElementById("btnCorrect").style = "display:flex;width:100%"
        document.getElementById("txtObserved").disabled = false
        document.getElementById("div-content-certificated").innerHTML = `
           <span class="input-group-text" style="font-weight: 600;color: #186901;" id="certificated-addon-file">
           Certificado de capacitación</span>
           <input type="file" class="form-control" id="certificatedFile">`

        document.getElementById("div-content-resolution").innerHTML = `
           <span class="input-group-text" style="font-weight: 600;color: #a80084;" id="resolution-addon-file">
           N° de Resolución de SubGerencia</span>
           <input type="text" style="text-transform:uppercase;" placeholder="001-2024-MPT-GSC-SGSVYT" class="form-control" id="resolutionNum">  
           <input type="file" class="form-control" id="resolutionFile">`   
    }else if(fileData.status == 'aproved'){
        optionsNormal()
        document.getElementById("inputGroupSelectOperation").disabled = true
        //addOn-observed btnCorect
        document.getElementById("addOn-observed").style = "display:none;"
        document.getElementById("btnCorrect").style = "display:flex;width:100%"
        document.getElementById("txtObserved").disabled = false
        document.getElementById("div-content-certificated").innerHTML = ``
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
        status = `<b style="color:#9bfc00;">Aceptado</b>`
    }else if(status == "aproved"){
        status = `<b style="color:#00356d;">Aprobado</b>`
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
        document.getElementById("status").style = "color:#fff;background-color: #9bfc00;"
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

function send(idFile,idFolder,idAssociation,timesObserved,timesUpdatedFolder,dniFile,desk,code){
    let status =  document.getElementById("inputGroupSelectOperation").value
    if(status == "observed"){
        let txtObserved = document.getElementById("txtObserved").value
        if(txtObserved != ""){
             firebase.firestore().collection("files").doc(idFile).update({
                status: status,
                txtNote : txtObserved,
                timesObserved : parseInt(timesObserved)+1,
                idFolder : idFolder,
                idInCharge : user.id,
                inCharge : user.name+' '+user.lastName
            });
            firebase.firestore().collection("folders").doc(idFolder).update({
                timesUpdated: parseInt(timesUpdatedFolder)+1,
                status : status,
                dateRegister : Date.now()
            });

            firebase.firestore().collection("notifications").add({
                idFolder: idFolder,
                name:user.name+''+user.lastName,
                idUser : idAssociation,
                title : `El expediente #${code} ha sido observado por ${user.name} ${user.lastName}`,
                type : "file",
                content : `El expediente con DNI : ${dniFile} ha sido observado en la carpeta : ${desk}`,
                isOpen : false,
                timestamp : Date.now()
            });
        

            Swal.fire({
                title: "Muy bien",
                text: "Expediente observado!",
                icon: "success"
            });
            $('#details').modal('hide')
        }else{
            Swal.fire({
                title: "Oops",
                text: "Digite la observacion!",
                icon: "info"
            });
        }

    }else if(status == "acepted"){
        firebase.firestore().collection("files").doc(idFile).update({
            status: status,
            idFolder : idFolder,
            idInCharge : user.id,
            inCharge : user.name+' '+user.lastName
        });
        firebase.firestore().collection("folders").doc(idFolder).update({
            status : status,
            dateRegister : Date.now()
        });
        firebase.firestore().collection("notifications").add({
            idFolder: idFolder,
            name:user.name +' '+user.lastName,
            idUser : idAssociation,
            title : `El expediente #${desk} ha sido aceptado exitosamente`,
            type : "file",
            content : `El expediente con DNI : ${dniFile} ha sido aceptado , ahora debe pasar por la capacitación , una vez capacitado se subirá su constancia y se le notificará.`,
            isOpen : false,
            timestamp : Date.now()
        });
        Swal.fire({
            title: "Muy bien",
            text: "Expediente aceptado!",
            icon: "success"
        });
        $('#details').modal('hide')
    }else if (status === "aproved") {
        
        const certificatedFile = document.getElementById("certificatedFile").files[0];
        const resolutionFile = document.getElementById("resolutionFile").files[0];
        const numResolution = document.getElementById("resolutionNum").value
    
        if (certificatedFile && resolutionFile) {

            if(numResolution == ""){
                Swal.fire({
                    title: "Oops",
                    text: "Ingrese el número de la resolución!",
                    icon: "warning"
                });
                return;
            }

            disable();
    
            const uploadFile = (path, file) => {
                const storageRef = firebase.storage().ref();
                const fileRef = storageRef.child(path);
                return fileRef.put(file).then(() => fileRef.getDownloadURL());
            };
    
            uploadFile(`folders/${code}/certificated/`, certificatedFile)
                .then(fileURL => {
                    return uploadFile(`folders/${code}/resolutions/`, resolutionFile).then(fileURL2 => {
                        const updates = firebase.firestore().collection("files").doc(idFile).update({
                            fileUrlCertificated: fileURL,
                            fileUrlResolution: fileURL2,
                            status : "aproved",
                            numResolution : numResolution
                        });
    
                        return Promise.all([updates, fileURL, fileURL2]);
                    });
                })
                .then(() => {
                    return firebase.firestore().collection("folders").doc(idFolder).update({
                        status: "aproved",
                        dateRegister: Date.now()
                    }).then(() => ({
                        //
                    }));
                })
                .then(() => {
                    return firebase.firestore().collection("notifications").add({
                        idFolder: idFolder,
                        name: user.name +' '+user.lastName,
                        idUser: idAssociation,
                        title: `El expediente #${code} ha sido aprobado!`,
                        type: "file",
                        content: `El expediente con DNI: ${dniFile} ha sido aprobado, apersonece a ventanilla a recojer su tarjeta de operación.`,
                        isOpen: false,
                        timestamp: Date.now()
                    });
                })
                .then(() => {
                    Swal.fire({
                        title: "Muy bien",
                        text: "Expediente aceptado!",
                        icon: "success"
                    });
                    enable();
                    $('#details').modal('hide')
                })
                .catch(error => {
                    console.error("Error updating the documents:", error);
                      enable();
                    Swal.fire({
                        title: "Error",
                        text: "Hubo un problema al procesar su solicitud.",
                        icon: "error"
                    });
                });
        } else {
            Swal.fire({
                title: "Oops",
                text: "Suba los archivos necesarios!",
                icon: "warning"
            });
        }
    }
    else if(status == "none"){
        Swal.fire({
            title: "Oops",
            text: "Selecione una opción!",
            icon: "warning"
        });
    }
}

function agregarOpcion() {
    document.getElementById("inputGroupSelectOperation").innerHTML = ` <option value="none" selected disabled>seleccione una opcion...</option>
                              <option style="color: #0043a8;" value="aproved">Aprobar</option>
                              <option value="denied">Rechazar</option>`
}

function optionsNormal() {
    document.getElementById("inputGroupSelectOperation").innerHTML = ` <option value="none" selected disabled>seleccione una opcion...</option>
                              <option style="color: #0043a8;" value="acepted">Aceptar</option>
                              <option style="color: #fc0000;" value="observed">Observar</option>
                              <option value="denied">Rechazar</option>`
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