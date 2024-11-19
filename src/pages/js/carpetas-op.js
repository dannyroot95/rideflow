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

foldersCollection
.where("idInCharge", "in", ["", user.id]).onSnapshot(async (snapshot) => {
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

        let quantity1 = 0 
        let quantity2 = 0 
        let quantity3 = 0 
        let quantity4 = 0 
        let quantity5 = 0 
        let quantity6 = 0    

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

            if(fileData.status == "migrated"){
                quantity2++
            }

            if(fileData.status == "observed"){
                quantity3++
            }

            if(fileData.status == "corrected"){
                quantity4++
            }

            if(fileData.status == "acepted"){
                quantity5++
            }

            if(fileData.status == "aproved"){
                quantity6++
            }

            if(fileData.status == "denied"){
                quantity1++
            }

        });

        tableContent += '</tbody></table>';

        let inCharge = folderData.nameInCharge || "Ninguno";

        let content = `
        <div class="accordion accordion-flush">  
            <div class="accordion-item">
                <h2 class="accordion-header" id="heading${doc.id}">
                    <button class="accordion-button collapsed acc" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${doc.id}" aria-expanded="false" aria-controls="collapse${doc.id}">
                      Asociación : ${folderData.nameAssociation} &nbsp;&nbsp; | 
                      &nbsp;&nbsp; Código de carpeta: ${folderData.codeFolder} &nbsp;&nbsp; | 
                      &nbsp;&nbsp; Cantidad de expedientes : ${folderData.quantityFiles} &nbsp;&nbsp; | 
                      &nbsp;&nbsp; Fecha de operación : ${formatoFechaDesdeTimestamp(folderData.dateRegister)} ${obtenerHoraMinutoDesdeTimestamp(folderData.dateRegister)}
                      </button>
                </h2>
                <label style="margin-left:15px;display: flex;justify-content: left;">
                <span style="color:red;">● Rechazados</span> &nbsp;: ${quantity1} &nbsp;&nbsp; <span style="color:#b49600">● Migrados</span>&nbsp; : ${quantity2} &nbsp;&nbsp; <span style="color:red;">● Observados</span>&nbsp; : ${quantity3} &nbsp;&nbsp; <span style="color:#009083;">● Corregidos</span> &nbsp;: ${quantity4} &nbsp;&nbsp; <span style="color:#900C3F;">● Aceptados</span> &nbsp;: ${quantity5} &nbsp;&nbsp; <span style="color:#00356d;">● Aprobados</span>&nbsp; : ${quantity6}
                </label>
                <label style="visibility: hidden;">X</label>
                <div id="collapse${doc.id}" class="accordion-collapse collapse" aria-labelledby="heading${doc.id}" data-bs-parent="#accordionFlushExample">
                    <div class="accordion-body">${tableContent}</div>
                </div>
            </div>
        </div>    
        `;

        quantity1 = 0
        quantity6 = 0

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

    document.getElementById("linkDownloadSUNARP").href = fileData.fileURLSunarp

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
                    
                    <div class="input-group">
            <!-- Texto: N° de Resolución de SubGerencia -->
            <label for="resolutionNum" class="input-group-text" style="font-weight: 600; color: #a80084;">
                N° de Resolución de SubGerencia
            </label>
            <!-- Input: Número de resolución -->
            <input maxlength="4" type="tel" onKeypress='if(event.keyCode < 45 || event.keyCode > 57) event.returnValue = false;'  placeholder="001" class="form-control" id="resolutionNum">  
            </div>

            <div class="input-group mt-2">
            <!-- Texto: Año -->
            <label for="yearResolutionNum" class="input-group-text" style="font-weight: 600; color: #a80084;">
                Año
            </label>
            <!-- Input: Año de resolución -->
            <input maxlength="4" type="tel" onKeypress='if(event.keyCode < 45 || event.keyCode > 57) event.returnValue = false;'  placeholder="2024" class="form-control" id="yearResolutionNum">  
            </div>

            <div class="input-group mt-2">
            <!-- Input: Archivo de resolución -->
            <input type="file" class="form-control" id="resolutionFile">
            </div>

        
        `   
    }else if(fileData.status == 'aproved'){
        optionsNormal()
        document.getElementById("inputGroupSelectOperation").disabled = true
        //addOn-observed btnCorect
        document.getElementById("addOn-observed").style = "display:none;"
        document.getElementById("btnCorrect").innerHTML = ``
        document.getElementById("txtObserved").disabled = false
        document.getElementById("div-content-certificated").innerHTML = ``
        document.getElementById("div-content-resolution").innerHTML = ""
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
                idInCharge : user.id,
                nameInCharge : user.name+' '+user.lastName,
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

            firebase.firestore().collection("logs").add({
                idUser: user.id,
                nameUser:user.name +' '+user.lastName,
                type : "update",
                content : `El usuario ha actualizado un estado a : observado`,
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
            nameInCharge : user.name+' '+user.lastName,
            dateRegister : Date.now(),
            idInCharge : user.id
        });
        firebase.firestore().collection("notifications").add({
            idFolder: idFolder,
            name:user.name +' '+user.lastName,
            idUser : idAssociation,
            title : `El expediente #${code} ha sido aceptado exitosamente`,
            type : "file",
            content : `El expediente con DNI : ${dniFile} ha sido aceptado , ahora debe pasar por la capacitación , una vez capacitado se subirá su constancia y se le notificará.`,
            isOpen : false,
            timestamp : Date.now()
        });
        firebase.firestore().collection("logs").add({
            idUser: user.id,
            nameUser:user.name +' '+user.lastName,
            type : "update",
            content : `El usuario ha actualizado un estado a : aceptado`,
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
        const yearResolution = document.getElementById("yearResolutionNum").value
    
        if (certificatedFile && resolutionFile) {

            if(numResolution == "" && yearResolution == ""){
                Swal.fire({
                    title: "Oops",
                    text: "Ingrese el número y año de la resolución!",
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
                            numResolution : String(numResolution).padStart(4, '0')+'-'+yearResolution+'-MTP-GSC-SGSVYT'
                        });
    
                        return Promise.all([updates, fileURL, fileURL2]);
                    });
                })
                .then(() => {
                    return firebase.firestore().collection("folders").doc(idFolder).update({
                        status: "aproved",
                        nameInCharge : user.name+' '+user.lastName,
                        idInCharge : user.id,
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
                    return firebase.firestore().collection("logs").add({
                        idUser: user.id,
                        nameUser:user.name +' '+user.lastName,
                        type : "update",
                        content : `El usuario ha actualizado un estado a : aprobado`,
                        timestamp : Date.now()
                    });
                })
                .then(() => {
                    Swal.fire({
                        title: "Muy bien",
                        text: "Expediente aprobado!",
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
