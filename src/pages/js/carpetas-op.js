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
            const details = `<center><button class="btn btn-light" style="background-color:#00b465;color:white;" data-user='${JSON.stringify(fileData)}' onclick="showDetails(this,'${folderData.id}','${folderData.timesUpdated}')">Ver</button></center>`;

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



function showDetails(button,idFolder,timesUpdated) {
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
    document.getElementById("linkDownloadDNI").href = fileData.fileUrlDNI

    document.getElementById("timesObserved").innerHTML = fileData.timesObserved
    document.getElementById("status").innerHTML = getStatus(fileData.status)

    document.getElementById("btnCorrect").innerHTML = `
        <button onclick="send('${fileData.id}','${idFolder}','${fileData.idUserAssociation}','${fileData.timesObserved}','${timesUpdated}')" class="btn btn-success">Enviar</button>
    `

    if(fileData.status == 'migrated' || fileData.status == 'corrected'){
        //addOn-observed btnCorect
        document.getElementById("addOn-observed").style = "display:none;"
        document.getElementById("btnCorrect").style = "display:flex;width:100%"
        document.getElementById("txtObserved").disabled = false

    }else if (fileData.status == 'observed'){
        document.getElementById("addOn-observed").style = "display:flex;width:100%"
        document.getElementById("btnCorrect").style = "display:none;"
        document.getElementById("txtObserved").disabled = true
        document.getElementById("txtObserved").value = fileData.txtNote
        document.getElementById("inputGroupSelectOperation").disabled = true

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

function send(idFile,idFolder,idAssociation,timesObserved,timesUpdatedFolder){
    let status =  document.getElementById("inputGroupSelectOperation").value
    if(status == "observed"){
        let txtObserved = document.getElementById("txtObserved").value
        if(txtObserved != ""){
             firebase.firestore().collection("files").doc(idFile).update({
                status: status,
                txtNote : txtObserved,
                timesObserved : parseInt(timesObserved)+1,
                idFolder : idFolder
            });
            firebase.firestore().collection("folders").doc(idFolder).update({
                timesUpdated: parseInt(timesUpdatedFolder)+1,
                status : status,
                dateRegister : Date.now()
            });
            Swal.fire({
                title: "Muy bien",
                text: "Expediente actualizado!",
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

    }
}

function sendNotification(){

}