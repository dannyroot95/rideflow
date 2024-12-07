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
            revok = `<label style="color:green;font-weight:bold;">No</label>`
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
            revok = `<label style="color:red;font-weight:bold;">Si</label>`
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
        
            // Añadir los datos a DataTable
            dataTable2.row.add([
                details,
                "00000",
                fileData.name,
                fileData.dni,
                fileData.numCardOperation,
                fileData.status
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

    if (requestText.trim() === "") {
        Swal.fire({
            title: "¡Oops!",
            text: "Digite la solicitud.",
            icon: "warning"
        });
        return;
    }

    // Show loader and disable button
    loader.style.display = "flex";
    btnSendRequest.disabled = true;

    try {
        // Prepare Firestore document
        const requestsCollection = db.collection("requests");

        // Create a new document in Firestore and get its ID
        const docRef = await requestsCollection.add({
            dni: card.dni,
            name: card.name,
            numCardOperation: card.numCardOperation,
            request: requestText,
            timestamp: Date.now(),
            status : "send",
            idUserAssociation: card.idUserAssociation,
            numResolution: card.numResolution
        });

        // Update the document with its generated ID
        await db.collection("requests").doc(docRef.id).update({
            id: docRef.id
        });


        await db.collection("cards").doc(card.id).update({
            status: "request"
        });

        Swal.fire({
            title: "¡Éxito!",
            text: `La solicitud ha sido enviada correctamente.`,
            icon: "success"
        });

        // Close modal and reset form
        loader.style.display = "none";
        btnSendRequest.disabled = false;

        $('#revokeModal').modal('hide');
        document.getElementById("txtRequest").value = "";
    } catch (error) {
        Swal.fire({
            title: "Error",
            text: "Ocurrió un error al enviar la solicitud. Por favor, inténtelo de nuevo.",
            icon: "error"
        });
    }
}