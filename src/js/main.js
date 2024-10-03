// Variables y constantes
const contentModulo = document.querySelector(".app-content-actions");
const sidebarList = document.getElementById('sidebarList');
const sidebarItems = document.querySelectorAll('.sidebar-list-item');

// Función principal que se ejecuta al cargar el documento
$(document).ready(function () {
    if(user.typeUser == "superAdmin"){
        gotoPage("inicio","Inicio","inicio"); 
    }else if(user.typeUser == "association"){
        gotoPage("inicio-asoc","Inicio","inicio-asoc");
    }else if(user.typeUser == "operator"){
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
        case '#usuarios':
            gotoPage("usuarios","Usuarios","usuarios");
            break;
        case '#asociaciones':
            gotoPage("asociaciones","Asociaciones","asociaciones");
            break;    
        case '#expedientes':
            gotoPage("expedientes","Expedientes","expedientes");
            break;      
        case '#carpetas':
            gotoPage("carpetas","Carpetas","carpetas");
            break;   
        case '#carpetas-op':
            gotoPage("carpetas-op","Carpetas","carpetas-op");
            break;                     
        default:
            routeErrE();
            break;
    }
}


function gotoPage(location,title,content){
    window.location.hash = `#${location}`;
    actualizarTitulo(title);
    cargarContenido(`/src/pages/${content}.html`);
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
