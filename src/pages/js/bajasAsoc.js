var dataUser = localStorage.getItem("userData");
var user = dataUser ? JSON.parse(dataUser) : null;
var dataExcel = []

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

    let button = `<button style="height:40px;" class="btn btn-dark" onclick="exportToExcel1()" 
    style="margin-left:10px;"><i class="bi bi-printer-fill"></i></button>`;
    $(button).appendTo('.dt-length-1');
}

function createDatatable2() {
    $('#tb-data2').DataTable({
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

    let button = `<button style="height:40px;" class="btn btn-dark" onclick="exportToExcel1()" 
    style="margin-left:10px;"><i class="bi bi-printer-fill"></i></button>`;
    $(button).appendTo('.dt-length2');
}

createDatatable();
createDatatable2();


const cardsCollection = db.collection('cards');
const dataTable = $('#tb-data').DataTable();

cardsCollection.where("idUserAssociation", "==", user.id).onSnapshot((snapshot) => {
    // Limpia el DataTable antes de añadir nuevos datos
    dataTable.clear();
    dataExcel = []

    snapshot.forEach((doc) => {
        const fileData = doc.data();
        let revok = fileData.status
        let details = ``
        
        if(revok == "ok"){
            revok = `<center><label style="color:green;font-weight:bold;">No</label></center>`
            details = `
            <center>
                <button class="btn btn-light" style="background-color:#3933FF;color:white;height:40px;" 
                    data-user='${JSON.stringify(fileData)}' onclick="revoke(this)">
                    Revocar
                </button>
            </center>
        `;
        }else if(revok == "request"){
            revok = `<label style="color:#d900a1;font-weight:bold;">En proceso</label>`
        }else{
            revok = `<center><label style="color:red;font-weight:bold;">Si</label></center>`
        }
        
        // Añadir los datos a DataTable
        dataTable.row.add([
            details,
            fileData.name,
            fileData.dni,
            fileData.numCardOperation,
            getStatus(fileData.dateGenerated,fileData.expiryDate),
            fileData.dateGenerated,
            fileData.expiryDate,
            revok
        ]);

        
        dataExcel.push({
            'Nombres':fileData.name,
            'DNI':fileData.dni,
            '# de tarjeta':fileData.numCardOperation,
            'Estado':getStatus(fileData.dateGenerated,fileData.expiryDate),
            'Fecha de emisión':fileData.dateGenerated,
            'Fecha de vencimiento':fileData.expiryDate,
        })

    });

    allRequests()

}, (error) => {
    console.error("Error al obtener documentos: ", error);
});


function allRequests(){
    const requestCollection = db.collection('requests');
    const dataTable2 = $('#tb-data2').DataTable();
    requestCollection.where("idUserAssociation", "==", user.id).onSnapshot((snapshot) => {
        // Limpia el DataTable antes de añadir nuevos datos
        dataTable2.clear();
        dataExcel = []
    
        snapshot.forEach((doc) => {
            const fileData = doc.data();
            let details = ``

            if(fileData.status == "observed"){
                details = `
                <center>
                    <button class="btn btn-light" style="background-color:red;color:white;height:40px;" 
                        data-user='${JSON.stringify(fileData)}' onclick="detailRequest(this)">
                        <i class="bi bi-eye-fill"></i>
                    </button>
               </center>
                `
            }
        
            // Añadir los datos a DataTable
            dataTable2.row.add([
                details,
                fileData.codeRequest,
                fileData.name,
                fileData.dni,
                fileData.numCardOperation,
                getStatusRequest(fileData.status)
            ]);
    
    
    
        });
    
        dataTable.draw(false);
        document.getElementById("container").style.display = "block";
        document.getElementById("container").style.visibility = "hidden";
        dataTable.columns.adjust().draw(false);
        document.getElementById("container").style.visibility = "visible";
        document.getElementById("title1").style="display:flex;font-weight: 500;color: #093e00;font-size: 19px;"
    

        document.getElementById("container2").style.display = "block";
        document.getElementById("container2").style.visibility = "hidden";
        dataTable2.columns.adjust().draw(false);
        document.getElementById("container2").style.visibility = "visible";
        document.getElementById("title2").style="display:flex;font-weight: 500;color: #c31000;font-size: 19px;"
    
        document.getElementById("loader").style.display = "none";
    
    }, (error) => {
        console.error("Error al obtener documentos: ", error);
    });
    
}


function getStatus(dateGenerated, expiryDate) {
    const genDateParts = dateGenerated.split('/');
    const expDateParts = expiryDate.split('/');

    const genDate = new Date(genDateParts[2], genDateParts[1] - 1, genDateParts[0]);
    const expDate = new Date(expDateParts[2], expDateParts[1] - 1, expDateParts[0]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);  // Normalizar la fecha de hoy para eliminar la hora

    if (today >= genDate && today <= expDate) {
        return `<span class="status-vigente">Vigente</span>`;
    } else {
        return `<span class="status-no-vigente">Caducado</span>`;
    }
}

function revoke(data) {
    const card = JSON.parse(data.getAttribute('data-user'));
    
    $('#revokeModal').modal('show');
    document.getElementById("dni").value = card.dni;
    document.getElementById("name").value = card.name;
    document.getElementById("cardNumber").value = card.numCardOperation;
    document.getElementById("footer").innerHTML = `
            <button 
                onclick="sendRequest('${encodeURIComponent(JSON.stringify(card))}')" 
                id="btnSendRequest" class="btn btn-primary">
                Enviar
            </button>
            &nbsp;
            <div id="loader-send" class="loaderSmall" style="display: none;"></div>`;
}

async function sendRequest(cardData) {
    const card = JSON.parse(decodeURIComponent(cardData));
    const requestText = document.getElementById("txtRequest").value;
    const loader = document.getElementById("loader-send");
    const btnSendRequest = document.getElementById("btnSendRequest");
    const fileRequest = document.getElementById("fileRequest").files[0];
    const modalClose = document.getElementById("btn-close-modal-request")
    let urlFileRequest = "";

    if (requestText.trim() === "") {
        Swal.fire({
            title: "¡Oops!",
            text: "Digite la solicitud.",
            icon: "warning"
        });
        return;
    }

    // Mostrar loader y desactivar botón
    loader.style.display = "flex";
    modalClose.style.display = "none";
    btnSendRequest.disabled = true;

    try {
        // Si hay un archivo cargado, subirlo a Firebase Storage
        if (fileRequest) {
            const storageRef = firebase.storage().ref();
            const fileRef = storageRef.child(`requests/${fileRequest.name}`);
            const snapshot = await fileRef.put(fileRequest);
            urlFileRequest = await snapshot.ref.getDownloadURL();
            console.log("Archivo subido exitosamente:", urlFileRequest);
        }

        // Guardar datos en Firestore
        const requestsCollection = db.collection("requests");

        // Crear un nuevo documento en Firestore y obtener su ID
        const docRef = await requestsCollection.add({
            codeRequest: Math.floor(100000 + Math.random() * 900000),
            dni: card.dni,
            name: card.name,
            numCardOperation: card.numCardOperation,
            request: requestText,
            timestamp: Date.now(),
            status: "send",
            idUserAssociation: card.idUserAssociation,
            numResolution: card.numResolution,
            urlFileRequest: urlFileRequest,
            txtObserved: ""
        });

        // Actualizar el documento con su ID generado
        await db.collection("requests").doc(docRef.id).update({
            id: docRef.id
        });

        // Actualizar el estado de la tarjeta
        await db.collection("cards").doc(card.id).update({
            status: "request"
        });

        Swal.fire({
            title: "¡Éxito!",
            text: `La solicitud ha sido enviada correctamente.`,
            icon: "success"
        });

        // Cerrar modal y restablecer formulario
        loader.style.display = "none";
        btnSendRequest.disabled = false;
        modalClose.style.display = "flex";

        $('#revokeModal').modal('hide');
        document.getElementById("txtRequest").value = "";
    } catch (error) {
        console.error("Error al enviar la solicitud:", error);
        Swal.fire({
            title: "Error",
            text: "Ocurrió un error al enviar la solicitud. Por favor, inténtelo de nuevo.",
            icon: "error"
        });

        // Restablecer el estado de la interfaz de usuario
        loader.style.display = "none";
        modalClose.style.display = "flex";
        btnSendRequest.disabled = false;
    }
}

function getStatusRequest(status){
    let newStatus = ""
    if(status == "send"){
        newStatus = `<label style="color:green;font-weight:bold;">Enviado</label>`
    }else if(status == "observed"){
        newStatus = `<label style="color:red;font-weight:bold;">Observado</label>`
    }else if(status == "corrected"){
        newStatus = `<label style="color:#0057b8;font-weight:bold;">Corregido</label>`
    }else if(status == "denegado"){
        newStatus = `<label style="color:red;font-weight:bold;">Denegado</label>`
    }else if(status == "acepted"){
        newStatus = `<label style="color:green;font-weight:bold;">Aceptado</label>`
    }
    return newStatus
}

function detailRequest(data){
    const request = JSON.parse(data.getAttribute('data-user'));
    $('#detailsRequest').modal('show');
    document.getElementById("titleRequest").innerHTML = `Detalle de solicitud #${request.codeRequest}`
    document.getElementById("txtRequestObserved").value = request.txtObserved
    document.getElementById("footer2").innerHTML = `
            <button 
                onclick="sendRequestCorrected('${request.id}')" 
                class="btn btn-primary" id="btnSendCorrected">
                Enviar correción
            </button>
            &nbsp;
            <div id="loader-send-corrected" class="loaderSmall" style="display: none;"></div>`;
    
}

async function sendRequestCorrected(id) {
    const txtCorrected = document.getElementById("txtRequestCorrected").value.trim();
    const fileCorrected = document.getElementById("fileRequest2").files[0];
    const loader = document.getElementById("loader-send-corrected");
    const btnSendCorrected = document.getElementById("btnSendCorrected");
    const modalClose = document.getElementById("btn-close-modal-corrected");

    // Validación de entrada
    if (!txtCorrected) {
        Swal.fire({
            title: "¡Oops!",
            text: "Digite la corrección.",
            icon: "warning"
        });
        return;
    }

    // Configurar el estado inicial de los botones y loader
    toggleLoadingState(true, loader, modalClose, btnSendCorrected);

    try {
        let urlFileRequest = "";

        // Si hay un archivo cargado, subirlo a Firebase Storage
        if (fileCorrected) {
            urlFileRequest = await uploadFileToFirebase(fileCorrected);
        }

        // Actualizar datos en Firestore
        await updateFirestoreRequest(id, txtCorrected, urlFileRequest);

        // Mostrar mensaje de éxito
        Swal.fire({
            title: "¡Éxito!",
            text: "La solicitud ha sido corregida exitosamente.",
            icon: "success"
        });

        $('#detailsRequest').modal('hide');

    } catch (error) {
        console.error("Error al procesar la solicitud:", error);

        Swal.fire({
            title: "Error",
            text: "Ocurrió un error al corregir la solicitud. Por favor, inténtelo de nuevo.",
            icon: "error"
        });
    } finally {
        // Restaurar estado de botones y loader
        toggleLoadingState(false, loader, modalClose, btnSendCorrected);
    }
}

// Función para subir un archivo a Firebase Storage
async function uploadFileToFirebase(file) {
    const storageRef = firebase.storage().ref();
    const fileRef = storageRef.child(`requests/${file.name}`);
    const snapshot = await fileRef.put(file);
    return snapshot.ref.getDownloadURL();
}

// Función para actualizar Firestore
async function updateFirestoreRequest(id, requestText, fileUrl = "") {
    const updateData = {
        request: requestText,
        status: "corrected"
    };

    if (fileUrl) {
        updateData.urlFileRequest = fileUrl;
    }

    return db.collection("requests").doc(id).update(updateData);
}

// Función para alternar el estado de carga (loader y botones)
function toggleLoadingState(isLoading, loader, modalClose, btnSendCorrected) {
    loader.style.display = isLoading ? "flex" : "none";
    modalClose.style.display = isLoading ? "none" : "flex";
    btnSendCorrected.disabled = isLoading;
}