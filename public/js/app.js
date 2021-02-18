const cerrarRespuesta = () => {
    const respuesta = document.querySelector('.respuesta');
    respuesta.remove();
};

const imprimirRespuesta = () => {
    window.print();
};

const imprimirPDF = (e) => {
    e.target.setAttribute('disabled', 'true');
    document.querySelector('#sk-circle-pdf').classList.remove('oculto');
    document.querySelector('#texto-spinner-pdf').classList.remove('oculto');
    const hashDocOriginal = document.querySelector('#hash-documento').textContent;
    const parrafoDocumento = document.querySelector('#parrafo-info');
    const imagenQR = document.querySelector('#imagen-qr');
    parrafoDocumento.style.setProperty('margin-bottom', '0px');
    imagenQR.style.setProperty('width', '80px');
    const informacion = document.querySelector('#respuesta-info').cloneNode(true);
    parrafoDocumento.style.setProperty('margin-bottom', '1 rem');
    imagenQR.style.setProperty('width', '100px');
    let contenido = document.createElement('div');
    contenido.style.setProperty('padding', '40px');
    contenido.style.setProperty('font-size', '11px');
    contenido.style.setProperty('text-align', 'justify');
    contenido.style.setProperty('margin-top', '812px');
    contenido.appendChild(informacion);
    fetch('/generar-pdf', {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contenido: contenido.outerHTML, hashDocOriginal: hashDocOriginal + '.pdf' })
        })
        .then(respuesta => respuesta.json())
        .then(resultado => {
            window.open(resultado.url, 'Download');
            e.target.removeAttribute('disabled');
            document.querySelector('#sk-circle-pdf').classList.add('oculto');
            document.querySelector('#texto-spinner-pdf ').classList.add('oculto');
        })
        .catch(error => console.log(error))
};

const validarDatosVacios = (e) => {
    const id = document.querySelector('#id').value;
    const password = document.querySelector('#password').value;
    if (id === '' || password === '') {
        e.preventDefault();
        Swal.fire({
            icon: 'warning',
            title: 'Atencion!',
            text: 'Ambos campos son obligatorios',
        })
        return;
    }
}

/****************************************************************** */

// Cerrar respuesta
if (document.querySelector('#btnCerrarRespuesta')) {
    document.querySelector('#btnCerrarRespuesta').addEventListener('click', cerrarRespuesta);
    if (document.querySelector('.sk-circle ')) {
        document.querySelector('.sk-circle ').classList.add('oculto');
    }
}
// Imprimir respuesta
if (document.querySelector('#btnImprimirRespuesta')) {
    document.querySelector('#btnImprimirRespuesta').addEventListener('click', imprimirRespuesta);
}

// Mostrar Spinner
if (document.querySelector('.dropFileForm')) {
    document.querySelector('.dropFileForm').addEventListener('submit', () => {
        document.querySelector('.sk-circle ').classList.remove('oculto');
    });
}




// Verifica que el input no esta vacio
const verificarInputVacio = (e) => {
    var fileInput = document.querySelector('input[type="file"]');
    var file = fileInput.files.item(0);
    if (file === null) {
        e.preventDefault();
        Swal.fire({
            icon: 'warning',
            title: 'Atencion!',
            text: 'Seleccione o arrastre un documento para registrar',
        })
        document.querySelector('.sk-circle ').classList.add('oculto');
        return;
    } else {
        document.querySelector('#sendHashButton').setAttribute('disabled', true);
        if (document.querySelector('.respuesta')) {
            document.querySelector('.respuesta').remove();
        }
    }
}


// Limpiar alertas
const limpiarAlertas = () => {
    const alertas = document.querySelector('.alertas');
    const interval = setInterval(() => {
        if (alertas.children.length > 0) {
            alertas.removeChild(alertas.children[0])
        } else if (alertas.children.length === 0) {
            clearInterval(interval);
            alertas.remove();
        }
    }, 5000);
};


if (document.querySelector('#btnPDF')) {
    document.querySelector('#btnPDF').addEventListener('click', imprimirPDF);
}

document.addEventListener('DOMContentLoaded', () => {
    const alertas = document.querySelector('.alertas');
    const registrarForm = document.querySelector(".dropFileForm");
    const logueoForm = document.querySelector('#subscribeForm');

    // Si existen alertas las limpio
    if (alertas) {
        limpiarAlertas();
    }

    // Verifico si el input file esta vacio
    if (registrarForm) {
        registrarForm.addEventListener('submit', verificarInputVacio);
    }

    if (logueoForm) {
        logueoForm.addEventListener('submit', validarDatosVacios);
    }

    if (document.querySelector('.respuesta') && document.querySelector('#sendHashButton')) {
        document.querySelector('#sendHashButton').removeAttribute('disabled');
    }
});