// Variables y constantes
const contentModulo = document.querySelector(".app-content-actions");
const sidebarList = document.getElementById('sidebarList');
const sidebarItems = document.querySelectorAll('.sidebar-list-item');

const uploadSignatureButton = document.getElementById("upload-signature");
const uploadImage = document.getElementById("upload-image");

var canvas = document.getElementById('signature-pad');
var signaturePad = new SignaturePad(canvas);
var storage = firebase.storage();
let isImageUploaded = false;

// Función principal que se ejecuta al cargar el documento
$(document).ready(function () {
    if(user.typeUser == "superAdmin" || user.typeUser == "admin"){
        gotoPage("inicio","Inicio","inicio"); 
    }else if(user.typeUser == "association"){
        gotoPage("inicio-asoc","Inicio","inicio-asoc");
    }else if(user.typeUser == "operator"){
        gotoPage("inicio-asoc","Inicio","inicio-asoc");
    }else if(user.typeUser == "window"){
        gotoPage("inicio-asoc","Inicio","inicio-asoc");
    }
    window.addEventListener('hashchange', handleHashChange);  // Detectar cambios en el hash
    sidebarList.addEventListener('click', handleSidebarClick);  // Manejar clics en la barra lateral
    insertData(user);  // Insertar los datos del usuario en la UI
});

// Función para manejar el cambio de hash en la URL
function handleHashChange() {
    const direccion = window.location.hash;

    switch (direccion) {
        case '#inicio':
            gotoPage("inicio","Inicio","inicio");
            break;
        case '#inicio-asoc':
            gotoPage("inicio-asoc","Inicio","inicio-asoc");
            break;
        case '#configuracion':
            gotoPage("configuracion","Configuración","configuracion");
            break;    
        case '#usuarios':
            gotoPage("usuarios","Usuarios","usuarios");
            break;
        case '#asociaciones':
            gotoPage("asociaciones","Asociaciones","asociaciones");
            break;    
        case '#expedientes':
            gotoPage("expedientes","Expedientes","expedientes");
            break;
        case '#expedientes-op':
            gotoPage("expedientes-op","Mis expedientes","expedientes-op");
            break;        
        case '#expedientes-aprobados':
            gotoPage("expedientes-aprobados","Expedientes aprobados","expedientes-aprobados");
                break;         
        case '#carpetas':
            gotoPage("carpetas","Carpetas","carpetas");
            break;   
        case '#carpetas-op':
            gotoPage("carpetas-op","Mis carpetas","carpetas-op");
            break;    
        case '#tarjetas-de-operacion-v':
            gotoPage("tarjetas-de-operacion-v","Tarjetas de operación","tarjetas-de-operacion-v");
            break;  
        case '#bajasAdmin':
            gotoPage("bajasAdmin","Solicitud de bajas de tarjeta de operación","bajasAdmin");
            break; 
        case '#bajasAsoc':
            gotoPage("bajasAsoc","Solicitud de bajas de tarjeta de operación","bajasAsoc");
            break;     
        case '#incidentes':
            gotoPage("incidentes","Incidentes","incidentes");
            break;       
        case '#logs':
            gotoPage("logs","Logs de eventos","logs");
            break;           
                      
        default:
            routeErrE();
            break;
    }
}


function gotoPage(location,title,content){
    window.location.hash = `#${location}`;
    
    if(location == "configuracion"){
        $('#configModalDetail').modal('show')
    }else{
        actualizarTitulo(title);
        cargarContenido(`/src/pages/${content}.html`);
    }
    
}

// Función para manejar rutas no válidas
function routeErrE() {
    console.error("Ruta no encontrada");
    contentModulo.innerHTML = "No existe la ruta";
}

// Función genérica para cargar contenido dentro de un iframe
function cargarContenido(url) {
    contentModulo.innerHTML = '';  // Limpiar contenido anterior
    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    contentModulo.appendChild(iframe);
}

// Función para actualizar el título de la página
function actualizarTitulo(titulo) {
    document.getElementById("titlePage").innerHTML = titulo;
}

// Función para verificar el tamaño de la ventana y ajustar la UI
function checkWindowSize() {
    const isSmallWindow = window.innerWidth < 1025;
    document.body.style.pointerEvents = isSmallWindow ? 'none' : 'auto';

    if (isSmallWindow) {
        alert('El tamaño de la ventana es menor a 1025px. Por favor, agranda la ventana.');
    }
}

// Función para manejar el cierre de sesión
function logout() {
    localStorage.removeItem("userData");
    window.location.href = `http://${window.location.host}`;
}

// Función para insertar los datos del usuario en la interfaz
function insertData(user) {
    if (!user || !user.name) {
        console.error("No se pudo obtener la información del usuario");
        return;
    }

    const [nombre, apellido] = user.name.split(" ");
    document.getElementById("nameUser").innerHTML = apellido 
        ? `${nombre} ${apellido.charAt(0)}.` 
        : `${nombre}.`;

    // Mostrar el tipo de usuario
    const userTypeElement = document.getElementById("type-user");
    userTypeElement.innerHTML = user.typeUser === "superAdmin" 
        ? "Super Administrador" 
        : user.typeUser === "admin" 
        ? "Administrador" 
        : user.typeUser === "association"
        ? "Asociación"
        : user.typeUser === "operator"
        ? "Operador"
        : user.typeUser === "window"
        ? "Ventanilla"
        : "Sin datos";

}

// Función para manejar los clics en los elementos de la barra lateral
function handleSidebarClick(event) {
    event.preventDefault();  // Prevenir la acción predeterminada de los enlaces

    const target = event.target.closest('a');  // Encuentra el enlace más cercano
    if (target) {
        const targetHash = target.getAttribute('href');  // Obtén el href del enlace
        window.location.hash = targetHash;  // Cambia el hash de la URL
        updateActiveClass(target.parentElement);  // Actualiza la clase 'active' del elemento seleccionado
    }
}

// Función para actualizar la clase 'active' en los ítems de la barra lateral
function updateActiveClass(activeItem) {
    sidebarItems.forEach(item => item.classList.remove('active'));  // Quitar la clase 'active' de todos los elementos
    activeItem.classList.add('active');  // Agregar la clase 'active' al elemento seleccionado
}

// Eventos globales
window.addEventListener('resize', checkWindowSize);  // Detectar cambios en el tamaño de la ventana
checkWindowSize();  // Verificar el tamaño de la ventana al cargar la página

//-----------------------------------------------------------------------------------------------------------------------------------------------

document.getElementById('clear').addEventListener('click', function() {
    signaturePad.clear();
    isImageUploaded = false;
    uploadImage.value = ""
});

document.getElementById("loader2").style.display = "block"
document.getElementById("clear").disabled = true
document.getElementById("save").disabled = true
document.getElementById("upload-signature").disabled = true

db.collection("config").doc("data").get().then((snap)  => {
    
    document.getElementById("dni").value = snap.data().dni
    document.getElementById("name").value = snap.data().fullnameIngCharge

    var canvas2 = document.getElementById('signature-pad');

    const ctx = canvas2.getContext('2d');
    const img = new Image();
    img.crossOrigin = "anonymous";

        // Establece la fuente de la imagen (URL de la imagen en internet)
        img.src = snap.data().signatureUrl; // Reemplaza con la URL de la imagen que quieras

        // Una vez que la imagen esté cargada, se dibuja en el canvas
        img.onload = function() {
            // Dibuja la imagen en el canvas, posición (x, y) y tamaño opcional (ancho, alto)
            ctx.drawImage(img, 0, 0, canvas2.width, canvas.height);
            document.getElementById("loader2").style.display = "none"
            document.getElementById("clear").disabled = false
            document.getElementById("save").disabled = false
            document.getElementById("upload-signature").disabled = false
        };

    

})


document.getElementById('save').addEventListener('click', function() {
    if (!validateInputs()) return;

    toggleUI(true); // Desactiva botones y muestra loader

    const dataURL = signaturePad.toDataURL();
    const blob = dataURLToBlob(dataURL);
    const storageRef = storage.ref();
    const signatureRef = storageRef.child('signatures/' + new Date().getTime() + '.png');

    const dni = document.getElementById("dni").value;
    const fullnameIngCharge = document.getElementById("name").value;

    signatureRef.put(blob)
        .then(snapshot => signatureRef.getDownloadURL())
        .then(url => {
            return db.collection("config").doc("data").update({
                timestamp: Date.now(),
                dni: dni,
                fullnameIngCharge: fullnameIngCharge,
                signatureUrl: url
            });
        })
        .then(() => {
            Swal.fire({
                title: "Muy bien!",
                text: "Configuración guardada.",
                icon: "success"
            });
            toggleUI(false); // Reactiva botones y oculta loader
        })
        .catch(error => {
            console.error("Error al guardar en Firestore: ", error);
            toggleUI(false); // Reactiva botones y oculta loader
        });
});

// Función para validar inputs
function validateInputs() {
    // Verificar si ambos están vacíos
    if (signaturePad.isEmpty() && !isImageUploaded) {
        Swal.fire({
            title: "Oops!",
            text: "Por favor, proporciona una firma o carga una imagen.",
            icon: "warning"
        });
        return false;
    }

    // Si al menos uno no está vacío, la validación pasa
    return true;
}

// Función para alternar la interfaz
function toggleUI(isLoading) {
    document.getElementById("loader2").style.display = isLoading ? "block" : "none";
    document.getElementById("clear").disabled = isLoading;
    document.getElementById("save").disabled = isLoading;
    document.getElementById("upload-signature").disabled = isLoading;
}



function dataURLToBlob(dataURL) {
    var parts = dataURL.split(';base64,');
    var contentType = parts[0].split(':')[1];
    var raw = window.atob(parts[1]);
    var rawLength = raw.length;
    var uInt8Array = new Uint8Array(rawLength);

    for (var i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
    }

    return new Blob([uInt8Array], {type: contentType});
}



// Función para cargar y mostrar la imagen en el canvas
function uploadAndDisplayImage() {

const canvas = document.getElementById("signature-pad");
const ctx = canvas.getContext("2d");

  const file = uploadImage.files[0];
  if (file) {
    const reader = new FileReader();
    
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        // Calcular el tamaño de la imagen para ajustarse al canvas
        const canvasRatio = canvas.width / canvas.height;
        const imgRatio = img.width / img.height;
        
        let drawWidth, drawHeight;
        
        if (imgRatio > canvasRatio) {
          drawWidth = canvas.width;
          drawHeight = canvas.width / imgRatio;
        } else {
          drawHeight = canvas.height;
          drawWidth = canvas.height * imgRatio;
        }
        
        // Limpiar el canvas antes de dibujar
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Dibujar la imagen centrada en el canvas
        ctx.drawImage(
          img,
          (canvas.width - drawWidth) / 2,
          (canvas.height - drawHeight) / 2,
          drawWidth,
          drawHeight
        );
      };
      img.src = e.target.result;
      isImageUploaded = true;
    };

    reader.readAsDataURL(file);
  }
}

// Activar el input de tipo file al hacer clic en el botón personalizado
uploadSignatureButton.addEventListener("click", () => {
  uploadImage.click();
});

// Llamar a la función cuando se selecciona un archivo
uploadImage.addEventListener("change", uploadAndDisplayImage);

document.getElementById('configModalDetail').addEventListener('hidden.bs.modal', event => {
    if(user.typeUser == "superAdmin"){
        gotoPage("inicio","Inicio","inicio"); 
    }else if(user.typeUser == "association"){
        gotoPage("inicio-asoc","Inicio","inicio-asoc");
    }else if(user.typeUser == "operator"){
        gotoPage("inicio-asoc","Inicio","inicio-asoc");
    }else if(user.typeUser == "window"){
        gotoPage("inicio-asoc","Inicio","inicio-asoc");
    }
})