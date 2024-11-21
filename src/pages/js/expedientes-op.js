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
const usersCollection = db.collection('files');

usersCollection.where("idInCharge", "==", user.id).onSnapshot((snapshot) => {

    const cardContainer = document.querySelector('.card-container');
    cardContainer.innerHTML = '';  // Limpia el contenedor antes de añadir nuevas tarjetas
    let ctx = 0

    snapshot.forEach((doc) => {
        const fileData = doc.data();
        ctx++

        let cardHTML = `
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">${fileData.name}</h5>
                    <p class="card-text">Código de expediente : ${fileData.code}</p>
                    <p class="card-text">Código de carpeta : ${fileData.folder}</p>
                    <p class="card-text">DNI : ${fileData.dni}</p>
                    <p class="card-text">Teléfono : ${fileData.phone}</p>
                    <p class="card-text">Fecha de registro : ${formatoFechaDesdeTimestamp(fileData.dateRegister)} ${obtenerHoraMinutoDesdeTimestamp(fileData.dateRegister)}</p>
                    <p class="card-text">Estado : ${getStatus(fileData.status)}</p>
                    <center><a href="#" class="btn btn-primary" data-user='${JSON.stringify(fileData)}' onclick="showDetails(this)">Ver Detalles</a></center>
                </div>
            </div>
        `;

        cardContainer.insertAdjacentHTML('beforeend', cardHTML);
    });

    document.getElementById("loader").style.display = "none";

    if(ctx == 0){
        Swal.fire({
            title: "Oops!",
            text: "No tienes expedientes a cargo!",
            icon: "warning"
        });
    }

}, (error) => {
    console.error("Error al obtener documentos: ", error);
});



function showDetails(button) {
    // Recupera el objeto user desde el atributo data-user del botón
    const fileData = JSON.parse(button.getAttribute('data-user'));
    $('#details').modal('show')

    document.getElementById("d-preview").src = fileData.photo
    document.getElementById("d-dni").value = fileData.dni
    document.getElementById("urlLinkDni").href = fileData.fileUrlDNI
    document.getElementById("d-name").value = fileData.name
    document.getElementById("d-email").value = fileData.email
    document.getElementById("d-phone").value = fileData.phone

    document.getElementById("d-licence").value = fileData.licence
    document.getElementById("d-vig-licence").value = fileData.dateValidityLicence
    document.getElementById("linkUrlLicence").href = fileData.fileURLLicence
    document.getElementById("d-soat").value = fileData.soat
    document.getElementById("d-vig-soat").value = fileData.dateValiditySoat
    document.getElementById("linkUrlSoat").href = fileData.fileURLSOAT

    document.getElementById("d-brand").value = fileData.brand
    document.getElementById("d-model").value = fileData.model
    document.getElementById("d-plate").value = fileData.plate
    document.getElementById("d-yearBuild").value = fileData.yearBuild
    document.getElementById("d-category").value = fileData.category
    document.getElementById("d-numSerieVehicle").value = fileData.numSerieVehicle
    document.getElementById("d-numEngine").value = fileData.numEngine
    document.getElementById("d-color").value = fileData.color
    document.getElementById("d-codeVest").value = fileData.codeVest

    document.getElementById("d-vig-inspection").value = fileData.dateValidityInspection
    document.getElementById("linkUrlInspection").href = fileData.fileURLInspection
   
    document.getElementById("linkUrlTerms").href = fileData.fileURLTerms

    document.getElementById("linkDownloadSUNARP").href = fileData.fileURLSunarp

    document.getElementById("d-status").innerHTML = getStatusFromDetails(fileData.status)

    if(fileData.status == "migrated" || fileData.status == "corrected"){
        //addOn-observed btnCorect
        document.getElementById("d-dni").disabled = true
        document.getElementById("d-dni-addon-file").style.display = "none"
        document.getElementById("d-dniFile").style.display = "none"
        document.getElementById("d-dniFile").disabled = true
        document.getElementById("d-email").disabled = true
        document.getElementById("d-phone").disabled = true

        document.getElementById("d-brand").disabled = true
        document.getElementById("d-model").disabled = true
        document.getElementById("d-plate").disabled = true
        document.getElementById("d-yearBuild").disabled = true
        document.getElementById("d-category").disabled = true
        document.getElementById("d-numSerieVehicle").disabled = true
        document.getElementById("d-numEngine").disabled = true
        document.getElementById("d-color").disabled = true
        document.getElementById("d-codeVest").disabled = true


        document.getElementById("d-addOn-observed").style = "display:none;"
        document.getElementById("d-btnCorrect").style = "display:none;"
        document.getElementById("d-btnCorrect").innerHTML = ``
        document.getElementById("d-div-content-certificated").innerHTML = ``

    }else if(fileData.status == "aproved"){

        document.getElementById("d-dni").disabled = true
        document.getElementById("d-dni-addon-file").style.display = "none"
        document.getElementById("d-dniFile").style.display = "none"
        document.getElementById("d-dniFile").disabled = true
        document.getElementById("d-email").disabled = true
        document.getElementById("d-phone").disabled = true
        document.getElementById("d-brand").disabled = true
        document.getElementById("d-model").disabled = true
        document.getElementById("d-plate").disabled = true
        document.getElementById("d-yearBuild").disabled = true
        document.getElementById("d-category").disabled = true
        document.getElementById("d-numSerieVehicle").disabled = true
        document.getElementById("d-numEngine").disabled = true
        document.getElementById("d-color").disabled = true
        document.getElementById("d-codeVest").disabled = true

        document.getElementById("d-addOn-observed").style = "display:none;"
        document.getElementById("d-btnCorrect").style = "display:none;"
        document.getElementById("d-btnCorrect").innerHTML = ``
        document.getElementById("d-div-content-certificated").innerHTML = `<span class="input-group-text">Certificado de capacitación</span>
                            <span style="background-color: #00a822;color: #ffffff;" class="input-group-text">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-download" viewBox="0 0 16 16">
                                    <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"/>
                                    <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708z"/>
                                  </svg>
                                &nbsp;  
                                <a id="linkDownloadCertificated" style="color: #ffffff;text-decoration: none;" href="${fileData.fileUrlCertificated}" target="_blank">Descargar</a></span>
                                <span class="input-group-text">Resolución de sub-gerencia</span>
                            <span style="background-color: #fc0011;color: #ffffff;" class="input-group-text">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-download" viewBox="0 0 16 16">
                                    <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"/>
                                    <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708z"/>
                                  </svg>
                                &nbsp;  
                                <a id="linkDownloadResolution" style="color: #ffffff;text-decoration: none;" href="${fileData.fileUrlResolution}" target="_blank">Descargar</a></span>
                                `
    }else if(fileData.status == "observed"){

        document.getElementById("d-dni").disabled = true
        document.getElementById("d-email").disabled = true
        document.getElementById("d-phone").disabled = true

        document.getElementById("d-brand").disabled = true
        document.getElementById("d-model").disabled = true
        document.getElementById("d-plate").disabled = true
        document.getElementById("d-yearBuild").disabled = true
        document.getElementById("d-category").disabled = true
        document.getElementById("d-numSerieVehicle").disabled = true
        document.getElementById("d-numEngine").disabled = true
        document.getElementById("d-color").disabled = true
        document.getElementById("d-codeVest").disabled = true

        document.getElementById("d-addOn-observed").style = "display:flex;width:100%"
        document.getElementById("d-btnCorrect").style = "display:flex;width:100%"
        document.getElementById("d-txtObserved").value = fileData.txtNote
        document.getElementById("d-txtObserved").disabled = true
    
        document.getElementById("d-div-content-certificated").innerHTML = ``
   
    }
}

function getStatusFromDetails(status){
    if(status == "registered"){
        document.getElementById("d-status").style = "color:#048e34;margin-top:8px;"
        status = `<b>Registrado</b>`
    }else if(status == "migrated"){
        document.getElementById("d-status").style = "color:#b49600;margin-top:8px;"
        status = `<b>Migrado</b>`
    }else if(status == "observed"){
        document.getElementById("d-status").style = "color:#fc0000;margin-top:8px;"
        status = `<b>Observado</b>`
    }else if(status == "corrected"){
        document.getElementById("d-status").style = "color:#009083;margin-top:8px;"
        status = `<b>Corregido</b>`
    }else if(status == "acepted"){
        document.getElementById("d-status").style = "color:#900C3F;margin-top:8px;"
        status = `<b>Aceptado</b>`
    }else if(status == "aproved"){
        document.getElementById("d-status").style = "color:#00356d;margin-top:8px;"
        status = `<b>Aprobado</b>`
    }
    return status
}

function deleteFile(id){
    firebase.firestore().collection("files").doc(id).delete()
    Swal.fire({
        title: "Muy bien!",
        text: "Expediente eliminado!",
        icon: "success"
    });
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
        status = `<b style="color:#900C3F;">Aceptado</b>`
    }else if(status == "aproved"){
        status = `<b style="color:#00356d;">Aprobado</b>`
    }else if(status == "denied"){
        status = `<b style="color:#fc0000;">Denegado</b>`
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

function sendOberved(idFile, idFolder, idInCharge, desk, code,nameAssociation) {
    // Captura los valores de los campos
    const dni = document.getElementById('d-dni').value.trim();
    const name = document.getElementById('d-name').value.trim();
    const email = document.getElementById('d-email').value.trim();
    const phone = document.getElementById('d-phone').value.trim();

    const brand = document.getElementById("d-brand").value;
    const model = document.getElementById("d-model").value;
    const plate = document.getElementById("d-plate").value;
    const yearBuild = document.getElementById("d-yearBuild").value;
    const numSerieVehicle = document.getElementById("d-numSerieVehicle").value;
    const numEngine = document.getElementById("d-numEngine").value;
    const color = document.getElementById("d-color").value;
    const codeVest = document.getElementById("d-codeVest").value;
    const category = document.getElementById("d-category").value;


    // Validación de campos vacíos
    if (!dni || !name || !email || !phone || !brand || !model || !plate || !yearBuild || !numSerieVehicle ||
         !numEngine || !color || !codeVest || !category) {
        Swal.fire({
            title: "Campos incompletos",
            text: "Por favor, completa todos los campos antes de continuar.",
            icon: "warning"
        });
        return; // Detiene la ejecución de la función si hay campos vacíos
    }

    // Muestra el loader
    document.getElementById('d-loader2').style.display = 'block';
    document.getElementById("d-btn-close-modal").style.display = "none"
    document.getElementById("d-btnSendCorrected").disabled = true;

    // Captura el archivo seleccionado
    const dniFile = document.getElementById('d-dniFile').files[0];

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
                document.getElementById('d-loader2').style.display = 'none';
                document.getElementById("d-btn-close-modal").style.display = "block";
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
                        brand:brand,
                        model:model,
                        plate:plate,
                        yearBuild:yearBuild,
                        numSerieVehicle:numSerieVehicle,
                        numEngine:numEngine,
                        color:color,
                        codeVest:codeVest,
                        category:category,
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

                            Swal.fire({
                                title: "Muy bien",
                                text: "Expediente corregido!",
                                icon: "success"
                            });
                            $('#details').modal('hide');
                            document.getElementById('d-loader2').style.display = 'none';
                            document.getElementById("d-btn-close-modal").style.display = "block";
                        })
                        .catch((error) => {
                            Swal.fire({
                                title: "Oops",
                                text: "Ocurrió un error!",
                                icon: "error"
                            });
                            document.getElementById('d-loader2').style.display = 'none';
                            document.getElementById("d-btn-close-modal").style.display = "block";
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
            brand:brand,
            model:model,
            plate:plate,
            yearBuild:yearBuild,
            numSerieVehicle:numSerieVehicle,
            numEngine:numEngine,
            color:color,
            codeVest:codeVest,
            category:category,
            status: "corrected",
            timestamp: Date.now() // Timestamp opcional
        })
        .then(() => {
            firebase.firestore().collection('folders').doc(idFolder).update({ status: "corrected" });

            firebase.firestore().collection("notifications").add({
                idFolder: idFolder,
                name:nameAssociation,
                idUser : idInCharge,
                title : `El expediente #${code} ha sido corregido`,
                type : "file",
                content : `La Asociacion ${nameAssociation} con el expediente #${code} ha sido corregido en la carpeta : ${desk}`,
                isOpen : false,
                timestamp : Date.now()
            });

            Swal.fire({
                title: "Muy bien",
                text: "Expediente corregido!",
                icon: "success"
            });
            $('#details').modal('hide');
            document.getElementById("d-btn-close-modal").style.display = "block";
            document.getElementById('d-loader2').style.display = 'none';
        })
        .catch((error) => {
            Swal.fire({
                title: "Oops",
                text: "Ocurrió un error!",
                icon: "error"
            });
            document.getElementById("d-btn-close-modal").style.display = "block";
            document.getElementById('d-loader2').style.display = 'none';
        });
    }
}

