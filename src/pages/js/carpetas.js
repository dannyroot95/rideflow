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
            const details = `<center><button class="btn btn-light" style="background-color:#1a99005d;color:white;" data-user='${JSON.stringify(fileData)}' onclick="showDetails(this)">Ver</button></center>`;

            // Añade filas a la tabla basado en los datos del archivo
            tableContent += `
            <tr>
            <td>${details}</td>
            <td>${fileData.name}</td>
            <td>${fileData.dni}</td>
            <td>${fileData.phone}</td>
            <td>${fileData.status}</td>
            </tr>`;
        });

        tableContent += '</tbody></table>';

        let content = `
        <div class="accordion accordion-flush">  
            <div class="accordion-item">
                <h2 class="accordion-header" id="heading${doc.id}">
                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${doc.id}" aria-expanded="false" aria-controls="collapse${doc.id}">
                        Código de carpeta: ${folderData.codeFolder}
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
    // Aquí puedes manejar la visualización de los detalles del usuario
    console.log(fileData);
}

